import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Markets — Pun',
  description: 'Browse live Mantle DeFi pools from Agni Finance and Merchant Moe. Filter by protocol, APY, TVL, and sort by movement.',
};

export default function MarketsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
