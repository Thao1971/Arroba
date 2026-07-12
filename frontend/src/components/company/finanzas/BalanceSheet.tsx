'use client';
/**
 * COMP-3003 · Balance Sheet (Balance).
 *
 * @componentId COMP-3003
 * @level 1|2|3
 *
 * R15: sólo pinta lo real. Nivel 3 = balance completo del último ejercicio
 * auditado. Los años previos no se rellenan (proveedor no expone balance
 * multi-año).
 */
import type { FinancialAnalysis } from '@/lib/companies/intelligence-types';
import { formatEuros, formatPercent } from './lib/format';

const FIN_MONO: React.CSSProperties = {
  fontFamily: 'ui-monospace, monospace',
  fontVariantNumeric: 'tabular-nums',
};

export interface BalanceSheetProps {
  analysis: FinancialAnalysis;
  level: 1 | 2 | 3;
}

const ACTIVO_ROWS: Array<{
  key: keyof NonNullable<FinancialAnalysis['balance_sheet']>;
  label: string;
  bold?: boolean;
  sub?: boolean;
}> = [
  { key: 'non_current_assets', label: 'Activo no corriente', bold: true },
  { key: 'current_assets', label: 'Activo corriente', bold: true },
  { key: 'cash', label: 'Tesorería', sub: true },
  { key: 'total_assets', label: 'Total activo', bold: true },
];

const PASIVO_ROWS: Array<{
  key: keyof NonNullable<FinancialAnalysis['balance_sheet']>;
  label: string;
  bold?: boolean;
  sub?: boolean;
}> = [
  { key: 'equity', label: 'Patrimonio neto', bold: true },
  { key: 'non_current_liabilities', label: 'Pasivo no corriente', bold: true },
  { key: 'current_liabilities', label: 'Pasivo corriente', bold: true },
  { key: 'financial_debt', label: 'Deuda financiera', sub: true },
  { key: 'total_liabilities', label: 'Total pasivo', bold: true },
];

export function BalanceSheet({ analysis, level }: BalanceSheetProps) {
  const bal = analysis.balance_sheet;
  if (!analysis.has_financials || !bal) {
    return (
      <div
        data-testid="comp-3003-unavailable"
        style={{
          background: 'var(--surface-2, #F0EDE6)',
          border: '1px dashed var(--border-strong, #C7C2B8)',
          borderRadius: 10,
          padding: 24,
          color: 'var(--text-muted, #6B6B6B)',
          fontSize: 13,
        }}
      >
        Sin balance disponible.
      </div>
    );
  }

  const year = analysis.year;

  if (level === 1) {
    return (
      <div
        data-testid="comp-3003-level-1"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}
      >
        {[
          { label: 'Total activo', value: formatEuros(bal.total_assets, { compact: true }) },
          { label: 'Patrimonio neto', value: formatEuros(bal.equity, { compact: true }) },
          { label: 'Deuda financiera', value: formatEuros(bal.financial_debt, { compact: true }) },
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
              {k.label} · {year ?? ''}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary, #101010)', ...FIN_MONO, lineHeight: 1 }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (level === 2) {
    const total = bal.total_assets ?? 0;
    const rows = [
      { title: 'Activo', items: [
        { label: 'Activo no corriente', value: bal.non_current_assets },
        { label: 'Activo corriente', value: bal.current_assets },
      ] },
      { title: 'Patrimonio neto y pasivo', items: [
        { label: 'Patrimonio neto', value: bal.equity },
        { label: 'Pasivo no corriente', value: bal.non_current_liabilities },
        { label: 'Pasivo corriente', value: bal.current_liabilities },
      ] },
    ];
    return (
      <div
        data-testid="comp-3003-level-2"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
      >
        {rows.map((r) => (
          <div
            key={r.title}
            style={{
              background: 'var(--surface, #FFF)',
              border: '1px solid var(--border, #E5E1D8)',
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-subtle, #8A8677)',
                textTransform: 'uppercase',
                letterSpacing: '.05em',
                marginBottom: 12,
              }}
            >
              {r.title}
            </div>
            {r.items.map((it, i) => {
              const pct = total > 0 && it.value !== null && it.value !== undefined ? it.value / total : null;
              return (
                <div
                  key={it.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderTop: i ? '1px solid var(--border, #E5E1D8)' : 'none',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 13, color: 'var(--text-muted, #6B6B6B)' }}>{it.label}</span>
                  <span style={{ display: 'inline-flex', gap: 10, fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', ...FIN_MONO }}>
                    {formatEuros(it.value, { compact: true })}
                    <span style={{ fontSize: 11.5, color: 'var(--text-subtle, #8A8677)', fontWeight: 500, minWidth: 48, textAlign: 'right' }}>
                      {formatPercent(pct)}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  // Nivel 3
  return (
    <div
      data-testid="comp-3003-level-3"
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}
    >
      <BalanceTable title="Activo completo" rows={ACTIVO_ROWS} bal={bal} year={year} />
      <BalanceTable title="Patrimonio neto y pasivo completo" rows={PASIVO_ROWS} bal={bal} year={year} />
    </div>
  );
}

function BalanceTable({
  title,
  rows,
  bal,
  year,
}: {
  title: string;
  rows: Array<{ key: keyof NonNullable<FinancialAnalysis['balance_sheet']>; label: string; bold?: boolean; sub?: boolean }>;
  bal: NonNullable<FinancialAnalysis['balance_sheet']>;
  year: number | null;
}) {
  return (
    <div
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
          {title} · {year ?? ''}
        </span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
        <tbody>
          {rows.map((r, i) => {
            const val = bal[r.key] ?? null;
            return (
              <tr key={r.key} data-testid={`comp-3003-row-${r.key}`}>
                <td
                  style={{
                    padding: '10px 20px',
                    paddingLeft: r.sub ? 32 : 20,
                    borderTop: i ? '1px solid var(--border, #E5E1D8)' : 'none',
                    fontWeight: r.bold ? 700 : 400,
                    color: r.sub ? 'var(--text-muted, #6B6B6B)' : 'var(--text-primary)',
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
                    color: 'var(--text-primary)',
                    ...FIN_MONO,
                  }}
                >
                  {formatEuros(val)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
