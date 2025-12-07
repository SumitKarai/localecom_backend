const express = require('express');
const passport = require('../config/passport');
const User = require('../models/User');
const Store = require('../models/Store');
const Restaurant = require('../models/Restaurant');
const Freelancer = require('../models/Freelancer');
const router = express.Router();

// Get user role and business status
router.get('/status',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      
      // Check if user has business profiles
      const store = await Store.findOne({ ownerId: req.user._id });
      const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
      const freelancer = await Freelancer.findOne({ userId: req.user._id });
      
      res.json({
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          hasPassword: user.hasPassword || false
        },
        businesses: {
          hasSeller: !!store,
          hasRestaurant: !!restaurant,
          hasFreelancer: !!freelancer,
          store,
          restaurant,
          freelancer
        }
      });
    } catch (error) {
      console.error('❌ Error fetching user status:', error);
      res.status(500).json({ error: 'Failed to fetch user status' });
    }
  }
);

// Update user role + START 90-DAY TRIAL ONLY ONCE when becoming a business
router.put('/role',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { role } = req.body;

      // Validate role
      // In production, 'admin' should not be switchable via API, but allowed here for dev/testing
      const validRoles = ['customer', 'seller', 'freelancer', 'restaurant', 'writer', 'admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      const user = await User.findById(req.user._id);

      // Define which roles are "premium" (trigger trial)
      const premiumRoles = ['seller', 'freelancer', 'restaurant'];
      const isSwitchingToPremium = premiumRoles.includes(role);
      const wasCustomer = user.role === 'customer';

      // Only start trial if:
      // 1. Switching FROM customer TO a premium role
      // 2. Trial has never been used before
      if (isSwitchingToPremium && wasCustomer && !user.subscription.hasUsedTrial) {
        user.subscription.hasUsedTrial = true;
        user.subscription.trialEndsAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
        console.log(`90-day trial started for user: ${user.email}`);
      }

      // Update role
      user.role = role;
      await user.save();

      // Calculate trial info for response
      const now = new Date();
      const trialActive = user.subscription.trialEndsAt && user.subscription.trialEndsAt > now;
      const daysRemaining = trialActive
        ? Math.ceil((user.subscription.trialEndsAt - now) / (1000 * 60 * 60 * 24))
        : 0;

      res.json({
        message: `Role updated to ${role}`,
        trialStarted: isSwitchingToPremium && wasCustomer && !user.subscription.hasUsedTrial, // true only the first time
        trialActive,
        trialDaysRemaining: daysRemaining,
        trialEndsAt: user.subscription.trialEndsAt,
        user: {
          id: user._id,
          role: user.role,
          email: user.email,
          profile: user.profile
        }
      });

    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  }
);

// Check if user can become specific business type
router.get('/can-become/:businessType',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { businessType } = req.params;
      let canBecome = false;
      let reason = '';
      
      switch (businessType) {
        case 'seller':
          const existingStore = await Store.findOne({ ownerId: req.user._id });
          canBecome = !existingStore;
          reason = existingStore ? 'User already has a store' : '';
          break;
          
        case 'restaurant':
          const existingRestaurant = await Restaurant.findOne({ ownerId: req.user._id });
          canBecome = !existingRestaurant;
          reason = existingRestaurant ? 'User already has a restaurant' : '';
          break;
          
        case 'freelancer':
          const existingFreelancer = await Freelancer.findOne({ userId: req.user._id });
          canBecome = !existingFreelancer;
          reason = existingFreelancer ? 'User already has a freelancer profile' : '';
          break;
          
        default:
          return res.status(400).json({ error: 'Invalid business type' });
      }
      
      res.json({ canBecome, reason });
    } catch (error) {
      console.error('❌ Error checking business eligibility:', error);
      res.status(500).json({ error: 'Failed to check eligibility' });
    }
  }
);

// TEMPORARY: Reset user for testing (REMOVE IN PRODUCTION)
router.delete('/reset-user',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      // Reset user role to customer
      await User.findByIdAndUpdate(req.user._id, { role: 'customer' });
      
      // Delete all business profiles
      await Store.deleteMany({ ownerId: req.user._id });
      await Restaurant.deleteMany({ ownerId: req.user._id });
      await Freelancer.deleteMany({ userId: req.user._id });
      
      // Delete related data
      const Product = require('../models/Product');
      const MenuItem = require('../models/MenuItem');
      
      await Product.deleteMany({ storeId: { $exists: true } });
      await MenuItem.deleteMany({ restaurantId: { $exists: true } });
      
      res.json({ message: 'User reset successfully for testing' });
    } catch (error) {
      console.error('❌ Error resetting user:', error);
      res.status(500).json({ error: 'Failed to reset user' });
    }
  }
);

module.exports = router;