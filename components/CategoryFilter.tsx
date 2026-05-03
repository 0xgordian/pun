'use client';

import { useMemo } from 'react';

export type MarketCategory =
  | 'all'
  | 'agni'
  | 'merchant-moe'
  | 'lendle'
  | 'rwa'
  | 'stablecoins'
  | 'meth';

export const CATEGORIES: { value: MarketCategory; label: string; keywords: string[] }[] = [
  { value: 'all', label: 'All', keywords: [] },
  {
    value: 'agni',
    label: 'Agni',
    keywords: ['agni', 'agni-finance'],
  },
  {
    value: 'merchant-moe',
    label: 'Moe',
    keywords: ['merchant-moe', 'moe', 'lb'],
  },
  {
    value: 'lendle',
    label: 'Lendle',
    keywords: ['lendle', 'lend', 'borrow', 'supply'],
  },
  {
    value: 'rwa',
    label: 'RWA',
    keywords: ['rwa', 'usdy', 'ondo', 'real world', 'yield-bearing'],
  },
  {
    value: 'stablecoins',
    label: 'Stable',
    keywords: ['usdc', 'usdt', 'usdy', 'stable', 'usd'],
  },
  {
    value: 'meth',
    label: 'mETH',
    keywords: ['meth', 'staked', 'liquid staking', 'lsd'],
  },
];

/**
 * Filter markets by Mantle DeFi category.
 * Matches on question text (which includes protocol name from mantlePoolToMarket adapter).
 */
export function filterByCategory<T extends { question: string }>(
  markets: T[],
  category: MarketCategory,
): T[] {
  if (category === 'all') return markets;
  const cat = CATEGORIES.find((c) => c.value === category);
  if (!cat) return markets;
  return markets.filter((m) =>
    cat.keywords.some((kw) => m.question.toLowerCase().includes(kw)),
  );
}

interface CategoryFilterProps {
  value: MarketCategory;
  onChange: (cat: MarketCategory) => void;
  markets?: { question: string }[];
  showCounts?: boolean;
}

export default function CategoryFilter({
  value,
  onChange,
  markets = [],
  showCounts = false,
}: CategoryFilterProps) {
  const counts = useMemo(() => {
    if (!showCounts) return {} as Record<MarketCategory, number>;
    return Object.fromEntries(
      CATEGORIES.filter((c) => c.value !== 'all').map((cat) => [
        cat.value,
        markets.filter((m) =>
          cat.keywords.some((kw) => m.question.toLowerCase().includes(kw)),
        ).length,
      ]),
    ) as Record<MarketCategory, number>;
  }, [markets, showCounts]);

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
      {CATEGORIES.map((cat) => {
        const isActive = value === cat.value;
        const count = showCounts && cat.value !== 'all' ? (counts[cat.value] ?? 0) : null;

        return (
          <button
            key={cat.value}
            onClick={() => onChange(cat.value)}
            className="flex-none flex items-center gap-1.5 px-3 py-1.5 border font-terminal text-[10px] tracking-widest uppercase transition-all whitespace-nowrap"
            style={{
              backgroundColor: isActive ? 'rgba(124,58,237,0.12)' : 'transparent',
              borderColor: isActive ? '#7c3aed' : 'rgba(255,255,255,0.10)',
              color: isActive ? '#7c3aed' : '#555',
              borderRadius: 12,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                e.currentTarget.style.color = '#a0a0a0';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
                e.currentTarget.style.color = '#555';
              }
            }}
          >
            {cat.label}
            {count !== null && count > 0 && (
              <span
                className="font-terminal text-[9px]"
                style={{ color: isActive ? '#7c3aed' : '#444' }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
