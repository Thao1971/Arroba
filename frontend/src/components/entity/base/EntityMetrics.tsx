'use client';
/**
 * EntityMetrics — canonical KPI grid for any entity page (E1.5.6).
 *
 * Thin wrapper over the Design System `MetricsBlock`. See
 * ENTITY_FRAMEWORK.md §3.3.
 */
import { MetricsBlock } from '@/components/blocks';
import type { MetricsBlockProps } from '@/components/blocks/MetricsBlock';
import type { EntityTypeId } from './types';

export interface EntityMetricsProps extends MetricsBlockProps {
  entityType: EntityTypeId;
}

export function EntityMetrics({ entityType, ...rest }: EntityMetricsProps) {
  return (
    <div data-entity-section="kpis" data-entity-type={entityType}>
      <MetricsBlock {...rest} />
    </div>
  );
}
