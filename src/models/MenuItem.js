const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    required: true,
    enum: ['Appetizers', 'Main Course', 'Desserts', 'Beverages', 'Snacks', 'Breakfast', 'Lunch', 'Dinner', 'Specials']
  },
  price: {
    type: Number,
    required: true
  },
  discountPrice: Number,
  images: [String],
  
  // Restaurant-specific fields
  dietary: {
    vegetarian: {
      type: Boolean,
      default: false
    },
    vegan: {
      type: Boolean,
      default: false
    },
    glutenFree: {
      type: Boolean,
      default: false
    },
    spiceLevel: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    }
  },
  
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    availableFrom: String, // "09:00"
    availableTo: String,   // "22:00"
    daysAvailable: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  },
  
  preparationTime: {
    type: Number,
    default: 15 // in minutes
  },
  
  tags: [{
    type: String,
    enum: ['popular', 'chef-special', 'new', 'bestseller', 'spicy', 'mild', 'healthy']
  }],
  
  rating: {
    type: Number,
    default: 0
  },
  totalReviews: {
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

// Indexes
menuItemSchema.index({ restaurantId: 1 });
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ isActive: 1 });
menuItemSchema.index({ 'availability.isAvailable': 1 });
menuItemSchema.index({ 'dietary.vegetarian': 1 });
menuItemSchema.index({ 'dietary.vegan': 1 });
menuItemSchema.index({ tags: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);