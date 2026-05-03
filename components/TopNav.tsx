'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface TopNavProps {
  isFallback?: boolean;
  isLoadingMarkets?: boolean;
  liveModeLabel?: string;
  isWalletConnected?: boolean;
  walletAddress?: string | null;
  rightSlot?: React.ReactNode;
  onToggleAI?: () => void;
  aiPanelOpen?: boolean;
  onConnectWallet?: () => void;
  onManageWallet?: () => void;
}

const NAV_LINKS = [
  { href: '/', label: 'AGENT' },
  { href: '/trade', label: 'TRADE' },
  { href: '/markets', label: 'MARKETS' },
  { href: '/portfolio', label: 'PORTFOLIO' },
  { href: '/execute', label: 'EXECUTE' },
];

export default function TopNav({
  isFallback = false,
  isLoadingMarkets = false,
  liveModeLabel = 'Paper Mode',
  isWalletConnected = false,
  walletAddress,
  rightSlot,
  onToggleAI,
  aiPanelOpen = true,
  onConnectWallet,
  onManageWallet,
}: TopNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        backgroundColor: '#000000',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="relative max-w-[1400px] mx-auto px-6 h-14 flex items-center gap-8">

        {/* LEFT — Logo: bold, white, tight tracking like Kiro */}
        <div className="flex items-center shrink-0">
          <span
            style={{
              color: '#ffffff',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: '18px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}
          >
            Pun
          </span>
        </div>

        {/* CENTER — Nav: ALL CAPS, small, medium weight, spaced out like Kiro */}
        <nav className="hidden sm:flex items-center gap-1 flex-1 justify-center">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: active ? '#ffffff' : 'rgba(255,255,255,0.5)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                  transition: 'color 0.15s ease, background-color 0.15s ease',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)';
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)';
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* RIGHT */}
        <div className="ml-auto flex items-center gap-2 shrink-0">

          {/* Live status pill */}
          <div
            className="hidden md:flex items-center gap-1.5"
            style={{
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: '12px',
              fontWeight: 500,
              color: isFallback ? '#f59e0b' : isLoadingMarkets ? '#555' : '#7c3aed',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '9999px',
                backgroundColor: isFallback ? '#f59e0b' : isLoadingMarkets ? '#444' : '#7c3aed',
                boxShadow: !isFallback && !isLoadingMarkets ? '0 0 6px rgba(124,58,237,0.8)' : 'none',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            {isLoadingMarkets ? 'Loading' : isFallback ? 'Fallback' : 'Live'}
          </div>

          {/* Wallet address — green pill */}
          {isWalletConnected && walletAddress && (
            onManageWallet ? (
              <button
                onClick={onManageWallet}
                className="hidden sm:flex items-center gap-1.5"
                style={{
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(74,222,128,0.1)',
                  border: '1px solid rgba(74,222,128,0.25)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#4ade80',
                  cursor: 'pointer',
                  background: 'none',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(74,222,128,0.18)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(74,222,128,0.1)'; }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '9999px', backgroundColor: '#4ade80', display: 'inline-block' }} />
                {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
              </button>
            ) : (
              <span
                className="hidden sm:flex items-center gap-1.5"
                style={{
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(74,222,128,0.1)',
                  border: '1px solid rgba(74,222,128,0.25)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#4ade80',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '9999px', backgroundColor: '#4ade80', display: 'inline-block' }} />
                {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
              </span>
            )
          )}

          {rightSlot}

          {/* AI panel toggle */}
          {onToggleAI && (
            <button
              onClick={onToggleAI}
              title={aiPanelOpen ? 'Hide AI panel' : 'Show AI panel'}
              className="hidden sm:flex items-center gap-1.5"
              style={{
                padding: '6px 12px',
                borderRadius: '9999px',
                backgroundColor: aiPanelOpen ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${aiPanelOpen ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.1)'}`,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: aiPanelOpen ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!aiPanelOpen) {
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)';
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!aiPanelOpen) {
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)';
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)';
                }
              }}
            >
              AGENT
            </button>
          )}

          {/* Connect Wallet — Kiro-style pill button, purple fill */}
          {onConnectWallet && !isWalletConnected && (
            <button
              onClick={onConnectWallet}
              className="hidden sm:flex items-center"
              style={{
                padding: '8px 18px',
                borderRadius: '9999px',
                backgroundColor: '#7c3aed',
                border: 'none',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.02em',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#8b5cf6'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#7c3aed'; }}
            >
              CONNECT
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            className="sm:hidden flex flex-col gap-1.5 p-2 items-center justify-center"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span style={{ width: 20, height: 1.5, backgroundColor: mobileMenuOpen ? '#7c3aed' : 'rgba(255,255,255,0.6)', borderRadius: 2, display: 'block' }} />
            <span style={{ width: 20, height: 1.5, backgroundColor: mobileMenuOpen ? '#7c3aed' : 'rgba(255,255,255,0.6)', borderRadius: 2, display: 'block' }} />
            <span style={{ width: 20, height: 1.5, backgroundColor: mobileMenuOpen ? '#7c3aed' : 'rgba(255,255,255,0.6)', borderRadius: 2, display: 'block' }} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: '#000000',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    color: active ? '#ffffff' : 'rgba(255,255,255,0.6)',
                    backgroundColor: active ? 'rgba(124,58,237,0.12)' : 'transparent',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  {link.label}
                  {active && <span style={{ width: 6, height: 6, borderRadius: '9999px', backgroundColor: '#7c3aed', display: 'inline-block' }} />}
                </Link>
              );
            })}
          </div>
          {onConnectWallet && !isWalletConnected && (
            <div style={{ padding: '0 16px 16px' }}>
              <button
                onClick={() => { onConnectWallet(); setMobileMenuOpen(false); }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '9999px',
                  backgroundColor: '#7c3aed',
                  border: 'none',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#ffffff',
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                }}
              >
                CONNECT WALLET
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
