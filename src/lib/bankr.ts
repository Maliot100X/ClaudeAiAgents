import axios from 'axios';
import type { BankrWallet, TokenLaunchResult } from '@/types';

const BANKR_API_URL = process.env.BANKR_API_URL || 'https://api.bankr.bot';
const BANKR_API_KEY = process.env.BANKR_API_KEY || '';

if (!BANKR_API_KEY) {
  console.error('❌ BANKR_API_KEY not configured');
}

// Bankr Agent API client
const api = axios.create({
  baseURL: BANKR_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': BANKR_API_KEY,
  },
  timeout: 120000, // 2 minutes for token deployments
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Bankr API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      endpoint: error.config?.url,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

// ============================================
// BANKR AGENT API - NATURAL LANGUAGE INTERFACE
// ============================================

export interface PromptResponse {
  success: boolean;
  jobId?: string;
  threadId?: string;
  status?: string;
  message?: string;
  error?: string;
}

export interface JobStatusResponse {
  success: boolean;
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  prompt?: string;
  response?: string;
  createdAt?: string;
  completedAt?: string;
  processingTime?: number;
  statusUpdates?: Array<{ message: string; timestamp: string }>;
  error?: string;
}

// Submit a natural language prompt to Bankr Agent
export async function submitPrompt(prompt: string): Promise<PromptResponse> {
  try {
    if (!BANKR_API_KEY) {
      throw new Error('BANKR_API_KEY not configured');
    }

    console.log('🤖 Submitting prompt to Bankr:', prompt);

    const response = await api.post('/agent/prompt', {
      prompt,
    });

    const data = response.data;

    if (!response.data?.success || !response.data?.jobId) {
      throw new Error(data.message || data.error || 'Failed to submit prompt');
    }

    return {
      success: true,
      jobId: data.jobId,
      threadId: data.threadId,
      status: data.status,
      message: data.message,
    };
  } catch (error: any) {
    console.error('Error submitting prompt:', error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to submit prompt',
    };
  }
}

// Get job status
export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  try {
    const response = await api.get(`/agent/job/${jobId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching job status:', error.message);
    return {
      success: false,
      jobId,
      status: 'failed',
      error: error.response?.data?.message || error.message || 'Failed to fetch job status',
    };
  }
}

// Poll for job completion with callbacks
export async function pollJobStatus(
  jobId: string,
  onStatusUpdate?: (status: string, message: string) => void,
  options?: {
    intervalMs?: number;
    maxAttempts?: number;
    onAgentStatusUpdate?: (message: string) => void;
  }
): Promise<JobStatusResponse> {
  const {
    intervalMs = 2000,
    maxAttempts = 150,
    onAgentStatusUpdate,
  } = options || {};

  let lastStatus: string | null = null;
  let lastStatusUpdateCount = 0;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getJobStatus(jobId);

    if (!status.success) {
      throw new Error(status.error || 'Failed to fetch job status');
    }

    // Check for new agent status updates
    if (
      onAgentStatusUpdate &&
      status.statusUpdates &&
      status.statusUpdates.length > lastStatusUpdateCount
    ) {
      const newUpdates = status.statusUpdates.slice(lastStatusUpdateCount);
      for (const update of newUpdates) {
        onAgentStatusUpdate(update.message);
      }
      lastStatusUpdateCount = status.statusUpdates.length;
    }

    // Notify about job status changes
    if (status.status !== lastStatus && onStatusUpdate) {
      const statusMessage = getStatusMessage(status.status);
      onStatusUpdate(status.status, statusMessage);
      lastStatus = status.status;
    }

    // Check if job is complete
    if (status.status === 'completed') {
      return status;
    }

    if (status.status === 'failed' || status.status === 'cancelled') {
      throw new Error(status.error || `Job ${status.status}`);
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error('Polling timeout - job took too long to complete');
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'pending':
      return '⏳ Waiting to start...';
    case 'processing':
      return '🤖 Agent is working...';
    case 'completed':
      return '✅ Complete!';
    case 'failed':
      return '❌ Failed';
    case 'cancelled':
      return '🚫 Cancelled';
    default:
      return '⏳ Processing...';
  }
}

// Cancel a job
export async function cancelJob(jobId: string): Promise<boolean> {
  try {
    await api.post(`/agent/job/${jobId}/cancel`);
    return true;
  } catch (error: any) {
    console.error('Error cancelling job:', error.message);
    return false;
  }
}

// ============================================
// TOKEN LAUNCH VIA NATURAL LANGUAGE
// ============================================

export interface LaunchTokenParams {
  tokenName: string;
  tokenSymbol: string;
  description?: string;
  image?: string;
  websiteUrl?: string;
  twitterUrl?: string;
  telegramUrl?: string;
  tweetUrl?: string;
  walletAddress?: string;
  farcasterUsername?: string;
  feeRecipient?: string; // wallet address or @username
  simulateOnly?: boolean;
}

export interface LaunchTokenResponse {
  success: boolean;
  tokenAddress?: string;
  txHash?: string;
  message?: string;
  jobId?: string;
  error?: string;
}

// Launch token via Bankr Agent API using natural language
export async function launchTokenViaBankr(
  params: LaunchTokenParams
): Promise<LaunchTokenResponse> {
  try {
    console.log('🚀 Launching token via Bankr:', params.tokenName);

    // Build natural language prompt
    let prompt = `deploy a token called "${params.tokenName}"`;
    
    if (params.tokenSymbol) {
      prompt += ` with symbol ${params.tokenSymbol}`;
    }

    if (params.description) {
      prompt += `. Description: ${params.description}`;
    }

    if (params.image) {
      prompt += `. Logo: ${params.image}`;
    }

    if (params.websiteUrl) {
      prompt += `. Website: ${params.websiteUrl}`;
    }

    if (params.twitterUrl) {
      prompt += `. Twitter: ${params.twitterUrl}`;
    }

    if (params.telegramUrl) {
      prompt += `. Telegram: ${params.telegramUrl}`;
    }

    // Submit prompt
    const submitResult = await submitPrompt(prompt);

    if (!submitResult.success || !submitResult.jobId) {
      throw new Error(submitResult.error || 'Failed to submit token launch prompt');
    }

    console.log('⏳ Waiting for token deployment, jobId:', submitResult.jobId);

    // Poll for completion
    const finalStatus = await pollJobStatus(submitResult.jobId);

    if (finalStatus.status !== 'completed') {
      throw new Error(finalStatus.error || 'Token launch failed');
    }

    // Extract token address from response if available
    const responseText = finalStatus.response || '';
    const tokenAddressMatch = responseText.match(/0x[a-fA-F0-9]{40}/);
    const tokenAddress = tokenAddressMatch ? tokenAddressMatch[0] : undefined;

    return {
      success: true,
      tokenAddress,
      message: finalStatus.response,
      jobId: submitResult.jobId,
    };
  } catch (error: any) {
    console.error('Error launching token:', error.message);
    return {
      success: false,
      error: error.message || 'Token launch failed',
    };
  }
}

// ============================================
// WALLET OPERATIONS (USING AGENT API)
// ============================================

// Use the user's own Bankr wallet - no need to create separate wallets
// The API key is tied to a specific wallet
export async function getBankrWalletInfo(): Promise<BankrWallet | null> {
  try {
    const result = await submitPrompt('what is my wallet address?');
    
    if (!result.success || !result.jobId) {
      return null;
    }

    const status = await pollJobStatus(result.jobId);
    
    if (status.status !== 'completed') {
      return null;
    }

    // Extract wallet address from response
    const responseText = status.response || '';
    const addressMatch = responseText.match(/0x[a-fA-F0-9]{40}/);
    
    if (!addressMatch) {
      return null;
    }

    return {
      address: addressMatch[0],
      chain: 'base',
      createdAt: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('Error getting wallet info:', error.message);
    return null;
  }
}

// Get wallet balance using agent
export async function getWalletBalance(): Promise<string> {
  try {
    const result = await submitPrompt('what is my ETH balance?');
    
    if (!result.success || !result.jobId) {
      return '0';
    }

    const status = await pollJobStatus(result.jobId);
    
    if (status.status !== 'completed') {
      return '0';
    }

    // Try to extract balance from response
    const responseText = status.response || '';
    const balanceMatch = responseText.match(/(\d+\.?\d*)\s*ETH/i);
    
    return balanceMatch ? balanceMatch[1] : '0';
  } catch (error: any) {
    console.error('Error getting wallet balance:', error.message);
    return '0';
  }
}

// ============================================
// AGENT REGISTRATION (SIMPLIFIED)
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
    console.log('📝 Registering agent:', params.name);
    
    // Generate agent ID
    const agentId = `agent_${Date.now()}_${params.ownerFid}`;
    
    // Get wallet address from Bankr
    const walletInfo = await getBankrWalletInfo();
    
    if (!walletInfo) {
      // Use fallback - the user's wallet from their Bankr account
      const fallbackWallet = process.env.BANKR_WALLET_ADDRESS;
      if (!fallbackWallet) {
        return {
          success: false,
          error: 'Could not retrieve wallet address from Bankr',
        };
      }
      
      return {
        success: true,
        agentId,
        walletAddress: fallbackWallet,
      };
    }
    
    return {
      success: true,
      agentId,
      walletAddress: walletInfo.address,
    };
  } catch (error: any) {
    console.error('Error registering agent:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to register agent',
    };
  }
}

// ============================================
// LEGACY COMPATIBILITY
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
}): Promise<TokenLaunchResult> {
  const result = await launchTokenViaBankr({
    tokenName: params.name,
    tokenSymbol: params.symbol,
    description: params.description,
    image: params.imageUrl,
    websiteUrl: params.socialLinks?.website,
    twitterUrl: params.socialLinks?.twitter,
    telegramUrl: params.socialLinks?.telegram,
    feeRecipient: params.agentWallet,
  });

  return {
    success: result.success,
    contractAddress: result.tokenAddress,
    txHash: undefined, // Bankr Agent API doesn't return txHash directly
    error: result.error,
  };
}

// Create agent wallet - now just returns the existing Bankr wallet
export async function createAgentWallet(agentId: string, chain: string = 'base'): Promise<BankrWallet | null> {
  const walletInfo = await getBankrWalletInfo();
  
  if (walletInfo) {
    return {
      ...walletInfo,
      walletId: agentId,
    };
  }
  
  // Fallback to configured wallet
  const fallbackWallet = process.env.BANKR_WALLET_ADDRESS;
  if (fallbackWallet) {
    return {
      address: fallbackWallet,
      chain,
      createdAt: new Date().toISOString(),
      walletId: agentId,
    };
  }
  
  return null;
}

// ============================================
// TOKEN INFO (STUBS FOR COMPATIBILITY)
// ============================================

export async function getTokenPrice(contractAddress: string): Promise<number> {
  // TODO: Implement via Bankr Agent API if available
  // For now, return 0 as we can't query price directly
  return 0;
}

export async function getTokenStats(contractAddress: string): Promise<any> {
  // TODO: Implement via Bankr Agent API if available
  // For now, return null as we can't query stats directly
  return null;
}

export { api };
export default api;
