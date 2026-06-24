'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * CTABlock — Configurable. Renders a centered card with title, body and one
 * or two action buttons (primary + secondary). Use at the end of long pages
 * to drive conversion.
 *
 * Static-only (no data states).
 */
export interface CTAAction {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
  testId?: string;
}

export interface CTABlockProps {
  title: string;
  body?: string;
  actions: CTAAction[];
  tone?: 'light' | 'dark';
  className?: string;
  testId?: string;
}

export function CTABlock({
  title,
  body,
  actions,
  tone = 'dark',
  className,
  testId = 'block-cta',
}: CTABlockProps) {
  const dark = tone === 'dark';
  return (
    <section
      data-testid={testId}
      className={cn(
        'rounded-2xl px-8 py-12 md:px-14 md:py-16 text-center',
        dark ? 'text-white' : 'border border-border bg-surface text-text',
        className
      )}
      style={dark ? { background: '#0C0C0E' } : undefined}
    >
      <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight max-w-2xl mx-auto">
        {title}
      </h2>
      {body && (
        <p
          className={cn(
            'mt-5 max-w-xl mx-auto text-base md:text-lg leading-relaxed',
            dark ? 'text-white/70' : 'text-text-muted'
          )}
        >
          {body}
        </p>
      )}
      <div className="mt-8 flex justify-center gap-3 flex-wrap">
        {actions.map((a) => (
          <ActionButton key={a.href} action={a} dark={dark} />
        ))}
      </div>
    </section>
  );
}

function ActionButton({ action, dark }: { action: CTAAction; dark: boolean }) {
  const isPrimary = action.variant !== 'secondary';
  const base =
    'inline-flex items-center gap-2 h-12 px-5 rounded-[12px] font-body text-sm font-bold transition-colors';
  const primary = 'bg-primary text-white hover:bg-primary-hover';
  const secondaryLight =
    'border-[1.5px] border-border-strong bg-surface text-text hover:bg-surface-2';
  const secondaryDark =
    'border-[1.5px] border-white/30 bg-transparent text-white hover:bg-white/10';
  return (
    <Link
      href={action.href}
      data-testid={action.testId}
      className={cn(base, isPrimary ? primary : dark ? secondaryDark : secondaryLight)}
    >
      {action.label}
      {isPrimary && <ArrowRight size={16} strokeWidth={1.6} />}
    </Link>
  );
}
