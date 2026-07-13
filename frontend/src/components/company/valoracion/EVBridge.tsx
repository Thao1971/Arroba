'use client';
/**
 * COMP-4005 · EV Bridge (Enterprise Value → Equity Value bridge).
 *
 * @componentId COMP-4005
 *
 * Estado F0.3: BLOCKED. El motor devuelve `enterprise_value` y `equity_value`
 * finales + hipótesis textual de deuda neta ("Deuda neta = 903000") pero NO
 * expone un desglose escalonado (`valuation.bridge_components`). R15
 * estricto: arroba no genera el bridge en el frontend.
 *
 * Cuando el motor exponga bridge_components, este componente pasará a READY
 * sin cambios de layout. Mientras tanto se muestra una nota P1 con la
 * hipótesis textual disponible.
 */
import type { ValuationAnalysis } from '@/lib/companies/intelligence-types';

export interface EVBridgeProps {
  valuation: ValuationAnalysis;
  level: 1 | 2 | 3;
}

export function EVBridge({ valuation }: EVBridgeProps) {
  const components = valuation.bridge_components;

  if (!components || components.length === 0) {
    // BLOCKED: muestro la nota textual de deuda neta si viene en hipótesis.
    const debtHypothesis = (valuation.hypotheses ?? []).find((h) =>
      /deuda neta/i.test(h),
    );
    return (
      <div
        data-testid="comp-4005-blocked"
        style={{
          background: 'var(--surface-2, #F0EDE6)',
          border: '1px dashed var(--border-strong, #C7C2B8)',
          borderRadius: 12,
          padding: '20px 22px',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <div
          aria-hidden
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(232,0,29,.08)',
            color: '#E8001D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          !
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary, #101010)', marginBottom: 4 }}>
            EV Bridge no disponible
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted, #6B6B6B)', lineHeight: 1.6, margin: 0 }}>
            El Intelligence Engine no expone el desglose escalonado (EBITDA →
            EV → Equity Value). arroba no genera el bridge en el frontend
            (R15). {debtHypothesis && <><br /><em style={{ fontStyle: 'normal', color: 'var(--text-primary, #101010)' }}>Nota reportada:</em> {debtHypothesis}.</>}
          </p>
          <div style={{ fontSize: 12, color: 'var(--text-subtle, #8A8677)', marginTop: 6 }}>
            Bloque COMP-4005 · en cuanto el motor lo exponga, se activará automáticamente.
          </div>
        </div>
      </div>
    );
  }

  // Placeholder READY (para cuando el motor exponga bridge_components).
  return (
    <div
      data-testid="comp-4005-ready"
      style={{
        background: 'var(--surface, #FFF)',
        border: '1px solid var(--border, #E5E1D8)',
        borderRadius: 12,
        padding: 20,
        color: 'var(--text-muted, #6B6B6B)',
        fontSize: 13,
      }}
    >
      EV Bridge (READY) · {components.length} componentes · implementación
      diferida hasta que el motor exponga el shape final del bridge.
    </div>
  );
}
