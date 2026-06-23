'use client';
import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helperText, error, className, id, ...rest },
  ref
) {
  const auto = useId();
  const inputId = id ?? auto;
  const describedBy = error || helperText ? `${inputId}-help` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text-muted font-body"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy}
        className={cn(
          'h-11 px-3 rounded-md font-body',
          'bg-surface text-text border border-border',
          'placeholder:text-text-subtle',
          'transition-colors duration-150',
          'hover:border-border-strong',
          'focus-visible:shadow-focus focus-visible:border-primary outline-none',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          error && 'border-danger focus-visible:border-danger',
          className
        )}
        {...rest}
      />
      {(helperText || error) && (
        <p
          id={describedBy}
          className={cn('text-xs', error ? 'text-danger' : 'text-text-subtle')}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
});
