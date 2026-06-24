'use client';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react';
import {
  InputHTMLAttributes,
  forwardRef,
  useId,
  useState,
} from 'react';
import { cn } from '@/lib/cn';

export interface AuthFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  /** Lucide icon component rendered on the left. */
  icon: LucideIcon;
  error?: string;
  helperText?: string;
  /** When true, render an eye/eye-off button to toggle password visibility. */
  togglePassword?: boolean;
}

/**
 * Form field with left icon, red focus ring (token --primary)
 * and password visibility toggle. Direct port of /app/_design_intake/auth/auth-ui.jsx -> <AuthField/>.
 */
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { id, label, icon: IconCmp, type = 'text', error, helperText, togglePassword, className, ...rest },
  ref
) {
  const auto = useId();
  const inputId = id ?? auto;
  const [show, setShow] = useState(false);
  const isPass = type === 'password';
  const realType = isPass && togglePassword ? (show ? 'text' : 'password') : type;
  const describedBy = error || helperText ? `${inputId}-help` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-text font-body">
        {label}
      </label>
      <div className="relative flex items-center">
        <span
          aria-hidden
          className="absolute left-3.5 inline-flex items-center text-text-subtle peer-focus-visible:text-primary"
        >
          <IconCmp size={17} strokeWidth={1.6} className="auth-field-icon" />
        </span>
        <input
          ref={ref}
          id={inputId}
          type={realType}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={cn(
            'peer w-full h-12 pl-10 rounded-[11px] font-body text-[15px]',
            'bg-surface text-text border-[1.5px] border-border-strong',
            'placeholder:text-text-subtle',
            'transition-shadow transition-colors duration-150',
            'focus-visible:outline-none focus-visible:border-primary',
            'focus-visible:shadow-[0_0_0_3px_rgba(232,0,29,0.15)]',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            isPass && togglePassword ? 'pr-12' : 'pr-3',
            error && 'border-danger focus-visible:border-danger focus-visible:shadow-[0_0_0_3px_rgba(220,38,38,0.18)]',
            className
          )}
          {...rest}
        />
        {isPass && togglePassword && (
          <button
            type="button"
            tabIndex={-1}
            aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 w-9 h-9 inline-flex items-center justify-center text-text-subtle hover:text-text-muted"
            data-testid="toggle-password-visibility"
          >
            {show ? <EyeOff size={17} strokeWidth={1.6} /> : <Eye size={17} strokeWidth={1.6} />}
          </button>
        )}
      </div>
      {(error || helperText) && (
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
