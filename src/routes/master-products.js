const express = require('express');
const passport = require('../config/passport');
const MasterProduct = require('../models/MasterProduct');
const router = express.Router();

// Update MasterProduct (for images, etc.)
router.patch('/:masterProductId',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { masterProductId } = req.params;
      
      // Update the master product
      const masterProduct = await MasterProduct.findByIdAndUpdate(
        masterProductId,
        req.body,
        { new: true, runValidators: true }
      );

      if (!masterProduct) {
        return res.status(404).json({ error: 'Master product not found' });
      }

      res.json({ message: 'Master product updated successfully', masterProduct });
    } catch (error) {
      console.error('❌ Error updating master product:', error);
      res.status(500).json({ error: 'Failed to update master product' });
    }
  }
);

// Search Master Products
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') },
        { brand: new RegExp(search, 'i') }
      ];
    }

    const masterProducts = await MasterProduct.find(query)
      .populate('categoryId')
      .limit(20)
      .sort({ name: 1 });

    res.json({ masterProducts });
  } catch (error) {
    console.error('❌ Error searching master products:', error);
    res.status(500).json({ error: 'Failed to search master products' });
  }
});

module.exports = router;
