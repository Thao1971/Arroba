import React from 'react';
import { ArrowRight, Lock, Star, Shield, Clock, CheckCircle2 } from 'lucide-react';

const STATE_CONFIG = {
  LOCKED_CONTACT_REQUIRED: { icon: Lock, label: 'Contacto requerido', color: 'var(--outline)' },
  CONTACT_REQUESTED: { icon: Clock, label: 'Solicitud pendiente', color: '#d97706' },
  CONTACT_ACCEPTED: { icon: CheckCircle2, label: 'Contacto aceptado', color: '#16a34a' },
  TEASER_UNLOCKED: { icon: CheckCircle2, label: 'Teaser disponible', color: '#16a34a' },
  NDA_AVAILABLE: { icon: Shield, label: 'NDA disponible', color: 'var(--arroba-primary)' },
  NDA_SIGNED: { icon: CheckCircle2, label: 'NDA firmado', color: '#16a34a' },
  OPERATIVE_ACCESS: { icon: Star, label: 'Acceso operativo', color: '#16a34a' },
};

export const DealActionPanel = ({ presentation, onContact, onAction }) => {
  if (!presentation) return null;

  const { visibility_state, primary_cta, secondary_cta, allowed_actions, locked_actions, upgrade_prompts, buyer_tier } = presentation;
  const stateConfig = STATE_CONFIG[visibility_state] || STATE_CONFIG.LOCKED_CONTACT_REQUIRED;
  const StateIcon = stateConfig.icon;

  return (
    <div className="space-y-4" data-testid="deal-action-panel">
      <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
        <div className="flex items-center gap-2 mb-3">
          <StateIcon size={14} style={{ color: stateConfig.color }} />
          <span className="text-xs font-bold" style={{ color: stateConfig.color }}>{stateConfig.label}</span>
          <span className="ml-auto text-[9px] font-bold px-2 py-0.5" style={{ background: 'var(--surface-2)', color: 'var(--outline)' }}>
            {buyer_tier?.toUpperCase()}
          </span>
        </div>

        {primary_cta && (
          <button
            onClick={() => {
              if (primary_cta.action === 'contact_request') onContact?.();
              else onAction?.(primary_cta.action);
            }}
            disabled={primary_cta.style === 'disabled'}
            className="w-full py-3 text-[11px] font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            style={{
              background: primary_cta.style === 'disabled' ? 'var(--surface-2)' : primary_cta.style === 'primary_premium' ? 'var(--arroba-primary)' : 'var(--on-surface)',
              color: primary_cta.style === 'disabled' ? 'var(--outline)' : '#fff',
            }}
            data-testid="deal-primary-cta"
          >
            {primary_cta.label} {primary_cta.style !== 'disabled' && <ArrowRight size={11} />}
          </button>
        )}

        {primary_cta?.description && (
          <p className="text-[10px] mt-2" style={{ color: 'var(--outline)', lineHeight: 1.5 }}>
            {primary_cta.description}
          </p>
        )}

        {secondary_cta && (
          <button
            onClick={() => onAction?.(secondary_cta.action)}
            className="w-full py-2 mt-2 text-[10px] font-bold"
            style={{ background: 'var(--surface-2)', color: 'var(--on-surface)' }}
            data-testid="deal-secondary-cta"
          >
            {secondary_cta.label}
          </button>
        )}
      </div>

      {upgrade_prompts?.length > 0 && (
        <div className="p-4" style={{ background: 'rgba(182,33,42,0.03)', borderLeft: '3px solid var(--arroba-primary)' }}>
          {upgrade_prompts.map((up, i) => (
            <div key={i} className="mb-2 last:mb-0">
              <p className="text-[10px] font-semibold" style={{ color: 'var(--arroba-primary)' }}>{up.message}</p>
              <button className="mt-1 text-[10px] font-bold underline" style={{ color: 'var(--arroba-primary)' }} onClick={() => onAction?.('upgrade')}>
                VER PLANES
              </button>
            </div>
          ))}
        </div>
      )}

      {locked_actions?.length > 0 && (
        <div className="p-3" style={{ background: 'var(--surface-1)' }}>
          <p className="text-[9px] font-bold mb-1" style={{ color: 'var(--outline)' }}>REQUIERE AVANZAR</p>
          <div className="flex flex-wrap gap-1">
            {locked_actions.map(a => (
              <span key={a} className="px-2 py-0.5 text-[8px] font-bold flex items-center gap-1" style={{ background: 'var(--surface-2)', color: 'var(--outline)' }}>
                <Lock size={8} /> {a.replace(/_/g, ' ').toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
