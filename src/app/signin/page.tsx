'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { SignInButton, useProfile } from '@farcaster/auth-kit';
import { Sparkles, Shield, Zap, Wallet } from 'lucide-react';
import { useMiniApp } from '@/components/providers/miniapp-provider';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Shield,
    title: 'Secure SIWE',
    description: 'Sign in with Ethereum via Farcaster',
  },
  {
    icon: Wallet,
    title: 'Non-Custodial',
    description: 'You control your keys and assets',
  },
  {
    icon: Zap,
    title: 'Instant Access',
    description: 'No email or password required',
  },
];

export default function SignInPage() {
  const router = useRouter();
  const { isAuthenticated, profile } = useProfile();
  const { isInFrame } = useMiniApp();
  const { setAuth } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  // Handle successful authentication
  React.useEffect(() => {
    if (isAuthenticated && profile) {
      setIsLoading(true);
      
      // Store auth in our app store
      setAuth(
        {
          fid: profile.fid!,
          username: profile.username!,
          displayName: profile.displayName,
          pfpUrl: profile.pfpUrl,
        },
        'auth-token-' + Date.now()
      );
      
      // Redirect to home
      router.push('/');
    }
  }, [isAuthenticated, profile, setAuth, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Sign In</CardTitle>
              <CardDescription>
                Connect with Farcaster to continue
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Sign In Button */}
              <div className="flex justify-center">
                <SignInButton />
              </div>

              {/* Features */}
              <div className="space-y-3">
                {features.map((feature, i) => {
                  const Icon = feature.icon;
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-white">{feature.title}</p>
                        <p className="text-xs text-white/50">{feature.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Info */}
              <div className="text-center text-xs text-white/40">
                {isInFrame ? (
                  <p>✅ Running inside Farcaster Mini App</p>
                ) : (
                  <p>Open in Warpcast for the best experience</p>
                )}
              </div>

              {/* Manual Connect (fallback) */}
              <div className="pt-4 border-t border-white/10">
                <p className="text-center text-sm text-white/60 mb-3">Or continue with wallet</p>
                <Button variant="outline" className="w-full" disabled>
                  <Wallet className="w-4 h-4 mr-2" />
                  Wallet Connect (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Back Link */}
          <div className="text-center mt-6">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
