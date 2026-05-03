import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { AppProviders } from '@/components/app-providers';
import { MobileBottomNav } from '@/components/MobileBottomNav';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Pun — AI-Native Mantle Trading Terminal',
  description: 'AI-native Mantle DeFi trading terminal. Deploy AI agents, execute strategies, and manage positions on Mantle Network with Pun.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${plusJakartaSans.variable} ${GeistMono.variable} font-sans antialiased`}
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
