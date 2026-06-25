'use client';
/**
 * EntityAnalisis — qualitative narrative module (E1.5.6).
 *
 * Thin wrapper over `NarrativeBlock`. This is the heart of the
 * "chat → ficha" flow (philosophy §12): the Copilot updates this section
 * in-place via `CustomEvent("arroba:company-section-update")`.
 * See ENTITY_FRAMEWORK.md §3.6.
 */
import { NarrativeBlock } from '@/components/blocks';
import type { NarrativeBlockProps } from '@/components/blocks/NarrativeBlock';
import type { EntityTypeId } from './types';

export interface EntityAnalisisProps extends NarrativeBlockProps {
  entityType: EntityTypeId;
}

export function EntityAnalisis({ entityType, ...rest }: EntityAnalisisProps) {
  return (
    <div data-entity-section="analisis" data-entity-type={entityType}>
      <NarrativeBlock {...rest} />
    </div>
  );
}
