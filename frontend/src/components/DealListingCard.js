import React from 'react';
import { Link } from 'react-router-dom';
import { fmtES, fmtMillions } from '../utils/formatES';
import { Building2, Lock, ArrowRight, Star, Shield } from 'lucide-react';

export const DealListingCard = ({ deal, presentation, onContact }) => {
  if (!presentation) return null;

  const { deal_summary, visual_mode, card_only, buyer_tier, primary_cta, visibility_state, content_richness_score } = presentation;
  const isLocked = card_only;
  const isPremium = buyer_tier === 'pro+';

  return (
    <div
      className="group relative transition-all duration-200"
      style={{
        background: 'var(--surface-lowest)',
        border: isLocked ? '1px solid var(--surface-2)' : '1px solid transparent',
        boxShadow: '0 2px 8px rgba(25,28,30,0.04)',
      }}
      data-testid={`deal-card-${deal.deal_id}`}
    >
      {isPremium && (
        <div className="absolute top-0 right-0 px-2 py-1 text-[9px] font-bold" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>
          PRO+
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--outline)', letterSpacing: '0.05em' }}>
              {deal_summary?.sector || 'Agencia digital'}
            </p>
            <h3 className="text-base font-bold" style={{ color: 'var(--on-surface)' }}>
              {deal_summary?.title || 'Oportunidad confidencial'}
            </h3>
          </div>
          <span className="text-[9px] font-bold px-2 py-0.5" style={{ background: visual_mode === 'rich' ? 'rgba(22,163,74,0.06)' : 'var(--surface-2)', color: visual_mode === 'rich' ? '#16a34a' : 'var(--outline)' }}>
            {visual_mode?.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {deal_summary?.city && (
            <div>
              <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>UBICACION</p>
              <p className="text-xs font-semibold" style={{ color: 'var(--on-surface)' }}>{deal_summary.city}</p>
            </div>
          )}
          {deal_summary?.revenue && !isLocked && (
            <div>
              <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>FACTURACION</p>
              <p className="text-xs font-semibold" style={{ color: 'var(--on-surface)' }}>{fmtMillions(deal_summary.revenue)}</p>
            </div>
          )}
          {deal_summary?.ebitda && !isLocked && (
            <div>
              <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>EBITDA</p>
              <p className="text-xs font-semibold" style={{ color: 'var(--on-surface)' }}>{fmtMillions(deal_summary.ebitda)}</p>
            </div>
          )}
          {deal_summary?.employees_range && (
            <div>
              <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>EMPLEADOS</p>
              <p className="text-xs font-semibold" style={{ color: 'var(--on-surface)' }}>{deal_summary.employees_range}</p>
            </div>
          )}
        </div>

        {isLocked && (
          <div className="flex items-center gap-2 p-3 mb-4" style={{ background: 'var(--surface-1)' }}>
            <Lock size={12} style={{ color: 'var(--outline)' }} />
            <p className="text-[10px]" style={{ color: 'var(--outline)' }}>Solicita contacto para ver mas detalles sobre esta oportunidad.</p>
          </div>
        )}

        <div className="flex items-center gap-2">
          {primary_cta?.action === 'contact_request' && (
            <button
              onClick={() => onContact?.(deal.deal_id)}
              className="flex-1 py-2.5 text-[11px] font-bold flex items-center justify-center gap-2"
              style={{ background: primary_cta.style === 'primary_premium' ? 'var(--arroba-primary)' : 'var(--on-surface)', color: '#fff' }}
              data-testid={`deal-cta-${deal.deal_id}`}
            >
              {primary_cta.label} <ArrowRight size={11} />
            </button>
          )}
          {primary_cta?.action === 'wait' && (
            <div className="flex-1 py-2.5 text-[11px] font-bold text-center" style={{ background: 'var(--surface-2)', color: 'var(--outline)' }}>
              {primary_cta.label}
            </div>
          )}
          {primary_cta?.action === 'view_teaser' && (
            <Link to={`/explorar/${deal.deal_id}`} className="flex-1 py-2.5 text-[11px] font-bold flex items-center justify-center gap-2" style={{ background: 'var(--on-surface)', color: '#fff' }}>
              {primary_cta.label} <ArrowRight size={11} />
            </Link>
          )}
          {primary_cta?.action === 'sign_nda' && (
            <Link to={`/explorar/${deal.deal_id}?action=nda`} className="flex-1 py-2.5 text-[11px] font-bold flex items-center justify-center gap-2" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>
              <Shield size={11} /> {primary_cta.label}
            </Link>
          )}
          {primary_cta?.action === 'view_infomemo' && (
            <Link to={`/explorar/${deal.deal_id}`} className="flex-1 py-2.5 text-[11px] font-bold flex items-center justify-center gap-2" style={{ background: isPremium ? 'var(--arroba-primary)' : 'var(--on-surface)', color: '#fff' }}>
              {primary_cta.label} <ArrowRight size={11} />
            </Link>
          )}
        </div>
      </div>

      {content_richness_score != null && (
        <div className="px-5 pb-3">
          <div className="w-full h-0.5" style={{ background: 'var(--surface-2)' }}>
            <div className="h-full" style={{ background: content_richness_score >= 65 ? '#16a34a' : content_richness_score >= 35 ? '#d97706' : 'var(--outline)', width: `${content_richness_score}%`, transition: 'width 0.3s' }} />
          </div>
        </div>
      )}
    </div>
  );
};
