'use client';

import { sdk } from '@farcaster/miniapp-sdk';
import type { MiniAppContext, FarcasterUser } from '@/types';

// Re-export SDK
export { sdk };

// Initialize Mini App - MUST call ready() to prevent infinite loading
export async function initMiniApp(): Promise<void> {
  try {
    await sdk.actions.ready();
    console.log('✅ Mini App initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Mini App:', error);
    throw error;
  }
}

// Check if running inside Farcaster Mini App
export function isInMiniApp(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for Farcaster user agent or context
  const isFarcaster = window.navigator.userAgent?.includes('Farcaster') || 
                      (window as any).farcaster !== undefined ||
                      sdk?.context !== undefined;
  
  return isFarcaster;
}

// Get user context from Mini App SDK
export async function getUserContext(): Promise<FarcasterUser | null> {
  try {
    const context = await sdk.context;
    if (!context?.user) return null;
    
    return {
      fid: context.user.fid,
      username: context.user.username || '',
      displayName: context.user.displayName,
      pfpUrl: context.user.pfpUrl,
    };
  } catch (error) {
    console.error('Error getting user context:', error);
    return null;
  }
}

// Open URL in Farcaster
export async function openUrl(url: string): Promise<void> {
  try {
    await sdk.actions.openUrl(url);
  } catch (error) {
    console.error('Error opening URL:', error);
    // Fallback to window.open
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  }
}

// Close Mini App
export async function closeApp(): Promise<void> {
  try {
    await sdk.actions.close();
  } catch (error) {
    console.error('Error closing app:', error);
  }
}

// View profile
export async function viewProfile(fid: number): Promise<void> {
  try {
    await sdk.actions.viewProfile({ fid });
  } catch (error) {
    console.error('Error viewing profile:', error);
  }
}

// Share cast
export async function shareCast(text: string, embeds?: string[]): Promise<void> {
  try {
    // Use composeCast with proper typing - embeds can be 0, 1, or 2 items max
    const validEmbeds = embeds?.slice(0, 2) as [] | [string] | [string, string] | undefined;
    await sdk.actions.composeCast({ text, embeds: validEmbeds });
  } catch (error) {
    console.error('Error sharing cast:', error);
  }
}

// Sign in with Farcaster (SIWE)
export async function signInWithFarcaster(): Promise<{ token: string; message: string; signature: string } | null> {
  try {
    // Sign in requires a nonce parameter
    const nonce = Math.random().toString(36).substring(2, 15);
    const result = await sdk.actions.signIn({ nonce });
    if (!result) return null;
    
    return {
      token: result.message,
      message: result.message,
      signature: result.signature,
    };
  } catch (error) {
    console.error('Error signing in:', error);
    return null;
  }
}

// Add frame to user's home
export async function addFrame(): Promise<void> {
  try {
    await sdk.actions.addFrame();
  } catch (error) {
    console.error('Error adding frame:', error);
  }
}
