const express = require('express');
const multer = require('multer');
const passport = require('../config/passport');
const imagekit = require('../config/imagekit');
const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit (after compression)
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload menu item image
router.post('/menu-item',
  passport.authenticate('jwt', { session: false }),
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

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
      
      const fileName = `${Date.now()}-${req.file.originalname}`;
      
      const result = await imagekit.upload({
        file: req.file.buffer,
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