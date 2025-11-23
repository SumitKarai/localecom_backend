const mongoose = require('mongoose');

const masterProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductCategory',
    required: true,
  },
  images: [String],
  tags: [String],
  
  // Aggregate rating from all reviews
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  
  // Brand information (optional)
  brand: String,
  manufacturer: String,
  
  // Product specifications (optional)
  specifications: {
    weight: String,
    dimensions: String,
    unit: String,
    packSize: String,
  },
  
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Indexes for efficient search
masterProductSchema.index({ name: 'text', description: 'text', tags: 'text', brand: 'text' });
masterProductSchema.index({ categoryId: 1 });
masterProductSchema.index({ isActive: 1 });
masterProductSchema.index({ rating: -1 });
masterProductSchema.index({ name: 1 }, { unique: true }); // Ensure unique product names

module.exports = mongoose.model('MasterProduct', masterProductSchema);
