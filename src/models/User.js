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
    unique: true,
    lowercase: true
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
    enum: ['customer', 'seller', 'freelancer', 'restaurant', 'writer', 'admin'],
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
    hasUsedTrial: {
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
        // Automatically give 90-day free trial to new users
        const now = new Date();
        return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      }
    }
  }
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
userSchema.index({ 'profile.location': '2dsphere' });

module.exports = mongoose.model('User', userSchema);