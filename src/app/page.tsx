'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Rocket, 
  Gamepad2, 
  Bot, 
  Trophy,
  Zap,
  Shield,
  TrendingUp,
  Users
} from 'lucide-react';
import { useMiniApp } from '@/components/providers/miniapp-provider';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';

const features = [
  {
    title: 'Launch Tokens',
    description: 'Deploy AI-powered tokens on Base with one click',
    icon: Rocket,
    href: '/launch',
    color: 'primary',
    stats: '50+ Launches',
  },
  {
    title: 'Play to Earn',
    description: 'Compete in mini-games and climb leaderboards',
    icon: Gamepad2,
    href: '/play',
    color: 'accent',
    stats: '1,000+ Players',
  },
  {
    title: 'AI Agents',
    description: 'Browse and hire specialized AI agents',
    icon: Bot,
    href: '/agents',
    color: 'secondary',
    stats: '25+ Agents',
  },
  {
    title: 'Leaderboard',
    description: 'See top performers and earn rewards',
    icon: Trophy,
    href: '/leaderboard',
    color: 'base',
    stats: 'Weekly Prizes',
  },
];

const highlights = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Sub-second transactions on Base',
  },
  {
    icon: Shield,
    title: 'Secure',
    description: 'Non-custodial via Bankr integration',
  },
  {
    icon: TrendingUp,
    title: 'Social Trading',
    description: 'Follow Farcaster traders',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Built for Farcaster users',
  },
];

export default function HomePage() {
  const { isReady, isInFrame, user } = useMiniApp();
  const { isAuthenticated } = useAppStore();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {isInFrame ? '🚀 Running in Farcaster' : 'Farcaster Mini App'}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
              <span className="text-gradient">Claude AI</span>
              <br />
              <span className="text-white">Agents</span>
            </h1>

            {/* Description */}
            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
              The first proper Farcaster Mini App on Base. Launch AI-powered tokens, 
              compete in games, and climb the leaderboards.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/launch">
                <Button size="lg" className="gap-2">
                  <Rocket className="w-5 h-5" />
                  Launch Token
                </Button>
              </Link>
              <Link href="/play">
                <Button size="lg" variant="outline" className="gap-2">
                  <Gamepad2 className="w-5 h-5" />
                  Play Games
                </Button>
              </Link>
            </div>

            {/* User Context */}
            {isAuthenticated && user && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10"
              >
                {user.pfpUrl && (
                  <img
                    src={user.pfpUrl}
                    alt={user.username}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div className="text-left">
                  <p className="font-medium text-white">Welcome, @{user.username}</p>
                  <p className="text-sm text-white/50">FID: {user.fid}</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div key={feature.title} variants={itemVariants}>
                  <Link href={feature.href}>
                    <Card className="h-full hover:border-primary/50 transition-all duration-300 group cursor-pointer">
                      <CardContent className="p-6">
                        <div className={`w-12 h-12 rounded-xl bg-${feature.color}/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <Icon className={`w-6 h-6 text-${feature.color}`} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                        <p className="text-sm text-white/60 mb-4">{feature.description}</p>
                        <div className={`text-xs font-medium text-${feature.color}`}>
                          {feature.stats}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {highlights.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                  <p className="text-sm text-white/50">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Footer */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-gradient">50+</div>
              <div className="text-sm text-white/50">Tokens Launched</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gradient">$2M+</div>
              <div className="text-sm text-white/50">Total Volume</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gradient">1,000+</div>
              <div className="text-sm text-white/50">Active Users</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
