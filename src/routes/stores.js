const express = require('express');
const passport = require('../config/passport');
const Store = require('../models/Store');
const Product = require('../models/Product');
const router = express.Router();

// Create store
router.post('/', 
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { name, description, category, address, phone, location } = req.body;
      
      // Check if user already has a store
      const existingStore = await Store.findOne({ ownerId: req.user._id });
      if (existingStore) {
        return res.status(400).json({ error: 'User already has a store' });
      }

      const store = new Store({
        ownerId: req.user._id,
        name,
        description,
        category,
        address,
        phone,
        email: req.user.email,
        location: location || { type: 'Point', coordinates: [0, 0] }
      });

      await store.save();
      res.status(201).json({ message: 'Store created successfully', store });
    } catch (error) {
      console.error('❌ Error creating store:', error);
      res.status(500).json({ error: 'Failed to create store' });
    }
  }
);

// Get user's store
router.get('/my-store',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const store = await Store.findOne({ ownerId: req.user._id });
      if (!store) {
        return res.status(404).json({ error: 'Store not found' });
      }
      res.json({ store });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch store' });
    }
  }
);

// Add product to store
router.post('/:storeId/products',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { name, description, category, price, quantity, unit } = req.body;
      const { storeId } = req.params;

      // Verify store ownership
      const store = await Store.findOne({ _id: storeId, ownerId: req.user._id });
      if (!store) {
        return res.status(403).json({ error: 'Store not found or access denied' });
      }

      const product = new Product({
        storeId,
        name,
        description,
        category,
        price,
        inventory: {
          quantity: quantity || 0,
          unit: unit || 'piece'
        }
      });

      await product.save();
      res.status(201).json({ message: 'Product added successfully', product });
    } catch (error) {
      console.error('❌ Error adding product:', error);
      res.status(500).json({ error: 'Failed to add product' });
    }
  }
);

// Get store products
router.get('/:storeId/products',
  async (req, res) => {
    try {
      const products = await Product.find({ 
        storeId: req.params.storeId,
        isActive: true 
      });
      res.json({ products });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  }
);

module.exports = router;
