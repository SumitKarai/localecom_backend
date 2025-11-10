const express = require('express');
const Review = require('../models/Review');
const Restaurant = require('../models/Restaurant');
const Store = require('../models/Store');
const Product = require('../models/Product');
const User = require('../models/User'); // For Freelancer reviews
const router = express.Router();

// Submit a review
router.post('/', async (req, res) => {
  try {

    const { targetType, targetId, customerName, customerPhone, customerEmail, rating, comment, orderContext, userId } = req.body;

    // Validate target exists
    let targetModel;
    switch (targetType) {
      case 'Restaurant': targetModel = Restaurant; break;
      case 'Store': targetModel = Store; break;
      case 'Product': targetModel = Product; break;
      case 'Freelancer': targetModel = User; break;
      default: return res.status(400).json({ message: 'Invalid target type' });
    }

    const target = await targetModel.findById(targetId);
    if (!target) {
      return res.status(404).json({ message: `${targetType} not found` });
    }



    // Create review
    const review = new Review({
      targetType,
      targetId,
      userId,
      customerName,
      customerPhone,
      customerEmail,
      rating,
      comment,
      orderContext
    });

    await review.save();

    // Update target rating
    await updateTargetRating(targetType, targetId);

    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({ message: 'Error submitting review', error: error.message });
  }
});

// Get reviews for any target
router.get('/:targetType/:targetId', async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const { limit = 20, page = 1 } = req.query;
    
    const reviews = await Review.find({ 
      targetType, 
      targetId, 
      isApproved: true 
    })
    .sort({ rating: -1, createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));
    
    const totalReviews = await Review.countDocuments({ targetType, targetId, isApproved: true });
    
    res.json({ reviews, totalReviews, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
});

// Helper function to update target rating
async function updateTargetRating(targetType, targetId) {
  const reviews = await Review.find({ targetType, targetId, isApproved: true });
  if (reviews.length === 0) return;
  
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  
  let targetModel;
  switch (targetType) {
    case 'Restaurant': targetModel = Restaurant; break;
    case 'Store': targetModel = Store; break;
    case 'Product': targetModel = Product; break;
    case 'Freelancer': targetModel = User; break;
  }
  
  await targetModel.findByIdAndUpdate(targetId, {
    rating: Math.round(avgRating * 10) / 10,
    totalReviews: reviews.length
  });
}

module.exports = router;