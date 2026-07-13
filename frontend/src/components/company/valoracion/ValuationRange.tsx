'use client';
/**
 * COMP-4003 · Valuation Range.
 *
 * @componentId COMP-4003
 *
 * Rango de valor low/central/high. Fuente única: `valuation.range` +
 * `valuation.enterprise_value` (central canónico añadido por arroba).
 * R15: no se calculan bajo/central/alto en el frontend — vienen del motor.
 */
import type { ValuationAnalysis } from '@/lib/companies/intelligence-types';
import { formatEuros } from '../finanzas/lib/format';

const MONO: React.CSSProperties = { fontFamily: 'ui-monospace, monospace', fontVariantNumeric: 'tabular-nums' };

export interface ValuationRangeProps {
  valuation: ValuationAnalysis;
  level: 1 | 2 | 3;
}

export function ValuationRangeBlock({ valuation, level }: ValuationRangeProps) {
  const range = valuation.range;
  if (!range || range.high === null || range.low === null) {
    return (
      <div
        data-testid="comp-4003-unavailable"
        style={{
          background: 'var(--surface-2, #F0EDE6)',
          border: '1px dashed var(--border-strong, #C7C2B8)',
          borderRadius: 12,
          padding: 20,
          fontSize: 13,
          color: 'var(--text-muted, #6B6B6B)',
        }}
      >
        Rango de valoración no disponible.
      </div>
    );
  }

  const items: Array<{ label: string; value: number | null; color: string }> = [
    { label: 'Rango bajo', value: range.low, color: '#E8001D' },
    { label: 'Valor central', value: range.central ?? valuation.enterprise_value, color: '#2164E3' },
    { label: 'Rango alto', value: range.high, color: '#1A8A4A' },
  ];

  const maxVal = Math.max(...items.map((i) => Math.abs(i.value ?? 0)), 1);

  return (
    <div
      data-testid={`comp-4003-level-${level}`}
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
          marginBottom: 14,
        }}
      >
        Enterprise Value · rango
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        {items.map((it) => {
          const width = it.value !== null ? (Math.abs(it.value) / maxVal) * 100 : 0;
          return (
            <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  width: 100,
                  fontSize: 12.5,
                  color: 'var(--text-muted, #6B6B6B)',
                  flexShrink: 0,
                }}
              >
                {it.label}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 14,
                  background: 'var(--surface-2, #F0EDE6)',
                  borderRadius: 6,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${width}%`,
                    background: it.color,
                    borderRadius: 6,
                  }}
                />
              </div>
              <span
                style={{
                  width: 130,
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-primary, #101010)',
                  textAlign: 'right',
                  ...MONO,
                }}
              >
                {formatEuros(it.value, { compact: true })}
              </span>
            </div>
          );
        })}
      </div>
      {level >= 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {items.map((it) => (
            <div
              key={it.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                border: `1px solid ${it.color}`,
                borderRadius: 10,
                padding: '12px 16px',
              }}
              data-testid={`comp-4003-row-${it.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: it.color,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: it.color,
                  }}
                />
                {it.label}
              </span>
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: 'var(--text-primary, #101010)',
                  ...MONO,
                }}
              >
                {formatEuros(it.value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
