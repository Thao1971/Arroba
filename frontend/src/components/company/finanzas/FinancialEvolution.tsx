'use client';
/**
 * COMP-3006 · Financial Evolution / Trends.
 *
 * @componentId COMP-3006
 *
 * Fuente única: `analysis.evolution.points[]` — sólo ejercicios reales del
 * proveedor. R15: sin interpolar puntos ausentes. YoY y CAGR sólo si el
 * proveedor los devuelve en `evolution.revenue_growth_yoy` /
 * `evolution.ebitda_growth_yoy` / `evolution.revenue_cagr`.
 */
import type {
  FinancialAnalysis,
  FinancialAnalysisEvolutionPoint,
} from '@/lib/companies/intelligence-types';
import { formatEuros, formatPercent, sortYearsAsc } from './lib/format';

const FIN_MONO: React.CSSProperties = {
  fontFamily: 'ui-monospace, monospace',
  fontVariantNumeric: 'tabular-nums',
};

export interface FinancialEvolutionProps {
  analysis: FinancialAnalysis;
  level: 1 | 2 | 3;
}

const SERIES_CONFIG: Array<{
  key: keyof FinancialAnalysisEvolutionPoint;
  label: string;
  color: string;
}> = [
  { key: 'revenue', label: 'Ingresos', color: '#0C0C0E' },
  { key: 'ebitda', label: 'EBITDA', color: '#1A8A4A' },
  { key: 'net_income', label: 'Beneficio neto', color: '#2164E3' },
];

export function FinancialEvolution({ analysis, level }: FinancialEvolutionProps) {
  const ev = analysis.evolution;
  const points = ev?.points ?? [];
  const years = sortYearsAsc(points.map((p) => p.year));

  if (!analysis.has_financials || years.length === 0) {
    return (
      <div
        data-testid="comp-3006-unavailable"
        style={{
          background: 'var(--surface-2, #F0EDE6)',
          border: '1px dashed var(--border-strong, #C7C2B8)',
          borderRadius: 12,
          padding: 20,
          color: 'var(--text-muted, #6B6B6B)',
          fontSize: 13,
        }}
      >
        Sin serie multi-año. Se necesita al menos un ejercicio real del proveedor.
      </div>
    );
  }

  const byYear: Record<number, FinancialAnalysisEvolutionPoint> = {};
  for (const p of points) byYear[p.year] = p;

  // Máximo abs por serie para escalar barras.
  const seriesData = SERIES_CONFIG.map((s) => ({
    ...s,
    values: years.map((y) => {
      const v = byYear[y]?.[s.key];
      return typeof v === 'number' ? v : null;
    }),
  }));
  const maxAbs = Math.max(
    ...seriesData.flatMap((s) => s.values.filter((v): v is number => v !== null).map(Math.abs)),
    1,
  );

  if (level === 1) {
    // Nivel 1: sólo YoY headline + una serie compacta.
    return (
      <div
        data-testid="comp-3006-level-1"
        style={{
          background: 'var(--surface, #FFF)',
          border: '1px solid var(--border, #E5E1D8)',
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div style={{ display: 'flex', gap: 22, marginBottom: 14, flexWrap: 'wrap' }}>
          {[
            { label: 'Crecimiento ventas YoY', value: ev?.revenue_growth_yoy ?? null },
            { label: 'Crecimiento EBITDA YoY', value: ev?.ebitda_growth_yoy ?? null },
            { label: 'CAGR ingresos', value: ev?.revenue_cagr ?? null },
          ].map((k) => (
            <div key={k.label} style={{ flex: '1 1 160px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-subtle, #8A8677)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
                {k.label}
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color:
                    typeof k.value === 'number'
                      ? k.value < 0
                        ? '#D97708'
                        : '#1A8A4A'
                      : 'var(--text-muted, #6B6B6B)',
                  ...FIN_MONO,
                  lineHeight: 1,
                }}
              >
                {formatPercent(k.value, { sign: true })}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 100 }}>
          {(seriesData[0]?.values ?? []).map((v, i) => {
            const height = v !== null ? (Math.abs(v) / maxAbs) * 100 : 0;
            return (
              <div key={years[i]} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div
                  style={{
                    height: `${height}%`,
                    width: '80%',
                    background: seriesData[0]?.color ?? '#0C0C0E',
                    borderRadius: '4px 4px 0 0',
                    minHeight: v !== null ? 2 : 0,
                  }}
                />
                <span style={{ fontSize: 11, color: 'var(--text-subtle, #8A8677)', ...FIN_MONO }}>{years[i]}</span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--text-subtle, #8A8677)' }}>
          Ingresos por ejercicio · {years.length} años reales del Intelligence Engine.
        </div>
      </div>
    );
  }

  // Nivel 2 y 3: tabla con las 3 series
  return (
    <div
      data-testid={`comp-3006-level-${level}`}
      style={{
        background: 'var(--surface, #FFF)',
        border: '1px solid var(--border, #E5E1D8)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border, #E5E1D8)' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle, #8A8677)' }}>
          Evolución · {years[0]}–{years[years.length - 1]} · {analysis.basis ?? 'individual'}
        </span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th
              style={{
                textAlign: 'left',
                padding: '9px 20px',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '.05em',
                textTransform: 'uppercase',
                color: 'var(--text-subtle, #8A8677)',
                background: 'var(--surface-2, #F0EDE6)',
              }}
            >
              Ejercicio
            </th>
            {years.map((y) => (
              <th
                key={y}
                style={{
                  textAlign: 'right',
                  padding: '9px 20px',
                  fontSize: 10,
                  fontWeight: 700,
                  background: 'var(--surface-2, #F0EDE6)',
                  color: 'var(--text-subtle, #8A8677)',
                }}
              >
                {y}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {seriesData.map((s, si) => (
            <tr key={s.key as string} data-testid={`comp-3006-series-${s.key as string}`}>
              <td
                style={{
                  padding: '11px 20px',
                  borderTop: '1px solid var(--border, #E5E1D8)',
                  fontWeight: 700,
                  color: s.color,
                }}
              >
                {s.label}
              </td>
              {s.values.map((v, vi) => (
                <td
                  key={vi}
                  style={{
                    padding: '11px 20px',
                    textAlign: 'right',
                    borderTop: '1px solid var(--border, #E5E1D8)',
                    color: 'var(--text-primary, #101010)',
                    fontWeight: 500,
                    ...FIN_MONO,
                  }}
                >
                  {formatEuros(v, { compact: true })}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {ev?.trend && (
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border, #E5E1D8)', fontSize: 12, color: 'var(--text-muted, #6B6B6B)' }}>
          Tendencia global agregada por el motor: <strong>{ev.trend}</strong>.
        </div>
      )}
    </div>
  );
}
