import mongoose from 'mongoose';
import logger from './logger'; // Assume you have a logger utility (e.g., Winston)
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || '';
const MAX_RETRIES = Number(process.env.MONGO_MAX_RETRIES) || 5;
const RETRY_DELAY_MS = Number(process.env.MONGO_RETRY_DELAY_MS) || 3000;

if (!MONGO_URI) {
  throw new Error('Missing MONGO_URI in environment variables');
}

/**
 * Connects to MongoDB with retry logic.
 * @param retriesLeft number of retries left
 */
async function connectWithRetry(retriesLeft = MAX_RETRIES): Promise<void> {
  try {
    await mongoose.connect(MONGO_URI, {
      // Recommended production options
      autoIndex: false,          // Disable autoIndex for performance; run manually in dev/migrations
      maxPoolSize: 10,           // Connection pool size
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000,    // Socket timeout
      family: 4,                 // Use IPv4, avoid IPv6 issues
      // Additional options can be added here
    });

    logger.info('✅ MongoDB connected successfully');
  } catch (error) {
    logger.error(`❌ MongoDB connection error: ${(error as Error).message}`);

    if (retriesLeft > 0) {
      logger.warn(`Retrying MongoDB connection in ${RETRY_DELAY_MS}ms... (${retriesLeft} attempts left)`);
      setTimeout(() => connectWithRetry(retriesLeft - 1), RETRY_DELAY_MS);
    } else {
      logger.error('Failed to connect to MongoDB after multiple attempts. Exiting process.');
      process.exit(1);
    }
  }
}

export default connectWithRetry;
