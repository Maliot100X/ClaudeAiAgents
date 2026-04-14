'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bot, ArrowLeft, ExternalLink, Star, Rocket, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatNumber, formatAddress } from '@/lib/utils';

// This is a placeholder for the individual agent detail page
export default function AgentDetailPage() {
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
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-12 h-12 text-primary" />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-white mb-1">{agent.name}</h1>
                      <Link
                        href={`https://warpcast.com/${agent.ownerUsername}`}
                        target="_blank"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        @{agent.ownerUsername}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                    {agent.isActive && (
                      <Badge variant="accent">Active</Badge>
                    )}
                  </div>

                  <p className="text-white/60 mt-3">{agent.description}</p>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {agent.skills.map((skill, i) => (
                      <Badge key={i} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { icon: Star, label: 'Reputation', value: agent.reputation, color: 'accent' },
              { icon: Rocket, label: 'Launches', value: agent.tokensLaunched, color: 'primary' },
              { icon: TrendingUp, label: 'Volume', value: `$${formatNumber(agent.totalVolume)}`, color: 'secondary' },
              { label: 'Wallet', value: formatAddress(agent.bankrWalletAddress), color: 'base' },
            ].map((stat, i) => (
              <Card key={i} className="bg-white/5">
                <CardContent className="p-4 text-center">
                  {stat.icon && <stat.icon className={`w-5 h-5 text-${stat.color} mx-auto mb-2`} />}
                  <p className="text-xl font-bold text-white">{stat.value}</p>
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
