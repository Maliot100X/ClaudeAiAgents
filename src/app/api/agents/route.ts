import { NextRequest, NextResponse } from 'next/server';
import { getAllAgents, setAgent, getAgent, getAllTokens } from '@/lib/redis';
import { getUserByFid } from '@/lib/neynar';
import { createAgentWallet, registerAgent, getAgentDetails } from '@/lib/bankr';
import { generateApiKey, hashApiKey, validateApiKey } from '@/lib/api-key';
import { generateId } from '@/lib/utils';

export const dynamic = 'force-dynamic';


// GET /api/agents - List all agents or get specific agent
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerFid = searchParams.get('ownerFid');
    const agentId = searchParams.get('agentId');
    const me = searchParams.get('me');
    const apiKey = request.headers.get('x-api-key');
    
    // If /api/agents/me - return current agent by API key
    if (me === 'true' && apiKey) {
      const agent = await validateApiKey(apiKey);
      if (!agent) {
        return NextResponse.json({
          success: false,
          error: 'Invalid API key',
        }, { status: 401 });
      }
      
      // Get agent's tokens
      const tokens = await getAllTokens();
      const agentTokens = tokens.filter(t => t.agentId === agent.id);
      
      return NextResponse.json({
        success: true,
        data: {
          ...agent,
          apiKey: undefined, // Don't return API key
          apiKeyHash: undefined,
          launches: agentTokens,
        },
      }, { status: 200 });
    }
    
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
      
      // Get agent's tokens
      const tokens = await getAllTokens();
      const agentTokens = tokens.filter(t => t.agentId === agentId);
      
      return NextResponse.json({
        success: true,
        data: {
          ...agent,
          apiKey: undefined,
          apiKeyHash: undefined,
          launches: agentTokens,
        },
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
    
    // Remove sensitive data
    const publicAgents = agents.map(a => ({
      ...a,
      apiKey: undefined,
      apiKeyHash: undefined,
    }));
    
    return NextResponse.json({
      success: true,
      data: publicAgents,
      count: publicAgents.length,
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch agents',
    }, { status: 500 });
  }
}

// POST /api/agents/register - Create new agent
export async function POST(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url);
    
    // Handle /api/agents/register path
    if (pathname.endsWith('/register')) {
      return handleRegister(request);
    }
    
    // Handle /api/agents/{id}/update path
    const updateMatch = pathname.match(/\/api\/agents\/([^/]+)\/update/);
    if (updateMatch) {
      return handleUpdate(request, updateMatch[1]);
    }
    
    // Default: create agent
    return handleRegister(request);
    
  } catch (error: any) {
    console.error('Error in agents POST:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process request',
    }, { status: 500 });
  }
}

async function handleRegister(request: NextRequest) {
  const body = await request.json();
  const { name, description, skills, ownerFid, ownerUsername, imageUrl } = body;
  
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
  
  // Get owner info from Neynar (optional - use provided username if fails)
  let owner = null;
  try {
    owner = await getUserByFid(ownerFid);
  } catch (error) {
    console.log('Neynar lookup failed, using provided username');
  }
  
  // Use provided username or fallback
  const finalOwnerUsername = ownerUsername || owner?.username || `fid_${ownerFid}`;
  
  // Generate unique agent ID and API key
  const agentId = generateId();
  const apiKey = generateApiKey();
  const apiKeyHash = hashApiKey(apiKey);
  
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
    ownerUsername: finalOwnerUsername,
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
    ownerUsername: finalOwnerUsername,
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
    apiKey: apiKey, // Store plain for now (encrypt in production)
    apiKeyHash: apiKeyHash,
  };
  
  // Save to Redis
  await setAgent(agent.id, agent);
  
  return NextResponse.json({
    success: true,
    apiKey: apiKey, // Return API key ONCE
    agentId: agent.id,
    walletAddress: wallet.address,
    message: 'Agent registered successfully. Save your API key - it will not be shown again.',
    nextSteps: {
      viewProfile: `https://claude-mini-app.vercel.app/agent/${agent.id}`,
      launchToken: 'Use your API key to launch tokens via POST /api/agents/launch',
    },
  }, { status: 201 });
}

async function handleUpdate(request: NextRequest, agentId: string) {
  const apiKey = request.headers.get('x-api-key');
  
  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: 'API key required',
    }, { status: 401 });
  }
  
  // Validate API key
  const agent = await validateApiKey(apiKey);
  if (!agent || agent.id !== agentId) {
    return NextResponse.json({
      success: false,
      error: 'Invalid API key or agent ID',
    }, { status: 401 });
  }
  
  const body = await request.json();
  const { description, imageUrl, skills } = body;
  
  // Update agent
  const updatedAgent = {
    ...agent,
    description: description || agent.description,
    imageUrl: imageUrl || agent.imageUrl,
    skills: skills || agent.skills,
    updatedAt: new Date().toISOString(),
  };
  
  await setAgent(agentId, updatedAgent);
  
  return NextResponse.json({
    success: true,
    data: {
      ...updatedAgent,
      apiKey: undefined,
      apiKeyHash: undefined,
    },
    message: 'Agent profile updated successfully',
  }, { status: 200 });
}
