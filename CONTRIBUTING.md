# Contributing to Pun

## Setup

```bash
git clone https://github.com/0xgordian/pun
cd pun
npm install --legacy-peer-deps
cp .env.example .env.local
npm run dev
```

The app runs fully in paper-trade mode without any API keys. Live pool data loads from Agni Finance and Merchant Moe subgraphs automatically.

## Commands

```bash
npm run dev          # Development server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint + TypeScript check
npm test             # Vitest unit tests (90+ tests across 12 files)
npm run test:watch   # Vitest in watch mode
npm run test:coverage # Coverage report
```

## Code Style

- TypeScript strict mode — no `any` unless absolutely necessary
- Prettier config in `.prettierrc` — run `npx prettier --write .` before committing
- ESLint config in `.eslintrc.json` — `npm run lint` must pass

## Design System

All UI changes must follow the design system in `.kiro/steering/ui-design-system.md`:

- `border-radius: 12px` on all panels, cards, inputs, and buttons
- `border-radius: 9999px` (pill) on nav status pills, wallet badge, Connect Wallet button
- Only colors from the defined palette — no Tailwind default color classes
- `#7c3aed` brand purple — never substitute another shade
- `panel-bracket` left accent on all panels (requires `overflow: hidden` on parent)
- Plus Jakarta Sans for body/nav, Geist Mono for terminal labels via `.font-terminal`
- `transition: 'all 0.15s ease'` on all interactive elements
- `onMouseDown/Up` press feedback (`scale(0.98)`) on primary buttons
- Staggered entrance animations via `motion/react-m` on card lists

## Architecture

- **Services** (`lib/services/`) — pure business logic, no React, no side effects at import time
- **Components** (`components/`) — React only, import services, never call APIs directly
- **API routes** (`app/api/`) — server-side proxies, rate limiting, no business logic
- **Stores** (`lib/stores/`) — Zustand global state, minimal surface area

## Mantle DeFi Data

Pool data comes from:
- Agni Finance subgraph: `https://graph.mantle.xyz/subgraphs/name/agni/exchange-v3`
- Merchant Moe subgraph: `https://graph.mantle.xyz/subgraphs/name/merchant-moe/lb-v21`
- Lendle API: `https://api.lendle.xyz/pools`
- mETH staking: `https://meth.mantle.xyz/api/v1/meth/info`
- CoinGecko: MNT, mETH, USDC prices

APY is calculated from `poolDayData` / `lbPairDayData` subgraph fields (actual 24h fees), not cumulative fee estimates.

## Testing

- Unit tests live in `lib/services/__tests__/` and `app/api/*/route.test.ts`
- Use Vitest for all tests
- `fast-check` is available for property-based tests
- New services should have unit tests covering the main happy path and error cases
- Property tests for correctness properties (P1–P5) live in `mantleDeFiService.test.ts` and `marketService.test.ts`

## Environment Variables

See `.env.example` for all available variables. The app works without any keys in paper-trade mode.

Required for live trading:
- `NEXT_PUBLIC_AOMI_API_KEY` — aomi backend (AI chat)
- `NEXT_PUBLIC_PARA_API_KEY` — Para wallet connect

Required for Mantle integration:
- `NEXT_PUBLIC_MANTLE_RPC_URL` — defaults to `https://rpc.mantle.xyz`
- `NEXT_PUBLIC_ERC8004_CONTRACT` — zero address = demo mode

Optional:
- `REALCLAW_API_KEY` — enables real on-chain agent decision logging
- `NEXT_PUBLIC_REALCLAW_API_URL` — RealClaw API endpoint

## Pull Requests

- Keep PRs focused — one feature or fix per PR
- `npm run lint` and `npm test` must pass
- Update `TODO.md` if completing an open task
- Add a brief description of what changed and why
