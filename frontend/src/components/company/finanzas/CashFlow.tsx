'use client';
/**
 * COMP-3005 · Cash Flow.
 *
 * @componentId COMP-3005
 *
 * Estado F0.2: BLOCKED. El Intelligence Engine (`financial-intelligence/
 * analyze`) devuelve `cashflow: null` para el caso canónico TOTALENERGIES
 * (y para el resto de empresas comprobadas). R15 estricto: no se estiman
 * flujos a partir de EBITDA + variación de balance — arroba nunca inventa.
 *
 * Cuando el motor exponga un bloque `cashflow` estructurado, este componente
 * pasará a `READY` sin cambios de layout: se renderizarán las 4 secciones
 * canónicas (Operación · Inversión · Financiación · Caja) con datos reales
 * en el mismo geometry del ZIP `ce-finanzas.jsx`.
 */
import type { FinancialAnalysis } from '@/lib/companies/intelligence-types';

export interface CashFlowProps {
  analysis: FinancialAnalysis;
  level: 1 | 2 | 3;
}

export function CashFlow({ analysis }: CashFlowProps) {
  const hasCashflow = analysis.cashflow !== null && typeof analysis.cashflow === 'object';

  if (!hasCashflow) {
    return (
      <div
        data-testid="comp-3005-blocked"
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
            Cash Flow no disponible
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted, #6B6B6B)', lineHeight: 1.6, margin: 0 }}>
            El Intelligence Engine no expone el estado de flujos de efectivo
            para esta empresa en el ejercicio {analysis.year ?? '—'}. arroba
            nunca estima flujos a partir de balance + cuenta de resultados
            (R15 · datos reales o Unavailable).
          </p>
          <div style={{ fontSize: 12, color: 'var(--text-subtle, #8A8677)', marginTop: 6 }}>
            Bloque COMP-3005 · en cuanto el motor lo exponga, se activará automáticamente.
          </div>
        </div>
      </div>
    );
  }

  // Placeholder futuro para cuando el motor exponga cashflow.
  return (
    <div
      data-testid="comp-3005-ready"
      style={{
        background: 'var(--surface, #FFF)',
        border: '1px solid var(--border, #E5E1D8)',
        borderRadius: 12,
        padding: 20,
        color: 'var(--text-muted, #6B6B6B)',
        fontSize: 13,
      }}
    >
      Cash Flow (READY) — geometry preservado del ZIP `ce-finanzas.jsx`. Implementación
      diferida hasta que el motor exponga el bloque; contrato listo (nivel 1/2/3).
    </div>
  );
}
