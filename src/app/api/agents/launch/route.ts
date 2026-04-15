import { NextRequest, NextResponse } from 'next/server';
import { setToken, getAllTokens } from '@/lib/redis';
import { validateApiKey } from '@/lib/api-key';
import { launchTokenViaBankr, getTokenPrice, getTokenStats } from '@/lib/bankr';
import { uploadJSONToIPFS } from '@/lib/pinata';
import { generateId } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// POST /api/agents/launch - Launch token via agent's API key
export async function POST(request: NextRequest) {
  try {
    // Get API key from header
    const apiKey = request.headers.get('x-api-key');
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API key required. Include x-api-key header.',
      }, { status: 401 });
    }
    
    // Validate API key and get agent
    const agent = await validateApiKey(apiKey);
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: 'Invalid API key',
      }, { status: 401 });
    }
    
    const body = await request.json();
    const { 
      tokenName, 
      tokenSymbol, 
      description, 
      image,
      websiteUrl,
      tweetUrl,
      farcasterUsername,
      walletAddress,
      simulateOnly = false,
    } = body;
    
    // Validate required fields
    if (!tokenName) {
      return NextResponse.json({
        success: false,
        error: 'Token name is required',
      }, { status: 400 });
    }
    
    // Must have fee recipient (agent's wallet, Farcaster username, or provided wallet)
    const feeRecipientWallet = walletAddress || agent.bankrWalletAddress;
    const feeRecipientFarcaster = farcasterUsername || agent.ownerUsername;
    
    if (!feeRecipientWallet && !feeRecipientFarcaster) {
      return NextResponse.json({
        success: false,
        error: 'Fee recipient required: provide walletAddress or farcasterUsername',
      }, { status: 400 });
    }
    
    // Clean symbol
    let cleanSymbol = tokenSymbol;
    if (cleanSymbol) {
      cleanSymbol = cleanSymbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (cleanSymbol.length > 10) {
        cleanSymbol = cleanSymbol.substring(0, 10);
      }
    }
    
    // Create metadata for IPFS
    const metadata = {
      name: tokenName,
      symbol: cleanSymbol,
      description: description || '',
      image: image,
      properties: {
        launchedBy: agent.name,
        launchedByFid: agent.ownerFid,
        agentId: agent.id,
        launchedAt: new Date().toISOString(),
        platform: 'bankr-launch',
      },
      links: {
        website: websiteUrl,
        twitter: tweetUrl,
      },
    };
    
    // Upload to IPFS (optional)
    let ipfsUrl = null;
    try {
      if (description || image) {
        const ipfsUpload = await uploadJSONToIPFS(metadata, `${tokenName}_metadata`);
        if (ipfsUpload.success) {
          ipfsUrl = ipfsUpload.url;
        }
      }
    } catch (ipfsError) {
      console.log('IPFS upload optional, continuing...');
    }
    
    // Launch token via Bankr Partner API
    const launchResult = await launchTokenViaBankr({
      name: tokenName,
      symbol: cleanSymbol || undefined,
      description: description || undefined,
      imageUrl: image || undefined,
      website: websiteUrl || undefined,
      twitter: tweetUrl || undefined,
      chain: 'base',
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
        agentId: agent.id,
        agentName: agent.name,
        data: {
          predictedAddress: launchResult.contractAddress,
          txHash: launchResult.txHash,
        },
        message: 'Token deployment simulated. Predicted contract address received.',
      }, { status: 200 });
    }
    
    // Get initial price and stats
    let price = 0;
    let stats = null;
    if (launchResult.contractAddress) {
      try {
        [price, stats] = await Promise.all([
          getTokenPrice(launchResult.contractAddress),
          getTokenStats(launchResult.contractAddress),
        ]);
      } catch (e) {
        console.log('Could not fetch initial price/stats');
      }
    }
    
    // Create token record linked to agent
    const token = {
      id: generateId(),
      name: tokenName,
      symbol: cleanSymbol || tokenName.substring(0, 4).toUpperCase(),
      description: description || '',
      imageUrl: image || null,
      metadataUri: ipfsUrl,
      contractAddress: launchResult.contractAddress || '',
      chain: 'base' as const,
      launchedBy: agent.name,
      launchedByFid: agent.ownerFid,
      agentId: agent.id,
      launchedAt: new Date().toISOString(),
      txHash: launchResult.txHash,
      marketCap: stats?.marketCap || 0,
      volume24h: stats?.volume24h || 0,
      price: price,
      priceChange24h: stats?.priceChange24h || 0,
      holders: stats?.holders || 0,
    };
    
    // Save to Redis
    await setToken(token.id, token);
    
    // Update agent's token count
    const { setAgent } = await import('@/lib/redis');
    const updatedAgent = {
      ...agent,
      tokensLaunched: (agent.tokensLaunched || 0) + 1,
      totalVolume: (agent.totalVolume || 0) + (stats?.volume24h || 0),
      lastLaunchAt: new Date().toISOString(),
    };
    await setAgent(agent.id, updatedAgent);
    
    return NextResponse.json({
      success: true,
      agentId: agent.id,
      agentName: agent.name,
      data: token,
      message: 'Token launched successfully on Base via Bankr Partner API',
      bankrUrl: `https://bankr.bot/token/${launchResult.contractAddress}`,
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error in agent launch:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to launch token',
    }, { status: 500 });
  }
}

// GET /api/agents/launch - Get agent's launches
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API key required',
      }, { status: 401 });
    }
    
    // Validate API key and get agent
    const agent = await validateApiKey(apiKey);
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: 'Invalid API key',
      }, { status: 401 });
    }
    
    // Get all tokens
    const tokens = await getAllTokens();
    
    // Filter tokens by agent
    const agentTokens = tokens.filter(t => t.agentId === agent.id);
    
    // Sort by launch date (newest first)
    agentTokens.sort((a, b) => 
      new Date(b.launchedAt).getTime() - new Date(a.launchedAt).getTime()
    );
    
    return NextResponse.json({
      success: true,
      agentId: agent.id,
      agentName: agent.name,
      count: agentTokens.length,
      data: agentTokens,
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching agent launches:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch launches',
    }, { status: 500 });
  }
}
