const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');

// Verify environment variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error('❌ Missing Google OAuth credentials in environment variables');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('❌ Missing JWT_SECRET in environment variables');
  process.exit(1);
}

console.log('✅ Passport configuration loading...');
console.log('✅ Google Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing');
console.log('✅ Google Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing');

// Google OAuth Strategy
passport.use('google', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback",
  scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('🔍 Google OAuth callback received for user:', profile.displayName);
    
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      console.log('✅ Existing user found:', user.profile.name);
      return done(null, user);
    }
    
    // Create new user
    user = new User({
      googleId: profile.id,
      email: profile.emails[0].value,
      profile: {
        name: profile.displayName,
        avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null
      }
    });
    
    await user.save();
    console.log('✅ New user created:', user.profile.name);
    return done(null, user);
  } catch (error) {
    console.error('❌ Error in Google OAuth strategy:', error);
    return done(error, null);
  }
}));

// JWT Strategy
passport.use('jwt', new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
}, async (payload, done) => {
  try {
    const user = await User.findById(payload.id);
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    console.error('❌ Error in JWT strategy:', error);
    return done(error, false);
  }
}));

console.log('✅ Passport strategies configured successfully');

module.exports = passport;
