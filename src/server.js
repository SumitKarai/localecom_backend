require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

app.use('/api/profile', require('./routes/profile'));
app.use('/api/stores', require('./routes/storesPublic'));
app.use('/api/stores/manage', require('./routes/stores'));
app.use('/api/products', require('./routes/products'));
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