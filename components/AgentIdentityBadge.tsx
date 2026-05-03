'use client';

import { useState, useEffect } from 'react';

interface AgentIdentityBadgeProps {
  agentId: string;
}

export function AgentIdentityBadge({ agentId }: AgentIdentityBadgeProps) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkRegistration() {
      const contractAddr = process.env.NEXT_PUBLIC_ERC8004_CONTRACT;
      const rpcUrl = process.env.NEXT_PUBLIC_MANTLE_RPC_URL || 'https://rpc.mantle.xyz';

      // Zero address or missing → demo mode
      if (!contractAddr || contractAddr === '0x0000000000000000000000000000000000000000') {
        setIsRegistered(true);
        setIsDemoMode(true);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [{ to: contractAddr, data: '0x70a08231000000000000000000000000' + agentId.replace('0x', '').padStart(40, '0') }, 'latest'],
            id: 1,
          }),
          signal: AbortSignal.timeout(3000),
        });
        const data = await response.json();
        // If result is non-zero, agent is registered
        setIsRegistered(data.result && data.result !== '0x' && data.result !== '0x0000000000000000000000000000000000000000000000000000000000000000');
      } catch {
        // Fail open — don't block UI on RPC errors
        setIsRegistered(true);
      }
      setLoading(false);
    }

    if (agentId) {
      checkRegistration();
    }
  }, [agentId]);

  if (loading) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 8px',
          backgroundColor: '#111',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: '#555',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        <span style={{ opacity: 0.6 }}>ERC-8004...</span>
      </div>
    );
  }

  if (isDemoMode) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 8px',
          backgroundColor: 'rgba(124,58,237,0.1)',
          border: '1px solid rgba(124,58,237,0.4)',
          borderRadius: 12,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: '#7c3aed',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        <span style={{ width: 6, height: 6, backgroundColor: '#7c3aed', flexShrink: 0 }} />
        ERC-8004: Demo
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 8px',
          backgroundColor: 'rgba(124,58,237,0.1)',
          border: '1px solid rgba(124,58,237,0.4)',
          borderRadius: 12,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: '#7c3aed',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        <span style={{ width: 6, height: 6, backgroundColor: '#7c3aed', flexShrink: 0 }} />
        ERC-8004: Pending
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 8px',
        backgroundColor: 'rgba(74,222,128,0.08)',
        border: '1px solid rgba(74,222,128,0.3)',
        borderRadius: 12,
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        color: '#4ade80',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}
    >
      <span style={{ width: 6, height: 6, backgroundColor: '#4ade80', flexShrink: 0 }} />
      ERC-8004: {agentId.slice(0, 8)}
    </div>
  );
}
