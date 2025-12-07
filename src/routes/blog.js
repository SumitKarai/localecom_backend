const express = require('express');
const passport = require('../config/passport');
const BlogPost = require('../models/BlogPost');
const router = express.Router();

// Middleware to check if user is a writer or admin
router.get('/test', (req, res) => res.json({ message: 'Blog route works' }));

const isWriter = (req, res, next) => {
  if (req.user && (req.user.role === 'writer' || req.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Writer role required.' });
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Admin role required.' });
};

// Get all categories with post counts
router.get('/categories', async (req, res) => {
  try {
    const categories = await BlogPost.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const allCategories = [
      { id: 'news', label: 'समाचार' },
      { id: 'science', label: 'विज्ञान' },
      { id: 'health', label: 'स्वास्थ्य' },
      { id: 'technology', label: 'तकनीक' },
      { id: 'entertainment', label: 'मनोरंजन' },
      { id: 'education', label: 'शिक्षा' },
      { id: 'business', label: 'व्यापार' },
      { id: 'lifestyle', label: 'जीवनशैली' },
      { id: 'sports', label: 'खेल' },
      { id: 'agriculture', label: 'कृषि' },
      { id: 'politics', label: 'राजनीति' },
      { id: 'food', label: 'खाना खजाना' },
      { id: 'travel', label: 'यात्रा' },
      { id: 'auto', label: 'ऑटो' },
      { id: 'jobs', label: 'नौकरी' },
      { id: 'general', label: 'सामान्य' }
    ];
    
    const result = allCategories.map(cat => ({
      id: cat.id,
      name: cat.label,
      count: categories.find(c => c._id === cat.id)?.count || 0
    }));
    
    res.json({ categories: result });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get published blog posts (public)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, tag, search, featured } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = { status: 'published' };
    
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (featured === 'true') query.isFeatured = true;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .populate('author', 'profile.name profile.avatar')
        .select('-content')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      BlogPost.countDocuments(query)
    ]);
    
    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

// Get writer's own posts
router.get('/my-posts',
  passport.authenticate('jwt', { session: false }),
  isWriter,
  async (req, res) => {
    try {
      const { status } = req.query;
      const query = { author: req.user._id };
      if (status) query.status = status;
      
      const posts = await BlogPost.find(query)
        .sort({ createdAt: -1 })
        .select('-content');
      
      res.json({ posts });
    } catch (error) {
      console.error('Error fetching user posts:', error);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  }
);

// Get posts by author (public)
router.get('/author/:authorId', async (req, res) => {
  try {
    const { authorId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = { 
      author: authorId,
      status: 'published' 
    };
    
    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .populate('author', 'profile.name profile.avatar profile.bio')
        .select('-content')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      BlogPost.countDocuments(query)
    ]);
    
    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching author posts:', error);
    res.status(500).json({ error: 'Failed to fetch author posts' });
  }
});


// Get single blog post by slug (public, with preview support)
router.get('/:slug', 
  (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user) => {
      req.user = user;
      next();
    })(req, res, next);
  },
  async (req, res) => {
    try {
      const { slug } = req.params;
      const { preview } = req.query;
      
      let query = { slug };
      
      // If not previewing or not authorized, only show published
      if (!preview || !req.user) {
        query.status = 'published';
      } else {
        // If previewing and authorized, check roles
        if (req.user.role !== 'admin') {
          // If not admin, must be author and post must be theirs
          query = { 
            slug, 
            $or: [
              { status: 'published' },
              { author: req.user._id }
            ]
          };
        }
        // Admin can see any status
      }
      
      const post = await BlogPost.findOne(query)
        .populate('author', 'profile.name profile.avatar');
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      // Increment views only if published - MOVED TO SEPARATE ENDPOINT
      // if (post.status === 'published') {
      //   post.views += 1;
      //   await post.save();
      // }
      
      // Get related posts
      const relatedPosts = await BlogPost.find({
        _id: { $ne: post._id },
        status: 'published',
        category: post.category
      })
        .select('title slug excerpt featuredImage publishedAt')
        .limit(3)
        .sort({ publishedAt: -1 });
      
      res.json({ post, relatedPosts });
    } catch (error) {
      console.error('Error fetching blog post:', error);
      res.status(500).json({ error: 'Failed to fetch blog post' });
    }
  }
);

// Increment view count
router.post('/:slug/view', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const post = await BlogPost.findOne({ slug, status: 'published' });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    post.views += 1;
    await post.save();
    
    res.json({ views: post.views });
  } catch (error) {
    console.error('Error incrementing views:', error);
    res.status(500).json({ error: 'Failed to increment views' });
  }
});

// Create new blog post (writer)
router.post('/',
  passport.authenticate('jwt', { session: false }),
  isWriter,
  async (req, res) => {
    try {
      const { title, content, excerpt, featuredImage, category, tags, metaTitle, metaDescription, status } = req.body;
      
      // Generate unique slug
      let baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\u0900-\u097F\s-]/g, '') // Allow English + Hindi + Numbers + Space + Hyphen
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      let slug = baseSlug;
      let counter = 1;
      while (await BlogPost.findOne({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      const post = new BlogPost({
        title,
        slug,
        content,
        excerpt,
        featuredImage,
        category: category || 'general',
        tags: tags || [],
        author: req.user._id,
        status: status === 'draft' ? 'draft' : 'published', // Allow drafts, otherwise direct publish
        metaTitle,
        metaDescription,
        publishedAt: status !== 'draft' ? new Date() : undefined
      });
      
      await post.save();
      res.status(201).json({ message: 'Post created successfully', post });
    } catch (error) {
      console.error('Error creating blog post:', error);
      res.status(500).json({ error: 'Failed to create blog post' });
    }
  }
);

// Update blog post (writer - own posts only)
router.put('/:id',
  passport.authenticate('jwt', { session: false }),
  isWriter,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content, excerpt, featuredImage, category, tags, metaTitle, metaDescription, status } = req.body;
      
      const post = await BlogPost.findById(id);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      // Check ownership (admin can edit any)
      if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to edit this post' });
      }
      
      // Update fields
      if (title) post.title = title;
      if (content) post.content = content;
      if (excerpt) post.excerpt = excerpt;
      if (featuredImage !== undefined) post.featuredImage = featuredImage;
      if (category) post.category = category;
      if (tags) post.tags = tags;
      if (metaTitle !== undefined) post.metaTitle = metaTitle;
      if (metaDescription !== undefined) post.metaDescription = metaDescription;
      
      // Writers can set draft or published
      if (status && (status === 'draft' || status === 'published')) {
        post.status = status;
        if (status === 'published' && !post.publishedAt) {
          post.publishedAt = new Date();
        }
      }
      
      await post.save();
      res.json({ message: 'Post updated successfully', post });
    } catch (error) {
      console.error('Error updating blog post:', error);
      res.status(500).json({ error: 'Failed to update blog post' });
    }
  }
);

// Delete blog post (writer - own posts, or admin)
router.delete('/:id',
  passport.authenticate('jwt', { session: false }),
  isWriter,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const post = await BlogPost.findById(id);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      // Check ownership (admin can delete any)
      if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to delete this post' });
      }
      
      await BlogPost.findByIdAndDelete(id);
      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Error deleting blog post:', error);
      res.status(500).json({ error: 'Failed to delete blog post' });
    }
  }
);

// Admin: Get all posts
router.get('/admin/posts',
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const posts = await BlogPost.find({})
        .populate('author', 'profile.name profile.avatar email')
        .sort({ createdAt: -1 });
      
      res.json({ posts });
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  }
);

// Admin: Approve post
router.put('/admin/:id/approve',
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const post = await BlogPost.findByIdAndUpdate(
        id,
        { 
          status: 'published',
          publishedAt: new Date()
        },
        { new: true }
      );
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      res.json({ message: 'Post approved and published', post });
    } catch (error) {
      console.error('Error approving post:', error);
      res.status(500).json({ error: 'Failed to approve post' });
    }
  }
);

// Admin: Reject post
router.put('/admin/:id/reject',
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const post = await BlogPost.findByIdAndUpdate(
        id,
        { 
          status: 'rejected',
          rejectionReason: reason || 'Post does not meet our guidelines'
        },
        { new: true }
      );
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      res.json({ message: 'Post rejected', post });
    } catch (error) {
      console.error('Error rejecting post:', error);
      res.status(500).json({ error: 'Failed to reject post' });
    }
  }
);

// Become a writer (upgrade role)
router.post('/become-writer',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      // Only customers can become writers
      if (req.user.role !== 'customer') {
        return res.status(400).json({ error: 'Only customers can become writers. You already have a business role.' });
      }
      
      req.user.role = 'writer';
      await req.user.save();
      
      res.json({ message: 'You are now a writer!', user: { role: req.user.role } });
    } catch (error) {
      console.error('Error upgrading to writer:', error);
      res.status(500).json({ error: 'Failed to upgrade to writer' });
    }
  }
);

module.exports = router;
