const express = require('express');
const MenuCategory = require('../models/MenuCategory');
const Restaurant = require('../models/Restaurant');
const passport = require('../config/passport');

const router = express.Router();

// Get categories for a restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const categories = await MenuCategory.find({ 
      restaurantId: req.params.restaurantId,
      isActive: true 
    }).sort({ displayOrder: 1, name: 1 });
    
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get my restaurant categories (authenticated)
router.get('/my-categories', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const categories = await MenuCategory.find({ 
      restaurantId: restaurant._id,
      isActive: true 
    }).sort({ displayOrder: 1, name: 1 });
    
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create category
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const { name, displayOrder } = req.body;

    // Check if category already exists
    const existingCategory = await MenuCategory.findOne({
      restaurantId: restaurant._id,
      name: name.trim()
    });

    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new MenuCategory({
      name: name.trim(),
      restaurantId: restaurant._id,
      displayOrder: displayOrder || 0
    });

    await category.save();
    res.status(201).json({ category });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update category
router.put('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const category = await MenuCategory.findOne({
      _id: req.params.id,
      restaurantId: restaurant._id
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const { name, displayOrder, isActive } = req.body;

    if (name && name.trim() !== category.name) {
      // Check if new name already exists
      const existingCategory = await MenuCategory.findOne({
        restaurantId: restaurant._id,
        name: name.trim(),
        _id: { $ne: req.params.id }
      });

      if (existingCategory) {
        return res.status(400).json({ message: 'Category name already exists' });
      }
      category.name = name.trim();
    }

    if (displayOrder !== undefined) category.displayOrder = displayOrder;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();
    res.json({ category });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete category
router.delete('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const category = await MenuCategory.findOne({
      _id: req.params.id,
      restaurantId: restaurant._id
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await MenuCategory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;