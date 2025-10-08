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
    } else {
      stores = await Store.find(query).sort({ createdAt: -1 });
    }
    
    res.json({ stores });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;