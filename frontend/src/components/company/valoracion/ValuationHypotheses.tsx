'use client';
/**
 * COMP-4004 · Valuation Hypotheses.
 *
 * @componentId COMP-4004
 *
 * Lista textual de hipótesis + confidence. Fuente única:
 * `valuation.hypotheses[]` (strings del motor · source-grounded · R15).
 */
import type { ValuationAnalysis } from '@/lib/companies/intelligence-types';

const CONFIDENCE_BAND: Record<string, { color: string; label: string; desc: string }> = {
  low: {
    color: '#D97708',
    label: 'Confianza baja',
    desc: 'La estimación se basa en referencias sectoriales inferidas y márgenes limitados de datos comparables. Debe interpretarse como orientativa.',
  },
  medium: {
    color: '#2164E3',
    label: 'Confianza media',
    desc: 'El motor dispone de datos financieros consolidados y aplica un múltiplo sectorial de referencia. La cifra sirve para orientar negociación.',
  },
  high: {
    color: '#1A8A4A',
    label: 'Confianza alta',
    desc: 'El motor dispone de comparables sólidos y datos completos. La cifra puede usarse como base sólida en un proceso de M&A.',
  },
};

export interface ValuationHypothesesProps {
  valuation: ValuationAnalysis;
  level: 1 | 2 | 3;
}

export function ValuationHypotheses({ valuation, level }: ValuationHypothesesProps) {
  const hypotheses = valuation.hypotheses ?? [];
  const conf = valuation.confidence_level ?? 'medium';
  const confInfo = CONFIDENCE_BAND[conf] ?? CONFIDENCE_BAND.medium!;

  if (hypotheses.length === 0 && conf === null) {
    return (
      <div
        data-testid="comp-4004-unavailable"
        style={{
          background: 'var(--surface-2, #F0EDE6)',
          border: '1px dashed var(--border-strong, #C7C2B8)',
          borderRadius: 12,
          padding: 20,
          fontSize: 13,
          color: 'var(--text-muted, #6B6B6B)',
        }}
      >
        Sin hipótesis reportadas por el motor.
      </div>
    );
  }

  return (
    <div
      data-testid={`comp-4004-level-${level}`}
      style={{
        background: 'var(--surface, #FFF)',
        border: '1px solid var(--border, #E5E1D8)',
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.05em',
            textTransform: 'uppercase',
            color: 'var(--text-subtle, #8A8677)',
          }}
        >
          Hipótesis del cálculo
        </div>
        <span
          data-testid="comp-4004-confidence-badge"
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 999,
            background: 'rgba(0,0,0,.03)',
            border: `1px solid ${confInfo.color}`,
            color: confInfo.color,
            fontSize: 11.5,
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: confInfo.color,
            }}
          />
          {confInfo.label}
          {typeof valuation.confidence === 'number' && (
            <span style={{ opacity: 0.75, marginLeft: 4 }}>
              {Math.round(valuation.confidence * 100)}%
            </span>
          )}
        </span>
      </div>
      {level >= 2 && (
        <p
          style={{
            fontSize: 12.5,
            color: 'var(--text-muted, #6B6B6B)',
            lineHeight: 1.6,
            margin: '0 0 14px',
          }}
        >
          {confInfo.desc}
        </p>
      )}
      {hypotheses.length > 0 && (
        <ol
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {hypotheses.map((h, i) => (
            <li
              key={i}
              data-testid={`comp-4004-hypothesis-${i}`}
              style={{
                display: 'flex',
                gap: 12,
                fontSize: 13.5,
                color: 'var(--text-primary, #101010)',
                lineHeight: 1.6,
                padding: '11px 14px',
                background: 'var(--surface-2, #F0EDE6)',
                borderRadius: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-subtle, #8A8677)',
                  flexShrink: 0,
                  minWidth: 20,
                }}
              >
                {i + 1}.
              </span>
              <span>{h}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
