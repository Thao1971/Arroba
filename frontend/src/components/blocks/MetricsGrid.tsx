'use client';
/**
 * MetricsGrid — grid responsive canónica de tarjetas de métrica.
 *
 * Variante "ligera" del MetricsBlock para situaciones donde se necesita
 * un grid configurable (1/2/3/4 columnas), p. ej. dentro de tabs de
 * financieros, comparativas, etc.
 *
 * Para el bloque completo con título + microcopy + tendencias visuales
 * sigue siendo `MetricsBlock` el canónico. `MetricsGrid` es su primitive.
 */
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';

export type MetricTrend = 'up' | 'down' | 'flat';

export interface MetricItem {
  id: string;
  label: string;
  value: string;
  hint?: string;
  trend?: MetricTrend;
}

export interface MetricsGridProps {
  items: MetricItem[];
  /** Cuántas columnas en desktop (md+). Mobile siempre = 1. */
  columns?: 1 | 2 | 3 | 4;
  /** Si false, oculta las flechitas de tendencia incluso cuando hay trend. */
  showTrends?: boolean;
  testId?: string;
  className?: string;
}

const COL_CLASSES: Record<NonNullable<MetricsGridProps['columns']>, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

const TREND_ICON: Record<MetricTrend, React.ReactNode> = {
  up:   <ArrowUp   size={12} strokeWidth={2} aria-hidden />,
  down: <ArrowDown size={12} strokeWidth={2} aria-hidden />,
  flat: <Minus     size={12} strokeWidth={2} aria-hidden />,
};

const TREND_COLOR: Record<MetricTrend, string> = {
  up:   'text-success',
  down: 'text-danger',
  flat: 'text-text-muted',
};

export function MetricsGrid({
  items,
  columns = 4,
  showTrends = true,
  testId = 'metrics-grid',
  className,
}: MetricsGridProps) {
  return (
    <dl
      data-testid={testId}
      data-columns={columns}
      className={cn(
        'grid gap-3',
        COL_CLASSES[columns],
        className,
      )}
    >
      {items.map((it) => (
        <div
          key={it.id}
          data-testid={`${testId}-item-${it.id}`}
          className={cn(
            'rounded-xl border border-border-default bg-surface-elevated',
            'px-4 py-4 flex flex-col gap-1',
            'transition-colors duration-fast hover:border-border-emphasis',
          )}
        >
          <dt className="text-caption text-text-muted uppercase tracking-caption">
            {it.label}
          </dt>
          <dd className="text-h3 font-display font-semibold text-text-primary leading-h3 tabular">
            {it.value}
          </dd>
          {(it.hint || (showTrends && it.trend)) && (
            <div className="flex items-center gap-1 text-caption">
              {showTrends && it.trend && (
                <span
                  className={cn('inline-flex items-center', TREND_COLOR[it.trend])}
                  data-testid={`${testId}-item-${it.id}-trend`}
                  aria-label={`Tendencia ${it.trend}`}
                >
                  {TREND_ICON[it.trend]}
                </span>
              )}
              {it.hint && <span className="text-text-muted">{it.hint}</span>}
            </div>
          )}
        </div>
      ))}
    </dl>
  );
}
