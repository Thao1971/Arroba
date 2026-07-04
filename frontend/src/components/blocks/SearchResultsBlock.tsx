'use client';
import { Building2, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * SearchResultsBlock — Configurable. Renders the list of companies returned
 * by the Copilot Search Skill. Each row shows name + sector + CIF + score.
 *
 * No data states inside — the orchestrator picks Loading/Empty/Error blocks
 * upstream and only mounts this one on the happy path.
 */
export interface SearchResultItem {
  master_company_id: string;
  name: string;
  legal_name?: string | null;
  cif?: string | null;
  sector?: string | null;
  city?: string | null;
  score: number;
}

export interface SearchResultsBlockProps {
  query: string;
  total: number;
  results: readonly SearchResultItem[];
  onPick?: (item: SearchResultItem) => void;
  testId?: string;
}

export function SearchResultsBlock({
  query,
  total,
  results,
  onPick,
  testId = 'block-search-results',
}: SearchResultsBlockProps) {
  return (
    <section
      data-testid={testId}
      data-provenance="demo"
      className="rounded-xl border border-border bg-surface overflow-hidden"
    >
      <header className="px-4 py-3 border-b border-border flex items-center gap-2 bg-surface-2">
        <Sparkles size={14} strokeWidth={1.5} className="text-primary" />
        <h3 className="font-display font-semibold text-sm text-text leading-none">
          {total} resultado{total === 1 ? '' : 's'} para «{query}»
        </h3>
      </header>
      <ul className="divide-y divide-border" data-testid={`${testId}-list`}>
        {results.map((r) => (
          <li key={r.master_company_id}>
            <button
              type="button"
              onClick={() => onPick?.(r)}
              data-testid={`${testId}-row-${r.master_company_id}`}
              className={cn(
                'w-full text-left px-4 py-3 flex items-center gap-3 transition-colors',
                'hover:bg-surface-2 focus-visible:bg-surface-2',
                'focus-visible:outline-none'
              )}
            >
              <span className="inline-flex w-9 h-9 rounded-lg bg-surface-2 border border-border items-center justify-center font-display font-bold text-text shrink-0">
                {(r.name || '?').charAt(0)}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-display font-semibold text-text truncate">
                  {r.name}
                </span>
                <span className="block text-xs text-text-muted truncate">
                  {[r.sector, r.cif].filter(Boolean).join(' · ') || '—'}
                </span>
              </span>
              <ScoreBadge score={r.score} />
              <ArrowRight size={16} strokeWidth={1.6} className="text-text-subtle shrink-0" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const tone =
    score >= 0.75
      ? 'bg-success/10 text-success'
      : score >= 0.5
        ? 'bg-info/10 text-info'
        : 'bg-surface-2 text-text-muted';
  return (
    <span
      data-testid="block-search-results-score"
      className={cn('inline-flex items-center gap-1 px-2 h-6 rounded-full text-[11px] font-mono font-semibold', tone)}
    >
      <Sparkles size={10} strokeWidth={1.6} className="opacity-70" />
      {pct}%
    </span>
  );
}

export const SearchResultsBlockIcon = Building2;
