'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  Crown, 
  ArrowUp, 
  ArrowDown, 
  Minus,
  Flame,
  Target
} from 'lucide-react';
import type { LeaderboardEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNumber, formatCurrency } from '@/lib/utils';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState('all');

  useEffect(() => {
    fetchLeaderboard();
  }, [timeFrame]);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`/api/leaderboard?timeFrame=${timeFrame}&limit=100`);
      const data = await response.json();
      
      if (data.success) {
        setLeaderboard(data.data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center font-bold text-white/60">{rank}</span>;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="w-4 h-4 text-accent" />;
    if (change < 0) return <ArrowDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-white/40" />;
  };

  const timeFrames = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-base/20 border border-base/30 mb-4">
            <Trophy className="w-4 h-4 text-base" />
            <span className="text-sm font-medium text-base">Leaderboard</span>
          </div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Top Performers</h1>
          <p className="text-white/60">Compete and earn rewards for launching tokens</p>
        </div>

        {/* Time Frame Selector */}
        <div className="flex justify-center gap-2 mb-8">
          {timeFrames.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeFrame(tf.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                timeFrame === tf.value
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && !isLoading && (
          <div className="flex items-end justify-center gap-4 mb-12">
            {/* 2nd Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 p-0.5 mb-2">
                {leaderboard[1]?.pfpUrl ? (
                  <img
                    src={leaderboard[1].pfpUrl}
                    alt={leaderboard[1].username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-dark flex items-center justify-center">
                    <span className="text-2xl">🥈</span>
                  </div>
                )}
              </div>
              <p className="font-semibold text-white">@{leaderboard[1]?.username}</p>
              <p className="text-sm text-gray-300">{formatNumber(leaderboard[1]?.score)} pts</p>
              <div className="w-20 h-24 bg-gray-400/20 rounded-t-lg mt-2 flex items-end justify-center pb-2">
                <span className="text-2xl font-bold text-gray-300">2</span>
              </div>
            </motion.div>

            {/* 1st Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 p-0.5 mb-2 glow-primary">
                {leaderboard[0]?.pfpUrl ? (
                  <img
                    src={leaderboard[0].pfpUrl}
                    alt={leaderboard[0].username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-dark flex items-center justify-center">
                    <span className="text-3xl">👑</span>
                  </div>
                )}
              </div>
              <p className="font-bold text-white text-lg">@{leaderboard[0]?.username}</p>
              <p className="text-sm text-yellow-400">{formatNumber(leaderboard[0]?.score)} pts</p>
              <div className="w-24 h-32 bg-yellow-400/20 rounded-t-lg mt-2 flex items-end justify-center pb-2">
                <span className="text-3xl font-bold text-yellow-400">1</span>
              </div>
            </motion.div>

            {/* 3rd Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 p-0.5 mb-2">
                {leaderboard[2]?.pfpUrl ? (
                  <img
                    src={leaderboard[2].pfpUrl}
                    alt={leaderboard[2].username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-dark flex items-center justify-center">
                    <span className="text-2xl">🥉</span>
                  </div>
                )}
              </div>
              <p className="font-semibold text-white">@{leaderboard[2]?.username}</p>
              <p className="text-sm text-amber-600">{formatNumber(leaderboard[2]?.score)} pts</p>
              <div className="w-20 h-16 bg-amber-600/20 rounded-t-lg mt-2 flex items-end justify-center pb-2">
                <span className="text-2xl font-bold text-amber-600">3</span>
              </div>
            </motion.div>
          </div>
        )}

        {/* Leaderboard List */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" />
                Rankings
              </CardTitle>
              <Badge variant="outline">{leaderboard.length} Users</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="spinner" />
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">No rankings yet. Be the first to launch!</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {leaderboard.slice(3).map((entry, index) => (
                  <motion.div
                    key={entry.fid}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
                  >
                    {/* Rank */}
                    <div className="w-8 flex-shrink-0">
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0 overflow-hidden">
                      {entry.pfpUrl ? (
                        <img
                          src={entry.pfpUrl}
                          alt={entry.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/40">
                          @{entry.username[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">@{entry.username}</p>
                      <p className="text-xs text-white/50">
                        {entry.tokensLaunched} launches • {formatCurrency(entry.totalVolume)} volume
                      </p>
                    </div>

                    {/* Change */}
                    <div className="flex items-center gap-1">
                      {getChangeIcon(entry.change24h)}
                      <span className={`text-sm ${entry.change24h > 0 ? 'text-accent' : entry.change24h < 0 ? 'text-red-400' : 'text-white/40'}`}>
                        {Math.abs(entry.change24h)}
                      </span>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <p className="font-bold text-white">{formatNumber(entry.score)}</p>
                      <p className="text-xs text-white/40">pts</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* How to Earn */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">How to Earn Points</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { action: 'Launch a token', points: 100 },
              { action: 'Reach $10K market cap', points: 500 },
              { action: 'Get 100+ holders', points: 200 },
              { action: 'Top weekly volume', points: 1000 },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <span className="text-white/70">{item.action}</span>
                <Badge variant="secondary">+{item.points} pts</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
