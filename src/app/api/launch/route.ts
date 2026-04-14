import { NextRequest, NextResponse } from 'next/server';
import { setToken, getAllTokens } from '@/lib/redis';
import { getUserByFid } from '@/lib/neynar';
import { launchToken, getTokenPrice, getTokenStats } from '@/lib/bankr';
import { uploadJSONToIPFS } from '@/lib/pinata';
import { generateId } from '@/lib/utils';

// POST /api/launch - Launch token with full metadata via Bankr API
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
      metadata = {},
      farcasterCastHash,
    } = body;
    
    // Validate required fields
    if (!name || !symbol || !description || !launchedByFid) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, symbol, description, launchedByFid',
      }, { status: 400 });
    }
    
    // Validate symbol (uppercase, no spaces, 3-10 chars)
    const cleanSymbol = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanSymbol.length < 3 || cleanSymbol.length > 10) {
      return NextResponse.json({
        success: false,
        error: 'Symbol must be 3-10 alphanumeric characters',
      }, { status: 400 });
    }
    
    // Get launcher info from Neynar
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
      symbol: cleanSymbol,
      description,
      image: imageUrl,
      properties: {
        launchedBy: launcher.username,
        launchedByFid,
        agentId,
        launchedAt: new Date().toISOString(),
        platform: 'farcaster-miniapp',
        ...metadata
      },
      social_links: socialLinks || {},
    };
    
    // Upload to IPFS via Pinata
    let metadataUri = null;
    try {
      const ipfsUpload = await uploadJSONToIPFS(fullMetadata, `${cleanSymbol}_metadata`);
      if (ipfsUpload.success) {
        metadataUri = ipfsUpload.url;
      }
    } catch (ipfsError) {
      console.error('IPFS upload failed:', ipfsError);
      // Continue without IPFS - Bankr can handle this
    }
    
    // Launch token via Bankr API
    const launchResult = await launchToken({
      name,
      symbol: cleanSymbol,
      description,
      imageUrl: imageUrl || undefined,
      initialSupply: initialSupply || '1000000000', // 1B default
      agentWallet: launcher.custodyAddress || '',
      socialLinks,
      farcasterCastHash,
    });
    
    if (!launchResult.success) {
      return NextResponse.json({
        success: false,
        error: launchResult.error || 'Token launch failed via Bankr API',
      }, { status: 500 });
    }
    
    // Get initial price and stats
    let price = 0;
    let stats = null;
    if (launchResult.contractAddress) {
      try {
        price = await getTokenPrice(launchResult.contractAddress);
        stats = await getTokenStats(launchResult.contractAddress);
      } catch (e) {
        console.log('Could not fetch initial price/stats');
      }
    }
    
    // Create token record
    const token = {
      id: generateId(),
      name,
      symbol: cleanSymbol,
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
      poolAddress: launchResult.poolAddress,
      agentId,
      marketCap: stats?.marketCap || 0,
      volume24h: stats?.volume24h || 0,
      price: price,
      priceChange24h: stats?.priceChange24h || 0,
      holders: stats?.holders || 0,
    };
    
    // Save to Redis
    await setToken(token.id, token);
    
    return NextResponse.json({
      success: true,
      data: token,
      message: 'Token launched successfully on Base via Bankr',
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
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get('contractAddress');
    
    // If contractAddress provided, get specific token details
    if (contractAddress) {
      const [price, stats] = await Promise.all([
        getTokenPrice(contractAddress),
        getTokenStats(contractAddress),
      ]);
      
      return NextResponse.json({
        success: true,
        data: {
          price,
          ...stats,
        },
      }, { status: 200 });
    }
    
    // Otherwise return overall stats
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
