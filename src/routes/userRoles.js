const express = require('express');
const passport = require('../config/passport');
const User = require('../models/User');
const Seller = require('../models/Seller');
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
      const seller = await Seller.findOne({ ownerId: req.user._id });
      const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
      const freelancer = await Freelancer.findOne({ userId: req.user._id });
      
      res.json({
        user: {
          role: user.role,
          profile: user.profile
        },
        businesses: {
          hasSeller: !!seller,
          hasRestaurant: !!restaurant,
          hasFreelancer: !!freelancer,
          seller,
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

// Update user role
router.put('/role',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { role } = req.body;
      
      if (!['customer', 'seller', 'freelancer', 'restaurant'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { role },
        { new: true, runValidators: true }
      );
      
      res.json({ 
        message: `Role updated to ${role}`, 
        user: updatedUser 
      });
    } catch (error) {
      console.error('❌ Error updating user role:', error);
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
          const existingSeller = await Seller.findOne({ ownerId: req.user._id });
          canBecome = !existingSeller;
          reason = existingSeller ? 'User already has a store' : '';
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
      await Seller.deleteMany({ ownerId: req.user._id });
      await Restaurant.deleteMany({ ownerId: req.user._id });
      await Freelancer.deleteMany({ userId: req.user._id });
      
      // Delete related data
      const Product = require('../models/Product');
      const MenuItem = require('../models/MenuItem');
      
      await Product.deleteMany({ sellerId: { $exists: true } }); // Will need to be more specific
      await MenuItem.deleteMany({ restaurantId: { $exists: true } }); // Will need to be more specific
      
      res.json({ message: 'User reset successfully for testing' });
    } catch (error) {
      console.error('❌ Error resetting user:', error);
      res.status(500).json({ error: 'Failed to reset user' });
    }
  }
);

module.exports = router;