'use client';
/**
 * CompanyComposerStub (F0.1b · layout container · sin COMP-ID).
 *
 * Reproduce el placeholder visual del composer flotante del ZIP
 * (`assets/arroba-composer.js`). F0.1b sólo replica su estructura visual
 * (widget circular fixed bottom-right); la interacción real llegará con la
 * integración del Copilot arroba en un sub-sprint posterior.
 */
import { MessageSquare } from 'lucide-react';

export function CompanyComposerStub() {
  return (
    <div
      data-testid="ficha-composer-stub"
      className="fixed"
      style={{
        right: '28px',
        bottom: '28px',
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: '#E8001D',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 22px rgba(232,0,29,0.35)',
        zIndex: 400,
      }}
      role="button"
      aria-label="Abrir arroba Copilot"
    >
      <MessageSquare size={22} strokeWidth={2} />
    </div>
  );
}
