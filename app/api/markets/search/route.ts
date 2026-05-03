import { NextResponse, type NextRequest } from 'next/server';
import { fetchMantlePools, type MantlePool } from '@/lib/services/mantleDeFiService';
import { checkRateLimit } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('cf-connecting-ip')
    ?? 'unknown';

  if (!(await checkRateLimit('search', clientIp, 60, 60))) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: 60 },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  const rawQ = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  const q = rawQ.replace(/[&=?#%]/g, '').slice(0, 200).trim();
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? '20'), 50);

  if (!q || q.length < 2) {
    return NextResponse.json({ error: 'Query too short' }, { status: 400 });
  }

  try {
    const pools = await fetchMantlePools();
    const qLower = q.toLowerCase();
    
    const filtered = pools.filter(p => 
      p.name.toLowerCase().includes(qLower) ||
      p.protocol.toLowerCase().includes(qLower) ||
      p.token0.toLowerCase().includes(qLower) ||
      p.token1.toLowerCase().includes(qLower)
    );

    const results = (filtered.length > 0 ? filtered : pools).slice(0, limit).map(p => ({
      question: p.name,
      slug: p.id,
      probability: `${p.apy}%`,
      change24h: p.oneDayPriceChange ? `${p.oneDayPriceChange > 0 ? '+' : ''}${p.oneDayPriceChange.toFixed(1)}pp` : null,
      volume: `$${(p.volume24h / 1000).toFixed(0)}K`,
      liquidity: `$${(p.liquidity / 1000).toFixed(0)}K`,
      protocol: p.protocol,
    }));

    return NextResponse.json({ query: q, count: results.length, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
