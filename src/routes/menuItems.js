const express = require('express');
const passport = require('../config/passport');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const router = express.Router();

// Create menu item (restaurant owners only)
router.post('/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { restaurantId, name, description, category, price, discountPrice, images, dietary, availability, preparationTime, tags } = req.body;

      // Verify restaurant ownership
      const restaurant = await Restaurant.findOne({ 
        _id: restaurantId, 
        ownerId: req.user._id
      });
      if (!restaurant) {
        return res.status(403).json({ error: 'Restaurant not found or access denied' });
      }

      const menuItem = new MenuItem({
        restaurantId,
        name,
        description,
        category,
        price,
        discountPrice,
        images: images || [],
        dietary: dietary || {},
        availability: availability || { isAvailable: true },
        preparationTime: preparationTime || 15,
        tags: tags || []
      });

      await menuItem.save();
      res.status(201).json({ message: 'Menu item created successfully', menuItem });
    } catch (error) {
      console.error('❌ Error creating menu item:', error);
      res.status(500).json({ error: 'Failed to create menu item' });
    }
  }
);

// Get menu items for a restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { category, vegetarian, vegan, available } = req.query;

    // Verify restaurant exists
    const restaurant = await Restaurant.findOne({ 
      _id: restaurantId,
      isActive: true 
    });
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const query = { restaurantId, isActive: true };
    
    if (category) query.category = category;
    if (vegetarian === 'true') query['dietary.vegetarian'] = true;
    if (vegan === 'true') query['dietary.vegan'] = true;
    if (available === 'true') query['availability.isAvailable'] = true;

    const menuItems = await MenuItem.find(query).sort({ category: 1, name: 1 });
    
    res.json({ menuItems, restaurant });
  } catch (error) {
    console.error('❌ Error fetching menu items:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// Get menu by QR slug with reviews
router.get('/qr/:menuSlug', async (req, res) => {
  try {
    const { menuSlug } = req.params;
    const Review = require('../models/Review');

    const restaurant = await Restaurant.findOne({ 
      'qrMenu.menuSlug': menuSlug,
      isActive: true 
    });
    if (!restaurant) {
      return res.status(404).json({ error: 'Menu not found' });
    }

    // Get menu items and reviews in parallel
    const [menuItems, reviews] = await Promise.all([
      MenuItem.find({ 
        restaurantId: restaurant._id, 
        isActive: true
      }).sort({ 'availability.isAvailable': -1, category: 1, name: 1 }),
      
      Review.find({ 
        targetType: 'Restaurant',
        targetId: restaurant._id,
        isApproved: true 
      }).sort({ rating: -1, createdAt: -1 }).limit(10)
    ]);
    
    res.json({ menuItems, restaurant, reviews });
  } catch (error) {
    console.error('❌ Error fetching QR menu:', error);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// Update menu item
router.put('/:itemId',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { itemId } = req.params;

      // Find menu item and verify ownership
      const menuItem = await MenuItem.findById(itemId);
      if (!menuItem) {
        return res.status(404).json({ error: 'Menu item not found' });
      }

      // Verify restaurant ownership
      const restaurant = await Restaurant.findOne({ 
        _id: menuItem.restaurantId, 
        ownerId: req.user._id 
      });
      if (!restaurant) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedItem = await MenuItem.findByIdAndUpdate(
        itemId,
        req.body,
        { new: true, runValidators: true }
      );

      res.json({ message: 'Menu item updated successfully', menuItem: updatedItem });
    } catch (error) {
      console.error('❌ Error updating menu item:', error);
      res.status(500).json({ error: 'Failed to update menu item' });
    }
  }
);

// Delete menu item
router.delete('/:itemId',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { itemId } = req.params;

      // Find menu item and verify ownership
      const menuItem = await MenuItem.findById(itemId);
      if (!menuItem) {
        return res.status(404).json({ error: 'Menu item not found' });
      }

      // Verify restaurant ownership
      const restaurant = await Restaurant.findOne({ 
        _id: menuItem.restaurantId, 
        ownerId: req.user._id 
      });
      if (!restaurant) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await MenuItem.findByIdAndDelete(itemId);
      res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
      console.error('❌ Error deleting menu item:', error);
      res.status(500).json({ error: 'Failed to delete menu item' });
    }
  }
);

// Get menu categories
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      'Appetizers',
      'Main Course', 
      'Desserts',
      'Beverages',
      'Snacks',
      'Breakfast',
      'Lunch',
      'Dinner',
      'Specials'
    ];
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;