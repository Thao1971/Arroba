'use client';
/**
 * COMP-3004 · Ratios financieros.
 *
 * @componentId COMP-3004
 * @level 1|2|3
 *
 * Fuente única: `analysis.ratios` (dict `{key: {value, name, category,
 * formula, explanation, source}}` en F0.2). P1: cada ratio expone su
 * fórmula y `source` en Tooltip nativo.
 */
import type {
  FinancialAnalysis,
  FinancialAnalysisRatioDetail,
} from '@/lib/companies/intelligence-types';
import { formatByType } from './lib/format';

const FIN_MONO: React.CSSProperties = {
  fontFamily: 'ui-monospace, monospace',
  fontVariantNumeric: 'tabular-nums',
};

const CATEGORY_LABEL: Record<string, string> = {
  profitability: 'Rentabilidad',
  liquidity: 'Liquidez',
  solvency: 'Solvencia',
  efficiency: 'Productividad y eficiencia',
  growth: 'Crecimiento',
};

const CATEGORY_ORDER = ['profitability', 'liquidity', 'solvency', 'efficiency', 'growth'];

export interface RatiosProps {
  analysis: FinancialAnalysis;
  level: 1 | 2 | 3;
}

interface NormRatio {
  key: string;
  name: string;
  value: number | null;
  category: string;
  format: 'percent' | 'ratio' | 'currency' | 'multiple';
  formula?: string | null;
  explanation?: string | null;
  source?: string | null;
}

function normalizeRatios(
  ratios: FinancialAnalysis['ratios'],
): NormRatio[] {
  const out: NormRatio[] = [];
  for (const [key, raw] of Object.entries(ratios ?? {})) {
    let value: number | null = null;
    let name = key;
    let category = 'profitability';
    let formula: string | null | undefined = null;
    let explanation: string | null | undefined = null;
    let source: string | null | undefined = null;

    if (typeof raw === 'number') {
      value = raw;
    } else if (raw && typeof raw === 'object') {
      const r = raw as FinancialAnalysisRatioDetail;
      if (typeof r.value === 'number') value = r.value;
      if (r.name) name = r.name;
      if (r.category) category = r.category;
      if (r.formula) formula = r.formula;
      if (r.explanation) explanation = r.explanation;
      if (r.source) source = r.source;
    }
    if (value === null) continue;

    let fmt: NormRatio['format'] = 'ratio';
    if (key.endsWith('_margin') || key === 'roe' || key === 'roa' || key === 'solvency' || key === 'debt_ratio') {
      fmt = 'percent';
    }

    out.push({ key, name, value, category, format: fmt, formula, explanation, source });
  }
  return out;
}

export function Ratios({ analysis, level }: RatiosProps) {
  const items = normalizeRatios(analysis.ratios);
  if (!analysis.has_financials || items.length === 0) {
    return (
      <div
        data-testid="comp-3004-unavailable"
        style={{
          background: 'var(--surface-2, #F0EDE6)',
          border: '1px dashed var(--border-strong, #C7C2B8)',
          borderRadius: 10,
          padding: 24,
          color: 'var(--text-muted, #6B6B6B)',
          fontSize: 13,
        }}
      >
        Sin ratios financieros disponibles.
      </div>
    );
  }

  const byCategory = new Map<string, NormRatio[]>();
  for (const r of items) {
    const list = byCategory.get(r.category) || [];
    list.push(r);
    byCategory.set(r.category, list);
  }
  const orderedCategories = CATEGORY_ORDER.filter((c) => byCategory.has(c)).concat(
    Array.from(byCategory.keys()).filter((c) => !CATEGORY_ORDER.includes(c)),
  );

  if (level === 1) {
    // Nivel 1: 3 ratios headline (margen EBITDA, solvencia, ROE si existen)
    const HEADLINE_KEYS = ['ebitda_margin', 'solvency', 'roe'];
    const headline = HEADLINE_KEYS.map((k) => items.find((r) => r.key === k)).filter(Boolean) as NormRatio[];
    if (headline.length === 0) headline.push(...items.slice(0, 3));
    return (
      <div
        data-testid="comp-3004-level-1"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, headline.length)}, 1fr)`, gap: 14 }}
      >
        {headline.map((r) => (
          <div
            key={r.key}
            style={{
              background: 'var(--surface, #FFF)',
              border: '1px solid var(--border, #E5E1D8)',
              borderRadius: 12,
              padding: 18,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-subtle, #8A8677)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
              {r.name}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary, #101010)', ...FIN_MONO, lineHeight: 1 }}>
              {formatByType(r.value, r.format)}
            </div>
            {r.formula && (
              <div style={{ fontSize: 11.5, color: 'var(--text-subtle, #8A8677)', marginTop: 5 }}>{r.formula}</div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (level === 2) {
    return (
      <div
        data-testid="comp-3004-level-2"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(orderedCategories.length, 3)}, 1fr)`, gap: 14 }}
      >
        {orderedCategories.map((cat) => (
          <div
            key={cat}
            style={{
              background: 'var(--surface, #FFF)',
              border: '1px solid var(--border, #E5E1D8)',
              borderRadius: 12,
              padding: 18,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-subtle, #8A8677)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>
              {CATEGORY_LABEL[cat] ?? cat}
            </div>
            {(byCategory.get(cat) ?? []).slice(0, 3).map((r, i) => (
              <div
                key={r.key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '10px 0',
                  borderTop: i ? '1px solid var(--border, #E5E1D8)' : 'none',
                }}
              >
                <span style={{ fontSize: 12.5, color: 'var(--text-muted, #6B6B6B)' }} title={r.explanation ?? undefined}>
                  {r.name}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #101010)', ...FIN_MONO }}>
                  {formatByType(r.value, r.format)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Nivel 3: todos los ratios con fórmula y fuente en tooltip
  return (
    <div
      data-testid="comp-3004-level-3"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}
    >
      {orderedCategories.map((cat) => (
        <div
          key={cat}
          style={{
            background: 'var(--surface, #FFF)',
            border: '1px solid var(--border, #E5E1D8)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border, #E5E1D8)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle, #8A8677)' }}>
              {CATEGORY_LABEL[cat] ?? cat}
            </span>
          </div>
          <div style={{ padding: '4px 18px 12px' }}>
            {(byCategory.get(cat) ?? []).map((r, i) => (
              <div
                key={r.key}
                data-testid={`comp-3004-row-${r.key}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '9px 0',
                  borderTop: i ? '1px solid var(--border, #E5E1D8)' : 'none',
                  gap: 8,
                }}
              >
                <span
                  style={{ fontSize: 12.5, color: 'var(--text-muted, #6B6B6B)' }}
                  title={
                    [r.explanation, r.formula ? `Fórmula: ${r.formula}` : null, r.source ? `Fuente: ${r.source}` : null]
                      .filter(Boolean)
                      .join(' · ') || undefined
                  }
                >
                  {r.name}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    gap: 6,
                    alignItems: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text-primary, #101010)',
                    ...FIN_MONO,
                  }}
                >
                  {formatByType(r.value, r.format)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
