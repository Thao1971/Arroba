'use client';
/**
 * CompanyFinanzas — Orquestador de la sección Finanzas (F0.2).
 *
 * Contenedor de layout (sin `@componentId`, exento R14). Encadena:
 *   1. Fetch (parent) → `FinancialAnalysis`
 *   2. Selector de ejercicio (real years).
 *   3. Selector de bloque (P&L · Balance · Cash Flow · Ratios).
 *   4. IntelCard source-grounded (financial_quality + assessment + explainability).
 *   5. Selector de nivel (1 Ejecutiva · 2 Categorías · 3 Detalle).
 *   6. Bloque activo según selección.
 *
 * COMP-3001 (Overview) actúa como cabecera del nivel 1 en cualquier bloque.
 * COMP-3006 (Evolution) se muestra siempre en el nivel 1 debajo del Overview.
 * COMP-3007 (Anomalies) se muestra siempre debajo de la IntelCard.
 *
 * R15 estricto:
 *   - `year` proviene de `analysis.evolution.points[].year` (reales del motor).
 *   - Si no hay `analysis.has_financials`, la sección degrada a UnavailableBlock global.
 *   - Cash Flow BLOCKED si `analysis.cashflow === null`.
 */
import { useMemo, useState } from 'react';
import type { FinancialAnalysis } from '@/lib/companies/intelligence-types';

import { IntelCard } from './lib/IntelCard';
import { sortYearsAsc } from './lib/format';
import { FinancialOverview } from './FinancialOverview';
import { IncomeStatement } from './IncomeStatement';
import { BalanceSheet } from './BalanceSheet';
import { Ratios } from './Ratios';
import { CashFlow } from './CashFlow';
import { FinancialEvolution } from './FinancialEvolution';
import { FinancialAnomalies } from './FinancialAnomalies';

type BlockId = 'pnl' | 'balance' | 'cashflow' | 'ratios';
type Level = 1 | 2 | 3;

const BLOCKS: Array<{ id: BlockId; label: string }> = [
  { id: 'pnl', label: 'Cuenta de resultados' },
  { id: 'balance', label: 'Balance' },
  { id: 'cashflow', label: 'Cash Flow' },
  { id: 'ratios', label: 'Ratios' },
];

const LEVELS: Array<{ n: Level; l: string; d: string }> = [
  { n: 1, l: 'Ejecutiva', d: 'La situación en menos de un minuto' },
  { n: 2, l: 'Categorías', d: 'Grandes categorías, sin cuentas' },
  { n: 3, l: 'Detalle', d: 'Todas las cuentas del ejercicio auditado' },
];

export interface CompanyFinanzasProps {
  analysis: FinancialAnalysis | null;
  loading?: boolean;
  cif: string;
}

export function CompanyFinanzas({ analysis, loading, cif }: CompanyFinanzasProps) {
  const [blockId, setBlockId] = useState<BlockId>('pnl');
  const [level, setLevel] = useState<Level>(1);

  const years = useMemo(
    () =>
      sortYearsAsc(analysis?.evolution?.points?.map((p) => p.year) ?? []).slice().reverse(),
    [analysis],
  );

  if (loading) {
    return (
      <div
        data-testid="finanzas-loading"
        style={{ padding: 40, textAlign: 'center', color: 'var(--text-subtle, #8A8677)' }}
      >
        Cargando finanzas…
      </div>
    );
  }

  if (!analysis || !analysis.has_financials) {
    return (
      <div
        data-testid="finanzas-unavailable"
        style={{
          background: 'var(--surface-2, #F0EDE6)',
          border: '1px dashed var(--border-strong, #C7C2B8)',
          borderRadius: 12,
          padding: 32,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary, #101010)', marginBottom: 6 }}>
          Sin datos financieros disponibles
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted, #6B6B6B)', margin: 0, lineHeight: 1.5 }}>
          El Intelligence Engine no expone estados financieros verificables para el CIF{' '}
          <strong>{cif}</strong>. arroba no rellena esta sección con datos estimados.
        </p>
      </div>
    );
  }

  const yearActive = analysis.year;
  const activeBlockLabel = BLOCKS.find((b) => b.id === blockId)?.label ?? '';

  return (
    <div data-testid="ficha-content-finanzas" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header de la sección */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary, #101010)', lineHeight: 1.15 }}>
            Finanzas
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted, #6B6B6B)', marginTop: 4, maxWidth: 640 }}>
            Cuenta de resultados, balance, cash flow y ratios — de la vista ejecutiva al detalle
            contable completo. Sólo datos reales del Intelligence Engine (R15).
          </div>
        </div>
        <div
          data-testid="finanzas-year-selector"
          style={{
            display: 'inline-flex',
            gap: 8,
            padding: '9px 14px',
            borderRadius: 10,
            border: '1.5px solid #0C0C0E',
            background: 'var(--text-primary, #0C0C0E)',
            color: '#FFF',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Ejercicio auditado: {yearActive ?? '—'}
        </div>
      </div>

      {/* Aviso si sólo 1 año real */}
      {years.length === 1 && (
        <div
          data-testid="finanzas-single-year-notice"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            background: 'var(--surface-2, #F0EDE6)',
            border: '1px dashed var(--border-strong, #C7C2B8)',
            borderRadius: 10,
            padding: '10px 14px',
            marginTop: -6,
          }}
        >
          <span style={{ fontSize: 12.5, color: 'var(--text-muted, #6B6B6B)' }}>
            Solo hay un ejercicio auditado disponible ({years[0]}). En cuanto se
            incorporen ejercicios anteriores, este selector permitirá analizar
            y comparar cada año por separado.
          </span>
        </div>
      )}

      {/* Selector de bloque */}
      <div data-testid="finanzas-block-selector" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {BLOCKS.map((b) => {
          const active = blockId === b.id;
          return (
            <button
              key={b.id}
              type="button"
              data-testid={`finanzas-block-${b.id}`}
              onClick={() => setBlockId(b.id)}
              style={{
                padding: '9px 16px',
                borderRadius: 10,
                border: active ? '1.5px solid #0C0C0E' : '1px solid var(--border-strong, #C7C2B8)',
                background: active ? 'var(--text-primary, #0C0C0E)' : 'var(--surface, #FFF)',
                color: active ? '#FFF' : 'var(--text-primary, #101010)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {b.label}
            </button>
          );
        })}
      </div>

      {/* IntelCard SIEMPRE precede al dato bruto */}
      <IntelCard
        blockLabel={activeBlockLabel}
        quality={analysis.financial_quality}
        assessment={analysis.assessment}
        evolution={analysis.evolution}
        explainability={analysis.explainability}
        onDeepDive={() => setLevel(3)}
      />

      {/* Anomalías (COMP-3007) */}
      <FinancialAnomalies analysis={analysis} level={level} />

      {/* Selector de nivel */}
      <div data-testid="finanzas-level-selector" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--surface-2, #F0EDE6)',
            border: '1px solid var(--border, #E5E1D8)',
            borderRadius: 10,
            padding: 3,
          }}
        >
          {LEVELS.map((lv) => {
            const active = level === lv.n;
            return (
              <button
                key={lv.n}
                type="button"
                data-testid={`finanzas-level-${lv.n}`}
                onClick={() => setLevel(lv.n)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 7,
                  border: 'none',
                  background: active ? 'var(--surface, #FFF)' : 'transparent',
                  color: active ? 'var(--text-primary, #101010)' : 'var(--text-muted, #6B6B6B)',
                  fontSize: 12.5,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                }}
              >
                {lv.l}
              </button>
            );
          })}
        </div>
        <span style={{ fontSize: 12.5, color: 'var(--text-subtle, #8A8677)' }}>
          {LEVELS.find((l) => l.n === level)?.d}
        </span>
      </div>

      {/* Nivel 1 muestra siempre Overview + Evolution + bloque activo */}
      {level === 1 && (
        <>
          <FinancialOverview analysis={analysis} />
          <FinancialEvolution analysis={analysis} level={1} />
        </>
      )}

      {/* Bloque activo */}
      {blockId === 'pnl' && <IncomeStatement analysis={analysis} level={level} />}
      {blockId === 'balance' && <BalanceSheet analysis={analysis} level={level} />}
      {blockId === 'cashflow' && <CashFlow analysis={analysis} level={level} />}
      {blockId === 'ratios' && <Ratios analysis={analysis} level={level} />}
    </div>
  );
}
