import { NextRequest, NextResponse } from 'next/server';
import { setAuthSession, getUserByFid } from '@/lib/redis';
import { generateId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, username, pfpUrl, signature, message } = body;
    
    // Validate required fields
    if (!fid || !username) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: fid, username',
      }, { status: 400 });
    }
    
    // In production, verify the SIWE signature here
    // For now, accept the authentication
    
    // Create session token
    const token = generateId();
    
    // Store session
    const sessionData = {
      fid,
      username,
      pfpUrl,
      token,
      createdAt: new Date().toISOString(),
    };
    
    await setAuthSession(token, sessionData);
    
    // Store/update user in Redis
    await getUserByFid(fid);
    
    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          fid,
          username,
          pfpUrl,
        },
      },
      message: 'Authentication successful',
    }, { status: 200 });
  } catch (error: any) {
    console.error('Auth callback error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Authentication failed',
    }, { status: 500 });
  }
}
