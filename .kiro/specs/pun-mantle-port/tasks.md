# Implementation Plan: Pun — Mantle Port

## Overview

Complete the port of Pun from Polymarket to Mantle (chain ID 5000) for the Turing Test Hackathon 2026. The work is ordered to keep the build green at each step: live data service first, then the AI proxy, then UI strings, then broken imports, then dead-file deletion, then test updates, and finally a full build + test verification pass.

---

## Tasks

- [-] 1. Rewrite `lib/services/mantleDeFiService.ts` with live data fetching
  - [x] 1.1 Extend the `MantlePool` interface with `oneDayPriceChange?: number | null`
    - Add the field after `volume24h` in the existing interface
    - _Requirements: 11.7_
  - [x] 1.2 Implement `fetchAgniPools()` — GraphQL query to Agni Finance subgraph
    - Endpoint: `https://graph.mantle.xyz/subgraphs/name/agni/exchange-v3`
    - Query top pools by TVL: `id`, `token0{symbol}`, `token1{symbol}`, `totalValueLockedUSD`, `volumeUSD`, `feesUSD`, `token0Price`, `token1Price`
    - Calculate APY from `(feesUSD_24h / tvl) * 365 * 100`
    - Wrap in `AbortSignal.timeout(5000)`; return `[]` on any error
    - _Requirements: 11.1_
  - [x] 1.3 Implement `fetchMerchantMoePools()` — GraphQL query to Merchant Moe subgraph
    - Endpoint: `https://graph.mantle.xyz/subgraphs/name/merchant-moe/lb-v21`
    - Query top lbPairs by TVL: `id`, `tokenX{symbol}`, `tokenY{symbol}`, `totalValueLockedUSD`, `volumeUSD`, `feesUSD`
    - Wrap in `AbortSignal.timeout(5000)`; return `[]` on any error
    - _Requirements: 11.2_
  - [x] 1.4 Implement `fetchTokenPrices()` — CoinGecko price API
    - URL: `https://api.coingecko.com/api/v3/simple/price?ids=mantle,mantle-staked-ether,usd-coin&vs_currencies=usd`
    - Wrap in `AbortSignal.timeout(5000)`; return empty record on any error
    - _Requirements: 11.3_
  - [x] 1.5 Implement `fetchLiveMantleData()` using `Promise.allSettled`
    - Call `fetchAgniPools()`, `fetchMerchantMoePools()`, `fetchTokenPrices()` in parallel
    - Merge fulfilled results into a single `MantlePool[]`
    - If all three settle as rejected, return the existing static fallback array (4 pools)
    - _Requirements: 11.5, 11.8_
  - [x] 1.6 Add server-side 2-minute cache and replace `fetchMantlePools()` body
    - Declare `let liveCache: { data: MantlePool[]; timestamp: number } | null = null`
    - `fetchMantlePools()` checks cache TTL (2 min), calls `fetchLiveMantleData()` on miss, stores result
    - Keep the existing function signature so all consumers compile unchanged
    - _Requirements: 11.4, 11.6_
  - [ ] 1.7 Write property tests for `fetchMantlePools()` and `fetchLiveMantleData()`
    - **Property P1: `fetchMantlePools()` never throws and never returns null**
    - **Validates: Requirements 11.4, 11.5**
    - **Property P2: Every returned pool satisfies `tvl >= 0 && apy >= 0 && volume24h >= 0`**
    - **Validates: Requirements 11.1, 11.2**
    - **Property P5: When all external APIs fail, fallback returns exactly 4 static pools**
    - **Validates: Requirements 11.5**

- [-] 2. Fix `lib/services/marketService.ts` — adapter, event, and cache key
  - [x] 2.1 Add `mantlePoolToMarket(pool: MantlePool): Market` adapter function
    - Map fields per design: `pool.name` → `question`, `pool.apy` capped to `[1, 99]` → `currentProbability`, `pool.volume24h` → `volume`, `pool.liquidity` → `liquidity`, `pool.oneDayPriceChange ?? null` → `probabilityChange24h`, `pool.id` → `id` and `slug`, `pool.contractAddress` → `clobTokenId`
    - Set `endDate` to 1 year from now, `active: true`
    - Export the function so the aomi proxy can use it if needed
    - _Requirements: 3.3, 3.4_
  - [x] 2.2 Update `parseGammaMarket` to handle `MantlePool` shape
    - When the `/api/markets` response is a `MantlePool[]` (has `protocol` field), call `mantlePoolToMarket()` instead of the Gamma parsing path
    - Keep the existing `GammaMarketRaw` path as a fallback so nothing breaks
    - _Requirements: 3.3_
  - [x] 2.3 Fix the `mantle:refresh-markets` event listener in `initMarketService()`
    - Replace `window.addEventListener('polymarket:refresh-markets', ...)` with `window.addEventListener('mantle:refresh-markets', ...)`
    - _Requirements: 3.3_
  - [x] 2.4 Fix the localStorage cache key
    - Replace any `polymarket_markets_cache` string with `mantle_pools_cache` in `fetchActiveMarkets()` or any cache-read/write logic
    - _Requirements: 3.1_
  - [ ] 2.5 Write property test for `mantlePoolToMarket()`
    - **Property P3: `mantlePoolToMarket(pool).currentProbability` is always in range `[1, 99]`**
    - **Validates: Requirements 3.3**

- [x] 3. Rewrite `app/api/aomi/[...path]/route.ts` — system prompt and market context
  - [x] 3.1 Remove all Polymarket-specific code
    - Delete `POLYMARKET_SYSTEM_PROMPT` constant
    - Delete `fetchPriceChange()` function and all references to `clob.polymarket.com`
    - Delete `GammaMarketRaw` type, `EnrichedMarket` type, `getTokenId()`, `fmtChange()`, `parseYesProb()` functions
    - Delete `marketFetchPromise` typed as `Promise<GammaMarketRaw[] | null>`
    - _Requirements: 1.3, 1.4_
  - [x] 3.2 Add `MANTLE_SYSTEM_PROMPT` constant
    - Instruct the AI it is operating inside Pun — an AI-native Mantle DeFi trading terminal
    - Cover: Mantle pools, yield strategies, ERC-8004 agent identity, MNT token, chain ID 5000
    - Include the same trade card JSON format rules from the old prompt (adapted for Mantle pools)
    - _Requirements: 1.2, 1.5_
  - [x] 3.3 Update `fetchLiveMarketContext()` to format `MantlePool[]`
    - Change the dedup promise type from `Promise<GammaMarketRaw[] | null>` to `Promise<MantlePool[] | null>`
    - Format each pool as: `- {name} ({protocol}) | TVL: ${(tvl/1e6).toFixed(1)}M | APY: ${apy}% | Vol 24h: ${(vol/1e3).toFixed(0)}K`
    - Sort by TVL descending, take top 10
    - Keep 5-minute cache, request deduplication, and empty-array fallback unchanged
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 3.4 Wire `MANTLE_SYSTEM_PROMPT` into the proxy handler
    - Replace `POLYMARKET_SYSTEM_PROMPT` with `MANTLE_SYSTEM_PROMPT` in the `proxy()` function call to `trimPrompt()`
    - Keep all other proxy logic (rate limiting, SSRF, size check, streaming) unchanged
    - _Requirements: 1.1, 1.5, 1.6_

- [ ] 4. Checkpoint — verify build compiles after service and proxy changes
  - Run `npm run build` and fix any TypeScript errors introduced in tasks 1–3 before continuing
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Update `components/assistant-ui/thread.tsx` — brand, strings, events, suggestions
  - [x] 5.1 Update brand label, heading, subtitle, and assistant label
    - Replace `Kuroko` brand label with `Pun`
    - Replace `AI Market Intelligence` heading with `AI Mantle Trading Terminal`
    - Replace subtitle text (`markets and positions`) with `Mantle DeFi pools and yield opportunities`
    - Replace `kuroko AI` assistant label with `pun AI`
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 5.2 Fix Refresh button event and localStorage key
    - Replace `localStorage.removeItem('polymarket_markets_cache')` with `localStorage.removeItem('mantle_pools_cache')`
    - Replace `window.dispatchEvent(new CustomEvent('polymarket:refresh-markets'))` with `window.dispatchEvent(new CustomEvent('mantle:refresh-markets'))`
    - _Requirements: 3.1, 3.2_
  - [x] 5.3 Update slash commands to Mantle context
    - `/movers` prompt → ask about biggest APY or TVL changes in Mantle pools
    - `/analyze` prompt → ask for deep analysis of the top Mantle pool by TVL
    - `/trade` prompt → ask for the best yield opportunity on Mantle right now
    - Keep all other slash commands (`/edge`, `/positions`, `/alert`, `/guard`, `/simulate`, `/execute`, `/portfolio`) unchanged
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 5.4 Update dynamic suggestion cards to use Mantle pool data
    - Top mover card: use `pool.apy` change (via `probabilityChange24h` from adapter) instead of raw probability change
    - High volume card: use `pool.tvl` (via `volume` from adapter) for the label
    - Near-50% card: replace with "Highest APY pool" card using the pool with highest `currentProbability` (mapped from APY)
    - Portfolio card: keep as-is
    - _Requirements: 5.4_
  - [x] 5.5 Update static fallback suggestion cards
    - Replace all "Polymarket" references in fallback card `action` strings with Mantle DeFi equivalents (MNT yield, mETH pools, Agni Finance, Merchant Moe)
    - _Requirements: 5.5, 5.6_

- [x] 6. Fix `components/AgentIdentityBadge.tsx` — design system and real RPC check
  - [x] 6.1 Replace Tailwind color classes with inline styles
    - Loading state: replace `bg-gray-800 border-gray-700` with inline `backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 0, fontFamily: 'var(--font-mono)', fontSize: 10, color: '#555'`
    - Pending state: replace `bg-orange-900/30 border-orange-700/50 text-orange-400` with inline `backgroundColor: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.4)', color: '#7c3aed'`; dot: `backgroundColor: '#7c3aed'`; remove `rounded-full` from dot
    - Registered state: replace `bg-green-900/30 border-green-700/50 text-green-400` with inline `backgroundColor: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80'`; dot: `backgroundColor: '#4ade80'`; remove `rounded-full` from dot
    - _Requirements: 8.4_
  - [x] 6.2 Add real Mantle RPC check with zero-address demo-mode fallback
    - Read `process.env.NEXT_PUBLIC_ERC8004_CONTRACT` and `process.env.NEXT_PUBLIC_MANTLE_RPC_URL`
    - If contract address is zero address or missing → set `isRegistered(true)`, display "ERC-8004: Demo Mode", skip RPC call
    - Otherwise: `eth_call` to the contract with `AbortSignal.timeout(3000)`; on success set registered from result; on any error set `isRegistered(true)` (fail open)
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 7. Fix `app/api/mantle/log/route.ts` — response shape and RealClaw integration
  - [x] 7.1 Fix the POST response shape to `{ success, txHash, chainId: 5000 }`
    - Replace `return NextResponse.json({ success: true, log: logEntry, message: '...' })` with `return NextResponse.json({ success: true, txHash: mockTxHash, chainId: 5000 })`
    - _Requirements: 9.5_
  - [x] 7.2 Add RealClaw API integration when `REALCLAW_API_KEY` is set
    - If `process.env.REALCLAW_API_KEY` is set, POST to `${process.env.NEXT_PUBLIC_REALCLAW_API_URL}/log` with `Authorization: Bearer` header, body `{ agentId, action, details, chainId: 5000 }`, timeout 5000ms
    - If RealClaw responds OK, use `rcData.txHash ?? mockTxHash` as the final `txHash`
    - If RealClaw call fails, fall back to `mockTxHash` and log to console
    - If `REALCLAW_API_KEY` is not set, skip the RealClaw call entirely (MVP mode)
    - Always return `{ success: true, txHash, chainId: 5000 }`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 8. Fix broken imports in `app/trade/page.tsx`
  - Remove the dangling `fetchOrderBook` call inside `handleProposeBet`
  - The `fetchMantleTokenPrices` import is already correct; replace the `fetchOrderBook` call with a direct use of `opp.referencePrice` (the pool's APY-based price) since there is no CLOB on Mantle
  - Remove the `book.best_ask` branch entirely; keep the `realPrice = opp.referencePrice` fallback as the only path
  - _Requirements: 6.2, 6.5_

- [x] 9. Fix broken imports in `components/OrderBook.tsx`
  - The component references `fetchOrderBook` and uses `OrderBook` as both a component name and a state type — both are undefined after `clobService.ts` is deleted
  - Replace the `fetchOrderBook` call and `OrderBook` state type with a Mantle-compatible stub:
    - Import `fetchMantlePools, type MantlePool` (already present)
    - Replace `useState<OrderBook | null>` with a local `MantleOrderBookData` interface that mirrors the shape the render code expects (`bids`, `asks`, `best_bid`, `best_ask`, `spread`, `mid_price`)
    - Replace `fetchOrderBook(id)` with a function that looks up the matching `MantlePool` by `contractAddress` or `id` and synthesises a simplified order book (best_bid = APY/100 * 0.99, best_ask = APY/100 * 1.01, empty bids/asks arrays, spread = best_ask - best_bid)
    - Return `null` when no matching pool is found (renders "Order book unavailable")
  - _Requirements: 6.2, 6.5_

- [x] 10. Fix broken imports in `components/PositionPanel.tsx`
  - The component calls `fetchUserPositions(walletAddress)` which is currently undefined (from deleted `clobService.ts`)
  - Import `fetchUserPositions` from `@/lib/services/clobService` is already gone; replace the call with a direct fetch to `/api/positions?wallet=${walletAddress}` using the same parsing logic that `clobService.fetchUserPositions` used
  - Define a local `UserPosition` interface (copy from `clobService.ts`) or import from `@/types` if it exists there
  - _Requirements: 6.2, 6.6_

- [x] 11. Fix broken imports in `app/execute/page.tsx`
  - The page uses `OrderBook` type and `fetchOrderBook()` function (both from deleted `clobService.ts`)
  - Replace `OrderBook` type with `LiveOrderBook` imported from `@/types` (already defined there with compatible shape)
  - Replace `fetchOrderBook(tokenId)` call with a stub that returns `null` — no CLOB on Mantle; the `OrderBookPanel` already handles `book === null` gracefully
  - Update `OrderBookPanel` prop type from `OrderBook | null` to `LiveOrderBook | null`
  - _Requirements: 6.2, 6.5_

- [x] 12. Fix broken imports in `app/portfolio/page.tsx`
  - The page calls `fetchUserPositions(walletAddress)` which is undefined after `clobService.ts` is deleted
  - Apply the same fix as task 10: replace with a direct `/api/positions` fetch using the same parsing logic
  - Define or import `UserPosition` type consistently with the fix in task 10
  - _Requirements: 6.2, 6.6_

- [x] 13. Migrate utility functions from `lib/services/polymarketData.ts` before deletion
  - Move `parseStringArray`, `getYesTokenId`, and `derive24hPriceChangeFromHistory` (plus `PolymarketPricePoint` type) into `lib/services/mantleDeFiService.ts`
  - Export all three functions from `mantleDeFiService.ts`
  - Update `lib/services/marketService.ts` to import `parseStringArray` and `getYesTokenId` from `@/lib/services/mantleDeFiService` instead of `polymarketData`
  - _Requirements: 6.4_

- [x] 14. Migrate `OrderBook` and `UserPosition` types before deleting `clobService.ts`
  - Add `OrderBook` interface (copy from `clobService.ts`) to `lib/services/signalEngine.ts` as a local type, or export it from `@/types`
  - Ensure `signalEngine.ts` no longer imports from `clobService`
  - Ensure `tradeIntentService.ts` and any other files importing from `clobService` are updated to remove or replace those imports
  - _Requirements: 6.5, 6.6_

- [x] 15. Delete dead Polymarket files
  - Delete `lib/services/polymarketData.ts`
  - Delete `lib/services/clobService.ts`
  - Delete `app/api/clob/[...path]/route.ts` and its containing directory `app/api/clob/`
  - _Requirements: 6.1, 6.2, 6.3_

- [-] 16. Checkpoint — verify build compiles after import fixes and file deletions
  - Run `npm run build` and fix any remaining TypeScript errors before updating tests
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Update test files for Mantle context
  - [x] 17.1 Delete `lib/services/__tests__/polymarketData.test.ts`
    - _Requirements: 7.1_
  - [x] 17.2 Update `lib/services/__tests__/signalEngine.test.ts`
    - Remove `import type { OrderBook } from '../clobService'`
    - Import `OrderBook` from its new location (either `signalEngine.ts` re-export or `@/types`)
    - All test logic remains unchanged — only the import path changes
    - _Requirements: 7.2_
  - [x] 17.3 Rewrite `app/api/markets/route.test.ts` to mock `fetchMantlePools`
    - Remove all mocks for `gamma-api.polymarket.com` and `clob.polymarket.com/prices-history`
    - Add `vi.mock('@/lib/services/mantleDeFiService', () => ({ fetchMantlePools: vi.fn().mockResolvedValue([{ id: 'agni-meth-usdc', name: 'mETH-USDC', protocol: 'agni-finance', tvl: 12500000, apy: 12.4, token0: 'mETH', token1: 'USDC', liquidity: 8500000, volume24h: 3200000 }]) }))`
    - Update assertions: expect `response.status` to be 200, expect the response array to contain the mocked pool
    - _Requirements: 7.3_

- [x] 18. Final build and test verification
  - [x] 18.1 Run `npm run build` — must complete with zero TypeScript errors
    - Fix any remaining type errors before marking complete
    - _Requirements: 10.1_
  - [x] 18.2 Run `npm test` — all Vitest tests must pass
    - Fix any failing tests before marking complete
    - _Requirements: 10.2_

- [x] 19. Final checkpoint — submission readiness
  - Ensure all tests pass, ask the user if questions arise.
  - Verify the brutalist terminal UI design system is intact: zero border-radius, `#7c3aed` orange accent, `#0d0d0d` background, mono fonts
  - Confirm the Markets page displays Mantle ecosystem pools (mETH-USDC, MNT-USDC, USDY-USDC, mETH-MNT)
  - Confirm the AI chat welcome screen shows "Pun" branding and Mantle-specific suggestion cards
  - _Requirements: 10.3, 10.4, 10.5_

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP build
- Tasks 1–3 must be completed before task 4 (checkpoint) to keep the build green
- Tasks 8–14 (import fixes + migrations) must be completed before task 15 (file deletion) — deleting files before fixing imports will break the build
- Task 16 (checkpoint) must pass before updating tests in task 17
- Property tests (P1–P5) validate the correctness properties defined in the design document
- The `OrderBook` type in `signalEngine.ts` is used only for spread/slippage analysis — it does not need to connect to a real CLOB; the Mantle port keeps the type for internal signal scoring
- All UI changes must preserve the brutalist design system: `border-radius: 0` everywhere, inline styles using the canonical palette, no Tailwind color classes
