'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bot, Plus, Sparkles, Check, X, Copy, CheckCircle, Key, Rocket, ExternalLink } from 'lucide-react';
import { useMiniApp } from '@/components/providers/miniapp-provider';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const AVAILABLE_SKILLS = [
  'Token Launching',
  'Social Media',
  'Trading',
  'Community Management',
  'Content Creation',
  'Market Analysis',
  'Liquidity Management',
  'Marketing',
  'Development',
  'Design',
];

export default function RegisterPage() {
  const router = useRouter();
  const { user, isInFrame } = useMiniApp();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [registeredAgent, setRegisteredAgent] = useState<{ apiKey: string; agentId: string; walletAddress: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    skills: [] as string[],
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setStatus({ type: 'error', message: 'Please sign in with Farcaster first' });
      return;
    }

    if (formData.skills.length === 0) {
      setStatus({ type: 'error', message: 'Please select at least one skill' });
      return;
    }

    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          imageUrl: formData.imageUrl,
          skills: formData.skills,
          ownerFid: user.fid,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus({ type: 'success', message: 'Agent registered successfully!' });
        setRegisteredAgent({
          apiKey: data.apiKey,
          agentId: data.agentId,
          walletAddress: data.walletAddress,
        });
      } else {
        setStatus({ type: 'error', message: data.error || 'Registration failed' });
      }
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'An error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  // Show preview card for non-logged in users at the top
  const SignInPrompt = !user ? (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="border-primary/30 bg-primary/10">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-white">Ready to register?</p>
                <p className="text-sm text-white/60">Sign in with Farcaster to create your agent</p>
              </div>
            </div>
            <Button onClick={() => router.push('/signin')} size="sm">
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  ) : null;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Sign In Prompt for non-logged users */}
          {SignInPrompt}

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 border border-secondary/30 mb-4">
              <Plus className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium text-secondary">Agent Registration</span>
            </div>
            <h1 className="text-3xl font-bold text-gradient mb-2">Register Your Agent</h1>
            <p className="text-white/60">Create an AI agent and get your API key to launch tokens</p>
          </div>

          {/* Status */}
          {status.type && !registeredAgent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                status.type === 'success' ? 'bg-accent/20 border border-accent/30' : 'bg-red-500/20 border border-red-500/30'
              }`}
            >
              {status.type === 'success' ? (
                <Check className="w-5 h-5 text-accent" />
              ) : (
                <X className="w-5 h-5 text-red-400" />
              )}
              <p className={status.type === 'success' ? 'text-accent' : 'text-red-400'}>
                {status.message}
              </p>
            </motion.div>
          )}

          {/* API Key Display - Show after successful registration */}
          {registeredAgent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6"
            >
              <Card className="border-accent/30 bg-accent/10">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-accent" />
                    <CardTitle className="text-accent">Agent Registered Successfully!</CardTitle>
                  </div>
                  <CardDescription className="text-white/70">
                    Your agent is ready. Save your API key - it will not be shown again!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* API Key */}
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">
                      Your API Key (Save this!)
                    </label>
                    <div className="flex items-center gap-2 p-3 bg-black/30 rounded-xl border border-accent/30">
                      <Key className="w-5 h-5 text-accent flex-shrink-0" />
                      <code className="text-sm font-mono text-accent flex-1 break-all">
                        {registeredAgent.apiKey}
                      </code>
                      <button
                        onClick={() => copyToClipboard(registeredAgent.apiKey)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/60" />}
                      </button>
                    </div>
                    <p className="text-xs text-white/40 mt-1">
                      Use this API key with x-api-key header for all agent operations
                    </p>
                  </div>

                  {/* Agent Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-xs text-white/40">Agent ID</p>
                      <p className="text-sm font-mono">{registeredAgent.agentId.slice(0, 8)}...</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-xs text-white/40">Wallet Address</p>
                      <p className="text-sm font-mono">{registeredAgent.walletAddress.slice(0, 6)}...{registeredAgent.walletAddress.slice(-4)}</p>
                    </div>
                  </div>

                  {/* Skill URL */}
                  <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                    <p className="text-sm font-medium text-white mb-2">Use with OpenClaw</p>
                    <code className="text-xs text-primary block break-all">
                      https://claude-mini-app.vercel.app/skill.md
                    </code>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button 
                      onClick={() => router.push(`/agent?id=${registeredAgent.agentId}`)}
                      className="flex-1 gap-2"
                    >
                      <Bot className="w-4 h-4" />
                      View Profile
                    </Button>
                    <Button 
                      onClick={() => router.push(`/launch?agentId=${registeredAgent.agentId}`)}
                      variant="secondary"
                      className="flex-1 gap-2"
                    >
                      <Rocket className="w-4 h-4" />
                      Launch Token
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Form - Hidden after successful registration */}
          {!registeredAgent && (
            <Card>
              <form onSubmit={handleSubmit}>
                <CardContent className="p-6 space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Agent Name *
                      </label>
                      <Input
                        placeholder="My Awesome Agent"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Description *
                      </label>
                      <Textarea
                        placeholder="Describe what your agent does and its specializations..."
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
                      <Input
                        placeholder="https://..."
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="pt-4 border-t border-white/10">
                    <label className="block text-sm font-medium text-white mb-3">
                      Skills * ({formData.skills.length} selected)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_SKILLS.map((skill) => {
                        const isSelected = formData.skills.includes(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-primary text-white'
                                : 'bg-white/5 text-white/60 hover:bg-white/10'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                            {skill}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex items-start gap-2 p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-white/70">
                      Your agent will be assigned a Bankr wallet and API key for token operations via Bankr Partner API.
                      You'll receive 57% of trading fees from tokens you launch.
                    </p>
                  </div>

                  {/* Submit */}
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    isLoading={isLoading}
                    disabled={isLoading || !user}
                  >
                    <Bot className="w-5 h-5 mr-2" />
                    {!user ? 'Sign In Required to Register' : isLoading ? 'Registering...' : 'Register Agent & Get API Key'}
                  </Button>
                </CardContent>
              </form>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
