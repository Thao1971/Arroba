'use client';
/**
 * EntityHero — canonical hero band for any entity page (E1.5.6).
 *
 * Thin wrapper over the Design System `HeroBlock`. Adds entity-section
 * data attributes for QA. See ENTITY_FRAMEWORK.md §3.2.
 */
import { HeroBlock } from '@/components/blocks';
import type { HeroBlockProps } from '@/components/blocks/HeroBlock';
import type { EntityTypeId } from './types';

export interface EntityHeroProps extends HeroBlockProps {
  entityType: EntityTypeId;
}

export function EntityHero({ entityType, ...rest }: EntityHeroProps) {
  return (
    <div data-entity-section="hero" data-entity-type={entityType}>
      <HeroBlock {...rest} />
    </div>
  );
}
