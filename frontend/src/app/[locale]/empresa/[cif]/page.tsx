'use client';
/**
 * `/empresa/[cif]` — Entity-first company page.
 *
 * Mixed-access:
 *   - Anonymous: backend returns sections 1-3 only + `locked_sections`. The
 *     `CompanyPageClient` renders the blurred CTA over sections 4-8.
 *   - Authenticated: full ficha, conversation hydrated, watchlist + share
 *     working.
 *
 * No `RequireAuth` wrapper on this route (intentional — the brief asks for
 * mixed-access). The backend gates the data; the UI mirrors that decision.
 */
import { useParams } from 'next/navigation';
import useSWR from 'swr';

import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/contexts/auth-context';
import { useActiveOrg } from '@/lib/workspaces/useActiveOrg';
import { CompanyPageClient } from '@/components/entity/CompanyPageClient';

const FETCH_CONFIG = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
};

export default function CompanyEntityPage() {
  const params = useParams<{ cif: string }>();
  const cifRaw = (params?.cif || '').toUpperCase();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { activeOrgId } = useActiveOrg();

  const key = cifRaw ? ['company', cifRaw, isAuthenticated, activeOrgId] : null;
  const { data, error, isLoading } = useSWR(
    key,
    () => apiClient.companies.get(cifRaw, activeOrgId ?? null),
    FETCH_CONFIG,
  );

  if (authLoading || isLoading) {
    return (
      <div
        data-testid="company-page-loading"
        className="py-24 flex items-center justify-center text-text-muted text-sm"
      >
        Cargando empresa…
      </div>
    );
  }

  if (error) {
    const status = (error as { status?: number })?.status;
    if (status === 404) {
      return (
        <div
          data-testid="company-page-not-found"
          className="py-24 flex flex-col items-center text-center max-w-md mx-auto"
        >
          <h1 className="font-display text-3xl font-bold mb-3">
            Empresa no encontrada
          </h1>
          <p className="text-text-muted">
            No tenemos en arroba.com una empresa con el identificador {cifRaw}.
            Comprueba el CIF o busca por nombre desde el Copilot.
          </p>
        </div>
      );
    }
    return (
      <div
        data-testid="company-page-error"
        className="py-24 flex flex-col items-center text-center max-w-md mx-auto"
      >
        <h1 className="font-display text-3xl font-bold mb-3">
          No hemos podido cargar la empresa
        </h1>
        <p className="text-text-muted">Inténtalo de nuevo en unos segundos.</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <CompanyPageClient
      cif={cifRaw}
      initial={data}
      authenticated={isAuthenticated}
    />
  );
}
