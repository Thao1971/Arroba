import React from 'react';
import { Lock, ArrowRight, Shield } from 'lucide-react';

export const DealPreContactPage = ({ presentation, onContact, contactLoading }) => {
  if (!presentation) return null;

  const { deal_summary, primary_cta, visual_mode, content_richness_score, modules_visible } = presentation;

  return (
    <div className="max-w-2xl mx-auto space-y-6" data-testid="deal-pre-contact">
      <div className="text-center p-8" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 12px rgba(25,28,30,0.04)' }}>
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--surface-1)' }}>
          <Shield size={24} style={{ color: 'var(--outline)' }} />
        </div>
        <h2 className="text-xl font-extrabold mb-2" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
          {deal_summary?.title || 'Oportunidad confidencial'}
        </h2>
        <p className="text-xs mb-1" style={{ color: 'var(--outline)' }}>{deal_summary?.sector}</p>
        {deal_summary?.city && <p className="text-xs" style={{ color: 'var(--outline)' }}>{deal_summary.city}</p>}
      </div>

      <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Lock size={14} style={{ color: 'var(--outline)' }} />
          <p className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>Informacion protegida</p>
        </div>
        <p className="text-xs" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>
          Esta oportunidad requiere una solicitud de contacto previa. El vendedor revisara tu perfil y decidira si te da acceso al teaser anonimizado.
        </p>
      </div>

      {modules_visible?.includes('description') && deal_summary?.description && (
        <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
          <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>RESUMEN PUBLICO</p>
          <p className="text-sm" style={{ color: 'var(--on-surface)', lineHeight: 1.7 }}>{deal_summary.description}</p>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={onContact}
          disabled={contactLoading || primary_cta?.style === 'disabled'}
          className="px-8 py-3 text-xs font-bold flex items-center gap-2 mx-auto disabled:opacity-50"
          style={{ background: 'var(--on-surface)', color: '#fff' }}
          data-testid="pre-contact-cta"
        >
          {contactLoading ? 'Enviando...' : primary_cta?.label || 'Contactar'}
          {!contactLoading && <ArrowRight size={12} />}
        </button>
        {primary_cta?.description && (
          <p className="text-[10px] mt-2" style={{ color: 'var(--outline)' }}>{primary_cta.description}</p>
        )}
      </div>
    </div>
  );
};
