const express = require('express');
const passport = require('../config/passport');
const Freelancer = require('../models/Freelancer');
const router = express.Router();

// Create freelancer profile
router.post('/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const existingFreelancer = await Freelancer.findOne({ userId: req.user._id });
      if (existingFreelancer) {
        return res.status(400).json({ error: 'User already has a freelancer profile' });
      }

      const freelancer = new Freelancer({
        userId: req.user._id,
        ...req.body,
        email: req.user.email
      });

      await freelancer.save();
      res.status(201).json({ message: 'Freelancer profile created successfully', freelancer });
    } catch (error) {
      console.error('❌ Error creating freelancer profile:', error);
      res.status(500).json({ error: 'Failed to create freelancer profile' });
    }
  }
);

// Update freelancer profile
router.put('/my-profile',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const freelancer = await Freelancer.findOneAndUpdate(
        { userId: req.user._id },
        req.body,
        { new: true, runValidators: true }
      );
      if (!freelancer) {
        return res.status(404).json({ error: 'Freelancer profile not found' });
      }
      res.json({ message: 'Freelancer profile updated successfully', freelancer });
    } catch (error) {
      console.error('❌ Error updating freelancer profile:', error);
      res.status(500).json({ error: 'Failed to update freelancer profile' });
    }
  }
);

// Get user's freelancer profile
router.get('/my-profile',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const freelancer = await Freelancer.findOne({ userId: req.user._id });
      if (!freelancer) {
        return res.status(404).json({ error: 'Freelancer profile not found' });
      }
      res.json({ freelancer });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch freelancer profile' });
    }
  }
);

// Get freelancer profile by ID
router.get('/:freelancerId', async (req, res) => {
  try {
    const { freelancerId } = req.params;
    
    // Find freelancer without filtering by subscriptionActive initially
    const freelancer = await Freelancer.findOne({
      _id: freelancerId,
      isActive: true
    });

    if (!freelancer) {
      return res.status(404).json({ error: 'Freelancer not found' });
    }

    // Check if freelancer has active subscription
    if (!freelancer.subscriptionActive) {
      return res.json({ 
        freelancer: {
          _id: freelancer._id,
          profileName: freelancer.profileName,
          subscriptionActive: false
        },
        subscriptionExpired: true,
        message: 'This freelancer profile is temporarily unavailable due to expired subscription'
      });
    }

    res.json({ freelancer, subscriptionExpired: false });
  } catch (error) {
    console.error('❌ Error fetching freelancer profile:', error);
    res.status(500).json({ error: 'Failed to fetch freelancer profile' });
  }
});

// Search freelancers
router.get('/search', async (req, res) => {
  try {
    const { lat, lng, skills, city, state, availability, category } = req.query;
    let freelancers = [];
    let actualRadius = null;

    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const distances = [5, 10, 25, 50, 100];
      
      for (const distance of distances) {
        const query = {
          isActive: true,
          subscriptionActive: true,
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
              },
              $maxDistance: distance * 1000
            }
          }
        };
        
        if (skills) query.skills = { $in: skills.split(',') };
        if (availability) query.availability = availability;
        if (category) query.category = category;
        if (city) query.city = city;
        if (state) query.state = state;
        
        freelancers = await Freelancer.find(query)
          .select('profileName title description category skills hourlyRate location city state rating totalReviews availability')
          .limit(100);
          
        actualRadius = distance;
        if (freelancers.length >= 20) break;
      }
    } else {
      const query = { isActive: true, subscriptionActive: true };
      if (skills) query.skills = { $in: skills.split(',') };
      if (availability) query.availability = availability;
      if (category) query.category = category;
      if (city) query.city = city;
      if (state) query.state = state;
      
      freelancers = await Freelancer.find(query)
        .select('profileName title description category skills hourlyRate location city state rating totalReviews availability')
        .limit(100);
    }

    res.json({ freelancers, actualRadius });
  } catch (error) {
    console.error('❌ Error searching freelancers:', error);
    res.status(500).json({ error: 'Failed to search freelancers' });
  }
});

// Get freelancer categories
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      'Web Development',
      'Mobile Development',
      'Graphic Design',
      'Digital Marketing',
      'Content Writing',
      'Photography',
      'Video Editing',
      'Tutoring',
      'Consulting',
      'Home Services',
      'Beauty & Wellness',
      'Fitness Training',
      'Music & Arts',
      'Legal Services',
      'Accounting',
      'Other'
    ];
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;