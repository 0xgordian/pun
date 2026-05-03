import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/ratelimit';
import type { MantlePool } from '@/lib/services/mantleDeFiService';

// SSRF protection: only allow known aomi backend domains
const ALLOWED_HOSTS = ['api.aomi.dev', 'aomi.dev'];

const UPSTREAM_BASE_URL = (() => {
  const raw =
    process.env.AOMI_UPSTREAM_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_AOMI_BASE_URL ||
    'https://api.aomi.dev';
  try {
    const parsed = new URL(raw);
    if (!ALLOWED_HOSTS.some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`))) {
      console.error(`[aomi-proxy] Rejected upstream URL with disallowed host: ${parsed.hostname}. Falling back to api.aomi.dev`);
      return 'https://api.aomi.dev';
    }
    return raw;
  } catch {
    return 'https://api.aomi.dev';
  }
})();

// Wallet address validation — prevents prompt injection via wallet param
const ETH_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

function sanitizeWalletAddress(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  return ETH_ADDRESS_RE.test(trimmed) ? trimmed : undefined;
}

export const dynamic = 'force-dynamic';
const LIVE_CONTEXT_TIMEOUT_MS = Number(process.env.AOMI_LIVE_CONTEXT_TIMEOUT_MS ?? 2000);
const MAX_PROMPT_CHARS = Number(process.env.AOMI_SYSTEM_PROMPT_MAX_CHARS ?? 16000);

const MANTLE_SYSTEM_PROMPT = `## IMPORTANT: You are operating inside Pun

You are NOT a general blockchain assistant. You are the AI embedded in Pun — an AI-native Mantle DeFi trading terminal for active yield farmers and traders on Mantle Network (chain ID 5000).

### ABOUT MANTLE
- Mantle is a Layer-2 blockchain with chain ID 5000, using MNT as its native token
- Key protocols: Agni Finance (DEX), Merchant Moe (liquidity book DEX), Lendle (lending), Fluxion
- Key assets: MNT, mETH (Mantle staked ETH), USDY (Ondo yield-bearing USD), USDC, fBTC
- ERC-8004: Every AI agent on Mantle has an on-chain identity NFT — this agent's ID is "pun-ai-agent-001"

### ABSOLUTE RULES — NEVER BREAK THESE

**RULE 1: NEVER ask for wallet connection to simulate a yield strategy.**
Paper trading and yield simulation work WITHOUT a wallet. Always proceed with simulation when no wallet is connected.

**RULE 2: NEVER search the web or use external tools for pool data.**
All live Mantle DeFi pool data is injected below. Use it directly.

**RULE 3: NEVER claim a pool has "guaranteed" yield.**
APY figures are variable. You can say "the pool currently shows X% APY" but not "you will earn X%". Be honest about impermanent loss risk.

**RULE 4: When asked to recommend a yield strategy — evaluate first, then decide.**
Before returning a trade_card, check:
- Is the APY unusually high (>100%)? If yes, warn about potential impermanent loss or unsustainable incentives.
- Is TVL < $500K? If yes, warn about thin liquidity and exit risk.
- Is the pool a stablecoin pair (USDC/USDT/USDY)? If yes, note lower IL risk.
- Is the user asking about mETH? Note it's Mantle's liquid staking token with additional staking yield.

**RULE 5: When you DO recommend a strategy, return the trade_card JSON.**
Only return a trade_card when you have a genuine reason to recommend it.

### Trade Card JSON Format

Include this at the END of your response when recommending a yield strategy:

\`\`\`json
{
  "action": "trade_card",
  "market": "Exact pool name from the data below (e.g. mETH-USDC)",
  "side": "YES",
  "shares": 1000,
  "price": 45,
  "reasoning": "One specific, honest sentence on why this pool makes sense right now"
}
\`\`\`

The price field = APY percentage (e.g. if pool APY is 12.4%, price = 12).

### What good analysis looks like
- Reference specific numbers from the data (TVL, APY, 24h volume)
- Acknowledge impermanent loss risk for volatile pairs
- Compare APY to stablecoin alternatives when relevant
- Note execution conditions (TVL depth, protocol maturity) when relevant
- If the user asks about MNT price, note it's the native Mantle token

### Live Mantle DeFi Pool Data (use this — do not search externally)`;

// ─── Market context cache ─────────────────────────────────────────────────────
// 5 minutes — matches the /api/markets cache TTL.
let marketContextCache: { context: string; timestamp: number } | null = null;
const MARKET_CONTEXT_CACHE_MS = 5 * 60_000;

// Position cache: per-wallet, 30s TTL, max 500 entries
type PositionCacheEntry = { context: string; timestamp: number };
const positionCache = new Map<string, PositionCacheEntry>();
const POSITION_CACHE_MS = 30_000;
const POSITION_CACHE_MAX = 500;

// Request deduplication for market data
let marketFetchPromise: Promise<MantlePool[] | null> | null = null;

async function fetchLiveMarketContext(
  requestUrl: string,
  walletAddress?: string,
  tradeHistoryHeader?: string,
): Promise<string> {
  const now = Date.now();
  const cacheHit = marketContextCache && now - marketContextCache.timestamp < MARKET_CONTEXT_CACHE_MS;

  // Use cached market data (5 min TTL)
  if (cacheHit) {
    return marketContextCache!.context;
  }

  // Fetch fresh market data with deduplication
  let baseContext = '';

  async function fetchMarketsWithDedup(): Promise<MantlePool[] | null> {
    if (marketFetchPromise) return marketFetchPromise;
    marketFetchPromise = (async () => {
      const origin = new URL(requestUrl).origin;
      const res = await fetch(`${origin}/api/markets`, {
        signal: AbortSignal.timeout(LIVE_CONTEXT_TIMEOUT_MS),
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const data = await res.json() as MantlePool[];
      return Array.isArray(data) && data.length > 0 ? data : null;
    })();
    try {
      return await marketFetchPromise;
    } finally {
      marketFetchPromise = null;
    }
  }

  try {
    const data = await fetchMarketsWithDedup();
    if (data) {
      const top10 = [...data]
        .sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0))
        .slice(0, 10);

      const lines = top10.map((pool) => {
        const tvlStr = pool.tvl >= 1_000_000
          ? `$${(pool.tvl / 1_000_000).toFixed(1)}M`
          : `$${(pool.tvl / 1_000).toFixed(0)}K`;
        const volStr = pool.volume24h >= 1_000_000
          ? `$${(pool.volume24h / 1_000_000).toFixed(1)}M`
          : `$${(pool.volume24h / 1_000).toFixed(0)}K`;
        return `- ${pool.name} (${pool.protocol}) | TVL: ${tvlStr} | APY: ${pool.apy.toFixed(1)}% | Vol 24h: ${volStr}`;
      });

      baseContext = `\n\n### Live Mantle DeFi Pool Data (${new Date().toUTCString()})\n`;
      baseContext += `**Top pools by TVL:**\n${lines.join('\n')}`;
      baseContext += '\n\nThis is real-time data from Agni Finance and Merchant Moe. Use it to answer questions about current yields and liquidity.';

      marketContextCache = { context: baseContext, timestamp: now };
    }
  } catch {
    // Fall through
  }

  // Suppress unused variable warnings — these params are reserved for future use
  void walletAddress;
  void tradeHistoryHeader;

  return baseContext;
}

// ─── Prompt injection helpers ─────────────────────────────────────────────────

function trimPrompt(input: string): string {
  if (input.length <= MAX_PROMPT_CHARS) return input;
  return `${input.slice(0, MAX_PROMPT_CHARS)}\n\n[Truncated live context to stay within request size budget.]`;
}

function isChatMessageRequest(path: string[], method: string): boolean {
  if (method !== 'POST') return false;
  const joined = path.join('/');
  return joined.includes('messages') || joined.includes('chat') || joined.includes('threads');
}

function injectSystemPromptIntoUrl(url: URL, prompt: string): URL {
  if (!url.searchParams.has('system') && !url.searchParams.has('context')) {
    url.searchParams.set('system', prompt);
  } else if (url.searchParams.has('system')) {
    const existing = url.searchParams.get('system') ?? '';
    url.searchParams.set('system', `${prompt}\n\n${existing}`);
  }
  return url;
}

function injectSystemPromptIntoBody(body: string, prompt: string): string {
  if (!body) return body;
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    if (Array.isArray(parsed.messages)) {
      parsed.messages = (parsed.messages as Array<{ role: string; content: string }>)
        .filter((m) => m.role !== 'system');
      parsed.system = parsed.system ? `${prompt}\n\n${parsed.system}` : prompt;
      return JSON.stringify(parsed);
    }
    if ('system' in parsed) {
      parsed.system = parsed.system ? `${prompt}\n\n${parsed.system}` : prompt;
      return JSON.stringify(parsed);
    }
    if ('context' in parsed) {
      parsed.context = parsed.context ? `${prompt}\n\n${parsed.context}` : prompt;
      return JSON.stringify(parsed);
    }
    parsed.system = prompt;
    return JSON.stringify(parsed);
  } catch {
    return body;
  }
}

// ─── Proxy core ───────────────────────────────────────────────────────────────

function buildUpstreamUrl(request: NextRequest, path: string[]) {
  const upstream = new URL(path.join('/'), `${UPSTREAM_BASE_URL.replace(/\/+$/, '')}/`);
  upstream.search = request.nextUrl.search;
  return upstream;
}

function copyRequestHeaders(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length');
  return headers;
}

function copyResponseHeaders(headers: Headers) {
  const nextHeaders = new Headers(headers);
  nextHeaders.delete('content-length');
  nextHeaders.delete('content-encoding');
  return nextHeaders;
}

async function proxy(request: NextRequest, path: string[]) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('cf-connecting-ip') ??
    'unknown';

  if (!(await checkRateLimit('aomi', clientIp, 30, 60))) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: 60 },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  let upstreamUrl = buildUpstreamUrl(request, path);
  const canHaveBody = request.method !== 'GET' && request.method !== 'HEAD';
  let requestBody = canHaveBody ? await request.text() : '';

  if (requestBody.length > 20000) {
    return NextResponse.json(
      { error: 'Request too large', max: 20000, received: requestBody.length },
      { status: 413 }
    );
  }

  if (isChatMessageRequest(path, request.method)) {
    const rawWallet =
      request.nextUrl.searchParams.get('wallet') ??
      request.headers.get('x-wallet-address') ??
      undefined;
    const walletAddress = sanitizeWalletAddress(rawWallet);
    const tradeHistoryHeader =
      request.nextUrl.searchParams.get('th') ??
      request.headers.get('x-trade-history') ??
      undefined;

    // Evict positionCache if over max size
    if (positionCache.size > POSITION_CACHE_MAX) {
      const oldest = [...positionCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      if (oldest) positionCache.delete(oldest[0]);
    }

    const liveContext = await fetchLiveMarketContext(request.url, walletAddress, tradeHistoryHeader);
    const fullPrompt = trimPrompt(MANTLE_SYSTEM_PROMPT + liveContext);

    if (requestBody.length > 0) {
      requestBody = injectSystemPromptIntoBody(requestBody, fullPrompt);
    } else {
      upstreamUrl = injectSystemPromptIntoUrl(upstreamUrl, fullPrompt);
    }
  }

  const hasBody = requestBody.length > 0;

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers: copyRequestHeaders(request),
      body: hasBody ? requestBody : undefined,
      ...(hasBody ? { duplex: 'half' as const } : {}),
      redirect: 'manual',
      cache: 'no-store',
    });

    // Swallow 404s — non-critical endpoints (state sync, session mgmt) when no API key
    if (upstreamResponse.status === 404) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: copyResponseHeaders(upstreamResponse.headers),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown upstream proxy error';
    return NextResponse.json(
      { error: 'Aomi upstream request failed', message },
      { status: 502 },
    );
  }
}

// ─── Route handlers ───────────────────────────────────────────────────────────

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}
export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}
export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}
export async function OPTIONS(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}
