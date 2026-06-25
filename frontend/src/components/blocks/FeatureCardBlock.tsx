'use client';
import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

/**
 * FeatureCardBlock — Configurable. Single feature card with optional rank
 * (e.g. "01" → step indicator), icon, title, description, bullet points and
 * an optional link/CTA. Used to compose multi-card sections.
 *
 * For a "grid of N feature cards" wrap multiple in a parent grid.
 */
export interface FeatureCardBlockProps {
  rank?: string; // e.g. "01"
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  bullets?: readonly string[];
  cta?: { label: string; href: string; testId?: string };
  tone?: 'default' | 'accent' | 'dark';
  className?: string;
  testId?: string;
}

export function FeatureCardBlock({
  rank,
  icon: IconCmp,
  title,
  description,
  bullets,
  cta,
  tone = 'default',
  className,
  testId = 'block-feature-card',
}: FeatureCardBlockProps) {
  const dark = tone === 'dark';
  const accent = tone === 'accent';
  return (
    <article
      data-testid={testId}
      data-tone={tone}
      className={cn(
        'flex flex-col h-full rounded-2xl p-6 md:p-7 transition-colors',
        dark && 'text-white border border-white/10',
        accent && 'text-white border-0',
        !dark && !accent && 'border border-border bg-surface text-text hover:border-border-strong',
        className
      )}
      style={
        dark
          ? { background: 'var(--arroba-black)' }
          : accent
            ? { background: 'var(--gradient-brand-red)' }
            : undefined
      }
    >
      {(rank || IconCmp) && (
        <div className="flex items-center justify-between mb-5">
          {rank && (
            <span
              className={cn(
                'text-[11px] font-mono font-bold tracking-wider',
                dark || accent ? 'text-white/40' : 'text-text-subtle'
              )}
            >
              {rank}
            </span>
          )}
          {IconCmp && (
            <span
              className={cn(
                'inline-flex items-center justify-center w-10 h-10 rounded-xl',
                dark || accent ? 'bg-white/10 text-white' : 'bg-surface-2 border border-border text-primary'
              )}
            >
              <IconCmp size={18} strokeWidth={1.5} />
            </span>
          )}
        </div>
      )}
      <h3 className="font-display font-bold text-xl leading-tight tracking-tight mb-2">
        {title}
      </h3>
      {description && (
        <div
          className={cn(
            'text-sm leading-relaxed',
            dark || accent ? 'text-white/75' : 'text-text-muted'
          )}
        >
          {description}
        </div>
      )}
      {bullets && bullets.length > 0 && (
        <ul className="mt-4 space-y-1.5 text-sm">
          {bullets.map((b) => (
            <li
              key={b}
              className={cn(
                'flex gap-2 items-start',
                dark || accent ? 'text-white/85' : 'text-text'
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'mt-1.5 w-1 h-1 rounded-full shrink-0',
                  dark || accent ? 'bg-white/70' : 'bg-primary'
                )}
              />
              {b}
            </li>
          ))}
        </ul>
      )}
      {cta && (
        <Link
          href={cta.href}
          data-testid={cta.testId}
          className={cn(
            'mt-6 inline-flex items-center gap-1.5 text-sm font-semibold w-fit',
            dark || accent ? 'text-white hover:underline' : 'text-primary hover:underline'
          )}
        >
          {cta.label} →
        </Link>
      )}
    </article>
  );
}
