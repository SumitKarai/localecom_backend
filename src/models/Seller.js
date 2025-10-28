const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  storeName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Grocery & Food', 'Electronics', 'Clothing & Fashion', 'Pharmacy & Health', 'Books & Stationery', 'Home & Garden', 'Sports & Fitness', 'Beauty & Personal Care', 'Toys & Games', 'Automotive', 'Jewelry & Accessories', 'Pet Supplies', 'Hardware & Tools', 'Bakery & Sweets', 'Flowers & Gifts', 'Other']
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
  
  // Store-specific fields
  storeType: {
    type: String,
    enum: ['Physical Store', 'Online Store', 'Both'],
    default: 'Physical Store'
  },
  businessLicense: String,
  gstNumber: String,
  
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
  
  // Store information
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
  gallery: [String],
  features: [String],
  
  deliveryRadius: {
    type: Number,
    default: 5
  },
  deliveryOptions: [{
    type: String,
    enum: ['Home Delivery', 'Store Pickup', 'Express Delivery']
  }],
  paymentMethods: [{
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'Net Banking', 'Wallet']
  }],
  
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
sellerSchema.index({ location: '2dsphere' });
sellerSchema.index({ category: 1 });
sellerSchema.index({ isActive: 1 });
sellerSchema.index({ ownerId: 1 });
sellerSchema.index({ city: 1, state: 1 });

module.exports = mongoose.model('Seller', sellerSchema);