'use client';
import { cn } from '@/lib/cn';

/**
 * ValuationBlock — indicative valuation. Big central value + range chip + a
 * compact list of inputs + the regulatory disclaimer.
 *
 * Data states are handled upstream (the orchestrator emits EmptyStateBlock /
 * ErrorBlock when the company is missing or has no revenue).
 */
export interface ValuationInput {
  label: string;
  value: string;
  hint?: string | null;
}

export interface ValuationBlockProps {
  companyName: string;
  sector?: string | null;
  method: 'ebitda_multiple' | 'revenue_multiple';
  multipleLabel: string;
  multipleValue: number;
  centralValue: number;
  lowValue: number;
  highValue: number;
  currency?: 'EUR';
  inputs?: ValuationInput[];
  disclaimer: string;
  testId?: string;
  className?: string;
}

function formatEUR(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} M €`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)} k €`;
  return `${value.toFixed(0)} €`;
}

export function ValuationBlock({
  companyName,
  sector,
  multipleLabel,
  centralValue,
  lowValue,
  highValue,
  inputs = [],
  disclaimer,
  testId = 'block-valuation',
  className,
}: ValuationBlockProps) {
  return (
    <section
      data-testid={testId}
      className={cn(
        'rounded-xl border border-border bg-surface overflow-hidden',
        className,
      )}
    >
      <header className="px-5 py-4 border-b border-border bg-surface-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-primary mb-0.5">
            Valoración indicativa
          </p>
          <h3
            data-testid={`${testId}-company`}
            className="font-display font-semibold text-base text-text truncate"
          >
            {companyName}
          </h3>
          {sector && (
            <p className="text-xs text-text-muted truncate">{sector}</p>
          )}
        </div>
        <span
          data-testid={`${testId}-multiple`}
          className="shrink-0 inline-flex items-center px-2.5 h-7 rounded-full font-mono text-[11px] font-semibold bg-info/10 text-info"
        >
          {multipleLabel}
        </span>
      </header>

      <div className="p-5 grid gap-5 md:grid-cols-[1.4fr_1fr] items-start">
        <div>
          <p className="text-xs text-text-subtle mb-1">Valor central</p>
          <p
            data-testid={`${testId}-central`}
            className="font-display font-bold text-3xl md:text-4xl tracking-tight tabular-nums text-text"
          >
            {formatEUR(centralValue)}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <ValueChip
              testId={`${testId}-low`}
              label="Banda inferior"
              value={formatEUR(lowValue)}
              tone="low"
            />
            <ValueRangeBar low={lowValue} high={highValue} central={centralValue} />
            <ValueChip
              testId={`${testId}-high`}
              label="Banda superior"
              value={formatEUR(highValue)}
              tone="high"
            />
          </div>
        </div>

        {inputs.length > 0 && (
          <div
            data-testid={`${testId}-inputs`}
            className="rounded-lg border border-border bg-surface-2 p-3 grid grid-cols-2 gap-x-3 gap-y-2"
          >
            {inputs.map((it, i) => (
              <div key={i} className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-text-subtle">
                  {it.label}
                </p>
                <p className="font-mono text-sm font-semibold tabular-nums text-text truncate">
                  {it.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer
        data-testid={`${testId}-disclaimer`}
        className="px-5 py-3 border-t border-border bg-surface-2 text-[11px] text-text-muted leading-snug"
      >
        {disclaimer}
      </footer>
    </section>
  );
}

function ValueChip({
  label,
  value,
  tone,
  testId,
}: {
  label: string;
  value: string;
  tone: 'low' | 'high';
  testId: string;
}) {
  return (
    <div
      data-testid={testId}
      className={cn(
        'rounded-lg border border-border px-3 py-2 min-w-[88px] text-center',
        tone === 'low' ? 'bg-warning/5' : 'bg-success/5',
      )}
    >
      <p className="text-[10px] uppercase tracking-wider text-text-subtle leading-tight">
        {label}
      </p>
      <p className="font-mono text-sm font-semibold tabular-nums text-text leading-tight mt-0.5">
        {value}
      </p>
    </div>
  );
}

function ValueRangeBar({
  low,
  high,
  central,
}: {
  low: number;
  high: number;
  central: number;
}) {
  // Where the central marker sits inside [low, high].
  const range = Math.max(high - low, 1);
  const pct = Math.max(0, Math.min(100, ((central - low) / range) * 100));
  return (
    <div className="flex-1 h-1.5 rounded-full bg-border relative" aria-hidden>
      <div
        className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-primary"
        style={{ left: `calc(${pct}% - 6px)` }}
      />
    </div>
  );
}
