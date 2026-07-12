'use client';
/**
 * @componentId COMP-1010
 * @status BLOCKED
 * @section Header
 * @source ce-app.jsx (barra secundaria "Guardar/Seguir/Compartir") — data usuario-empresa
 * @endpoints — (ninguna capacidad Agency Tool V2 expone following/alerts/watchlists)
 * @acc ACC_v0.1.md §4.10 · User Relationship
 *
 * COMP-1010 User Relationship — bloque de relación usuario ↔ empresa
 * (following, alertas activas, watchlists a las que pertenece, mensajes
 * cruzados).
 *
 * BLOQUEO: esta capacidad depende de datos internos de arroba (no forman
 * parte del contrato Agency Tool V2). Renderizamos `UnavailableBlock` con
 * la razón explícita hasta que arroba exponga un backend dedicado.
 */
import { UnavailableBlock } from '@/components/blocks/UnavailableBlock';
import { HEADER_TESTIDS } from '../_lib/testids';

export function UserRelationship() {
  return (
    <section data-testid={HEADER_TESTIDS.userRelationship}>
      <UnavailableBlock
        testId={`${HEADER_TESTIDS.userRelationship}-unavailable`}
        title="Relación con esta empresa"
        description="Following, alertas y watchlists dependen de un backend arroba dedicado que aún no está expuesto en la superficie V2 de Agency Tool."
        req="COMP-1010 · backend arroba propio"
        eta="F1"
      />
    </section>
  );
}
