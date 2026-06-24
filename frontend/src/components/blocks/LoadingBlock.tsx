'use client';

/**
 * LoadingBlock — skeleton used while a Skill is executing. Visible inside the
 * Workspace area of the Copilot dock.
 */
export interface LoadingBlockProps {
  testId?: string;
}

export function LoadingBlock({ testId = 'block-loading' }: LoadingBlockProps) {
  return (
    <div
      data-testid={testId}
      role="status"
      aria-live="polite"
      aria-label="Cargando resultados"
      className="rounded-xl border border-border bg-surface overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-border bg-surface-2 flex items-center gap-2">
        <span className="block w-3 h-3 rounded-full bg-border-strong animate-pulse" />
        <span className="block h-3 w-32 rounded bg-border-strong animate-pulse" />
      </div>
      <ul className="divide-y divide-border">
        {[0, 1, 2].map((i) => (
          <li key={i} className="px-4 py-3 flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-border-strong animate-pulse" />
            <span className="flex-1 space-y-2">
              <span className="block h-3 w-40 rounded bg-border-strong animate-pulse" />
              <span className="block h-2.5 w-56 rounded bg-border animate-pulse" />
            </span>
            <span className="w-10 h-5 rounded-full bg-border-strong animate-pulse" />
          </li>
        ))}
      </ul>
    </div>
  );
}
