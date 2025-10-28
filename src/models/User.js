const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['customer', 'seller', 'freelancer', 'restaurant'],
    default: 'customer'
  },
  profile: {
    name: {
      type: String,
      required: true
    },
    avatar: String,
    phone: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    },
    address: String,
    city: String,
    state: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
userSchema.index({ 'profile.location': '2dsphere' });

module.exports = mongoose.model('User', userSchema);