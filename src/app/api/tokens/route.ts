import { NextRequest, NextResponse } from 'next/server';
import { getAllTokens, setToken, getToken } from '@/lib/redis';
import { getUserByFid } from '@/lib/neynar';
import { launchToken } from '@/lib/bankr';
import { uploadFileToIPFS, uploadJSONToIPFS } from '@/lib/pinata';
import { generateId } from '@/lib/utils';

// GET /api/tokens - List all tokens
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const launchedBy = searchParams.get('launchedBy');
    const sortBy = searchParams.get('sortBy') || 'launchedAt';
    
    let tokens = await getAllTokens();
    
    // Filter by launcher if specified
    if (launchedBy) {
      tokens = tokens.filter(t => t.launchedByFid === parseInt(launchedBy));
    }
    
    // Sort tokens
    tokens.sort((a, b) => {
      if (sortBy === 'marketCap') return (b.marketCap || 0) - (a.marketCap || 0);
      if (sortBy === 'volume') return (b.volume24h || 0) - (a.volume24h || 0);
      return new Date(b.launchedAt).getTime() - new Date(a.launchedAt).getTime();
    });
    
    return NextResponse.json({
      success: true,
      data: tokens,
      count: tokens.length,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch tokens',
    }, { status: 500 });
  }
}

// POST /api/tokens - Launch new token
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
      agentWallet,
      socialLinks 
    } = body;
    
    // Validate required fields
    if (!name || !symbol || !description || !launchedByFid) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
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
    
    // Upload metadata to IPFS if needed
    let metadataUrl = imageUrl;
    if (imageUrl && !imageUrl.startsWith('http')) {
      // Assume it's a base64 or file reference
      // In production, handle file upload properly
      const upload = await uploadJSONToIPFS({
        name,
        symbol,
        description,
        image: imageUrl,
      });
      metadataUrl = upload.success ? upload.url : null;
    }
    
    // Launch token via Bankr
    const launchResult = await launchToken({
      name,
      symbol,
      description,
      imageUrl: metadataUrl || undefined,
      initialSupply: initialSupply || '1000000',
      agentWallet: agentWallet || launcher.custodyAddress || '',
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
      symbol,
      description,
      imageUrl: metadataUrl,
      contractAddress: launchResult.contractAddress || '',
      chain: 'base' as const,
      launchedBy: launcher.username,
      launchedByFid,
      launchedAt: new Date().toISOString(),
      totalSupply: initialSupply || '1000000',
      txHash: launchResult.txHash,
    };
    
    // Save to Redis
    await setToken(token.id, token);
    
    return NextResponse.json({
      success: true,
      data: token,
      message: 'Token launched successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error launching token:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to launch token',
    }, { status: 500 });
  }
}
