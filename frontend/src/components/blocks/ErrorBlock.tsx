'use client';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * ErrorBlock — surfaced when a Skill returns 5xx or the network failed.
 */
export interface ErrorBlockProps {
  title: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
  testId?: string;
}

export function ErrorBlock({
  title,
  message,
  retryLabel = 'Reintentar',
  onRetry,
  testId = 'block-error',
}: ErrorBlockProps) {
  return (
    <div
      data-testid={testId}
      role="alert"
      className="rounded-xl border border-danger/30 bg-danger/5 p-4 flex items-start gap-3"
    >
      <AlertCircle size={20} strokeWidth={1.6} className="text-danger shrink-0 mt-0.5" aria-hidden />
      <div className="flex-1 min-w-0">
        <h4 className="font-display font-semibold text-sm text-text mb-0.5">{title}</h4>
        {message && <p className="text-xs text-text-muted leading-relaxed">{message}</p>}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            data-testid={`${testId}-retry`}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
          >
            <RefreshCw size={12} strokeWidth={1.6} /> {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
