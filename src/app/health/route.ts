import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';

export async function GET(): Promise<NextResponse> {
  const health = {
    ok: true,
    timestamp: new Date().toISOString(),
    mongo: 'disconnected',
    vt: 'unconfigured',
    environment: {
      mongoUri: !!process.env.MONGODB_URI,
      jwtSecret: !!process.env.JWT_SECRET,
      vtApiKey: !!process.env.VT_API_KEY,
      nodeEnv: process.env.NODE_ENV || 'development'
    },
    errors: [] as string[]
  };

  // Check required environment variables
  if (!process.env.MONGODB_URI) {
    health.ok = false;
    health.errors.push('MONGODB_URI is missing');
  }

  if (!process.env.JWT_SECRET) {
    health.ok = false;
    health.errors.push('JWT_SECRET is missing');
  }

  try {
    await connectDB();
    health.mongo = 'connected';
  } catch (error) {
    console.error('MongoDB health check failed:', error);
    health.ok = false;
    health.mongo = 'error';
    health.errors.push(`MongoDB connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    if (process.env.VT_API_KEY && process.env.VT_API_KEY !== 'your-virustotal-api-key-here') {
      health.vt = 'configured';
    }
  } catch (error) {
    console.error('VT health check failed:', error);
  }

  const statusCode = health.ok ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}
