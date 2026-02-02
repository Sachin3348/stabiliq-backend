const mongoose = require('mongoose');

let db = null;

const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL;
    const dbName = process.env.DB_NAME;

    if (!mongoUrl || !dbName) {
      throw new Error('MONGO_URL and DB_NAME must be set in environment variables');
    }

    await mongoose.connect(mongoUrl, {
      dbName: dbName,
    });

    db = mongoose.connection.db;
    
    console.log(`✓ MongoDB connected: ${dbName}`);
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return db;
};

module.exports = {
  connectDB,
  disconnectDB,
  getDB,
  db: mongoose.connection,
};
