import type { Market } from '@/types';
import { FALLBACK_MARKETS } from '@/lib/data/fallbackMarkets';
import { type MantlePool, parseStringArray, getYesTokenId } from '@/lib/services/mantleDeFiService';

// Use our own API route to avoid CORS — server proxies to Gamma API
const GAMMA_API_URL = '/api/markets';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes — server also caches 2min
const IDLE_REFRESH_MS = 60 * 1000;        // 1 minute when idle
const ACTIVE_REFRESH_MS = 15 * 1000;      // 15 seconds when user is active

interface CachedMarkets {
  markets: Market[];
  timestamp: number;
  isFallback: boolean;
}

let cache: CachedMarkets | null = null;
let inflight: Promise<{ markets: Market[]; isFallback: boolean }> | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let lastActivityTime = Date.now();
let activityTimeout: ReturnType<typeof setTimeout> | undefined;
let serviceInitialised = false;

const refreshCallbacks = new Set<() => void>();

function getRefreshInterval(): number {
  const timeSinceActivity = Date.now() - lastActivityTime;
  return timeSinceActivity < 30_000 ? ACTIVE_REFRESH_MS : IDLE_REFRESH_MS;
}

export function reportUserActivity(): void {
  lastActivityTime = Date.now();
  if (activityTimeout) clearTimeout(activityTimeout);
  activityTimeout = setTimeout(() => { /* idle */ }, 30_000);
}

/** Stop the auto-refresh timer. */
export function stopAutoRefresh(): void {
  if (refreshTimer !== null) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

/** Register a callback fired on every auto-refresh. Returns an unsubscribe fn. */
export function onMarketsRefresh(cb: () => void): () => void {
  refreshCallbacks.add(cb);
  return () => refreshCallbacks.delete(cb);
}

function scheduleRefresh() {
  stopAutoRefresh();
  const runRefresh = async () => {
    clearMarketCache();
    await fetchActiveMarkets();
    refreshCallbacks.forEach((cb) => cb());
    refreshTimer = setTimeout(runRefresh, getRefreshInterval());
  };
  refreshTimer = setTimeout(runRefresh, getRefreshInterval());
}

/**
 * Initialise the market service — starts the auto-refresh timer and registers
 * the manual-refresh event listener.
 *
 * Safe to call multiple times; only runs once per page load.
 * Call this from AppProviders (client component) so it never runs on the server.
 */
export function initMarketService(): void {
  if (typeof window === 'undefined' || serviceInitialised) return;
  serviceInitialised = true;

  scheduleRefresh();

  window.addEventListener('mantle:refresh-markets', () => {
    clearMarketCache();
    void fetchActiveMarkets().then(() => {
      refreshCallbacks.forEach((cb) => cb());
    });
  });
}

// ─── MantlePool → Market adapter ─────────────────────────────────────────────

/**
 * Adapt a MantlePool to the Market interface used by all UI components.
 * APY is mapped to currentProbability (capped to [1, 99]).
 * Requirements: 3.3, 3.4
 */
export function mantlePoolToMarket(pool: MantlePool): Market {
  return {
    id: pool.id,
    question: `${pool.name} — ${pool.protocol} | APY ${pool.apy.toFixed(1)}%`,
    currentProbability: Math.min(99, Math.max(1, Math.round(pool.apy))),
    volume: pool.volume24h,
    liquidity: pool.liquidity,
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
    slug: pool.id,
    probabilityChange24h: pool.oneDayPriceChange ?? null,
    clobTokenId: pool.contractAddress,
  };
}

// ─── Parsing helpers ──────────────────────────────────────────────────────────

type GammaMarketRaw = {
  id?: string | number;
  slug?: string;
  title?: string;
  question?: string;
  outcomes?: unknown;
  outcomePrices?: unknown;
  volume?: number | string;
  liquidity?: number | string;
  oneDayPriceChange?: number | null;
  sevenDayPriceChange?: number | null;
  thirtyDayPriceChange?: number | null;
  clobTokenIds?: unknown;
  endDate?: string;
  end_date?: string;
};

function parseOutcomePrices(raw: GammaMarketRaw): number[] {
  if (Array.isArray(raw.outcomePrices)) return raw.outcomePrices.map(Number);
  if (typeof raw.outcomePrices === 'string') {
    try {
      const parsed = JSON.parse(raw.outcomePrices);
      return Array.isArray(parsed) ? parsed.map(Number) : [];
    } catch { return []; }
  }
  return [];
}

function parseGammaMarket(raw: GammaMarketRaw): Market | null {
  try {
    const outcomes = parseStringArray(raw.outcomes);
    const outcomePrices = parseOutcomePrices(raw);

    const yesIndex = outcomes.findIndex((o: string) => String(o).toLowerCase() === 'yes');
    const yesPrice = yesIndex >= 0 ? outcomePrices[yesIndex] : outcomePrices[0] ?? 0.5;
    const probability = Math.max(1, Math.min(99, Math.round(yesPrice * 100)));

    let probabilityChange24h: number | null = null;
    if (raw.oneDayPriceChange != null) {
      const v = Number(raw.oneDayPriceChange);
      if (Number.isFinite(v)) probabilityChange24h = Math.round(v * 100 * 10) / 10;
    }

    return {
      id: String(raw.slug ?? raw.id ?? `market-${Math.random().toString(36).slice(2, 8)}`),
      question: raw.question ?? raw.title ?? 'Untitled market',
      currentProbability: probability,
      volume: Number(raw.volume ?? 0),
      liquidity: Number(raw.liquidity ?? 0),
      endDate: raw.endDate ?? raw.end_date ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      active: true,
      slug: raw.slug,
      probabilityChange24h,
      probabilityChange7d: raw.sevenDayPriceChange != null ? Number(raw.sevenDayPriceChange) : null,
      probabilityChange30d: raw.thirtyDayPriceChange != null ? Number(raw.thirtyDayPriceChange) : null,
      clobTokenId: getYesTokenId(raw) ?? undefined,
    };
  } catch {
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchActiveMarkets(): Promise<{ markets: Market[]; isFallback: boolean }> {
  if (cache && Date.now() - cache.timestamp < CACHE_DURATION_MS) {
    return { markets: cache.markets, isFallback: cache.isFallback };
  }

  // Deduplicate concurrent requests
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const response = await fetch(GAMMA_API_URL, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const rawArray = Array.isArray(data) ? data : [];

      // Detect MantlePool shape by presence of 'protocol' field
      const isMantlePool = rawArray.length > 0 && 'protocol' in rawArray[0];

      const markets = isMantlePool
        ? rawArray.map((p: MantlePool) => mantlePoolToMarket(p)).filter((m: Market) => m.currentProbability > 0)
        : rawArray.map(parseGammaMarket).filter((m): m is Market => m !== null && m.currentProbability > 0).sort((a: Market, b: Market) => b.volume - a.volume);

      if (!markets.length) throw new Error('No active markets returned');

      cache = { markets, timestamp: Date.now(), isFallback: false };
      return { markets, isFallback: false };
    } catch (error) {
      console.warn('[marketService] API unavailable, using fallback:', error);
      if (cache) return { markets: cache.markets, isFallback: cache.isFallback };
      return { markets: FALLBACK_MARKETS, isFallback: true };
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function clearMarketCache(): void {
  cache = null;
  inflight = null;
}

/**
 * Resolve a market question string to a CLOB YES token ID.
 * Used by trade-card.tsx to get the token ID for AI-initiated live trades.
 * Searches the in-memory cache — no network call.
 */
export function resolveTokenIdFromQuestion(question: string): string | null {
  if (!cache?.markets.length) return null;
  const q = question.toLowerCase();
  // Exact match first
  const exact = cache.markets.find((m) => m.question.toLowerCase() === q);
  if (exact?.clobTokenId) return exact.clobTokenId;
  // Substring match — find the market whose question best contains the AI's text
  const partial = cache.markets
    .filter((m) => m.clobTokenId)
    .find((m) => m.question.toLowerCase().includes(q.slice(0, 40)));
  return partial?.clobTokenId ?? null;
}
