const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

// Get all products with optional location filtering
router.get('/', async (req, res) => {
  try {
    const { lat, lng, maxDistance } = req.query;
    let query = {};
    
    // If location parameters provided, add geospatial query
    if (lat && lng && maxDistance) {
      try {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const maxDistanceKm = parseFloat(maxDistance);
        
        // First get stores within radius
        const Store = require('../models/Store');
        const nearbyStores = await Store.find({
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
              },
              $maxDistance: maxDistanceKm * 1000 // Convert km to meters
            }
          }
        });
        
        const storeIds = nearbyStores.map(store => store._id);
        if (storeIds.length > 0) {
          query = { storeId: { $in: storeIds } };
        }
        // If no nearby stores found, show all products (fallback)
      } catch (locationError) {
        console.log('Location filtering failed, showing all products:', locationError.message);
        // Continue with empty query to show all products
      }
    }
    
    const products = await Product.find(query)
      .populate('storeId', 'name address location')
      .sort({ createdAt: -1 });
    
    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;