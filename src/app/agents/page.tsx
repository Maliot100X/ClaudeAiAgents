'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Bot, 
  Plus, 
  Star, 
  Rocket, 
  TrendingUp, 
  ExternalLink,
  Search,
  Filter,
  User,
  ArrowLeft
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { Agent } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatNumber, formatAddress } from '@/lib/utils';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthenticated, user } = useAppStore();
  const searchParams = useSearchParams();
  const ownerFid = searchParams.get('owner');
  const isMyAgents = ownerFid && user && parseInt(ownerFid) === user.fid;

  useEffect(() => {
    fetchAgents();
  }, [ownerFid]);

  const fetchAgents = async () => {
    try {
      let url = '/api/agents';
      if (ownerFid) {
        url += `?ownerFid=${ownerFid}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setAgents(data.data);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.ownerUsername.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 border border-secondary/30 mb-4">
              {isMyAgents ? (
                <>
                  <User className="w-4 h-4 text-secondary" />
                  <span className="text-sm font-medium text-secondary">My Agents</span>
                </>
              ) : ownerFid ? (
                <>
                  <Bot className="w-4 h-4 text-secondary" />
                  <span className="text-sm font-medium text-secondary">User's Agents</span>
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4 text-secondary" />
                  <span className="text-sm font-medium text-secondary">AI Agents</span>
                </>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gradient">
              {isMyAgents ? 'My Agents' : ownerFid ? `FID:${ownerFid}'s Agents` : 'Browse Agents'}
            </h1>
            <p className="text-white/60 mt-1">
              {isMyAgents 
                ? 'Manage your registered AI agents and their token launches' 
                : ownerFid 
                  ? `Viewing all agents registered by FID:${ownerFid}`
                  : 'Discover and hire specialized AI agents'}
            </p>
          </div>

          <div className="flex gap-2">
            {ownerFid && (
              <Link href="/agents">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  All Agents
                </Button>
              </Link>
            )}
            {isAuthenticated && (
              <Link href="/register">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Register Agent
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Search agents by name, description, or owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="flex-shrink-0">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Agents', value: agents.length },
            { label: 'Active', value: agents.filter(a => a.isActive).length },
            { label: 'Tokens Launched', value: agents.reduce((acc, a) => acc + a.tokensLaunched, 0) },
            { label: 'Total Volume', value: formatNumber(agents.reduce((acc, a) => acc + a.totalVolume, 0)) },
          ].map((stat, i) => (
            <Card key={i} className="bg-white/5">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/50">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Agents Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner" />
          </div>
        ) : filteredAgents.length === 0 ? (
          <Card className="text-center py-16">
            <Bot className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No agents found</h3>
            <p className="text-white/50 mb-6">
              {searchQuery ? 'Try adjusting your search' : 'Be the first to register an agent'}
            </p>
            {isAuthenticated && (
              <Link href="/register">
                <Button>Register Agent</Button>
              </Link>
            )}
          </Card>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredAgents.map((agent) => (
              <motion.div key={agent.id} variants={itemVariants}>
                <Card className="h-full hover:border-primary/40 transition-all duration-300 group">
                  <CardHeader className="p-6 pb-0">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                          <Bot className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white group-hover:text-primary transition-colors">
                            {agent.name}
                          </h3>
                          <Link 
                            href={`https://warpcast.com/${agent.ownerUsername}`}
                            target="_blank"
                            className="text-xs text-white/50 hover:text-primary flex items-center gap-1"
                          >
                            @{agent.ownerUsername}
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                      {agent.isActive && (
                        <Badge variant="accent" className="flex-shrink-0">Active</Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-4">
                    <p className="text-sm text-white/60 line-clamp-2">
                      {agent.description}
                    </p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1">
                      {agent.skills.slice(0, 3).map((skill, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {agent.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{agent.skills.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-accent">
                          <Star className="w-3 h-3" />
                          <span className="text-sm font-semibold">{agent.reputation}</span>
                        </div>
                        <p className="text-xs text-white/40">Rep</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-primary">
                          <Rocket className="w-3 h-3" />
                          <span className="text-sm font-semibold">{agent.tokensLaunched}</span>
                        </div>
                        <p className="text-xs text-white/40">Launches</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-secondary">
                          <TrendingUp className="w-3 h-3" />
                          <span className="text-sm font-semibold">
                            {formatNumber(agent.totalVolume)}
                          </span>
                        </div>
                        <p className="text-xs text-white/40">Volume</p>
                      </div>
                    </div>

                    {/* Wallet */}
                    {agent.bankrWalletAddress && (
                      <div className="pt-2 border-t border-white/10">
                        <p className="text-xs text-white/40">
                          Wallet: {formatAddress(agent.bankrWalletAddress)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
