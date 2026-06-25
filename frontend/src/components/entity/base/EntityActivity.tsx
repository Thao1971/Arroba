'use client';
/**
 * EntityActivity — recent activity timeline module (E1.5.6).
 *
 * Today: shell that delegates to `EmptyStateBlock`. Future (E1.6+):
 * becomes an `ActivityTimeline` primitive showing typed events (created,
 * updated, conversation, export, share, phase_change).
 *
 * See ENTITY_FRAMEWORK.md §3.11 — Actividad module.
 */
import { EmptyStateBlock } from '@/components/blocks';
import type { EntityTypeId } from './types';

export interface EntityActivityProps {
  entityType: EntityTypeId;
  events?: Array<{
    id: string;
    kind: 'created' | 'updated' | 'conversation' | 'export' | 'share' | 'phase_change';
    at: string;
    actor?: string;
    summary?: string;
  }>;
  title?: string;
  description?: string;
}

export function EntityActivity({
  entityType,
  events = [],
  title = 'Actividad reciente',
  description = 'Cuando interactúes con esta entidad (refrescos, exports, conversaciones, cambios de fase) verás aquí el timeline.',
}: EntityActivityProps) {
  const _futureUseEvents = events;
  void _futureUseEvents;
  return (
    <div data-entity-section="actividad" data-entity-type={entityType}>
      <EmptyStateBlock title={title} description={description} />
    </div>
  );
}
