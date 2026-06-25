'use client';
/**
 * EntityRelations — contextual navigation to related entities (E1.5.6).
 *
 * Thin wrapper over `CompanyCardsGridBlock`. Future entities will dispatch
 * to other card grids based on the subtype. See ENTITY_FRAMEWORK.md §3.8.
 */
import { CompanyCardsGridBlock } from '@/components/blocks';
import type { CompanyCardsGridBlockProps } from '@/components/blocks/CompanyCardsGridBlock';
import type { EntityTypeId } from './types';

export interface EntityRelationsProps extends CompanyCardsGridBlockProps {
  entityType: EntityTypeId;
}

export function EntityRelations({ entityType, ...rest }: EntityRelationsProps) {
  return (
    <div data-entity-section="relaciones" data-entity-type={entityType}>
      <CompanyCardsGridBlock {...rest} />
    </div>
  );
}
