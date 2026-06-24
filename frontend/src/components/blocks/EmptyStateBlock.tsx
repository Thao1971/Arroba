import { ReactNode } from 'react';
import { type LucideIcon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * EmptyStateBlock — primitive used by placeholder pages and by future blocks
 * (E1.2 Block Library) to surface the four standard states (loading / empty /
 * error / unavailable). This is the lightweight "unavailable / coming soon"
 * variant; the full block contract lands in E1.2.
 */
export interface EmptyStateBlockProps {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  testId?: string;
  className?: string;
}

export function EmptyStateBlock({
  icon: IconCmp = Sparkles,
  title,
  description,
  hint,
  action,
  testId,
  className,
}: EmptyStateBlockProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        'bg-surface border border-dashed border-border-strong rounded-lg p-10 text-center',
        className
      )}
    >
      <div className="mx-auto mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-surface-2 border border-border">
        <IconCmp size={20} strokeWidth={1.5} className="text-primary" />
      </div>
      <h3 className="font-display font-semibold text-xl mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-text-muted max-w-md mx-auto leading-relaxed">{description}</p>
      )}
      {hint && (
        <p className="text-xs text-text-subtle mt-3 max-w-md mx-auto leading-relaxed">{hint}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
