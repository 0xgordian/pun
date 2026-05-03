# Pun

> An AI-native DeFi trading terminal for Mantle Network — built for the **Turing Test Hackathon 2026**. AI agents, live DeFi pool data, and on-chain agent benchmarking.

- **Live Website:** https://pun.ai (coming soon)
- **Turing Test Hackathon 2026:** [DoraHacks Submission](https://dorahacks.io/hackathon/mantleturingtesthackathon2026)
- **Track:** AI Trading & Strategy + Consumer & Viral DApps
- **Submission Deadline:** June 15, 2026

---

## What This Is

Pun is an AI-native DeFi terminal for Mantle Network (chain ID 5000). It combines live Mantle DeFi data (Agni Finance, Merchant Moe, Lendle), AI-powered yield strategy analysis via aomi SDK, and automated position management — all in a brutalist, terminal-style UI.

The AI assistant has live Mantle ecosystem context injected into every chat message — mETH/USDC pools, APY rates, TVL, and RWA assets (USDY). It identifies yield opportunities, explains strategies, and routes trades through your Para wallet on Mantle.

**Key hackathon features:**
- ERC-8004 agent identity badge (on-chain AI agent reputation)
- On-chain agent decision logging via `/api/mantle/log` (Mantle benchmarking)
- Mantle Network integration (chain ID 5000, MNT native token)
- AI agent using aomi SDK with live Mantle DeFi pool context

> Paper trade mode works fully out of the box — no API keys, no wallet required. Live pool data loads from Agni Finance and Merchant Moe subgraphs.

---

## Pages

| Route | Purpose |
|---|---|
| `/` | AI chat with live Mantle pool context |
| `/trade` | Market dashboard + edge scoring + yield simulation |
| `/markets` | Full pool browser with search, filters, and alerts |
| `/portfolio` | Positions, P&L, alerts, position guards, trade history |
| `/execute` | Direct order terminal with liquidity depth and fill tracking |

---

## Setup

```bash
git clone https://github.com/0xgordian/pun
cd pun
npm install --legacy-peer-deps
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Enable AI + Wallet

```env
# .env.local

# aomi backend — enables AI chat with live Mantle pool context
NEXT_PUBLIC_AOMI_API_KEY=your_key_here

# Para SDK — enables wallet connect (Google, Twitter, Discord, email)
NEXT_PUBLIC_PARA_API_KEY=your_key_here

# Mantle Network
NEXT_PUBLIC_MANTLE_RPC_URL=https://rpc.mantle.xyz

# ERC-8004 Agent Identity (optional — zero address = demo mode)
NEXT_PUBLIC_ERC8004_CONTRACT=0x0000000000000000000000000000000000000000

# RealClaw API (optional — enables real on-chain logging)
REALCLAW_API_KEY=your_key_here
NEXT_PUBLIC_REALCLAW_API_URL=https://api.realclaw.xyz
```

Get an aomi key at [aomi.dev](https://aomi.dev).

---

## How aomi Powers This

Pun is built on two aomi primitives:

### `@aomi-labs/widget-lib` — `<AomiFrame />`

The entire AI chat interface. Drop-in React component with wallet awareness built in. Pun wraps it with a custom `Thread` component, custom markdown rendering, and a `trade_card` JSON → interactive UI bridge.

```tsx
<AomiFrame backendUrl="/api/aomi" walletAddress={address} />
```

### `@aomi-labs/client` — `Session`

The TypeScript SDK for programmatic trade intent routing. When a user confirms a yield strategy, `sendLiveOrder` builds an EIP-712 order and routes it through an aomi `Session` to the connected wallet for signing on Mantle.

### System Prompt Injection

Every chat message is enriched server-side with live Mantle pool data (top 10 by TVL, APY, 24h volume from Agni Finance and Merchant Moe) before hitting the AI. The agent reasons with real numbers, not stale context.

### Trade Card Flow

The AI returns structured JSON at the end of a yield recommendation:

```json
{
  "action": "trade_card",
  "market": "mETH-USDC",
  "side": "YES",
  "shares": 1000,
  "price": 12,
  "reasoning": "Highest TVL pool on Agni Finance with 12.4% APY and deep liquidity"
}
```

`parseTradeCard()` in `thread.tsx` detects this, renders a `TradeCard` component inline in the chat, and the user confirms — triggering `addTradeRecord` + `sendLiveOrder` (if wallet connected).

### Para SDK

Social login (Google, Twitter, Discord, email) → non-custodial wallet on Mantle. No seed phrase. No private key management. Para handles all signing — Pun never touches a private key.

### Supported Chains

Pun runs on **Mantle Network (chain ID 5000)**. The aomi backend supports Ethereum (1), Arbitrum (42161), Base (8453), Optimism (10), and Polygon (137) — the same chain set is available for future integrations.

---

## Architecture

```
app/
  page.tsx                    # AI chat — AomiFrame + AutoSendBridge
  trade/page.tsx              # Markets dashboard + edge engine
  markets/page.tsx            # Full pool browser
  portfolio/page.tsx          # Positions + P&L + alerts + guards
  execute/page.tsx            # Order terminal + fill tracking
  api/aomi/[...path]/         # aomi proxy — injects live Mantle pool context
  api/markets/                # Mantle pool cache (2min TTL) via subgraphs
  api/mantle/log/             # On-chain agent decision logging (ERC-8004)
  api/positions/              # Positions proxy (CORS-safe)

components/
  assistant-ui/thread.tsx     # Custom aomi thread — dark terminal theme
  assistant-ui/trade-card.tsx # trade_card JSON → inline confirmation flow
  AgentIdentityBadge.tsx      # ERC-8004 on-chain agent identity badge
  EdgeResults.tsx             # Scored opportunity cards with breakdown
  BetSimulation.tsx           # Trade modal — paper or live via sendLiveOrder
  PositionGuardPanel.tsx      # Stop-loss / take-profit rule manager
  TradeHistory.tsx            # Trade log with aggregate stats + CSV export
  AlertsPanel.tsx             # Price alerts + browser notifications
  OrderBook.tsx               # Mantle pool liquidity depth display

lib/
  services/mantleDeFiService.ts    # Live Agni + Merchant Moe subgraph fetching
  services/marketService.ts        # MantlePool → Market adapter + cache
  services/signalEngine.ts         # Honest market signals from pool data
  services/tradeIntentService.ts   # aomi Session → EIP-712 → wallet signing
  services/orderFillService.ts     # Fill polling (3s interval, 60s max)
  services/positionGuardService.ts # Stop-loss / take-profit automation
  services/tradeHistoryService.ts  # localStorage + outcome resolution
  services/alertService.ts         # Price alerts + browser notifications
  services/bankrollService.ts      # Bankroll tracking + sizing context
  stores/appStore.ts               # Zustand — shareToChat, simulation state
```

---

## Key Features

### AI Chat (`/`)
- Natural language queries with live Mantle pool data in every response
- AI knows current APY, TVL, 24h volume, your open positions
- `trade_card` JSON → interactive confirmation card inline in chat
- Paper trade or live execution without leaving the thread
- Thread persistence across navigation

### Trade Dashboard (`/trade`)
- Live Mantle DeFi pools refreshed every 15s (active) / 60s (idle)
- Edge engine scores pools 0–100 on TVL, APY, liquidity, movement
- Simulate yield strategy with real pool data before committing
- AI widget embedded in the right column

### Markets (`/markets`)
- Full pool browser with search by token pair or protocol
- Set price alerts on any pool
- Filter by protocol (Agni Finance, Merchant Moe, Lendle, RWA)

### Portfolio (`/portfolio`)
- Open positions from connected Para wallet
- Trade history with resolved P&L, win rate, avg return, CSV export
- Price alerts with browser notifications
- Position guards: automated stop-loss and take-profit rules

### Execute (`/execute`)
- Mantle pool liquidity depth visualization
- Market signals: TIGHT_SPREAD, HIGH_ACTIVITY, MOVING, LIQUID, NEAR_RESOLUTION, WIDE_SPREAD, LOW_VOLUME
- Bankroll sizing warnings
- Fill tracking: PENDING → OPEN → MATCHED → FILLED

---

## Mantle Hackathon Integration

| Requirement | Implementation |
|---|---|
| Mantle Network (chain ID 5000) | Para wallet defaults to Mantle, all trades on chain 5000 |
| ERC-8004 agent identity | `AgentIdentityBadge` component, real RPC check with fallback |
| On-chain agent decision logging | `/api/mantle/log` endpoint, RealClaw API integration |
| Live DeFi data | Agni Finance + Merchant Moe subgraphs via `graph.mantle.xyz` |
| AI agent | aomi SDK with Mantle pool context injected per message |

---

## Security

- Rate limiting: 30/min (aomi proxy), 60/min (markets, search, positions)
- SSRF protection: upstream URL validated against ALLOWED_HOSTS allowlist
- Wallet address validation: ETH_ADDRESS_RE regex prevents prompt injection
- Security headers: X-Frame-Options DENY, CSP, X-Content-Type-Options
- Max request body: 20k chars on all proxies
- No private keys stored — Para SDK handles all signing

---

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # TypeScript + ESLint
npm test             # Unit tests (Vitest) — 90 tests across 10 files
```

---

## License

MIT
