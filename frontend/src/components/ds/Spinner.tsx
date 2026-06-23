import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

export function Spinner({ size = 18, className, label = 'Cargando' }: SpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin text-text-muted', className)}
      size={size}
      strokeWidth={1.5}
      aria-label={label}
    />
  );
}
