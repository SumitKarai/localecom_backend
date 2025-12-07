const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    maxlength: 500
  },
  featuredImage: {
    type: String
  },
  category: {
    type: String,
    required: true,
    enum: [
      'news', 'science', 'health', 'technology', 'entertainment', 
      'education', 'business', 'lifestyle', 'sports', 'agriculture',
      'politics', 'food', 'travel', 'auto', 'jobs', 'general'
    ],
    default: 'general'
  },
  tags: [{
    type: String,
    trim: true
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'published', 'rejected'],
    default: 'draft'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  // SEO fields
  metaTitle: {
    type: String,
    maxlength: 60
  },
  metaDescription: {
    type: String,
    maxlength: 160
  },
  publishedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  }
}, {
  timestamps: true
});

// Generate slug from title before validation
blogPostSchema.pre('validate', function(next) {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

// Auto-generate excerpt from content if not provided
blogPostSchema.pre('save', function(next) {
  if (!this.excerpt && this.content) {
    // Strip HTML tags and get first 200 characters
    const plainText = this.content.replace(/<[^>]+>/g, '');
    this.excerpt = plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '');
  }
  next();
});

// Indexes
blogPostSchema.index({ slug: 1 });
blogPostSchema.index({ status: 1 });
blogPostSchema.index({ category: 1 });
blogPostSchema.index({ author: 1 });
blogPostSchema.index({ publishedAt: -1 });
blogPostSchema.index({ isFeatured: 1, status: 1 });
blogPostSchema.index({ tags: 1 });

module.exports = mongoose.model('BlogPost', blogPostSchema);
