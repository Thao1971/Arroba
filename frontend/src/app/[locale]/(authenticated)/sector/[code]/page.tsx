'use client';
/**
 * `/sector/[code]` — Ficha Sectorial (publica). v1 "cableado real": mismo
 * criterio que `/mapa-empresarial` (2026-08-28) — consume unicamente
 * `apiClient.marketMap.sector*`, que a su vez llaman a los endpoints reales
 * ya existentes de Intel (sector-intelligence-v2 `/detail`, `/detail/.../companies`,
 * signal-intelligence `/sector`, cross-intelligence `/territory-for`). Ningun
 * dato aqui es inventado por Beta.
 *
 * Huecos reales confirmados (auditoria de Daniel, 2026-08-28/29) que esta
 * pantalla NO rellena con datos falsos, y que quedan fuera de v1:
 *   - Empresas activas reales por sector Y por provincia: DIRCE solo da el
 *     total nacional; el desglose por CNAE/provincia es una redistribucion
 *     estimada (`active_companies`, `market_share` van marcados "Estimado").
 *   - Series mensuales de creacion/cierre por sector: no existen (DIRCE no
 *     viene por sector ni por mes). Tampoco hay una serie MENSUAL de
 *     actividad BORME por sector expuesta hoy (solo el total agregado,
 *     `borme_events`, que si es real) — se muestra el total, no un grafico
 *     de evolucion.
 *   - Operaciones corporativas nombradas (deals con comprador/importe/fecha):
 *     no existe una base de M&A privado real. No se muestra ninguna.
 *   - Deltas vs. periodo anterior (+X pts): los scores no se snapshotean
 *     todavia, no hay historico para calcular la variacion.
 *   - Crecimiento (%) real por subsector: `growth_score` aplica el YoY
 *     NACIONAL a todos los sectores por igual (ver `national_yoy_pct`), no
 *     hay crecimiento real agregado por CNAE de 2 digitos.
 */
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  Radar,
  Users,
  Landmark,
  MapPin,
  Info,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

import {
  apiClient,
  type MarketMapSectorDetail,
  type MarketMapSectorCard,
  type MarketMapSectorCompany,
  type MarketMapSectorSignalsResponse,
  type MarketMapCrossTerritory,
  type MarketMapSectorLevel,
} from '@/lib/api/client';
import { Badge, Card, Spinner, Tooltip } from '@/components/ds';
import { cn } from '@/lib/cn';

/* ------------------------------------------------------------------ */
/* Helpers (mismo lenguaje visual que /mapa-empresarial)               */
/* ------------------------------------------------------------------ */

function fmtNum(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return new Intl.NumberFormat('es-ES').format(Math.round(v));
}

function fmtEur(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  if (v >= 1_000_000_000) return `€${(v / 1_000_000_000).toFixed(1).replace('.', ',')} Bn`;
  if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1).replace('.', ',')} M`;
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}

function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(1)}%`;
}

function fmtScore(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return v.toFixed(0);
}

function TrendIcon({ trend }: { trend: string | null | undefined }) {
  if (trend === 'up') return <TrendingUp size={14} className="text-success" />;
  if (trend === 'down') return <TrendingDown size={14} className="text-danger" />;
  return <Minus size={14} className="text-text-muted" />;
}

function EstimadoBadge({ reason }: { reason: string }) {
  return (
    <Tooltip content={{ title: 'Dato estimado', description: reason }}>
      <span>
        <Badge variant="warning">Estimado</Badge>
      </span>
    </Tooltip>
  );
}

function SectionTitle({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-text-muted mt-0.5">{icon}</span>
      <div>
        <h2 className="font-display font-semibold text-base text-text">{title}</h2>
        {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function EmptyRow({ text = 'No disponible ahora mismo' }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-text-muted py-4">
      <AlertTriangle size={14} />
      <span>{text}</span>
    </div>
  );
}

const LEVEL_LABEL: Record<MarketMapSectorLevel, string> = {
  section: 'Sección',
  division: 'División',
  group: 'Grupo',
};

/* ------------------------------------------------------------------ */
/* KPI hero                                                            */
/* ------------------------------------------------------------------ */

function KpiTile({ label, value, sub }: { label: string; value: string; sub?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="font-display text-2xl font-semibold text-text">{value}</p>
      {sub}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function FichaSectorialPage() {
  const params = useParams<{ code: string }>();
  const cnaeCode = decodeURIComponent(params.code || '');

  const [detail, setDetail] = useState<MarketMapSectorDetail | null>(null);
  const [children, setChildren] = useState<MarketMapSectorCard[]>([]);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailMissing, setDetailMissing] = useState(false);

  const [companies, setCompanies] = useState<MarketMapSectorCompany[]>([]);
  const [companiesTotal, setCompaniesTotal] = useState<number | null>(null);
  const [companiesCaveat, setCompaniesCaveat] = useState<string | null>(null);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesOffset, setCompaniesOffset] = useState(0);
  const COMPANIES_PAGE = 15;

  const [signals, setSignals] = useState<MarketMapSectorSignalsResponse | null>(null);
  const [signalsLoading, setSignalsLoading] = useState(true);

  const [territories, setTerritories] = useState<MarketMapCrossTerritory[]>([]);
  const [territoriesLoading, setTerritoriesLoading] = useState(true);

  useEffect(() => {
    if (!cnaeCode) return;
    let cancelled = false;
    setDetailLoading(true);
    setDetailMissing(false);
    apiClient.marketMap
      .sectorDetail(cnaeCode)
      .then((res) => {
        if (cancelled) return;
        setDetail(res.sector);
        setChildren(res.children ?? []);
        if (!res.sector) setDetailMissing(true);
      })
      .catch(() => {
        if (!cancelled) setDetailMissing(true);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cnaeCode]);

  useEffect(() => {
    if (!cnaeCode) return;
    let cancelled = false;
    setCompaniesLoading(true);
    apiClient.marketMap
      .sectorCompanies(cnaeCode, COMPANIES_PAGE, companiesOffset)
      .then((res) => {
        if (cancelled) return;
        setCompanies(res.companies ?? []);
        setCompaniesTotal(res.pagination?.total_in_arroba_universe ?? null);
        setCompaniesCaveat(res.data_caveat ?? null);
      })
      .catch(() => {
        if (!cancelled) setCompanies([]);
      })
      .finally(() => {
        if (!cancelled) setCompaniesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cnaeCode, companiesOffset]);

  useEffect(() => {
    if (!cnaeCode || !detail) return;
    let cancelled = false;
    setSignalsLoading(true);
    apiClient.marketMap
      .sectorSignals(cnaeCode, detail.cnae_level, 20)
      .then((res) => {
        if (!cancelled) setSignals(res);
      })
      .catch(() => {
        if (!cancelled) setSignals(null);
      })
      .finally(() => {
        if (!cancelled) setSignalsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cnaeCode, detail]);

  useEffect(() => {
    if (!detail) return;
    const section = detail.cnae_level === 'section' ? detail.cnae_code : detail.parent_section;
    if (!section) {
      setTerritoriesLoading(false);
      return;
    }
    let cancelled = false;
    setTerritoriesLoading(true);
    apiClient.marketMap
      .crossTerritoryFor(section, 'province', 10)
      .then((res) => {
        if (!cancelled) setTerritories(res.territories ?? []);
      })
      .catch(() => {
        if (!cancelled) setTerritories([]);
      })
      .finally(() => {
        if (!cancelled) setTerritoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [detail]);

  if (detailLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 flex justify-center">
        <Spinner size={24} />
      </div>
    );
  }

  if (detailMissing || !detail) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <Card>
          <EmptyRow text={`Intel no devolvió datos para el CNAE "${cnaeCode}". Comprueba el código (sección A-U, división de 2 dígitos, o grupo de 4).`} />
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Breadcrumb + header */}
      <div>
        <div className="flex items-center gap-1 text-xs text-text-muted mb-2">
          <Link href="/mapa-empresarial" className="hover:text-text">Mapa Empresarial</Link>
          <ChevronRight size={12} />
          {detail.parent_section && detail.cnae_level !== 'section' && (
            <>
              <Link href={`/sector/${detail.parent_section}`} className="hover:text-text">
                Sección {detail.parent_section}
              </Link>
              <ChevronRight size={12} />
            </>
          )}
          {detail.parent_division && detail.cnae_level === 'group' && (
            <>
              <Link href={`/sector/${detail.parent_division}`} className="hover:text-text">
                División {detail.parent_division}
              </Link>
              <ChevronRight size={12} />
            </>
          )}
          <span className="text-text">{LEVEL_LABEL[detail.cnae_level]} {detail.cnae_code}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-text">{detail.cnae_label}</h1>
          <Badge variant="info">{LEVEL_LABEL[detail.cnae_level]} · CNAE {detail.cnae_code}</Badge>
          {detail.signal && <Badge variant="success">{detail.signal.replace(/_/g, ' ')}</Badge>}
        </div>
        <p className="text-sm text-text-muted mt-1 max-w-2xl">
          Fuentes: {detail.source_attribution}. Lo que Intel estima en vez de contar directamente
          va marcado <Badge variant="warning">Estimado</Badge>.
        </p>
      </div>

      {/* KPIs */}
      <Card>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <KpiTile
            label="Índice de dinamismo"
            value={fmtScore(detail.dynamism_score)}
            sub={<div className="flex items-center gap-1"><TrendIcon trend={detail.trend_direction} /><span className="text-xs text-text-muted">motor principal: {detail.primary_driver}</span></div>}
          />
          <KpiTile
            label="Empresas activas"
            value={fmtNum(detail.active_companies)}
            sub={<EstimadoBadge reason="Redistribución del total nacional DIRCE por CNAE, no un conteo directo por sector." />}
          />
          <KpiTile label="Tamaño" value={fmtScore(detail.size_score)} />
          <KpiTile
            label="Crecimiento"
            value={fmtScore(detail.growth_score)}
            sub={<EstimadoBadge reason={`YoY nacional (${fmtPct(detail.national_yoy_pct)}) aplicado igual a todos los sectores — no hay crecimiento real por CNAE todavía.`} />}
          />
        </div>
      </Card>

      {/* Actividad real */}
      <Card
        header={
          <SectionTitle
            icon={<Landmark size={18} />}
            title="Actividad"
            subtitle="Contratación pública + BORME + Iberinform — real, combinado en activity_score"
          />
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-text-muted">Contratación pública</p>
            <p className="font-mono text-lg font-semibold">{fmtEur(detail.procurement_amount)}</p>
            <p className="text-xs text-text-muted">{fmtNum(detail.procurement_contracts)} contratos</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Eventos BORME (total)</p>
            <p className="font-mono text-lg font-semibold">{fmtNum(detail.borme_events)}</p>
            <p className="text-xs text-text-muted">acumulado, sin serie mensual por sector todavía</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Empresas en Iberinform</p>
            <p className="font-mono text-lg font-semibold">{fmtNum(detail.iberinform_companies)}</p>
          </div>
        </div>
        {detail.partial_data && (
          <p className="text-xs text-text-muted mt-3 flex items-center gap-1">
            <AlertTriangle size={12} /> Alguna de las 3 fuentes de actividad no tenía datos suficientes
            para este sector — el score se recalcula sobre las que sí había.
          </p>
        )}
      </Card>

      {/* Radar de señales */}
      <Card
        header={
          <SectionTitle icon={<Radar size={18} />} title="Radar de señales" subtitle="signal-intelligence, en vivo sobre el universo ARROBA" />
        }
      >
        {signalsLoading ? (
          <div className="flex justify-center py-6"><Spinner size={16} /></div>
        ) : !signals || signals.companies_analyzed === 0 ? (
          <EmptyRow text="Sin señales activas para este sector en el universo ya ingerido." />
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-text-muted">{fmtNum(signals.companies_analyzed)} empresas analizadas</p>
            {Object.keys(signals.counts_by_category).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(signals.counts_by_category).map(([cat, n]) => (
                  <Badge key={cat} variant="default">{cat}: {n}</Badge>
                ))}
              </div>
            )}
            {signals.top_opportunities.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-text-muted">Mejores oportunidades detectadas</p>
                {signals.top_opportunities.slice(0, 6).map((o) => (
                  <div key={`${o.master_id}-${o.signal_type}`} className="flex items-center justify-between text-sm px-3 py-2 rounded-md bg-surface-2">
                    <span className="truncate">{o.name}</span>
                    <span className="text-xs text-text-muted font-mono">{o.signal_type.replace(/\./g, ' · ')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Empresas destacadas */}
      <Card
        header={
          <SectionTitle icon={<Users size={18} />} title="Empresas destacadas" subtitle="universo ARROBA, ordenadas por facturación" />
        }
      >
        {companiesLoading ? (
          <div className="flex justify-center py-6"><Spinner size={16} /></div>
        ) : companies.length === 0 ? (
          <EmptyRow text="Sin empresas de este sector en el universo ya ingerido por ARROBA." />
        ) : (
          <>
            <div className="space-y-1">
              {companies.map((c) => (
                <div key={c.master_id} className="flex items-center justify-between text-sm px-3 py-2 rounded-md hover:bg-surface-2">
                  <div className="min-w-0">
                    <span className="text-text truncate block">{c.legal_name ?? c.master_id}</span>
                    {c.provincia && <span className="text-xs text-text-muted">{c.provincia}</span>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {c.active_signals_count > 0 && (
                      <Badge variant="info">{c.active_signals_count} señal{c.active_signals_count === 1 ? '' : 'es'}</Badge>
                    )}
                    <span className="font-mono text-xs text-text-muted">{fmtEur(c.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
            {companiesTotal !== null && companiesTotal > COMPANIES_PAGE && (
              <div className="flex items-center justify-between mt-3 text-xs text-text-muted">
                <span>{companiesOffset + 1}–{Math.min(companiesOffset + COMPANIES_PAGE, companiesTotal)} de {fmtNum(companiesTotal)}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={companiesOffset === 0}
                    onClick={() => setCompaniesOffset((o) => Math.max(0, o - COMPANIES_PAGE))}
                    className="px-2 py-1 rounded border border-border disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={companiesOffset + COMPANIES_PAGE >= companiesTotal}
                    onClick={() => setCompaniesOffset((o) => o + COMPANIES_PAGE)}
                    className="px-2 py-1 rounded border border-border disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
            {companiesCaveat && <p className="text-xs text-text-muted mt-3">{companiesCaveat}</p>}
          </>
        )}
      </Card>

      {/* Territorios líderes */}
      <Card
        header={
          <SectionTitle icon={<MapPin size={18} />} title="Dónde está creciendo" subtitle="territorios donde más concentra este sector" />
        }
      >
        {territoriesLoading ? (
          <div className="flex justify-center py-6"><Spinner size={16} /></div>
        ) : territories.length === 0 ? (
          <EmptyRow text="Sin cruce sector×territorio disponible." />
        ) : (
          <div className="space-y-1">
            {territories.slice(0, 8).map((t) => (
              <div key={t.geo_id} className="flex items-center justify-between text-sm px-3 py-2 rounded-md hover:bg-surface-2">
                <span className="text-text">{t.geo_name}</span>
                <div className="flex items-center gap-3">
                  <EstimadoBadge reason="Concentración derivada sobre el nº de empresas estimado por provincia (redistribución DIRCE), no sobre un conteo real." />
                  <span className="font-mono text-xs text-text-muted">{t.concentration_index.toFixed(1)}x media nacional</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Jerarquía CNAE */}
      {children.length > 0 && (
        <Card
          header={
            <SectionTitle
              icon={<Building2 size={18} />}
              title={detail.cnae_level === 'section' ? 'Divisiones de esta sección' : 'Grupos de esta división'}
            />
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {children.map((c) => (
              <Link
                key={c.cnae_code}
                href={`/sector/${c.cnae_code}`}
                className="flex items-center justify-between text-sm px-3 py-2 rounded-md hover:bg-surface-2 border border-transparent hover:border-border"
              >
                <span className="truncate">{c.cnae_label}</span>
                <span className="font-mono text-xs text-text-muted">{fmtScore(c.dynamism_score)}</span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Lo que falta — honestidad primero */}
      <Card header={<SectionTitle icon={<Info size={18} />} title="Lo que esta ficha todavía no tiene" />}>
        <p className="text-xs text-text-muted">
          Sin operaciones corporativas nombradas (comprador/importe/fecha) — no existe una base de M&A
          privado real. Sin variación vs. periodo anterior (los scores no se snapshotean todavía, no hay
          histórico). Sin serie mensual de creación/cierre de empresas ni de actividad BORME por sector —
          solo el total acumulado ({fmtNum(detail.borme_events)} eventos BORME, real). Sin crecimiento (%)
          real por subsector — <code>growth_score</code> aplica el YoY nacional por igual a todos los CNAE.
        </p>
      </Card>
    </div>
  );
}
