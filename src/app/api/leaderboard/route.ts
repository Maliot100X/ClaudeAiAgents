import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, updateLeaderboard } from '@/lib/redis';
import { getUserByFid, getUsersByFids } from '@/lib/neynar';

// GET /api/leaderboard - Get leaderboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const timeFrame = searchParams.get('timeFrame') || 'all'; // all, daily, weekly, monthly
    
    // Get leaderboard from Redis
    let leaderboard = await getLeaderboard(limit);
    
    // Fetch fresh user data from Neynar
    const fids = leaderboard.map(e => e.fid);
    if (fids.length > 0) {
      const users = await getUsersByFids(fids);
      const userMap = new Map(users.map(u => [u.fid, u]));
      
      // Merge user data with leaderboard entries
      leaderboard = leaderboard.map(entry => {
        const user = userMap.get(entry.fid);
        return {
          ...entry,
          username: user?.username || entry.username,
          displayName: user?.displayName,
          pfpUrl: user?.pfpUrl || entry.pfpUrl,
        };
      });
    }
    
    return NextResponse.json({
      success: true,
      data: leaderboard,
      timeFrame,
      count: leaderboard.length,
      updatedAt: new Date().toISOString(),
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch leaderboard',
    }, { status: 500 });
  }
}

// POST /api/leaderboard - Update leaderboard entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, score, tokensLaunched, totalVolume } = body;
    
    if (!fid || typeof score !== 'number') {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: fid, score',
      }, { status: 400 });
    }
    
    // Get user info
    const user = await getUserByFid(fid);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found on Farcaster',
      }, { status: 404 });
    }
    
    // Calculate rank change (simplified)
    const change24h = Math.floor(Math.random() * 20) - 10; // Mock change
    
    const entry = {
      fid,
      username: user.username,
      displayName: user.displayName,
      pfpUrl: user.pfpUrl,
      score,
      tokensLaunched: tokensLaunched || 0,
      totalVolume: totalVolume || 0,
      change24h,
    };
    
    await updateLeaderboard(entry);
    
    return NextResponse.json({
      success: true,
      data: entry,
      message: 'Leaderboard updated',
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating leaderboard:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update leaderboard',
    }, { status: 500 });
  }
}
