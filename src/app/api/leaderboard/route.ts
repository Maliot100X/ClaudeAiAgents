import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard as getRedisLeaderboard, saveGameScore, getGameLeaderboard as getRedisGameLeaderboard } from '@/lib/redis';
import { getLeaderboard as getBankrLeaderboard } from '@/lib/bankr';

// GET /api/leaderboard - Get leaderboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') as 'volume' | 'tokens' | 'reputation') || 'volume';
    const game = searchParams.get('game');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    // If game specified, return game leaderboard
    if (game) {
      const gameLeaderboard = await getRedisGameLeaderboard(game, limit);
      return NextResponse.json({
        success: true,
        data: gameLeaderboard,
        game,
      }, { status: 200 });
    }
    
    // Try Bankr API first for main leaderboard
    let leaderboard = await getBankrLeaderboard(type, limit);
    
    // Fallback to Redis if Bankr fails
    if (!leaderboard || leaderboard.length === 0) {
      leaderboard = await getRedisLeaderboard(limit);
    }
    
    return NextResponse.json({
      success: true,
      data: leaderboard,
      type,
      count: leaderboard.length,
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch leaderboard',
    }, { status: 500 });
  }
}

// POST /api/leaderboard - Submit score
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, score, game, username, pfpUrl } = body;
    
    if (!fid || typeof score !== 'number') {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: fid, score',
      }, { status: 400 });
    }
    
    // If game specified, save game score
    if (game) {
      await saveGameScore(game, fid, score);
      
      return NextResponse.json({
        success: true,
        message: 'Score saved successfully',
        data: { fid, game, score },
      }, { status: 201 });
    }
    
    // Otherwise update general leaderboard (via Redis)
    const entry = {
      fid,
      username: username || `FID:${fid}`,
      pfpUrl,
      score,
      tokensLaunched: 0,
      totalVolume: 0,
      updatedAt: new Date().toISOString(),
    };
    
    // This would typically update the leaderboard in Redis
    // Implementation depends on your scoring logic
    
    return NextResponse.json({
      success: true,
      message: 'Leaderboard entry updated',
      data: entry,
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error saving score:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to save score',
    }, { status: 500 });
  }
}
