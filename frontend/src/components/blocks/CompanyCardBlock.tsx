'use client';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * CompanyCardBlock — rich single card with the company's canonical fields.
 * Used by Analyze to anchor the company being analysed.
 */
export interface CompanyCardBlockProps {
  masterCompanyId: string;
  name: string;
  legalName?: string | null;
  cif?: string | null;
  sector?: string | null;
  region?: string | null;
  country?: string | null;
  revenue?: number | null;
  ebitda?: number | null;
  employees?: number | null;
  fiscalYear?: number | null;
  confidence?: number | null;
  testId?: string;
  className?: string;
}

function fmtEUR(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M €`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}k €`;
  return `${value.toFixed(0)} €`;
}

export function CompanyCardBlock({
  masterCompanyId,
  name,
  legalName,
  cif,
  sector,
  region,
  country,
  revenue,
  ebitda,
  employees,
  fiscalYear,
  confidence,
  testId = 'block-company-card',
  className,
}: CompanyCardBlockProps) {
  const initial = (name || legalName || '?').charAt(0).toUpperCase();
  return (
    <section
      data-testid={testId}
      data-company-id={masterCompanyId}
      className={cn(
        'rounded-xl border border-border bg-surface p-5 flex gap-4 items-start',
        className,
      )}
    >
      <span className="inline-flex w-12 h-12 rounded-xl bg-surface-2 border border-border items-center justify-center font-display font-bold text-text shrink-0 text-lg">
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Building2
            size={14}
            strokeWidth={1.6}
            className="text-text-subtle"
            aria-hidden
          />
          <h3
            data-testid={`${testId}-name`}
            className="font-display font-semibold text-base text-text truncate"
          >
            {legalName || name}
          </h3>
        </div>
        <p className="text-xs text-text-muted mb-3 truncate">
          {[sector, region, country].filter(Boolean).join(' · ') || '—'}
          {cif && (
            <>
              {' · '}
              <span className="font-mono">{cif}</span>
            </>
          )}
        </p>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-2">
          <Datum testId={`${testId}-revenue`} label="Ingresos" value={fmtEUR(revenue)} />
          <Datum testId={`${testId}-ebitda`} label="EBITDA" value={fmtEUR(ebitda)} />
          <Datum
            testId={`${testId}-employees`}
            label="Empleados"
            value={employees != null ? String(employees) : '—'}
          />
          <Datum
            testId={`${testId}-fiscal`}
            label="Año fiscal"
            value={fiscalYear != null ? String(fiscalYear) : '—'}
          />
        </dl>
        {confidence != null && (
          <p
            data-testid={`${testId}-confidence`}
            className="mt-3 text-[11px] text-text-subtle"
          >
            Confianza del dato: {Math.round((confidence || 0) * 100)}%
          </p>
        )}
      </div>
    </section>
  );
}

function Datum({
  testId,
  label,
  value,
}: {
  testId: string;
  label: string;
  value: string;
}) {
  return (
    <div data-testid={testId} className="min-w-0">
      <dt className="text-[10px] uppercase tracking-wider text-text-subtle leading-tight">
        {label}
      </dt>
      <dd className="font-mono text-sm font-semibold tabular-nums text-text leading-tight truncate">
        {value}
      </dd>
    </div>
  );
}
