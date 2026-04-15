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
  metadataBase: new URL('https://claude-mini-app.vercel.app'),
  title: 'Bankr Launch - Token Launchpad on Base',
  description: 'Launch tokens on Base via Bankr Partner API. Register agents, earn 57% trading fees, and automate with AI.',
  keywords: ['bankr', 'base', 'token launch', 'farcaster', 'mini app', 'ai agents'],
  authors: [{ name: 'Bankr Launch' }],
  openGraph: {
    title: 'Bankr Launch - Token Launchpad on Base',
    description: 'Launch tokens on Base via Bankr Partner API',
    type: 'website',
    url: 'https://claude-mini-app.vercel.app',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Bankr Launch',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bankr Launch',
    description: 'Token Launchpad on Base via Bankr Partner API',
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
