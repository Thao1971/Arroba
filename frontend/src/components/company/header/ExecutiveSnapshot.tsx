'use client';
/**
 * @componentId COMP-1005
 * @status READY (degrada a UnavailableBlock si no hay financials)
 * @section Header
 * @source ce-sections1.jsx (KPIs bajo el hero) + ce-app.jsx (chip Auditada)
 * @endpoints POST /api/v2/company-intelligence/identity + POST /api/v1/financial-intelligence/analyze
 * @acc ACC_v0.1.md §4.5 · Executive Snapshot
 *
 * COMP-1005 Executive Snapshot — snapshot de 3 KPIs financieros y de plantilla
 * en la cabecera. Sirve para orientar en <10s: cuánto factura, cuánto gana y
 * cuántas personas emplea la compañía.
 *
 * P2 · Intelligence over data: son KPIs sintéticos que remiten a Finanzas
 *       para detalle. NO calcula variaciones (R4): sólo pinta lo que el proveedor
 *       entrega vía `FinancialSection`.
 * P1 · Explainability first: cada KPI lleva Tooltip con año fiscal, fuente y
 *       actualización.
 * Si `financial` es null → `UnavailableBlock` inline degradado (pero la
 * identidad sigue visible en COMP-1001).
 */
import { Tooltip } from '@/components/ds';
import { UnavailableBlock } from '@/components/blocks/UnavailableBlock';
import { cn } from '@/lib/cn';
import type {
  FinancialSection,
  IdentitySection,
} from '@/lib/companies/intelligence-types';
import { formatCurrencyEs, formatIntegerEs } from '../_lib/format';
import { HEADER_TESTIDS } from '../_lib/testids';

export interface ExecutiveSnapshotProps {
  identity: IdentitySection;
  financial: FinancialSection | null;
}

function extractLatest(financial: FinancialSection | null, key: string): number | null {
  if (!financial?.evolution) return null;
  const series = financial.evolution.series.find((s) => s.key === key);
  if (!series || series.values.length === 0) return null;
  // último valor no nulo
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

export function ExecutiveSnapshot({
  identity,
  financial,
}: ExecutiveSnapshotProps) {
  const revenue = extractLatest(financial, 'revenue');
  const ebitda = extractLatest(financial, 'ebitda');
  const netIncome = extractLatest(financial, 'net_income');
  const employees = identity.size.employees_total;
  const year = lastYear(financial);
  const source = financial?.metadata.source ?? identity.metadata.source ?? undefined;
  const updated = financial?.metadata.updated_at ?? identity.metadata.updated_at ?? undefined;

  const hasAnySnapshot =
    revenue !== null || ebitda !== null || netIncome !== null || employees !== null;

  if (!hasAnySnapshot) {
    return (
      <section data-testid={HEADER_TESTIDS.executiveSnapshot}>
        <UnavailableBlock
          testId={`${HEADER_TESTIDS.executiveSnapshot}-unavailable`}
          title="Snapshot ejecutivo no disponible"
          description="El proveedor no expone KPIs financieros verificables para esta empresa. La identidad sigue disponible arriba."
          req="Financial coverage · arroba-financial-v1"
        />
      </section>
    );
  }

  const kpis: Array<{
    key: string;
    label: string;
    value: string;
    tooltip: string;
  }> = [
    {
      key: 'revenue',
      label: 'Ingresos',
      value: formatCurrencyEs(revenue, { compact: true }),
      tooltip: `Ingresos consolidados${year ? ` del ejercicio ${year}` : ''}.`,
    },
    {
      key: 'ebitda',
      label: 'EBITDA',
      value: formatCurrencyEs(ebitda, { compact: true }),
      tooltip: `EBITDA reportado${year ? ` del ejercicio ${year}` : ''}.`,
    },
    {
      key: 'net-income',
      label: 'Beneficio neto',
      value: formatCurrencyEs(netIncome, { compact: true }),
      tooltip: `Beneficio neto${year ? ` del ejercicio ${year}` : ''}.`,
    },
    {
      key: 'employees',
      label: 'Empleados',
      value: formatIntegerEs(employees),
      tooltip: 'Plantilla total declarada.',
    },
  ];

  return (
    <section
      data-testid={HEADER_TESTIDS.executiveSnapshot}
      className={cn(
        'grid grid-cols-2 md:grid-cols-4 gap-3',
      )}
      aria-label="Snapshot ejecutivo"
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
            data-testid={`${HEADER_TESTIDS.executiveSnapshot}-${kpi.key}`}
            className={cn(
              'rounded-lg border border-border-default',
              'bg-surface-elevated',
              'px-4 py-3 min-w-0',
              'transition-colors duration-fast hover:border-border-emphasis',
            )}
            tabIndex={0}
          >
            <div className="text-caption uppercase tracking-caption font-semibold text-text-muted">
              {kpi.label}
            </div>
            <div className="mt-1 font-display text-h4 font-extrabold text-text-primary leading-none tabular-nums truncate">
              {kpi.value}
            </div>
          </div>
        </Tooltip>
      ))}
    </section>
  );
}
