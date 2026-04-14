import { Redis } from '@upstash/redis';

// Upstash Redis client for REST API
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Check if Redis is connected
export async function checkRedisConnection(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('Redis connection failed:', error);
    return false;
  }
}

// Key prefixes for different data types
const KEYS = {
  AGENTS: 'agent:',
  TOKENS: 'token:',
  USERS: 'user:',
  LEADERBOARD: 'leaderboard',
  GAMES: 'game:',
  AUTH: 'auth:',
};

// Agent operations
export async function getAgent(id: string) {
  return await redis.get(`${KEYS.AGENTS}${id}`);
}

export async function setAgent(id: string, data: any) {
  return await redis.set(`${KEYS.AGENTS}${id}`, JSON.stringify(data));
}

export async function getAllAgents(): Promise<any[]> {
  const keys = await redis.keys(`${KEYS.AGENTS}*`);
  if (!keys.length) return [];
  const agents = await redis.mget(...keys);
  return agents.map(a => typeof a === 'string' ? JSON.parse(a) : a).filter(Boolean);
}

// Token operations
export async function getToken(id: string) {
  return await redis.get(`${KEYS.TOKENS}${id}`);
}

export async function setToken(id: string, data: any) {
  return await redis.set(`${KEYS.TOKENS}${id}`, JSON.stringify(data));
}

export async function getAllTokens(): Promise<any[]> {
  const keys = await redis.keys(`${KEYS.TOKENS}*`);
  if (!keys.length) return [];
  const tokens = await redis.mget(...keys);
  return tokens.map(t => typeof t === 'string' ? JSON.parse(t) : t).filter(Boolean);
}

// User operations
export async function getUser(fid: number) {
  return await redis.get(`${KEYS.USERS}${fid}`);
}

export async function setUser(fid: number, data: any) {
  return await redis.set(`${KEYS.USERS}${fid}`, JSON.stringify(data));
}

// Leaderboard operations
export async function updateLeaderboard(entry: any) {
  const key = `${KEYS.LEADERBOARD}:${entry.fid}`;
  await redis.set(key, JSON.stringify(entry));
  await redis.zadd('leaderboard:scores', { score: entry.score, member: entry.fid.toString() });
}

export async function getLeaderboard(limit = 100): Promise<any[]> {
  const topFids = await redis.zrange('leaderboard:scores', 0, limit - 1, { rev: true });
  if (!topFids.length) return [];
  
  const keys = topFids.map(fid => `${KEYS.LEADERBOARD}:${fid}`);
  const entries = await redis.mget(...keys);
  return entries.map((e, i) => {
    const parsed = typeof e === 'string' ? JSON.parse(e) : e;
    return { ...parsed, rank: i + 1 };
  }).filter(Boolean);
}

// Game score operations
export async function saveGameScore(game: string, fid: number, score: number) {
  const key = `${KEYS.GAMES}${game}:${fid}`;
  const existing = await redis.get(key) as any;
  
  if (!existing || score > (existing.score || 0)) {
    await redis.set(key, JSON.stringify({ fid, score, playedAt: new Date().toISOString() }));
    await redis.zadd(`game:${game}:leaderboard`, { score, member: fid.toString() });
  }
}

export async function getGameLeaderboard(game: string, limit = 50): Promise<any[]> {
  const topFids = await redis.zrange(`game:${game}:leaderboard`, 0, limit - 1, { rev: true });
  if (!topFids.length) return [];
  
  const keys = topFids.map(fid => `${KEYS.GAMES}${game}:${fid}`);
  const entries = await redis.mget(...keys);
  return entries.map((e, i) => {
    const parsed = typeof e === 'string' ? JSON.parse(e) : e;
    return { ...parsed, rank: i + 1 };
  }).filter(Boolean);
}

// Auth session operations
export async function setAuthSession(token: string, data: any, ttl = 86400) {
  await redis.set(`${KEYS.AUTH}${token}`, JSON.stringify(data), { ex: ttl });
}

export async function getAuthSession(token: string) {
  const data = await redis.get(`${KEYS.AUTH}${token}`);
  return data ? (typeof data === 'string' ? JSON.parse(data) : data) : null;
}

export async function deleteAuthSession(token: string) {
  await redis.del(`${KEYS.AUTH}${token}`);
}

export { KEYS };
