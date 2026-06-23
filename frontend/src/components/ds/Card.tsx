import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  header?: ReactNode;
  footer?: ReactNode;
  padded?: boolean;
}

export function Card({
  className,
  header,
  footer,
  padded = true,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn('bg-surface border border-border rounded-lg shadow-sm', className)}
      {...rest}
    >
      {header && (
        <div className="px-5 py-4 border-b border-border font-display font-medium">
          {header}
        </div>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
      {footer && (
        <div className="px-5 py-4 border-t border-border bg-surface-2 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
}
