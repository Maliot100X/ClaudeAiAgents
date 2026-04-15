import { NextRequest, NextResponse } from 'next/server';
import { redis, checkRedisConnection } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check Redis connection
    const redisConnected = await checkRedisConnection();
    
    // Check environment variables
    const envVars = {
      neynar: !!process.env.NEYNAR_API_KEY,
      alchemy: !!process.env.ALCHEMY_API_KEY,
      bankr: !!process.env.BANKR_API_KEY,
      redis: !!process.env.UPSTASH_REDIS_REST_URL,
      pinata: !!process.env.PINATA_JWT,
      walletconnect: !!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    };
    
    const allEnvOk = Object.values(envVars).every(v => v);
    
    return NextResponse.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        redis: redisConnected ? 'connected' : 'disconnected',
        apiKeys: envVars,
      },
      allServicesOk: redisConnected && allEnvOk,
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
