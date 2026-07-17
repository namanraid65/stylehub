import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

let isConnected = false;

export const connectDB = async (): Promise<void> => {
  if (isConnected) {
    logger.info('MongoDB already connected — reusing existing connection');
    return;
  }

  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(env.MONGO_URI, {
      // Connection pool settings
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000, // Fail fast if server unreachable
      socketTimeoutMS: 45000,
      // Improved error clarity
      heartbeatFrequencyMS: 10000,
    });

    isConnected = true;
    logger.info(`✅  MongoDB connected → ${conn.connection.host} / ${conn.connection.name}`);

    // ─── Connection lifecycle events ─────────────────────────────────────────
    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      logger.info('♻️  MongoDB reconnected');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
  } catch (error) {
    logger.error('❌  Failed to connect to MongoDB:', error);
    // Crash intentionally — no point running without a DB
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (!isConnected) return;
  await mongoose.connection.close();
  isConnected = false;
  logger.info('MongoDB disconnected gracefully');
};
