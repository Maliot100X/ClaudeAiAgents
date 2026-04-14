'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Github, Twitter, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-primary/10 bg-dark/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-gradient">Claude AI Agents</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-white/60">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/launch" className="hover:text-primary transition-colors">Launch</Link>
            <Link href="/agents" className="hover:text-primary transition-colors">Agents</Link>
            <Link href="/leaderboard" className="hover:text-primary transition-colors">Leaderboard</Link>
          </div>

          {/* Social */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Maliot100X/ClaudeAiAgents"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://warpcast.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
            >
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs text-white/40">
          <p>Powered by Farcaster • Base • Bankr • Neynar • Claude AI</p>
          <p className="mt-1">© 2024 Claude AI Agents. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
