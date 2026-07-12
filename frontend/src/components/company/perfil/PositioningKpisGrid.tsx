'use client';
/**
 * @componentId COMP-P-0004
 * @status BLOCKED
 * @section Perfil
 * @source ce-sections1.jsx (grid 4 KPIs de posicionamiento: rankings + innovación)
 * @endpoints — (Ranking Engine ausente en V2; Innovation signal no expuesto)
 * @acc_pending Pendiente de Ranking Engine V2 + ratificación ACC v0.2
 *
 * COMP-P-0004 Positioning KPIs Grid — rankings sectoriales/locales +
 * nivel de innovación.
 *
 * BLOQUEO: contradicción C13 (rankings visibles en ZIP pero Ranking Engine
 * ausente en V2) + capacidad "innovación" no expuesta. Renderizamos
 * `UnavailableBlock` con COMP-P declarado.
 */
import { UnavailableBlock } from '@/components/blocks/UnavailableBlock';
import { PERFIL_TESTIDS } from '../_lib/testids';

export function PositioningKpisGrid() {
  return (
    <section data-testid={PERFIL_TESTIDS.positioningKpis}>
      <UnavailableBlock
        testId={`${PERFIL_TESTIDS.positioningKpis}-unavailable`}
        title="Posicionamiento y rankings no disponibles"
        description="Ranking Engine y Innovation Signal aún no están expuestos en Agency Tool V2. Cuando se contraten, aparecerán aquí los rankings sectoriales, regionales y locales."
        req="Ranking Engine · Innovation Signal · Agency Tool V2"
        eta="F0.7"
      />
    </section>
  );
}
