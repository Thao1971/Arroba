'use client';
import useSWR from 'swr';
import { AlertCircle, RefreshCw, LineChart } from 'lucide-react';
import { swrFetcher, ApiError } from '@/lib/api/client';
import type { PlatformStats } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { EmptyStateBlock } from './EmptyStateBlock';
import { formatNumber } from '@/lib/format';

/**
 * MetricsBlock — supports two modes:
 *
 * 1. **Configurable**: pass `metrics={[...]}` directly. The block renders the
 *    KPIs synchronously; loading/error states never appear (static data).
 *
 * 2. **Data**: pass `mode="data"` (and no `metrics`). The block fetches
 *    `GET /api/platform/stats` via SWR and maps the 8 fields to
 *    KPI tiles. Loading → empty → error → success.
 *
 * The block always renders within a styled card grid; the title/eyebrow are
 * optional.
 */
export type MetricTrend = 'up' | 'down' | 'flat';

export interface Metric {
  id: string;
  label: string;
  value: string;
  sub?: string;
  delta?: string;
  trend?: MetricTrend;
}

export interface MetricsBlockProps {
  mode?: 'configurable' | 'data';
  metrics?: readonly Metric[];
  title?: string;
  eyebrow?: string;
  testId?: string;
  className?: string;
}

export function MetricsBlock({
  mode = 'configurable',
  metrics,
  title,
  eyebrow,
  testId = 'block-metrics',
  className,
}: MetricsBlockProps) {
  if (mode === 'configurable') {
    return (
      <MetricsLayout
        eyebrow={eyebrow}
        title={title}
        testId={testId}
        className={className}
      >
        {(metrics && metrics.length > 0 && (
          <MetricsGrid metrics={metrics} />
        )) || (
          <EmptyStateBlock
            icon={LineChart}
            title="Sin métricas configuradas"
            description="Pasa una lista de KPIs vía props para renderizar."
            testId={`${testId}-empty`}
          />
        )}
      </MetricsLayout>
    );
  }
  return (
    <MetricsLayout eyebrow={eyebrow} title={title} testId={testId} className={className}>
      <DataModeInner testId={testId} />
    </MetricsLayout>
  );
}

function DataModeInner({ testId }: { testId: string }) {
  const { data, error, isLoading, mutate } = useSWR<PlatformStats, ApiError>(
    '/api/platform/stats',
    swrFetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );

  if (isLoading) {
    return (
      <div
        data-testid={`${testId}-loading`}
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3"
      >
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl bg-surface border border-border animate-pulse"
          />
        ))}
      </div>
    );
  }
  if (error) {
    const unavailable = error.status === 404;
    return unavailable ? (
      <EmptyStateBlock
        testId={`${testId}-unavailable`}
        icon={LineChart}
        title="Datos no disponibles"
        description="Las métricas agregadas todavía no están seedeadas. Cuando el proveedor externo entregue, este bloque se actualizará automáticamente."
      />
    ) : (
      <div
        data-testid={`${testId}-error`}
        className="border border-danger/30 bg-danger/5 text-text rounded-xl p-6 flex items-start gap-3"
      >
        <AlertCircle size={20} strokeWidth={1.6} className="text-danger shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-semibold text-base mb-1">
            No hemos podido cargar las métricas.
          </h4>
          <p className="text-sm text-text-muted mb-3">{error.detail}</p>
          <button
            type="button"
            onClick={() => mutate()}
            data-testid={`${testId}-retry`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            <RefreshCw size={14} strokeWidth={1.6} /> Reintentar
          </button>
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <EmptyStateBlock testId={`${testId}-empty`} title="Sin datos" icon={LineChart} />
    );
  }
  const platformMetrics = mapPlatformStats(data);
  return <MetricsGrid metrics={platformMetrics} dataAttr={data.provenance} />;
}

function MetricsLayout({
  testId,
  className,
  title,
  eyebrow,
  children,
}: {
  testId: string;
  className?: string;
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <section data-testid={testId} className={cn('w-full', className)}>
      {(eyebrow || title) && (
        <header className="mb-6 text-center max-w-2xl mx-auto">
          {eyebrow && (
            <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-primary mb-2">
              {eyebrow}
            </p>
          )}
          {title && (
            <h2 className="font-display font-bold text-2xl md:text-3xl tracking-tight">
              {title}
            </h2>
          )}
        </header>
      )}
      {children}
    </section>
  );
}

function MetricsGrid({
  metrics,
  dataAttr,
}: {
  metrics: readonly Metric[];
  dataAttr?: string;
}) {
  return (
    <div
      data-provenance={dataAttr}
      className={cn(
        'grid gap-3',
        metrics.length <= 4
          ? 'grid-cols-2 md:grid-cols-4'
          : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-7'
      )}
    >
      {metrics.map((m) => (
        <MetricTile key={m.id} metric={m} />
      ))}
    </div>
  );
}

function MetricTile({ metric }: { metric: Metric }) {
  const trendCls =
    metric.trend === 'up' ? 'text-success' : metric.trend === 'down' ? 'text-danger' : 'text-text-subtle';
  return (
    <div
      data-testid={`block-metrics-tile-${metric.id}`}
      className="rounded-xl border border-border bg-surface p-4 flex flex-col justify-between min-h-[112px]"
    >
      <p className="text-xs text-text-subtle leading-tight">{metric.label}</p>
      <div>
        <p className="font-display font-extrabold text-xl md:text-2xl tracking-tight tabular-nums">
          {metric.value}
        </p>
        {(metric.delta || metric.sub) && (
          <p className="text-[11px] mt-1 flex items-center gap-1.5 leading-tight">
            {metric.delta && (
              <span className={cn('font-mono font-semibold tabular-nums', trendCls)}>
                {metric.delta}
              </span>
            )}
            {metric.sub && <span className="text-text-subtle">{metric.sub}</span>}
          </p>
        )}
      </div>
    </div>
  );
}

function mapPlatformStats(stats: PlatformStats): Metric[] {
  return [
    { id: 'companies-intelligence', label: 'Empresas con inteligencia', value: formatNumber(stats.companies_with_intelligence) },
    { id: 'companies-financials', label: 'Empresas con datos financieros', value: formatNumber(stats.companies_with_financials) },
    { id: 'economic-metrics', label: 'Métricas económicas', value: formatNumber(stats.economic_metrics_total) },
    { id: 'corporate-movements', label: 'Movimientos societarios', value: formatNumber(stats.corporate_movements) },
    { id: 'investors-funds', label: 'Inversores y fondos', value: formatNumber(stats.investors_and_funds) },
    { id: 'sectors-analyzed', label: 'Sectores analizados', value: formatNumber(stats.sectors_analyzed) },
    { id: 'public-contracts', label: 'Empresas con contratos públicos', value: formatNumber(stats.companies_with_public_contracts) },
  ];
}

// Helps tests assert which formatter was used.
export const __test = { mapPlatformStats };
