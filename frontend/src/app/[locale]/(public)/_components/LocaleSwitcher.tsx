'use client';
import { useTransition } from 'react';
import { Globe } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';

export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = locale === 'es' ? 'en' : 'es';
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
    startTransition(() => router.refresh());
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-label={`Idioma actual: ${locale}`}
      className={cn(
        'inline-flex items-center gap-2 h-11 px-3 rounded-md',
        'bg-surface border border-border hover:border-border-strong',
        'text-text-muted hover:text-text transition-colors text-sm font-body',
        'focus-visible:shadow-focus disabled:opacity-60',
        className
      )}
    >
      <Globe size={16} strokeWidth={1.5} aria-hidden />
      <span className="uppercase">{locale}</span>
    </button>
  );
}
