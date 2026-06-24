'use client';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * CompanyCardsGridBlock — grid of compact recommendation cards. Used by the
 * Recommend Skill (similar_to_company / opportunities_by_sector / list_by_sector).
 */
export interface CompanyCardsGridItem {
  masterCompanyId: string;
  name: string;
  sector?: string | null;
  region?: string | null;
  score: number;
  reason?: string | null;
}

export interface CompanyCardsGridBlockProps {
  title?: string | null;
  subtype?:
    | 'similar_to_company'
    | 'opportunities_by_sector'
    | 'list_by_sector'
    | 'generic';
  items: readonly CompanyCardsGridItem[];
  onPick?: (item: CompanyCardsGridItem) => void;
  testId?: string;
  className?: string;
}

const SUBTYPE_EYEBROW: Record<string, string> = {
  similar_to_company: 'Empresas similares',
  opportunities_by_sector: 'Oportunidades en el sector',
  list_by_sector: 'Empresas del sector',
  generic: 'Recomendaciones',
};

export function CompanyCardsGridBlock({
  title,
  subtype = 'generic',
  items,
  onPick,
  testId = 'block-company-cards-grid',
  className,
}: CompanyCardsGridBlockProps) {
  return (
    <section
      data-testid={testId}
      data-subtype={subtype}
      className={cn('rounded-xl border border-border bg-surface p-5', className)}
    >
      <header className="mb-4">
        <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-primary mb-1">
          {SUBTYPE_EYEBROW[subtype] || 'Recomendaciones'}
        </p>
        {title && (
          <h3 className="font-display font-semibold text-base text-text">{title}</h3>
        )}
      </header>
      <ul
        data-testid={`${testId}-list`}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {items.map((it) => (
          <li key={it.masterCompanyId}>
            <button
              type="button"
              onClick={() => onPick?.(it)}
              data-testid={`${testId}-item-${it.masterCompanyId}`}
              className={cn(
                'w-full text-left rounded-lg border border-border bg-surface-2 p-3',
                'hover:border-primary hover:bg-surface transition-colors',
                'focus-visible:outline-none focus-visible:border-primary',
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h4 className="font-display font-semibold text-sm text-text leading-tight min-w-0 flex-1 truncate">
                  {it.name}
                </h4>
                <ScoreBadge score={it.score} />
              </div>
              <p className="text-[11px] text-text-muted leading-tight truncate">
                {[it.sector, it.region].filter(Boolean).join(' · ') || '—'}
              </p>
              {it.reason && (
                <p className="mt-2 text-[11px] text-text-subtle leading-snug">
                  {it.reason}
                </p>
              )}
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                Ver detalle <ArrowRight size={11} strokeWidth={1.6} />
              </span>
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
        : 'bg-surface text-text-muted';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 h-5 rounded-full text-[10px] font-mono font-semibold shrink-0',
        tone,
      )}
    >
      <Sparkles size={9} strokeWidth={1.6} className="opacity-70" />
      {pct}%
    </span>
  );
}
