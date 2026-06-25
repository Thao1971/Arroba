'use client';
/**
 * EntityHeader — presentational header for ANY entity page.
 *
 * Part of the Entity Framework canonical primitives (E1.5.6, see
 * `/app/memory/ENTITY_FRAMEWORK.md` §3.1 and §10.1).
 *
 * Architectural contract:
 *   - This component is **purely presentational**. It owns NO state and
 *     fires NO API calls. The container (e.g. `CompanyHeader`,
 *     `SectorHeader`) manages the data flow + side effects and passes a
 *     declarative `actions: EntityHeaderAction[]` array.
 *   - Each action carries its own `testId` so containers keep stable
 *     testids (`company-action-watchlist`, `sector-action-share`, etc.)
 *     without this primitive caring about entity-specific naming.
 *   - The `entityType` prop is the discriminator. It is exposed as
 *     `data-entity-type` on the root `<header>` for QA, CSS and
 *     analytics. Today the prop drives nothing visual; tomorrow we may
 *     specialise the avatar shape, badge colour, etc.
 *
 * Specialisation guidance (see ENTITY_FRAMEWORK.md §10):
 *   - Prefer prop-driven configuration (this `actions` array, the
 *     `info` payload, the `slotMoreActions` slot) over forking by type.
 *   - If a type needs visual variation beyond the slot, add a sibling
 *     primitive — do NOT fork this file.
 *
 * Example (Company):
 *   <EntityHeader
 *     entityType="company"
 *     info={{ name: 'Kitchen Studio, S.L.', initials: 'KS',
 *             subtitle: 'Software · Madrid · B86540112', score: 92 }}
 *     authenticated
 *     actions={[
 *       { testId: 'company-action-watchlist',  label: 'Guardar en cartera',  icon: BookmarkPlus, onClick: ... },
 *       { testId: 'company-action-share',      label: 'Compartir con equipo', icon: Share2,       onClick: ..., disabled: !inWatchlist },
 *       // ...
 *     ]}
 *   />
 *
 * Example (future Sector page in E1.6):
 *   <EntityHeader
 *     entityType="sector"
 *     info={{ name: 'Software', subtitle: 'Tecnología', score: null }}
 *     authenticated
 *     actions={[
 *       { testId: 'sector-action-watchlist', label: 'Guardar sector', icon: BookmarkPlus, onClick: ... },
 *       { testId: 'sector-action-share',     label: 'Compartir',       icon: Share2,       onClick: ... },
 *     ]}
 *   />
 */
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { EntityHeaderAction, EntityHeaderInfo, EntityTypeId } from './types';

export interface EntityHeaderProps {
  entityType: EntityTypeId;
  info: EntityHeaderInfo;
  authenticated: boolean;
  /** Array of typed actions. Empty when anonymous. */
  actions?: EntityHeaderAction[];
  /** Stable testid for the root `<header>` (defaults to
   *  `${entityType}-header`). Container components override when needed
   *  (e.g. `CompanyHeader` keeps the legacy `company-header`). */
  testId?: string;
  /** Optional slot rendered to the right of the actions row, before the
   *  "more actions" dropdown. Useful for, e.g., an OperationPhaseSelector. */
  slotBeforeMore?: React.ReactNode;
}

export function EntityHeader({
  entityType,
  info,
  authenticated,
  actions = [],
  testId,
  slotBeforeMore,
}: EntityHeaderProps) {
  const rootTestId = testId ?? `${entityType}-header`;
  const initials = info.initials ?? deriveInitials(info.name);
  return (
    <header
      data-testid={rootTestId}
      data-entity-type={entityType}
      className="rounded-2xl border border-border bg-surface p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start"
    >
      {/* Avatar */}
      <div
        aria-hidden
        className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-bg border border-border flex items-center justify-center"
      >
        <span className="font-display font-extrabold text-2xl md:text-3xl tracking-tight text-text">
          {initials}
        </span>
      </div>

      {/* Identity */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-3 flex-wrap">
          <h1
            className="font-display font-bold text-3xl md:text-4xl tracking-tight text-text leading-tight min-w-0"
            data-testid={`${rootTestId}-name`}
          >
            {info.name}
          </h1>
          {info.score != null && (
            <span
              data-testid={`${rootTestId}-score`}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mt-2"
            >
              Score {info.score}
            </span>
          )}
        </div>
        {info.subtitle && (
          <p
            className="mt-2 text-sm md:text-base text-text-muted"
            data-testid={`${rootTestId}-subtitle`}
          >
            {info.subtitle}
          </p>
        )}

        {authenticated && actions.length > 0 && (
          <div
            className="mt-5 flex flex-wrap gap-2"
            data-testid={`${rootTestId}-actions`}
          >
            {actions.map((a) => (
              <EntityActionButton key={a.testId} action={a} />
            ))}
            {slotBeforeMore}
            <button
              type="button"
              aria-label="Más acciones"
              data-testid={`${rootTestId.replace(/-header$/, '-action-more')}`}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-border bg-bg text-text-muted hover:bg-surface transition-colors duration-fast"
            >
              <MoreHorizontal size={16} strokeWidth={1.8} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function EntityActionButton({ action }: { action: EntityHeaderAction }) {
  const Icon = action.icon;
  return (
    <button
      type="button"
      data-testid={action.testId}
      onClick={action.onClick}
      disabled={action.disabled}
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border transition-colors duration-fast',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        action.primary
          ? 'bg-primary text-text-on-brand border-primary hover:bg-primary-hover'
          : action.active
          ? 'bg-primary/10 text-primary border-primary/40 hover:bg-primary/15'
          : 'bg-bg text-text border-border hover:bg-surface',
      )}
    >
      <Icon size={14} strokeWidth={1.8} />
      {action.label}
    </button>
  );
}

function deriveInitials(name: string): string {
  const parts = name
    .replace(/[,.;:()\-_/\\]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}
