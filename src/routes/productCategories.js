const express = require('express');
const passport = require('../config/passport');
const ProductCategory = require('../models/ProductCategory');
const router = express.Router();

// Get all product categories
router.get('/', async (req, res) => {
  try {
    const categories = await ProductCategory.find().sort({ name: 1 });
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching product categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create a new product category (protected route)
router.post('/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { name } = req.body;
      
      // Check if category already exists
      const existingCategory = await ProductCategory.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({ error: 'Category already exists' });
      }

      const category = new ProductCategory({ name });
      await category.save();
      
      res.status(201).json({ message: 'Category created successfully', category });
    } catch (error) {
      console.error('Error creating product category:', error);
      res.status(500).json({ error: 'Failed to create category' });
    }
  }
);

// Update a product category (protected route)
router.put('/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { name } = req.body;
      
      const category = await ProductCategory.findByIdAndUpdate(
        req.params.id,
        { name },
        { new: true, runValidators: true }
      );
      
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json({ message: 'Category updated successfully', category });
    } catch (error) {
      console.error('Error updating product category:', error);
      res.status(500).json({ error: 'Failed to update category' });
    }
  }
);

// Delete a product category (protected route)
router.delete('/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const category = await ProductCategory.findByIdAndDelete(req.params.id);
      
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting product category:', error);
      res.status(500).json({ error: 'Failed to delete category' });
    }
  }
);

module.exports = router;
