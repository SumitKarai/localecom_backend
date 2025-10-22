const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

// Get all products with filtering
router.get('/', async (req, res) => {
  try {
    const { lat, lng, maxDistance, storeId, city, state, search } = req.query;
    const Store = require('../models/Store');
    let storeQuery = {};
    let productQuery = {};
    
    // If storeId provided, filter by specific store
    if (storeId) {
      productQuery.storeId = storeId;
    } else {
      // Build store filters
      if (city) storeQuery.city = new RegExp(city, 'i');
      if (state) storeQuery.state = new RegExp(state, 'i');
      
      // Progressive distance expansion for GPS search
      if (lat && lng && maxDistance) {
        try {
          const latitude = parseFloat(lat);
          const longitude = parseFloat(lng);
          const requestedDistance = parseFloat(maxDistance);
          const minProducts = 20;
          
          // Try expanding distances: [requested, requested*2, requested*4, 50km]
          const distances = [requestedDistance, requestedDistance * 2, requestedDistance * 4, 50];
          let foundStores = [];
          
          for (const distance of distances) {
            const nearbyStores = await Store.find({
              location: {
                $near: {
                  $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                  },
                  $maxDistance: distance * 1000
                }
              }
            });
            
            if (nearbyStores.length > 0) {
              foundStores = nearbyStores;
              console.log(`Found ${foundStores.length} stores within ${distance}km`);
              
              // Check if we have enough products
              const productCount = await Product.countDocuments({
                storeId: { $in: foundStores.map(s => s._id) },
                ...(search && { name: new RegExp(search, 'i') })
              });
              
              if (productCount >= minProducts || distance === 50) {
                break; // Found enough products or reached max distance
              }
            }
          }
          
          if (foundStores.length > 0) {
            storeQuery._id = { $in: foundStores.map(s => s._id) };
          }
        } catch (locationError) {
          console.log('Location filtering failed:', locationError.message);
        }
      }
      
      // Get stores matching criteria (skip if already filtered by location)
      if (!storeQuery._id) {
        const stores = await Store.find(storeQuery);
        const storeIds = stores.map(store => store._id);
        
        if (storeIds.length > 0) {
          productQuery.storeId = { $in: storeIds };
        } else if (city || state) {
          // If city/state filters applied but no stores found, return empty
          return res.json({ products: [] });
        }
      } else {
        // Location-based filtering already applied
        productQuery.storeId = storeQuery._id;
      }
    }
    
    // Product name search
    if (search) {
      productQuery.name = new RegExp(search, 'i');
    }
    
    const products = await Product.find(productQuery)
      .populate('storeId', 'name address location city state')
      .sort({ createdAt: -1 });
    
    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;