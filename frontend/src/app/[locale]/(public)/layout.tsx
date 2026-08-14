import { ReactNode } from 'react';
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/ds';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from './_components/LocaleSwitcher';

// HARDENING-REQ002 · fix mount duplicado del Copilot (2026-08-14).
// El root layout `[locale]/layout.tsx` ya provee `<CopilotProvider>` +
// `<CopilotDock/>` globalmente. Volver a montarlos aquí creaba dos
// contextos anidados y dos `data-testid="composer"` en el DOM. El route
// group `(public)` NO debe volver a montar Copilot — sólo el chrome
// (`PublicHeader`) es exclusivo de estas rutas.

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <PublicHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}

function PublicHeader() {
  const t = useTranslations();
  return (
    <header
      data-testid="public-header"
      className="sticky top-0 z-30 backdrop-blur border-b border-border bg-surface/85"
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="font-display font-semibold text-lg flex items-center gap-2"
          data-testid="public-header-logo"
        >
          <span className="text-primary">@</span>
          <span>arroba.com</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            data-testid="public-header-login"
            className="px-3 h-10 inline-flex items-center text-sm text-text-muted hover:text-text"
          >
            {t('nav.login')}
          </Link>
          <Link
            href="/registro"
            data-testid="public-header-register"
            className="hidden sm:inline-flex px-3 h-10 items-center rounded-md bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            {t('nav.register')}
          </Link>
          <LocaleSwitcher />
          <ThemeSwitcher />
        </nav>
      </div>
    </header>
  );
}
