const express = require('express');
const Store = require('../models/Store');
const router = express.Router();

// Get stores with progressive distance expansion and filtering (public access)
router.get('/', async (req, res) => {
  try {
    const { lat, lng, city, state, category, search } = req.query;
    let storeQuery = {};
    let actualRadius = null;
    
    // Build store filters
    if (city) storeQuery.city = new RegExp(city, 'i');
    if (state) storeQuery.state = new RegExp(state, 'i');
    if (category) storeQuery.category = category;
    if (search) storeQuery.name = new RegExp(search, 'i');
    
    // GPS-based search with sorting by distance
    if (lat && lng) {
      try {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        
        // For GPS search, only use category and search filters, ignore city/state
        const gpsQuery = { isActive: true };
        if (category) gpsQuery.category = category;
        if (search) gpsQuery.name = new RegExp(search, 'i');
        
        const stores = await Store.find({
          ...gpsQuery,
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
              }
            }
          }
        })
        .select('name description category address city state phone whatsapp location rating totalReviews')
        .skip(skip)
        .limit(limit);
        
        const totalStores = await Store.countDocuments({
          ...gpsQuery,
          location: { $exists: true }
        });
        
        res.json({ 
          stores, 
          pagination: {
            page,
            limit,
            total: totalStores,
            pages: Math.ceil(totalStores / limit)
          }
        });
      } catch (locationError) {
        console.log('Location filtering failed:', locationError.message);
        // Fallback to city/state search
        const stores = await Store.find({ isActive: true, ...storeQuery })
          .select('name description category address city state phone whatsapp location rating totalReviews')
          .sort({ createdAt: -1 })
          .limit(20);
        res.json({ stores, pagination: null });
      }
    }
    // City/State-based search
    else {
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const skip = (page - 1) * limit;
      
      const stores = await Store.find({ isActive: true, ...storeQuery })
        .select('name description category address city state phone whatsapp location rating totalReviews')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const totalStores = await Store.countDocuments({ isActive: true, ...storeQuery });
      
      res.json({ 
        stores, 
        pagination: {
          page,
          limit,
          total: totalStores,
          pages: Math.ceil(totalStores / limit)
        }
      });
    }
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

// Debug endpoint to see what cities exist in database
router.get('/debug/cities', async (req, res) => {
  try {
    const cities = await Store.distinct('city', { isActive: true });
    const states = await Store.distinct('state', { isActive: true });
    const totalStores = await Store.countDocuments({ isActive: true });
    res.json({ cities, states, totalStores });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to check store locations
router.get('/debug/locations', async (req, res) => {
  try {
    const stores = await Store.find({ isActive: true })
      .select('name city state location')
      .limit(10);
    res.json({ stores });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single store by ID with reviews (public access)
router.get('/:id', async (req, res) => {
  try {
    const Review = require('../models/Review');
    
    const store = await Store.findById(req.params.id);
    
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Check if store has active subscription
    if (!store.subscriptionActive) {
      return res.json({ 
        store: {
          _id: store._id,
          name: store.name,
          subscriptionActive: false
        },
        subscriptionExpired: true,
        message: 'This business is temporarily unavailable due to expired subscription',
        reviews: []
      });
    }
    
    const reviews = await Review.find({ 
      targetType: 'Store',
      targetId: req.params.id,
      isApproved: true 
    }).sort({ rating: -1, createdAt: -1 }).limit(10);
    
    res.json({ store, reviews, subscriptionExpired: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;