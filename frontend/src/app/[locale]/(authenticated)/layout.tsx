'use client';
import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AuthHeader } from '@/components/layout/AuthHeader';
import { Spinner } from '@/components/ds';

/**
 * Routes that exempt from the "must finish onboarding first" rule.
 * Anything starting with `/onboarding` is exempt; every other authenticated
 * route forces a user with `memberships.length === 0` back to `/onboarding`.
 *
 * Note: `/internal/*` is NOT exempt — admin still needs at least one org to
 * use the rest of the app. The admin gate inside the page handles role.
 */
const ONBOARDING_EXEMPT_PREFIX = '/onboarding';

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  // NOTA (Regla 1 · SPRINT 1): CopilotProvider + CopilotDock ya no viven
  // aquí — se han promovido al layout raíz `[locale]/layout.tsx` para que
  // el Composer persista al navegar a /empresa/{cif} (fuera del segment
  // autenticado). El Dock se auto-oculta para usuarios anónimos.
  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <AuthHeader />
      <main className="flex-1">
        <OnboardingGuard>{children}</OnboardingGuard>
      </main>
    </div>
  );
}

/**
 * Client-side guard that enforces the onboarding obligation.
 *
 * - Until `useAuth()` resolves, render a minimal full-page spinner to avoid
 *   flashing the protected page (RequireAuth in each page handles the
 *   unauthenticated → /login redirect; here we only worry about the
 *   "authenticated but with zero memberships" case).
 * - If memberships is empty and the path is NOT under /onboarding, replace
 *   the route with /onboarding and show the spinner while the redirect
 *   happens.
 * - Otherwise render children as-is.
 */
function OnboardingGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const { isLoading, isAuthenticated, memberships } = useAuth();

  const isExempt = pathname.startsWith(ONBOARDING_EXEMPT_PREFIX);
  const needsOnboarding =
    !isLoading && isAuthenticated && memberships.length === 0 && !isExempt;

  useEffect(() => {
    if (needsOnboarding) {
      router.replace('/onboarding');
    }
  }, [needsOnboarding, router]);

  if (needsOnboarding) {
    return <RedirectingFallback testId="onboarding-guard-redirect" />;
  }
  return <>{children}</>;
}

function RedirectingFallback({ testId }: { testId?: string }) {
  return (
    <div
      data-testid={testId}
      className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center text-text-muted text-sm gap-2"
    >
      <Spinner /> Redirigiendo…
    </div>
  );
}
