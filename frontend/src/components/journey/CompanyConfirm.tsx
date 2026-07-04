'use client';
import { Check } from 'lucide-react';
import type { DemoCompany } from '@/lib/journey/data';

export interface CompanyConfirmProps {
  company: DemoCompany;
  onConfirm: () => void;
  onReject: () => void;
}

/** Confirmation card for a picked demo company. Port of CompanyConfirm. */
export function CompanyConfirm({ company, onConfirm, onReject }: CompanyConfirmProps) {
  const rows: ReadonlyArray<readonly [string, string]> = [
    ['Razón social', company.razon],
    ['CIF', company.cif],
    ['Forma jurídica', company.forma],
    ['Sector', company.sector],
    ['Domicilio', `${company.city} (${company.province})`],
    ['Web', company.web],
  ];
  const figures: ReadonlyArray<readonly [string, string]> = [
    ['Facturación', company.revenue],
    ['EBITDA', company.ebitda],
    ['Empleados', String(company.employees)],
  ];
  return (
    <div className="animate-[journeyIn_.4s_ease_both]" data-testid="journey-company-confirm">
      <div className="border-[1.5px] border-border rounded-[16px] bg-surface overflow-hidden mb-3.5">
        <div className="flex items-center gap-3.5 px-4 py-4 border-b border-border">
          <div
            className="w-11 h-11 rounded-[11px] flex items-center justify-center text-[19px] font-extrabold text-primary font-display shrink-0"
            style={{ background: 'linear-gradient(135deg,#0C0C0E,#2E2E2C)' }}
            aria-hidden
          >
            {company.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-bold text-text font-display truncate">{company.name}</div>
            <div className="text-[12.5px] text-text-muted truncate">
              {company.sector} · {company.city}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 px-4 py-4">
          {rows.map(([k, v]) => (
            <div key={k}>
              <div className="text-[10.5px] font-bold tracking-[0.05em] uppercase text-text-subtle mb-0.5">
                {k}
              </div>
              <div className="text-[13.5px] font-semibold text-text break-words">{v}</div>
            </div>
          ))}
        </div>
        <div className="flex border-t border-border">
          {figures.map(([k, v], i) => (
            <div
              key={k}
              className={
                'flex-1 px-4 py-3 text-center ' + (i ? 'border-l border-border' : '')
              }
            >
              <div className="text-base font-extrabold text-text font-display tabular-nums">{v}</div>
              <div className="text-[11px] text-text-subtle mt-0.5">{k}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onConfirm}
          data-testid="journey-company-confirm-yes"
          className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-[11px] bg-primary text-white font-body text-[14.5px] font-bold cursor-pointer"
        >
          Sí, es esta <Check size={16} strokeWidth={2.4} />
        </button>
        <button
          type="button"
          onClick={onReject}
          data-testid="journey-company-confirm-no"
          className="px-5 h-12 rounded-[11px] border-[1.5px] border-border-strong bg-surface text-text font-body text-[14.5px] font-semibold"
        >
          No, buscar otra
        </button>
      </div>
    </div>
  );
}
