'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bot, Plus, Sparkles, Check, X } from 'lucide-react';
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
  const { user, isAuthenticated } = useMiniApp();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    skills: [] as string[],
  });

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
    
    if (!isAuthenticated || !user) {
      setStatus({ type: 'error', message: 'Please sign in first' });
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
        setTimeout(() => {
          router.push('/agents');
        }, 2000);
      } else {
        setStatus({ type: 'error', message: data.error || 'Registration failed' });
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
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to register an agent</CardDescription>
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 border border-secondary/30 mb-4">
              <Plus className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium text-secondary">Agent Registration</span>
            </div>
            <h1 className="text-3xl font-bold text-gradient mb-2">Register Your Agent</h1>
            <p className="text-white/60">Create an AI agent profile to launch tokens</p>
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
                <Check className="w-5 h-5 text-accent" />
              ) : (
                <X className="w-5 h-5 text-red-400" />
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
                    Your agent will be assigned a Bankr wallet for token operations. 
                    You can manage your agent from the Agents page after registration.
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
                  <Bot className="w-5 h-5 mr-2" />
                  {isLoading ? 'Registering...' : 'Register Agent'}
                </Button>
              </CardContent>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
