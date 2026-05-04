/**
 * Mantle DeFi Service
 * Live data fetching from Agni Finance and Merchant Moe subgraphs,
 * CoinGecko token prices, with 2-minute server-side cache and static fallback.
 * For Turing Test Hackathon 2026 submission
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MantlePool {
  id: string;
  protocol: 'merchant-moe' | 'agni-finance' | 'fluxion' | 'rwa' | 'lendle';
  name: string;
  tvl: number;
  apy: number;
  token0: string;
  token1: string;
  liquidity: number;
  volume24h: number;
  contractAddress?: string;
  oneDayPriceChange?: number | null;
}

export interface MantleToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  priceUsd?: number;
}

export type PolymarketPricePoint = {
  t: number;
  p: number;
};

// ---------------------------------------------------------------------------
// Utility functions (migrated from polymarketData.ts — Requirement 6.4)
// ---------------------------------------------------------------------------

export function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.map((item) => String(item)).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

export function getYesTokenId(raw: {
  clobTokenIds?: unknown;
  outcomes?: unknown;
}): string | null {
  const tokenIds = parseStringArray(raw.clobTokenIds);
  if (tokenIds.length === 0) return null;

  const outcomes = parseStringArray(raw.outcomes).map((outcome) =>
    outcome.toLowerCase(),
  );
  const yesIndex = outcomes.findIndex((outcome) => outcome === 'yes');

  if (yesIndex >= 0 && tokenIds[yesIndex]) {
    return tokenIds[yesIndex];
  }

  return tokenIds[0] ?? null;
}

export function derive24hPriceChangeFromHistory(
  history: Array<{ t: number; p: number }>,
): number | null {
  const validPoints = history.filter(
    (point) =>
      Number.isFinite(point?.p) &&
      typeof point?.p === 'number' &&
      Number.isFinite(point?.t),
  );

  if (validPoints.length < 2) return null;

  const sorted = [...validPoints].sort((a, b) => a.t - b.t);
  const first = sorted[0]?.p;
  const last = sorted[sorted.length - 1]?.p;

  if (!Number.isFinite(first) || !Number.isFinite(last)) {
    return null;
  }

  return Math.round((last - first) * 1000) / 1000;
}

// ---------------------------------------------------------------------------
// Static fallback (used when all live APIs fail)
// ---------------------------------------------------------------------------

function getMantleStaticPools(): MantlePool[] {
  return [
    {
      id: 'agni-meth-usdc',
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
    },
    {
      id: 'mo-mnt-usdc',
      protocol: 'merchant-moe',
      name: 'MNT-USDC',
      tvl: 8500000,
      apy: 8.7,
      token0: 'MNT',
      token1: 'USDC',
      liquidity: 5200000,
      volume24h: 1800000,
      contractAddress: '0x013e138EF6008ae5FDFDE29700e3f2Bc61d21E3a',
      oneDayPriceChange: null,
    },
    {
      id: 'agni-usdy-usdc',
      protocol: 'rwa',
      name: 'USDY-USDC',
      tvl: 4200000,
      apy: 15.2,
      token0: 'USDY',
      token1: 'USDC',
      liquidity: 3100000,
      volume24h: 950000,
      contractAddress: '0x319B69888b0d11cEC22caA5034e25FfFBDc88421',
      oneDayPriceChange: null,
    },
    {
      id: 'mo-meth-mnt',
      protocol: 'agni-finance',
      name: 'mETH-MNT',
      tvl: 6800000,
      apy: 10.8,
      token0: 'mETH',
      token1: 'MNT',
      liquidity: 4200000,
      volume24h: 1200000,
      contractAddress: '0x013e138EF6008ae5FDFDE29700e3f2Bc61d21E3a',
      oneDayPriceChange: null,
    },
  ];
}

// ---------------------------------------------------------------------------
// Live data fetchers
// ---------------------------------------------------------------------------

/**
 * Fetch top pools from Agni Finance subgraph (Requirement 11.1)
 *
 * APY calculation: we request poolDayData for the last 1 day to get actual
 * 24h fees rather than dividing cumulative feesUSD by 30 (which is inaccurate
 * for pools that have been running for varying durations).
 */
async function fetchAgniPools(): Promise<MantlePool[]> {
  // Request both pool-level data and the most recent day's fee data
  const query = `{
    pools(first: 20, orderBy: totalValueLockedUSD, orderDirection: desc) {
      id
      token0 { symbol }
      token1 { symbol }
      totalValueLockedUSD
      volumeUSD
      feesUSD
      token0Price
      token1Price
      poolDayData(first: 1, orderBy: date, orderDirection: desc) {
        feesUSD
        volumeUSD
      }
    }
  }`;

  try {
    const res = await fetch(
      'https://graph.mantle.xyz/subgraphs/name/agni/exchange-v3',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!res.ok) return [];

    const json = await res.json();
    const pools: Array<{
      id: string;
      token0: { symbol: string };
      token1: { symbol: string };
      totalValueLockedUSD: string;
      volumeUSD: string;
      feesUSD: string;
      token0Price: string;
      token1Price: string;
      poolDayData?: Array<{ feesUSD: string; volumeUSD: string }>;
    }> = json?.data?.pools ?? [];

    return pools
      .map((p): MantlePool | null => {
        const tvl = parseFloat(p.totalValueLockedUSD) || 0;

        // Prefer actual 24h fees from poolDayData; fall back to cumulative/30 estimate
        const dayData = p.poolDayData?.[0];
        const feesUSD24h = dayData
          ? parseFloat(dayData.feesUSD) || 0
          : (parseFloat(p.feesUSD) || 0) / 30;

        const apy = tvl > 0 ? (feesUSD24h / tvl) * 365 * 100 : 0;

        // Prefer actual 24h volume from poolDayData
        const volume24h = dayData
          ? parseFloat(dayData.volumeUSD) || 0
          : (parseFloat(p.volumeUSD) || 0) / 30;

        const token0 = p.token0?.symbol ?? 'TOKEN0';
        const token1 = p.token1?.symbol ?? 'TOKEN1';

        return {
          id: `agni-${p.id}`,
          protocol: 'agni-finance',
          name: `${token0}-${token1}`,
          tvl,
          apy: Math.max(0, apy),
          token0,
          token1,
          liquidity: tvl,
          volume24h: Math.max(0, volume24h),
          contractAddress: p.id,
          oneDayPriceChange: null,
        };
      })
      .filter((p): p is MantlePool => p !== null);
  } catch {
    return [];
  }
}

/**
 * Fetch top pools from Merchant Moe subgraph (Requirement 11.2)
 *
 * Uses lbPairDayData for accurate 24h fees instead of cumulative/30 estimate.
 */
async function fetchMerchantMoePools(): Promise<MantlePool[]> {
  const query = `{
    lbPairs(first: 20, orderBy: totalValueLockedUSD, orderDirection: desc) {
      id
      tokenX { symbol }
      tokenY { symbol }
      totalValueLockedUSD
      volumeUSD
      feesUSD
      reserveX
      reserveY
      lbPairDayData(first: 1, orderBy: date, orderDirection: desc) {
        feesUSD
        volumeUSD
      }
    }
  }`;

  try {
    const res = await fetch(
      'https://graph.mantle.xyz/subgraphs/name/merchant-moe/lb-v21',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!res.ok) return [];

    const json = await res.json();
    const pairs: Array<{
      id: string;
      tokenX: { symbol: string };
      tokenY: { symbol: string };
      totalValueLockedUSD: string;
      volumeUSD: string;
      feesUSD: string;
      reserveX: string;
      reserveY: string;
      lbPairDayData?: Array<{ feesUSD: string; volumeUSD: string }>;
    }> = json?.data?.lbPairs ?? [];

    return pairs
      .map((p): MantlePool | null => {
        const tvl = parseFloat(p.totalValueLockedUSD) || 0;

        // Prefer actual 24h fees from lbPairDayData
        const dayData = p.lbPairDayData?.[0];
        const feesUSD24h = dayData
          ? parseFloat(dayData.feesUSD) || 0
          : (parseFloat(p.feesUSD) || 0) / 30;

        const apy = tvl > 0 ? (feesUSD24h / tvl) * 365 * 100 : 0;

        const volume24h = dayData
          ? parseFloat(dayData.volumeUSD) || 0
          : (parseFloat(p.volumeUSD) || 0) / 30;

        const tokenX = p.tokenX?.symbol ?? 'TOKENX';
        const tokenY = p.tokenY?.symbol ?? 'TOKENY';

        return {
          id: `moe-${p.id}`,
          protocol: 'merchant-moe',
          name: `${tokenX}-${tokenY}`,
          tvl,
          apy: Math.max(0, apy),
          token0: tokenX,
          token1: tokenY,
          liquidity: tvl,
          volume24h: Math.max(0, volume24h),
          contractAddress: p.id,
          oneDayPriceChange: null,
        };
      })
      .filter((p): p is MantlePool => p !== null);
  } catch {
    return [];
  }
}

/**
 * Fetch MNT, mETH, and USDC prices from CoinGecko (Requirement 11.3)
 */
async function fetchTokenPrices(): Promise<Record<string, number>> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=mantle,mantle-staked-ether,usd-coin&vs_currencies=usd',
      {
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!res.ok) return {};

    const json = await res.json();

    const prices: Record<string, number> = {};
    if (json?.mantle?.usd) prices['MNT'] = json.mantle.usd;
    if (json?.['mantle-staked-ether']?.usd)
      prices['mETH'] = json['mantle-staked-ether'].usd;
    if (json?.['usd-coin']?.usd) prices['USDC'] = json['usd-coin'].usd;

    return prices;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Lendle lending protocol (RWA track)
// ---------------------------------------------------------------------------

/**
 * Fetch lending pools from Lendle (Mantle's main lending protocol).
 * API: https://api.lendle.xyz/pools
 */
async function fetchLendlePools(): Promise<MantlePool[]> {
  try {
    const res = await fetch('https://api.lendle.xyz/pools', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const pools: Array<{
      symbol?: string;
      underlyingAsset?: string;
      totalLiquidity?: string | number;
      supplyAPY?: string | number;
      borrowAPY?: string | number;
      totalDeposits?: string | number;
    }> = Array.isArray(data) ? data : (data?.pools ?? []);

    return pools
      .filter((p) => p.symbol && Number(p.totalLiquidity ?? 0) > 1000)
      .map((p): MantlePool => {
        const tvl = Number(p.totalLiquidity ?? p.totalDeposits ?? 0);
        const apy = Number(p.supplyAPY ?? 0) * 100; // convert from decimal
        return {
          id: `lendle-${(p.symbol ?? 'unknown').toLowerCase()}`,
          protocol: 'lendle',
          name: `${p.symbol ?? 'Unknown'} Supply`,
          tvl,
          apy: Math.max(0, apy),
          token0: p.symbol ?? 'UNKNOWN',
          token1: 'USD',
          liquidity: tvl,
          volume24h: 0,
          contractAddress: p.underlyingAsset,
          oneDayPriceChange: null,
        };
      })
      .slice(0, 8);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// mETH staking yield
// ---------------------------------------------------------------------------

/**
 * Fetch mETH staking APY from Mantle's mETH protocol.
 * Returns a single pool entry representing the mETH staking yield.
 */
async function fetchMethStakingYield(): Promise<MantlePool[]> {
  try {
    const res = await fetch('https://meth.mantle.xyz/api/v1/meth/info', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    // Response shape: { apy: "0.0412", totalStaked: "12345.67", ... }
    const apyRaw = data?.apy ?? data?.stakingApy ?? data?.currentApy;
    if (!apyRaw) return [];
    const apy = parseFloat(String(apyRaw)) * 100; // convert from decimal
    const tvl = parseFloat(String(data?.totalStaked ?? data?.tvl ?? 0)) * 3200; // approx USD

    return [{
      id: 'meth-staking',
      protocol: 'rwa',
      name: 'mETH Staking',
      tvl: tvl || 50_000_000,
      apy: Math.max(0, apy),
      token0: 'ETH',
      token1: 'mETH',
      liquidity: tvl || 50_000_000,
      volume24h: 0,
      contractAddress: '0xcDA86A272531e8640cD7F1a92c01839911B90bb0',
      oneDayPriceChange: null,
    }];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Fluxion pools
// ---------------------------------------------------------------------------

/**
 * Fetch pools from Fluxion (Mantle's concentrated liquidity protocol).
 * Uses their subgraph if available, otherwise returns empty.
 */
async function fetchFluxionPools(): Promise<MantlePool[]> {
  const query = `{
    pools(first: 10, orderBy: totalValueLockedUSD, orderDirection: desc) {
      id
      token0 { symbol }
      token1 { symbol }
      totalValueLockedUSD
      volumeUSD
      feesUSD
    }
  }`;
  try {
    const res = await fetch(
      'https://graph.mantle.xyz/subgraphs/name/fluxion/exchange-v3',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!res.ok) return [];
    const json = await res.json();
    const pools: Array<{
      id: string;
      token0: { symbol: string };
      token1: { symbol: string };
      totalValueLockedUSD: string;
      volumeUSD: string;
      feesUSD: string;
    }> = json?.data?.pools ?? [];

    return pools.map((p): MantlePool => {
      const tvl = parseFloat(p.totalValueLockedUSD) || 0;
      const fees = parseFloat(p.feesUSD) || 0;
      const feesDaily = fees / 30;
      const apy = tvl > 0 ? (feesDaily / tvl) * 365 * 100 : 0;
      const vol = parseFloat(p.volumeUSD) / 30 || 0;
      return {
        id: `fluxion-${p.id}`,
        protocol: 'fluxion',
        name: `${p.token0?.symbol ?? 'T0'}-${p.token1?.symbol ?? 'T1'}`,
        tvl,
        apy: Math.max(0, apy),
        token0: p.token0?.symbol ?? 'T0',
        token1: p.token1?.symbol ?? 'T1',
        liquidity: tvl,
        volume24h: Math.max(0, vol),
        contractAddress: p.id,
        oneDayPriceChange: null,
      };
    });
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Parallel fetch + merge (Requirement 11.8)
// ---------------------------------------------------------------------------

/**
 * Fetch live pool data from all sources in parallel.
 * Falls back to static pools if all sources fail or result is empty.
 * (Requirement 11.5)
 */
export async function fetchLiveMantleData(): Promise<MantlePool[]> {
  const [agniResult, moeResult, lendleResult, methResult, fluxionResult, pricesResult] = await Promise.allSettled([
    fetchAgniPools(),
    fetchMerchantMoePools(),
    fetchLendlePools(),
    fetchMethStakingYield(),
    fetchFluxionPools(),
    fetchTokenPrices(),
  ]);

  // Apply live token prices to pool TVL display if available
  const livePrices: Record<string, number> = pricesResult.status === 'fulfilled' ? pricesResult.value : {};

  const merged: MantlePool[] = [];

  if (agniResult.status === 'fulfilled') merged.push(...agniResult.value);
  if (moeResult.status === 'fulfilled') merged.push(...moeResult.value);
  if (lendleResult.status === 'fulfilled') merged.push(...lendleResult.value);
  if (methResult.status === 'fulfilled') merged.push(...methResult.value);
  if (fluxionResult.status === 'fulfilled') merged.push(...fluxionResult.value);

  // Annotate pools with live price data where available (used for display context)
  if (Object.keys(livePrices).length > 0) {
    merged.forEach((pool) => {
      // Store MNT price on MNT-containing pools for downstream display
      if ((pool.token0 === 'MNT' || pool.token1 === 'MNT') && livePrices['MNT']) {
        (pool as MantlePool & { mntPriceUsd?: number }).mntPriceUsd = livePrices['MNT'];
      }
    });
  }

  // Deduplicate by pool id
  const seen = new Set<string>();
  const deduped = merged.filter((pool) => {
    if (seen.has(pool.id)) return false;
    seen.add(pool.id);
    return true;
  });

  // Fall back to static pools if all APIs failed or returned nothing
  if (deduped.length === 0) {
    return getMantleStaticPools();
  }

  return deduped;
}

// ---------------------------------------------------------------------------
// Server-side cache (Requirement 11.4)
// ---------------------------------------------------------------------------

let liveCache: { data: MantlePool[]; timestamp: number } | null = null;
const LIVE_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Fetch DeFi pools from Mantle ecosystem with 2-minute server-side cache.
 * (Requirements 11.4, 11.6)
 */
export async function fetchMantlePools(): Promise<MantlePool[]> {
  if (liveCache && Date.now() - liveCache.timestamp < LIVE_CACHE_TTL_MS) {
    return liveCache.data;
  }
  const pools = await fetchLiveMantleData();
  liveCache = { data: pools, timestamp: Date.now() };
  return pools;
}

// ---------------------------------------------------------------------------
// Token prices (public API — Requirement 11.3)
// ---------------------------------------------------------------------------

/**
 * Fetch token prices for the given symbols.
 * Uses CoinGecko data when available, falls back to hardcoded values.
 */
export async function fetchMantleTokenPrices(
  tokens: string[],
): Promise<Record<string, number>> {
  const fallbackPrices: Record<string, number> = {
    MNT: 0.85,
    USDC: 1.0,
    USDT: 1.0,
    mETH: 3200,
    USDY: 1.0,
    WMNT: 0.85,
  };

  // Attempt live prices
  const livePrices = await fetchTokenPrices();

  const prices: Record<string, number> = {};
  tokens.forEach((token) => {
    prices[token] =
      livePrices[token] ?? fallbackPrices[token] ?? 0;
  });
  return prices;
}
