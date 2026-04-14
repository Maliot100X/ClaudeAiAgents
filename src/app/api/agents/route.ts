import { NextRequest, NextResponse } from 'next/server';
import { getAllAgents, setAgent, getAgent } from '@/lib/redis';
import { getUserByFid } from '@/lib/neynar';
import { createAgentWallet } from '@/lib/bankr';
import { generateId } from '@/lib/utils';

// GET /api/agents - List all agents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerFid = searchParams.get('ownerFid');
    
    let agents = await getAllAgents();
    
    // Filter by owner if specified
    if (ownerFid) {
      agents = agents.filter(a => a.ownerFid === parseInt(ownerFid));
    }
    
    // Sort by reputation
    agents.sort((a, b) => b.reputation - a.reputation);
    
    return NextResponse.json({
      success: true,
      data: agents,
      count: agents.length,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch agents',
    }, { status: 500 });
  }
}

// POST /api/agents - Create new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, skills, ownerFid, imageUrl } = body;
    
    // Validate required fields
    if (!name || !description || !ownerFid) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, description, ownerFid',
      }, { status: 400 });
    }
    
    // Get owner info from Neynar
    const owner = await getUserByFid(ownerFid);
    if (!owner) {
      return NextResponse.json({
        success: false,
        error: 'Owner not found on Farcaster',
      }, { status: 404 });
    }
    
    // Create Bankr wallet for agent
    const wallet = await createAgentWallet(generateId(), 'base');
    
    // Create agent
    const agent = {
      id: generateId(),
      name,
      description,
      imageUrl: imageUrl || null,
      ownerFid,
      ownerUsername: owner.username,
      skills: skills || [],
      reputation: 0,
      tokensLaunched: 0,
      totalVolume: 0,
      createdAt: new Date().toISOString(),
      isActive: true,
      bankrWalletAddress: wallet?.address || null,
    };
    
    // Save to Redis
    await setAgent(agent.id, agent);
    
    return NextResponse.json({
      success: true,
      data: agent,
      message: 'Agent created successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating agent:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create agent',
    }, { status: 500 });
  }
}
