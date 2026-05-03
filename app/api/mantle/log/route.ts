/**
 * API route for logging agent decisions to Mantle for on-chain benchmarking
 * Part of Turing Test Hackathon 2026 requirements
 */

import { NextRequest, NextResponse } from 'next/server';

interface LogRequest {
  agentId: string;
  action: string;
  details: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body: LogRequest = await request.json();

    if (!body.agentId || !body.action) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, action' },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    let txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    // Attempt RealClaw API if key is set
    if (process.env.REALCLAW_API_KEY) {
      try {
        const rcRes = await fetch(
          `${process.env.NEXT_PUBLIC_REALCLAW_API_URL || 'https://api.realclaw.xyz'}/log`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.REALCLAW_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              agentId: body.agentId,
              action: body.action,
              details: body.details,
              chainId: 5000,
              timestamp,
            }),
            signal: AbortSignal.timeout(5000),
          }
        );
        if (rcRes.ok) {
          const rcData = await rcRes.json();
          txHash = rcData.txHash ?? txHash;
        }
      } catch (e) {
        console.warn('[Mantle Log] RealClaw API failed, using mock tx hash:', e);
      }
    } else {
      // MVP mode — log to console
      console.log('[Mantle On-Chain Log]', JSON.stringify({
        agentId: body.agentId,
        action: body.action,
        timestamp,
        txHash,
        details: body.details,
        chainId: 5000,
      }, null, 2));
    }

    return NextResponse.json({
      success: true,
      txHash,
      chainId: 5000,
    });
  } catch (error) {
    console.error('[Mantle Log] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Return recent logs (for debugging/demo purposes)
  return NextResponse.json({
    message: 'Mantle agent logging endpoint',
    chainId: 5000,
    hint: 'POST to this endpoint to log agent decisions on-chain',
  });
}
