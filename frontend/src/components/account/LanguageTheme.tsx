'use client';
/**
 * COMP-14005 — Language & Theme (ver ACC_CUENTA_v0.1.md).
 * Reutiliza el mecanismo ya existente en Sidebar.tsx (cookie NEXT_LOCALE +
 * ThemeSwitcher/useTheme con [data-dark]) en vez de reimplementarlo —
 * BR-14005-001/002 y la nota de Dependencias del componente.
 */
import { useTransition } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import { Card, ThemeSwitcher } from '@/components/ds';
import { useTheme } from '@/lib/theme';

export function LanguageTheme() {
  const locale = useLocale();
  const router = useRouter();
  const { theme } = useTheme();
  const [, startTransition] = useTransition();

  function toggleLocale() {
    const next = locale === 'es' ? 'en' : 'es';
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
    startTransition(() => router.refresh());
  }

  return (
    <Card data-testid="language-theme" header="Idioma y apariencia">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-text">Idioma</p>
            <p className="text-xs text-text-subtle">Cambia el idioma de toda la plataforma.</p>
          </div>
          <button
            type="button"
            onClick={toggleLocale}
            data-testid="language-theme-locale-toggle"
            className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-border bg-surface text-text-muted hover:bg-surface-2 hover:text-text font-mono text-xs font-bold uppercase transition-colors"
          >
            <Globe size={14} strokeWidth={1.6} />
            {locale}
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
          <div>
            <p className="text-sm text-text">Tema</p>
            <p className="text-xs text-text-subtle">
              {theme === 'dark' ? 'Oscuro' : 'Claro'} — se recuerda en este navegador.
            </p>
          </div>
          <ThemeSwitcher />
        </div>
      </div>
    </Card>
  );
}
