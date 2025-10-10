const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comment: {
    type: String,
    maxLength: 500,
    trim: true
  },
  helpfulVotes: {
    type: Number,
    default: 0
  },
  helpfulVotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isVerifiedPurchase: {
    type: Boolean,
    default: true
  },
  reviewType: {
    type: String,
    enum: ['store', 'product'],
    required: true
  }
}, {
  timestamps: true
});

// Indexes
reviewSchema.index({ storeId: 1, createdAt: -1 });
reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, orderId: 1 }, { unique: true });
reviewSchema.index({ rating: 1 });

module.exports = mongoose.model('Review', reviewSchema);