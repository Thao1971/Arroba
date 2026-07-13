'use client';
/**
 * COMP-4007 · Sensitivity Analysis.
 *
 * @componentId COMP-4007
 *
 * Estado F0.3: BLOCKED. El motor no expone `valuation.sensitivity`
 * (matriz múltiplo × EBITDA). R15: arroba no genera la matriz en el
 * frontend. Cuando el motor la exponga, este componente pasará a READY
 * sin cambios de layout.
 */
import type { ValuationAnalysis } from '@/lib/companies/intelligence-types';

export interface SensitivityProps {
  valuation: ValuationAnalysis;
  level: 1 | 2 | 3;
}

export function Sensitivity({ valuation }: SensitivityProps) {
  const sensitivity = valuation.sensitivity;

  if (!sensitivity) {
    return (
      <div
        data-testid="comp-4007-blocked"
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
            Análisis de sensibilidad no disponible
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted, #6B6B6B)', lineHeight: 1.6, margin: 0 }}>
            El Intelligence Engine no expone la matriz de sensibilidad
            (múltiplo × EBITDA) para esta empresa. arroba no genera la matriz
            en el frontend (R15).
          </p>
          <div style={{ fontSize: 12, color: 'var(--text-subtle, #8A8677)', marginTop: 6 }}>
            Bloque COMP-4007 · en cuanto el motor la exponga, se activará automáticamente.
          </div>
        </div>
      </div>
    );
  }

  // Placeholder READY.
  return (
    <div
      data-testid="comp-4007-ready"
      style={{
        background: 'var(--surface, #FFF)',
        border: '1px solid var(--border, #E5E1D8)',
        borderRadius: 12,
        padding: 20,
        color: 'var(--text-muted, #6B6B6B)',
        fontSize: 13,
      }}
    >
      Análisis de sensibilidad (READY) · implementación diferida hasta que el
      motor exponga la matriz.
    </div>
  );
}
