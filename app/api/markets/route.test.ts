import { describe, it, expect, afterEach, vi } from 'vitest';
import { GET } from './route';

vi.mock('@/lib/services/mantleDeFiService', () => ({
  fetchMantlePools: vi.fn().mockResolvedValue([
    {
      id: 'agni-meth-usdc',
      protocol: 'agni-finance',
      name: 'mETH-USDC',
      tvl: 12500000,
      apy: 12.4,
      token0: 'mETH',
      token1: 'USDC',
      liquidity: 8500000,
      volume24h: 3200000,
      contractAddress: '0x319B69888b0d11cEC22caA5034e25FfFBDc88421',
      oneDayPriceChange: null,
    },
    {
      id: 'mo-mnt-usdc',
      protocol: 'merchant-moe',
      name: 'MNT-USDC',
      tvl: 8500000,
      apy: 8.7,
      token0: 'MNT',
      token1: 'USDC',
      liquidity: 5200000,
      volume24h: 1800000,
      contractAddress: '0x013e138EF6008ae5FDFDE29700e3f2Bc61d21E3a',
      oneDayPriceChange: null,
    },
  ]),
}));

describe('/api/markets route', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns Mantle pools when fetchMantlePools succeeds', async () => {
    const mockRequest = new Request('http://localhost/api/markets', {
      headers: { 'x-forwarded-for': '127.0.0.1' },
    });

    const response = await GET(mockRequest as unknown as Parameters<typeof GET>[0]);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBeGreaterThan(0);
    expect(json[0]).toHaveProperty('protocol');
    expect(json[0]).toHaveProperty('tvl');
    expect(json[0]).toHaveProperty('apy');
  });

  it('returns pool with correct shape', async () => {
    const mockRequest = new Request('http://localhost/api/markets', {
      headers: { 'x-forwarded-for': '127.0.0.1' },
    });

    const response = await GET(mockRequest as unknown as Parameters<typeof GET>[0]);
    const json = await response.json();

    const pool = json[0];
    expect(pool.id).toBe('agni-meth-usdc');
    expect(pool.name).toBe('mETH-USDC');
    expect(pool.apy).toBe(12.4);
    expect(pool.tvl).toBe(12500000);
  });
});
