'use client';
/**
 * @componentId COMP-P-0003
 * @status PROVISIONAL
 * @section Perfil
 * @source ce-sections1.jsx (grid 4 KPIs: Ventas, EBITDA, Beneficio neto, Empleados)
 * @endpoints POST /api/v1/financial-intelligence/analyze + POST /api/v2/company-intelligence/identity
 * @acc_pending Pendiente de ratificación en ACC v0.2 (contradicción C2)
 *
 * COMP-P-0003 Primary KPIs Grid — 4 tarjetas KPI del Resumen del ZIP.
 *
 * NO calcula variaciones ni márgenes (R4). Sólo pinta lo que el proveedor
 * entrega. Si un KPI no está disponible se muestra "—" en su celda.
 */
import { Tooltip } from '@/components/ds';
import { cn } from '@/lib/cn';
import type {
  FinancialSection,
  IdentitySection,
} from '@/lib/companies/intelligence-types';
import { formatCurrencyEs, formatIntegerEs } from '../_lib/format';
import { PERFIL_TESTIDS } from '../_lib/testids';

export interface PrimaryKpisGridProps {
  identity: IdentitySection;
  financial: FinancialSection | null;
}

function extractLatest(financial: FinancialSection | null, key: string): number | null {
  if (!financial?.evolution) return null;
  const series = financial.evolution.series.find((s) => s.key === key);
  if (!series || series.values.length === 0) return null;
  for (let i = series.values.length - 1; i >= 0; i--) {
    const v = series.values[i];
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
  }
  return null;
}

function lastYear(financial: FinancialSection | null): number | null {
  if (!financial?.evolution?.years?.length) return null;
  return financial.evolution.years[financial.evolution.years.length - 1] ?? null;
}

export function PrimaryKpisGrid({ identity, financial }: PrimaryKpisGridProps) {
  const revenue = extractLatest(financial, 'revenue');
  const ebitda = extractLatest(financial, 'ebitda');
  const netIncome = extractLatest(financial, 'net_income');
  const employees = identity.size.employees_total;
  const year = lastYear(financial);
  const source =
    financial?.metadata.source ?? identity.metadata.source ?? undefined;
  const updated =
    financial?.metadata.updated_at ?? identity.metadata.updated_at ?? undefined;

  const kpis: Array<{
    key: string;
    label: string;
    value: string;
    sub?: string;
    tooltip: string;
  }> = [
    {
      key: 'revenue',
      label: 'Ventas',
      value: formatCurrencyEs(revenue, { compact: true }),
      sub: year ? `Ejercicio ${year}` : undefined,
      tooltip: 'Ingresos declarados en la cuenta de resultados.',
    },
    {
      key: 'ebitda',
      label: 'EBITDA',
      value: formatCurrencyEs(ebitda, { compact: true }),
      sub: year ? `Ejercicio ${year}` : undefined,
      tooltip: 'Resultado bruto de explotación entregado por el proveedor.',
    },
    {
      key: 'net-income',
      label: 'Beneficio neto',
      value: formatCurrencyEs(netIncome, { compact: true }),
      sub: year ? `Ejercicio ${year}` : undefined,
      tooltip: 'Beneficio neto del ejercicio.',
    },
    {
      key: 'employees',
      label: 'Empleados',
      value: formatIntegerEs(employees),
      sub: 'Plantilla total declarada',
      tooltip: 'Plantilla total declarada por la empresa.',
    },
  ];

  return (
    <section
      data-testid={PERFIL_TESTIDS.primaryKpis}
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      aria-label="KPIs primarios de la empresa"
    >
      {kpis.map((kpi) => (
        <Tooltip
          key={kpi.key}
          content={{
            description: kpi.tooltip,
            source,
            updated_at: updated,
          }}
        >
          <div
            data-testid={`${PERFIL_TESTIDS.primaryKpis}-${kpi.key}`}
            className={cn(
              'rounded-xl border border-border-default bg-surface-elevated p-4',
              'transition-colors duration-fast hover:border-border-emphasis',
            )}
            tabIndex={0}
          >
            <div className="text-caption uppercase tracking-caption font-semibold text-text-muted">
              {kpi.label}
            </div>
            <div className="mt-1 font-display text-h3 font-extrabold text-text-primary tabular-nums leading-none">
              {kpi.value}
            </div>
            {kpi.sub && (
              <div className="mt-1 text-caption text-text-muted">{kpi.sub}</div>
            )}
          </div>
        </Tooltip>
      ))}
    </section>
  );
}
