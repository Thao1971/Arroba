import { ReactNode } from 'react';
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/ds';
import { useTranslations } from 'next-intl';

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  // E0.2 placeholder: real auth gating arrives in E0.3+ once the backend exists.
  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <AuthHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}

function AuthHeader() {
  const t = useTranslations();
  return (
    <header className="sticky top-0 z-30 backdrop-blur border-b border-border bg-surface/85">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-display font-semibold text-lg flex items-center gap-2">
          <span className="text-primary">@</span>
          <span>arroba.com</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className="px-3 h-11 inline-flex items-center text-sm text-text-muted hover:text-text"
          >
            {t('nav.home')}
          </Link>
          <ThemeSwitcher />
        </nav>
      </div>
    </header>
  );
}
