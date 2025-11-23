const express = require('express');
const Product = require('../models/Product');
const MasterProduct = require('../models/MasterProduct');
const Store = require('../models/Store');
const router = express.Router();

// Get all products with filtering
router.get('/', async (req, res) => {
  try {
    const { lat, lng, maxDistance, storeId, city, state, search } = req.query;
    let storeQuery = {};
    let productQuery = { isActive: true, 'availability.isAvailable': true };
    let masterProductQuery = {};
    
    console.log('📦 Products API called with params:', { lat, lng, maxDistance, city, state, search });
    
    // Search in MasterProduct if search term provided
    if (search) {
      const masterProducts = await MasterProduct.find({
        $or: [
          { name: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') },
          { tags: new RegExp(search, 'i') }
        ],
        isActive: true
      });
      
      if (masterProducts.length > 0) {
        productQuery.masterProductId = { $in: masterProducts.map(mp => mp._id) };
      } else {
        // No matching master products found
        return res.json({ products: [] });
      }
    }
    
    // If storeId provided, filter by specific store
    if (storeId) {
      productQuery.storeId = storeId;
    } else {
      // Build store filters
      if (city) storeQuery.city = new RegExp(city, 'i');
      if (state) storeQuery.state = new RegExp(state, 'i');
      
      // Progressive distance expansion for GPS search
      if (lat && lng) {
        try {
          const latitude = parseFloat(lat);
          const longitude = parseFloat(lng);
          const requestedDistance = parseFloat(maxDistance) || 5; // Default 5km if not provided
          const minProducts = 20;
          
          console.log(`🔍 Location search: lat=${latitude}, lng=${longitude}, maxDistance=${requestedDistance}km`);
          
          // Try expanding distances: [requested, requested*2, requested*4, 50km]
          const distances = [requestedDistance, requestedDistance * 2, requestedDistance * 4, 50];
          let foundStores = [];
          
          for (const distance of distances) {
            console.log(`  Searching within ${distance}km...`);
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
            
            console.log(`  Found ${nearbyStores.length} stores within ${distance}km`);
            
            if (nearbyStores.length > 0) {
              foundStores = nearbyStores;
              
              // Check if we have enough products
              const productCount = await Product.countDocuments({
                storeId: { $in: foundStores.map(s => s._id) },
                isActive: true,
                'availability.isAvailable': true,
                ...productQuery
              });
              
              console.log(`  Found ${productCount} products in these stores`);
              
              if (productCount >= minProducts || distance === 50) {
                break; // Found enough products or reached max distance
              }
            }
          }
          
          if (foundStores.length > 0) {
            storeQuery._id = { $in: foundStores.map(s => s._id) };
            console.log(`✅ Using ${foundStores.length} nearby stores for product search`);
          } else {
            console.log('⚠️ No stores found within search radius');
          }
        } catch (locationError) {
          console.error('❌ Location filtering failed:', locationError.message);
        }
      }
      
      // Get stores matching criteria (skip if already filtered by location)
      if (!storeQuery._id) {
        const stores = await Store.find(storeQuery);
        const storeIds = stores.map(store => store._id);
        
        console.log(`Found ${stores.length} stores matching city/state filters`);
        
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
    
    const products = await Product.find(productQuery)
      .populate('storeId', 'name address location city state rating totalReviews phone whatsapp')
      .populate({
        path: 'masterProductId',
        populate: {
          path: 'categoryId',
          model: 'ProductCategory'
        }
      })
      .sort({ createdAt: -1 });
    
    console.log(`📊 Returning ${products.length} products`);
    res.json({ products });
  } catch (error) {
    console.error('❌ Products API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all stores selling a specific product (by MasterProduct)
router.get('/:productId/stores', async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Find the product to get its masterProductId
    const product = await Product.findById(productId).populate({
      path: 'masterProductId',
      populate: {
        path: 'categoryId',
        model: 'ProductCategory'
      }
    });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Find all products with the same masterProductId
    const similarProducts = await Product.find({
      masterProductId: product.masterProductId._id,
      isActive: true,
      'availability.isAvailable': true
    }).populate('storeId').populate({
      path: 'masterProductId',
      populate: {
        path: 'categoryId',
        model: 'ProductCategory'
      }
    });
    
    // Group by store and format response
    const storesWithProduct = similarProducts.map(prod => ({
      store: {
        _id: prod.storeId._id,
        name: prod.storeId.name,
        city: prod.storeId.city,
        state: prod.storeId.state,
        phone: prod.storeId.phone,
        whatsapp: prod.storeId.whatsapp,
        rating: prod.storeId.rating,
        totalReviews: prod.storeId.totalReviews
      },
      price: prod.price,
      availability: prod.availability,
      productId: prod._id
    }));
    
    res.json({ 
      masterProduct: product.masterProductId,
      stores: storesWithProduct 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product details with reviews
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const Review = require('../models/Review');
    
    const product = await Product.findById(productId)
      .populate('storeId', 'name city state rating totalReviews phone whatsapp address')
      .populate({
        path: 'masterProductId',
        populate: {
          path: 'categoryId',
          model: 'ProductCategory'
        }
      });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Get reviews for the MasterProduct
    const reviews = await Review.find({ 
      targetType: 'MasterProduct',
      targetId: product.masterProductId._id,
      isApproved: true 
    }).sort({ rating: -1, createdAt: -1 }).limit(10);
    
    res.json({ product, reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;