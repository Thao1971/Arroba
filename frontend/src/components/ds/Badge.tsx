import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info';

/* Variants combine background + foreground + border so colour is NEVER the sole
   carrier of meaning. */
const variantMap: Record<Variant, string> = {
  default: 'bg-surface-2 text-text-muted border-border',
  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  danger: 'bg-danger/10 text-danger border-danger/30',
  info: 'bg-info/10 text-info border-info/30',
};

export interface BadgeProps {
  variant?: Variant;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', icon, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 h-6 rounded-full text-xs font-medium border font-body',
        variantMap[variant],
        className
      )}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
}
