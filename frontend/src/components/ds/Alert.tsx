import { AlertCircle, CheckCircle2, Info as InfoIcon, AlertTriangle, type LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'info' | 'success' | 'warning' | 'danger';

const iconMap: Record<Variant, LucideIcon> = {
  info: InfoIcon,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
};

const variantMap: Record<Variant, string> = {
  info: 'bg-info/10 text-info border-info/30',
  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  danger: 'bg-danger/10 text-danger border-danger/30',
};

export interface AlertProps {
  variant?: Variant;
  title?: string;
  action?: ReactNode;
  children?: ReactNode;
}

export function Alert({ variant = 'info', title, action, children }: AlertProps) {
  const Icon = iconMap[variant];
  return (
    <div role="status" className={cn('flex items-start gap-3 p-4 rounded-md border', variantMap[variant])}>
      <Icon size={20} strokeWidth={1.5} aria-hidden />
      <div className="flex-1">
        {title && <p className="font-display font-medium mb-1">{title}</p>}
        {children && <div className="text-sm font-body">{children}</div>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
