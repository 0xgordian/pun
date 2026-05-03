import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portfolio — Pun',
  description: 'Track your Mantle DeFi positions, P&L, price alerts, and trade history.',
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
