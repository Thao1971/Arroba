'use client';
/**
 * Home privada — SPRINT 1 · F5 + Home nueva (2026-09-10)
 *
 * Estados canónicos:
 *   - App Shell primer día: sin actividad (watchlist vacía) → saludo + 3
 *     FeatureCardBlock ("Analizar una empresa", "Valorar un negocio",
 *     "Iniciar una operación").
 *   - Cartera: watchlist con >= 1 empresa → sección "Cartera" con
 *     CompanyCardsGridBlock iterando `watchlist.items`.
 *
 * 2026-09-10: se añaden 3 secciones del mockup de Claude Design que SI tienen
 * dato real detrás en Intel/Beta, cableadas contra los mismos endpoints que
 * ya usa Mapa Empresarial (`/api/market-map/*`, proxy publico de
 * business-demography / sector-intelligence):
 *   - Buscador + chips: mismo `useCopilot().send()` que el buscador del
 *     hero publico (`HeroSearchTeaser`/`HeroSearchChips`, extraidos a
 *     `@/components/home/HeroSearch`), no un mecanismo nuevo.
 *   - KPIs (empresas activas/nuevas/cerradas + balance neto): mismo
 *     `KpiCard` compartido que Mapa Empresarial, con la variacion
 *     mes-a-mes (`change_pct_mom`) en vez de interanual -- a peticion de
 *     Daniel, es la que mas se mueve y por tanto la mas util en un vistazo
 *     diario.
 *   - Sectores mas dinamicos: ranking real de `sector-intelligence`
 *     mezclando niveles CNAE seccion + division en una sola lista
 *     (`level=section,division`), etiquetando cada fila con `cnae_level_es`
 *     para no ocultar que son granularidades distintas.
 *
 * NO añade las otras secciones del mockup que NO tienen dato real detras
 * todavia: "Oportunidades detectadas" (tarjetas tematicas por IA/ciberseg/
 * ESG/deuda -- Intel solo tiene senales por sector, no por tema), "Tus
 * ultimas busquedas" / "Ultimas empresas consultadas" (no existe historial
 * de actividad de usuario todavia) y el estadistico "5.265 empresas / 5
 * capas de datos" del mockup (no corresponde a ningun conteo real de Intel).
 * Mismo criterio que ya sigue esta pantalla y Mapa Empresarial: lo que Intel
 * no calcula todavia, se omite -- nunca se rellena con un mock.
 */
import useSWR from 'swr';
import { useMemo } from 'react';
import Link from 'next/link';
import { Search, TrendingUp, TrendingDown, Minus, Handshake, Building2, Info } from 'lucide-react';
import { RequireAuth } from '@/components/RequireAuth';
import {
  FeatureCardBlock,
  CompanyCardsGridBlock,
  type CompanyCardsGridItem,
} from '@/components/blocks';
import { Badge, Card, KpiCard, Spinner, Tooltip } from '@/components/ds';
import { HeroSearchTeaser, HeroSearchChips } from '@/components/home/HeroSearch';
import {
  apiClient,
  type WatchlistListResponse,
  type MarketMapNationalResponse,
  type MarketMapSectorsResponse,
} from '@/lib/api/client';
import { useActiveOrg } from '@/lib/workspaces/useActiveOrg';
import { useAuth } from '@/contexts/auth-context';
import { useCopilot } from '@/components/copilot/CopilotProvider';
import { formatNumber } from '@/lib/format';

function greeting(now: Date, name: string | null | undefined): string {
  const h = now.getHours();
  let base = 'Buenos días';
  if (h >= 13 && h < 21) base = 'Buenas tardes';
  else if (h >= 21 || h < 6) base = 'Buenas noches';
  const first = (name || '').split(' ')[0]?.trim();
  return first ? `${base}, ${first}.` : `${base}.`;
}

function TrendIcon({ trend }: { trend: string | null | undefined }) {
  if (trend === 'up') return <TrendingUp size={14} className="text-success" />;
  if (trend === 'down') return <TrendingDown size={14} className="text-danger" />;
  return <Minus size={14} className="text-text-muted" />;
}

/**
 * Fila compacta de "Sectores más dinámicos". `s.cnae_level_es` puede ser
 * "Sección" o "División" según la fila -- el ranking mezcla ambas
 * granularidades a propósito (a petición de Daniel, 2026-09-10), así que se
 * etiqueta cada una para que no parezcan del mismo nivel.
 */
function HomeSectorRow({
  s,
}: {
  s: MarketMapSectorsResponse['sectors'][number];
}) {
  return (
    <Link
      href={`/sector/${s.cnae_code}`}
      data-testid={`home-sector-row-${s.cnae_code}`}
      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-md border border-transparent hover:bg-surface-2 hover:border-border transition-colors"
    >
      <span className="flex items-center gap-2 min-w-0">
        <Building2 size={14} className="text-text-muted shrink-0" />
        <span className="font-medium text-sm text-text truncate">{s.cnae_label}</span>
        {s.cnae_level_es && (
          <Badge variant="default" className="shrink-0">
            {s.cnae_level_es} CNAE
          </Badge>
        )}
        {s.partial_data && (
          <Badge variant="warning" className="shrink-0">
            Estimado
          </Badge>
        )}
      </span>
      <span className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-text-muted">{formatNumber(s.active_companies)} empresas</span>
        <span className="font-mono text-sm font-semibold text-text">
          {s.dynamism_score !== null && s.dynamism_score !== undefined
            ? `${Math.round(s.dynamism_score)}%`
            : '—'}
        </span>
        <TrendIcon trend={s.trend_direction} />
      </span>
    </Link>
  );
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

  // Pulso del mercado -- mismo proxy publico que Mapa Empresarial
  // (business-demography via /api/market-map/national). Variacion mes-a-mes
  // a peticion de Daniel (2026-09-10): mas dinamica que el interanual para
  // un vistazo diario.
  const { data: national, isLoading: nationalLoading } = useSWR<MarketMapNationalResponse>(
    '/api/market-map/national',
    () => apiClient.marketMap.national(),
    { revalidateOnFocus: false },
  );

  // Sectores mas dinamicos -- mezcla seccion + division en un unico ranking
  // real (a peticion de Daniel, 2026-09-10): Intel ya lo soporta via
  // `level=section,division` en `sector-intelligence/top-dynamic`.
  const { data: sectorsResp, isLoading: sectorsLoading } = useSWR<MarketMapSectorsResponse>(
    '/api/market-map/sectors?level=section,division&metric=dynamism&limit=6',
    () => apiClient.marketMap.sectors({ level: ['section', 'division'], metric: 'dynamism', limit: 6 }),
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

      <section data-testid="home-privada-search" className="space-y-1">
        <HeroSearchTeaser />
        <HeroSearchChips />
      </section>

      <section
        data-testid="home-privada-kpis"
        className="space-y-3"
        aria-labelledby="home-privada-kpis-title"
      >
        <h2
          id="home-privada-kpis-title"
          className="font-display text-lg font-semibold text-text-primary"
        >
          Pulso del mercado
        </h2>
        {nationalLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <Spinner size={16} />
              </Card>
            ))}
          </div>
        ) : !national?.kpis ? (
          <Card>
            <p className="text-sm text-text-muted">
              Intel no devolvió el resumen nacional en este momento.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard
              label="Empresas activas"
              value={national.kpis.active_companies.value}
              changePct={national.kpis.active_companies.change_pct_mom}
              trend={national.kpis.active_companies.trend}
              periodLabel="vs. mes anterior"
            />
            <KpiCard
              label="Altas"
              value={national.kpis.new_companies.value}
              changePct={national.kpis.new_companies.change_pct_mom}
              trend={national.kpis.new_companies.trend}
              periodLabel="vs. mes anterior"
            />
            <KpiCard
              label="Bajas"
              value={national.kpis.closed_companies.value}
              changePct={national.kpis.closed_companies.change_pct_mom}
              trend={national.kpis.closed_companies.trend}
              periodLabel="vs. mes anterior"
            />
            <KpiCard
              label="Balance neto"
              value={national.kpis.net_balance.value}
              changePct={null}
              trend={
                national.kpis.net_balance.value === null
                  ? null
                  : national.kpis.net_balance.value >= 0
                  ? 'up'
                  : 'down'
              }
            />
          </div>
        )}
      </section>

      <section
        data-testid="home-privada-sectores"
        className="space-y-3"
        aria-labelledby="home-privada-sectores-title"
      >
        <div className="flex items-center gap-1.5">
          <h2
            id="home-privada-sectores-title"
            className="font-display text-lg font-semibold text-text-primary"
          >
            Sectores más dinámicos
          </h2>
          <Tooltip
            content={{
              title: 'Metodología del ranking',
              description:
                'Índice de dinamismo = 25% tamaño (empresas activas) + 40% crecimiento (altas/bajas interanual) + 35% actividad reciente (contratación pública, movimientos societarios BORME y señales Iberinform). Sección CNAE / División CNAE = nivel de la clasificación oficial CNAE del sector. Estimado = falta alguna de las tres fuentes de actividad real, o no hay conteo directo de empresas — el dato combina estimaciones proporcionales.',
            }}
          >
            <span
              role="button"
              tabIndex={0}
              aria-label="Información sobre el índice de dinamismo"
              className="inline-flex items-center text-text-muted hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-full cursor-help"
            >
              <Info size={14} />
            </span>
          </Tooltip>
        </div>
        <p className="text-sm text-text-muted">
          Ranking nacional (sin desglose por comunidad o provincia) por índice de dinamismo — combina tamaño, crecimiento y actividad reciente.
        </p>
        <Card padded={false}>
          {sectorsLoading ? (
            <div className="p-4">
              <Spinner size={16} />
            </div>
          ) : !sectorsResp?.sectors.length ? (
            <p className="text-sm text-text-muted p-4">
              Intel no devolvió sectores en este momento.
            </p>
          ) : (
            <div className="divide-y divide-border p-1">
              {sectorsResp.sectors.map((s) => (
                <HomeSectorRow key={s.cnae_code} s={s} />
              ))}
            </div>
          )}
        </Card>
        <p className="text-xs text-text-muted mt-2">
          Sección/División CNAE = nivel de la clasificación oficial · Estimado = falta alguna fuente real de actividad
        </p>
      </section>

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
