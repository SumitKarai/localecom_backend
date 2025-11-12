const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: false
  },
  hasPassword: {
    type: Boolean,
    default: false
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
  },
  subscription: {
    isSubscribed: {
      type: Boolean,
      default: false
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription'
    },
    expiresAt: Date,
    trialEndsAt: {
      type: Date,
      default: function() {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days trial
      }
    }
  }
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
userSchema.index({ 'profile.location': '2dsphere' });

module.exports = mongoose.model('User', userSchema);