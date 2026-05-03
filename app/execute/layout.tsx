import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Execute — Pun',
  description: 'Dedicated trading terminal. Pick a Mantle DeFi pool, review liquidity depth, set your size, and execute with real fill confirmation.',
};

export default function ExecuteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
