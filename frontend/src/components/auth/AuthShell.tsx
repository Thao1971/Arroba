'use client';
import { ReactNode } from 'react';
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/ds';
import { BrandPanel } from './BrandPanel';

/**
 * Two-column shell used by /login and /registro. Form on the left, brand
 * panel (with the animated globe, hidden on mobile — see BrandPanel) on the
 * right, matching the layout convention of dash.cloudflare.com/login. A
 * small ThemeSwitcher sits in the form column's corner.
 *
 * The real logo (the dotted-pixel “arroba” wordmark, transparent PNG)
 * lives here, above the form, at every breakpoint — not in BrandPanel.
 * `logo-white.png` (an opaque white rectangle, not a dark-background variant)
 * used to render as a jarring white box on the dark panel; removed there.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-bg text-text">
      <div className="relative flex flex-col items-center justify-center px-6 py-12 md:py-10 order-1">
        <div className="absolute top-5 right-5">
          <ThemeSwitcher />
        </div>
        <Link href="/" className="mb-8 flex items-center" data-testid="auth-logo">
          <img src="/brand/logo.png" alt="arroba.com" className="h-8 w-auto" />
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </div>
      <BrandPanel />
    </div>
  );
}
