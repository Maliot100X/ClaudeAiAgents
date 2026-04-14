import { NextRequest, NextResponse } from 'next/server';
import { setToken, getAllTokens } from '@/lib/redis';
import { getUserByFid } from '@/lib/neynar';
import { launchToken } from '@/lib/bankr';
import { uploadJSONToIPFS } from '@/lib/pinata';
import { generateId } from '@/lib/utils';

// POST /api/launch - Launch token with full metadata
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      symbol, 
      description, 
      imageUrl,
      initialSupply,
      launchedByFid,
      agentId,
      socialLinks,
      metadata = {}
    } = body;
    
    // Validate required fields
    if (!name || !symbol || !description || !launchedByFid) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, symbol, description, launchedByFid',
      }, { status: 400 });
    }
    
    // Get launcher info
    const launcher = await getUserByFid(launchedByFid);
    if (!launcher) {
      return NextResponse.json({
        success: false,
        error: 'Launcher not found on Farcaster',
      }, { status: 404 });
    }
    
    // Create full metadata for IPFS
    const fullMetadata = {
      name,
      symbol,
      description,
      image: imageUrl,
      properties: {
        launchedBy: launcher.username,
        launchedByFid,
        agentId,
        launchedAt: new Date().toISOString(),
        ...metadata
      },
      social_links: socialLinks || {},
    };
    
    // Upload to IPFS
    const ipfsUpload = await uploadJSONToIPFS(fullMetadata, `${symbol}_metadata`);
    const metadataUri = ipfsUpload.success ? ipfsUpload.url : null;
    
    // Launch token via Bankr
    const launchResult = await launchToken({
      name,
      symbol,
      description,
      imageUrl: imageUrl || undefined,
      initialSupply: initialSupply || '1000000000', // 1B default
      agentWallet: launcher.custodyAddress || '',
      socialLinks,
    });
    
    if (!launchResult.success) {
      return NextResponse.json({
        success: false,
        error: launchResult.error || 'Token launch failed',
      }, { status: 500 });
    }
    
    // Create token record
    const token = {
      id: generateId(),
      name,
      symbol: symbol.toUpperCase(),
      description,
      imageUrl: imageUrl || null,
      metadataUri,
      contractAddress: launchResult.contractAddress || '',
      chain: 'base' as const,
      launchedBy: launcher.username,
      launchedByFid,
      launchedAt: new Date().toISOString(),
      totalSupply: initialSupply || '1000000000',
      txHash: launchResult.txHash,
      agentId,
      marketCap: 0,
      volume24h: 0,
      price: 0,
      holders: 0,
    };
    
    // Save to Redis
    await setToken(token.id, token);
    
    return NextResponse.json({
      success: true,
      data: token,
      message: 'Token launched successfully on Base',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error in launch:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to launch token',
    }, { status: 500 });
  }
}

// GET /api/launch/stats - Get launch stats
export async function GET(request: NextRequest) {
  try {
    const tokens = await getAllTokens();
    
    const stats = {
      totalLaunches: tokens.length,
      totalVolume: tokens.reduce((acc, t) => acc + (t.volume24h || 0), 0),
      totalMarketCap: tokens.reduce((acc, t) => acc + (t.marketCap || 0), 0),
      recentLaunches: tokens
        .sort((a, b) => new Date(b.launchedAt).getTime() - new Date(a.launchedAt).getTime())
        .slice(0, 5),
    };
    
    return NextResponse.json({
      success: true,
      data: stats,
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
