const express = require('express');
const passport = require('../config/passport');
const Review = require('../models/Review');
const Store = require('../models/Store');
const Product = require('../models/Product');
const router = express.Router();

// Get reviews for a store
router.get('/store/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    
    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'highest') sortOption = { rating: -1, createdAt: -1 };
    if (sort === 'lowest') sortOption = { rating: 1, createdAt: -1 };
    if (sort === 'helpful') sortOption = { helpfulVotes: -1, createdAt: -1 };

    const reviews = await Review.find({ storeId, reviewType: 'store' })
      .populate('userId', 'profile.name profile.avatar')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalReviews = await Review.countDocuments({ storeId, reviewType: 'store' });
    
    res.json({
      reviews,
      totalReviews,
      currentPage: page,
      totalPages: Math.ceil(totalReviews / limit)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    
    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'highest') sortOption = { rating: -1, createdAt: -1 };
    if (sort === 'lowest') sortOption = { rating: 1, createdAt: -1 };
    if (sort === 'helpful') sortOption = { helpfulVotes: -1, createdAt: -1 };

    const reviews = await Review.find({ productId, reviewType: 'product' })
      .populate('userId', 'profile.name profile.avatar')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalReviews = await Review.countDocuments({ productId, reviewType: 'product' });
    
    res.json({
      reviews,
      totalReviews,
      currentPage: page,
      totalPages: Math.ceil(totalReviews / limit)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Add review (verified purchase)
router.post('/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { storeId, productId, orderId, rating, comment, reviewType } = req.body;
      
      // Check if user already reviewed this order
      const existingReview = await Review.findOne({ userId: req.user._id, orderId });
      if (existingReview) {
        return res.status(400).json({ error: 'You have already reviewed this order' });
      }

      const review = new Review({
        userId: req.user._id,
        storeId,
        productId,
        orderId,
        rating,
        comment,
        reviewType,
        isVerifiedPurchase: true
      });

      await review.save();
      
      // Update store/product rating
      if (reviewType === 'store' && storeId) {
        await updateStoreRating(storeId);
      } else if (reviewType === 'product' && productId) {
        await updateProductRating(productId);
      }
      
      res.status(201).json({ message: 'Review added successfully', review });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add review' });
    }
  }
);

// Add general review (any authenticated user)
router.post('/general',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { storeId, productId, rating, comment, reviewType } = req.body;
      
      // Check if user already reviewed this store/product generally
      const query = { userId: req.user._id, reviewType, orderId: { $exists: false } };
      if (reviewType === 'store') query.storeId = storeId;
      if (reviewType === 'product') query.productId = productId;
      
      const existingReview = await Review.findOne(query);
      if (existingReview) {
        return res.status(400).json({ error: 'You have already reviewed this ' + reviewType });
      }

      const review = new Review({
        userId: req.user._id,
        storeId,
        productId,
        rating,
        comment,
        reviewType,
        isVerifiedPurchase: false
      });

      await review.save();
      
      // Update store/product rating
      if (reviewType === 'store' && storeId) {
        await updateStoreRating(storeId);
      } else if (reviewType === 'product' && productId) {
        await updateProductRating(productId);
      }
      
      res.status(201).json({ message: 'Review added successfully', review });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add review' });
    }
  }
);

// Mark review as helpful
router.post('/:reviewId/helpful',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { reviewId } = req.params;
      const userId = req.user._id;

      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      const hasVoted = review.helpfulVotedBy.includes(userId);
      
      if (hasVoted) {
        // Remove vote
        review.helpfulVotedBy.pull(userId);
        review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
      } else {
        // Add vote
        review.helpfulVotedBy.push(userId);
        review.helpfulVotes += 1;
      }

      await review.save();
      res.json({ message: 'Vote updated', helpfulVotes: review.helpfulVotes, hasVoted: !hasVoted });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update vote' });
    }
  }
);

// Helper function to update store rating
async function updateStoreRating(storeId) {
  const reviews = await Review.find({ storeId, reviewType: 'store' });
  if (reviews.length > 0) {
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Store.findByIdAndUpdate(storeId, {
      rating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length
    });
  }
}

// Helper function to update product rating
async function updateProductRating(productId) {
  const reviews = await Review.find({ productId, reviewType: 'product' });
  if (reviews.length > 0) {
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length
    });
  }
}

module.exports = router;