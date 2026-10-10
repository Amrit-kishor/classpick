import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ENV } from './env.js';

let mongodInstance = null;

export const connectDB = async () => {
  let uri = ENV.MONGODB_URI;

  if (!uri) {
    if (ENV.NODE_ENV === 'production' || !ENV.ALLOW_IN_MEMORY_DB) {
      throw new Error(
        'FATAL: MONGODB_URI is required in production. In-memory database fallback is strictly disabled.'
      );
    }

    console.log('⚡ No external MONGODB_URI provided. Initializing in-memory MongoDB instance for development/testing...');
    mongodInstance = await MongoMemoryServer.create();
    uri = mongodInstance.getUri();
    console.log(`✅ In-memory MongoDB running at: ${uri}`);
  }

  const conn = await mongoose.connect(uri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 8000,
  });

  mongoose.connection.on('error', (err) => {
    console.error(`❌ MongoDB Runtime Connection Error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected.');
  });

  console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
  return conn;
};

export const closeDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    if (mongodInstance) {
      await mongodInstance.stop();
      mongodInstance = null;
    }
  } catch (error) {
    console.error('Error closing database connection:', error.message);
  }
};
