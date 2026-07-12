'use client';
/**
 * @componentId COMP-P-0006
 * @status BLOCKED
 * @section Perfil
 * @source ce-sections1.jsx (card "Scores de inteligencia" · 4 anillos: Quality, Growth, Risk, Opportunity)
 * @endpoints — (Scores engine no expuesto en Agency Tool V2)
 * @acc_pending Pendiente de Scores Engine V2 + ratificación ACC v0.2
 *
 * COMP-P-0006 Intelligence Scores Ring — cuadro de scores intelligence
 * (Quality, Growth, Risk, Opportunity, M&A Readiness).
 *
 * BLOQUEO: Scores Engine no está expuesto en la superficie V2. Renderizamos
 * `UnavailableBlock` con COMP-P declarado hasta ampliación del contrato.
 */
import { UnavailableBlock } from '@/components/blocks/UnavailableBlock';
import { PERFIL_TESTIDS } from '../_lib/testids';

export function IntelligenceScoresRing() {
  return (
    <section data-testid={PERFIL_TESTIDS.intelligenceScores}>
      <UnavailableBlock
        testId={`${PERFIL_TESTIDS.intelligenceScores}-unavailable`}
        title="Scores de inteligencia no disponibles"
        description="Quality Score, Growth, Risk y Opportunity dependen de un Scores Engine no expuesto todavía en Agency Tool V2."
        req="Scores Engine · Agency Tool V2"
        eta="F0.3"
      />
    </section>
  );
}
