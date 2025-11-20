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
  callbackURL: process.env.CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
  scope: ['profile', 'email'],
  passReqToCallback: true  // Important! Lets us check if user already existed
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google OAuth: User login attempt for:', profile.emails[0].value);

    // 1. First, try to find user by googleId OR email (important!)
    let user = await User.findOne({
      $or: [
        { googleId: profile.id },
        { email: profile.emails[0].value }
      ]
    });

    // 2. Existing user → just log them in (no new trial)
    if (user) {
      console.log('Existing user found:', user.email);
      
      // Optional: Link googleId if they signed up with email before
      if (!user.googleId) {
        user.googleId = profile.id;
        user.profile.avatar = profile.photos?.[0]?.value || user.profile.avatar;
        await user.save();
        console.log('Linked Google account to existing user');
      }

      return done(null, user);
    }

    // 3. NEW USER → Create with 7-day trial (only once!)
    console.log('Creating new user with 7-day free trial');

    user = new User({
      googleId: profile.id,
      email: profile.emails[0].value,
      profile: {
        name: profile.displayName,
        avatar: profile.photos?.[0]?.value || null
      },
      subscription: {
        hasUsedTrial: true,  // Mark trial as used immediately
        trialEndsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // +7 days
        isSubscribed: false
      }
    });

    await user.save();
    console.log('New user created with trial:', user.email);
    return done(null, user);

  } catch (error) {
    console.error('Error in Google OAuth strategy:', error);
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
