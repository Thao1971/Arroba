'use client';
/**
 * COMP-4002 · Valuation Method.
 *
 * @componentId COMP-4002
 *
 * Describe el método aplicado (`method_label`), el múltiplo, la base del
 * múltiplo y el lineage. P1 explainability-first.
 */
import type { ValuationAnalysis } from '@/lib/companies/intelligence-types';

const MONO: React.CSSProperties = { fontFamily: 'ui-monospace, monospace', fontVariantNumeric: 'tabular-nums' };

const METHOD_DESCRIPTION: Record<string, string> = {
  ev_ebitda:
    'Se aplica un múltiplo EV/EBITDA sectorial al EBITDA reportado del último ejercicio. Enterprise Value = EBITDA × múltiplo. Equity Value = EV − Deuda financiera neta.',
  dcf: 'Descuenta los flujos de caja libres proyectados a valor presente usando el coste medio ponderado de capital.',
  revenue_multiple: 'Se aplica un múltiplo sobre los ingresos del último ejercicio.',
  book_value: 'Valoración basada en el patrimonio neto contable auditado.',
  peer_comparables: 'Múltiplos de compañías cotizadas comparables.',
};

const MULTIPLE_BASIS_LABEL: Record<string, string> = {
  inferred_reference: 'Referencia inferida del sector',
  sector_median: 'Mediana sectorial observada',
  peer_group: 'Grupo de comparables cotizados',
  custom: 'Múltiplo personalizado',
};

export interface ValuationMethodProps {
  valuation: ValuationAnalysis;
  level: 1 | 2 | 3;
}

export function ValuationMethod({ valuation, level }: ValuationMethodProps) {
  const method = valuation.method ?? 'ev_ebitda';
  const label = valuation.method_label ?? method;
  const description = METHOD_DESCRIPTION[method] ?? METHOD_DESCRIPTION.ev_ebitda;
  const basisLabel =
    valuation.multiple_basis
      ? MULTIPLE_BASIS_LABEL[valuation.multiple_basis] ?? valuation.multiple_basis.replace(/_/g, ' ')
      : null;

  return (
    <div
      data-testid={`comp-4002-level-${level}`}
      style={{
        background: 'var(--surface, #FFF)',
        border: '1px solid var(--border, #E5E1D8)',
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '.05em',
          textTransform: 'uppercase',
          color: 'var(--text-subtle, #8A8677)',
          marginBottom: 10,
        }}
      >
        Método aplicado
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: 'var(--text-primary, #101010)',
          marginBottom: 6,
          lineHeight: 1.1,
        }}
      >
        {label}
      </div>
      {level >= 2 && (
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-muted, #6B6B6B)',
            lineHeight: 1.6,
            margin: '4px 0 14px',
          }}
        >
          {description}
        </p>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginTop: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle, #8A8677)' }}>
            Múltiplo
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, ...MONO }}>
            {typeof valuation.multiple === 'number'
              ? `${valuation.multiple.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}x`
              : '—'}
          </div>
        </div>
        {basisLabel && (
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle, #8A8677)' }}>
              Base del múltiplo
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #101010)' }}>
              {basisLabel}
            </div>
          </div>
        )}
        {valuation.lineage && (
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle, #8A8677)' }}>
              Fuente
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #101010)' }}>
              {valuation.lineage.financials_source} · {valuation.lineage.basis} · {valuation.lineage.year}
            </div>
          </div>
        )}
      </div>
      {level === 3 && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: 'var(--surface-2, #F0EDE6)',
            borderRadius: 8,
            fontSize: 12.5,
            color: 'var(--text-muted, #6B6B6B)',
            ...MONO,
          }}
        >
          Enterprise Value = EBITDA reportado × múltiplo sectorial
          <br />
          Equity Value (aprox.) = Enterprise Value − Deuda financiera neta
        </div>
      )}
    </div>
  );
}
