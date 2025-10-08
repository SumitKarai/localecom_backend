const express = require('express');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
// Add this test route at the beginning of auth.js
router.get('/test', (req, res) => {
    res.json({ message: 'Auth routes are working!' });
  });
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
  const redirectUri = 'http://localhost:5000/api/auth/google/callback';
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
  const redirectUri = 'http://localhost:5000/api/auth/google/callback';
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
      
      // For development, you can return JSON instead of redirect
      if (process.env.NODE_ENV === 'development') {
        res.json({
          success: true,
          token: token,
          user: {
            id: req.user._id,
            name: req.user.profile.name,
            email: req.user.email,
            role: req.user.role
          }
        });
      } else {
        res.redirect(`${process.env.FRONTEND_URL}/?token=${token}`);
      }
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
