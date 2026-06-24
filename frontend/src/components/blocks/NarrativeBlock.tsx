'use client';
import { CheckCircle2, AlertTriangle, TrendingUp, Quote } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * NarrativeBlock — LLM-generated structured narrative. Sections:
 *
 *  • Summary    (free prose, optional)
 *  • Key points (bullets)
 *  • Risks      (bullets, warning tone)
 *  • Opportunities (bullets, success tone)
 *  • Citations  (faint sources/observations, optional)
 *
 * Empty lists are simply not rendered — keeps the visual tight.
 */
export interface NarrativeBlockProps {
  title?: string | null;
  summary?: string | null;
  keyPoints?: string[];
  risks?: string[];
  opportunities?: string[];
  citations?: string[];
  testId?: string;
  className?: string;
}

export function NarrativeBlock({
  title = 'Lectura del analista',
  summary,
  keyPoints = [],
  risks = [],
  opportunities = [],
  citations = [],
  testId = 'block-narrative',
  className,
}: NarrativeBlockProps) {
  return (
    <section
      data-testid={testId}
      className={cn('rounded-xl border border-border bg-surface p-5', className)}
    >
      {title && (
        <header className="mb-3 flex items-center gap-2">
          <Quote size={14} strokeWidth={1.6} className="text-primary" aria-hidden />
          <h3 className="font-display font-semibold text-sm text-text">{title}</h3>
        </header>
      )}
      {summary && (
        <p
          data-testid={`${testId}-summary`}
          className="text-sm text-text leading-relaxed mb-4"
        >
          {summary}
        </p>
      )}
      {keyPoints.length > 0 && (
        <List
          testId={`${testId}-key-points`}
          items={keyPoints}
          icon={<CheckCircle2 size={14} strokeWidth={1.6} className="text-info" />}
          label="Puntos clave"
        />
      )}
      {risks.length > 0 && (
        <List
          testId={`${testId}-risks`}
          items={risks}
          icon={<AlertTriangle size={14} strokeWidth={1.6} className="text-danger" />}
          label="Riesgos"
        />
      )}
      {opportunities.length > 0 && (
        <List
          testId={`${testId}-opportunities`}
          items={opportunities}
          icon={<TrendingUp size={14} strokeWidth={1.6} className="text-success" />}
          label="Oportunidades"
        />
      )}
      {citations.length > 0 && (
        <p
          data-testid={`${testId}-citations`}
          className="mt-3 text-[11px] text-text-subtle leading-snug"
        >
          Fuentes: {citations.join(' · ')}
        </p>
      )}
    </section>
  );
}

function List({
  testId,
  label,
  items,
  icon,
}: {
  testId: string;
  label: string;
  items: string[];
  icon: React.ReactNode;
}) {
  return (
    <div className="mb-3 last:mb-0" data-testid={testId}>
      <p className="text-[11px] uppercase tracking-wider text-text-subtle mb-1.5">
        {label}
      </p>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li
            key={i}
            data-testid={`${testId}-item-${i}`}
            className="flex items-start gap-2 text-sm text-text leading-snug"
          >
            <span className="mt-0.5 shrink-0">{icon}</span>
            <span className="min-w-0 flex-1">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
