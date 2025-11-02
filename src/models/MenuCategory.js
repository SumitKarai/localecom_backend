const mongoose = require('mongoose');

const menuCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
menuCategorySchema.index({ restaurantId: 1, displayOrder: 1 });
menuCategorySchema.index({ restaurantId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('MenuCategory', menuCategorySchema);