'use client';
/**
 * COMP-3002 · Income Statement (Cuenta de Resultados).
 *
 * @componentId COMP-3002
 * @level 1|2|3 · progressive disclosure según prop `level`.
 *
 * R15: sólo pinta ejercicios reales (`analysis.year`). Las columnas de años
 * previos se marcan como `—` (sin dato) — nunca se calculan ni interpolan.
 * P1: tooltip "info" en cada valor puede mostrar `data_source` desde
 * `explainability.data_source` (F0.2 · Tooltip explainability-first).
 */
import type { FinancialAnalysis } from '@/lib/companies/intelligence-types';
import { formatEuros, formatPercent, sortYearsAsc, UNAVAILABLE_DASH } from './lib/format';

const FIN_MONO: React.CSSProperties = {
  fontFamily: 'ui-monospace, monospace',
  fontVariantNumeric: 'tabular-nums',
};

export interface IncomeStatementProps {
  analysis: FinancialAnalysis;
  level: 1 | 2 | 3;
}

const PL_ROWS: Array<{
  key: keyof NonNullable<FinancialAnalysis['income_statement']>;
  label: string;
  bold?: boolean;
  accent?: boolean;
}> = [
  { key: 'revenue', label: 'Ingresos', bold: true },
  { key: 'supplies', label: 'Aprovisionamientos' },
  { key: 'personnel_costs', label: 'Gastos de personal' },
  { key: 'depreciation', label: 'Amortización' },
  { key: 'operating_income', label: 'Resultado de explotación', bold: true },
  { key: 'ebitda', label: 'EBITDA', bold: true, accent: true },
  { key: 'ebit', label: 'EBIT' },
  { key: 'financial_expenses', label: 'Gastos financieros' },
  { key: 'net_income', label: 'Beneficio neto', bold: true },
];

export function IncomeStatement({ analysis, level }: IncomeStatementProps) {
  const stmt = analysis.income_statement;
  if (!analysis.has_financials || !stmt) {
    return (
      <div
        data-testid="comp-3002-unavailable"
        style={{
          background: 'var(--surface-2, #F0EDE6)',
          border: '1px dashed var(--border-strong, #C7C2B8)',
          borderRadius: 10,
          padding: 24,
          color: 'var(--text-muted, #6B6B6B)',
          fontSize: 13,
        }}
      >
        Sin cuenta de resultados disponible.
      </div>
    );
  }

  const ventas = stmt.revenue ?? null;
  const year = analysis.year;

  if (level === 1) {
    // Nivel 1: KPI headline (Ventas · EBITDA · Beneficio neto)
    return (
      <div
        data-testid="comp-3002-level-1"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}
      >
        {[
          { label: `Ventas ${year ?? ''}`.trim(), value: formatEuros(stmt.revenue, { compact: true }) },
          {
            label: 'EBITDA',
            value: formatEuros(stmt.ebitda, { compact: true }),
            hint:
              analysis.kpis?.ebitda_margin !== null && analysis.kpis?.ebitda_margin !== undefined
                ? `Margen ${formatPercent(analysis.kpis.ebitda_margin)}`
                : null,
          },
          {
            label: 'Beneficio neto',
            value: formatEuros(stmt.net_income, { compact: true }),
            hint:
              analysis.kpis?.net_margin !== null && analysis.kpis?.net_margin !== undefined
                ? `Margen ${formatPercent(analysis.kpis.net_margin)}`
                : null,
          },
        ].map((k) => (
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
              <div style={{ fontSize: 11.5, color: 'var(--text-subtle, #8A8677)', marginTop: 5 }}>
                {k.hint}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (level === 2) {
    // Nivel 2: categorías principales sobre ventas
    if (!ventas || ventas === 0) {
      return (
        <div data-testid="comp-3002-level-2-empty" style={{ color: 'var(--text-muted)' }}>
          Sin ventas registradas para calcular categorías.
        </div>
      );
    }
    const cats: Array<{ label: string; value: number | null | undefined; bold?: boolean }> = [
      { label: 'Ingresos', value: stmt.revenue, bold: true },
      { label: 'Aprovisionamientos', value: stmt.supplies },
      { label: 'Gastos de personal', value: stmt.personnel_costs },
      { label: 'Amortización', value: stmt.depreciation },
      { label: 'EBITDA', value: stmt.ebitda, bold: true },
      { label: 'EBIT', value: stmt.ebit, bold: true },
      { label: 'Beneficio neto', value: stmt.net_income, bold: true },
    ];
    const rows = cats.filter((c) => c.value !== null && c.value !== undefined);
    const max = Math.max(...rows.map((c) => Math.abs((c.value ?? 0) / ventas)));
    return (
      <div
        data-testid="comp-3002-level-2"
        style={{
          background: 'var(--surface, #FFF)',
          border: '1px solid var(--border, #E5E1D8)',
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-subtle, #8A8677)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>
          Grandes categorías · % sobre ventas
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {rows.map((c) => {
            const pct = ((c.value ?? 0) / ventas) * 100;
            const width = Math.min(100, (Math.abs(pct) / (max * 100)) * 100);
            return (
              <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    width: 190,
                    fontSize: 13,
                    fontWeight: c.bold ? 700 : 500,
                    color: c.bold ? 'var(--text-primary, #101010)' : 'var(--text-muted, #6B6B6B)',
                    flexShrink: 0,
                  }}
                >
                  {c.label}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 20,
                    background: 'var(--surface-2, #F0EDE6)',
                    borderRadius: 5,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${width}%`,
                      background: pct < 0 ? '#E8001D' : '#0C0C0E',
                      borderRadius: 5,
                    }}
                  />
                </div>
                <span style={{ width: 100, fontSize: 13, ...FIN_MONO, color: 'var(--text-primary)', textAlign: 'right' }}>
                  {formatEuros(c.value, { compact: true })}
                </span>
                <span style={{ width: 60, fontSize: 11.5, ...FIN_MONO, color: 'var(--text-subtle, #8A8677)', textAlign: 'right' }}>
                  {formatPercent(pct / 100)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Nivel 3: cuenta completa
  return (
    <div
      data-testid="comp-3002-level-3"
      style={{
        background: 'var(--surface, #FFF)',
        border: '1px solid var(--border, #E5E1D8)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border, #E5E1D8)' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.05em',
            textTransform: 'uppercase',
            color: 'var(--text-subtle, #8A8677)',
          }}
        >
          Cuenta de resultados completa · {analysis.basis ?? 'individual'} · {year ?? UNAVAILABLE_DASH}
        </span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
        <thead>
          <tr>
            {['Concepto', 'Importe', '% ventas'].map((th, i) => (
              <th
                key={th}
                style={{
                  textAlign: i === 0 ? 'left' : 'right',
                  padding: '9px 20px',
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
          {PL_ROWS.map((r, i) => {
            const val = stmt[r.key] ?? null;
            const pct = val !== null && ventas ? val / ventas : null;
            return (
              <tr
                key={r.key}
                data-testid={`comp-3002-row-${r.key}`}
                style={{
                  background: r.accent ? 'rgba(232,0,29,.045)' : r.bold ? 'var(--surface-2, #F0EDE6)' : 'transparent',
                }}
              >
                <td
                  style={{
                    padding: '10px 20px',
                    borderTop: i ? '1px solid var(--border, #E5E1D8)' : 'none',
                    fontWeight: r.bold ? 700 : 400,
                  }}
                >
                  {r.label}
                </td>
                <td
                  style={{
                    padding: '10px 20px',
                    textAlign: 'right',
                    borderTop: i ? '1px solid var(--border, #E5E1D8)' : 'none',
                    fontWeight: r.bold ? 700 : 400,
                    color: r.accent ? '#E8001D' : 'var(--text-primary, #101010)',
                    ...FIN_MONO,
                  }}
                >
                  {formatEuros(val)}
                </td>
                <td
                  style={{
                    padding: '10px 20px',
                    textAlign: 'right',
                    borderTop: i ? '1px solid var(--border, #E5E1D8)' : 'none',
                    color: 'var(--text-subtle, #8A8677)',
                    ...FIN_MONO,
                  }}
                >
                  {formatPercent(pct)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
