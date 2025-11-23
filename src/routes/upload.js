const express = require('express');
const multer = require('multer');
const passport = require('../config/passport');
const imagekit = require('../config/imagekit');
const sharp = require('sharp');
const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for input file (will be compressed)
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Helper: Compress and resize image
const compressImage = async (buffer) => {
  try {
    return await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF data
      .resize(1200, 1200, { // Max dimensions
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 80 }) // Convert to WebP
      .toBuffer();
  } catch (error) {
    console.error('Sharp compression error:', error);
    throw error;
  }
};

// Upload menu item image
router.post('/menu-item',
  passport.authenticate('jwt', { session: false }),
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      // Compress image
      const processedBuffer = await compressImage(req.file.buffer);

      // Get restaurant info for folder organization
      const Restaurant = require('../models/Restaurant');
      const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
      
      let folderPath;
      if (restaurant) {
        const restaurantSlug = restaurant.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        folderPath = `/restaurants/${restaurantSlug}-${restaurant._id}/menu-items`;
      } else {
        // Fallback for users without restaurant
        folderPath = `/users/${req.user._id}/menu-items`;
      }
      
      // Use .webp extension
      const fileName = `${Date.now()}-${req.file.originalname.split('.')[0]}.webp`;
      
      const result = await imagekit.upload({
        file: processedBuffer,
        fileName: fileName,
        folder: folderPath,
        useUniqueFileName: true,
        tags: restaurant ? ['menu-item', restaurant._id.toString(), req.user._id.toString()] : ['menu-item', req.user._id.toString()]
      });

      res.json({
        success: true,
        imageUrl: result.url,
        fileId: result.fileId,
        thumbnailUrl: result.thumbnailUrl
      });
    } catch (error) {
      console.error('ImageKit upload error:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  }
);

// Upload product image
router.post('/product',
  passport.authenticate('jwt', { session: false }),
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      // Compress image
      const processedBuffer = await compressImage(req.file.buffer);

      // Get store info for folder organization
      const Store = require('../models/Store');
      const store = await Store.findOne({ ownerId: req.user._id });
      
      if (!store) {
        return res.status(404).json({ error: 'Store not found. Please create a store first.' });
      }
      
      // Create folder path based on store
      const storeSlug = store.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const folderPath = `/stores/${storeSlug}-${store._id}/products`;
      
      const fileName = `${Date.now()}-${req.file.originalname.split('.')[0]}.webp`;
      
      const result = await imagekit.upload({
        file: processedBuffer,
        fileName: fileName,
        folder: folderPath,
        useUniqueFileName: true,
        tags: ['product', store._id.toString(), req.user._id.toString()]
      });

      res.json({
        success: true,
        imageUrl: result.url,
        fileId: result.fileId,
        thumbnailUrl: result.thumbnailUrl
      });
    } catch (error) {
      console.error('ImageKit product upload error:', error);
      res.status(500).json({ error: 'Failed to upload product image' });
    }
  }
);

// Upload store assets (logo/banner)
router.post('/store-assets',
  passport.authenticate('jwt', { session: false }),
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const { type, storeName } = req.body; // type: 'logo' or 'banner'
      if (!['logo', 'banner'].includes(type)) {
        return res.status(400).json({ error: 'Invalid asset type' });
      }

      // Compress image
      const processedBuffer = await compressImage(req.file.buffer);

      // Get store info
      const Store = require('../models/Store');
      const store = await Store.findOne({ ownerId: req.user._id });
      
      let folderPath;
      if (store) {
        const storeSlug = store.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        folderPath = `/stores/${storeSlug}-${store._id}/${type}`;
      } else if (storeName) {
        // For new stores being created
        const sanitizedName = storeName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        folderPath = `/stores/pending-${sanitizedName}-${req.user._id}/${type}`;
      } else {
        return res.status(400).json({ error: 'Store not found and no store name provided' });
      }
      
      const fileName = `${Date.now()}-${req.file.originalname.split('.')[0]}.webp`;
      
      const result = await imagekit.upload({
        file: processedBuffer,
        fileName: fileName,
        folder: folderPath,
        useUniqueFileName: true,
        tags: ['store-asset', type, req.user._id.toString()]
      });

      res.json({
        success: true,
        imageUrl: result.url,
        fileId: result.fileId,
        thumbnailUrl: result.thumbnailUrl
      });
    } catch (error) {
      console.error('ImageKit store asset upload error:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  }
);

// Delete image
router.delete('/image/:fileId',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      await imagekit.deleteFile(req.params.fileId);
      res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
      console.error('ImageKit delete error:', error);
      res.status(500).json({ error: 'Failed to delete image' });
    }
  }
);

module.exports = router;