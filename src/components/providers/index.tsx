'use client';

import React from 'react';
import { WalletProvider } from './wallet-provider';
import { FarcasterAuthProvider } from './farcaster-auth-provider';
import { MiniAppProvider } from './miniapp-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <FarcasterAuthProvider>
        <MiniAppProvider>
          {children}
        </MiniAppProvider>
      </FarcasterAuthProvider>
    </WalletProvider>
  );
}
