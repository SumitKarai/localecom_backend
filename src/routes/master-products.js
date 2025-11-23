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

module.exports = router;
