import React from 'react';
import { fmtMillions } from '../utils/formatES';
import { Building2, MapPin, Users, TrendingUp, BarChart3, Briefcase, FileText, Shield, Star } from 'lucide-react';

const SECTION_ICONS = {
  hero: Building2,
  description: FileText,
  taxonomy: Briefcase,
  financials_summary: BarChart3,
  financials_detail: BarChart3,
  charts: TrendingUp,
  qualitative: Star,
  valuation: TrendingUp,
  operation: Briefcase,
  highlights: Star,
  infomemo: FileText,
  dataroom: Shield,
};

export const DealTeaserPage = ({ presentation, deal }) => {
  if (!presentation) return null;

  const { deal_summary, layout, modules_visible, visibility_state, visual_mode } = presentation;
  const sections = layout?.sections || [];

  return (
    <div className="space-y-6" data-testid="deal-teaser-page">
      {sections.map(section => {
        const Icon = SECTION_ICONS[section] || FileText;

        if (section === 'hero') {
          return (
            <div key={section} className="p-6" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 12px rgba(25,28,30,0.04)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="label-arroba mb-2" style={{ color: 'var(--arroba-primary)' }}>
                    {deal_summary?.sector || 'OPORTUNIDAD'}
                  </p>
                  <h1 className="text-2xl font-extrabold mb-2" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
                    {deal_summary?.title}
                  </h1>
                  <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--outline)' }}>
                    {deal_summary?.city && <span className="flex items-center gap-1"><MapPin size={11} />{deal_summary.city}</span>}
                    {deal_summary?.employees_range && <span className="flex items-center gap-1"><Users size={11} />{deal_summary.employees_range} empleados</span>}
                  </div>
                </div>
                <span className="text-[9px] font-bold px-2 py-1" style={{ background: visual_mode === 'rich' ? 'rgba(22,163,74,0.06)' : 'var(--surface-2)', color: visual_mode === 'rich' ? '#16a34a' : 'var(--outline)' }}>
                  {visual_mode?.toUpperCase()}
                </span>
              </div>
            </div>
          );
        }

        if (section === 'description' && modules_visible?.includes('description')) {
          return (
            <div key={section} className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>DESCRIPCION</p>
              <p className="text-sm" style={{ color: 'var(--on-surface)', lineHeight: 1.7 }}>
                {deal_summary?.description || deal?.teaser?.description || 'Informacion disponible tras verificacion de acceso.'}
              </p>
            </div>
          );
        }

        if (section === 'taxonomy' && modules_visible?.includes('taxonomy')) {
          return (
            <div key={section} className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>SECTOR Y ACTIVIDAD</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>{deal_summary?.sector}</p>
            </div>
          );
        }

        if ((section === 'financials_summary' || section === 'financials_detail') && modules_visible?.some(m => m.startsWith('financials_'))) {
          return (
            <div key={section} className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>METRICAS FINANCIERAS</p>
              <div className="grid grid-cols-2 gap-4">
                {deal_summary?.revenue && (
                  <div>
                    <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>FACTURACION {deal_summary?.year}</p>
                    <p className="text-xl font-black" style={{ color: 'var(--on-surface)' }}>{fmtMillions(deal_summary.revenue)}</p>
                  </div>
                )}
                {deal_summary?.ebitda && (
                  <div>
                    <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>EBITDA {deal_summary?.year}</p>
                    <p className="text-xl font-black" style={{ color: 'var(--on-surface)' }}>{fmtMillions(deal_summary.ebitda)}</p>
                  </div>
                )}
                {deal_summary?.asking_price && (
                  <div>
                    <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>PRECIO ORIENTATIVO</p>
                    <p className="text-xl font-black" style={{ color: 'var(--arroba-primary)' }}>{fmtMillions(deal_summary.asking_price)}</p>
                  </div>
                )}
                {deal_summary?.valuation_range && (
                  <div>
                    <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>VALORACION ESTIMADA</p>
                    <p className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>
                      {fmtMillions(deal_summary.valuation_range.min)} — {fmtMillions(deal_summary.valuation_range.max)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        }

        if (section === 'valuation' && modules_visible?.includes('valuation')) {
          return (
            <div key={section} className="p-5" style={{ background: 'var(--surface-lowest)', borderLeft: '3px solid var(--arroba-primary)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-2" style={{ color: 'var(--arroba-primary)' }}>VALORACION</p>
              {deal_summary?.valuation_range ? (
                <p className="text-lg font-black" style={{ color: 'var(--arroba-primary)' }}>
                  {fmtMillions(deal_summary.valuation_range.min)} — {fmtMillions(deal_summary.valuation_range.max)}
                </p>
              ) : (
                <p className="text-xs" style={{ color: 'var(--outline)' }}>Disponible tras avanzar en el proceso.</p>
              )}
            </div>
          );
        }

        if (section === 'operation' && modules_visible?.includes('operation_types')) {
          return (
            <div key={section} className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>TIPO DE OPERACION</p>
              <div className="flex flex-wrap gap-2">
                {(deal?.operation_types_allowed || []).map(t => (
                  <span key={t} className="px-3 py-1 text-[10px] font-bold" style={{ background: 'var(--surface-2)', color: 'var(--on-surface)' }}>
                    {t.replace(/_/g, ' ').toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          );
        }

        if (section === 'highlights' && modules_visible?.includes('highlights_ia')) {
          return (
            <div key={section} className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>ASPECTOS DESTACADOS</p>
              <p className="text-xs" style={{ color: 'var(--on-surface)' }}>Generados por IA a partir de los datos del activo.</p>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};
