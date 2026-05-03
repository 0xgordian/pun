'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMantlePools } from '@/lib/services/mantleDeFiService';

interface MantleOrderBookData {
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
  best_bid: number;
  best_ask: number;
  spread: number;
  mid_price: number;
}

interface OrderBookProps {
  tokenId?: string | null;
  marketQuestion?: string;
}

async function fetchMantleOrderBook(contractAddress: string): Promise<MantleOrderBookData | null> {
  try {
    const pools = await fetchMantlePools();
    const pool = pools.find(
      (p) => p.contractAddress === contractAddress || p.id === contractAddress,
    );
    if (!pool) return null;

    // Synthesize a simplified order book from pool APY / liquidity data
    const midPrice = Math.min(0.99, Math.max(0.01, pool.apy / 100));
    const spread = 0.005; // 0.5% synthetic spread
    const best_bid = midPrice - spread / 2;
    const best_ask = midPrice + spread / 2;

    const bids = Array.from({ length: 5 }, (_, i) => ({
      price: (best_bid - i * 0.002).toFixed(4),
      size: ((pool.liquidity / 10) / (i + 1)).toFixed(0),
    }));
    const asks = Array.from({ length: 5 }, (_, i) => ({
      price: (best_ask + i * 0.002).toFixed(4),
      size: ((pool.liquidity / 10) / (i + 1)).toFixed(0),
    }));

    return { bids, asks, best_bid, best_ask, spread, mid_price: midPrice };
  } catch {
    return null;
  }
}

export default function OrderBook({ tokenId = null, marketQuestion = '' }: OrderBookProps) {
  const [book, setBook] = useState<MantleOrderBookData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (id: string) => {
    setIsLoading(true);
    const data = await fetchMantleOrderBook(id);
    setBook(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!tokenId) {
      setBook(null);
      return;
    }

    void load(tokenId);

    intervalRef.current = setInterval(() => {
      void load(tokenId);
    }, 30_000); // 30s refresh for Mantle pools

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [tokenId, load]);

  const topBids = book ? book.bids.slice(0, 5) : [];
  const topAsks = book ? book.asks.slice(0, 5) : [];

  return (
    <div style={{ backgroundColor: '#111', borderRadius: 0 }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <span className="font-terminal text-[10px] tracking-widest uppercase" style={{ color: '#555' }}>
          {'Liquidity Depth'} <span style={{ color: '#ff4500' }}>{'// Mantle'}</span>
        </span>
        {isLoading && (
          <svg
            className="w-3 h-3 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ color: '#555' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        )}
      </div>

      <div className="p-4">
        {!tokenId ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
            <p className="text-xs" style={{ color: '#555' }}>
              Select a pool to view liquidity depth
            </p>
          </div>
        ) : isLoading && !book ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-6 animate-pulse"
                style={{ backgroundColor: '#161616', borderRadius: 0 }}
              />
            ))}
          </div>
        ) : !book ? (
          <p className="text-xs text-center py-6" style={{ color: '#555' }}>
            Liquidity data unavailable
          </p>
        ) : (
          <div className="space-y-4">
            {marketQuestion && (
              <p className="text-xs line-clamp-1" style={{ color: '#555' }}>
                {marketQuestion}
              </p>
            )}

            {/* Key stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="border p-2" style={{ borderColor: 'rgba(255,255,255,0.06)', borderRadius: 0 }}>
                <p className="font-terminal text-[10px] tracking-widest uppercase" style={{ color: '#555' }}>
                  Best Bid
                </p>
                <p className="text-sm font-terminal font-bold" style={{ color: '#4ade80' }}>
                  {Math.round(book.best_bid * 100)}¢
                </p>
              </div>
              <div className="border p-2" style={{ borderColor: 'rgba(255,255,255,0.06)', borderRadius: 0 }}>
                <p className="font-terminal text-[10px] tracking-widest uppercase" style={{ color: '#555' }}>
                  Best Ask
                </p>
                <p className="text-sm font-terminal font-bold" style={{ color: '#f87171' }}>
                  {Math.round(book.best_ask * 100)}¢
                </p>
              </div>
              <div className="border p-2" style={{ borderColor: 'rgba(255,255,255,0.06)', borderRadius: 0 }}>
                <p className="font-terminal text-[10px] tracking-widest uppercase" style={{ color: '#555' }}>
                  Spread
                </p>
                <p className="text-sm font-terminal font-bold" style={{ color: '#a0a0a0' }}>
                  {Math.round(book.spread * 10000)} bps
                </p>
              </div>
            </div>

            {/* Mid price */}
            <div className="flex items-center gap-2">
              <span className="font-terminal text-[10px] tracking-widest uppercase" style={{ color: '#555' }}>
                Mid
              </span>
              <span className="font-terminal text-xs font-bold" style={{ color: '#f0f0f0' }}>
                {Math.round(book.mid_price * 100)}¢
              </span>
            </div>

            {/* Bids / Asks table */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="font-terminal text-[10px] tracking-widest uppercase mb-1.5" style={{ color: '#4ade80' }}>
                  Bids
                </p>
                <div className="space-y-0.5">
                  {topBids.length === 0 ? (
                    <p className="font-terminal text-[10px]" style={{ color: '#333' }}>—</p>
                  ) : (
                    topBids.map((bid, i) => (
                      <div key={i} className="grid grid-cols-2 gap-1">
                        <span className="font-terminal text-[11px]" style={{ color: '#4ade80' }}>
                          {Math.round(parseFloat(bid.price) * 100)}¢
                        </span>
                        <span className="font-terminal text-[11px] text-right" style={{ color: '#a0a0a0' }}>
                          {parseFloat(bid.size).toFixed(0)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <p className="font-terminal text-[10px] tracking-widest uppercase mb-1.5" style={{ color: '#f87171' }}>
                  Asks
                </p>
                <div className="space-y-0.5">
                  {topAsks.length === 0 ? (
                    <p className="font-terminal text-[10px]" style={{ color: '#333' }}>—</p>
                  ) : (
                    topAsks.map((ask, i) => (
                      <div key={i} className="grid grid-cols-2 gap-1">
                        <span className="font-terminal text-[11px]" style={{ color: '#f87171' }}>
                          {Math.round(parseFloat(ask.price) * 100)}¢
                        </span>
                        <span className="font-terminal text-[11px] text-right" style={{ color: '#a0a0a0' }}>
                          {parseFloat(ask.size).toFixed(0)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
