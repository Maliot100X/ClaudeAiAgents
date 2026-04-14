'use client';

import React from 'react';
import { AuthKitProvider } from '@farcaster/auth-kit';
import '@farcaster/auth-kit/styles.css';

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'mini-app-three-mauve.vercel.app';
const siweUri = process.env.NEXT_PUBLIC_SIWE_URI || `https://${domain}/api/auth/callback`;

const config = {
  rpcUrl: 'https://mainnet.optimism.io',
  domain,
  siweUri,
};

export function FarcasterAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthKitProvider config={config}>
      {children}
    </AuthKitProvider>
  );
}
