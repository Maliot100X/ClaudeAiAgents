import axios from 'axios';
import type { BankrWallet, TokenLaunchResult } from '@/types';

const BANKR_API_URL = process.env.BANKR_API_URL || 'https://api.bankr.io';
const API_KEY = process.env.BANKR_API_KEY || '';

const api = axios.create({
  baseURL: BANKR_API_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  },
  timeout: 30000, // 30 second timeout
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Bankr API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      endpoint: error.config?.url,
    });
    return Promise.reject(error);
  }
);

// Create a new wallet for an agent
export async function createAgentWallet(agentId: string, chain: string = 'base'): Promise<BankrWallet | null> {
  try {
    console.log(`Creating wallet for agent ${agentId} on ${chain}`);
    
    const response = await api.post('/v1/wallets', {
      agentId,
      chain,
      type: 'agent',
      metadata: {
        createdBy: 'farcaster-miniapp',
        createdAt: new Date().toISOString(),
      },
    });
    
    if (!response.data?.address) {
      console.error('Invalid wallet response:', response.data);
      return null;
    }
    
    return {
      address: response.data.address,
      chain: response.data.chain || chain,
      createdAt: response.data.createdAt || new Date().toISOString(),
      walletId: response.data.walletId || response.data.id,
    };
  } catch (error: any) {
    console.error('Error creating agent wallet:', error.message);
    // Return mock data for development if API fails
    if (process.env.NODE_ENV === 'development') {
      console.log('Returning mock wallet for development');
      return {
        address: '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        chain: chain,
        createdAt: new Date().toISOString(),
        walletId: `mock_${agentId}`,
      };
    }
    return null;
  }
}

// Get wallet by agent ID
export async function getAgentWallet(agentId: string): Promise<BankrWallet | null> {
  try {
    const response = await api.get(`/v1/wallets/agent/${agentId}`);
    
    if (!response.data?.address) {
      return null;
    }
    
    return {
      address: response.data.address,
      chain: response.data.chain,
      createdAt: response.data.createdAt,
      walletId: response.data.walletId || response.data.id,
    };
  } catch (error: any) {
    console.error('Error fetching agent wallet:', error.message);
    return null;
  }
}

// Get wallet balance
export async function getWalletBalance(address: string, chain: string = 'base'): Promise<{ 
  native: string; 
  tokens: Array<{ symbol: string; balance: string; usdValue?: string }> 
}> {
  try {
    const response = await api.get(`/v1/wallets/${address}/balance`, {
      params: { chain },
    });
    
    return {
      native: response.data.native || '0',
      tokens: response.data.tokens || [],
    };
  } catch (error: any) {
    console.error('Error fetching wallet balance:', error.message);
    return { native: '0', tokens: [] };
  }
}

// Execute token launch via Bankr API
export async function launchToken(params: {
  name: string;
  symbol: string;
  description: string;
  imageUrl?: string;
  initialSupply: string;
  agentWallet: string;
  socialLinks?: {
    twitter?: string;
    telegram?: string;
    website?: string;
  };
  farcasterCastHash?: string;
}): Promise<TokenLaunchResult> {
  try {
    console.log('Launching token via Bankr API:', params.name, params.symbol);
    
    const response = await api.post('/v1/tokens/launch', {
      name: params.name,
      symbol: params.symbol.toUpperCase(),
      description: params.description,
      imageUrl: params.imageUrl,
      initialSupply: params.initialSupply,
      deployer: params.agentWallet,
      chain: 'base',
      socialLinks: params.socialLinks,
      farcasterCastHash: params.farcasterCastHash,
      launchConfig: {
        // 65/35 split as per Clanker standard
        creatorRewardBps: 6500,
        protocolRewardBps: 3500,
      },
    });
    
    if (!response.data?.contractAddress) {
      console.error('Invalid launch response:', response.data);
      return {
        success: false,
        error: response.data?.message || 'Invalid response from Bankr API',
      };
    }
    
    return {
      success: true,
      contractAddress: response.data.contractAddress,
      txHash: response.data.txHash,
      tokenId: response.data.tokenId,
      poolAddress: response.data.poolAddress,
    };
  } catch (error: any) {
    console.error('Error launching token:', error.message);
    
    // Return error details
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to launch token',
    };
  }
}

// Get token details from Bankr
export async function getTokenDetails(contractAddress: string): Promise<any> {
  try {
    const response = await api.get(`/v1/tokens/${contractAddress}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching token details:', error.message);
    return null;
  }
}

// Execute swap
export async function executeSwap(params: {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  walletAddress: string;
  slippage?: number;
}): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const response = await api.post('/v1/swap', {
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
      amount: params.amount,
      wallet: params.walletAddress,
      slippage: params.slippage || 0.5,
      chain: 'base',
    });
    
    return {
      success: true,
      txHash: response.data.txHash,
    };
  } catch (error: any) {
    console.error('Error executing swap:', error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to execute swap',
    };
  }
}

// Provide liquidity
export async function provideLiquidity(params: {
  token: string;
  amount: string;
  walletAddress: string;
}): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const response = await api.post('/v1/liquidity/add', {
      token: params.token,
      amount: params.amount,
      wallet: params.walletAddress,
      chain: 'base',
    });
    
    return {
      success: true,
      txHash: response.data.txHash,
    };
  } catch (error: any) {
    console.error('Error providing liquidity:', error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to provide liquidity',
    };
  }
}

// Get token price
export async function getTokenPrice(contractAddress: string): Promise<number> {
  try {
    const response = await api.get(`/v1/tokens/${contractAddress}/price`);
    return response.data.price || 0;
  } catch (error: any) {
    console.error('Error fetching token price:', error.message);
    return 0;
  }
}

// Get token stats
export async function getTokenStats(contractAddress: string): Promise<any> {
  try {
    const response = await api.get(`/v1/tokens/${contractAddress}/stats`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching token stats:', error.message);
    return null;
  }
}

// Register agent with Bankr
export async function registerAgent(params: {
  name: string;
  description: string;
  ownerFid: number;
  ownerUsername: string;
  skills: string[];
  imageUrl?: string;
}): Promise<{ success: boolean; agentId?: string; walletAddress?: string; error?: string }> {
  try {
    console.log('Registering agent with Bankr:', params.name);
    
    // First create a wallet for the agent
    const tempAgentId = `agent_${Date.now()}_${params.ownerFid}`;
    const wallet = await createAgentWallet(tempAgentId, 'base');
    
    if (!wallet) {
      return {
        success: false,
        error: 'Failed to create agent wallet',
      };
    }
    
    // Register agent with Bankr
    const response = await api.post('/v1/agents/register', {
      name: params.name,
      description: params.description,
      ownerFid: params.ownerFid,
      ownerUsername: params.ownerUsername,
      skills: params.skills,
      imageUrl: params.imageUrl,
      walletAddress: wallet.address,
      chain: 'base',
      metadata: {
        registeredAt: new Date().toISOString(),
        platform: 'farcaster-miniapp',
      },
    });
    
    return {
      success: true,
      agentId: response.data.agentId || tempAgentId,
      walletAddress: wallet.address,
    };
  } catch (error: any) {
    console.error('Error registering agent:', error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to register agent',
    };
  }
}

// Get agent details from Bankr
export async function getAgentDetails(agentId: string): Promise<any> {
  try {
    const response = await api.get(`/v1/agents/${agentId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching agent details:', error.message);
    return null;
  }
}

// Get leaderboard from Bankr
export async function getLeaderboard(type: 'volume' | 'tokens' | 'reputation' = 'volume', limit = 100): Promise<any[]> {
  try {
    const response = await api.get('/v1/leaderboard', {
      params: { type, limit },
    });
    return response.data.leaderboard || [];
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error.message);
    return [];
  }
}

export { api };
