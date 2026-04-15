import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api-key';
import { getWalletBalance } from '@/lib/bankr';

export const dynamic = 'force-dynamic';

// GET /api/agents/wallet - Get agent's wallet balance
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
    
    // Get wallet balance from Bankr
    const balance = await getWalletBalance();
    
    return NextResponse.json({
      success: true,
      agentId: agent.id,
      agentName: agent.name,
      data: {
        address: agent.bankrWalletAddress,
        chain: 'base',
        balance: balance,
      },
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching agent wallet:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch wallet',
    }, { status: 500 });
  }
}
