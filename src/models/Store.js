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
