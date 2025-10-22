const mongoose = require('mongoose');
require('dotenv').config();

async function dropIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    
    const db = mongoose.connection.db;
    const collection = db.collection('reviews');
    
    // Drop the problematic index
    await collection.dropIndex('userId_1_orderId_1');
    console.log('Successfully dropped userId_1_orderId_1 index');
    
    await mongoose.disconnect();
  } catch (error) {
    if (error.code === 27) {
      console.log('Index userId_1_orderId_1 does not exist');
    } else {
      console.error('Error dropping index:', error.message);
    }
    await mongoose.disconnect();
  }
}

dropIndex();