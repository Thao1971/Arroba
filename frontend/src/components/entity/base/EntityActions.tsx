'use client';
/**
 * EntityActions — "Next Best Actions" grid for any entity page (E1.5.6).
 *
 * Renders 3-4 cards each with an icon + label + microcopy + CTA. The
 * actions are entity-specific; the layout is canonical.
 *
 * See ENTITY_FRAMEWORK.md §3.12 — Acciones module.
 *
 * Example (Company):
 *   <EntityActions
 *     entityType="company"
 *     items={[
 *       { id: 'compare', icon: ScaleIcon, label: 'Compárala con otra empresa',
 *         hint: 'Encuentra peers o competidores', onClick: ... },
 *       { id: 'risks',   icon: AlertIcon, label: 'Analiza riesgos',
 *         hint: 'Lectura cualitativa del Copilot', onClick: ... },
 *       { id: 'opps',    icon: Sparkles, label: 'Detecta oportunidades',
 *         hint: 'Buy / sell-side', onClick: ... },
 *     ]}
 *   />
 *
 * Specialisation: each entity declares its action set in its page client.
 * The visual is identical across types.
 */
import type { ComponentType } from 'react';
import { cn } from '@/lib/cn';
import type { EntityTypeId } from './types';

export interface EntityActionItem {
  id: string;
  label: string;
  hint?: string;
  icon: ComponentType<any>;
  onClick: () => void;
  /** Optional accent — paints the card with brand-primary on hover. */
  accent?: boolean;
  testId?: string;
}

export interface EntityActionsProps {
  entityType: EntityTypeId;
  items: EntityActionItem[];
  className?: string;
}

export function EntityActions({
  entityType,
  items,
  className,
}: EntityActionsProps) {
  return (
    <div
      data-entity-section="acciones"
      data-entity-type={entityType}
      data-testid="entity-actions"
      className={cn(
        'grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <button
            key={it.id}
            type="button"
            data-testid={it.testId ?? `entity-actions-${it.id}`}
            onClick={it.onClick}
            className={cn(
              'group rounded-2xl border border-border-default bg-surface-elevated p-5 text-left',
              'flex flex-col gap-2 transition-colors duration-fast',
              'hover:border-border-emphasis',
              it.accent && 'hover:bg-primary/5',
              'focus-visible:shadow-focus',
            )}
          >
            <div
              className={cn(
                'inline-flex items-center justify-center w-10 h-10 rounded-lg',
                'bg-surface-muted text-text-primary',
                it.accent && 'group-hover:bg-primary group-hover:text-text-on-brand',
                'transition-colors duration-fast',
              )}
              aria-hidden
            >
              <Icon size={18} strokeWidth={1.8} />
            </div>
            <h4 className="font-display font-semibold text-h4 leading-h4 text-text-primary">
              {it.label}
            </h4>
            {it.hint && (
              <p className="text-body-sm text-text-secondary leading-body">
                {it.hint}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
