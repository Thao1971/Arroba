'use client';
/**
 * `/territorio/[level]/[code]` — Ficha Territorial (2026-08-30).
 *
 * Mismo criterio que `/sector/[code]` (2026-08-29): consume unicamente
 * `apiClient.marketMap.territory*` / `crossSectorsIn`, que a su vez llaman a
 * los endpoints reales ya existentes de Intel (geo-intelligence via
 * market_map/service.py `geo_territory_detail`, cross-intelligence
 * `/sectors-in`). Ningun dato aqui es inventado por Beta.
 *
 * Huecos reales confirmados (mismo criterio de honestidad que /sector/[code],
 * R15) que esta pantalla NO rellena con datos falsos, y que quedan fuera de
 * v1:
 *   - Empresas destacadas de este territorio: no existe un endpoint
 *     `territory/{level}/{code}/companies` (sí existe el equivalente para
 *     sector, `sector/{cnae}/companies`) — no se muestra ninguna lista.
 *   - Crecimiento de EBITDA / ingresos / empleo por territorio
 *     (`ebitda_growth`, `revenue_growth`, `employment_growth`): el backend
 *     ya reserva estos campos pero hoy vienen `null` — no se muestran.
 *   - Variación vs. periodo anterior: los scores no se snapshotean todavía.
 *   - Operaciones corporativas nombradas: no existe una base de M&A privado
 *     real, igual que en la ficha sectorial.
 */
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Landmark,
  Info,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

import {
  apiClient,
  type MarketMapTerritoryCard,
  type MarketMapCrossSector,
  type MarketMapGeoLevel,
} from '@/lib/api/client';
import { Badge, Card, Spinner, Tooltip } from '@/components/ds';

/* ------------------------------------------------------------------ */
/* Helpers (mismo lenguaje visual que /sector/[code] y /mapa-empresarial) */
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

const LEVEL_LABEL: Record<MarketMapGeoLevel, string> = {
  ccaa: 'Comunidad Autónoma',
  province: 'Provincia',
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

export default function FichaTerritorialPage() {
  const params = useParams<{ level: string; code: string }>();
  const level = (params.level === 'province' ? 'province' : 'ccaa') as MarketMapGeoLevel;
  const geoCode = decodeURIComponent(params.code || '');

  const [territory, setTerritory] = useState<MarketMapTerritoryCard | null>(null);
  const [provinces, setProvinces] = useState<MarketMapTerritoryCard[]>([]);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailMissing, setDetailMissing] = useState(false);

  const [sectors, setSectors] = useState<MarketMapCrossSector[]>([]);
  const [sectorsLoading, setSectorsLoading] = useState(true);

  useEffect(() => {
    if (!geoCode) return;
    let cancelled = false;
    setDetailLoading(true);
    setDetailMissing(false);
    apiClient.marketMap
      .territory(level, geoCode)
      .then((res) => {
        if (cancelled) return;
        setTerritory(res.territory);
        setProvinces(res.provinces ?? []);
        if (!res.territory) setDetailMissing(true);
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
  }, [level, geoCode]);

  useEffect(() => {
    if (!geoCode) return;
    let cancelled = false;
    setSectorsLoading(true);
    apiClient.marketMap
      .crossSectorsIn(level, geoCode, 10)
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
  }, [level, geoCode]);

  if (detailLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 flex justify-center">
        <Spinner size={24} />
      </div>
    );
  }

  if (detailMissing || !territory) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <Card>
          <EmptyRow text={`Intel no devolvió datos para el territorio "${geoCode}" (nivel ${LEVEL_LABEL[level]}). Comprueba el código.`} />
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
          {level === 'province' && territory.parent_ccaa && (
            <>
              <span className="text-text-muted">{territory.parent_ccaa}</span>
              <ChevronRight size={12} />
            </>
          )}
          <span className="text-text">{LEVEL_LABEL[level]}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-text">{territory.geo_name}</h1>
          <Badge variant="info">{LEVEL_LABEL[level]}</Badge>
          {territory.signal && <Badge variant="success">{territory.signal.replace(/_/g, ' ')}</Badge>}
        </div>
        <p className="text-sm text-text-muted mt-1 max-w-2xl">
          Fuentes: {territory.source_attribution ?? '—'}. Lo que Intel estima en vez de contar
          directamente va marcado <Badge variant="warning">Estimado</Badge>.
        </p>
      </div>

      {/* KPIs */}
      <Card>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <KpiTile
            label="Índice de dinamismo"
            value={fmtScore(territory.dynamism_score)}
            sub={<div className="flex items-center gap-1"><TrendIcon trend={territory.trend_direction} /><span className="text-xs text-text-muted">motor principal: {territory.primary_driver ?? '—'}</span></div>}
          />
          <KpiTile label="Empresas activas" value={fmtNum(territory.active_companies)} />
          <KpiTile label="Tamaño" value={fmtScore(territory.size_score)} />
          <KpiTile
            label="Crecimiento"
            value={fmtScore(territory.growth_score)}
            sub={<EstimadoBadge reason="Derivado del balance de altas y bajas de empresas (INE), no de un indicador de crecimiento económico directo." />}
          />
        </div>
      </Card>

      {/* Altas y bajas */}
      <Card
        header={
          <SectionTitle
            icon={<Landmark size={18} />}
            title="Altas y bajas"
            subtitle="INE Demografía Empresarial — real, sin redistribuir"
          />
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-text-muted">Altas</p>
            <p className="font-mono text-lg font-semibold text-success">{fmtNum(territory.new_companies)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Bajas</p>
            <p className="font-mono text-lg font-semibold text-danger">{fmtNum(territory.closed_companies)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Balance neto</p>
            <p className="font-mono text-lg font-semibold">{fmtNum(territory.net_company_creation)}</p>
          </div>
        </div>
        {territory.partial_data && (
          <p className="text-xs text-text-muted mt-3 flex items-center gap-1">
            <AlertTriangle size={12} /> Alguna de las fuentes de actividad no tenía datos suficientes
            para este territorio — el score se recalcula sobre las que sí había.
          </p>
        )}
      </Card>

      {/* Sectores destacados */}
      <Card
        header={
          <SectionTitle icon={<Building2 size={18} />} title="Sectores destacados" subtitle="dónde concentra la actividad este territorio" />
        }
      >
        {sectorsLoading ? (
          <div className="flex justify-center py-6"><Spinner size={16} /></div>
        ) : sectors.length === 0 ? (
          <EmptyRow text="Sin cruce sector×territorio disponible." />
        ) : (
          <div className="space-y-1">
            {sectors.slice(0, 8).map((s) => (
              <Link
                key={s.cnae_section}
                href={`/sector/${s.cnae_section}`}
                className="flex items-center justify-between text-sm px-3 py-2 rounded-md hover:bg-surface-2 border border-transparent hover:border-border"
              >
                <span className="text-text truncate">{s.cnae_label}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <EstimadoBadge reason="Concentración derivada sobre el nº de empresas estimado por sector en este territorio (redistribución DIRCE), no sobre un conteo real." />
                  <span className="font-mono text-xs text-text-muted">{s.concentration_index.toFixed(1)}x media nacional</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Provincias (drill-down desde CCAA) */}
      {level === 'ccaa' && provinces.length > 0 && (
        <Card
          header={
            <SectionTitle icon={<MapPin size={18} />} title="Provincias" subtitle="desglose de esta comunidad autónoma" />
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {provinces.map((p) => (
              <Link
                key={p.geo_id}
                href={`/territorio/province/${p.geo_id}`}
                className="flex items-center justify-between text-sm px-3 py-2 rounded-md hover:bg-surface-2 border border-transparent hover:border-border"
              >
                <span className="truncate">{p.geo_name}</span>
                <span className="font-mono text-xs text-text-muted">{fmtScore(p.dynamism_score)}</span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Lo que falta — honestidad primero (R15, mismo criterio que /sector/[code]) */}
      <Card header={<SectionTitle icon={<Info size={18} />} title="Lo que esta ficha todavía no tiene" />}>
        <p className="text-xs text-text-muted">
          Sin lista de empresas destacadas de este territorio — a diferencia de la ficha sectorial, no
          existe todavía un endpoint que las devuelva por territorio. Sin crecimiento de EBITDA, ingresos
          o empleo por territorio — el backend reserva esos campos pero hoy vienen vacíos. Sin variación
          vs. periodo anterior (los scores no se snapshotean todavía, no hay histórico). Sin operaciones
          corporativas nombradas (comprador/importe/fecha) — no existe una base de M&A privado real.
        </p>
      </Card>
    </div>
  );
}
