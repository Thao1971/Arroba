'use client';
import { useCallback, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useCopilot } from './CopilotProvider';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api/client';

/**
 * "Seguir trabajando" — promotes the ephemeral dock state to a persisted
 * Workspace and navigates to /es/w/{id}.
 *
 * Visibility:
 *   - hidden when in anchored mode (already inside a workspace),
 *   - hidden when there are no user+assistant pairs yet,
 *   - shown otherwise.
 *
 * Anonymous users → redirected to /es/login?next=/es/historial.
 */
export function OpenWorkspaceButton() {
  const { history, currentWorkspaceId, promoteToWorkspace } = useCopilot();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = useCallback(async () => {
    if (!isAuthenticated) {
      const next = encodeURIComponent('/es/historial');
      router.push(`/es/login?next=${next}`);
      return;
    }
    setError(null);
    setPending(true);
    try {
      const { url } = await promoteToWorkspace();
      router.push(url);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.detail
          : e instanceof Error && e.message === 'promote_requires_auth'
            ? 'Inicia sesión para guardar este workspace.'
            : 'No hemos podido guardar el workspace.';
      setError(msg);
    } finally {
      setPending(false);
    }
  }, [isAuthenticated, promoteToWorkspace, router]);

  const hasUserMsg = history.some((m) => m.role === 'user');
  const hasAssistantMsg = history.some((m) => m.role === 'assistant');
  if (currentWorkspaceId || !hasUserMsg || !hasAssistantMsg) return null;

  // Mute the lint hint for unused pathname (kept for future telemetry).
  void pathname;

  return (
    <div className="mt-3 flex flex-col gap-1.5">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        data-testid="copilot-open-workspace"
        className="inline-flex items-center justify-center gap-1.5 px-3 h-9 rounded-full bg-primary text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-progress"
      >
        {pending ? (
          <Loader2 size={12} strokeWidth={1.8} className="animate-spin" />
        ) : (
          <ArrowRight size={12} strokeWidth={1.8} />
        )}
        Seguir trabajando
      </button>
      {error && (
        <p data-testid="copilot-open-workspace-error" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
