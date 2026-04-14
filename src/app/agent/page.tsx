'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bot, ArrowLeft, ExternalLink, Star, Rocket, TrendingUp, Coins, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatNumber, formatAddress } from '@/lib/utils';

interface Token {
  id: string;
  name: string;
  symbol: string;
  contractAddress: string;
  imageUrl?: string;
  launchedAt: string;
  marketCap?: number;
  volume24h?: number;
  price?: number;
  txHash?: string;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  ownerUsername: string;
  ownerFid: number;
  skills: string[];
  reputation: number;
  tokensLaunched: number;
  totalVolume: number;
  bankrWalletAddress: string;
  isActive: boolean;
  createdAt: string;
  launches?: Token[];
}

// Inner component that uses search params
function AgentDetailContent() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get('id');
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!agentId) {
      setError('No agent ID provided');
      setLoading(false);
      return;
    }

    // Fetch agent data
    fetch(`/api/agents?agentId=${agentId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAgent(data.data);
        } else {
          setError(data.error || 'Failed to load agent');
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [agentId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Bot className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-white/60">Loading agent...</p>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Agent not found'}</p>
          <Link href="/agents">
            <Button>Back to Agents</Button>
          </Link>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Reputation', value: formatNumber(agent.reputation), icon: Star },
    { label: 'Tokens Launched', value: agent.tokensLaunched || (agent.launches?.length || 0), icon: Rocket },
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
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {agent.imageUrl ? (
                    <img src={agent.imageUrl} alt={agent.name} className="w-full h-full object-cover" />
                  ) : (
                    <Bot className="w-10 h-10 text-white" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">{agent.name}</h1>
                    <Badge variant={agent.isActive ? 'default' : 'outline'}>
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-white/60 mb-2">{agent.description}</p>
                  <p className="text-sm text-white/40">
                    By @{agent.ownerUsername} • FID:{agent.ownerFid}
                  </p>
                  {agent.createdAt && (
                    <p className="text-xs text-white/30 mt-1">
                      Created {new Date(agent.createdAt).toLocaleDateString()}
                    </p>
                  )}
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
                {agent.skills?.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                )) || <span className="text-white/40">No skills listed</span>}
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
                <span className="text-sm font-mono">{formatAddress(agent.bankrWalletAddress)}</span>
                <button
                  onClick={() => copyToClipboard(agent.bankrWalletAddress)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <Link
                  href={`https://basescan.org/address/${agent.bankrWalletAddress}`}
                  target="_blank"
                  className="text-primary hover:text-primary/80 ml-auto"
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

          {/* Token Launches */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Token Launches</h2>
              </div>
            </CardHeader>
            <CardContent>
              {agent.launches && agent.launches.length > 0 ? (
                <div className="space-y-4">
                  {agent.launches.map((token) => (
                    <div key={token.id} className="p-4 bg-white/5 rounded-xl">
                      <div className="flex items-start gap-4">
                        {token.imageUrl && (
                          <img 
                            src={token.imageUrl} 
                            alt={token.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{token.name}</h3>
                            <Badge variant="outline">{token.symbol}</Badge>
                          </div>
                          <p className="text-xs text-white/40 font-mono mb-2">
                            {formatAddress(token.contractAddress)}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            {token.marketCap !== undefined && (
                              <span className="text-white/60">
                                MCAP: <span className="text-white">${formatNumber(token.marketCap)}</span>
                              </span>
                            )}
                            {token.volume24h !== undefined && (
                              <span className="text-white/60">
                                Vol: <span className="text-white">${formatNumber(token.volume24h)}</span>
                              </span>
                            )}
                            {token.price !== undefined && (
                              <span className="text-white/60">
                                Price: <span className="text-white">${token.price.toFixed(8)}</span>
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Link
                              href={`https://bankr.bot/token/${token.contractAddress}`}
                              target="_blank"
                              className="text-xs text-primary hover:text-primary/80 inline-flex items-center gap-1"
                            >
                              View on Bankr <ExternalLink className="w-3 h-3" />
                            </Link>
                            {token.txHash && (
                              <Link
                                href={`https://basescan.org/tx/${token.txHash}`}
                                target="_blank"
                                className="text-xs text-white/40 hover:text-white inline-flex items-center gap-1"
                              >
                                Transaction <ExternalLink className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Coins className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40 mb-4">No tokens launched yet</p>
                  <Link href={`/launch?agentId=${agent.id}`}>
                    <Button size="sm" className="gap-2">
                      <Rocket className="w-4 h-4" />
                      Launch First Token
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Link href={`/launch?agentId=${agent.id}`} className="flex-1">
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
