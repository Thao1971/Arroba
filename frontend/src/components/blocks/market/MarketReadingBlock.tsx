'use client';
// HARDENING-BETA-para-emergent · aterrizaje aislado (opción a2).
// Componente presentacional puro. NO cableado a ficha ni backend.
// Cableado real planificado en HARDENING-037 (layout monolito) y HARDENING-038 (proxies Intel).
/**
 * @componentId COMP-M-0020
 * @status PROVISIONAL
 * @section Mercado
 *
 * MarketReadingBlock — sección Mercado rediseñada.
 *
 * Orden de lectura para un comprador/analista: (1) LECTURA de mercado en prosa
 * (IA fact-lock, cacheada en Intel — opcional), (2) posición de la empresa,
 * (3) sector y territorio traducidos a lenguaje, (4) concentración en claro.
 *
 * P2 · Intelligence over data: los scores 0-100 se traducen a banda + barra;
 *      el HHI técnico va en tooltip. R4 · no calcula: pinta lo que llega.
 * Degradación elegante: cada bloque solo se pinta si tiene dato; sin `reading`
 * se muestran solo las tarjetas (nunca hueco ni error).
 */
import { Sparkles, Trophy, MapPin, TrendingDown, TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/cn';

type Trend = 'up' | 'down' | 'flat' | null;

export interface MarketContextView {
  reading?: string | null; // prosa IA (opcional)
  position?: {
    headline: string; // "Líder por ingresos en su sector"
    percentile?: number | null; // 0-100
    sectorRank?: string | null; // "#5 de 14 en su sector"
    territoryRank?: string | null; // "#1 de 35 en Barcelona"
  } | null;
  sector?: {
    label: string; // "agencias de viajes"
    verdict: string; // "Sector en contracción"
    dynamism?: number | null; // 0-100
    trend?: Trend;
  } | null;
  territory?: {
    label: string; // "Barcelona"
    verdict: string; // "Plaza de primer nivel"
    dynamism?: number | null;
    activeCompanies?: number | null;
    netCreation?: number | null;
  } | null;
  concentration?: {
    label: string; // "Mercado moderadamente concentrado"
    actors?: number | null;
    hhi?: number | null;
  } | null;
}

function band(score: number | null | undefined): string {
  if (score == null) return '—';
  if (score >= 66) return 'Alto';
  if (score >= 33) return 'Medio';
  return 'Bajo';
}

function nf(n: number | null | undefined): string {
  return n == null ? '—' : n.toLocaleString('es-ES');
}

function Bar({ value, tone }: { value: number | null | undefined; tone: string }) {
  const w = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className="flex-1 h-1.5 rounded-full bg-surface-muted">
      <div className={cn('h-full rounded-full', tone)} style={{ width: `${w}%` }} />
    </div>
  );
}

export function MarketReadingBlock({ data }: { data: MarketContextView }) {
  const { reading, position, sector, territory, concentration } = data;

  return (
    <div data-testid="market-reading" className="flex flex-col gap-4">
      {reading ? (
        <section className="rounded-2xl border border-border-default bg-surface-elevated p-6">
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles size={16} className="text-brand-primary" aria-hidden />
            <span className="text-body-sm font-bold text-text-primary">Lectura de mercado</span>
            <span className="text-caption text-text-muted bg-surface-muted rounded-full px-2 py-0.5">
              IA · sobre datos verificados
            </span>
          </div>
          <p className="text-body text-text-primary leading-relaxed m-0">{reading}</p>
        </section>
      ) : null}

      {position ? (
        <section className="rounded-2xl border border-border-default bg-surface-elevated p-6">
          <div className="text-body-sm text-text-secondary mb-1.5">Posición de la empresa</div>
          <div className="font-display text-h4 font-bold text-text-primary">{position.headline}</div>
          {position.percentile != null ? (
            <>
              <div className="text-body-sm text-text-secondary mb-4">
                Mejor que el {Math.round(position.percentile)} % de sus comparables
              </div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-caption text-text-muted w-16">Percentil</span>
                <Bar value={position.percentile} tone="bg-brand-primary" />
                <span className="text-body-sm font-bold text-text-primary w-9 text-right">
                  {Math.round(position.percentile)}º
                </span>
              </div>
            </>
          ) : null}
          {position.sectorRank || position.territoryRank ? (
            <div className="flex flex-wrap gap-2 mt-3">
              {position.sectorRank ? (
                <span className="text-body-sm text-text-primary bg-surface-muted rounded-full px-3 py-1.5 inline-flex items-center gap-1.5">
                  <Trophy size={14} className="text-text-muted" aria-hidden />
                  {position.sectorRank}
                </span>
              ) : null}
              {position.territoryRank ? (
                <span className="text-body-sm text-text-primary bg-surface-muted rounded-full px-3 py-1.5 inline-flex items-center gap-1.5">
                  <MapPin size={14} className="text-text-muted" aria-hidden />
                  {position.territoryRank}
                </span>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {sector || territory ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {sector ? (
            <section className="rounded-2xl border border-border-default bg-surface-elevated p-6">
              <div className="text-body-sm text-text-secondary mb-1">Su sector · {sector.label}</div>
              <div className="text-body font-bold text-text-primary mb-3.5">{sector.verdict}</div>
              {sector.dynamism != null ? (
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="text-caption text-text-muted w-20">Dinamismo</span>
                  <Bar value={sector.dynamism} tone="bg-brand-primary" />
                  <span className="text-caption text-text-secondary w-11 text-right">{band(sector.dynamism)}</span>
                </div>
              ) : null}
              {sector.trend ? (
                <div className="flex justify-between text-body-sm pt-2 border-t border-border-default">
                  <span className="text-text-secondary">Tendencia nacional</span>
                  <span className={cn('font-bold inline-flex items-center gap-1',
                    sector.trend === 'down' ? 'text-danger' : sector.trend === 'up' ? 'text-success' : 'text-text-secondary')}>
                    {sector.trend === 'down' ? <TrendingDown size={15} aria-hidden /> : sector.trend === 'up' ? <TrendingUp size={15} aria-hidden /> : null}
                    {sector.trend === 'down' ? 'A la baja' : sector.trend === 'up' ? 'Al alza' : 'Estable'}
                  </span>
                </div>
              ) : null}
            </section>
          ) : null}

          {territory ? (
            <section className="rounded-2xl border border-border-default bg-surface-elevated p-6">
              <div className="text-body-sm text-text-secondary mb-1">Su territorio · {territory.label}</div>
              <div className="text-body font-bold text-text-primary mb-3.5">{territory.verdict}</div>
              {territory.dynamism != null ? (
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="text-caption text-text-muted w-20">Dinamismo</span>
                  <Bar value={territory.dynamism} tone="bg-success" />
                  <span className="text-caption text-text-secondary w-11 text-right">{band(territory.dynamism)}</span>
                </div>
              ) : null}
              {territory.activeCompanies != null ? (
                <div className="flex justify-between text-body-sm pt-2 border-t border-border-default">
                  <span className="text-text-secondary">Empresas activas</span>
                  <span className="text-text-primary font-bold">
                    {nf(territory.activeCompanies)}
                    {territory.netCreation != null ? (
                      <span className="text-success"> · {territory.netCreation >= 0 ? '+' : ''}{nf(territory.netCreation)} netas</span>
                    ) : null}
                  </span>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      ) : null}

      {concentration ? (
        <section className="rounded-2xl border border-border-default bg-surface-elevated px-6 py-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-body font-bold text-text-primary">{concentration.label}</div>
            {concentration.actors != null ? (
              <div className="text-body-sm text-text-secondary inline-flex items-center gap-1">
                {nf(concentration.actors)} actores relevantes compiten por la cuota
                {concentration.hhi != null ? (
                  <span title={`Índice HHI ${nf(Math.round(concentration.hhi))} (0=atomizado, 10.000=monopolio)`}>
                    <Info size={13} className="text-text-muted" aria-hidden />
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
