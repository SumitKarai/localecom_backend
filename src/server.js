require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport after other middleware
const passport = require('./config/passport');
app.use(passport.initialize());

// Routes
try {
  app.use('/api', require('./routes/tests'));
  console.log('✅ Test routes loaded successfully');
  
  app.use('/api/auth', require('./routes/auth'));
  console.log('✅ Auth routes loaded successfully');
  
  app.use('/', require('./routes/ui'));
  console.log('✅ UI routes loaded successfully');
  
  console.log('✅ User roles routes loaded successfully');
  console.log('✅ Seller routes loaded successfully');
  console.log('✅ Restaurant routes loaded successfully');
  console.log('✅ Menu items routes loaded successfully');
  console.log('✅ QR code routes loaded successfully');
  console.log('✅ Freelancer routes loaded successfully');

app.use('/api/profile', require('./routes/profile'));
app.use('/api/user-roles', require('./routes/userRoles'));
app.use('/api/stores', require('./routes/storesPublic'));
app.use('/api/stores/manage', require('./routes/stores'));
app.use('/api/sellers', require('./routes/sellers'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/products', require('./routes/products'));
app.use('/api/menu-items', require('./routes/menuItems'));
app.use('/api/qr-code', require('./routes/qrCode'));
app.use('/api/freelancers', require('./routes/freelancers'));
app.use('/api/reviews', require('./routes/reviews'));
} catch (error) {
  console.error('❌ Error loading routes:', error);
}

app.get('/', (req, res) => {
    res.json({ 
      message: 'Welcome to LocaleCom API',
      status: 'running',
      timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🌍 Frontend URL: ${process.env.FRONTEND_URL}`);
    console.log(`🔗 Test Google Auth: http://localhost:${PORT}/api/auth/google`);
});