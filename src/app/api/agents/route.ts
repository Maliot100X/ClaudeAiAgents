import { NextRequest, NextResponse } from 'next/server';
import { getAllAgents, setAgent, getAgent } from '@/lib/redis';
import { getUserByFid } from '@/lib/neynar';
import { createAgentWallet, registerAgent, getAgentDetails } from '@/lib/bankr';
import { generateId } from '@/lib/utils';

// GET /api/agents - List all agents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerFid = searchParams.get('ownerFid');
    const agentId = searchParams.get('agentId');
    
    // If specific agent requested
    if (agentId) {
      // Try Redis first
      let agent = await getAgent(agentId);
      
      // If not in Redis, try Bankr API
      if (!agent) {
        const bankrAgent = await getAgentDetails(agentId);
        if (bankrAgent) {
          agent = bankrAgent;
        }
      }
      
      if (!agent) {
        return NextResponse.json({
          success: false,
          error: 'Agent not found',
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        data: agent,
      }, { status: 200 });
    }
    
    // Get all agents
    let agents = await getAllAgents();
    
    // Filter by owner if specified
    if (ownerFid) {
      agents = agents.filter(a => a.ownerFid === parseInt(ownerFid));
    }
    
    // Sort by reputation (highest first)
    agents.sort((a, b) => (b.reputation || 0) - (a.reputation || 0));
    
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
    
    if (!skills || skills.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Please select at least one skill',
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
    
    // Generate agent ID
    const agentId = generateId();
    
    // Create Bankr wallet for agent
    const wallet = await createAgentWallet(agentId, 'base');
    
    if (!wallet) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create agent wallet via Bankr API',
      }, { status: 500 });
    }
    
    // Register with Bankr API
    const bankrRegistration = await registerAgent({
      name,
      description,
      ownerFid,
      ownerUsername: owner.username,
      skills,
      imageUrl,
    });
    
    // Create agent record
    const agent = {
      id: agentId,
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
      bankrWalletAddress: wallet.address,
      bankrWalletId: wallet.walletId,
      bankrAgentId: bankrRegistration.agentId || null,
      bankrRegistered: bankrRegistration.success,
    };
    
    // Save to Redis
    await setAgent(agent.id, agent);
    
    return NextResponse.json({
      success: true,
      data: agent,
      message: bankrRegistration.success 
        ? 'Agent created and registered with Bankr successfully' 
        : 'Agent created locally (Bankr registration pending)',
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating agent:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create agent',
    }, { status: 500 });
  }
}
