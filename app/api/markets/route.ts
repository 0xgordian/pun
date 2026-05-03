import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/ratelimit';
import { fetchMantlePools } from '@/lib/services/mantleDeFiService';

const HISTORY_ENRICH_LIMIT = Number(process.env.MANTLE_MARKET_LIMIT ?? 60);

// Server-side cache — avoids re-fetching on every request
const SERVER_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
let serverCache: { data: ReturnType<typeof fetchMantlePools> extends Promise<infer T> ? T : never; timestamp: number } | null = null;

export async function GET(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('cf-connecting-ip')
    ?? 'unknown';

  if (!(await checkRateLimit('markets', clientIp, 60, 60))) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: 60 },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  // Serve from server cache if fresh
  if (serverCache && Date.now() - serverCache.timestamp < SERVER_CACHE_TTL_MS) {
    return NextResponse.json(serverCache.data, {
      headers: { 'X-Cache': 'HIT', 'Cache-Control': 'public, max-age=120' },
    });
  }

  try {
    const markets = await fetchMantlePools();
    if (!markets.length) {
      return NextResponse.json({ error: 'No markets returned' }, { status: 502 });
    }

    // Store in server cache
    serverCache = { data: markets, timestamp: Date.now() };

    return NextResponse.json(markets, {
      headers: { 'X-Cache': 'MISS', 'Cache-Control': 'public, max-age=120' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
