'use client';
/**
 * CompanyTopbar (F0.1b · layout container · sin COMP-ID).
 * Reproduce fielmente el `<nav>` del ZIP (ce-app.jsx · line 6-24):
 *   - sticky top:0 z:300
 *   - backdrop-filter: blur(14px)
 *   - background: color-mix(in srgb, var(--bg) 88%, transparent)
 *   - border-bottom: 1px solid var(--border)
 *   - height: 72px
 *   - logo img h=55, menu horizontal Analiza/Valora/Compra-Vende
 *   - dark toggle 34x34, avatar 32x32
 */
import Link from 'next/link';
import { Moon } from 'lucide-react';

export function CompanyTopbar() {
  return (
    <nav
      data-testid="ficha-topbar"
      className="sticky top-0 z-[300] backdrop-blur-[14px] border-b border-black/[0.08]"
      style={{
        background: 'color-mix(in srgb, var(--surface-primary, #F7F5F0) 88%, transparent)',
      }}
    >
      <div
        className="mx-auto flex items-center gap-4"
        style={{
          maxWidth: 'min(1760px, 95vw)',
          padding: '13px 28px',
          minHeight: '72px',
        }}
      >
        <Link
          href="/"
          className="flex items-center"
          data-testid="ficha-topbar-logo"
          aria-label="arroba"
        >
          <img
            src="/logo-arroba.svg"
            alt="arroba"
            style={{ height: '55px', filter: 'none' }}
            onError={(e) => {
              // Fallback textual si el SVG no existe
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <span className="font-display font-black text-h4 text-[#E8001D]">arroba</span>
        </Link>

        <div className="flex" style={{ gap: '4px', marginLeft: '32px' }}>
          <Link
            href="/analiza"
            data-testid="topbar-menu-analiza"
            className="rounded-[8px] no-underline"
            style={{
              fontSize: '13.5px',
              fontWeight: 700,
              color: 'var(--text-primary, #101010)',
              padding: '7px 13px',
            }}
          >
            Analiza
          </Link>
          <Link
            href="/valora"
            data-testid="topbar-menu-valora"
            className="rounded-[8px] no-underline"
            style={{
              fontSize: '13.5px',
              fontWeight: 500,
              color: 'var(--text-secondary, #6B6B6B)',
              padding: '7px 13px',
            }}
          >
            Valora
          </Link>
          <Link
            href="/compra-vende"
            data-testid="topbar-menu-compra-vende"
            className="rounded-[8px] no-underline"
            style={{
              fontSize: '13.5px',
              fontWeight: 500,
              color: 'var(--text-secondary, #6B6B6B)',
              padding: '7px 13px',
            }}
          >
            Compra-Vende
          </Link>
        </div>

        <div className="flex-1" />

        <button
          type="button"
          data-testid="topbar-theme-toggle"
          aria-label="Cambiar tema"
          className="flex items-center justify-center rounded-[8px] border"
          style={{
            width: '34px',
            height: '34px',
            borderColor: 'var(--border-default, rgba(0,0,0,0.08))',
            background: 'var(--surface-elevated, #FFFFFF)',
            color: 'var(--text-primary, #101010)',
          }}
        >
          <Moon size={15} strokeWidth={1.8} />
        </button>

        <div
          data-testid="topbar-avatar"
          className="flex items-center justify-center font-semibold"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#E8001D',
            color: '#FFFFFF',
            fontSize: '12px',
          }}
          aria-label="Perfil"
        >
          AM
        </div>
      </div>
    </nav>
  );
}
