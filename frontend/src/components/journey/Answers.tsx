'use client';
import { type ReactNode } from 'react';
import { type LucideIcon, Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface AnswerCardProps {
  icon: LucideIcon;
  title: string;
  desc?: string;
  selected?: boolean;
  onClick?: () => void;
  testId?: string;
}

export function AnswerCard({ icon: IconCmp, title, desc, selected, onClick, testId }: AnswerCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={cn(
        'flex items-start gap-3 w-full text-left p-4 rounded-[14px] cursor-pointer transition-all duration-150',
        'border-[1.5px]',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-surface hover:border-border-strong hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(12,12,14,0.07)]'
      )}
    >
      <span
        className={cn(
          'w-[38px] h-[38px] rounded-[10px] flex items-center justify-center flex-shrink-0 transition-colors',
          selected ? 'bg-primary text-white' : 'bg-surface-2 border border-border text-text-muted'
        )}
        aria-hidden
      >
        <IconCmp size={18} strokeWidth={1.5} />
      </span>
      <span className="flex-1 min-w-0 pt-px">
        <span className="block text-[15px] font-bold text-text font-display leading-tight">{title}</span>
        {desc && <span className="block text-[13px] text-text-muted leading-snug mt-0.5">{desc}</span>}
      </span>
      {selected && <Check size={17} strokeWidth={2.4} className="text-primary mt-2 shrink-0" />}
    </button>
  );
}

export function Chip({
  active,
  onClick,
  children,
  testId,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={cn(
        'inline-flex items-center gap-1.5 px-4 h-10 rounded-full cursor-pointer text-[13.5px] font-medium font-body transition-all',
        'border-[1.5px]',
        active
          ? 'bg-primary/5 border-primary text-primary'
          : 'bg-surface border-border text-text hover:border-border-strong'
      )}
    >
      {children}
      {active && <Check size={14} strokeWidth={2.2} />}
    </button>
  );
}

export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-2.5" data-testid="journey-progress">
      <span className="text-xs font-semibold text-text-subtle font-body whitespace-nowrap">
        Paso {Math.min(current + 1, total)} de {total}
      </span>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'w-1.5 h-1.5 rounded-full transition-colors',
              i <= current ? 'bg-primary' : 'bg-border-strong'
            )}
          />
        ))}
      </div>
    </div>
  );
}
