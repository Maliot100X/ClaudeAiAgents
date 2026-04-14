import axios from 'axios';
import type { BankrWallet } from '@/types';

const BANKR_API_URL = process.env.BANKR_API_URL || 'https://api.bankr.io';
const API_KEY = process.env.BANKR_API_KEY || '';

const api = axios.create({
  baseURL: BANKR_API_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
});

// Create a new wallet for an agent
export async function createAgentWallet(agentId: string, chain: string = 'base'): Promise<BankrWallet | null> {
  try {
    const response = await api.post('/wallets', {
      agentId,
      chain,
      type: 'agent',
    });
    
    return {
      address: response.data.address,
      chain: response.data.chain,
      createdAt: response.data.createdAt,
    };
  } catch (error) {
    console.error('Error creating agent wallet:', error);
    return null;
  }
}

// Get wallet by agent ID
export async function getAgentWallet(agentId: string): Promise<BankrWallet | null> {
  try {
    const response = await api.get(`/wallets/agent/${agentId}`);
    
    return {
      address: response.data.address,
      chain: response.data.chain,
      createdAt: response.data.createdAt,
    };
  } catch (error) {
    console.error('Error fetching agent wallet:', error);
    return null;
  }
}

// Execute token launch
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
}): Promise<{ success: boolean; contractAddress?: string; txHash?: string; error?: string }> {
  try {
    const response = await api.post('/tokens/launch', {
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      imageUrl: params.imageUrl,
      initialSupply: params.initialSupply,
      deployer: params.agentWallet,
      chain: 'base',
      socialLinks: params.socialLinks,
    });
    
    return {
      success: true,
      contractAddress: response.data.contractAddress,
      txHash: response.data.txHash,
    };
  } catch (error: any) {
    console.error('Error launching token:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to launch token',
    };
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
    const response = await api.post('/swap', {
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
    console.error('Error executing swap:', error);
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
    const response = await api.post('/liquidity/add', {
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
    console.error('Error providing liquidity:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to provide liquidity',
    };
  }
}

// Get token price
export async function getTokenPrice(contractAddress: string): Promise<number> {
  try {
    const response = await api.get(`/tokens/${contractAddress}/price`);
    return response.data.price || 0;
  } catch (error) {
    console.error('Error fetching token price:', error);
    return 0;
  }
}

// Get token stats
export async function getTokenStats(contractAddress: string): Promise<any> {
  try {
    const response = await api.get(`/tokens/${contractAddress}/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching token stats:', error);
    return null;
  }
}

export { api };
