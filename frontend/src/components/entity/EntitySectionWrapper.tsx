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
  /** Título visible. Vacío o ausente → sección chromeless (solo wrapper). */
  title?: string;
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
  // SPRINT 1 · secciones "sin chrome": si el consumer omite título y
  // descripción, se emite un contenedor limpio (solo con anchor + testid)
  // para que módulos como `header` o `advisor` puedan participar del
  // orden canónico declarativo sin duplicar títulos visuales encima de
  // primitivas que ya traen su propia chrome (`<CompanyHeader/>`,
  // marcadores hidden, etc.).
  const chromeless = !title && !description && !action;
  return (
    <section
      id={id}
      data-testid={testId || `entity-section-${id}`}
      className={cn('scroll-mt-24', className)}
    >
      {!chromeless && (
        <header className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div className="min-w-0">
            {title && (
              <h2
                className="font-display font-bold text-2xl md:text-3xl tracking-tight"
                data-testid={`entity-section-${id}-title`}
              >
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-text-muted mt-1.5 max-w-2xl">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
