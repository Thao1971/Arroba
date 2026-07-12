'use client';
/**
 * COMP-3001 · Financial Overview.
 *
 * @componentId COMP-3001
 *
 * Orquestador de los 4 sub-bloques financieros (Cuenta de Resultados, Balance,
 * Cash Flow, Ratios) + resumen ejecutivo agregado. Muestra los KPIs headline
 * del ejercicio real más reciente y el `financial_quality.score` cuando lo
 * expone el motor.
 */
import type { FinancialAnalysis } from '@/lib/companies/intelligence-types';
import { formatEuros, formatPercent } from './lib/format';

const FIN_MONO: React.CSSProperties = {
  fontFamily: 'ui-monospace, monospace',
  fontVariantNumeric: 'tabular-nums',
};

export interface FinancialOverviewProps {
  analysis: FinancialAnalysis;
}

export function FinancialOverview({ analysis }: FinancialOverviewProps) {
  const kpis = analysis.kpis;
  const quality = analysis.financial_quality;
  const year = analysis.year;

  const headline = [
    { label: `Ventas ${year ?? ''}`.trim(), value: formatEuros(kpis?.revenue ?? null, { compact: true }) },
    {
      label: 'EBITDA',
      value: formatEuros(kpis?.ebitda ?? null, { compact: true }),
      hint: kpis?.ebitda_margin !== null && kpis?.ebitda_margin !== undefined ? `Margen ${formatPercent(kpis.ebitda_margin)}` : null,
    },
    {
      label: 'Beneficio neto',
      value: formatEuros(kpis?.net_income ?? null, { compact: true }),
      hint: kpis?.net_margin !== null && kpis?.net_margin !== undefined ? `Margen ${formatPercent(kpis.net_margin)}` : null,
    },
    {
      label: 'Calidad financiera',
      value: quality?.score !== null && quality?.score !== undefined ? `${quality.score}/100` : '—',
      hint: quality?.score !== null && quality?.score !== undefined ? 'arroba financial quality score' : null,
    },
  ];

  return (
    <div
      data-testid="comp-3001"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 14,
      }}
    >
      {headline.map((k) => (
        <div
          key={k.label}
          style={{
            background: 'var(--surface, #FFF)',
            border: '1px solid var(--border, #E5E1D8)',
            borderRadius: 12,
            padding: 18,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-subtle, #8A8677)',
              textTransform: 'uppercase',
              letterSpacing: '.05em',
              marginBottom: 8,
            }}
          >
            {k.label}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--text-primary, #101010)',
              ...FIN_MONO,
              lineHeight: 1,
            }}
          >
            {k.value}
          </div>
          {k.hint && (
            <div style={{ fontSize: 11.5, color: 'var(--text-subtle, #8A8677)', marginTop: 5 }}>{k.hint}</div>
          )}
        </div>
      ))}
    </div>
  );
}
