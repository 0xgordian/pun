/**
 * Property-based tests for marketService
 *
 * P3: mantlePoolToMarket(pool).currentProbability is always in range [1, 99]
 *
 * Requirements: 3.3
 */

import { describe, it, expect } from 'vitest';
import { mantlePoolToMarket } from '../marketService';
import type { MantlePool } from '../mantleDeFiService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePool(overrides: Partial<MantlePool> = {}): MantlePool {
  return {
    id: 'test-pool',
    protocol: 'agni-finance',
    name: 'mETH-USDC',
    tvl: 12500000,
    apy: 12.4,
    token0: 'mETH',
    token1: 'USDC',
    liquidity: 8500000,
    volume24h: 3200000,
    contractAddress: '0x319B69888b0d11cEC22caA5034e25FfFBDc88421',
    oneDayPriceChange: null,
    ...overrides,
  };
}

// ─── P3: currentProbability always in [1, 99] ─────────────────────────────────

describe('mantlePoolToMarket — P3: currentProbability in [1, 99]', () => {
  it('maps normal APY (12.4%) to probability in [1, 99]', () => {
    const market = mantlePoolToMarket(makePool({ apy: 12.4 }));
    expect(market.currentProbability).toBeGreaterThanOrEqual(1);
    expect(market.currentProbability).toBeLessThanOrEqual(99);
    expect(market.currentProbability).toBe(12); // Math.round(12.4) = 12
  });

  it('clamps APY of 0 to minimum probability of 1', () => {
    const market = mantlePoolToMarket(makePool({ apy: 0 }));
    expect(market.currentProbability).toBe(1);
  });

  it('clamps APY of 0.1 to minimum probability of 1', () => {
    const market = mantlePoolToMarket(makePool({ apy: 0.1 }));
    expect(market.currentProbability).toBe(1);
  });

  it('clamps very high APY (200%) to maximum probability of 99', () => {
    const market = mantlePoolToMarket(makePool({ apy: 200 }));
    expect(market.currentProbability).toBe(99);
  });

  it('clamps APY of 100 to maximum probability of 99', () => {
    const market = mantlePoolToMarket(makePool({ apy: 100 }));
    expect(market.currentProbability).toBe(99);
  });

  it('clamps APY of 99.9 to maximum probability of 99', () => {
    const market = mantlePoolToMarket(makePool({ apy: 99.9 }));
    expect(market.currentProbability).toBe(99);
  });

  it('handles APY of exactly 50 correctly', () => {
    const market = mantlePoolToMarket(makePool({ apy: 50 }));
    expect(market.currentProbability).toBe(50);
  });

  it('handles APY of 98.6 — rounds to 99 (max)', () => {
    const market = mantlePoolToMarket(makePool({ apy: 98.6 }));
    expect(market.currentProbability).toBe(99);
  });

  it('handles APY of 1.4 — rounds to 1 (min)', () => {
    const market = mantlePoolToMarket(makePool({ apy: 1.4 }));
    expect(market.currentProbability).toBe(1);
  });

  // Property: for any APY value, result is always in [1, 99]
  it('P3 property: currentProbability is always in [1, 99] for a range of APY values', () => {
    const apyValues = [
      -100, -1, -0.001, 0, 0.001, 0.4, 0.5, 1, 1.4, 1.5, 5, 10, 12.4,
      15.2, 25, 49.5, 50, 50.5, 75, 98, 98.5, 99, 99.5, 100, 150, 200, 999,
    ];

    for (const apy of apyValues) {
      const market = mantlePoolToMarket(makePool({ apy }));
      expect(market.currentProbability).toBeGreaterThanOrEqual(1);
      expect(market.currentProbability).toBeLessThanOrEqual(99);
    }
  });
});

// ─── Additional shape correctness ─────────────────────────────────────────────

describe('mantlePoolToMarket — output shape', () => {
  it('maps pool fields to market fields correctly', () => {
    const pool = makePool();
    const market = mantlePoolToMarket(pool);

    expect(market.id).toBe(pool.id);
    expect(market.slug).toBe(pool.id);
    expect(market.volume).toBe(pool.volume24h);
    expect(market.liquidity).toBe(pool.liquidity);
    expect(market.clobTokenId).toBe(pool.contractAddress);
    expect(market.active).toBe(true);
    expect(market.question).toContain(pool.name);
    expect(market.question).toContain(pool.protocol);
  });

  it('maps oneDayPriceChange to probabilityChange24h', () => {
    const pool = makePool({ oneDayPriceChange: 2.5 });
    const market = mantlePoolToMarket(pool);
    expect(market.probabilityChange24h).toBe(2.5);
  });

  it('maps null oneDayPriceChange to null probabilityChange24h', () => {
    const pool = makePool({ oneDayPriceChange: null });
    const market = mantlePoolToMarket(pool);
    expect(market.probabilityChange24h).toBeNull();
  });

  it('sets endDate to approximately 1 year from now', () => {
    const before = Date.now();
    const market = mantlePoolToMarket(makePool());
    const after = Date.now();

    const endTime = new Date(market.endDate).getTime();
    const oneYear = 365 * 24 * 60 * 60 * 1000;

    expect(endTime).toBeGreaterThanOrEqual(before + oneYear - 1000);
    expect(endTime).toBeLessThanOrEqual(after + oneYear + 1000);
  });
});
