'use client';
/**
 * EntitySections — canonical orchestrator of the 12-module entity flow
 * (E1.5.6, see ENTITY_FRAMEWORK.md §4).
 *
 * Consumers declare which sections to render and what state each is in.
 * `EntitySections` does three things:
 *   1. Sorts them against the **canonical top→bottom order** (§4) so the
 *      visual hierarchy is uniform regardless of how the page declared
 *      them.
 *   2. For every section in `state !== 'ready'`, it renders the canonical
 *      fallback (loading skeleton, locked teaser, unavailable placeholder,
 *      empty state, error). Consumers don't need to repeat the boilerplate.
 *   3. For `state === 'ready'`, it renders the `children` slot inside an
 *      `EntitySectionWrapper` so the section title + action slot are
 *      consistent.
 *
 * The consumer (e.g. CompanyPageClient) keeps owning DATA and EVENTS;
 * EntitySections owns LAYOUT and STATE-TO-FALLBACK MAPPING.
 *
 * Example:
 *   <EntitySections
 *     entityType="company"
 *     authenticated={authenticated}
 *     sections={[
 *       { id: 'resumen',    module: 'hero',     title: 'Resumen',    state: 'ready', children: <EntityHero ... /> },
 *       { id: 'kpis',       module: 'kpis',     title: 'KPIs',       state: 'ready', children: <EntityMetrics ... /> },
 *       { id: 'analisis',   module: 'analisis', title: 'Análisis',   state: 'ready', children: <EntityAnalisis ... />,
 *         action: <RefreshButton ... /> },
 *       { id: 'senales',    module: 'senales',  title: 'Señales',    state: 'unavailable', req: 'REQ-008', eta: 'E1.8' },
 *       { id: 'acciones',   module: 'acciones', title: 'Acciones',   state: authenticated ? 'ready' : 'locked',
 *         children: <EntityActions ... /> },
 *     ]}
 *   />
 *
 * For E1.5.6 the existing ficha de Empresa (CompanyPageClient) is NOT
 * refactored to consume this orchestrator — we keep its bespoke layout
 * intact. EntitySections is the **target API** for E1.6+ entities.
 * Documented here so the contract is testable from day one.
 */
import {
  EmptyStateBlock,
  ErrorBlock,
  LoadingBlock,
  UnavailableBlock,
} from '@/components/blocks';
import { EntitySectionWrapper } from '../EntitySectionWrapper';
import { LockedSectionBlur } from '../LockedSectionBlur';
import {
  CANONICAL_MODULE_ORDER,
  MODULE_DEFAULTS,
  type EntitySectionDescriptor,
  type EntityTypeId,
} from './types';

export interface EntitySectionsProps {
  entityType: EntityTypeId;
  authenticated: boolean;
  sections: EntitySectionDescriptor[];
  className?: string;
}

export function EntitySections({
  entityType,
  authenticated,
  sections,
  className,
}: EntitySectionsProps) {
  const ordered = [...sections].sort(
    (a, b) =>
      CANONICAL_MODULE_ORDER.indexOf(a.module) -
      CANONICAL_MODULE_ORDER.indexOf(b.module),
  );

  return (
    <div
      data-testid="entity-sections"
      data-entity-type={entityType}
      data-authenticated={authenticated ? 'true' : 'false'}
      className={className}
    >
      {ordered.map((s) => (
        <EntitySectionWrapper
          key={s.id}
          id={s.id}
          title={s.title}
          description={s.description}
          action={
            s.state === 'ready' || s.state === 'updating' ? s.action : null
          }
          testId={`entity-section-${s.id}`}
        >
          {renderFallback(s)}
        </EntitySectionWrapper>
      ))}
    </div>
  );
}

function renderFallback(s: EntitySectionDescriptor): React.ReactNode {
  const safeTitle = s.title || '';
  switch (s.state) {
    case 'ready':
      return s.children ?? null;
    case 'loading':
      return <LoadingBlock />;
    case 'empty':
      return (
        <EmptyStateBlock
          title={safeTitle}
          description={s.description ?? 'Sin datos en este momento.'}
        />
      );
    case 'locked':
      return (
        <LockedSectionBlur
          testId={`entity-section-${s.id}-locked`}
          title={safeTitle}
          description={s.description}
        />
      );
    case 'error':
      return (
        <ErrorBlock
          title={safeTitle}
          message={s.description ?? 'No hemos podido cargar esta sección.'}
        />
      );
    case 'unavailable': {
      // SPRINT 1 · Regla 3: `req` y `eta` provienen del registry canónico
      // (`MODULE_DEFAULTS`) si el descriptor no los declara explícitamente.
      // Esto garantiza que la misma clave de módulo emite siempre el mismo
      // REQ, sin importar la entidad concreta.
      const defaults = MODULE_DEFAULTS[s.module] || {};
      return (
        <UnavailableBlock
          title={safeTitle}
          description={s.description}
          req={s.req ?? defaults.req}
          eta={s.eta ?? defaults.eta}
        />
      );
    }
    case 'updating':
      // Render the ready content with a brief highlight class.
      return (
        <div className="animate-section-pulse">{s.children ?? null}</div>
      );
    default:
      return null;
  }
}
