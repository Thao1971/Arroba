'use client';
import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const sizeMap: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-base gap-2',
  lg: 'h-12 px-5 text-md gap-2',
};

const variantMap: Record<Variant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-hover active:translate-y-[1px] disabled:bg-text-subtle disabled:text-white/80',
  secondary:
    'bg-surface text-text border border-border hover:border-border-strong hover:bg-surface-2 disabled:opacity-60',
  ghost:
    'bg-transparent text-text hover:bg-surface-2 disabled:opacity-60',
  danger:
    'bg-danger text-white hover:opacity-90 disabled:opacity-60',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading = false, disabled, leftIcon, rightIcon, children, type, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-display font-medium',
        'transition-colors duration-150 ease-out select-none',
        // WCAG: min tap target 44px (var --tap-target-min)
        'min-h-[var(--tap-target-min)] min-w-[var(--tap-target-min)]',
        'focus-visible:shadow-focus',
        'disabled:cursor-not-allowed',
        sizeMap[size],
        variantMap[variant],
        className
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 16} aria-hidden />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
});
