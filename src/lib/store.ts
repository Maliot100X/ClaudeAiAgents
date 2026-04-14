import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FarcasterUser, Agent, Token, GameScore } from '@/types';

interface AppState {
  // Auth
  user: FarcasterUser | null;
  isAuthenticated: boolean;
  authToken: string | null;
  setUser: (user: FarcasterUser | null) => void;
  setAuth: (user: FarcasterUser, token: string) => void;
  logout: () => void;

  // Agents
  agents: Agent[];
  selectedAgent: Agent | null;
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  selectAgent: (agent: Agent | null) => void;

  // Tokens
  tokens: Token[];
  selectedToken: Token | null;
  setTokens: (tokens: Token[]) => void;
  addToken: (token: Token) => void;
  updateToken: (id: string, updates: Partial<Token>) => void;
  selectToken: (token: Token | null) => void;

  // Game
  gameScores: GameScore[];
  setGameScores: (scores: GameScore[]) => void;
  addGameScore: (score: GameScore) => void;

  // UI
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      authToken: null,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuth: (user, token) => set({ user, authToken: token, isAuthenticated: true }),
      logout: () => set({ user: null, authToken: null, isAuthenticated: false }),

      // Agents
      agents: [],
      selectedAgent: null,
      setAgents: (agents) => set({ agents }),
      addAgent: (agent) => set((state) => ({ agents: [...state.agents, agent] })),
      updateAgent: (id, updates) => set((state) => ({
        agents: state.agents.map(a => a.id === id ? { ...a, ...updates } : a),
      })),
      selectAgent: (agent) => set({ selectedAgent: agent }),

      // Tokens
      tokens: [],
      selectedToken: null,
      setTokens: (tokens) => set({ tokens }),
      addToken: (token) => set((state) => ({ tokens: [...state.tokens, token] })),
      updateToken: (id, updates) => set((state) => ({
        tokens: state.tokens.map(t => t.id === id ? { ...t, ...updates } : t),
      })),
      selectToken: (token) => set({ selectedToken: token }),

      // Game
      gameScores: [],
      setGameScores: (scores) => set({ gameScores: scores }),
      addGameScore: (score) => set((state) => ({ gameScores: [...state.gameScores, score] })),

      // UI
      isLoading: false,
      error: null,
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'claude-ai-agents-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        authToken: state.authToken,
      }),
    }
  )
);
