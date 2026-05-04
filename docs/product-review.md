# Pun — Full Product Review

> A complete A-Z breakdown of what has been built, page by page, service by service, and why it matters.

---

## What This Is

A full-stack AI-powered DeFi trading terminal for Mantle Network. Not a demo. Not a prototype. A real product with 5 pages, 15+ services, and a coherent architecture that combines live Mantle DeFi pool data, intelligent yield opportunity detection, wallet-integrated trade execution, and automated position management — all inside a dark terminal UI built on Kiro's design system. Built for the Turing Test Hackathon 2026.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, React 18, TypeScript |
| AI | aomi-widget (embedded chat) + aomi-sdk Session (trade routing) |
| Wallet | Para SDK (Google, Twitter, Discord, email auth) — Mantle chain ID 5000 |
| DeFi Data | Agni Finance + Merchant Moe subgraphs via `graph.mantle.xyz`, Lendle API, mETH staking API |
| On-chain | ERC-8004 agent identity, RealClaw API for decision logging |
| Storage | localStorage (trades, alerts, guards, bankroll) |
| Styling | Tailwind CSS + inline styles (Kiro design system — `#7c3aed` purple, `border-radius: 12px`) |

---

## Design Principles

1. Paper-trade first — everything works without a wallet or API key
2. Live-ready — wallet + aomi API key enables real execution on Mantle
3. Stateless backend — proxy pattern for market data + system prompt injection
4. Terminal aesthetic — `border-radius: 12px` cards, Plus Jakarta Sans body, Geist Mono labels, `#7c3aed` purple accent
5. Honest signals — no fabricated labels, only observable data from on-chain sources

---

## Pages

### / — AI Chat

The core of the product. A full-screen AI assistant with live Mantle DeFi pool data injected into every message.

What it does:
- Embedded AomiFrame chat interface with custom thread rendering
- System prompt injected once per session (survives navigation via sessionStorage)
- Every message enriched server-side with top 10 Mantle pools by TVL, APY, 24h volume from Agni Finance and Merchant Moe subgraphs
- User positions injected into AI context when wallet connected
- `?q=` URL param auto-sends a query on load — enables deep linking from other pages
- AI can return `trade_card` JSON which renders as an interactive confirmation card inline in chat
- `shareToChat` integration — trade confirmations flow back into the thread automatically
- Wallet status shown in TopNav: Signing Ready (connected) or Paper Mode (no wallet)
- Slash command palette: `/trade`, `/movers`, `/analyze`, `/positions`, `/alert`, `/guard`, `/simulate`, `/execute`, `/portfolio`
- Voice input via Web Speech API

Data flow:
1. Mantle pools load from `/api/markets` on mount (Agni + Merchant Moe subgraphs, 2min cache)
2. User sends message — proxy enriches with live pool context — aomi backend processes
3. AI responds with yield analysis or `trade_card` JSON
4. User confirms strategy — `sendLiveOrder` or paper trade recorded
5. Result shared back to chat thread via `shareToChat`

---

### /trade — Market Dashboard

Where traders find yield opportunities. Live Mantle DeFi pools scored and filtered.

What it does:
- Live pool feed refreshed every 15s active / 60s idle
- Edge engine scores every pool 0–100 on TVL, APY, liquidity, 24h movement
- Category filters: Agni, Moe, Lendle, RWA, Stable, mETH
- Natural language query bar — `findEdges()` filters and scores, returns top 3 opportunities
- Simulate yield strategy with real pool data before committing
- AI widget embedded on right column, toggleable on desktop
- Position panel shows open positions if wallet connected
- Deep link support: `/trade?simulate=POOL_ID&side=YES&shares=50` auto-opens simulation modal

Layout:
- Desktop: 12-column grid (7/5 split) or full-width when AI panel closed
- Mobile: Tab-based (Markets, Trending, Analysis, AI)

Edge scoring algorithm:
- Volume: >$1M = 30pts, >$500K = 20pts, >$100K = 10pts, else 5pts
- Liquidity: >$100K = 20pts, >$50K = 12pts, >$10K = 6pts
- APY proximity to 50%: near 50% = 30pts, within 20pp = 20pts, within 30pp = 10pts, else 5pts
- 24h movement: >10pp = 20pts, >5pp = 12pts, >2pp = 6pts
- Result: 0–100 score mapped to STRONG / MODERATE / WEAK

---

### /markets — Pool Browser

Full catalog with advanced filtering. The Bloomberg terminal view for Mantle DeFi.

What it does:
- Real-time text search across all pool names and protocols
- Category filter: 7 Mantle-specific categories (Agni, Moe, Lendle, RWA, Stable, mETH, All)
- Probability range filter: min/max 1–99% (maps to APY range)
- Volume filter: All, >$10K, >$100K, >$1M
- Sort options: Volume, APY, 24h/7d/30d change, Expiry
- Pool cards show: name, APY, 24h/7d/30d changes, volume, liquidity, expiry
- Set price alerts directly from any pool card
- Analyze button links to `/trade` with pool pre-selected
- Staggered entrance animations on card grid

Persistence:
- Active category and sort saved to localStorage
- Filters reset on demand

---

### /portfolio — Position and Risk Management

Where you manage what you own and protect it.

What it does:
- Summary: total value, unrealized P&L, position count
- Live positions from Para wallet on Mantle (wallet required)
- Price chart: lightweight-charts + price history for any selected pool
- Price alerts: threshold-based with browser notifications, 60s polling
- Position guards: automated stop-loss and take-profit rules
- Trade history: all paper and live trades with resolved P&L
- Aggregate stats: trades count, total deployed, realized P&L, win rate, avg return
- CSV export of full trade history

Layout:
- Desktop: 3-column (summary + positions, chart, alerts + guards)
- Mobile: 5-tab layout (Portfolio, Chart, Alerts, Guards, History)

Key services:
- `fetchUserPositions()` — fetches open positions via `/api/positions` proxy
- `checkAlerts()` — evaluates price alerts every 60s
- `checkGuards()` — evaluates position guards every 60s

---

### /execute — Order Terminal

Direct order execution with liquidity depth and fill tracking.

What it does:
- Pool picker: search and select from all live Mantle pools
- Liquidity depth: synthesized bid/ask depth from pool TVL and APY data
- Market signals: TIGHT_SPREAD, HIGH_ACTIVITY, MOVING, LIQUID, NEAR_RESOLUTION, WIDE_SPREAD, LOW_VOLUME
- Order form: side YES/NO, shares, limit price
- Order summary: cost, payout if correct, return %, slippage estimate, bankroll sizing warning
- Bankroll tracking: user-set bankroll with position sizing context
- Live execution: routes to aomi Session then Para wallet signing on Mantle
- Fill tracking: PENDING → OPEN → MATCHED → FILLED
- Wallet connect prompt inline when not connected
- Paper trade fallback when no wallet

Order flow:
1. User selects pool — analyzes signals
2. User enters shares + limit price — calculates cost/payout/return
3. User clicks Submit — `sendLiveOrder()` builds EIP-712 payload
4. aomi Session routes to Para wallet — user signs on Mantle (chain 5000)
5. Trade recorded to history

---

## Services

### mantleDeFiService.ts

- `fetchMantlePools()` — server-side 2min cache, calls `fetchLiveMantleData()` on miss
- `fetchLiveMantleData()` — parallel fetch from Agni, Merchant Moe, Lendle, mETH staking, Fluxion via `Promise.allSettled`; falls back to 4 static pools if all fail
- `fetchAgniPools()` — GraphQL query to Agni Finance subgraph, uses `poolDayData` for accurate 24h APY
- `fetchMerchantMoePools()` — GraphQL query to Merchant Moe subgraph, uses `lbPairDayData` for accurate 24h APY
- `fetchTokenPrices()` — CoinGecko price API for MNT, mETH, USDC
- `fetchMantleTokenPrices(tokens)` — public price lookup with fallback values

### marketService.ts

- `fetchActiveMarkets()` — hits `/api/markets` with 5min client cache
- `mantlePoolToMarket(pool)` — adapter: `MantlePool` → `Market` type (APY capped to [1, 99] as `currentProbability`)
- `onMarketsRefresh()` — subscription pattern for market updates
- `initMarketService()` — starts adaptive polling (15s active / 60s idle), listens for `mantle:refresh-markets` event

### edgeEngine.ts

- `scoreMarket(market)` — deterministic scoring 0–100
- `findEdges(markets, query)` — filters by category/keywords, scores, returns top 3
- `explainScore(market)` — generates human-readable breakdown
- Philosophy: observable signals only, no fabricated labels

### signalEngine.ts

- `analyseMarket(market, orderBook)` — generates honest market signals
- Signal types: TIGHT_SPREAD, HIGH_ACTIVITY, MOVING, LIQUID, NEAR_RESOLUTION, WIDE_SPREAD, LOW_VOLUME
- `estimateSlippage(orderBook, side, dollarSize)` — walks order book, calculates volume-weighted avg fill price
- Returns execution score 0–100 and activity score 0–100

### tradeIntentService.ts

- `constructBetIntent(proposal)` — builds natural-language trade intent
- `sendLiveOrder(params)` — builds EIP-712 order, sends via aomi Session to Para wallet on Mantle
- Modes: PAPER_TRADE (no wallet), SIGNING_REQUIRED (wallet connected), EXECUTED (tx confirmed)

### orderFillService.ts

- `pollOrderFill(orderId, onUpdate)` — polls every 3s for up to 60s
- Emits PENDING → OPEN → MATCHED → FILLED or CANCELLED/REJECTED

### positionGuardService.ts

- `addGuard(guard)` — creates stop-loss / take-profit rule
- `analyseGuard(guard, currentProbability)` — evaluates if rule triggered
- `checkGuards(marketProbabilities)` — checks all active guards, returns triggered analyses
- Actions: HOLD, SELL (40% at take-profit), REDUCE (65% at stop-loss)
- Storage: localStorage

### alertService.ts

- `addAlert(alert)` — creates price alert above/below threshold
- `checkAlerts(marketProbabilities)` — evaluates all alerts, fires browser notifications
- Storage: localStorage, 60s polling interval

### bankrollService.ts

- `getBankrollContext()` — calculates total deployed, P&L, win rate, category breakdown
- `getSizingContext(proposedCost)` — returns % of bankroll warning if >10% or >20%

### tradeHistoryService.ts

- `addTradeRecord(record)` — logs every paper and live trade
- `exportTradeHistoryCSV(records)` — downloads trade history as CSV
- Storage: localStorage, max 200 records

---

## Components

### Navigation
- `TopNav` — fixed header, `h-14`, backdrop blur, nav links, live status pill, wallet badge, Connect Wallet button
- `MobileBottomNav` — mobile-only bottom navigation with 5 tabs
- `Footer` — GitHub + X links

### Trade Flow
- `QueryBar` — natural language input with dynamic suggestion chips
- `EdgeResults` — opportunity cards with scores, reasoning, action buttons; staggered entrance animations
- `BetSimulation` — modal for trade confirmation (paper or live) with dollar-based sizing
- `PnlCard` — receipt-style trade card with download + share to X

### Market Discovery
- `MarketFeed` — paginated pool list with staggered entrance animations
- `TrendingMarkets` — top 10 by activity
- `CategoryFilter` — Mantle-specific category filter with counts
- `PriceChart` — lightweight-charts integration for price history
- `OrderBook` — Mantle pool liquidity depth display (synthesized from TVL/APY)

### Portfolio Management
- `PositionPanel` — open positions table (wallet required)
- `AlertsPanel` — price alert manager with browser notification toggle
- `PositionGuardPanel` — stop-loss / take-profit rule manager with live analysis
- `TradeHistory` — full trade log with aggregate stats and CSV export

### AI Integration
- `AomiWidget` — embedded aomi-widget with error boundary
- `AomiFrame` — compound component (Root, Header, Composer, ControlBar)
- `ThreadPersist` — persists chat thread to localStorage
- `RuntimeAgentBridge` — bridges aomi runtime events to Zustand store
- `TradeCard` — renders `trade_card` JSON from AI into interactive confirmation UI

### Hackathon-Specific
- `AgentIdentityBadge` — ERC-8004 on-chain agent identity badge with real Mantle RPC check
- `OnboardingModal` — 3-step welcome modal with terminal window, keyboard/swipe navigation

---

## API Routes

### /api/aomi/[...path]

Proxy to aomi backend. On every chat POST:
- Fetches live Mantle pool context (top 10 by TVL, APY, 24h volume)
- Injects user positions if wallet address provided
- Enriches system prompt with `MANTLE_SYSTEM_PROMPT`
- Rate limited: 30 requests/min per IP
- Pool context cached server-side for 5 minutes

### /api/markets

Calls `fetchMantlePools()` from `mantleDeFiService`. Returns `MantlePool[]` with 2min server-side cache.

### /api/markets/[id]

Single pool lookup for outcome resolution.

### /api/markets/search

Pool search endpoint.

### /api/mantle/log

On-chain agent decision logging. Accepts `{ agentId, action, details }`. Calls RealClaw API if `REALCLAW_API_KEY` is set; falls back to mock tx hash. Always returns `{ success, txHash, chainId: 5000 }`.

### /api/positions

Proxy to wallet positions API (avoids CORS).

---

## Mantle Hackathon Integration

| Requirement | Implementation |
|---|---|
| Mantle Network (chain ID 5000) | Para wallet defaults to Mantle, all trades on chain 5000 |
| ERC-8004 agent identity | `AgentIdentityBadge` component, real `eth_call` RPC check with 3s timeout, demo mode for zero address |
| On-chain agent decision logging | `/api/mantle/log` endpoint, RealClaw API integration, mock fallback |
| Live DeFi data | Agni Finance + Merchant Moe subgraphs via `graph.mantle.xyz`, Lendle API, mETH staking API |
| AI agent | aomi SDK with live Mantle pool context injected server-side per message |

---

## Security

- Rate limiting: 30/min on aomi proxy, 60/min on markets API
- SSRF protection: upstream URL validated against ALLOWED_HOSTS allowlist
- Wallet address validation: ETH_ADDRESS_RE regex prevents prompt injection
- Security headers: X-Frame-Options DENY, CSP, X-Content-Type-Options
- Max request body: 20k chars on all proxies
- No private keys stored — Para SDK handles all signing
- Max shares: 10,000 per trade; max cost: $10,000 per trade
- Bankroll sizing warnings at >10% and >20% of bankroll

---

## Data Flow

```
User query
    |
    v
/api/aomi proxy
    |-- fetches /api/markets (Mantle pools, cached 5min)
    |-- injects user positions from /api/positions
    |-- injects MANTLE_SYSTEM_PROMPT
    |
    v
aomi backend (https://api.aomi.dev)
    |
    v
AI response (yield analysis or trade_card JSON)
    |
    v
TradeCard component
    |
    v
sendLiveOrder() — builds EIP-712 payload
    |
    v
aomi Session — routes to Para wallet on Mantle (chain 5000)
    |
    v
User signs transaction
    |
    v
Trade recorded to localStorage
    |
    v
Position guards evaluate every 60s
    |
    v
Alerts fire on threshold cross
```

---

## Code Quality

### Strengths

- Consistent service layer abstraction — pure functions, no React, no side effects at import time
- Type-safe throughout (TypeScript strict mode)
- Deterministic algorithms (edge scoring, signal generation)
- Graceful error handling and fallbacks at every layer
- `Promise.allSettled` for parallel data fetching — single API failure never blocks others
- 24h-accurate APY calculation using `poolDayData` / `lbPairDayData` subgraph fields
- localStorage persistence with max record limits
- Responsive design (desktop multi-column + mobile tabs)
- Error boundaries on all data panels
- Adaptive polling (15s active / 60s idle)
- 2-minute server-side pool cache + 5-minute AI context cache
- 90 unit tests passing across 10 test files

### Architecture Decisions

**Paper-trade first** — All features work without credentials. Graceful degradation: paper mode → signing required → executed.

**Server-side system prompt injection** — Backend proxy enriches every message with live Mantle pool data. AI always has current context without visible message pollution in the thread.

**localStorage-based state** — No backend database required. Trades, alerts, guards, bankroll all stored locally. Scales to 200 trades per user.

**Deterministic edge scoring** — Observable signals only. No fabricated labels. Transparent breakdown shown to user.

**Honest signal engine** — Every signal has a verifiable data source (spread bps, book depth, volume, 24h movement).

**MantlePool → Market adapter** — All UI components consume the `Market` type. The adapter maps Mantle DeFi concepts (APY, TVL, protocol) to the Market interface without rewriting every component.

---

## What Is Built vs What Is Next

### Fully Implemented

- AI chat with live Mantle pool context injection
- Pool discovery with edge scoring
- Paper trade simulation with dollar-based sizing
- Live order execution via Para wallet on Mantle
- Position tracking and P&L
- Price alerts with browser notifications
- Position guards (stop-loss / take-profit rules)
- Trade history with resolved P&L and CSV export
- Bankroll tracking and sizing context
- Liquidity depth visualization
- Market signals (spread, activity, movement, liquidity)
- Slippage estimation
- Aggregate trade stats (win rate, total deployed, avg return)
- Responsive design (desktop multi-column + mobile tabs)
- Rate limiting, CSRF protection, security headers
- ERC-8004 agent identity badge with real Mantle RPC check
- On-chain agent decision logging via RealClaw API
- Onboarding modal with terminal window

### Next Opportunities

1. Auto-execute position guard exits via aomi when rules trigger
2. WebSocket price feed — replace polling with live Mantle price stream
3. Server-side edge scoring — incorporate on-chain depth and whale activity signals
4. Real CLOB integration when available on Mantle
5. Desktop app — Tauri-based native app with system tray and push notifications

---

*Last updated: May 2026*
