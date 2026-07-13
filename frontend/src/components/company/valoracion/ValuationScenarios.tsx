'use client';
/**
 * COMP-4006 · Valuation Scenarios.
 *
 * @componentId COMP-4006
 *
 * Estado F0.3: DEGRADED. El motor devuelve `range.{low, high}` +
 * `enterprise_value` como central, pero NO expone `scenarios[]`
 * estructurados con criterios/probabilidades. arroba renderiza 3 puntos
 * (Bajo/Medio/Alto) derivados del rango canónico + Equity Value asociado.
 *
 * R15: sin sliders. Sin factor comprador. Sin cálculo frontend.
 */
import type { ValuationAnalysis } from '@/lib/companies/intelligence-types';
import { formatEuros } from '../finanzas/lib/format';

const MONO: React.CSSProperties = { fontFamily: 'ui-monospace, monospace', fontVariantNumeric: 'tabular-nums' };

export interface ValuationScenariosProps {
  valuation: ValuationAnalysis;
  level: 1 | 2 | 3;
}

export function ValuationScenarios({ valuation, level }: ValuationScenariosProps) {
  const range = valuation.range;
  if (!range || (range.low === null && range.high === null && range.central === null)) {
    return (
      <div
        data-testid="comp-4006-unavailable"
        style={{
          background: 'var(--surface-2, #F0EDE6)',
          border: '1px dashed var(--border-strong, #C7C2B8)',
          borderRadius: 12,
          padding: 20,
          fontSize: 13,
          color: 'var(--text-muted, #6B6B6B)',
        }}
      >
        Escenarios no disponibles.
      </div>
    );
  }

  // Deuda financiera neta reportada por el motor en hypotheses.
  // Extracción defensiva: si no viene, no calculamos Equity por escenario.
  let netDebt: number | null = null;
  const debtHypothesis = (valuation.hypotheses ?? []).find((h) => /deuda neta/i.test(h));
  if (debtHypothesis) {
    const m = debtHypothesis.match(/=\s*(-?[\d.]+)/);
    if (m && m[1]) {
      const parsed = parseFloat(m[1]);
      if (!Number.isNaN(parsed)) netDebt = parsed;
    }
  }
  // Fallback derivado de EV - Equity si ambos están.
  if (
    netDebt === null &&
    typeof valuation.enterprise_value === 'number' &&
    typeof valuation.equity_value === 'number'
  ) {
    netDebt = valuation.enterprise_value - valuation.equity_value;
  }

  const central = range.central ?? valuation.enterprise_value;
  const scenarios: Array<{
    id: 'low' | 'mid' | 'high';
    label: string;
    ev: number | null;
    equity: number | null;
    color: string;
  }> = [
    {
      id: 'low',
      label: 'Bajo',
      ev: range.low,
      equity: range.low !== null && netDebt !== null ? range.low - netDebt : null,
      color: '#E8001D',
    },
    {
      id: 'mid',
      label: 'Medio',
      ev: central,
      equity:
        central !== null && netDebt !== null ? central - netDebt : valuation.equity_value,
      color: '#2164E3',
    },
    {
      id: 'high',
      label: 'Alto',
      ev: range.high,
      equity: range.high !== null && netDebt !== null ? range.high - netDebt : null,
      color: '#1A8A4A',
    },
  ];

  return (
    <div
      data-testid={`comp-4006-level-${level}`}
      style={{
        background: 'var(--surface, #FFF)',
        border: '1px solid var(--border, #E5E1D8)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border, #E5E1D8)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle, #8A8677)' }}>
          Resumen de escenarios
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 10.5,
            padding: '3px 8px',
            borderRadius: 999,
            background: 'rgba(217,119,8,.12)',
            color: '#B15C00',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '.05em',
          }}
        >
          Degradado · rango del motor
        </span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {['Escenario', 'Enterprise Value', 'Equity Value (aprox.)'].map((th, i) => (
              <th
                key={th}
                style={{
                  textAlign: i === 0 ? 'left' : 'right',
                  padding: '10px 20px',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '.05em',
                  textTransform: 'uppercase',
                  color: 'var(--text-subtle, #8A8677)',
                  background: 'var(--surface-2, #F0EDE6)',
                }}
              >
                {th}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {scenarios.map((s) => (
            <tr key={s.id} style={{ borderTop: '1px solid var(--border, #E5E1D8)' }} data-testid={`comp-4006-row-${s.id}`}>
              <td style={{ padding: '11px 20px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.color }} />
                  {s.label}
                </span>
              </td>
              <td style={{ padding: '11px 20px', textAlign: 'right', ...MONO }}>{formatEuros(s.ev, { compact: true })}</td>
              <td style={{ padding: '11px 20px', textAlign: 'right', fontWeight: 700, ...MONO }}>
                {formatEuros(s.equity, { compact: true })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {netDebt === null && (
        <div style={{ padding: '10px 20px', fontSize: 11.5, color: 'var(--text-subtle, #8A8677)', borderTop: '1px solid var(--border, #E5E1D8)' }}>
          Equity Value por escenario no disponible: el motor no reporta la deuda financiera neta para este ejercicio.
        </div>
      )}
    </div>
  );
}
