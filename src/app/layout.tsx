import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { Providers } from '@/components/providers';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://mini-app-three-mauve.vercel.app'),
  title: 'Claude AI Agents - Farcaster Base Mini App',
  description: 'Launch AI-powered tokens, play games, and compete on leaderboards. The first proper Farcaster Mini App on Base with Bankr integration.',
  keywords: ['farcaster', 'base', 'mini app', 'ai agents', 'token launch', 'bankr', 'neynar'],
  authors: [{ name: 'Claude AI Agents' }],
  openGraph: {
    title: 'Claude AI Agents - Farcaster Base Mini App',
    description: 'Launch AI-powered tokens and compete on leaderboards',
    type: 'website',
    url: 'https://mini-app-three-mauve.vercel.app',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Claude AI Agents',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Claude AI Agents',
    description: 'Farcaster Base Mini App with AI-powered token launching',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  manifest: '/.well-known/farcaster.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0a0f',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased min-h-screen bg-dark text-white`}>
        <Providers>
          <div className="grid-pattern min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow pt-16">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
