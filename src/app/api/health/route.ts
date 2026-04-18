/**
 * API Health Check Endpoint
 * Returns service status and availability
 */
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      mongodb: { status: 'unknown', latency: 0 },
      virusTotal: { 
        status: 'configured', 
        available: !!(process.env.VIRUSTOTAL_API_KEY || process.env.VIRUSTOTAL_API_KEY_1 || process.env.VIRUSTOTAL_API_KEY_2 || process.env.VIRUSTOTAL_API_KEY_3),
        keysConfigured: [
          process.env.VIRUSTOTAL_API_KEY,
          process.env.VIRUSTOTAL_API_KEY_1,
          process.env.VIRUSTOTAL_API_KEY_2,
          process.env.VIRUSTOTAL_API_KEY_3,
        ].filter(Boolean).length
      },
      abuseIPDB: { status: 'configured', available: !!process.env.ABUSEIPDB_API_KEY },
      greyNoise: { status: 'configured', available: !!process.env.GREYNOISE_API_KEY },
      malwareBazaar: { status: 'configured', available: !!process.env.MALWAREBAZAAR_API_KEY },
      ipqs: { status: 'configured', available: !!process.env.IPQS_API_KEY },
      threatFox: { status: 'configured', available: true }, // ThreatFox is public API
      urlhaus: { status: 'configured', available: true }, // URLhaus is public API
    },
    responseTime: 0,
  };

  // Check MongoDB
  try {
    const mongoStart = Date.now();
    await connectDB();
    health.services.mongodb.status = 'healthy';
    health.services.mongodb.latency = Date.now() - mongoStart;
  } catch (error) {
    health.services.mongodb.status = 'unhealthy';
    health.status = 'degraded';
  }

  health.responseTime = Date.now() - startTime;

  // Return appropriate status code
  const statusCode = health.status === 'ok' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
