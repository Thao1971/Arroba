'use client';
import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * HeroBlock — Configurable block. Two variants:
 * - "default": large headline + subtitle + optional badge + slot for actions/extra content.
 * - "banner":  more compact, used as a divider banner mid-page (smaller eyebrow + headline + body).
 *
 * Static-only (no data states). Always renders, since copy is provided by the caller.
 * Use the `tone` prop on banner variant for dark backgrounds.
 */
export interface HeroBlockProps {
  variant?: 'default' | 'banner';
  tone?: 'light' | 'dark';
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode; // free slot (search input, chips, etc.)
  className?: string;
  testId?: string;
}

export function HeroBlock({
  variant = 'default',
  tone,
  eyebrow,
  title,
  subtitle,
  actions,
  children,
  className,
  testId = 'block-hero',
}: HeroBlockProps) {
  if (variant === 'banner') {
    const dark = tone === 'dark';
    return (
      <section
        data-testid={testId}
        data-variant="banner"
        className={cn(
          'relative overflow-hidden rounded-2xl px-8 py-12 md:px-14 md:py-16',
          dark ? 'text-white' : 'text-text bg-surface border border-border',
          className
        )}
        style={dark ? { background: '#0C0C0E' } : undefined}
      >
        {dark && (
          <span
            aria-hidden
            className="absolute right-[-90px] top-[-60px] leading-none font-display font-extrabold select-none pointer-events-none"
            style={{ fontSize: 360, color: 'rgba(232,0,29,.08)' }}
          >
            ✦
          </span>
        )}
        <div className="relative max-w-2xl">
          {eyebrow && (
            <p
              className={cn(
                'text-[11px] uppercase tracking-[0.12em] font-semibold mb-3',
                dark ? 'text-primary' : 'text-primary'
              )}
            >
              {eyebrow}
            </p>
          )}
          <h2 className="font-display font-bold text-3xl md:text-4xl leading-tight tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <div
              className={cn(
                'mt-4 text-base md:text-lg leading-relaxed',
                dark ? 'text-white/70' : 'text-text-muted'
              )}
            >
              {subtitle}
            </div>
          )}
          {children && <div className="mt-6">{children}</div>}
          {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
        </div>
      </section>
    );
  }

  return (
    <section
      data-testid={testId}
      data-variant="default"
      className={cn('w-full text-center max-w-3xl mx-auto', className)}
    >
      {eyebrow && (
        <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-primary mb-3">
          {eyebrow}
        </p>
      )}
      <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05] text-text">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-6 max-w-2xl mx-auto text-lg text-text-muted leading-relaxed">
          {subtitle}
        </p>
      )}
      {children && <div className="mt-8">{children}</div>}
      {actions && (
        <div className="mt-8 flex justify-center gap-3 flex-wrap">{actions}</div>
      )}
    </section>
  );
}
