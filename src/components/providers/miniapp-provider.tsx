'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initMiniApp, isInMiniApp, getUserContext } from '@/lib/farcaster-sdk';
import type { FarcasterUser } from '@/types';
import { useAppStore } from '@/lib/store';

interface MiniAppContextType {
  isReady: boolean;
  isInFrame: boolean;
  user: FarcasterUser | null;
  error: string | null;
}

const MiniAppContext = createContext<MiniAppContextType>({
  isReady: false,
  isInFrame: false,
  user: null,
  error: null,
});

export function useMiniApp() {
  return useContext(MiniAppContext);
}

export function MiniAppProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isInFrame, setIsInFrame] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useAppStore();

  useEffect(() => {
    const initialize = async () => {
      try {
        // Check if in Mini App
        const inFrame = isInMiniApp();
        setIsInFrame(inFrame);
        
        if (inFrame) {
          console.log('🚀 Initializing Mini App...');
          await initMiniApp();
          
          // Get user context
          const userContext = await getUserContext();
          if (userContext) {
            setUser(userContext);
            console.log('✅ User authenticated:', userContext.username);
          }
        }
        
        setIsReady(true);
      } catch (err: any) {
        console.error('❌ Mini App initialization failed:', err);
        setError(err.message || 'Failed to initialize Mini App');
        setIsReady(true); // Still mark as ready to avoid infinite loading
      }
    };

    initialize();
  }, [setUser]);

  const user = useAppStore((state) => state.user);

  return (
    <MiniAppContext.Provider value={{ isReady, isInFrame, user, error }}>
      {children}
    </MiniAppContext.Provider>
  );
}
