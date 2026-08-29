'use client';
/**
 * `/mapa-empresarial` — Mapa Empresarial (público). v1 "cableado real":
 * consume únicamente los proxies de `apiClient.marketMap.*`, que a su vez
 * llaman a los endpoints públicos ya existentes en Intel (geo-intelligence,
 * sector-intelligence-v2, cross-intelligence, business-demography). Ningún
 * dato aquí es inventado por Beta: lo que Intel no calcula todavía, esta
 * pantalla lo omite o lo marca "Estimado" — nunca lo rellena con un mock.
 *
 * Simplificaciones deliberadas de v1 (vs. el wireframe original), a validar
 * con Daniel antes de sumar esta pantalla al deploy:
 *   - Sin AIBar (banner narrativo por IA): no existe un generador de ese
 *     texto en Intel hoy.
 *   - Mapa SVG de España (CCAA) añadido 2026-08-29 — mismas formas estilizadas del mockup, coloreadas con el dynamism_score real. Solo visible con geoLevel==='ccaa'.
 *     de territorios — mismos datos, sin la coreografía visual del mockup.
 *   - Sin filtro "Periodo" (histórico por snapshot): Intel no expone
 *     snapshots pasados de geo/sector-intelligence, solo el estado actual.
 *   - "Sectores emergentes" usa las etiquetas CNAE reales (secciones/
 *     divisiones) que devuelve Intel, no los nombres de sector "tech" de
 *     fantasía del wireframe.
 */
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Building2,
  Sparkles,
  GitCompare,
  Info,
  AlertTriangle,
} from 'lucide-react';

import {
  apiClient,
  type MarketMapNationalResponse,
  type MarketMapTerritoryCard,
  type MarketMapTerritoryDetailResponse,
  type MarketMapSectorCard,
  type MarketMapCrossSector,
  type MarketMapCrossTerritory,
  type MarketMapGeoLevel,
  type MarketMapSectorLevel,
  type MarketMapMetric,
} from '@/lib/api/client';
import { Badge, Card, Spinner, Tooltip } from '@/components/ds';
import { cn } from '@/lib/cn';
import { SpainMap } from '@/components/mapa-empresarial/SpainMap';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function fmtNum(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return new Intl.NumberFormat('es-ES').format(Math.round(v));
}

function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(1)}%`;
}

function fmtScore(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return v.toFixed(1);
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

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
}) {
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

function ToggleGroup<T extends string | number>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-md border border-border overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium transition-colors',
            value === opt.value
              ? 'bg-text text-surface'
              : 'bg-surface text-text-muted hover:bg-surface-2'
          )}
        >
          {opt.label}
        </button>
      ))}
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

/* ------------------------------------------------------------------ */
/* KPI row                                                             */
/* ------------------------------------------------------------------ */

function KpiCard({
  label,
  value,
  changePct,
  trend,
}: {
  label: string;
  value: number | null;
  changePct: number | null;
  trend: string | null;
}) {
  return (
    <Card>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="font-display text-2xl font-semibold text-text mt-1">{fmtNum(value)}</p>
      <div className="flex items-center gap-1 mt-1">
        <TrendIcon trend={trend} />
        <span
          className={cn(
            'text-xs font-medium',
            changePct && changePct > 0
              ? 'text-success'
              : changePct && changePct < 0
              ? 'text-danger'
              : 'text-text-muted'
          )}
        >
          {fmtPct(changePct)}
        </span>
        <span className="text-xs text-text-muted">vs. periodo anterior</span>
      </div>
    </Card>
  );
}

function EvolutionCard({
  data,
  months,
  onMonthsChange,
  loading,
}: {
  data: MarketMapNationalResponse['evolution'];
  months: 12 | 24 | 36;
  onMonthsChange: (m: 12 | 24 | 36) => void;
  loading: boolean;
}) {
  const created = data?.created ?? [];
  const closed = data?.closed ?? [];
  const labels = data?.months ?? [];
  const maxVal = Math.max(1, ...created, ...closed);

  return (
    <Card
      header={
        <div className="flex items-center justify-between">
          <SectionTitle
            icon={<TrendingUp size={18} />}
            title="Evolución de altas y bajas"
            subtitle="INE — Sociedades Mercantiles, serie mensual"
          />
          <ToggleGroup
            value={months}
            onChange={onMonthsChange}
            options={[
              { value: 12, label: '12m' },
              { value: 24, label: '24m' },
              { value: 36, label: '36m' },
            ]}
          />
        </div>
      }
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : created.length === 0 ? (
        <EmptyRow text="Intel no devolvió la serie histórica en este momento." />
      ) : (
        <div>
          <div className="flex items-end gap-1 h-32">
            {created.map((c, i) => {
              const cl = closed[i] ?? 0;
              return (
                <div key={i} className="flex-1 flex flex-col justify-end gap-0.5 group relative">
                  <div
                    className="bg-success/60 rounded-t-sm"
                    style={{ height: `${(c / maxVal) * 100}%`, minHeight: c > 0 ? 2 : 0 }}
                  />
                  <div
                    className="bg-danger/50 rounded-b-sm"
                    style={{ height: `${(cl / maxVal) * 100}%`, minHeight: cl > 0 ? 2 : 0 }}
                  />
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block text-[10px] bg-text text-surface px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                    {labels[i] ?? ''}: +{fmtNum(c)} / −{fmtNum(cl)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-success/60 inline-block" /> Altas
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-danger/50 inline-block" /> Bajas
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Territory ranking                                                   */
/* ------------------------------------------------------------------ */

/* ── Tarjeta flotante sobre el mapa (réplica del popup "Madrid" del mock) ── */
function MapHoverCard({ t }: { t: MarketMapTerritoryCard }) {
  return (
    <div className="absolute top-2 right-2 w-48 bg-surface border border-border-strong rounded-lg shadow-lg p-3 pointer-events-none">
      <p className="font-display font-semibold text-sm text-text truncate">{t.geo_name}</p>
      <div className="mt-1.5 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">Empresas activas</span>
          <span className="font-mono font-medium text-text">{fmtNum(t.active_companies)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">Nuevas empresas</span>
          <span className="font-mono font-medium text-success">{fmtNum(t.new_companies)}</span>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
        <span className="text-[11px] text-text-muted">Índice de dinamismo</span>
        <span className="font-display text-lg font-bold text-danger">{fmtScore(t.dynamism_score)}</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5 mt-1.5 text-[10px] text-text-muted">
        <div><p>Tamaño</p><p className="font-mono text-text">{fmtScore(t.size_score)}</p></div>
        <div><p>Crecim.</p><p className="font-mono text-text">{fmtScore(t.growth_score)}</p></div>
        <div><p>Activ.</p><p className="font-mono text-text">{fmtScore(t.activity_score)}</p></div>
      </div>
      {t.primary_driver && (
        <p className="text-[10px] text-text-muted mt-1.5 pt-1.5 border-t border-border truncate">
          Sector líder: <span className="text-text">{t.primary_driver}</span>
        </p>
      )}
    </div>
  );
}

function TerritoryRow({
  t,
  selected,
  onSelect,
}: {
  t: MarketMapTerritoryCard;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-left transition-colors',
        selected ? 'bg-surface-2 border border-border' : 'hover:bg-surface-2 border border-transparent'
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <MapPin size={14} className="text-text-muted shrink-0" />
        <span className="font-medium text-sm text-text truncate">{t.geo_name}</span>
        {t.partial_data && <EstimadoBadge reason="Componente de tamaño/actividad estimado a partir de distribuciones nacionales por provincia (INE DIRCE), no de conteo directo." />}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-text-muted">{fmtNum(t.active_companies)} empresas</span>
        <span className="font-mono text-sm font-semibold text-text">{fmtScore(t.dynamism_score)}</span>
        <TrendIcon trend={t.trend_direction} />
      </div>
    </button>
  );
}

function TerritoryDetail({
  detail,
  crossSectors,
  crossLoading,
}: {
  detail: MarketMapTerritoryDetailResponse | null;
  crossSectors: MarketMapCrossSector[];
  crossLoading: boolean;
}) {
  if (!detail || !detail.territory) return null;
  const t = detail.territory;
  return (
    <div className="mt-3 border-t border-border pt-3 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <p className="text-[11px] text-text-muted">Tamaño</p>
          <p className="font-mono text-sm font-semibold">{fmtScore(t.size_score)}</p>
        </div>
        <div>
          <p className="text-[11px] text-text-muted">Crecimiento</p>
          <p className="font-mono text-sm font-semibold">{fmtScore(t.growth_score)}</p>
        </div>
        <div>
          <p className="text-[11px] text-text-muted">Actividad</p>
          <p className="font-mono text-sm font-semibold">{fmtScore(t.activity_score)}</p>
        </div>
        <div>
          <p className="text-[11px] text-text-muted">Contratos públicos</p>
          <p className="font-mono text-sm font-semibold">{fmtNum(t.public_contracts_count)}</p>
        </div>
      </div>
      {t.primary_driver && (
        <p className="text-xs text-text-muted">
          Motor principal: <span className="text-text font-medium">{t.primary_driver}</span>
        </p>
      )}
      {detail.provinces && detail.provinces.length > 0 && (
        <div>
          <p className="text-xs font-medium text-text-muted mb-1.5">Provincias de la comunidad</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {detail.provinces.map((p) => (
              <div
                key={p.geo_id}
                className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-surface-2"
              >
                <span className="truncate">{p.geo_name}</span>
                <span className="font-mono">{fmtScore(p.dynamism_score)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <p className="text-xs font-medium text-text-muted mb-1.5 flex items-center gap-1">
          Sectores con más actividad aquí
          <EstimadoBadge reason="El nº de empresas por sector y territorio se estima cruzando el total nacional del sector con el peso de este territorio (BORME + Iberinform validan la dirección, no el conteo exacto)." />
        </p>
        {crossLoading ? (
          <Spinner size={14} />
        ) : crossSectors.length === 0 ? (
          <EmptyRow text="Sin cruce sector×territorio disponible para esta zona." />
        ) : (
          <div className="space-y-1">
            {crossSectors.slice(0, 6).map((s) => (
              <div key={s.cnae_section} className="flex items-center justify-between text-xs">
                <span className="text-text truncate">{s.cnae_label}</span>
                <span className="text-text-muted font-mono">{fmtNum(s.estimated_companies)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sector ranking                                                      */
/* ------------------------------------------------------------------ */

function SectorRow({
  s,
  selected,
  onSelect,
}: {
  s: MarketMapSectorCard;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={cn(
        'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md transition-colors',
        selected ? 'bg-surface-2 border border-border' : 'hover:bg-surface-2 border border-transparent'
      )}
    >
      <button type="button" onClick={onSelect} className="flex items-center gap-2 min-w-0 text-left flex-1">
        <Building2 size={14} className="text-text-muted shrink-0" />
        <span className="font-medium text-sm text-text truncate">{s.cnae_label}</span>
        {s.partial_data && <EstimadoBadge reason="Componente de tamaño estimado a partir de la distribución nacional del sector (INE), no de un recuento granular por división/grupo." />}
      </button>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-text-muted">{fmtNum(s.active_companies)} empresas</span>
        <span className="font-mono text-sm font-semibold text-text">{fmtScore(s.dynamism_score)}</span>
        <TrendIcon trend={s.trend_direction} />
        <Link
          href={`/sector/${s.cnae_code}`}
          className="text-xs text-text-muted hover:text-text underline underline-offset-2"
          title="Ver ficha sectorial completa"
        >
          Ficha →
        </Link>
      </div>
    </div>
  );
}

function SectorDetail({
  sector,
  crossTerritories,
  crossLoading,
}: {
  sector: MarketMapSectorCard | null;
  crossTerritories: MarketMapCrossTerritory[];
  crossLoading: boolean;
}) {
  if (!sector) return null;
  return (
    <div className="mt-3 border-t border-border pt-3 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <p className="text-[11px] text-text-muted">Tamaño</p>
          <p className="font-mono text-sm font-semibold">{fmtScore(sector.size_score)}</p>
        </div>
        <div>
          <p className="text-[11px] text-text-muted">Crecimiento</p>
          <p className="font-mono text-sm font-semibold">{fmtScore(sector.growth_score)}</p>
        </div>
        <div>
          <p className="text-[11px] text-text-muted">Actividad</p>
          <p className="font-mono text-sm font-semibold">{fmtScore(sector.activity_score)}</p>
        </div>
        <div>
          <p className="text-[11px] text-text-muted">Contratación pública</p>
          <p className="font-mono text-sm font-semibold">{fmtNum(sector.procurement_contracts)}</p>
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-text-muted mb-1.5 flex items-center gap-1">
          Territorios donde más pesa este sector
          <EstimadoBadge reason="Estimado cruzando el total nacional del sector con el peso relativo de cada provincia (BORME + Iberinform validan la dirección, no el conteo exacto)." />
        </p>
        {crossLoading ? (
          <Spinner size={14} />
        ) : crossTerritories.length === 0 ? (
          <EmptyRow text="Sin cruce sector×territorio disponible para este sector." />
        ) : (
          <div className="space-y-1">
            {crossTerritories.slice(0, 6).map((t) => (
              <div key={t.geo_id} className="flex items-center justify-between text-xs">
                <span className="text-text truncate">{t.geo_name}</span>
                <span className="text-text-muted font-mono">{fmtNum(t.estimated_companies)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Comparator (simplificado — solo territorios ya cargados en el ranking) */
/* ------------------------------------------------------------------ */

function ComparatorCard({ territories }: { territories: MarketMapTerritoryCard[] }) {
  const [aId, setAId] = useState('');
  const [bId, setBId] = useState('');
  const a = territories.find((t) => t.geo_id === aId) ?? null;
  const b = territories.find((t) => t.geo_id === bId) ?? null;

  const rows: { label: string; key: keyof MarketMapTerritoryCard }[] = [
    { label: 'Dinamismo', key: 'dynamism_score' },
    { label: 'Tamaño', key: 'size_score' },
    { label: 'Crecimiento', key: 'growth_score' },
    { label: 'Actividad', key: 'activity_score' },
    { label: 'Empresas activas', key: 'active_companies' },
  ];

  return (
    <Card
      header={
        <SectionTitle
          icon={<GitCompare size={18} />}
          title="Comparador"
          subtitle="Compara dos territorios del ranking actual"
        />
      }
    >
      <div className="grid grid-cols-2 gap-3 mb-3">
        <select
          className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface"
          value={aId}
          onChange={(e) => setAId(e.target.value)}
        >
          <option value="">Selecciona territorio A</option>
          {territories.map((t) => (
            <option key={t.geo_id} value={t.geo_id}>
              {t.geo_name}
            </option>
          ))}
        </select>
        <select
          className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface"
          value={bId}
          onChange={(e) => setBId(e.target.value)}
        >
          <option value="">Selecciona territorio B</option>
          {territories.map((t) => (
            <option key={t.geo_id} value={t.geo_id}>
              {t.geo_name}
            </option>
          ))}
        </select>
      </div>
      {a && b ? (
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-border">
                <td className="py-1.5 text-text-muted text-xs">{r.label}</td>
                <td className="py-1.5 text-right font-mono">{fmtScore(a[r.key] as number)}</td>
                <td className="py-1.5 text-right font-mono">{fmtScore(b[r.key] as number)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-xs text-text-muted">Elige dos territorios para comparar sus indicadores.</p>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function MapaEmpresarialPage() {
  const [months, setMonths] = useState<12 | 24 | 36>(12);
  const [national, setNational] = useState<MarketMapNationalResponse | null>(null);
  const [nationalLoading, setNationalLoading] = useState(true);

  const [geoLevel, setGeoLevel] = useState<MarketMapGeoLevel>('ccaa');
  const [geoMetric, setGeoMetric] = useState<MarketMapMetric>('dynamism');
  const [territories, setTerritories] = useState<MarketMapTerritoryCard[]>([]);
  const [territoriesLoading, setTerritoriesLoading] = useState(true);
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | null>(null);
  const [hoveredTerritoryId, setHoveredTerritoryId] = useState<string | null>(null);
  const [territoryDetail, setTerritoryDetail] = useState<MarketMapTerritoryDetailResponse | null>(null);
  const [territoryCross, setTerritoryCross] = useState<MarketMapCrossSector[]>([]);
  const [territoryCrossLoading, setTerritoryCrossLoading] = useState(false);

  const [sectorLevel, setSectorLevel] = useState<MarketMapSectorLevel>('section');
  const [sectorMetric, setSectorMetric] = useState<MarketMapMetric>('dynamism');
  const [sectors, setSectors] = useState<MarketMapSectorCard[]>([]);
  const [sectorsLoading, setSectorsLoading] = useState(true);
  const [selectedSectorCode, setSelectedSectorCode] = useState<string | null>(null);
  const [sectorCross, setSectorCross] = useState<MarketMapCrossTerritory[]>([]);
  const [sectorCrossLoading, setSectorCrossLoading] = useState(false);

  const [emerging, setEmerging] = useState<MarketMapSectorCard[]>([]);
  const [emergingLoading, setEmergingLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setNationalLoading(true);
    apiClient.marketMap
      .national(months)
      .then((res) => {
        if (!cancelled) setNational(res);
      })
      .catch(() => {
        if (!cancelled) setNational(null);
      })
      .finally(() => {
        if (!cancelled) setNationalLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [months]);

  useEffect(() => {
    let cancelled = false;
    setTerritoriesLoading(true);
    apiClient.marketMap
      .territories({ level: geoLevel, metric: geoMetric, limit: geoLevel === 'ccaa' ? 19 : 30 })
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
  }, [geoLevel, geoMetric]);

  useEffect(() => {
    if (!selectedTerritoryId) {
      setTerritoryDetail(null);
      setTerritoryCross([]);
      return;
    }
    let cancelled = false;
    setTerritoryCrossLoading(true);
    apiClient.marketMap
      .territory(geoLevel, selectedTerritoryId)
      .then((res) => {
        if (!cancelled) setTerritoryDetail(res);
      })
      .catch(() => {
        if (!cancelled) setTerritoryDetail(null);
      });
    apiClient.marketMap
      .crossSectorsIn(geoLevel, selectedTerritoryId, 21)
      .then((res) => {
        if (!cancelled) setTerritoryCross(res.sectors ?? []);
      })
      .catch(() => {
        if (!cancelled) setTerritoryCross([]);
      })
      .finally(() => {
        if (!cancelled) setTerritoryCrossLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTerritoryId, geoLevel]);

  useEffect(() => {
    let cancelled = false;
    setSectorsLoading(true);
    apiClient.marketMap
      .sectors({ level: sectorLevel, metric: sectorMetric, limit: 25 })
      .then((res) => {
        if (!cancelled) setSectors(res.sectors ?? []);
      })
      .catch(() => {
        if (!cancelled) setSectors([]);
      })
      .finally(() => {
        if (!cancelled) setSectorsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sectorLevel, sectorMetric]);

  useEffect(() => {
    let cancelled = false;
    setEmergingLoading(true);
    apiClient.marketMap
      .sectorsEmerging(sectorLevel)
      .then((res) => {
        if (!cancelled) setEmerging(res.sectors ?? []);
      })
      .catch(() => {
        if (!cancelled) setEmerging([]);
      })
      .finally(() => {
        if (!cancelled) setEmergingLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sectorLevel]);

  useEffect(() => {
    if (!selectedSectorCode) {
      setSectorCross([]);
      return;
    }
    let cancelled = false;
    setSectorCrossLoading(true);
    apiClient.marketMap
      .crossTerritoryFor(selectedSectorCode, 'province', 20)
      .then((res) => {
        if (!cancelled) setSectorCross(res.territories ?? []);
      })
      .catch(() => {
        if (!cancelled) setSectorCross([]);
      })
      .finally(() => {
        if (!cancelled) setSectorCrossLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSectorCode]);

  const selectedSector = sectors.find((s) => s.cnae_code === selectedSectorCode) ?? null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">Mapa Empresarial</h1>
        <p className="text-sm text-text-muted mt-1 max-w-2xl">
          Datos reales de INE (DIRCE, Sociedades Mercantiles), BORME, contratación pública e
          Iberinform, servidos por los motores de Intel. Lo que Intel estima en lugar de contar
          directamente va marcado como <Badge variant="warning">Estimado</Badge>.
        </p>
      </div>

      {/* KPIs nacionales */}
      {nationalLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            </Card>
          ))}
        </div>
      ) : !national?.kpis ? (
        <Card>
          <EmptyRow text="Intel no devolvió el resumen nacional en este momento." />
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard
            label="Empresas activas"
            value={national.kpis.active_companies.value}
            changePct={national.kpis.active_companies.change_pct}
            trend={national.kpis.active_companies.trend}
          />
          <KpiCard
            label="Altas"
            value={national.kpis.new_companies.value}
            changePct={national.kpis.new_companies.change_pct}
            trend={national.kpis.new_companies.trend}
          />
          <KpiCard
            label="Bajas"
            value={national.kpis.closed_companies.value}
            changePct={national.kpis.closed_companies.change_pct}
            trend={national.kpis.closed_companies.trend}
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

      <EvolutionCard
        data={national?.evolution ?? null}
        months={months}
        onMonthsChange={setMonths}
        loading={nationalLoading}
      />

      {/* Ranking de territorios */}
      <Card
        header={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionTitle
              icon={<MapPin size={18} />}
              title="Territorios"
              subtitle="Ranking por dinamismo · geo-intelligence"
            />
            <div className="flex items-center gap-2">
              <ToggleGroup
                value={geoLevel}
                onChange={(v) => {
                  setGeoLevel(v);
                  setSelectedTerritoryId(null);
                }}
                options={[
                  { value: 'ccaa', label: 'CCAA' },
                  { value: 'province', label: 'Provincia' },
                ]}
              />
              <ToggleGroup
                value={geoMetric}
                onChange={setGeoMetric}
                options={[
                  { value: 'dynamism', label: 'Dinamismo' },
                  { value: 'size', label: 'Tamaño' },
                  { value: 'growth', label: 'Crecimiento' },
                  { value: 'activity', label: 'Actividad' },
                ]}
              />
            </div>
          </div>
        }
      >
        {territoriesLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : territories.length === 0 ? (
          <EmptyRow text="Intel no devolvió territorios para esta combinación." />
        ) : geoLevel === 'ccaa' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 relative">
              <SpainMap
                territories={territories}
                selectedId={selectedTerritoryId}
                hoveredId={hoveredTerritoryId}
                onHover={setHoveredTerritoryId}
                onSelect={(id) => setSelectedTerritoryId((cur) => (cur === id ? null : id))}
              />
              {(() => {
                const shown = territories.find(
                  (t) => t.geo_id === (hoveredTerritoryId ?? selectedTerritoryId)
                );
                return shown ? <MapHoverCard t={shown} /> : null;
              })()}
            </div>
            <div className="lg:col-span-5 space-y-0.5 lg:max-h-[420px] lg:overflow-y-auto">
              {territories.map((t) => (
                <TerritoryRow
                  key={t.geo_id}
                  t={t}
                  selected={selectedTerritoryId === t.geo_id}
                  onSelect={() =>
                    setSelectedTerritoryId((cur) => (cur === t.geo_id ? null : t.geo_id))
                  }
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            {territories.map((t) => (
              <TerritoryRow
                key={t.geo_id}
                t={t}
                selected={selectedTerritoryId === t.geo_id}
                onSelect={() =>
                  setSelectedTerritoryId((cur) => (cur === t.geo_id ? null : t.geo_id))
                }
              />
            ))}
          </div>
        )}
        <TerritoryDetail
          detail={territoryDetail}
          crossSectors={territoryCross}
          crossLoading={territoryCrossLoading}
        />
      </Card>

      {/* Ranking de sectores */}
      <Card
        header={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionTitle
              icon={<Building2 size={18} />}
              title="Sectores"
              subtitle="Ranking por dinamismo · sector-intelligence"
            />
            <div className="flex items-center gap-2">
              <ToggleGroup
                value={sectorLevel}
                onChange={(v) => {
                  setSectorLevel(v);
                  setSelectedSectorCode(null);
                }}
                options={[
                  { value: 'section', label: 'Sección' },
                  { value: 'division', label: 'División' },
                ]}
              />
              <ToggleGroup
                value={sectorMetric}
                onChange={setSectorMetric}
                options={[
                  { value: 'dynamism', label: 'Dinamismo' },
                  { value: 'size', label: 'Tamaño' },
                  { value: 'growth', label: 'Crecimiento' },
                  { value: 'activity', label: 'Actividad' },
                ]}
              />
            </div>
          </div>
        }
      >
        {sectorsLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : sectors.length === 0 ? (
          <EmptyRow text="Intel no devolvió sectores para esta combinación." />
        ) : (
          <div className="space-y-0.5">
            {sectors.map((s) => (
              <SectorRow
                key={s.cnae_code}
                s={s}
                selected={selectedSectorCode === s.cnae_code}
                onSelect={() =>
                  setSelectedSectorCode((cur) => (cur === s.cnae_code ? null : s.cnae_code))
                }
              />
            ))}
          </div>
        )}
        <SectorDetail sector={selectedSector} crossTerritories={sectorCross} crossLoading={sectorCrossLoading} />
      </Card>

      {/* Sectores emergentes */}
      <Card
        header={
          <SectionTitle
            icon={<Sparkles size={18} />}
            title="Sectores emergentes"
            subtitle="Mayor aceleración de crecimiento relativo · etiquetas CNAE reales"
          />
        }
      >
        {emergingLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : emerging.length === 0 ? (
          <EmptyRow text="Intel no marcó sectores emergentes en este momento." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {emerging.slice(0, 8).map((s) => (
              <div
                key={s.cnae_code}
                className="flex items-center justify-between px-3 py-2 rounded-md bg-surface-2 text-sm"
              >
                <span className="truncate">{s.cnae_label}</span>
                <span className="font-mono text-xs text-success">{fmtPct(s.growth_score)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ComparatorCard territories={territories} />

      {/* Fuentes y metodología */}
      <Card
        header={
          <SectionTitle icon={<Info size={18} />} title="Fuentes y metodología" />
        }
      >
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="success">INE — DIRCE</Badge>
          <Badge variant="success">INE — Sociedades Mercantiles</Badge>
          <Badge variant="success">BORME</Badge>
          <Badge variant="success">Contratación pública (PLACSP)</Badge>
          <Badge variant="success">Iberinform</Badge>
        </div>
        <p className="text-xs text-text-muted">
          El índice de dinamismo combina tamaño (25%), crecimiento (40%) y actividad (35%,
          repartido entre BORME, contratación pública e Iberinform). El desglose por provincia y
          por sector fino (división/grupo CNAE) todavía se estima repartiendo el total nacional
          según distribuciones históricas del INE — no es un recuento directo. Esa limitación está
          documentada y en curso de mejora con Intel; mientras tanto, cada dato afectado va
          marcado <Badge variant="warning">Estimado</Badge> aquí mismo, nunca oculto.
        </p>
      </Card>
    </div>
  );
}
