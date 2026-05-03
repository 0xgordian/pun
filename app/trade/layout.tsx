import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trade — Pun',
  description: 'Live Mantle DeFi pool dashboard with edge scoring, yield analysis, and AI-powered strategy simulation.',
};

export default function TradeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
