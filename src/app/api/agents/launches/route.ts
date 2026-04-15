import { NextRequest, NextResponse } from 'next/server';
import { getAllTokens } from '@/lib/redis';
import { validateApiKey } from '@/lib/api-key';

export const dynamic = 'force-dynamic';

// GET /api/agents/launches - Get agent's token launches (alias for /api/agents/launch GET)
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
