'use client';
/**
 * MOCKUP AISLADO · Fase B Sprint 1 — reconstrucción canónica de la Entity Page.
 *
 * ⚠️  Ruta de mockup. NO reemplaza `/empresa/{cif}`. Vive bajo `(authenticated)`
 * para heredar el layout raíz (Composer FAB + AppShell). Requiere login.
 *
 * Fuente de verdad visual: `/app/_design_intake/company/ce-app.jsx` + `ce-data.js`
 * + `ce-sections{1,2,3}.jsx` + `ce-deal.jsx`. Reproduce el layout 3-columnas
 * (210px / 1fr / 360px), nav lateral agrupada Perfil / Inteligencia / Fuentes,
 * hero row de oportunidades y panel derecho "Operación activa".
 *
 * Prohibido rediseñar cuando se migre a producción: la ficha real
 * `/empresa/{cif}` sigue la aprobación explícita del usuario tras revisión visual.
 */
import { useParams } from 'next/navigation';
import useSWR from 'swr';

import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/contexts/auth-context';
import { useActiveOrg } from '@/lib/workspaces/useActiveOrg';
import { RequireAuth } from '@/components/RequireAuth';
import { CanonicalEntityMockupClient } from '@/components/mockups/entity-canonical/CanonicalEntityMockupClient';

const FETCH_CONFIG = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
};

export default function CanonicalEntityMockupPage() {
  return (
    <RequireAuth>
      <MockupInner />
    </RequireAuth>
  );
}

function MockupInner() {
  const params = useParams<{ cif: string }>();
  const cif = (params?.cif || '').toUpperCase();
  const { isAuthenticated } = useAuth();
  const { activeOrgId } = useActiveOrg();

  const key = cif ? ['mockup-entity', cif, isAuthenticated, activeOrgId] : null;
  const { data, error, isLoading } = useSWR(
    key,
    () => apiClient.companies.get(cif, activeOrgId ?? null),
    FETCH_CONFIG,
  );

  if (isLoading) {
    return (
      <div
        data-testid="mockup-entity-loading"
        className="py-24 flex items-center justify-center text-text-muted text-sm"
      >
        Cargando vista previa canónica…
      </div>
    );
  }

  if (error) {
    const status = (error as { status?: number })?.status;
    return (
      <div
        data-testid="mockup-entity-error"
        className="py-24 flex flex-col items-center text-center max-w-md mx-auto"
      >
        <h1 className="font-display text-3xl font-bold mb-3">
          {status === 404 ? 'Empresa no encontrada' : 'No hemos podido cargar la empresa'}
        </h1>
        <p className="text-text-muted">
          {status === 404
            ? `No hay ninguna empresa con el identificador ${cif}.`
            : 'Inténtalo de nuevo en unos segundos.'}
        </p>
      </div>
    );
  }

  if (!data) return null;

  return <CanonicalEntityMockupClient cif={cif} initial={data} />;
}
