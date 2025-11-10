const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  cuisineType: [{
    type: String,
    required: true,
    enum: ['Indian', 'Chinese', 'Italian', 'Continental', 'Mexican', 'Thai', 'Japanese', 'Mediterranean', 'American', 'Fast Food', 'Street Food', 'Vegetarian', 'Vegan', 'Seafood', 'BBQ', 'Desserts', 'Other']
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  pincode: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  whatsapp: {
    type: String,
    required: true
  },
  email: String,
  logo: String,
  banner: String,
  
  // Restaurant-specific fields
  diningOptions: [{
    type: String,
    enum: ['Dine-in', 'Takeaway', 'Delivery', 'Drive-through']
  }],
  priceRange: {
    type: String,
    enum: ['$', '$$', '$$$', '$$$$'],
    default: '$$'
  },
  averageCookingTime: {
    type: Number,
    default: 30 // in minutes
  },
  specialties: [String],
  
  // Theme and customization
  theme: {
    type: String,
    enum: ['blue', 'green', 'red', 'purple', 'orange', 'pink', 'black', 'brown'],
    default: 'blue'
  },
  primaryColor: {
    type: String,
    default: '#3B82F6'
  },
  secondaryColor: {
    type: String,
    default: '#1F2937'
  },
  
  // Restaurant information
  tagline: String,
  aboutUs: String,
  workingHours: {
    monday: { open: String, close: String, closed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
    friday: { open: String, close: String, closed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, closed: { type: Boolean, default: true } }
  },
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String,
    youtube: String
  },
  gallery: [String],
  features: [String],
  
  // QR Menu settings
  qrMenu: {
    enabled: {
      type: Boolean,
      default: true
    },
    qrCode: String,
    menuSlug: {
      type: String,
      unique: true
    }
  },
  
  deliveryRadius: {
    type: Number,
    default: 5
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
restaurantSchema.index({ location: '2dsphere' });
restaurantSchema.index({ cuisineType: 1 });
restaurantSchema.index({ isActive: 1 });
restaurantSchema.index({ ownerId: 1 });
restaurantSchema.index({ city: 1, state: 1 });


module.exports = mongoose.model('Restaurant', restaurantSchema);