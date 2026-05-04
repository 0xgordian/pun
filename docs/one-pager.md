# Pun — One Pager

**Hackathon:** Turing Test Hackathon 2026 (Mantle Network)
**Track:** AI Trading & Strategy + Consumer & Viral DApps
**Deadline:** June 15, 2026

---

## Who this is for

DeFi traders on Mantle Network managing yield positions across Agni Finance, Merchant Moe, Lendle, and mETH staking. They know the protocols. They have a thesis. What they don't have is the ability to monitor 20+ pools simultaneously, execute the moment an APY threshold shifts, or sleep without worrying a position moved overnight.

This is not for casual users. It's for the trader who already has liquidity deployed and needs a system that works while they're offline.

---

## Why this changes their life

The single most painful thing in DeFi yield management is not finding the opportunity — it's managing it after entry.

You provide liquidity to mETH-USDC at 12.4% APY. The pool rebalances. APY drops to 4%. You're asleep. You wake up to a missed exit and impermanent loss you didn't need to take.

Pun solves this with position guards: automated stop-loss and take-profit rules that trigger the moment a threshold is crossed. Set it once. The system polls every 60 seconds, detects the trigger, and routes the exit through aomi → Para signing → Mantle (chain 5000). No manual monitoring. No missed exits.

The AI layer makes it accessible. Instead of configuring rules in a form, you type: "set a stop-loss if mETH-USDC APY drops below 8%." The AI creates the guard, confirms it, and the poller takes over.

That's the life-changing part: the system watches your Mantle positions while you sleep.

---

## Mantle Hackathon Integration

**ERC-8004 agent identity** — Pun's AI agent has an on-chain identity registered via the ERC-8004 standard. The `AgentIdentityBadge` component makes a real `eth_call` to the Mantle RPC to verify registration status. Zero address = demo mode with graceful fallback.

**On-chain decision logging** — Every AI trade recommendation is logged to Mantle via the `/api/mantle/log` endpoint. When `REALCLAW_API_KEY` is set, logs go to the RealClaw API and return a real transaction hash. Without the key, the endpoint operates in MVP mode with a mock hash — the app never breaks.

**Live DeFi data** — Pool data comes from Agni Finance and Merchant Moe subgraphs on `graph.mantle.xyz`, Lendle's REST API, and the mETH staking API. APY is calculated from actual 24h fee data (`poolDayData` / `lbPairDayData` subgraph fields), not a cumulative estimate. CoinGecko provides live MNT and mETH prices.

**Para wallet on Mantle** — Social login (Google, Twitter, Discord, email) → non-custodial wallet defaulting to Mantle chain ID 5000. No seed phrase. No private key management.

---

## What I'd build next

**Autonomous proposal queue** — The agent runs every 60s, scores all Mantle pools for yield opportunities, and queues trade proposals with reasoning. You wake up to "3 proposals pending" — approve, dismiss, or set auto-execute rules. This is the bridge from AI-assisted to AI-native DeFi management.

**Auto-execute position guards** — When a guard triggers, route the exit order through aomi automatically without requiring the user to be online. The infrastructure is already built (position guard service + aomi Session + Para signing). The only missing piece is the automated trigger → execution bridge.

**Cross-protocol arbitrage** — When the same token pair has meaningfully different APY on Agni vs Merchant Moe, surface the gap and route the rebalance. The data is already flowing from both subgraphs.
