'use client';
/**
 * CompanyDealBanner (F0.1b · layout container · sin COMP-ID).
 *
 * Reproduce el banner rojo superior de la ficha del ZIP (ce-app.jsx · line
 * 100-114). Cuando `deal` es null el banner **NO se renderiza**. Cuando el
 * proveedor V2 aún no expone Deal Engine (contradicción C7 · Deal Panel sin
 * COMP-ID en ACC), se muestra el banner con el copy tomado del ZIP mock.
 *
 * NOTA: en F0.1b se renderiza con datos ilustrativos coherentes con el ZIP
 * hasta que el Deal Engine V2 esté disponible. El copy exacto reproduce el
 * mock (`ce-data.js` · `deal` block).
 */
import { ArrowRight, Circle } from 'lucide-react';

export interface CompanyDealBannerProps {
  /** Cuando null no se renderiza. Cuando true muestra el copy ZIP mock. */
  active?: boolean;
  onOpenActions?: () => void;
}

export function CompanyDealBanner({ active = true, onOpenActions }: CompanyDealBannerProps) {
  if (!active) return null;
  return (
    <div
      data-testid="ficha-deal-banner"
      style={{
        background: '#E8001D',
        color: '#FFFFFF',
      }}
    >
      <div
        className="mx-auto flex items-center flex-wrap"
        style={{
          maxWidth: 'min(1760px, 95vw)',
          padding: '9px 28px',
          gap: '13px',
        }}
      >
        <span
          className="inline-flex items-center"
          style={{
            gap: '8px',
            fontSize: '12.5px',
            fontWeight: 700,
            letterSpacing: '0.02em',
          }}
          data-testid="deal-banner-label"
        >
          <Circle size={8} fill="#FFFFFF" strokeWidth={0} aria-hidden />
          EN VENTA
        </span>
        <span
          data-testid="deal-banner-message"
          style={{
            fontSize: '12.5px',
            color: 'rgba(255,255,255,0.88)',
          }}
        >
          Proceso de venta activo · esta compañía tiene una operación en curso en Arroba
        </span>
        <button
          type="button"
          onClick={onOpenActions}
          data-testid="deal-banner-cta"
          className="ml-auto inline-flex items-center"
          style={{
            gap: '6px',
            padding: '5px 13px',
            borderRadius: '7px',
            border: '1px solid rgba(255,255,255,0.4)',
            background: 'transparent',
            color: '#FFFFFF',
            fontSize: '12.5px',
            fontWeight: 700,
          }}
        >
          Ver acciones <ArrowRight size={13} aria-hidden />
        </button>
      </div>
    </div>
  );
}
