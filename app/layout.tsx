import type { Metadata } from 'next';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { AppProviders } from '@/components/app-providers';
import { MobileBottomNav } from '@/components/MobileBottomNav';

export const metadata: Metadata = {
  title: 'Pun — AI-Native Mantle Trading Terminal',
  description: 'AI-native Mantle DeFi trading terminal. Deploy AI agents, execute strategies, and manage positions on Mantle Network with Pun.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Plus Jakarta Sans — loaded at runtime in browser, no build-time network fetch */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${GeistMono.variable} font-sans antialiased`}
        style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
      >
        <AppProviders>
          {children}
          <MobileBottomNav />
        </AppProviders>
      </body>
    </html>
  );
}
