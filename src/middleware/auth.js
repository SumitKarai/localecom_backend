const passport = require('../config/passport');

// Middleware to protect routes with JWT
const authenticateJWT = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      console.error('❌ JWT authentication error:', err);
      return res.status(500).json({ error: 'Authentication error' });
    }
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Valid JWT token required' 
      });
    }
    
    req.user = user;
    next();
  })(req, res, next);
};

// Middleware to check user roles
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `Required role: ${roles.join(' or ')}` 
      });
    }
    
    next();
  };
};

module.exports = {
  authenticateJWT,
  requireRole
};