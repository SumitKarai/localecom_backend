const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
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
  category: {
    type: String,
    required: true
  },
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
  
  // Store Customization
  theme: {
    type: String,
    enum: ['blue', 'green', 'red', 'purple', 'orange', 'pink', 'black', 'brown'],
    default: 'blue'
  },
  primaryColor: {
    type: String,
    default: '#3B82F6' // blue-600
  },
  secondaryColor: {
    type: String,
    default: '#1F2937' // gray-800
  },
  
  // Enhanced Store Information
  tagline: String,
  aboutUs: String,
  services: [String],
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
  gallery: [String], // Array of image URLs
  features: [String], // Store highlights/features

  deliveryRadius: {
    type: Number,
    default: 5 // in kilometers
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
storeSchema.index({ location: '2dsphere' });
storeSchema.index({ category: 1 });
storeSchema.index({ isActive: 1 });
storeSchema.index({ ownerId: 1 });
storeSchema.index({ city: 1, state: 1 });
storeSchema.index({ state: 1 });
storeSchema.index({ pincode: 1 });

module.exports = mongoose.model('Store', storeSchema);
