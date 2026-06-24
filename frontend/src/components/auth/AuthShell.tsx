'use client';
import { ReactNode } from 'react';
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/ds';
import { BrandPanel } from './BrandPanel';

/**
 * Two-column shell used by /login and /registro. Brand panel on the left
 * (hidden on mobile, see BrandPanel), form on the right with a small
 * ThemeSwitcher in the corner.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-bg text-text">
      <BrandPanel />
      <div className="relative flex flex-col items-center justify-center px-6 py-12 md:py-10">
        <div className="absolute top-5 right-5">
          <ThemeSwitcher />
        </div>
        <Link
          href="/"
          className="md:hidden mb-8 font-display font-semibold text-lg flex items-center gap-2"
          data-testid="auth-mobile-logo"
        >
          <span className="text-primary">@</span>
          <span>arroba.com</span>
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
