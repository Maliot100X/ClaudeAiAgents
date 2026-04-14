import axios from 'axios';
import type { BankrWallet, TokenLaunchResult } from '@/types';

const BANKR_API_URL = process.env.BANKR_API_URL || 'https://api.bankr.bot';
const PARTNER_KEY = process.env.BANKR_API_KEY || '';

// Partner API client for token launches
const partnerApi = axios.create({
  baseURL: BANKR_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Partner-Key': PARTNER_KEY,
  },
  timeout: 60000, // 60 second timeout for deployments
});

// Regular API client for other operations
const api = axios.create({
  baseURL: BANKR_API_URL,
  headers: {
    'Authorization': `Bearer ${PARTNER_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add response interceptor for error handling
partnerApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Bankr Partner API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      endpoint: error.config?.url,
    });
    return Promise.reject(error);
  }
);

// ============================================
// TOKEN LAUNCH - PARTNER DEPLOY API
// ============================================

export interface LaunchTokenParams {
  tokenName: string;
  tokenSymbol?: string;
  description?: string;
  image?: string; // URL to image
  tweetUrl?: string;
  websiteUrl?: string;
  farcasterUsername?: string;
  farcasterFid?: number;
  walletAddress?: string;
  simulateOnly?: boolean;
}

export interface LaunchTokenResponse {
  success: boolean;
  tokenAddress?: string;
  poolId?: string;
  txHash?: string;
  activityId?: string;
  chain?: string;
  simulated?: boolean;
  feeDistribution?: {
    creator: { address: string; bps: number };
    bankr: { address: string; bps: number };
    partner: { address: string; bps: number };
    alt: { address: string; bps: number };
    protocol: { address: string; bps: number };
  };
  error?: string;
}

// Launch token via Bankr Partner Deploy API
export async function launchTokenViaPartner(
  params: LaunchTokenParams
): Promise<LaunchTokenResponse> {
  try {
    console.log('Launching token via Bankr Partner API:', params.tokenName);

    // Determine fee recipient based on available info
    let feeRecipient: { type: string; value: string };
    
    if (params.walletAddress) {
      // Use wallet address directly
      feeRecipient = {
        type: 'wallet',
        value: params.walletAddress,
      };
    } else if (params.farcasterUsername) {
      // Use Farcaster username - resolves to their verified address
      feeRecipient = {
        type: 'farcaster',
        value: params.farcasterUsername.replace('@', ''), // Remove @ if present
      };
    } else if (params.farcasterFid) {
      // Use FID as wallet type with custody address
      // This requires getting the custody address from Neynar first
      throw new Error('FID-only not supported. Please provide walletAddress or farcasterUsername');
    } else {
      throw new Error('feeRecipient required: provide walletAddress or farcasterUsername');
    }

    const requestBody = {
      tokenName: params.tokenName,
      tokenSymbol: params.tokenSymbol,
      description: params.description,
      image: params.image,
      tweetUrl: params.tweetUrl,
      websiteUrl: params.websiteUrl,
      feeRecipient,
      simulateOnly: params.simulateOnly || false,
    };

    console.log('Partner API request:', JSON.stringify(requestBody, null, 2));

    const response = await partnerApi.post('/token-launches/deploy', requestBody);

    const data = response.data;

    return {
      success: true,
      tokenAddress: data.tokenAddress,
      poolId: data.poolId,
      txHash: data.txHash,
      activityId: data.activityId,
      chain: data.chain || 'base',
      simulated: data.simulated || false,
      feeDistribution: data.feeDistribution,
    };
  } catch (error: any) {
    console.error('Error launching token via Partner API:', error.message);
    
    // Return detailed error
    return {
      success: false,
      error: error.response?.data?.message || error.response?.data?.error || error.message || 'Token launch failed',
    };
  }
}

// Simulate token launch (get predicted address without deploying)
export async function simulateTokenLaunch(
  params: Omit<LaunchTokenParams, 'simulateOnly'>
): Promise<LaunchTokenResponse> {
  return launchTokenViaPartner({ ...params, simulateOnly: true });
}

// ============================================
// WALLET OPERATIONS
// ============================================

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

// ============================================
// TOKEN OPERATIONS (LEGACY - FOR COMPATIBILITY)
// ============================================

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
  // Convert to Partner API format
  const result = await launchTokenViaPartner({
    tokenName: params.name,
    tokenSymbol: params.symbol,
    description: params.description,
    image: params.imageUrl,
    websiteUrl: params.socialLinks?.website,
    walletAddress: params.agentWallet,
  });

  return {
    success: result.success,
    contractAddress: result.tokenAddress,
    txHash: result.txHash,
    error: result.error,
  };
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

// ============================================
// AGENT REGISTRATION
// ============================================

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

// ============================================
// LEADERBOARD
// ============================================

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

// ============================================
// SWAP & LIQUIDITY (LEGACY)
// ============================================

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

export { api, partnerApi };
