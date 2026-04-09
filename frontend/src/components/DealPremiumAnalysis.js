import React from 'react';
import { Star, TrendingUp, AlertTriangle, HelpCircle, Target } from 'lucide-react';

export const DealPremiumAnalysis = ({ analysis }) => {
  if (!analysis) {
    return (
      <div className="p-5" style={{ background: 'rgba(182,33,42,0.02)', borderLeft: '3px solid var(--arroba-primary)' }} data-testid="deal-premium-placeholder">
        <p className="label-arroba mb-2" style={{ color: 'var(--arroba-primary)' }}>ANALISIS PREMIUM PRO+</p>
        <p className="text-xs" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>
          El analisis IA de esta oportunidad se generara en la Fase 4 del Orquestador.
          Incluira: fortalezas, riesgos, preguntas sugeridas para DD y encaje con tu tesis de inversion.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="deal-premium-analysis">
      <div className="p-5" style={{ background: 'rgba(182,33,42,0.02)', borderLeft: '3px solid var(--arroba-primary)' }}>
        <p className="label-arroba mb-3" style={{ color: 'var(--arroba-primary)' }}>ANALISIS PREMIUM PRO+</p>

        {analysis.strengths?.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-bold flex items-center gap-1 mb-2" style={{ color: '#16a34a' }}>
              <Star size={10} /> FORTALEZAS
            </p>
            <ul className="space-y-1">
              {analysis.strengths.map((s, i) => (
                <li key={i} className="text-xs" style={{ color: 'var(--on-surface)', lineHeight: 1.5 }}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {analysis.risks?.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-bold flex items-center gap-1 mb-2" style={{ color: '#dc2626' }}>
              <AlertTriangle size={10} /> RIESGOS
            </p>
            <ul className="space-y-1">
              {analysis.risks.map((r, i) => (
                <li key={i} className="text-xs" style={{ color: 'var(--on-surface)', lineHeight: 1.5 }}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {analysis.dd_questions?.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-bold flex items-center gap-1 mb-2" style={{ color: 'var(--arroba-primary)' }}>
              <HelpCircle size={10} /> PREGUNTAS SUGERIDAS PARA DD
            </p>
            <ul className="space-y-1">
              {analysis.dd_questions.map((q, i) => (
                <li key={i} className="text-xs" style={{ color: 'var(--on-surface)', lineHeight: 1.5 }}>{q}</li>
              ))}
            </ul>
          </div>
        )}

        {analysis.thesis_fit && (
          <div>
            <p className="text-[10px] font-bold flex items-center gap-1 mb-2" style={{ color: 'var(--arroba-blue, #006493)' }}>
              <Target size={10} /> ENCAJE CON TU TESIS
            </p>
            <p className="text-xs" style={{ color: 'var(--on-surface)', lineHeight: 1.6 }}>{analysis.thesis_fit}</p>
          </div>
        )}
      </div>
    </div>
  );
};
