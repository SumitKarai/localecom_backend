const express = require('express');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();
// Add this test route at the beginning of auth.js
router.get('/test', (req, res) => {
    res.json({ message: 'Auth routes are working!' });
  });

// Email/Password Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email });
    
    if (!user || !user.password || !user.hasPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = generateToken(user);
    
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        hasPassword: user.hasPassword
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Set Password (for existing Google users)
router.post('/set-password', 
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await User.findByIdAndUpdate(req.user._id, {
        password: hashedPassword,
        hasPassword: true
      });
      
      res.json({ message: 'Password set successfully' });
    } catch (error) {
      console.error('Set password error:', error);
      res.status(500).json({ error: 'Failed to set password' });
    }
  }
);

// Change Password (for users with existing password)
router.post('/change-password', 
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      console.log('Change password request body:', req.body);
      console.log('User ID:', req.user._id);
      const { newPassword } = req.body;
      
      if (!newPassword) {
        return res.status(400).json({ error: 'New password is required' });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }
      
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      
      await User.findByIdAndUpdate(req.user._id, {
        password: hashedNewPassword,
        hasPassword: true
      });
      
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);
// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Check environment variables
router.get('/env-check', (req, res) => {
  res.json({
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasJwtSecret: !!process.env.JWT_SECRET,
    clientIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0
  });
});

// Simple test route for Google auth
router.get('/google-test', (req, res) => {
  res.json({ 
    message: 'Google auth endpoint is accessible',
    timestamp: new Date().toISOString(),
    env: {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasJwtSecret: !!process.env.JWT_SECRET
    },
    passport: {
      strategiesLoaded: Object.keys(passport._strategies || {}),
      hasGoogleStrategy: !!passport._strategies?.google,
      hasJwtStrategy: !!passport._strategies?.jwt
    }
  });
});

// Direct redirect test (bypass passport)
router.get('/google-direct', (req, res) => {
  const redirectUri = process.env.CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';
  const scopes = 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
  const googleAuthUrl = `https://accounts.google.com/oauth/authorize?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `response_type=code&` +
    `access_type=offline`;
  
  console.log('🔗 Direct Google redirect URL:', googleAuthUrl);
  console.log('🔗 Client ID being used:', process.env.GOOGLE_CLIENT_ID);
  console.log('🔗 Redirect URI:', redirectUri);
  
  res.redirect(googleAuthUrl);
});

// Debug route to show the exact URL without redirecting
router.get('/google-url', (req, res) => {
  const redirectUri = process.env.CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';
  const scopes = 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
  const googleAuthUrl = `https://accounts.google.com/oauth/authorize?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `response_type=code&` +
    `access_type=offline`;
  
  res.json({
    message: 'Google OAuth URL (copy and paste in browser)',
    url: googleAuthUrl,
    clientId: process.env.GOOGLE_CLIENT_ID,
    redirectUri: redirectUri,
    scopes: scopes,
    instructions: 'Copy the URL above and paste it in your browser'
  });
});

// Google OAuth Routes
router.get('/google', (req, res, next) => {
  console.log('🚀 Google OAuth route accessed');
  console.log('🔍 Request URL:', req.url);
  console.log('🔍 Request method:', req.method);
  
  // Check if passport strategies are loaded
  console.log('🔍 Available strategies:', Object.keys(passport._strategies || {}));
  
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  }, (err, user, info) => {
    console.log('🔍 Passport authenticate callback:', { err, user: !!user, info });
    if (err) {
      console.error('❌ Passport authentication error:', err);
      return res.status(500).json({ error: 'Authentication failed', details: err.message });
    }
    // This shouldn't be called for the initial redirect, but let's log it
    console.log('🔍 Unexpected callback execution');
  })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: '/api/auth/failure'
  }),
  (req, res) => {
    try {
      console.log('🚀 Google callback successful for user:', req.user.profile.name);
      const token = generateToken(req.user);
      
      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/?token=${token}`);
    } catch (error) {
      console.error('❌ Error in callback:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }
);

// Failure route
router.get('/failure', (req, res) => {
  res.status(401).json({
    error: 'Google authentication failed',
    message: 'Please try again or check your Google account permissions'
  });
});

// Get current user (protected route)
router.get('/me', 
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.json({ user: req.user });
  }
);

// Test route with token in URL (for easy testing)
router.get('/me-test/:token', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
    const User = require('../models/User');
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      message: 'Token is valid!',
      user: {
        id: user._id,
        email: user.email,
        name: user.profile.name,
        role: user.role,
        avatar: user.profile.avatar
      },
      tokenData: decoded
    });
  } catch (error) {
    res.status(401).json({ 
      error: 'Invalid token',
      details: error.message 
    });
  }
});

module.exports = router;
