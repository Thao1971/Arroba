import { ReactNode } from 'react';
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/ds';
import { useTranslations } from 'next-intl';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 text-xs text-text-subtle font-body flex justify-between">
          <span>© {new Date().getFullYear()} arroba.com</span>
          <span>Etapa 0 · Foundation</span>
        </div>
      </footer>
    </div>
  );
}

function PublicHeader() {
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
            href="/design-system"
            className="px-3 h-11 inline-flex items-center text-sm text-text-muted hover:text-text"
          >
            {t('nav.designSystem')}
          </Link>
          <LocaleSwitcherInline />
          <ThemeSwitcher />
        </nav>
      </div>
    </header>
  );
}

function LocaleSwitcherInline() {
  return (
    <form action="/api/locale-switch" method="post" className="hidden" />
  );
}
