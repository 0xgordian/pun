# Requirements Document

## Introduction

Pun is a Next.js 14 AI-native trading terminal being ported from the Polymarket prediction market ecosystem to the Mantle blockchain (chain ID 5000) for submission to the Turing Test Hackathon 2026 (deadline June 15, 2026, prize pool $100,000). The codebase has been partially migrated — config, layout, and Mantle DeFi data services are already updated. This spec covers the remaining work to make the app fully submission-ready: fixing the TypeScript build error in the aomi proxy route, removing dead Polymarket code and files, updating the AI system prompt to Mantle context, updating the market cache refresh event, updating the markets route test, updating the polymarketData test file, and verifying the full app works end-to-end before Vercel deployment.

The brutalist terminal UI design system (zero border-radius, `#7c3aed` orange accent, `#0d0d0d` background, mono fonts) MUST be preserved throughout all changes.

## Glossary

- **Pun**: The application being built — an AI-native Mantle DeFi trading terminal
- **Mantle**: Layer-2 blockchain network, chain ID 5000, using MNT as native token
- **Aomi_Proxy**: The Next.js API route at `app/api/aomi/[...path]/route.ts` that proxies AI chat requests and injects system prompt context
- **Market_Service**: The client-side service at `lib/services/marketService.ts` that fetches and caches DeFi pool data
- **Mantle_DeFi_Service**: The service at `lib/services/mantleDeFiService.ts` that returns Mantle ecosystem pool data
- **ERC-8004**: Ethereum token standard for on-chain AI agent identity NFTs
- **Agent_Identity_Badge**: The React component at `components/AgentIdentityBadge.tsx` that displays ERC-8004 registration status
- **On_Chain_Log**: The API endpoint at `app/api/mantle/log/route.ts` that records agent decisions to Mantle
- **Thread_Component**: The AI chat UI component at `components/assistant-ui/thread.tsx`
- **Para_Wallet**: The wallet connection library already configured for Mantle chain ID 5000
- **mantle-agent-kit-sdk**: Installed SDK for Mantle DeFi agent interactions
- **CLOB_Route**: The legacy API route at `app/api/clob/[...path]/route.ts` that proxied Polymarket CLOB requests
- **Polymarket_Data_Module**: The legacy utility module at `lib/services/polymarketData.ts` containing parse helpers
- **CLOB_Service**: The legacy service at `lib/services/clobService.ts` containing Polymarket order book fetch functions

---

## Requirements

### Requirement 1: Fix TypeScript Build Error in Aomi Proxy Route

**User Story:** As a developer, I want the TypeScript build to pass without errors, so that the app can be deployed to Vercel.

#### Acceptance Criteria

1. WHEN `npm run build` is executed, THE Aomi_Proxy SHALL compile without TypeScript errors.
2. THE Aomi_Proxy SHALL replace the `POLYMARKET_SYSTEM_PROMPT` constant with a `MANTLE_SYSTEM_PROMPT` constant that instructs the AI it is operating inside Pun, a Mantle DeFi trading terminal.
3. THE Aomi_Proxy SHALL remove the `fetchPriceChange` function and all references to `clob.polymarket.com`.
4. THE Aomi_Proxy SHALL remove the `EnrichedMarket` type, `GammaMarketRaw` type, `getTokenId` function, `fmtChange` function, and all other Polymarket-specific helpers that are no longer used after the system prompt replacement.
5. WHEN a chat message request is received, THE Aomi_Proxy SHALL inject `MANTLE_SYSTEM_PROMPT` combined with live Mantle pool context into the request body before forwarding to the upstream aomi API.
6. THE Aomi_Proxy SHALL preserve all existing rate limiting, SSRF protection, request size validation, and streaming proxy behaviour unchanged.

---

### Requirement 2: Update Live Market Context in Aomi Proxy

**User Story:** As a trader, I want the AI assistant to have accurate Mantle DeFi pool data in its context, so that it can give relevant trading advice for Mantle ecosystem pools.

#### Acceptance Criteria

1. WHEN the Aomi_Proxy fetches live market context, THE Aomi_Proxy SHALL call `/api/markets` and format the response as Mantle pool data (protocol, TVL, APY, token pair, 24h volume).
2. THE Aomi_Proxy SHALL format each pool entry as: `- {name} ({protocol}) | TVL: ${tvl} | APY: {apy}% | Vol 24h: ${vol24h}`.
3. THE Aomi_Proxy SHALL preserve the 5-minute server-side market context cache and request deduplication logic.
4. IF the `/api/markets` fetch fails or returns an empty array, THEN THE Aomi_Proxy SHALL proceed with an empty context string and not throw an error.

---

### Requirement 3: Update Market Cache Refresh Event in Thread Component

**User Story:** As a user, I want the Refresh quick-action button in the AI chat to clear the Mantle pool cache, so that I get fresh DeFi data when I request it.

#### Acceptance Criteria

1. THE Thread_Component SHALL replace `localStorage.removeItem('polymarket_markets_cache')` with `localStorage.removeItem('mantle_pools_cache')` in the Refresh quick-action button handler.
2. THE Thread_Component SHALL replace `window.dispatchEvent(new CustomEvent('polymarket:refresh-markets'))` with `window.dispatchEvent(new CustomEvent('mantle:refresh-markets'))` in the Refresh quick-action button handler.
3. THE Market_Service SHALL listen for the `mantle:refresh-markets` custom event instead of `polymarket:refresh-markets` to trigger a cache clear and re-fetch.
4. WHEN the `mantle:refresh-markets` event fires, THE Market_Service SHALL clear the in-memory cache and call `fetchActiveMarkets()` then notify all registered refresh callbacks.

---

### Requirement 4: Update Slash Commands to Mantle Context

**User Story:** As a trader, I want the AI chat slash commands to reference Mantle DeFi concepts, so that the suggested prompts are relevant to the Mantle ecosystem.

#### Acceptance Criteria

1. THE Thread_Component SHALL replace all slash command prompts that reference "Polymarket" with equivalent prompts referencing Mantle DeFi pools, MNT token, and Mantle ecosystem protocols.
2. THE Thread_Component SHALL replace the `/movers` command prompt with a Mantle-specific prompt asking about the biggest APY or TVL changes in Mantle pools.
3. THE Thread_Component SHALL replace the `/analyze` command prompt with a Mantle-specific prompt asking for deep analysis of the top Mantle pool by TVL.
4. THE Thread_Component SHALL replace the `/trade` command prompt with a Mantle-specific prompt asking for the best yield opportunity on Mantle right now.

---

### Requirement 5: Update Welcome Screen and Suggestion Cards

**User Story:** As a user, I want the AI chat welcome screen to show Mantle-relevant content, so that the app feels native to the Mantle ecosystem.

#### Acceptance Criteria

1. THE Thread_Component SHALL replace the "Kuroko" brand label in the welcome screen with "Pun".
2. THE Thread_Component SHALL replace the "AI Market Intelligence" heading with "AI Mantle Trading Terminal".
3. THE Thread_Component SHALL replace the subtitle text referencing "markets" and "positions" with text referencing Mantle DeFi pools and yield opportunities.
4. WHEN Mantle pool data is available, THE Thread_Component SHALL build dynamic suggestion cards from pool data (top TVL pool, highest APY pool, near-50% probability pool equivalent, portfolio analysis).
5. WHEN no pool data is available, THE Thread_Component SHALL display static fallback suggestion cards referencing Mantle DeFi concepts (MNT yield, mETH pools, Agni Finance, Merchant Moe).
6. THE Thread_Component SHALL replace all remaining "Polymarket" references in suggestion card action strings with Mantle-equivalent references.

---

### Requirement 6: Remove Dead Polymarket Files

**User Story:** As a developer, I want all legacy Polymarket-specific files removed from the codebase, so that the submission is clean and does not contain dead code.

#### Acceptance Criteria

1. THE System SHALL delete `lib/services/polymarketData.ts`.
2. THE System SHALL delete `lib/services/clobService.ts`.
3. THE System SHALL delete `app/api/clob/[...path]/route.ts` and its containing directory.
4. WHEN `lib/services/polymarketData.ts` is deleted, THE System SHALL migrate the `parseStringArray`, `getYesTokenId`, and `derive24hPriceChangeFromHistory` utility functions into `lib/services/mantleDeFiService.ts` so that any remaining consumers continue to compile.
5. WHEN `lib/services/clobService.ts` is deleted, THE System SHALL update `lib/services/signalEngine.ts` to import the `OrderBook` type from a new location or inline the type definition.
6. WHEN `lib/services/clobService.ts` is deleted, THE System SHALL update `lib/services/tradeIntentService.ts` and any other files that import from `clobService` to remove or replace those imports.

---

### Requirement 7: Update Test Files for Mantle Context

**User Story:** As a developer, I want all test files to pass after the Polymarket files are removed, so that `npm test` succeeds before deployment.

#### Acceptance Criteria

1. THE System SHALL delete `lib/services/__tests__/polymarketData.test.ts` when `lib/services/polymarketData.ts` is deleted.
2. THE System SHALL update `lib/services/__tests__/signalEngine.test.ts` to import `OrderBook` from its new location after `clobService.ts` is deleted.
3. THE System SHALL update `app/api/markets/route.test.ts` to mock `fetchMantlePools` from `mantleDeFiService` instead of mocking Gamma API and CLOB endpoints, since the markets route now calls `fetchMantlePools` directly.
4. WHEN `npm test` is run, THE System SHALL pass all remaining Vitest tests without errors.

---

### Requirement 8: ERC-8004 Agent Identity — Real Contract Check

**User Story:** As a hackathon judge, I want the ERC-8004 badge to attempt a real contract read on Mantle, so that the agent identity feature demonstrates genuine on-chain integration.

#### Acceptance Criteria

1. THE Agent_Identity_Badge SHALL call the Mantle RPC endpoint (`MANTLE_RPC_URL`) to check whether the given `agentId` is registered in the ERC-8004 contract at `ERC8004_CONTRACT`.
2. IF the `ERC8004_CONTRACT` address is the zero address (`0x000...000`), THEN THE Agent_Identity_Badge SHALL fall back to the simulated registration check and display "ERC-8004: Demo Mode" instead of "ERC-8004: Pending".
3. IF the RPC call fails or times out after 3000ms, THEN THE Agent_Identity_Badge SHALL display the badge as registered to avoid blocking the UI.
4. THE Agent_Identity_Badge SHALL preserve the existing brutalist terminal styling (green badge for registered, orange for pending, mono font, zero border-radius).

---

### Requirement 9: On-Chain Agent Decision Logging — Real Transaction

**User Story:** As a hackathon judge, I want agent decisions to be logged to Mantle via a real transaction, so that the on-chain benchmarking requirement is satisfied.

#### Acceptance Criteria

1. THE On_Chain_Log endpoint SHALL accept POST requests with `agentId`, `action`, and `details` fields.
2. WHEN the `REALCLAW_API_KEY` environment variable is set, THE On_Chain_Log endpoint SHALL attempt to submit the log entry to the RealClaw API at `REALCLAW_API_URL`.
3. IF the RealClaw API call fails, THEN THE On_Chain_Log endpoint SHALL fall back to returning a mock transaction hash and log the entry to the server console.
4. IF the `REALCLAW_API_KEY` environment variable is not set, THEN THE On_Chain_Log endpoint SHALL operate in MVP mode: log to console and return a mock transaction hash.
5. THE On_Chain_Log endpoint SHALL always return a JSON response with `success`, `txHash`, and `chainId: 5000` fields regardless of whether the real transaction succeeded.

---

### Requirement 10: End-to-End App Verification

**User Story:** As a developer, I want to verify the complete app works correctly before submitting to the hackathon, so that judges can evaluate a functional product.

#### Acceptance Criteria

1. WHEN `npm run build` is executed, THE System SHALL complete without TypeScript errors or build failures.
2. WHEN `npm test` is executed, THE System SHALL pass all Vitest tests.
3. WHEN the app is loaded in a browser, THE System SHALL display the Pun terminal UI with the brutalist design system intact (zero border-radius, `#7c3aed` orange accent, `#0d0d0d` background).
4. WHEN the Markets page is loaded, THE System SHALL display Mantle ecosystem pools (mETH-USDC, MNT-USDC, USDY-USDC, mETH-MNT) from the Mantle_DeFi_Service.
5. WHEN the AI chat is opened, THE System SHALL display the Pun welcome screen with Mantle-specific suggestion cards.
6. WHEN a message is sent in the AI chat, THE System SHALL inject the Mantle system prompt and live pool context into the request.
7. WHEN the Para wallet connect button is clicked, THE System SHALL prompt connection to Mantle network (chain ID 5000).
8. WHEN the ERC-8004 badge is rendered with a valid agent ID, THE System SHALL display the badge with correct registration status.
9. WHEN the Markets page is loaded, THE System SHALL display live pool data with real TVL, APY, and volume figures from Mantle DeFi APIs (not hardcoded static values).

---

### Requirement 11: Live Production Data from Mantle DeFi APIs

**User Story:** As a trader, I want the app to show real live pool data from Mantle DeFi protocols, so that the trading terminal reflects actual market conditions rather than hardcoded static values.

#### Acceptance Criteria

1. THE Mantle_DeFi_Service SHALL fetch live pool data from the Agni Finance subgraph API (`https://agni.finance/api/v1/pools` or the official Agni subgraph on The Graph) for real TVL, APY, and volume data.
2. THE Mantle_DeFi_Service SHALL fetch live pool data from the Merchant Moe API or subgraph for MNT-USDC and related pairs.
3. THE Mantle_DeFi_Service SHALL fetch live MNT token price from a public price API (CoinGecko, CoinMarketCap, or Mantle's own price feed at `https://rpc.mantle.xyz`).
4. THE Mantle_DeFi_Service SHALL implement a server-side cache with a 2-minute TTL to avoid hammering external APIs on every request.
5. IF any live API call fails or times out after 5000ms, THEN THE Mantle_DeFi_Service SHALL fall back to the last known good data or the static fallback values, so the app never shows an empty state.
6. THE Mantle_DeFi_Service SHALL return data in the existing `MantlePool` interface shape so all consumers (markets route, aomi proxy, search route) continue to work without changes.
7. THE `MantlePool` interface SHALL be extended to include an `oneDayPriceChange` field (number | null) populated from live price history where available.
8. THE Mantle_DeFi_Service SHALL expose a `fetchLiveMantleData()` function that fetches from all sources in parallel with `Promise.allSettled` so a single API failure does not block the others.
