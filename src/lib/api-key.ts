import { getAgent, setAgent } from './redis';

// Generate unique API key for agent
export function generateApiKey(): string {
  const prefix = 'bk_agent';
  const randomPart = Array(32)
    .fill(0)
    .map(() => Math.random().toString(36).charAt(2))
    .join('');
  return `${prefix}_${randomPart}`;
}

// Hash API key for storage (simple hash for comparison)
export function hashApiKey(apiKey: string): string {
  // In production, use bcrypt or similar
  // For now, simple base64 encoding
  return Buffer.from(apiKey).toString('base64');
}

// Validate API key and return agent
export async function validateApiKey(apiKey: string): Promise<any | null> {
  try {
    // Get all agents and find one with matching API key hash
    // In production, use a reverse lookup index
    const { getAllAgents } = await import('./redis');
    const agents = await getAllAgents();
    
    for (const agent of agents) {
      if (agent.apiKey === apiKey || agent.apiKeyHash === hashApiKey(apiKey)) {
        return agent;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error validating API key:', error);
    return null;
  }
}

// Get agent by API key
export async function getAgentByApiKey(apiKey: string): Promise<any | null> {
  return validateApiKey(apiKey);
}
