'use client';
/**
 * EntityInsights — short qualitative bullets module (E1.5.6).
 *
 * Today: thin wrapper over `NarrativeBlock` reusing `keyPoints`. Future
 * (E1.6+): may grow into a dedicated `InsightsList` primitive.
 * See ENTITY_FRAMEWORK.md §3.5.
 */
import { NarrativeBlock } from '@/components/blocks';
import type { NarrativeBlockProps } from '@/components/blocks/NarrativeBlock';
import type { EntityTypeId } from './types';

export interface EntityInsightsProps extends NarrativeBlockProps {
  entityType: EntityTypeId;
}

export function EntityInsights({ entityType, ...rest }: EntityInsightsProps) {
  return (
    <div data-entity-section="insights" data-entity-type={entityType}>
      <NarrativeBlock {...rest} />
    </div>
  );
}
