const express = require('express');
const passport = require('../config/passport');
const User = require('../models/User');
const router = express.Router();

// Update user role
router.put('/role', 
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { role } = req.body;
      const userId = req.user._id;

      // Validate role
      const validRoles = ['customer', 'seller', 'freelancer', 'hybrid'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          error: 'Invalid role',
          validRoles: validRoles
        });
      }

      // Update user role
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { role: role },
        { new: true }
      );

      res.json({
        message: 'Role updated successfully',
        user: {
          id: updatedUser._id,
          email: updatedUser.email,
          name: updatedUser.profile.name,
          role: updatedUser.role,
          avatar: updatedUser.profile.avatar
        }
      });

    } catch (error) {
      console.error('❌ Error updating role:', error);
      res.status(500).json({ error: 'Failed to update role' });
    }
  }
);

module.exports = router;
