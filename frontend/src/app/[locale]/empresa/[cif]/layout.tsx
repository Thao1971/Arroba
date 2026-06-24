'use client';
/**
 * `/empresa/[cif]` layout — mixed-access (anonymous + authenticated).
 *
 * Lives OUTSIDE the `(authenticated)` and `(public)` route groups so that
 * neither `RequireAuth` nor the public navigation is forced on this entity
 * page. We instead render:
 *   - a slim header with brand + locale + theme switcher + login/register
 *     CTAs when anonymous, or user menu when authenticated;
 *   - the CopilotProvider + dock so the Company Advisor is reachable.
 *
 * Following `localePrefix: 'never'` from next-intl, this lives at
 * `/empresa/{cif}` without any locale prefix.
 */
import Link from 'next/link';
import { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { CopilotProvider, CopilotDock } from '@/components/copilot';
import { ThemeSwitcher } from '@/components/ds';
import { useAuth } from '@/contexts/auth-context';

export default function CompanyEntityLayout({ children }: { children: ReactNode }) {
  return (
    <CopilotProvider>
      <div className="min-h-screen flex flex-col bg-bg text-text">
        <EntityHeader />
        <main className="flex-1">
          <div className="max-w-6xl mx-auto px-6 py-10 md:py-14">{children}</div>
        </main>
        <CopilotDock />
      </div>
    </CopilotProvider>
  );
}

function EntityHeader() {
  const t = useTranslations();
  const { isAuthenticated, user } = useAuth();
  return (
    <header
      data-testid="entity-header"
      className="sticky top-0 z-30 backdrop-blur border-b border-border bg-surface/85"
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="font-display font-semibold text-lg flex items-center gap-2"
          data-testid="entity-header-logo"
        >
          <span className="text-primary">@</span>
          <span>arroba.com</span>
        </Link>
        <nav className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Link
                href="/historial"
                data-testid="entity-header-history"
                className="px-3 h-10 inline-flex items-center text-sm text-text-muted hover:text-text"
              >
                Historial
              </Link>
              <span
                data-testid="entity-header-user"
                className="px-3 h-10 inline-flex items-center text-sm text-text"
              >
                {user?.email || 'Cuenta'}
              </span>
            </>
          ) : (
            <>
              <Link
                href="/login"
                data-testid="entity-header-login"
                className="px-3 h-10 inline-flex items-center text-sm text-text-muted hover:text-text"
              >
                {t('nav.login')}
              </Link>
              <Link
                href="/registro"
                data-testid="entity-header-register"
                className="hidden sm:inline-flex px-3 h-10 items-center rounded-md bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
              >
                {t('nav.register')}
              </Link>
            </>
          )}
          <ThemeSwitcher />
        </nav>
      </div>
    </header>
  );
}
