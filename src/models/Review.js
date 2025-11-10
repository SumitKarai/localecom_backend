const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Universal reference system
  targetType: {
    type: String,
    required: true,
    enum: ['Restaurant', 'Store', 'Product', 'Freelancer']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType'
  },
  
  // Customer information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: false
  },
  customerEmail: {
    type: String
  },
  
  // Review content
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500
  },
  
  // Additional context
  orderContext: {
    orderId: String,
    orderValue: Number,
    deliveryExperience: Number // 1-5 rating for delivery
  },
  
  // Verification and moderation
  isVerified: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  
  // Helpful votes
  helpfulVotes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
reviewSchema.index({ targetType: 1, targetId: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ customerPhone: 1 });
reviewSchema.index({ isApproved: 1 });
reviewSchema.index({ userId: 1, targetType: 1, targetId: 1 });

module.exports = mongoose.model('Review', reviewSchema);