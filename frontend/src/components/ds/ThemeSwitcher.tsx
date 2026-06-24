'use client';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/cn';

export interface ThemeSwitcherProps {
  className?: string;
  ariaLabelLight?: string;
  ariaLabelDark?: string;
}

export function ThemeSwitcher({
  className,
  ariaLabelLight = 'Cambiar a tema claro',
  ariaLabelDark = 'Cambiar a tema oscuro',
}: ThemeSwitcherProps) {
  const { theme, toggle, hydrated } = useTheme();
  const isDark = theme === 'dark';
  // Avoid SSR/CSR mismatch: keep markup stable; the script in <head> already
  // set [data-dark] before hydration, so the icon will be visually correct.
  const Icon = isDark ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={hydrated ? isDark : undefined}
      aria-label={isDark ? ariaLabelLight : ariaLabelDark}
      data-testid="theme-toggle"
      className={cn(
        'inline-flex items-center justify-center w-11 h-11 rounded-md',
        'bg-surface border border-border hover:border-border-strong',
        'text-text-muted hover:text-text transition-colors',
        'focus-visible:shadow-focus',
        className
      )}
    >
      <Icon size={18} strokeWidth={1.5} aria-hidden />
    </button>
  );
}
