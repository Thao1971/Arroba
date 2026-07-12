'use client';
/**
 * IntelCard — Panel oscuro "Inteligencia Arroba" que precede al dato bruto.
 *
 * Fuente EXCLUSIVA de contenido (R15 · P1 · sin narrativa LLM inventada):
 *   - `financial_quality.strengths` → aspectos positivos
 *   - `financial_quality.weaknesses` → aspectos de atención
 *   - `financial_quality.risks` → riesgos
 *   - `evolution.trend` → indicador direccional
 *   - `explainability.data_source` + `explainability.rules_applied` → evidencia
 *     desplegable ("¿Por qué Arroba dice esto?")
 *
 * Si NADA de esto está disponible, se degrada a un aviso "Interpretación
 * pendiente de capacidad Intelligence Engine" (R15). Nunca se rellena con
 * texto Copilot inventado.
 *
 * Nota: no lleva `@componentId` — es un helper visual reutilizado por los
 * COMP-3002..3007 y por COMP-3001.
 */
import { useState } from 'react';
import type {
  FinancialAnalysisAssessment,
  FinancialAnalysisEvolution,
  FinancialAnalysisExplainability,
  FinancialAnalysisQuality,
} from '@/lib/companies/intelligence-types';

const TREND_MAP: Record<string, { color: string; label: string }> = {
  positiva: { color: '#1A8A4A', label: '↗ Tendencia positiva' },
  positive: { color: '#1A8A4A', label: '↗ Tendencia positiva' },
  estable: { color: '#2164E3', label: '→ Tendencia estable' },
  stable: { color: '#2164E3', label: '→ Tendencia estable' },
  flat: { color: '#2164E3', label: '→ Tendencia estable' },
  negativa: { color: '#D97708', label: '↘ Tendencia negativa' },
  deterioration: { color: '#D97708', label: '↘ Tendencia negativa' },
};

export interface IntelCardProps {
  quality: FinancialAnalysisQuality | null;
  assessment: FinancialAnalysisAssessment | null;
  evolution: FinancialAnalysisEvolution | null;
  explainability: FinancialAnalysisExplainability | null;
  /** Etiqueta del bloque activo (ej. "Cuenta de resultados"). */
  blockLabel: string;
  /** Callback para saltar a nivel 3 detalle. Opcional. */
  onDeepDive?: () => void;
}

export function IntelCard({
  quality,
  assessment,
  evolution,
  explainability,
  blockLabel,
  onDeepDive,
}: IntelCardProps) {
  const [why, setWhy] = useState(false);

  // Fuentes de contenido (siempre source-grounded):
  const strengths = assessment?.strengths?.length
    ? assessment.strengths
    : quality?.strengths ?? [];
  const weaknesses = assessment?.weaknesses?.length
    ? assessment.weaknesses
    : quality?.weaknesses ?? [];
  const risks = assessment?.risks?.length ? assessment.risks : quality?.risks ?? [];
  const trendKey = evolution?.trend ?? 'estable';
  const trend = TREND_MAP[trendKey] ?? TREND_MAP.estable ?? { color: '#2164E3', label: '→ Tendencia estable' };

  const hasContent =
    strengths.length > 0 || weaknesses.length > 0 || risks.length > 0;

  if (!hasContent && !explainability?.data_source) {
    return (
      <div
        data-testid="finanzas-intel-unavailable"
        style={{
          background: 'var(--surface-2, #F0EDE6)',
          border: '1px dashed var(--border-strong, #C7C2B8)',
          borderRadius: 10,
          padding: '16px 18px',
          color: 'var(--text-muted, #6B6B6B)',
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        Interpretación pendiente de capacidad del Intelligence Engine para{' '}
        <strong>{blockLabel}</strong>. Sin narrativa generada — arroba nunca
        rellena con texto inventado (R15).
      </div>
    );
  }

  return (
    <div
      data-testid="finanzas-intel-card"
      style={{
        background: 'linear-gradient(135deg,#0C0C0E,#1A1A18)',
        borderRadius: 14,
        padding: '20px 22px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          right: -14,
          top: -24,
          fontSize: 130,
          color: 'rgba(232,0,29,.07)',
          fontWeight: 800,
          lineHeight: 1,
          pointerEvents: 'none',
        }}
      >
        ✦
      </span>
      <div style={{ position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 11,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: '#E8001D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              color: '#fff',
              fontWeight: 800,
            }}
            aria-hidden
          >
            ✦
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
            Inteligencia Arroba · {blockLabel}
          </span>
          {evolution?.trend && (
            <span
              data-testid="finanzas-intel-trend"
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11.5,
                fontWeight: 700,
                color: trend.color,
              }}
            >
              {trend.label}
            </span>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 22,
            flexWrap: 'wrap',
            marginBottom: 14,
          }}
        >
          {strengths.length > 0 && (
            <div style={{ flex: '1 1 220px' }} data-testid="finanzas-intel-strengths">
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '.05em',
                  textTransform: 'uppercase',
                  color: 'rgba(26,138,74,.9)',
                  marginBottom: 7,
                }}
              >
                Aspectos positivos
              </div>
              {strengths.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 7,
                    fontSize: 12.5,
                    color: 'rgba(255,255,255,.78)',
                    lineHeight: 1.5,
                    marginBottom: 5,
                  }}
                >
                  <span style={{ color: '#3EBE7E', flexShrink: 0 }}>✓</span>
                  {s}
                </div>
              ))}
            </div>
          )}
          {weaknesses.length > 0 && (
            <div style={{ flex: '1 1 220px' }} data-testid="finanzas-intel-weaknesses">
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '.05em',
                  textTransform: 'uppercase',
                  color: 'rgba(217,119,8,.95)',
                  marginBottom: 7,
                }}
              >
                Aspectos de atención
              </div>
              {weaknesses.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 7,
                    fontSize: 12.5,
                    color: 'rgba(255,255,255,.78)',
                    lineHeight: 1.5,
                    marginBottom: 5,
                  }}
                >
                  <span style={{ color: '#E8A93B', flexShrink: 0 }}>⚠</span>
                  {s}
                </div>
              ))}
            </div>
          )}
          {risks.length > 0 && (
            <div style={{ flex: '1 1 220px' }} data-testid="finanzas-intel-risks">
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '.05em',
                  textTransform: 'uppercase',
                  color: 'rgba(232,0,29,.9)',
                  marginBottom: 7,
                }}
              >
                Riesgos detectados
              </div>
              {risks.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 7,
                    fontSize: 12.5,
                    color: 'rgba(255,255,255,.78)',
                    lineHeight: 1.5,
                    marginBottom: 5,
                  }}
                >
                  <span style={{ color: '#F2536C', flexShrink: 0 }}>△</span>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            data-testid="finanzas-intel-why-toggle"
            onClick={() => setWhy((v) => !v)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              color: 'rgba(255,255,255,.9)',
              background: 'rgba(255,255,255,.06)',
              border: '1px solid rgba(255,255,255,.16)',
              padding: '7px 13px',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            {why ? 'Ocultar evidencias' : '¿Por qué Arroba dice esto?'}
          </button>
          {onDeepDive && (
            <button
              type="button"
              data-testid="finanzas-intel-deep-dive"
              onClick={onDeepDive}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                color: '#0C0C0E',
                background: '#fff',
                border: '1px solid #fff',
                padding: '7px 13px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Ver detalle contable
            </button>
          )}
        </div>

        {why && explainability && (
          <div
            data-testid="finanzas-intel-evidence"
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid rgba(255,255,255,.12)',
            }}
          >
            {explainability.data_source && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  fontSize: 12,
                  color: 'rgba(255,255,255,.68)',
                  lineHeight: 1.6,
                  marginBottom: 6,
                }}
              >
                <span style={{ color: 'rgba(255,255,255,.35)', flexShrink: 0 }}>
                  1.
                </span>
                <span>
                  <strong style={{ color: '#fff' }}>Fuente:</strong>{' '}
                  {explainability.data_source}
                  {explainability.source_version
                    ? ` · v${explainability.source_version}`
                    : ''}
                </span>
              </div>
            )}
            {explainability.rules_applied && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  fontSize: 12,
                  color: 'rgba(255,255,255,.68)',
                  lineHeight: 1.6,
                  marginBottom: 6,
                }}
              >
                <span style={{ color: 'rgba(255,255,255,.35)', flexShrink: 0 }}>
                  2.
                </span>
                <span>
                  <strong style={{ color: '#fff' }}>Método:</strong>{' '}
                  {explainability.rules_applied}
                </span>
              </div>
            )}
            {explainability.year !== null && explainability.year !== undefined && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  fontSize: 12,
                  color: 'rgba(255,255,255,.68)',
                  lineHeight: 1.6,
                  marginBottom: 6,
                }}
              >
                <span style={{ color: 'rgba(255,255,255,.35)', flexShrink: 0 }}>
                  3.
                </span>
                <span>
                  <strong style={{ color: '#fff' }}>Ejercicio auditado:</strong>{' '}
                  {explainability.year}
                  {explainability.basis ? ` · ${explainability.basis}` : ''}
                </span>
              </div>
            )}
            {explainability.ai_used !== null &&
              explainability.ai_used !== undefined && (
                <div
                  style={{
                    fontSize: 11.5,
                    color: 'rgba(255,255,255,.5)',
                    marginTop: 8,
                  }}
                >
                  {explainability.ai_used
                    ? 'Análisis asistido por modelo LLM (arroba-explainability-v1).'
                    : 'Análisis 100 % determinista (sin LLM).'}
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
