'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gamepad2, 
  Trophy, 
  Target, 
  Zap,
  RotateCcw,
  Star,
  Clock
} from 'lucide-react';
import { useMiniApp } from '@/components/providers/miniapp-provider';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Simple reaction game
const ReactionGame = ({ onScore }: { onScore: (score: number) => void }) => {
  const [gameState, setGameState] = useState<'waiting' | 'ready' | 'clicked' | 'result'>('waiting');
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const startGame = () => {
    setGameState('waiting');
    setReactionTime(0);
    
    const delay = Math.random() * 3000 + 2000; // 2-5 second delay
    const id = setTimeout(() => {
      setGameState('ready');
      setStartTime(Date.now());
    }, delay);
    
    setTimeoutId(id);
  };

  const handleClick = () => {
    if (timeoutId) clearTimeout(timeoutId);
    
    if (gameState === 'waiting') {
      setGameState('clicked');
    } else if (gameState === 'ready') {
      const time = Date.now() - startTime;
      setReactionTime(time);
      setGameState('result');
      
      // Calculate score (lower is better, max 1000 points)
      const score = Math.max(0, 1000 - time);
      onScore(score);
    }
  };

  const getColor = () => {
    if (gameState === 'waiting') return 'bg-red-500';
    if (gameState === 'ready') return 'bg-accent';
    if (gameState === 'clicked') return 'bg-red-600';
    return reactionTime < 300 ? 'bg-accent' : reactionTime < 500 ? 'bg-secondary' : 'bg-primary';
  };

  const getText = () => {
    if (gameState === 'waiting') return 'Wait for green...';
    if (gameState === 'ready') return 'CLICK NOW!';
    if (gameState === 'clicked') return 'Too early!';
    return `${reactionTime}ms`;
  };

  return (
    <div className="space-y-4">
      <div 
        onClick={handleClick}
        className={`h-48 rounded-2xl ${getColor()} flex items-center justify-center cursor-pointer transition-all duration-100 select-none`}
      >
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{getText()}</p>
          {gameState === 'result' && (
            <p className="text-sm text-white/80 mt-2">
              Score: {Math.max(0, 1000 - reactionTime)} points
            </p>
          )}
        </div>
      </div>
      
      {gameState === 'result' && (
        <Button onClick={startGame} className="w-full gap-2">
          <RotateCcw className="w-4 h-4" />
          Play Again
        </Button>
      )}
      
      {gameState === 'waiting' && (
        <p className="text-center text-sm text-white/50">
          Click anywhere when the box turns green!
        </p>
      )}
    </div>
  );
};

// Click speed game
const ClickSpeedGame = ({ onScore }: { onScore: (score: number) => void }) => {
  const [timeLeft, setTimeLeft] = useState(10);
  const [clicks, setClicks] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      const score = clicks * 10;
      onScore(score);
    }
  }, [timeLeft, isPlaying, clicks, onScore]);

  const startGame = () => {
    setTimeLeft(10);
    setClicks(0);
    setIsPlaying(true);
  };

  const handleClick = () => {
    if (isPlaying) {
      setClicks(c => c + 1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="font-mono text-xl">{timeLeft}s</span>
        </div>
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-accent" />
          <span className="font-mono text-xl">{clicks}</span>
        </div>
      </div>

      {!isPlaying && clicks === 0 ? (
        <Button onClick={startGame} className="w-full h-32 text-xl gap-2">
          <Zap className="w-6 h-6" />
          Start Clicking!
        </Button>
      ) : !isPlaying ? (
        <div className="h-32 rounded-2xl bg-primary/20 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">Game Over!</p>
            <p className="text-accent">Score: {clicks * 10} points</p>
            <Button onClick={startGame} variant="outline" size="sm" className="mt-2">
              <RotateCcw className="w-4 h-4 mr-1" />
              Play Again
            </Button>
          </div>
        </div>
      ) : (
        <div 
          onClick={handleClick}
          className="h-32 rounded-2xl bg-gradient-to-br from-primary to-accent cursor-pointer active:scale-95 transition-transform flex items-center justify-center select-none"
        >
          <p className="text-xl font-bold text-white">CLICK ME!</p>
        </div>
      )}
    </div>
  );
};

const games = [
  {
    id: 'reaction',
    name: 'Reaction Time',
    description: 'Test your reflexes! Click when the box turns green.',
    icon: Zap,
    component: ReactionGame,
  },
  {
    id: 'clickspeed',
    name: 'Click Speed',
    description: 'How many times can you click in 10 seconds?',
    icon: Target,
    component: ClickSpeedGame,
  },
];

export default function PlayPage() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [gameScores, setGameScores] = useState<{ [key: string]: number }>({});
  const { user, isAuthenticated } = useMiniApp();

  const handleScore = useCallback((gameId: string, score: number) => {
    setGameScores(prev => ({
      ...prev,
      [gameId]: Math.max(prev[gameId] || 0, score),
    }));

    // Save to server if authenticated
    if (isAuthenticated && user) {
      fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid: user.fid,
          score: score,
        }),
      }).catch(console.error);
    }
  }, [isAuthenticated, user]);

  const selectedGameData = games.find(g => g.id === selectedGame);
  const GameComponent = selectedGameData?.component;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 mb-4">
            <Gamepad2 className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">Play to Earn</span>
          </div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Mini Games</h1>
          <p className="text-white/60">Play games and earn points for the leaderboard</p>
        </div>

        <AnimatePresence mode="wait">
          {selectedGame && GameComponent ? (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedGame(null)}
                      className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      ←
                    </button>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {selectedGameData.icon && <selectedGameData.icon className="w-5 h-5 text-primary" />}
                        {selectedGameData.name}
                      </CardTitle>
                    </div>
                  </div>
                  {gameScores[selectedGame] > 0 && (
                    <Badge variant="accent">
                      <Star className="w-3 h-3 mr-1" />
                      Best: {gameScores[selectedGame]}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <GameComponent onScore={(score) => handleScore(selectedGame, score)} />
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {games.map((game) => {
                const Icon = game.icon;
                const highScore = gameScores[game.id] || 0;
                
                return (
                  <Card
                    key={game.id}
                    className="cursor-pointer hover:border-primary/40 transition-all duration-300 group"
                    onClick={() => setSelectedGame(game.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Icon className="w-7 h-7 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-lg mb-1 group-hover:text-primary transition-colors">
                            {game.name}
                          </h3>
                          <p className="text-sm text-white/60 mb-3">
                            {game.description}
                          </p>
                          {highScore > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Trophy className="w-3 h-3 mr-1" />
                              Best Score: {highScore}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Coming Soon Card */}
              <Card className="border-dashed border-white/20">
                <CardContent className="p-6 flex items-center justify-center h-full min-h-[140px]">
                  <p className="text-white/40 text-center">
                    More games coming soon!
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* How It Works */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium text-white">Play Games</p>
                <p className="text-sm text-white/60">Choose a game and test your skills</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-accent">2</span>
              </div>
              <div>
                <p className="font-medium text-white">Earn Points</p>
                <p className="text-sm text-white/60">Your scores contribute to your leaderboard rank</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-secondary">3</span>
              </div>
              <div>
                <p className="font-medium text-white">Win Rewards</p>
                <p className="text-sm text-white/60">Top players receive weekly token rewards</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
