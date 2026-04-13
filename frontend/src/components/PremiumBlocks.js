import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fmtES, fmtMillions } from '../utils/formatES';
import { Info, Loader2, Save, Edit3 } from 'lucide-react';

/* ═══ KPI Card with tooltip ═══ */
export const KpiCard = ({ kpi }) => {
  const [showTip, setShowTip] = useState(false);
  const levelColors = { low: '#16a34a', medium: '#d97706', high: '#dc2626' };
  const color = levelColors[kpi.level] || 'var(--on-surface)';
  return (
    <div className="relative p-3" style={{ background: 'var(--surface-lowest)' }} onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}>
      <div className="flex items-center gap-1 mb-1">
        <p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>{kpi.label?.toUpperCase()}</p>
        <Info size={9} style={{ color: 'var(--outline-variant)' }} />
      </div>
      <p className="text-lg font-black" style={{ color }}>{typeof kpi.value === 'number' ? fmtES(kpi.value, kpi.unit === '%' ? 1 : kpi.unit === 'EUR' ? 0 : 2) : kpi.value}{kpi.unit === '%' ? '%' : kpi.unit === 'x' ? 'x' : ''}</p>
      {kpi.unit === 'EUR' && <p className="text-[9px]" style={{ color: 'var(--outline)' }}>EUR</p>}
      {kpi.level_label && <span className="text-[8px] font-bold px-1.5 py-0.5 mt-1 inline-block" style={{ background: color + '12', color }}>{kpi.level_label}</span>}
      {showTip && (
        <div className="absolute left-0 right-0 top-full z-20 p-3" style={{ background: 'var(--on-surface)', color: '#fff' }}>
          <p className="text-[10px] mb-1">{kpi.description}</p>
          <p className="text-[9px]" style={{ opacity: 0.7 }}>Formula: {kpi.formula}</p>
        </div>
      )}
    </div>
  );
};

/* ═══ Percentile bar ═══ */
export const PercentileBar = ({ metric, data, vsCategory }) => {
  const metricLabels = { revenue: 'Facturacion', ebitda: 'EBITDA', ebitda_margin: 'Margen EBITDA', growth: 'Crecimiento', efficiency: 'Eficiencia', quality_score: 'Quality Score' };
  const catLabels = { top_quartile: 'Top quartile', above_median: 'Sobre la media', below_median: 'Bajo la media', bottom_quartile: 'Cuartil inferior' };
  const catColors = { top_quartile: '#16a34a', above_median: '#16a34a', below_median: '#d97706', bottom_quartile: '#dc2626' };
  return (
    <div className="flex items-center gap-3">
      <p className="text-[10px] font-bold w-28 shrink-0" style={{ color: 'var(--on-surface)' }}>{metricLabels[metric] || metric}</p>
      <div className="flex-1 h-2 relative" style={{ background: 'var(--surface-2)' }}>
        <div className="h-full" style={{ width: `${data.percentile}%`, background: data.percentile >= 50 ? '#16a34a' : '#d97706', transition: 'width 0.5s' }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3" style={{ left: '50%', background: 'var(--outline)' }} />
      </div>
      <span className="text-[10px] font-bold w-8 text-right" style={{ color: data.percentile >= 50 ? '#16a34a' : '#d97706' }}>P{data.percentile}</span>
      {vsCategory && <span className="text-[8px] font-bold px-1.5 py-0.5" style={{ background: (catColors[vsCategory] || 'var(--outline)') + '12', color: catColors[vsCategory] || 'var(--outline)' }}>{catLabels[vsCategory]}</span>}
    </div>
  );
};

/* ═══ Premium Valuation Block ═══ */
export const PremiumValuationBlock = ({ valuation }) => {
  if (!valuation?.available) return null;
  return (
    <div className="p-5 mb-6" style={{ background: 'rgba(182,33,42,0.02)', borderLeft: '3px solid var(--arroba-primary)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
      <div className="flex items-center gap-2 mb-4">
        <p className="label-arroba" style={{ color: 'var(--arroba-primary)' }}>VALORACIÓN Y BENCHMARK PREMIUM</p>
        <span className="text-[8px] font-bold px-1.5 py-0.5" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>PRO+</span>
        <span className="text-[9px] ml-auto" style={{ color: 'var(--outline)' }}>Fuente: {valuation.source}</span>
      </div>

      {/* Quality Score */}
      <div className="flex items-center gap-4 mb-5 p-4" style={{ background: 'var(--surface-lowest)' }}>
        <div className="text-center">
          <p className="text-3xl font-black" style={{ color: valuation.quality_score >= 70 ? '#16a34a' : valuation.quality_score >= 40 ? '#d97706' : '#dc2626' }}>{valuation.quality_score}</p>
          <p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>QUALITY SCORE</p>
        </div>
        <div className="flex-1">
          <div className="h-2 mb-2" style={{ background: 'var(--surface-2)' }}>
            <div className="h-full" style={{ width: `${valuation.quality_score}%`, background: valuation.quality_score >= 70 ? '#16a34a' : '#d97706', transition: 'width 0.5s' }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {valuation.quality_drivers?.map((d, i) => (
              <span key={d.factor || i} className="text-[9px] font-bold px-2 py-1" style={{ background: d.impact === 'positivo' ? 'rgba(22,163,74,0.08)' : d.impact === 'negativo' ? 'rgba(220,38,38,0.08)' : 'var(--surface-2)', color: d.impact === 'positivo' ? '#16a34a' : d.impact === 'negativo' ? '#dc2626' : 'var(--outline)' }}>
                {d.factor}: {d.description || d.impact}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Scenarios */}
      <p className="text-[10px] font-bold mb-3" style={{ color: 'var(--on-surface)' }}>ESCENARIOS DE ENTERPRISE VALUE</p>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {Object.entries(valuation.scenarios).map(([k, sc]) => (
          <div key={k} className="p-3 text-center" style={{ background: k === 'base' ? 'var(--on-surface)' : 'var(--surface-1)', color: k === 'base' ? '#fff' : 'var(--on-surface)' }}>
            <p className="text-[9px] font-bold mb-1" style={{ opacity: 0.7 }}>{sc.label?.toUpperCase()}</p>
            <p className="text-lg font-black">{fmtMillions(sc.ev)}</p>
            <p className="text-[9px]" style={{ opacity: 0.6 }}>{sc.multiple}x EBITDA</p>
          </div>
        ))}
      </div>

      {/* Equity adjustment */}
      {valuation.equity_adjustments && (
        <div className="p-3 mb-4" style={{ background: 'var(--surface-1)' }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>AJUSTE DE EQUITY VALUE</p>
            <p className="text-sm font-black" style={{ color: valuation.equity_adjustments.net_debt < 0 ? '#16a34a' : '#dc2626' }}>
              {valuation.equity_adjustments.net_debt < 0 ? '+' : ''}{fmtES(Math.abs(valuation.equity_adjustments.net_debt), 0)} EUR
            </p>
          </div>
          <p className="text-[10px]" style={{ color: 'var(--outline)', lineHeight: 1.5 }}>
            {valuation.equity_adjustments.net_debt < 0
              ? `Posición de caja neta: el activo corriente supera los pasivos en ${fmtES(Math.abs(valuation.equity_adjustments.net_debt), 0)} EUR. Esto incrementa el Equity Value respecto al Enterprise Value.`
              : `Deuda neta de ${fmtES(valuation.equity_adjustments.net_debt, 0)} EUR que se resta del Enterprise Value para obtener el Equity Value.`}
          </p>
        </div>
      )}

      {/* Parameters */}
      <div className="p-3 mb-4" style={{ background: 'var(--surface-1)' }}>
        <p className="text-[9px] font-bold mb-2" style={{ color: 'var(--outline)' }}>PARAMETROS UTILIZADOS</p>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="flex justify-between"><span style={{ color: 'var(--outline)' }}>EBITDA base</span><span className="font-bold">{fmtES(valuation.parameters.ebitda_base, 0)} EUR</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--outline)' }}>Tipo</span><span className="font-bold">{valuation.parameters.ebitda_type}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--outline)' }}>Categoria</span><span className="font-bold">{valuation.parameters.category}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--outline)' }}>Multiplos</span><span className="font-bold">{valuation.parameters.multiple_range.min}x — {valuation.parameters.multiple_range.max}x</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--outline)' }}>Quality factor</span><span className="font-bold">{valuation.parameters.quality_factor}x</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--outline)' }}>Metodo</span><span className="font-bold">{valuation.parameters.method}</span></div>
        </div>
      </div>

      {/* Methodology expandable */}
      <details className="text-[10px]">
        <summary className="font-bold cursor-pointer py-2" style={{ color: 'var(--arroba-primary)' }}>VER METODOLOGIA Y DEFINICIONES</summary>
        <div className="mt-2 space-y-3">
          {valuation.methodology.steps.map((s, i) => (
            <div key={s.step || i} className="flex gap-2">
              <span className="font-bold shrink-0 w-5 text-right" style={{ color: 'var(--arroba-primary)' }}>{i+1}.</span>
              <div><p className="font-bold">{s.step}</p><p style={{ color: 'var(--outline)', lineHeight: 1.5 }}>{s.description}</p></div>
            </div>
          ))}
          <div className="pt-2 mt-2" style={{ borderTop: '1px solid var(--surface-2)' }}>
            <p className="font-bold mb-2">DEFINICIONES</p>
            {Object.entries(valuation.methodology.definitions).map(([term, def_]) => (
              <div key={term} className="mb-1"><span className="font-bold">{term}:</span> <span style={{ color: 'var(--outline)' }}>{def_}</span></div>
            ))}
          </div>
          <p className="mt-2 p-2" style={{ background: 'var(--surface-1)', color: 'var(--outline)', lineHeight: 1.5 }}>{valuation.methodology.disclaimer}</p>
        </div>
      </details>
    </div>
  );
};

/* ═══ Premium AI Block ═══ */
export const PremiumAiBlock = ({ analysis, loading }) => {
  if (!analysis?.available && !loading) return null;
  return (
    <div className="p-5 mb-6" style={{ background: 'rgba(182,33,42,0.02)', borderLeft: '3px solid var(--arroba-primary)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
      <div className="flex items-center gap-2 mb-4">
        <p className="label-arroba" style={{ color: 'var(--arroba-primary)' }}>INTERPRETACIÓN PREMIUM IA</p>
        <span className="text-[8px] font-bold px-1.5 py-0.5" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>GPT-5.2</span>
        {loading && <Loader2 size={12} className="animate-spin ml-auto" style={{ color: 'var(--arroba-primary)' }} />}
      </div>
      {loading && <p className="text-xs" style={{ color: 'var(--outline)' }}>Generando analisis premium...</p>}
      {analysis?.strategic_reading && (
        <p className="text-sm mb-4 p-3" style={{ color: 'var(--on-surface)', lineHeight: 1.7, background: 'var(--surface-1)' }}>{analysis.strategic_reading}</p>
      )}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.strengths?.length > 0 && (
            <div><p className="text-[10px] font-bold mb-2" style={{ color: '#16a34a' }}>FORTALEZAS</p>{analysis.strengths.map((s, i) => <p key={`str-${i}`} className="text-xs mb-1.5" style={{ color: 'var(--on-surface)', lineHeight: 1.5 }}>+ {s}</p>)}</div>
          )}
          {analysis.risks?.length > 0 && (
            <div><p className="text-[10px] font-bold mb-2" style={{ color: '#dc2626' }}>RIESGOS</p>{analysis.risks.map((r, i) => <p key={`risk-${i}`} className="text-xs mb-1.5" style={{ color: 'var(--on-surface)', lineHeight: 1.5 }}>! {r}</p>)}</div>
          )}
        </div>
      )}
      {analysis?.dd_questions?.length > 0 && (
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--surface-2)' }}>
          <p className="text-[10px] font-bold mb-2" style={{ color: 'var(--arroba-primary)' }}>PREGUNTAS SUGERIDAS PARA DUE DILIGENCE</p>
          {analysis.dd_questions.map((q, i) => <p key={`dd-${i}`} className="text-xs mb-1.5" style={{ color: 'var(--on-surface)', lineHeight: 1.5 }}>{i+1}. {q}</p>)}
        </div>
      )}
      {analysis?.buyer_fit?.ideal_profile && (
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--surface-2)' }}>
          <p className="text-[10px] font-bold mb-1" style={{ color: 'var(--outline)' }}>PERFIL DE COMPRADOR IDEAL</p>
          <p className="text-xs" style={{ color: 'var(--on-surface)', lineHeight: 1.5 }}>{analysis.buyer_fit.ideal_profile}</p>
        </div>
      )}
    </div>
  );
};
