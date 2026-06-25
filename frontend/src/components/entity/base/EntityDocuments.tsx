'use client';
/**
 * EntityDocuments — associated documents module (E1.5.6).
 *
 * Today: shell that delegates to `EmptyStateBlock`. Future (E1.6+):
 * becomes a `DocumentList` primitive rendering grouped documents by
 * `kind` (mercantile_memory, teaser, IM, NDA, SPA, ...) and respecting
 * the Operation phase grouping.
 *
 * See ENTITY_FRAMEWORK.md §3.10 — Documentación module.
 */
import { EmptyStateBlock } from '@/components/blocks';
import type { EntityTypeId } from './types';

export interface EntityDocumentsProps {
  entityType: EntityTypeId;
  /** When provided and non-empty, future versions will render the list.
   *  For E1.5.6 we keep it as empty state. */
  documents?: Array<{ id: string; name: string; kind: string }>;
  title?: string;
  description?: string;
}

export function EntityDocuments({
  entityType,
  documents = [],
  title = 'Documentos asociados',
  description = 'Aún no hay documentos asociados. Cuando subas teasers, memorias o informes aparecerán aquí.',
}: EntityDocumentsProps) {
  // The empty state is the canonical render for v1.0.0. A non-empty list
  // currently falls through to the empty state too — the real list comes
  // with E1.6+ when `DocumentList` exists.
  const _futureUseList = documents;
  void _futureUseList;
  return (
    <div data-entity-section="documentacion" data-entity-type={entityType}>
      <EmptyStateBlock title={title} description={description} />
    </div>
  );
}
