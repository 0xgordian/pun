# Design Document: Pun — Mantle Port

## Overview

Pun is a Next.js 14 AI-native trading terminal ported from Polymarket to Mantle (chain ID 5000) for the Turing Test Hackathon 2026. This document covers the technical design for completing the port: live production data from Mantle DeFi APIs, fixing all broken imports, replacing the Polymarket AI system prompt, cleaning dead files, and fixing the ERC-8004 badge and on-chain logging.

---

## Architecture

### Data Flow

```
Browser
  └── marketService.ts (client cache, 5min TTL)
        └── GET /api/markets (server route)
              └── mantleDeFiService.ts (server cache, 2min TTL)
                    ├── Agni Finance subgraph (GraphQL)
                    ├── Merchant Moe subgraph (GraphQL)
                    ├── CoinGecko price API (MNT, mETH prices)
                    └── Static fallback (if all APIs fail)

AI Chat
  └── POST /api/aomi/[...path] (proxy)
        ├── MANTLE_SYSTEM_PROMPT (replaces POLYMARKET_SYSTEM_PROMPT)
        └── fetchLiveMarketContext() → calls /api/markets → formats MantlePool[]
```

### Type Adapter Pattern

The existing UI components (`MarketFeed`, `EdgeResults`, `TrendingMarkets`, etc.) all consume the `Market` type from `types/index.ts`. Rather than rewriting every component, we use an adapter:

```
MantlePool → mantlePoolToMarket() → Market
```

This adapter maps:
- `pool.name` → `market.question`
- `pool.apy` → `market.currentProbability` (APY as a 0-100 score, capped at 99)
- `pool.volume24h` → `market.volume`
- `pool.liquidity` → `market.liquidity`
- `pool.oneDayPriceChange` → `market.probabilityChange24h`
- `pool.id` → `market.id`

The adapter lives in `marketService.ts` and is called when parsing the `/api/markets` response.

---

## Component Design

### 1. `lib/services/mantleDeFiService.ts` — Live Data

Replace `getMantleStaticPools()` with `fetchLiveMantleData()`:

```typescript
// Server-side cache
let liveCache: { data: MantlePool[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export async function fetchMantlePools(): Promise<MantlePool[]> {
  if (liveCache && Date.now() - liveCache.timestamp < CACHE_TTL_MS) {
    return liveCache.data;
  }
  const pools = await fetchLiveMantleData();
  liveCache = { data: pools, timestamp: Date.now() };
  return pools;
}

async function fetchLiveMantleData(): Promise<MantlePool[]> {
  const [agniResult, moeResult, pricesResult] = await Promise.allSettled([
    fetchAgniPools(),
    fetchMerchantMoePools(),
    fetchTokenPrices(),
  ]);
  // merge results, fall back to static if all fail
}
```

**Agni Finance** — GraphQL subgraph:
- Endpoint: `https://graph.mantle.xyz/subgraphs/name/agni/exchange-v3`
- Query: top pools by TVL, fields: `id`, `token0{symbol}`, `token1{symbol}`, `totalValueLockedUSD`, `volumeUSD`, `feesUSD`, `token0Price`, `token1Price`
- APY calculated from: `(feesUSD_24h / tvl) * 365 * 100`

**Merchant Moe** — GraphQL subgraph:
- Endpoint: `https://graph.mantle.xyz/subgraphs/name/merchant-moe/lb-v21`
- Query: top lbPairs by TVL, fields: `id`, `tokenX{symbol}`, `tokenY{symbol}`, `totalValueLockedUSD`, `volumeUSD`, `feesUSD`

**Token Prices** — CoinGecko (no API key needed):
- `https://api.coingecko.com/api/v3/simple/price?ids=mantle,mantle-staked-ether,usd-coin&vs_currencies=usd`
- Used to display USD values and for the AI context

**Fallback**: If all three `Promise.allSettled` results are rejected, return the static pool array (same 4 pools as current).

**`MantlePool` interface extension**:
```typescript
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
  oneDayPriceChange?: number | null; // NEW: APY change vs 24h ago
}
```

---

### 2. `app/api/aomi/[...path]/route.ts` — System Prompt Replacement

**Remove entirely**:
- `POLYMARKET_SYSTEM_PROMPT` constant
- `fetchPriceChange()` function
- `GammaMarketRaw` type
- `EnrichedMarket` type
- `getTokenId()` function
- `fmtChange()` function
- `parseYesProb()` function
- `marketFetchPromise` typed as `Promise<GammaMarketRaw[] | null>`

**Add**:
```typescript
const MANTLE_SYSTEM_PROMPT = `## You are operating inside Pun

You are the AI embedded in Pun — an AI-native Mantle DeFi trading terminal...
[full prompt covering Mantle pools, yield strategies, ERC-8004, MNT token]
`;
```

**Update `fetchLiveMarketContext()`**:
- Change return type from `GammaMarketRaw[]` to `MantlePool[]`
- Format each pool as: `- {name} ({protocol}) | TVL: $${(tvl/1e6).toFixed(1)}M | APY: ${apy}% | Vol 24h: $${(vol/1e3).toFixed(0)}K`
- Keep 5-minute cache, request deduplication, and error handling unchanged

**Keep unchanged**:
- Rate limiting (`checkRateLimit`)
- SSRF protection (`ALLOWED_HOSTS`)
- Request size validation (20000 char limit)
- Streaming proxy logic
- Position cache (per-wallet, 30s TTL)
- `sanitizeWalletAddress()`
- All route handlers (GET, POST, PUT, PATCH, DELETE, OPTIONS)

---

### 3. `components/assistant-ui/thread.tsx` — String Updates

**Changes only** (no structural changes):

| Location | Old | New |
|---|---|---|
| Brand label | `Kuroko` | `Pun` |
| Heading | `AI Market Intelligence` | `AI Mantle Trading Terminal` |
| Subtitle | `markets and positions` | `Mantle DeFi pools and yield opportunities` |
| Refresh localStorage key | `polymarket_markets_cache` | `mantle_pools_cache` |
| Refresh CustomEvent | `polymarket:refresh-markets` | `mantle:refresh-markets` |
| `/movers` prompt | Polymarket 24h movers | Biggest APY/TVL changes in Mantle pools |
| `/analyze` prompt | Top market by volume | Top Mantle pool by TVL |
| `/trade` prompt | Best trade opportunity | Best yield opportunity on Mantle |
| Suggestion card actions | "Polymarket" references | Mantle DeFi equivalents |
| Assistant label | `kuroko AI` | `pun AI` |

**Suggestion cards** — update dynamic card logic:
- Top mover card: use `pool.apy` change instead of `probabilityChange24h`
- High volume card: use `pool.tvl` instead of `volume`
- Near 50% card: replace with "Highest APY pool" card
- Portfolio card: keep as-is (wallet positions)

---

### 4. `lib/services/marketService.ts` — Adapter + Event Fix

**Add adapter function**:
```typescript
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
```

**Fix event listener** (in `initMarketService()`):
```typescript
// OLD:
window.addEventListener('polymarket:refresh-markets', ...)
// NEW:
window.addEventListener('mantle:refresh-markets', ...)
```

**Fix localStorage key** (in `fetchActiveMarkets()` or cache logic):
- Replace any `polymarket_markets_cache` references with `mantle_pools_cache`

**Update `parseGammaMarket`**: Keep the function but also handle `MantlePool` shape — or replace the parsing logic to call `mantlePoolToMarket()` when the response is a `MantlePool[]`.

---

### 5. `components/AgentIdentityBadge.tsx` — Design System Fix + Real RPC

**Fix design system violations** — replace all Tailwind color classes with inline styles:

```typescript
// Loading state
<div style={{ 
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '4px 8px',
  backgroundColor: '#111', 
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 0,
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  color: '#555'
}}>

// Pending state — orange
border: '1px solid rgba(255,69,0,0.4)'
backgroundColor: 'rgba(255,69,0,0.1)'
color: '#ff4500'
dot: backgroundColor: '#ff4500'

// Registered state — green  
border: '1px solid rgba(74,222,128,0.3)'
backgroundColor: 'rgba(74,222,128,0.08)'
color: '#4ade80'
dot: backgroundColor: '#4ade80'
```

**Add real Mantle RPC check**:
```typescript
useEffect(() => {
  async function checkRegistration() {
    const contractAddr = process.env.NEXT_PUBLIC_ERC8004_CONTRACT;
    const rpcUrl = process.env.NEXT_PUBLIC_MANTLE_RPC_URL || 'https://rpc.mantle.xyz';
    
    // If zero address, show demo mode
    if (!contractAddr || contractAddr === '0x0000000000000000000000000000000000000000') {
      setIsRegistered(true); // demo mode
      setLoading(false);
      return;
    }
    
    try {
      // eth_call to ERC-8004 contract with 3000ms timeout
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', method: 'eth_call',
          params: [{ to: contractAddr, data: '0x...' }, 'latest'],
          id: 1
        }),
        signal: AbortSignal.timeout(3000),
      });
      const data = await response.json();
      setIsRegistered(data.result !== '0x');
    } catch {
      setIsRegistered(true); // fail open — don't block UI
    }
    setLoading(false);
  }
  checkRegistration();
}, [agentId]);
```

---

### 6. `app/api/mantle/log/route.ts` — Fix Response Shape

Current response: `{ success, log: { txHash, ... }, message }`
Required response: `{ success, txHash, chainId: 5000 }`

```typescript
return NextResponse.json({
  success: true,
  txHash: mockTxHash,
  chainId: 5000,
});
```

Add RealClaw API integration:
```typescript
if (process.env.REALCLAW_API_KEY) {
  const rcRes = await fetch(`${process.env.NEXT_PUBLIC_REALCLAW_API_URL}/log`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${process.env.REALCLAW_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ agentId, action, details, chainId: 5000 }),
    signal: AbortSignal.timeout(5000),
  });
  if (rcRes.ok) {
    const rcData = await rcRes.json();
    txHash = rcData.txHash ?? mockTxHash;
  }
}
```

---

### 7. Fix Broken Imports

**`app/trade/page.tsx`** — Remove dangling `fetchOrderBook` call:
```typescript
// Remove this broken code:
const { fetchMantleTokenPrices } = await import('@/lib/services/mantleDeFiService');
const book = await fetchOrderBook(opp.market.clobTokenId); // fetchOrderBook doesn't exist

// Replace with:
const { fetchMantleTokenPrices } = await import('@/lib/services/mantleDeFiService');
const prices = await fetchMantleTokenPrices([opp.market.clobTokenId ?? '']);
// Use pool's existing apy-based price instead
```

**`components/OrderBook.tsx`** — Replace `fetchOrderBook` / `OrderBook` from clobService:
- Show Mantle pool liquidity depth as a simplified order book display
- Use `MantlePool` data (bids/asks approximated from TVL and current price)

**`components/PositionPanel.tsx`** — Replace `fetchUserPositions` from clobService:
- Use the existing `/api/positions` route (already proxies wallet positions)
- Import `UserPosition` from `@/types` instead of clobService

**`app/execute/page.tsx`** — Fix `fetchOrderBook` and `OrderBook` type references:
- `OrderBook` type: import from `@/types` (already defined as `LiveOrderBook`)
- `fetchOrderBook`: replace with a Mantle-compatible stub that returns null (no CLOB on Mantle)

**`app/portfolio/page.tsx`** — Replace `fetchUserPositions` from clobService:
- Same as PositionPanel — use `/api/positions` route

---

### 8. Delete Dead Files

Files to delete:
- `lib/services/polymarketData.ts`
- `lib/services/clobService.ts`
- `app/api/clob/[...path]/route.ts` (and directory)

Before deletion, verify no remaining imports (grep confirms none after fixes above).

---

### 9. Test Updates

**Delete**: `lib/services/__tests__/polymarketData.test.ts`

**Update `app/api/markets/route.test.ts`**:
```typescript
// Mock mantleDeFiService instead of Gamma API
vi.mock('@/lib/services/mantleDeFiService', () => ({
  fetchMantlePools: vi.fn().mockResolvedValue([
    { id: 'agni-meth-usdc', name: 'mETH-USDC', protocol: 'agni-finance',
      tvl: 12500000, apy: 12.4, token0: 'mETH', token1: 'USDC',
      liquidity: 8500000, volume24h: 3200000 }
  ])
}));
```

**Update `lib/services/__tests__/signalEngine.test.ts`**:
- Remove `OrderBook` import from clobService
- Use `LiveOrderBook` from `@/types` or inline the type

---

## Correctness Properties (PBT)

- **P1**: `fetchMantlePools()` always returns `MantlePool[]` — never throws, never returns null
- **P2**: Every pool satisfies `tvl >= 0 && apy >= 0 && volume24h >= 0`
- **P3**: `mantlePoolToMarket(pool).currentProbability` is always in range `[1, 99]`
- **P4**: Cache returns identical data within 2-minute TTL window
- **P5**: When all external APIs fail, fallback returns exactly 4 static pools

---

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_MANTLE_RPC_URL=https://rpc.mantle.xyz
NEXT_PUBLIC_ERC8004_CONTRACT=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_REALCLAW_API_URL=https://api.realclaw.xyz
REALCLAW_API_KEY=  # optional — enables real on-chain logging
```
