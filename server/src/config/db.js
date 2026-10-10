import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ENV } from './env.js';

let mongodInstance = null;

export const connectDB = async () => {
  try {
    let uri = ENV.MONGODB_URI;

    if (!uri) {
      console.log('⚡ No external MONGODB_URI provided. Initializing in-memory MongoDB instance...');
      mongodInstance = await MongoMemoryServer.create();
      uri = mongodInstance.getUri();
      console.log(`✅ In-memory MongoDB started at: ${uri}`);
    }

    const conn = await mongoose.connect(uri, {
      autoIndex: true,
    });

    console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (error) {
    console.error('Error closing database:', error);
  }
};
