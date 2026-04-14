import axios from 'axios';
import type { FarcasterUser, LeaderboardEntry } from '@/types';

const NEYNAR_API_URL = 'https://api.neynar.com/v2';
const API_KEY = process.env.NEYNAR_API_KEY || '';

const api = axios.create({
  baseURL: NEYNAR_API_URL,
  headers: {
    'api-key': API_KEY,
    'Content-Type': 'application/json',
  },
});

// Get user by FID
export async function getUserByFid(fid: number): Promise<FarcasterUser | null> {
  try {
    const response = await api.get(`/farcaster/user/bulk?fids=${fid}`);
    const user = response.data?.users?.[0];
    if (!user) return null;
    
    return {
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      pfpUrl: user.pfp_url,
      bio: user.profile?.bio?.text,
      custodyAddress: user.custody_address,
      verifications: user.verifications,
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

// Get users by FIDs (bulk)
export async function getUsersByFids(fids: number[]): Promise<FarcasterUser[]> {
  if (!fids.length) return [];
  
  try {
    const response = await api.get(`/farcaster/user/bulk?fids=${fids.join(',')}`);
    return response.data?.users?.map((user: any) => ({
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      pfpUrl: user.pfp_url,
      bio: user.profile?.bio?.text,
      custodyAddress: user.custody_address,
      verifications: user.verifications,
    })) || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

// Get user by username
export async function getUserByUsername(username: string): Promise<FarcasterUser | null> {
  try {
    const response = await api.get(`/farcaster/user/by_username?username=${username}`);
    const user = response.data?.result?.user;
    if (!user) return null;
    
    return {
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      pfpUrl: user.pfp_url,
      bio: user.profile?.bio?.text,
      custodyAddress: user.custody_address,
      verifications: user.verifications,
    };
  } catch (error) {
    console.error('Error fetching user by username:', error);
    return null;
  }
}

// Publish cast
export async function publishCast(text: string, signerUuid: string, embeds?: any[]): Promise<any> {
  try {
    const response = await api.post('/farcaster/cast', {
      signer_uuid: signerUuid,
      text,
      embeds,
    });
    return response.data;
  } catch (error) {
    console.error('Error publishing cast:', error);
    throw error;
  }
}

// Get casts by user
export async function getCastsByUser(fid: number, limit = 20): Promise<any[]> {
  try {
    const response = await api.get(`/farcaster/feed/user/casts?fid=${fid}&limit=${limit}`);
    return response.data?.casts || [];
  } catch (error) {
    console.error('Error fetching casts:', error);
    return [];
  }
}

// Validate webhook signature
export function validateWebhookSignature(body: string, signature: string, secret: string): boolean {
  // In production, implement proper signature validation
  // This is a placeholder
  return true;
}

// Get trending users for leaderboard
export async function getTrendingUsers(limit = 100): Promise<LeaderboardEntry[]> {
  // This would typically fetch from Neynar's trending API
  // For now, return mock data structure
  return [];
}

// Get channel followers
export async function getChannelFollowers(channelId: string, limit = 100): Promise<FarcasterUser[]> {
  try {
    const response = await api.get(`/farcaster/channel/followers?id=${channelId}&limit=${limit}`);
    return response.data?.users?.map((user: any) => ({
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      pfpUrl: user.pfp_url,
    })) || [];
  } catch (error) {
    console.error('Error fetching channel followers:', error);
    return [];
  }
}

export { api };
