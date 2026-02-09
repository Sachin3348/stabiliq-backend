import mongoose from 'mongoose';
import { env } from './env';

let db: mongoose.mongo.Db | null = null;

export async function connectDB(): Promise<mongoose.mongo.Db> {
  const { MONGO_URL, DB_NAME } = env;
  if (!MONGO_URL || !DB_NAME) {
    throw new Error('MONGO_URL and DB_NAME must be set in environment variables');
  }
  await mongoose.connect(MONGO_URL, { dbName: DB_NAME });
  const connectionDb = mongoose.connection.db;
  if (!connectionDb) {
    throw new Error('MongoDB connection failed: no db instance');
  }
  db = connectionDb;
  console.log(`✓ MongoDB connected: ${DB_NAME}`);
  return db;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
}

export function getDB(): mongoose.mongo.Db {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return db;
}
