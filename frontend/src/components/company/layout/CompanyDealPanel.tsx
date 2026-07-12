'use client';
/**
 * CompanyDealPanel (F0.1b · layout container · sin COMP-ID).
 *
 * Reproduce el panel derecho del ZIP (`ce-deal.jsx` · CEDeal). 3 sub-cards
 * verticales:
 *   1. Escenario (select · "En venta" · demo)
 *   2. OPERACIÓN ACTIVA (badge + copy + ficha de proceso)
 *   3. ACCIONES (3 botones: Descargar NDA · Solicitar cuaderno · Hacer match)
 *   4. PROCESO (timeline vertical con fases y estados)
 *
 * En F0.1b los datos reales del Deal Engine V2 no existen (C7). Se renderiza
 * con copy del ZIP mock (`ce-data.js` · deal block). Botones sin handlers.
 */
import { ChevronDown, ArrowRight, Handshake, FileDown, Mail } from 'lucide-react';

const DEAL_SCENARIOS = ['En venta', 'Buy & Build', 'Captación de capital', 'Entrada de socio'];

const PROCESS_STEPS: Array<{ label: string; state: 'done' | 'current' | 'pending' }> = [
  { label: 'Mandato firmado', state: 'done' },
  { label: 'Teaser disponible', state: 'done' },
  { label: 'Firma de NDA', state: 'current' },
  { label: 'Cuaderno de venta', state: 'pending' },
  { label: 'Ofertas indicativas', state: 'pending' },
  { label: 'Due diligence', state: 'pending' },
  { label: 'Cierre', state: 'pending' },
];

function EyebrowLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-secondary, #6B6B6B)',
        marginBottom: '8px',
      }}
    >
      {children}
    </div>
  );
}

export function CompanyDealPanel() {
  return (
    <aside
      data-testid="ficha-deal-panel"
      className="sticky self-start flex flex-col"
      style={{
        top: '78px',
        gap: '16px',
        maxHeight: 'calc(100vh - 96px)',
        overflowY: 'auto',
      }}
      aria-label="Panel de operación"
    >
      {/* Escenario · demo select */}
      <div data-testid="deal-panel-scenario">
        <EyebrowLabel>Escenario · demo</EyebrowLabel>
        <div
          className="flex items-center justify-between"
          style={{
            border: '1px solid var(--border-default, rgba(0,0,0,0.08))',
            background: 'var(--surface-elevated, #FFFFFF)',
            padding: '9px 12px',
            borderRadius: '10px',
            fontSize: '13.5px',
            fontWeight: 600,
            color: 'var(--text-primary, #101010)',
          }}
        >
          <span>{DEAL_SCENARIOS[0]}</span>
          <ChevronDown size={14} aria-hidden />
        </div>
      </div>

      {/* Operación activa card */}
      <div
        data-testid="deal-panel-active-op"
        style={{
          border: '1px solid var(--border-default, rgba(0,0,0,0.08))',
          background: 'var(--surface-elevated, #FFFFFF)',
          borderRadius: '14px',
          padding: '16px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        }}
      >
        <div className="flex items-center" style={{ gap: '8px', marginBottom: '4px' }}>
          <span
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              background: '#E8001D',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}
            aria-hidden
          >
            <Handshake size={12} strokeWidth={2.5} />
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-secondary, #6B6B6B)',
            }}
          >
            Operación activa
          </span>
        </div>
        <div
          className="font-display"
          style={{
            fontSize: '20px',
            fontWeight: 900,
            color: 'var(--text-primary, #101010)',
            marginBottom: '8px',
          }}
        >
          En venta
        </div>
        <p
          style={{
            fontSize: '13px',
            lineHeight: '1.55',
            color: 'var(--text-secondary, #6B6B6B)',
            marginBottom: '14px',
          }}
        >
          El propietario ha abierto un proceso de venta / entrada de socio. Arroba coordina el acceso a la información de forma confidencial.
        </p>
        <dl className="grid grid-cols-2" style={{ gap: '10px 14px' }}>
          <div>
            <dt style={{ fontSize: '11px', color: 'var(--text-secondary, #6B6B6B)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tipo de proceso</dt>
            <dd style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary, #101010)' }}>Venta / entrada de socio</dd>
          </div>
          <div>
            <dt style={{ fontSize: '11px', color: 'var(--text-secondary, #6B6B6B)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Participación</dt>
            <dd style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary, #101010)' }}>Hasta 100%</dd>
          </div>
          <div>
            <dt style={{ fontSize: '11px', color: 'var(--text-secondary, #6B6B6B)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Asesor</dt>
            <dd style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary, #101010)' }}>Mandato Arroba</dd>
          </div>
          <div>
            <dt style={{ fontSize: '11px', color: 'var(--text-secondary, #6B6B6B)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rango orientativo</dt>
            <dd style={{ fontSize: '13px', fontWeight: 700, color: '#E8001D' }}>Pendiente de valoración →</dd>
          </div>
        </dl>
      </div>

      {/* Acciones card */}
      <div data-testid="deal-panel-actions">
        <EyebrowLabel>Acciones</EyebrowLabel>
        <div className="flex flex-col" style={{ gap: '8px' }}>
          <button
            type="button"
            className="inline-flex items-center justify-center w-full"
            style={{
              gap: '8px',
              padding: '11px 14px',
              borderRadius: '10px',
              background: '#E8001D',
              color: '#FFFFFF',
              border: '1px solid #E8001D',
              fontSize: '13.5px',
              fontWeight: 700,
            }}
            data-testid="deal-action-nda"
          >
            <FileDown size={14} aria-hidden />
            Descargar NDA
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center w-full"
            style={{
              gap: '8px',
              padding: '11px 14px',
              borderRadius: '10px',
              background: 'var(--surface-elevated, #FFFFFF)',
              color: 'var(--text-primary, #101010)',
              border: '1px solid var(--border-default, rgba(0,0,0,0.08))',
              fontSize: '13.5px',
              fontWeight: 700,
            }}
            data-testid="deal-action-cuaderno"
          >
            <ArrowRight size={14} aria-hidden />
            Solicitar cuaderno de venta
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center w-full"
            style={{
              gap: '8px',
              padding: '11px 14px',
              borderRadius: '10px',
              background: 'var(--surface-elevated, #FFFFFF)',
              color: 'var(--text-primary, #101010)',
              border: '1px solid var(--border-default, rgba(0,0,0,0.08))',
              fontSize: '13.5px',
              fontWeight: 700,
            }}
            data-testid="deal-action-match"
          >
            <Mail size={14} aria-hidden />
            Hacer match con el vendedor
          </button>
        </div>
      </div>

      {/* Proceso timeline card */}
      <div data-testid="deal-panel-process">
        <EyebrowLabel>Proceso</EyebrowLabel>
        <ol className="flex flex-col" style={{ gap: '10px' }}>
          {PROCESS_STEPS.map((step) => {
            const dotColor =
              step.state === 'done' ? '#16A34A' : step.state === 'current' ? '#E8001D' : 'var(--border-default, rgba(0,0,0,0.15))';
            return (
              <li
                key={step.label}
                className="flex items-center"
                style={{ gap: '10px' }}
                data-testid={`deal-process-${step.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span
                  aria-hidden
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: step.state === 'pending' ? 'transparent' : dotColor,
                    border: step.state === 'pending' ? `2px solid ${dotColor}` : 'none',
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: '13px',
                    color:
                      step.state === 'pending'
                        ? 'var(--text-secondary, #6B6B6B)'
                        : 'var(--text-primary, #101010)',
                    fontWeight: step.state === 'current' ? 700 : 500,
                  }}
                >
                  {step.label}
                </span>
                {step.state === 'current' && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#E8001D',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Fase actual
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}
