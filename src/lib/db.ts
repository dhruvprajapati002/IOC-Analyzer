import mongoose from 'mongoose';

// Use a simple interface for the cached connection
interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: CachedConnection | undefined;
}

function getMongoUri(): string {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    const error = new Error('MongoDB configuration is missing');
    (error as NodeJS.ErrnoException).code = 'MONGO_URI_MISSING';
    throw error;
  }
  return uri;
}

function maskMongoUri(uri: string): string {
  return uri.replace(/\/\/([^@]+)@/, '//***@');
}

let cached: CachedConnection = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  const mongoUri = getMongoUri();

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.info(`[MongoDB] Connecting to ${maskMongoUri(mongoUri)}`);
    cached.promise = mongoose.connect(mongoUri, opts);
  }

  try {
    cached.conn = await cached.promise;
    console.info('[MongoDB] Connected');
  } catch (e) {
    console.error('[MongoDB] Connection failed:', e);
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;

// Export getDatabase function for direct MongoDB database access
export async function getDatabase() {
  const conn = await connectDB();
  return conn.connection.db;
}
