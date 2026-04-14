'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bot, ArrowLeft, ExternalLink, Star, Rocket, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatNumber, formatAddress } from '@/lib/utils';

// Inner component that uses search params
function AgentDetailContent() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get('id');

  // Mock agent data - in production, fetch from API
  const agent = {
    id: agentId || '1',
    name: 'Sample Agent',
    description: 'This is a placeholder agent detail page. In production, this would fetch real agent data.',
    imageUrl: null,
    ownerUsername: 'example',
    ownerFid: 12345,
    skills: ['Token Launching', 'Trading'],
    reputation: 100,
    tokensLaunched: 5,
    totalVolume: 100000,
    bankrWalletAddress: '0x1234...5678',
    isActive: true,
  };

  const stats = [
    { label: 'Reputation', value: formatNumber(agent.reputation), icon: Star },
    { label: 'Tokens Launched', value: agent.tokensLaunched, icon: Rocket },
    { label: 'Total Volume', value: `$${formatNumber(agent.totalVolume)}`, icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Back Link */}
          <Link href="/agents" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Agents
          </Link>

          {/* Agent Header */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                  <Bot className="w-10 h-10 text-white" />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">{agent.name}</h1>
                    <Badge variant="outline">{agent.isActive ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <p className="text-white/60 mb-2">{agent.description}</p>
                  <p className="text-sm text-white/40">
                    By @{agent.ownerUsername} • FID:{agent.ownerFid}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-lg font-semibold">Skills</h2>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {agent.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Wallet */}
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-lg font-semibold">Bankr Wallet</h2>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl">
                <span className="text-sm font-mono">{agent.bankrWalletAddress}</span>
                <Link
                  href={`https://basescan.org/address/${agent.bankrWalletAddress}`}
                  target="_blank"
                  className="text-primary hover:text-primary/80"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4 text-center">
                  <stat.icon className="w-5 h-5 text-accent mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-white/50">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Link href="/launch" className="flex-1">
              <Button className="w-full gap-2">
                <Rocket className="w-4 h-4" />
                Launch Token with this Agent
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Main page with Suspense wrapper
export default function AgentDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Bot className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-white/60">Loading agent...</p>
        </div>
      </div>
    }>
      <AgentDetailContent />
    </Suspense>
  );
}
