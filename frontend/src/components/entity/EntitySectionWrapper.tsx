'use client';
/**
 * EntitySectionWrapper — uniform container for every section of an entity
 * page. Renders an anchor id (for in-page navigation), a section header
 * with title + optional action slot, and the section body.
 */
import { type ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface EntitySectionWrapperProps {
  id: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  testId?: string;
  className?: string;
}

export function EntitySectionWrapper({
  id,
  title,
  description,
  action,
  children,
  testId,
  className,
}: EntitySectionWrapperProps) {
  return (
    <section
      id={id}
      data-testid={testId || `entity-section-${id}`}
      className={cn('scroll-mt-24', className)}
    >
      <header className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h2
            className="font-display font-bold text-2xl md:text-3xl tracking-tight"
            data-testid={`entity-section-${id}-title`}
          >
            {title}
          </h2>
          {description && (
            <p className="text-sm text-text-muted mt-1.5 max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      {children}
    </section>
  );
}
