// config/db.js - MongoDB Connection (FIXED VERSION)
const mongoose = require("mongoose");

let cachedConnection = null;
let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY = 3000;

const connectDB = async () => {
  // Return cached connection
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  try {
    if (!process.env.MONGO_URI) {
      throw new Error('❌ MONGO_URI not defined in .env file');
    }

    // Validate URI format
    if (!/^mongodb(\+srv)?:\/\/.+/.test(process.env.MONGO_URI)) {
      throw new Error('❌ Invalid MongoDB URI format');
    }

    console.log('🔄 Connecting to MongoDB...');

    // FIXED: Different settings for development vs production
    const isDevelopment = process.env.NODE_ENV !== 'production';

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // CONNECTION POOL
      maxPoolSize: isDevelopment ? 50 : 250,
      minPoolSize: isDevelopment ? 10 : 100,
      maxIdleTimeMS: 20000,
      
      // TIMEOUTS
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 10000,
      
      // HEARTBEAT
      heartbeatFrequencyMS: 3000,
      
      // RELIABILITY
      retryWrites: true,
      retryReads: true,
      w: 'majority',
      readPreference: 'primary',
      readConcern: { level: 'majority' },
      
      // PERFORMANCE
      compressors: ['zlib', 'snappy'],
      maxConnecting: 30,
      
      // 🔥 CRITICAL FIX: Enable auto-index in development!
      autoIndex: isDevelopment, // true in dev, false in prod
      autoCreate: isDevelopment, // true in dev, false in prod
    });

    // Global Mongoose settings
    mongoose.set('maxTimeMS', 15000);
    mongoose.set('strictQuery', false);
    mongoose.set('bufferCommands', false);
    mongoose.set('debug', isDevelopment);

    cachedConnection = conn;
    connectionAttempts = 0;
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Pool: Min ${isDevelopment ? 10 : 100}, Max ${isDevelopment ? 50 : 250} connections`);
    console.log(`⚡ Auto-index: ${isDevelopment ? 'ENABLED' : 'DISABLED'}`);
    console.log(`⚡ Auto-create: ${isDevelopment ? 'ENABLED' : 'DISABLED'}\n`);

    // Event handlers
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err.message);
      cachedConnection = null;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
      cachedConnection = null;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
      cachedConnection = mongoose.connection;
    });

    return conn;

  } catch (error) {
    connectionAttempts++;
    console.error(`❌ Connection failed (${connectionAttempts}/${MAX_RETRY_ATTEMPTS}): ${error.message}`);
    
    cachedConnection = null;

    // Retry logic
    if (connectionAttempts < MAX_RETRY_ATTEMPTS) {
      const delay = RETRY_DELAY * Math.pow(1.5, connectionAttempts - 1);
      console.log(`🔄 Retry in ${(delay/1000).toFixed(1)}s...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectDB();
    }

    console.error('❌ Max retries reached. Exiting...');
    process.exit(1);
  }
};

// Graceful cleanup
const cleanup = async (signal) => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close(false);
    console.log(`✅ MongoDB closed (${signal})`);
    process.exit(0);
  }
};

process.on('SIGINT', () => cleanup('SIGINT'));
process.on('SIGTERM', () => cleanup('SIGTERM'));

module.exports = connectDB;