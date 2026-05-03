import { NextResponse, type NextRequest } from 'next/server';
import { fetchMantlePools, type MantlePool } from '@/lib/services/mantleDeFiService';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  
  if (!id) {
    return NextResponse.json({ error: 'Missing market id' }, { status: 400 });
  }

  try {
    const pools = await fetchMantlePools();
    const pool = pools.find(p => p.id === id);
    
    if (!pool) {
      return NextResponse.json({ error: 'Pool not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: pool.id,
      question: pool.name,
      volume: pool.volume24h,
      tvl: pool.tvl,
      apy: pool.apy,
      token0: pool.token0,
      token1: pool.token1,
      protocol: pool.protocol,
      liquidity: pool.liquidity,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
