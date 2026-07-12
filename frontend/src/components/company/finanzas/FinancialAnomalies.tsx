'use client';
/**
 * COMP-3007 · Financial Anomalies.
 *
 * @componentId COMP-3007
 *
 * Fuente única (source-grounded · R15):
 *   - `analysis.evolution.anomaly` (bool detectada por el motor).
 *   - `analysis.assessment.risks` (lista de riesgos textuales generados por
 *     el motor · nunca por LLM propio de arroba).
 *   - `analysis.financial_quality.rules` (opcional · reglas evaluadas).
 */
import type { FinancialAnalysis } from '@/lib/companies/intelligence-types';

export interface FinancialAnomaliesProps {
  analysis: FinancialAnalysis;
  level: 1 | 2 | 3;
}

export function FinancialAnomalies({ analysis }: FinancialAnomaliesProps) {
  const anomalyDetected = analysis.evolution?.anomaly ?? false;
  const risks =
    analysis.assessment?.risks?.length
      ? analysis.assessment.risks
      : analysis.financial_quality?.risks ?? [];
  const weaknesses =
    analysis.assessment?.weaknesses?.length
      ? analysis.assessment.weaknesses
      : analysis.financial_quality?.weaknesses ?? [];

  if (!analysis.has_financials || (risks.length === 0 && !anomalyDetected && weaknesses.length === 0)) {
    return (
      <div
        data-testid="comp-3007-clean"
        style={{
          background: 'rgba(26,138,74,.06)',
          border: '1px solid rgba(26,138,74,.22)',
          borderRadius: 12,
          padding: '16px 18px',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <div
          aria-hidden
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'rgba(26,138,74,.15)',
            color: '#1A8A4A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          ✓
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary, #101010)' }}>
            Sin anomalías detectadas
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted, #6B6B6B)', margin: '4px 0 0', lineHeight: 1.5 }}>
            El Intelligence Engine no ha identificado saltos anómalos ni patrones
            atípicos en los estados financieros analizados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="comp-3007"
      style={{
        background: 'var(--surface, #FFF)',
        border: '1px solid var(--border, #E5E1D8)',
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-subtle, #8A8677)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 14 }}>
        Anomalías y riesgos detectados
      </div>
      {anomalyDetected && (
        <div
          data-testid="comp-3007-anomaly-flag"
          style={{
            display: 'flex',
            gap: 10,
            padding: '10px 12px',
            background: 'rgba(232,0,29,.06)',
            border: '1px solid rgba(232,0,29,.2)',
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 12.5,
            color: 'var(--text-primary, #101010)',
          }}
        >
          <span style={{ color: '#E8001D', fontWeight: 800 }} aria-hidden>
            ●
          </span>
          Saltos atípicos identificados por el motor en la evolución de KPIs.
        </div>
      )}
      {risks.length > 0 && (
        <div data-testid="comp-3007-risks" style={{ marginBottom: weaknesses.length > 0 ? 14 : 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'rgba(232,0,29,.9)', marginBottom: 6 }}>
            Riesgos
          </div>
          {risks.map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 8,
                fontSize: 13,
                color: 'var(--text-muted, #6B6B6B)',
                lineHeight: 1.55,
                marginBottom: 6,
              }}
            >
              <span style={{ color: '#E8001D', flexShrink: 0 }}>△</span>
              {r}
            </div>
          ))}
        </div>
      )}
      {weaknesses.length > 0 && (
        <div data-testid="comp-3007-weaknesses">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'rgba(217,119,8,.95)', marginBottom: 6 }}>
            Aspectos de atención
          </div>
          {weaknesses.map((w, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 8,
                fontSize: 13,
                color: 'var(--text-muted, #6B6B6B)',
                lineHeight: 1.55,
                marginBottom: 6,
              }}
            >
              <span style={{ color: '#E8A93B', flexShrink: 0 }}>⚠</span>
              {w}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
