export interface FarcasterUser {
  fid: number;
  username: string;
  displayName?: string;
  pfpUrl?: string;
  bio?: string;
  custodyAddress?: string;
  verifications?: string[];
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  ownerFid: number;
  ownerUsername: string;
  skills: string[];
  reputation: number;
  tokensLaunched: number;
  totalVolume: number;
  createdAt: string;
  isActive: boolean;
  bankrWalletAddress?: string;
}

export interface Token {
  id: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl?: string;
  contractAddress: string;
  chain: 'base' | 'ethereum';
  launchedBy: string;
  launchedByFid: number;
  launchedAt: string;
  totalSupply: string;
  marketCap?: number;
  volume24h?: number;
  price?: number;
  priceChange24h?: number;
  holders?: number;
}

export interface LeaderboardEntry {
  fid: number;
  username: string;
  displayName?: string;
  pfpUrl?: string;
  score: number;
  tokensLaunched: number;
  totalVolume: number;
  rank: number;
  change24h: number;
}

export interface LaunchParams {
  name: string;
  symbol: string;
  description: string;
  image?: File;
  initialSupply: string;
  agentId?: string;
  socialLinks?: {
    twitter?: string;
    telegram?: string;
    website?: string;
  };
}

export interface GameScore {
  fid: number;
  username: string;
  game: string;
  score: number;
  playedAt: string;
}

export interface MiniAppContext {
  user?: FarcasterUser;
  client?: {
    fid: number;
    username: string;
  };
  url?: string;
}

export interface BankrWallet {
  address: string;
  chain: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
