/**
 * Central configuration for Pun (Mantle Edition)
 * All environment variables in one place for easy access
 */

// aomi Backend
export const AOMI_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.aomi.dev';
export const AOMI_API_KEY = process.env.NEXT_PUBLIC_AOMI_API_KEY;
export const AOMI_APP_ID = process.env.NEXT_PUBLIC_AOMI_APP_ID || 'default';
export const AOMI_UPSTREAM_URL = process.env.AOMI_UPSTREAM_URL || 'https://api.aomi.dev';

// Wallet Connect
export const PARA_API_KEY = process.env.NEXT_PUBLIC_PARA_API_KEY;
export const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Analytics
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Mantle Network Configuration
export const MANTLE_CHAIN_ID = 5000;
export const MANTLE_RPC_URL = process.env.NEXT_PUBLIC_MANTLE_RPC_URL || 'https://rpc.mantle.xyz';
export const MANTLE_RPC_URLS = [
  process.env.NEXT_PUBLIC_MANTLE_RPC_URL || 'https://rpc.mantle.xyz',
  'https://mantle.drpc.org',
  'https://rpc.mantle.xyz',
];

// RealClaw API (Byreal AI Agent Platform for Mantle)
export const REALCLAW_API_URL = process.env.NEXT_PUBLIC_REALCLAW_API_URL || 'https://api.realclaw.xyz';
export const REALCLAW_API_KEY = process.env.REALCLAW_API_KEY || '';

// ERC-8004 Agent Identity
export const ERC8004_ENABLED = true;
export const ERC8004_CONTRACT = process.env.NEXT_PUBLIC_ERC8004_CONTRACT || '0x0000000000000000000000000000000000000000';

// Market Configuration (Mantle DeFi)
export const MANTLE_MARKET_LIMIT = parseInt(process.env.MANTLE_MARKET_LIMIT || '200');

// Feature Flags
export const ENABLE_LIVE_TRADING = Boolean(AOMI_API_KEY && PARA_API_KEY);
export const ENABLE_WALLET_CONNECT = Boolean(PARA_API_KEY);
export const ENABLE_MANTLE = true;

// App Info
export const APP_NAME = 'Pun';
export const APP_VERSION = '0.1.0';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pun.ai';