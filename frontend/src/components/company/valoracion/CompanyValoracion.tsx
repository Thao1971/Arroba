'use client';
/**
 * CompanyValoracion — Orquestador de la sección Valoración (F0.3).
 *
 * Contenedor de layout (sin `@componentId`, exento R14). Encadena:
 *   1. Fetch (parent) → `ValuationAnalysis` (`arroba-valuation-v1`).
 *   2. Header + disclaimer.
 *   3. Selector de nivel (1 Ejecutiva · 2 Categorías · 3 Detalle).
 *   4. COMP-4001 Overview (siempre).
 *   5. Grid 2 cols · COMP-4002 Method · COMP-4003 Range.
 *   6. COMP-4004 Hypotheses.
 *   7. COMP-4006 Scenarios (DEGRADED · rango del motor).
 *   8. COMP-4005 EV Bridge (BLOCKED BY DATA).
 *   9. COMP-4007 Sensitivity (BLOCKED BY DATA).
 *   10. CTA "Valoración avanzada" (dark card).
 *
 * R15: sólo datos del motor. Si `has_valuation=false`, sección UnavailableBlock.
 */
import { useState } from 'react';
import type { ValuationAnalysis } from '@/lib/companies/intelligence-types';

import { ValuationOverview } from './ValuationOverview';
import { ValuationMethod } from './ValuationMethod';
import { ValuationRangeBlock } from './ValuationRange';
import { ValuationHypotheses } from './ValuationHypotheses';
import { EVBridge } from './EVBridge';
import { ValuationScenarios } from './ValuationScenarios';
import { Sensitivity } from './Sensitivity';

type Level = 1 | 2 | 3;

const LEVELS: Array<{ n: Level; l: string; d: string }> = [
  { n: 1, l: 'Ejecutiva', d: 'Método, valor y rango en menos de un minuto' },
  { n: 2, l: 'Categorías', d: 'Hipótesis principales del cálculo y escenarios' },
  { n: 3, l: 'Detalle', d: 'Todas las hipótesis, bridge y sensibilidad si están disponibles' },
];

export interface CompanyValoracionProps {
  valuation: ValuationAnalysis | null;
  loading?: boolean;
  cif: string;
}

export function CompanyValoracion({ valuation, loading, cif }: CompanyValoracionProps) {
  const [level, setLevel] = useState<Level>(1);

  if (loading) {
    return (
      <div
        data-testid="valoracion-loading"
        style={{ padding: 40, textAlign: 'center', color: 'var(--text-subtle, #8A8677)' }}
      >
        Cargando valoración…
      </div>
    );
  }

  if (!valuation || !valuation.has_valuation) {
    return (
      <div
        data-testid="valoracion-unavailable"
        style={{
          background: 'var(--surface-2, #F0EDE6)',
          border: '1px dashed var(--border-strong, #C7C2B8)',
          borderRadius: 12,
          padding: 32,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary, #101010)', marginBottom: 6 }}>
          Sin valoración disponible
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted, #6B6B6B)', margin: 0, lineHeight: 1.5 }}>
          El Intelligence Engine no ha podido calcular una valoración fiable
          para el CIF <strong>{cif}</strong>. arroba no rellena esta sección
          con estimaciones propias (R15).
        </p>
      </div>
    );
  }

  return (
    <div data-testid="ficha-content-valoracion" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary, #101010)', lineHeight: 1.15 }}>
            Valoración
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted, #6B6B6B)', marginTop: 4, maxWidth: 640 }}>
            Aproximación de valor por múltiplos comparables. Sólo datos reales
            del Intelligence Engine (arroba-valuation-v1 · R15).
          </div>
        </div>
        {valuation.lineage?.year && (
          <div
            data-testid="valoracion-year-selector"
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
            Ejercicio auditado: {valuation.lineage.year}
          </div>
        )}
      </div>

      {/* Disclaimer canónico del ZIP */}
      <div
        data-testid="valoracion-disclaimer"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          background: 'var(--surface-2, #F0EDE6)',
          border: '1px solid var(--border, #E5E1D8)',
          borderRadius: 10,
          padding: '12px 14px',
        }}
      >
        <span
          aria-hidden
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'var(--text-primary, #0C0C0E)',
            color: '#fff',
            fontSize: 10.5,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          i
        </span>
        <span style={{ fontSize: 12.5, color: 'var(--text-muted, #6B6B6B)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--text-primary, #101010)' }}>
            Equity Value ajustado por deuda financiera neta.
          </strong>{' '}
          El valor mostrado es una aproximación. Estimación orientativa, no una
          valoración formal.
        </span>
      </div>

      {/* Selector de nivel */}
      <div data-testid="valoracion-level-selector" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
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
                data-testid={`valoracion-level-${lv.n}`}
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

      {/* COMP-4001 Overview */}
      <ValuationOverview valuation={valuation} />

      {/* Grid Method + Range */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 14, alignItems: 'start' }}>
        <ValuationMethod valuation={valuation} level={level} />
        <ValuationRangeBlock valuation={valuation} level={level} />
      </div>

      {/* Hypotheses */}
      <ValuationHypotheses valuation={valuation} level={level} />

      {/* Scenarios · DEGRADED */}
      <ValuationScenarios valuation={valuation} level={level} />

      {/* Bloques BLOCKED (nivel 3 sólo) */}
      {level === 3 && (
        <>
          <EVBridge valuation={valuation} level={level} />
          <Sensitivity valuation={valuation} level={level} />
        </>
      )}

      {/* CTA Valoración avanzada */}
      <div
        data-testid="valoracion-advanced-cta"
        style={{
          background: 'linear-gradient(135deg,#0C0C0E,#1A1A18)',
          borderRadius: 14,
          padding: 24,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            right: -16,
            top: -28,
            fontSize: 150,
            color: 'rgba(232,0,29,.07)',
            fontWeight: 800,
            lineHeight: 1,
            pointerEvents: 'none',
          }}
        >
          ✦
        </span>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: '#E8001D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                color: '#fff',
                fontWeight: 800,
              }}
              aria-hidden
            >
              ✦
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
              Valoración avanzada
            </span>
          </div>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,.7)', lineHeight: 1.6, margin: '0 0 18px', maxWidth: 600 }}>
            Genera un{' '}
            <strong style={{ color: '#fff' }}>informe profesional descargable</strong>{' '}
            con DCF, comparables, escenarios y sensibilidad, y el racional para
            comprador estratégico y financiero.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <button
              type="button"
              data-testid="valoracion-request-advanced-btn"
              style={{
                padding: '13px 22px',
                borderRadius: 11,
                border: 'none',
                background: '#E8001D',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Solicitar valoración avanzada
            </button>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 700, color: '#fff' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E8001D' }} />
              75 créditos
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
