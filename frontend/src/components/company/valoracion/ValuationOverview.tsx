'use client';
/**
 * COMP-4001 · Valuation Overview.
 *
 * @componentId COMP-4001
 *
 * Cabecera con método aplicado + EV + Equity Value + confidence. Se muestra
 * siempre encima de los demás bloques en Nivel 1 y sirve como resumen de
 * cabecera en Nivel 2/3.
 *
 * R15: sólo datos reales del motor (`arroba-valuation-v1`). Si el motor no
 * expone `has_valuation`, el orquestador degrada a `UnavailableBlock` sin
 * llegar a este componente.
 */
import type { ValuationAnalysis } from '@/lib/companies/intelligence-types';
import { formatEuros } from '../finanzas/lib/format';

const FIN_MONO: React.CSSProperties = {
  fontFamily: 'ui-monospace, monospace',
  fontVariantNumeric: 'tabular-nums',
};

const CONFIDENCE_COLOR: Record<string, string> = {
  low: '#D97708',
  medium: '#2164E3',
  high: '#1A8A4A',
};

const CONFIDENCE_LABEL: Record<string, string> = {
  low: 'Confianza baja',
  medium: 'Confianza media',
  high: 'Confianza alta',
};

export interface ValuationOverviewProps {
  valuation: ValuationAnalysis;
}

export function ValuationOverview({ valuation }: ValuationOverviewProps) {
  const conf = valuation.confidence_level ?? 'medium';
  const confColor = CONFIDENCE_COLOR[conf] ?? '#2164E3';
  const confLabel = CONFIDENCE_LABEL[conf] ?? 'Confianza';

  return (
    <div
      data-testid="comp-4001"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 14,
      }}
    >
      {[
        {
          label: 'Enterprise Value',
          value: formatEuros(valuation.enterprise_value, { compact: true }),
          hint: valuation.method_label ?? valuation.method,
        },
        {
          label: 'Equity Value (aprox.)',
          value: formatEuros(valuation.equity_value, { compact: true }),
          hint: 'Ajustado por deuda financiera neta',
        },
        {
          label: 'Múltiplo aplicado',
          value:
            typeof valuation.multiple === 'number'
              ? `${valuation.multiple.toLocaleString('es-ES', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 2,
                })}x`
              : '—',
          hint: valuation.multiple_basis
            ? valuation.multiple_basis.replace(/_/g, ' ')
            : null,
        },
        {
          label: confLabel,
          value:
            typeof valuation.confidence === 'number'
              ? `${Math.round(valuation.confidence * 100)}%`
              : '—',
          hint:
            valuation.lineage?.basis && valuation.lineage?.year
              ? `${valuation.lineage.basis} · ${valuation.lineage.year}`
              : null,
          accent: confColor,
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
              color: k.accent ?? 'var(--text-subtle, #8A8677)',
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
              color: k.accent ?? 'var(--text-primary, #101010)',
              ...FIN_MONO,
              lineHeight: 1,
            }}
          >
            {k.value}
          </div>
          {k.hint && (
            <div
              style={{
                fontSize: 11.5,
                color: 'var(--text-subtle, #8A8677)',
                marginTop: 5,
              }}
            >
              {k.hint}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
