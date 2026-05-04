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
  { href: '/', label: 'Agent' },
  { href: '/trade', label: 'Trade' },
  { href: '/markets', label: 'Markets' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/execute', label: 'Execute' },
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
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        borderColor: 'rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="relative max-w-[1400px] mx-auto px-6 h-14 flex items-center gap-8">

        {/* LEFT — Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-base font-extrabold tracking-tight"
            style={{ color: '#ffffff', fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em' }}
          >
            Pun
          </span>
        </div>

        {/* CENTER — Nav links */}
        <nav className="hidden sm:flex items-center gap-1 flex-1 justify-center">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium px-3 py-1.5 rounded-md transition-all"
                style={{
                  color: active ? '#ffffff' : 'rgba(255,255,255,0.5)',
                  backgroundColor: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                  fontFamily: 'var(--font-sans)',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* RIGHT — Status + wallet */}
        <div className="ml-auto flex items-center gap-3 shrink-0">

          {/* Live status pill */}
          <div
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: isFallback ? '#f59e0b' : isLoadingMarkets ? '#666' : '#7c3aed',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: isFallback ? '#f59e0b' : isLoadingMarkets ? '#444' : '#7c3aed',
                boxShadow: !isFallback && !isLoadingMarkets ? '0 0 6px rgba(124,58,237,0.8)' : 'none',
              }}
            />
            {isLoadingMarkets ? 'Loading' : isFallback ? 'Fallback' : 'Live'}
          </div>

          {/* Wallet address */}
          {isWalletConnected && walletAddress && (
            onManageWallet ? (
              <button
                onClick={onManageWallet}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  backgroundColor: 'rgba(74,222,128,0.1)',
                  border: '1px solid rgba(74,222,128,0.2)',
                  color: '#4ade80',
                  fontFamily: 'var(--font-sans)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(74,222,128,0.18)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(74,222,128,0.1)'; }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4ade80' }} />
                {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
              </button>
            ) : (
              <span
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: 'rgba(74,222,128,0.1)',
                  border: '1px solid rgba(74,222,128,0.2)',
                  color: '#4ade80',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4ade80' }} />
                {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
              </span>
            )
          )}

          {rightSlot}

          {/* Connect Wallet CTA */}
          {onConnectWallet && !isWalletConnected && (
            <button
              onClick={onConnectWallet}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                fontFamily: 'var(--font-sans)',
                border: 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#8b5cf6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#7c3aed'; }}
            >
              Connect Wallet
            </button>
          )}

          {/* AI panel toggle */}
          {onToggleAI && (
            <button
              onClick={onToggleAI}
              title={aiPanelOpen ? 'Hide AI panel' : 'Show AI panel'}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                backgroundColor: aiPanelOpen ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${aiPanelOpen ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: aiPanelOpen ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                fontFamily: 'var(--font-sans)',
              }}
              onMouseEnter={(e) => {
                if (!aiPanelOpen) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                }
              }}
              onMouseLeave={(e) => {
                if (!aiPanelOpen) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                }
              }}
            >
              Agent
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            className="sm:hidden flex flex-col gap-1.5 p-2 items-center justify-center"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span className="w-5 h-[1.5px] rounded-full" style={{ backgroundColor: mobileMenuOpen ? '#7c3aed' : 'rgba(255,255,255,0.6)' }} />
            <span className="w-5 h-[1.5px] rounded-full" style={{ backgroundColor: mobileMenuOpen ? '#7c3aed' : 'rgba(255,255,255,0.6)' }} />
            <span className="w-5 h-[1.5px] rounded-full" style={{ backgroundColor: mobileMenuOpen ? '#7c3aed' : 'rgba(255,255,255,0.6)' }} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div
          className="sm:hidden border-t"
          style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#000000' }}
        >
          <div className="flex flex-col px-4 py-3 gap-1">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium px-3 py-2.5 rounded-lg flex items-center justify-between"
                  style={{
                    color: active ? '#ffffff' : 'rgba(255,255,255,0.6)',
                    backgroundColor: active ? 'rgba(124,58,237,0.12)' : 'transparent',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {link.label}
                  {active && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#7c3aed' }} />}
                </Link>
              );
            })}
          </div>

          {onConnectWallet && !isWalletConnected && (
            <div className="px-4 pb-4">
              <button
                onClick={() => { onConnectWallet(); setMobileMenuOpen(false); }}
                className="w-full py-3 rounded-full text-sm font-semibold"
                style={{ backgroundColor: '#7c3aed', color: '#ffffff', fontFamily: 'var(--font-sans)' }}
              >
                Connect Wallet
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
