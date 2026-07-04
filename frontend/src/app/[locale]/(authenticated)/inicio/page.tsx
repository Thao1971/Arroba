'use client';
/**
 * Home privada — SPRINT 1 · F5
 *
 * Estados canónicos:
 *   - App Shell primer día: sin actividad (watchlist vacía) → saludo + 3
 *     FeatureCardBlock ("Analizar una empresa", "Valorar un negocio",
 *     "Iniciar una operación").
 *   - Cartera: watchlist con >= 1 empresa → sección "Cartera" con
 *     CompanyCardsGridBlock iterando `watchlist.items`.
 *
 * NO añade otras secciones (Casos estratégicos, Oportunidades, Matchings)
 * hasta que existan sus entidades en sprints posteriores.
 */
import useSWR from 'swr';
import { useMemo } from 'react';
import { Search, TrendingUp, Handshake } from 'lucide-react';
import { RequireAuth } from '@/components/RequireAuth';
import {
  FeatureCardBlock,
  CompanyCardsGridBlock,
  type CompanyCardsGridItem,
} from '@/components/blocks';
import { apiClient, type WatchlistListResponse } from '@/lib/api/client';
import { useActiveOrg } from '@/lib/workspaces/useActiveOrg';
import { useAuth } from '@/contexts/auth-context';
import { useCopilot } from '@/components/copilot/CopilotProvider';

function greeting(now: Date, name: string | null | undefined): string {
  const h = now.getHours();
  let base = 'Buenos días';
  if (h >= 13 && h < 21) base = 'Buenas tardes';
  else if (h >= 21 || h < 6) base = 'Buenas noches';
  const first = (name || '').split(' ')[0]?.trim();
  return first ? `${base}, ${first}.` : `${base}.`;
}

export default function HomePrivadaPage() {
  return (
    <RequireAuth>
      <HomeContent />
    </RequireAuth>
  );
}

function HomeContent() {
  const { user } = useAuth();
  const { activeOrgId } = useActiveOrg();
  const { openDock } = useCopilot();

  const watchlistKey = activeOrgId ? ['/api/users/me/watchlist', activeOrgId] : null;
  const { data, isLoading } = useSWR<WatchlistListResponse>(
    watchlistKey,
    () => apiClient.users.getMyWatchlist(activeOrgId),
    { revalidateOnFocus: false },
  );

  const items: CompanyCardsGridItem[] = useMemo(() => {
    if (!data?.items) return [];
    return data.items.map((wl) => ({
      masterCompanyId: wl.id,
      name: wl.display_name,
      sector: wl.secondary_label ?? null,
      region: null,
      score: 1,
    }));
  }, [data]);

  const hasActivity = !isLoading && (data?.total ?? 0) > 0;
  const now = new Date();
  const salute = greeting(now, user?.full_name || user?.email || null);

  return (
    <div
      data-testid="home-privada"
      className="mx-auto max-w-6xl px-6 py-10 md:py-12 space-y-10"
    >
      <header data-testid="home-privada-header" className="space-y-2">
        <p className="text-caption uppercase tracking-caption text-text-muted">
          Inteligencia económica y transaccional · España
        </p>
        <h1
          data-testid="home-privada-greeting"
          className="font-display text-4xl sm:text-5xl font-semibold text-text-primary leading-tight"
        >
          {salute}
        </h1>
        {!hasActivity && (
          <p
            data-testid="home-privada-subcopy"
            className="text-body-lg text-text-secondary max-w-2xl"
          >
            ¿Qué quieres conseguir hoy? Analiza una empresa, valora un negocio o
            pon en marcha una operación. Dímelo en lenguaje natural.
          </p>
        )}
      </header>

      {hasActivity ? (
        <section
          data-testid="home-privada-cartera"
          className="space-y-4"
          aria-labelledby="home-privada-cartera-title"
        >
          <div className="flex items-baseline justify-between">
            <h2
              id="home-privada-cartera-title"
              className="font-display text-lg font-semibold text-text-primary"
            >
              Cartera
            </h2>
            <span className="text-caption text-text-muted">
              {data!.total} empres{data!.total === 1 ? 'a' : 'as'} guardad
              {data!.total === 1 ? 'a' : 'as'}
            </span>
          </div>
          <CompanyCardsGridBlock items={items} testId="home-privada-cartera-grid" />
        </section>
      ) : (
        <section
          data-testid="home-privada-app-shell"
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          aria-label="Elige por dónde empezar"
        >
          <button
            type="button"
            data-testid="home-privada-card-analyze"
            onClick={() => openDock()}
            className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-2xl"
          >
            <FeatureCardBlock
              icon={Search}
              title="Analizar una empresa"
              description="Busca por nombre o CIF y abre su ficha con análisis del Copilot."
              cta={{ label: 'Empezar', href: '#', testId: 'home-card-analyze-cta' }}
            />
          </button>
          <button
            type="button"
            data-testid="home-privada-card-value"
            onClick={() => openDock()}
            className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-2xl"
          >
            <FeatureCardBlock
              icon={TrendingUp}
              title="Valorar un negocio"
              description="Estimación indicativa por múltiplos comparables."
              cta={{ label: 'Empezar', href: '#', testId: 'home-card-value-cta' }}
            />
          </button>
          <button
            type="button"
            data-testid="home-privada-card-operation"
            onClick={() => openDock()}
            className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-2xl"
          >
            <FeatureCardBlock
              icon={Handshake}
              title="Iniciar una operación"
              description="Comprar, vender o levantar capital con tu Copilot."
              cta={{ label: 'Empezar', href: '#', testId: 'home-card-operation-cta' }}
            />
          </button>
        </section>
      )}
    </div>
  );
}
