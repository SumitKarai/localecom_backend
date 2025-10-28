const express = require('express');
const passport = require('../config/passport');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const router = express.Router();

// Create seller store
router.post('/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const existingSeller = await Seller.findOne({ ownerId: req.user._id });
      if (existingSeller) {
        return res.status(400).json({ error: 'User already has a store' });
      }

      const seller = new Seller({
        ownerId: req.user._id,
        ...req.body,
        email: req.user.email
      });

      await seller.save();
      res.status(201).json({ message: 'Store created successfully', seller });
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
      const seller = await Seller.findOne({ ownerId: req.user._id });
      if (!seller) {
        return res.status(404).json({ error: 'Store not found' });
      }
      res.json({ seller });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch store' });
    }
  }
);

// Update store
router.put('/my-store',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const seller = await Seller.findOneAndUpdate(
        { ownerId: req.user._id },
        req.body,
        { new: true, runValidators: true }
      );
      if (!seller) {
        return res.status(404).json({ error: 'Store not found' });
      }
      res.json({ message: 'Store updated successfully', seller });
    } catch (error) {
      console.error('❌ Error updating store:', error);
      res.status(500).json({ error: 'Failed to update store' });
    }
  }
);

// Add product to store
router.post('/:sellerId/products',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { sellerId } = req.params;

      const seller = await Seller.findOne({ _id: sellerId, ownerId: req.user._id });
      if (!seller) {
        return res.status(403).json({ error: 'Store not found or access denied' });
      }

      const product = new Product({
        sellerId,
        ...req.body
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
router.get('/:sellerId/products', async (req, res) => {
  try {
    const products = await Product.find({ 
      sellerId: req.params.sellerId,
      isActive: true 
    });
    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get store categories
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      'Grocery & Food',
      'Electronics',
      'Clothing & Fashion',
      'Pharmacy & Health',
      'Books & Stationery',
      'Home & Garden',
      'Sports & Fitness',
      'Beauty & Personal Care',
      'Toys & Games',
      'Automotive',
      'Jewelry & Accessories',
      'Pet Supplies',
      'Hardware & Tools',
      'Bakery & Sweets',
      'Flowers & Gifts',
      'Other'
    ];
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Search sellers
router.get('/search', async (req, res) => {
  try {
    const { lat, lng, city, state, category, search } = req.query;
    let sellers = [];
    let actualRadius = null;
    
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const distances = [2, 5, 10, 20, 50];
      
      for (const distance of distances) {
        const query = {
          isActive: true,
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
              },
              $maxDistance: distance * 1000
            }
          }
        };
        
        if (city) query.city = city;
        if (state) query.state = state;
        if (category) query.category = category;
        if (search) query.storeName = new RegExp(search, 'i');
        
        sellers = await Seller.find(query)
          .select('storeName description category address city state phone whatsapp location rating totalReviews')
          .limit(100);
          
        actualRadius = distance;
        if (sellers.length >= 20) break;
      }
    } else {
      const query = { isActive: true };
      if (city) query.city = city;
      if (state) query.state = state;
      if (category) query.category = category;
      if (search) query.storeName = new RegExp(search, 'i');
      
      sellers = await Seller.find(query)
        .select('storeName description category address city state phone whatsapp location rating totalReviews')
        .limit(100);
    }
    
    res.json({ sellers, actualRadius });
  } catch (error) {
    console.error('Error fetching sellers:', error);
    res.status(500).json({ error: 'Failed to fetch sellers' });
  }
});

module.exports = router;