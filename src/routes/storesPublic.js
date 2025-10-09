const express = require('express');
const Store = require('../models/Store');
const router = express.Router();

// Get all stores with optional location filtering (public access)
router.get('/', async (req, res) => {
  try {
    const { lat, lng, maxDistance } = req.query;
    let query = { isActive: true };
    let stores;
    
    if (lat && lng && maxDistance) {
      try {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const maxDistanceKm = parseFloat(maxDistance);
        
        stores = await Store.find({
          ...query,
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
              },
              $maxDistance: maxDistanceKm * 1000
            }
          }
        });
        
        // If no stores found with location filter, show all stores
        if (stores.length === 0) {
          console.log('No stores found with location filter, showing all stores');
          stores = await Store.find(query).sort({ createdAt: -1 });
        }
      } catch (locationError) {
        console.log('Location filtering failed, showing all stores:', locationError.message);
        stores = await Store.find(query).sort({ createdAt: -1 });
      }
    } else {
      stores = await Store.find(query).sort({ createdAt: -1 });
    }
    
    res.json({ stores });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single store by ID (public access)
router.get('/:id', async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    res.json({ store });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;