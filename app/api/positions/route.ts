import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/ratelimit';

/**
 * Mantle wallet token balance endpoint.
 * Fetches ERC-20 token balances for key Mantle ecosystem tokens via Mantle RPC.
 * Rate limited to 60/min per IP.
 */
export const dynamic = 'force-dynamic';

const ETH_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const MANTLE_RPC = process.env.NEXT_PUBLIC_MANTLE_RPC_URL || 'https://rpc.mantle.xyz';

// Key Mantle ecosystem tokens
const MANTLE_TOKENS = [
  { symbol: 'MNT',  address: '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8', decimals: 18 },
  { symbol: 'mETH', address: '0xcDA86A272531e8640cD7F1a92c01839911B90bb0', decimals: 18 },
  { symbol: 'USDC', address: '0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9', decimals: 6  },
  { symbol: 'USDT', address: '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE', decimals: 6  },
  { symbol: 'USDY', address: '0x5bE26527e817998A7206475496fDE1E68957c5A6', decimals: 18 },
  { symbol: 'WMNT', address: '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8', decimals: 18 },
];

// ERC-20 balanceOf(address) selector
const BALANCE_OF_SELECTOR = '0x70a08231';

function encodeBalanceOf(walletAddress: string): string {
  const addr = walletAddress.toLowerCase().replace('0x', '').padStart(64, '0');
  return `${BALANCE_OF_SELECTOR}${addr}`;
}

async function fetchTokenBalance(
  tokenAddress: string,
  walletAddress: string,
  decimals: number,
): Promise<number> {
  try {
    const res = await fetch(MANTLE_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to: tokenAddress, data: encodeBalanceOf(walletAddress) }, 'latest'],
        id: 1,
      }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return 0;
    const data = await res.json();
    if (!data.result || data.result === '0x') return 0;
    const raw = BigInt(data.result);
    return Number(raw) / Math.pow(10, decimals);
  } catch {
    return 0;
  }
}

// Fetch MNT native balance
async function fetchNativeBalance(walletAddress: string): Promise<number> {
  try {
    const res = await fetch(MANTLE_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [walletAddress, 'latest'],
        id: 1,
      }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return 0;
    const data = await res.json();
    if (!data.result || data.result === '0x') return 0;
    return Number(BigInt(data.result)) / 1e18;
  } catch {
    return 0;
  }
}

// Static price fallback (updated by CoinGecko in mantleDeFiService)
const FALLBACK_PRICES: Record<string, number> = {
  MNT: 0.85, mETH: 3200, USDC: 1.0, USDT: 1.0, USDY: 1.0, WMNT: 0.85,
};

export async function GET(request: NextRequest) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('cf-connecting-ip') ??
    'unknown';

  if (!(await checkRateLimit('positions', clientIp, 60, 60))) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: 60 },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  const wallet = request.nextUrl.searchParams.get('wallet')?.trim();
  if (!wallet) {
    return NextResponse.json({ error: 'Missing wallet param' }, { status: 400 });
  }
  if (!ETH_ADDRESS_RE.test(wallet)) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  try {
    // Fetch native MNT + all ERC-20 balances in parallel
    const [nativeMNT, ...tokenBalances] = await Promise.all([
      fetchNativeBalance(wallet),
      ...MANTLE_TOKENS.map((t) => fetchTokenBalance(t.address, wallet, t.decimals)),
    ]);

    const positions = [];

    // Native MNT
    if (nativeMNT > 0.001) {
      const price = FALLBACK_PRICES['MNT'] ?? 0;
      positions.push({
        market_id: 'native-mnt',
        question: 'MNT — Mantle Native Token',
        outcome: 'HOLD',
        size: nativeMNT,
        avg_price: price,
        current_price: price,
        pnl: 0,
        pnl_pct: 0,
        symbol: 'MNT',
        usdValue: nativeMNT * price,
      });
    }

    // ERC-20 tokens
    MANTLE_TOKENS.forEach((token, i) => {
      const balance = tokenBalances[i] ?? 0;
      if (balance > 0.001) {
        const price = FALLBACK_PRICES[token.symbol] ?? 0;
        positions.push({
          market_id: `token-${token.symbol.toLowerCase()}`,
          question: `${token.symbol} — Mantle Ecosystem Token`,
          outcome: 'HOLD',
          size: balance,
          avg_price: price,
          current_price: price,
          pnl: 0,
          pnl_pct: 0,
          symbol: token.symbol,
          usdValue: balance * price,
        });
      }
    });

    return NextResponse.json(positions, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
