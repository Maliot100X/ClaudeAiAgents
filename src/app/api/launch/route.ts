import { NextRequest, NextResponse } from 'next/server';
import { setToken, getAllTokens } from '@/lib/redis';
import { getUserByFid } from '@/lib/neynar';
import { launchTokenViaBankr, getTokenPrice, getTokenStats } from '@/lib/bankr';
import { uploadJSONToIPFS } from '@/lib/pinata';
import { generateId } from '@/lib/utils';

// POST /api/launch - Launch token via Bankr Partner Deploy API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      symbol, 
      description, 
      imageUrl,
      launchedByFid,
      agentId, // Link token to agent
      websiteUrl,
      twitterUrl,
      farcasterUsername,
      walletAddress, // User's wallet for fee recipient
      simulateOnly = false,
    } = body;
    
    // Validate required fields
    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Token name is required',
      }, { status: 400 });
    }
    
    // Must have either wallet address or Farcaster username for fee recipient
    if (!walletAddress && !farcasterUsername && !launchedByFid) {
      return NextResponse.json({
        success: false,
        error: 'Fee recipient required: provide walletAddress, farcasterUsername, or connect Farcaster',
      }, { status: 400 });
    }
    
    // Validate symbol (uppercase, no spaces, 1-10 chars)
    let cleanSymbol = symbol;
    if (cleanSymbol) {
      cleanSymbol = cleanSymbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (cleanSymbol.length > 10) {
        cleanSymbol = cleanSymbol.substring(0, 10);
      }
    }
    
    // Get launcher info from Neynar if FID provided
    let launcher = null;
    if (launchedByFid) {
      launcher = await getUserByFid(launchedByFid);
    }
    
    // Determine fee recipient
    let feeRecipientWallet = walletAddress;
    let feeRecipientFarcaster = farcasterUsername;
    
    if (launcher && !feeRecipientWallet && !feeRecipientFarcaster) {
      // Use Farcaster username from launcher
      feeRecipientFarcaster = launcher.username;
    }
    
    // Create metadata for IPFS
    const metadata = {
      name,
      symbol: cleanSymbol,
      description: description || '',
      image: imageUrl,
      properties: {
        launchedBy: launcher?.username || farcasterUsername || 'anonymous',
        launchedByFid: launchedByFid || null,
        launchedAt: new Date().toISOString(),
        platform: 'farcaster-miniapp',
      },
      links: {
        website: websiteUrl,
        twitter: twitterUrl,
      },
    };
    
    // Upload to IPFS (optional - Bankr handles this if not provided)
    let ipfsUrl = null;
    try {
      if (description || imageUrl) {
        const ipfsUpload = await uploadJSONToIPFS(metadata, `${name}_metadata`);
        if (ipfsUpload.success) {
          ipfsUrl = ipfsUpload.url;
        }
      }
    } catch (ipfsError) {
      console.log('IPFS upload optional, continuing...');
    }
    
    // Launch token via Bankr Partner API
    const launchResult = await launchTokenViaBankr({
      tokenName: name,
      tokenSymbol: cleanSymbol || undefined,
      description: description || undefined,
      image: imageUrl || undefined,
      websiteUrl: websiteUrl || undefined,
      tweetUrl: twitterUrl || undefined,
      walletAddress: feeRecipientWallet || undefined,
      farcasterUsername: feeRecipientFarcaster || undefined,
      simulateOnly,
    });
    
    if (!launchResult.success) {
      return NextResponse.json({
        success: false,
        error: launchResult.error || 'Token launch failed via Bankr Partner API',
      }, { status: 500 });
    }
    
    // If simulation mode, return predicted address
    if (simulateOnly) {
      return NextResponse.json({
        success: true,
        simulated: true,
        data: {
          predictedAddress: launchResult.tokenAddress,
          poolId: launchResult.poolId,
          feeDistribution: launchResult.feeDistribution,
        },
        message: 'Token deployment simulated. Predicted contract address received.',
      }, { status: 200 });
    }
    
    // Get initial price and stats
    let price = 0;
    let stats = null;
    if (launchResult.tokenAddress) {
      try {
        [price, stats] = await Promise.all([
          getTokenPrice(launchResult.tokenAddress),
          getTokenStats(launchResult.tokenAddress),
        ]);
      } catch (e) {
        console.log('Could not fetch initial price/stats');
      }
    }
    
    // Create token record
    const token = {
      id: generateId(),
      name,
      symbol: cleanSymbol || name.substring(0, 4).toUpperCase(),
      description: description || '',
      imageUrl: imageUrl || null,
      metadataUri: ipfsUrl,
      contractAddress: launchResult.tokenAddress || '',
      chain: 'base' as const,
      launchedBy: launcher?.username || farcasterUsername || 'unknown',
      launchedByFid: launchedByFid || 0,
      agentId: agentId || null,
      launchedAt: new Date().toISOString(),
      txHash: launchResult.txHash,
      poolId: launchResult.poolId,
      activityId: launchResult.activityId,
      marketCap: stats?.marketCap || 0,
      volume24h: stats?.volume24h || 0,
      price: price,
      priceChange24h: stats?.priceChange24h || 0,
      holders: stats?.holders || 0,
      feeDistribution: launchResult.feeDistribution,
    };
    
    // Save to Redis
    await setToken(token.id, token);
    
    return NextResponse.json({
      success: true,
      data: token,
      message: 'Token launched successfully on Base via Bankr Partner API',
      bankrUrl: `https://bankr.bot/token/${launchResult.tokenAddress}`,
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
