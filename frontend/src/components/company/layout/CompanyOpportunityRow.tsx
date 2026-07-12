'use client';
/**
 * CompanyOpportunityRow (F0.1b · layout container · sin COMP-ID).
 *
 * Reproduce la fila 2 del Company Header del ZIP (ce-app.jsx):
 *   flex align-center gap=20 mt=18 pt=18 border-top:1px
 *   - Chip "+OPORTUNIDADES" (leading)
 *   - Chips categorías con ✓ prefix ("Buy & Build", "Captación de capital", "Entrada de socio")
 *   - CTA primaria roja "+ Activar oportunidad"
 *   - CTA secundaria "Reclamar empresa"
 *
 * F0.1b: sin datos reales del motor de Oportunidades (F0.10). Se renderiza con
 * las 3 categorías del ZIP mock. Los click handlers están vacíos.
 */
import { Check, Plus } from 'lucide-react';

const OPPORTUNITY_TAGS: Array<string> = [
  'Buy & Build',
  'Captación de capital',
  'Entrada de socio',
];

export function CompanyOpportunityRow() {
  return (
    <div
      data-testid="ficha-opportunity-row"
      className="flex items-center flex-wrap"
      style={{
        gap: '16px',
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid var(--border-default, rgba(0,0,0,0.08))',
      }}
    >
      <div className="flex items-center flex-wrap" style={{ gap: '8px', flex: '1 1 0%' }}>
        <span
          data-testid="opp-lead"
          className="inline-flex items-center"
          style={{
            gap: '6px',
            fontSize: '12.5px',
            fontWeight: 700,
            color: '#E8001D',
            letterSpacing: '0.03em',
          }}
        >
          <Plus size={12} strokeWidth={3} aria-hidden />
          OPORTUNIDADES
        </span>
        {OPPORTUNITY_TAGS.map((label) => (
          <span
            key={label}
            data-testid={`opp-tag-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`}
            className="inline-flex items-center"
            style={{
              gap: '6px',
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--text-primary, #101010)',
              padding: '4px 10px',
              borderRadius: '999px',
              background: 'var(--surface-elevated, #FFFFFF)',
              border: '1px solid var(--border-default, rgba(0,0,0,0.08))',
            }}
          >
            <Check size={11} strokeWidth={3} color="#16A34A" aria-hidden />
            {label}
          </span>
        ))}
      </div>
      <div className="flex items-center" style={{ gap: '8px' }}>
        <button
          type="button"
          data-testid="opp-cta-activate"
          className="inline-flex items-center"
          style={{
            gap: '6px',
            padding: '9px 16px',
            borderRadius: '10px',
            background: '#E8001D',
            color: '#FFFFFF',
            fontSize: '13.5px',
            fontWeight: 700,
            border: '1px solid #E8001D',
          }}
        >
          <Plus size={13} strokeWidth={3} aria-hidden />
          Activar oportunidad
        </button>
        <button
          type="button"
          data-testid="opp-cta-claim"
          style={{
            padding: '9px 16px',
            borderRadius: '10px',
            background: 'var(--surface-elevated, #FFFFFF)',
            color: 'var(--text-primary, #101010)',
            fontSize: '13.5px',
            fontWeight: 700,
            border: '1px solid var(--border-default, rgba(0,0,0,0.08))',
          }}
        >
          Reclamar empresa
        </button>
      </div>
    </div>
  );
}
