const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  masterProductId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MasterProduct',
    required: true,
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
  },
  // Store-specific pricing
  price: {
    type: Number,
    required: true,
  },
  discountPrice: Number,
  
  // Store-specific availability
  availability: {
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Indexes for efficient queries
productSchema.index({ masterProductId: 1 });
productSchema.index({ storeId: 1 });
productSchema.index({ 'availability.isAvailable': 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ storeId: 1, masterProductId: 1 }, { unique: true }); // One product per store

module.exports = mongoose.model('Product', productSchema);

