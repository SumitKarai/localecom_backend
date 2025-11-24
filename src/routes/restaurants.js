const express = require('express');
const passport = require('../config/passport');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const MenuCategory = require('../models/MenuCategory');

const router = express.Router();

// Create restaurant
router.post('/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const existingRestaurant = await Restaurant.findOne({ ownerId: req.user._id });
      if (existingRestaurant) {
        return res.status(400).json({ error: 'User already has a restaurant' });
      }

      const restaurant = new Restaurant({
        ownerId: req.user._id,
        ...req.body,
        email: req.user.email,
        qrMenu: {
          enabled: true,
          menuSlug: `${req.body.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
        }
      });

      await restaurant.save();

      // Create default categories
      const defaultCategories = [
        'Starters',
        'Main Course',
        'Desserts',
        'Beverages'
      ];

      const categoryPromises = defaultCategories.map((name, index) => {
        const category = new MenuCategory({
          name,
          restaurantId: restaurant._id,
          displayOrder: index
        });
        return category.save();
      });

      await Promise.all(categoryPromises);
      
      res.status(201).json({ message: 'Restaurant created successfully', restaurant });
    } catch (error) {
      console.error('❌ Error creating restaurant:', error);
      res.status(500).json({ error: 'Failed to create restaurant' });
    }
  }
);

// Get user's restaurant
router.get('/my-restaurant',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }
      res.json({ restaurant });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch restaurant' });
    }
  }
);

// Update restaurant
router.put('/my-restaurant',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const restaurant = await Restaurant.findOneAndUpdate(
        { ownerId: req.user._id },
        req.body,
        { new: true, runValidators: true }
      );
      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }
      res.json({ message: 'Restaurant updated successfully', restaurant });
    } catch (error) {
      console.error('❌ Error updating restaurant:', error);
      res.status(500).json({ error: 'Failed to update restaurant' });
    }
  }
);

// Get restaurant categories
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      'Fast Food',
      'Fine Dining',
      'Casual Dining',
      'Cafe & Coffee',
      'Bakery & Desserts',
      'Street Food',
      'Pizza & Italian',
      'Chinese & Asian',
      'Indian Cuisine',
      'Continental',
      'Vegetarian',
      'Seafood',
      'BBQ & Grill',
      'Juice & Smoothies',
      'Ice Cream',
      'Other'
    ];
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Search restaurants
router.get('/search', async (req, res) => {
  try {
    const { lat, lng, city, state, cuisineType, search } = req.query;
    let restaurants = [];
    let actualRadius = null;
    
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const limit = parseInt(req.query.limit) || 20;
      
      const query = {
        isActive: true,
         subscriptionActive: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            }
          }
        }
      };
      
      if (city) query.city = city;
      if (state) query.state = state;
      if (cuisineType) query.cuisineType = { $in: [cuisineType] };
      if (search) query.name = new RegExp(search, 'i');
      
      restaurants = await Restaurant.find(query)
        .select('name description cuisineType address city state phone whatsapp location rating totalReviews qrMenu diningOptions priceRange averageCookingTime logo banner workingHours isActive theme')
        .limit(limit);
        
      actualRadius = 'unlimited';
    } else {
      const query = { isActive: true, subscriptionActive: true };
      if (city) query.city = city;
      if (state) query.state = state;
      if (cuisineType) query.cuisineType = { $in: [cuisineType] };
      if (search) query.name = new RegExp(search, 'i');
      
      restaurants = await Restaurant.find(query)
        .select('name description cuisineType address city state phone whatsapp location rating totalReviews qrMenu diningOptions priceRange averageCookingTime logo banner workingHours isActive theme')
        .limit(100);
    }
    
    res.json({ restaurants, actualRadius });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

// Get single restaurant by ID (public access)
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Check if restaurant has active subscription
    if (!restaurant.subscriptionActive) {
      return res.json({ 
        restaurant: {
          _id: restaurant._id,
          name: restaurant.name,
          subscriptionActive: false
        },
        subscriptionExpired: true,
        message: 'This restaurant is temporarily unavailable due to expired subscription'
      });
    }
    
    res.json({ restaurant, subscriptionExpired: false });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
});

module.exports = router;