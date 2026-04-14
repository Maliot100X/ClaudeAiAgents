'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Rocket, 
  Upload, 
  Globe, 
  MessageCircle, 
  Twitter,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useMiniApp } from '@/components/providers/miniapp-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface FormData {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  initialSupply: string;
  website: string;
  twitter: string;
  telegram: string;
}

export default function LaunchPage() {
  const router = useRouter();
  const { user, isInFrame } = useMiniApp();
  const { isAuthenticated } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [formData, setFormData] = useState<FormData>({
    name: '',
    symbol: '',
    description: '',
    imageUrl: '',
    initialSupply: '1000000000',
    website: '',
    twitter: '',
    telegram: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user) {
      setStatus({ type: 'error', message: 'Please sign in with Farcaster first' });
      return;
    }

    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          symbol: formData.symbol,
          description: formData.description,
          imageUrl: formData.imageUrl,
          initialSupply: formData.initialSupply,
          launchedByFid: user.fid,
          socialLinks: {
            website: formData.website,
            twitter: formData.twitter,
            telegram: formData.telegram,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus({ 
          type: 'success', 
          message: `Token ${formData.symbol} launched successfully! Contract: ${data.data.contractAddress?.slice(0, 20)}...` 
        });
        
        // Reset form
        setFormData({
          name: '',
          symbol: '',
          description: '',
          imageUrl: '',
          initialSupply: '1000000000',
          website: '',
          twitter: '',
          telegram: '',
        });

        // Redirect after delay
        setTimeout(() => {
          router.push('/agents');
        }, 3000);
      } else {
        setStatus({ type: 'error', message: data.error || 'Failed to launch token' });
      }
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'An error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Rocket className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in with Farcaster to launch tokens</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/signin')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-4">
              <Rocket className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Token Launch</span>
            </div>
            <h1 className="text-3xl font-bold text-gradient mb-2">Launch Your Token</h1>
            <p className="text-white/60">Deploy an AI-powered token on Base</p>
          </div>

          {/* Status */}
          {status.type && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                status.type === 'success' ? 'bg-accent/20 border border-accent/30' : 'bg-red-500/20 border border-red-500/30'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              )}
              <p className={status.type === 'success' ? 'text-accent' : 'text-red-400'}>
                {status.message}
              </p>
            </motion.div>
          )}

          {/* Form */}
          <Card>
            <form onSubmit={handleSubmit}>
              <CardContent className="p-6 space-y-6">
                {/* Token Info */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Token Name *
                      </label>
                      <Input
                        placeholder="My Token"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Symbol *
                      </label>
                      <Input
                        placeholder="TKN"
                        value={formData.symbol}
                        onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                        required
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Description *
                    </label>
                    <Textarea
                      placeholder="Describe your token and its purpose..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Image URL
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://..."
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      />
                      <Button type="button" variant="outline" className="flex-shrink-0">
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Initial Supply
                    </label>
                    <Input
                      type="number"
                      value={formData.initialSupply}
                      onChange={(e) => setFormData({ ...formData, initialSupply: e.target.value })}
                    />
                    <p className="text-xs text-white/40 mt-1">Default: 1,000,000,000 tokens</p>
                  </div>
                </div>

                {/* Social Links */}
                <div className="pt-4 border-t border-white/10 space-y-4">
                  <h3 className="font-semibold text-white">Social Links</h3>
                  
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-white/40" />
                    <Input
                      placeholder="Website URL"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Twitter className="w-5 h-5 text-white/40" />
                    <Input
                      placeholder="Twitter URL"
                      value={formData.twitter}
                      onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-white/40" />
                    <Input
                      placeholder="Telegram URL"
                      value={formData.telegram}
                      onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="flex items-start gap-2 p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-white/70">
                    Tokens are launched on Base via Bankr integration. 
                    A small gas fee will be required. By launching, you confirm 
                    this token complies with all applicable laws.
                  </p>
                </div>

                {/* Submit */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  {isLoading ? 'Launching...' : 'Launch Token'}
                </Button>
              </CardContent>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
