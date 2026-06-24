'use client';
/**
 * LockedSectionBlur — overlay used by `/empresa/{cif}` for sections that are
 * hidden from anonymous visitors. Renders a teaser with a CTA pointing to
 * /registro and /login.
 *
 * Wraps any children with a blurred, non-interactive layer so the user
 * sees the shape of the section but cannot read the data.
 */
import { Lock } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { type ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface LockedSectionBlurProps {
  /** Optional decorative preview rendered behind the blur. Pass the SAME
   *  section UI you would render to an authed user; we just blur it. */
  children?: ReactNode;
  title?: string;
  description?: string;
  testId?: string;
  className?: string;
}

export function LockedSectionBlur({
  children,
  title,
  description,
  testId = 'entity-locked-section',
  className,
}: LockedSectionBlurProps) {
  const t = useTranslations('entity.lock');
  return (
    <div
      data-testid={testId}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-surface min-h-[220px]',
        className,
      )}
    >
      {children ? (
        <div
          aria-hidden
          className="pointer-events-none select-none blur-[8px] opacity-60 p-6"
        >
          {children}
        </div>
      ) : (
        <div
          aria-hidden
          className="pointer-events-none p-6 grid grid-cols-3 gap-3"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-lg bg-text-subtle/10"
            />
          ))}
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center p-6 bg-surface/70 backdrop-blur-[2px]">
        <div className="text-center max-w-md mx-auto">
          <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock size={18} strokeWidth={1.8} className="text-primary" />
          </div>
          <h3 className="font-display font-semibold text-lg mb-2 text-text">
            {title || t('title')}
          </h3>
          <p className="text-sm text-text-muted mb-5 leading-relaxed">
            {description || t('description')}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/registro"
              data-testid={`${testId}-cta-register`}
              className="inline-flex items-center justify-center rounded-full bg-primary text-white px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              {t('register')}
            </Link>
            <Link
              href="/login"
              data-testid={`${testId}-cta-login`}
              className="inline-flex items-center justify-center rounded-full border border-border bg-surface text-text px-5 py-2.5 text-sm font-semibold hover:bg-bg transition-colors"
            >
              {t('login')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
