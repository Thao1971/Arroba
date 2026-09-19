'use client';
/**
 * @componentId COMP-M-0021
 * @status PROVISIONAL — Fase 1 (frontend)
 * @section Mercado (ficha)
 *
 * MercadoTab — pestaña "Mercado" completa de la ficha de empresa (f01).
 * Portado fiel del mockup `mercado-analisis-arroba.html` a React, reutilizando
 * el design system de la ficha (tokens Tailwind, tarjetas rounded-2xl). Sustituye
 * al `MarketReadingBlock` como render de la sección `mercado` del sectionRegistry.
 *
 * La empresa de la ficha ES el ancla del análisis y llega por prop `companyId`
 * (CIF / master_id). No se elige ni se resuelve aquí.
 *
 * 5 sub-pestañas: Mercado (builder) · Posicionamiento · Comparables ·
 * Oportunidades · Informe. Los cálculos (medianas, percentiles, clusters, gaps,
 * potencial) están replicados del mockup, no reinventados.
 *
 * ── Capa de datos (Fase 1) ──────────────────────────────────────────────────
 * `arrobaMarketClient` = adaptador tipado. Dos implementaciones:
 *   - MockAdapter (ACTIVO por defecto): datos de muestra con la FORMA de los
 *     contratos reales → la pestaña renderiza completa dentro de la ficha real.
 *   - LiveAdapter (tras `USE_LIVE=true`): apunta al BFF de arroba (`/bff/...`),
 *     que proxya el Agency Tool con la X-API-Key de servicio (nunca en el front).
 *     Las rutas del BFF + colecciones (saved_markets, metered_actions) + plantilla
 *     de informe son trabajo de backend (Fase 2). Hasta entonces, esas piezas
 *     degradan limpio y el flag queda en false.
 * Dato real ya disponible hoy: la "Lectura de mercado (IA)" llega por prop
 * `initialReading` (el monolito ya la calcula vía `market-reading` de Intel).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import { cn } from '@/lib/cn';
import { apiClient, type MarketAnalysisResponse } from '@/lib/api/client';

/* ═══════════════════════════════════════════════════════════════════════════
   FLAGS Y CONTRATO DE DATOS
   ═══════════════════════════════════════════════════════════════════════════ */
// Fase 1 · read-only encendido: las 3 pestañas analíticas (Posicionamiento,
// Comparables, Oportunidades) consumen dato real vía el backend de arroba
// (`/api/companies/{cif}/market-analysis`, que proxya Intel). Guardar-mercado,
// créditos e informe son Fase 2 → degradan limpio.
const USE_LIVE = true;

export interface MarketCompany {
  master_id: string;
  name: string;
  category: string;
  province?: string;
  cif?: string;
  cnae_desc?: string;
  web?: string;
  revenue: number;
  ebitda: number | null;
  employees: number;
  quality_score: number;
  growth: number | null;
  // derivados (enrich)
  ebitda_margin: number | null;
  rev_per_emp: number | null;
  // score de cercanía del resolver (se rellena en Comparables)
  __score?: number | null;
}

interface ComparableItem {
  score: number; // distancia (menor = más cerca)
  candidate: { master_id: string; name: string };
  fit_dimensions?: Record<string, number>;
  explanation?: string | null;
}
interface ComparablesResponse {
  target: { master_id: string; name: string };
  count: number;
  recommendations: ComparableItem[];
}
interface SavedMarket {
  market_id: string;
  label: string;
  anchor_id: string;
  members: string[];
  pinned: string[];
  excluded: string[];
  filters?: Record<string, unknown>;
  plan_limit: number;
  __scores?: Record<string, number>;
}
interface WhiteSpaceItem {
  area: string;
  level: string;
  activity_score?: number;
  concentration_index?: number;
}
interface CreditsState {
  monthly_limit: number;
  monthly_used: number;
  purchased: number;
}
interface Quote {
  action: string;
  credits: number;
  breakdown: string[];
}
interface UniverseCandidate {
  master_id: string;
  name: string;
  score: number;
}

interface MarketDataClient {
  getEnriched(id: string): Promise<MarketCompany>;
  getEnrichedMany(ids: string[]): Promise<MarketCompany[]>;
  getComparables(anchorId: string, limit?: number): Promise<ComparablesResponse>;
  getWhiteSpace(category: string, region?: string): Promise<WhiteSpaceItem[]>;
  getSavedMarket(anchorId: string): Promise<SavedMarket>;
  saveMarket(m: SavedMarket): Promise<{ ok: boolean; market_id: string }>;
  getUniverseCandidates(anchorId: string, activeIds: string[]): Promise<UniverseCandidate[]>;
  getCredits(): Promise<CreditsState>;
  quoteAction(action: string, params?: Record<string, number>): Promise<Quote>;
  generateReport(action: string, payload: unknown): Promise<{ status: string; output_url?: string }>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   UTILIDADES ESTADÍSTICAS (cálculo real sobre el set) + FORMATO
   ═══════════════════════════════════════════════════════════════════════════ */
const S = {
  mean: (a: number[]) => a.reduce((s, x) => s + x, 0) / (a.length || 1),
  quantile: (a: number[], p: number) => {
    const s = [...a].sort((x, y) => x - y);
    if (!s.length) return 0;
    const i = (s.length - 1) * p;
    const lo = Math.floor(i);
    const hi = Math.ceil(i);
    const vlo = s[lo] ?? 0;
    const vhi = s[hi] ?? 0;
    return lo === hi ? vlo : vlo + (vhi - vlo) * (i - lo);
  },
  median: (a: number[]) => S.quantile(a, 0.5),
  pct: (arr: number[], v: number | null | undefined) => {
    if (v == null || !arr.length) return 0;
    const n = arr.length;
    let below = 0;
    let eq = 0;
    arr.forEach((x) => {
      if (x < v) below++;
      else if (x === v) eq++;
    });
    return Math.round(((below + eq * 0.5) / n) * 100);
  },
  rank: (arr: number[], v: number | null | undefined) => {
    if (v == null) return 0;
    const s = [...arr].sort((x, y) => y - x);
    return s.indexOf(v) + 1;
  },
};
const fmtM = (v: number | null | undefined) => (v == null ? '—' : v.toFixed(1).replace('.', ',') + ' M€');
const fmtK = (v: number | null | undefined) => (v == null ? '—' : Math.round(v) + ' K€');
const fmtPct = (v: number | null | undefined) => (v == null ? '—' : v.toFixed(1).replace('.', ',') + '%');

// Colores de datos (series/clusters). Chrome y texto usan tokens del DS.
const RED = '#FF5757';
const OK = '#1B9E5A';
const INFO = '#2563EB';
const WARN = '#C77D18';
const NEU = '#9A9A93';
const N2 = '#E9E9E5';
type ClusterKey = 'lider' | 'plat' | 'nicho' | 'sub';
const CLU: Record<ClusterKey, string> = { lider: OK, plat: INFO, nicho: WARN, sub: RED };

function enrich(c: MarketCompany): MarketCompany {
  return {
    ...c,
    ebitda_margin: c.ebitda == null ? null : +((c.ebitda / c.revenue) * 100).toFixed(1),
    rev_per_emp: c.revenue == null || !c.employees ? null : Math.round((c.revenue * 1000) / c.employees),
  };
}
function clusterOf(c: MarketCompany, medRev: number, medMar: number): ClusterKey {
  const big = c.revenue >= medRev;
  const prof = (c.ebitda_margin ?? -99) >= medMar;
  return big && prof ? 'lider' : big && !prof ? 'plat' : !big && prof ? 'nicho' : 'sub';
}

/* ═══════════════════════════════════════════════════════════════════════════
   MOCK ADAPTER — datos de muestra con la forma de los contratos reales
   ═══════════════════════════════════════════════════════════════════════════ */
const MockAdapter: MarketDataClient = (() => {
  const RAW: Record<string, Omit<MarketCompany, 'ebitda_margin' | 'rev_per_emp'>> = {
    olmedo: { master_id: 'olmedo', name: 'Grupo Olmedo (CT)', category: 'Turismo termal', province: 'Ourense', cif: 'B32458190', cnae_desc: 'Actividades de balnearios y termalismo', web: 'www.grupoolmedo.es', revenue: 9.3, ebitda: 1.87, employees: 210, quality_score: 82, growth: 14 },
    meridional: { master_id: 'meridional', name: 'Balneario Meridional', category: 'Turismo termal', province: 'Granada', revenue: 15.8, ebitda: 1.1, employees: 300, quality_score: 74, growth: 6 },
    termasnorte: { master_id: 'termasnorte', name: 'Termas del Norte', category: 'Turismo termal', province: 'Lugo', revenue: 12.5, ebitda: 0.9, employees: 240, quality_score: 71, growth: 5 },
    saludspa: { master_id: 'saludspa', name: 'Hotelera Salud & Spa', category: 'Wellness', province: 'Málaga', revenue: 8.1, ebitda: 0.7, employees: 175, quality_score: 70, growth: 8 },
    aguasvivas: { master_id: 'aguasvivas', name: 'Aguas Vivas', category: 'Balneario', province: 'Cáceres', revenue: 4.2, ebitda: 0.3, employees: 95, quality_score: 58, growth: 3 },
    resortsib: { master_id: 'resortsib', name: 'Resorts Termales Ibéricos', category: 'Turismo termal', province: 'Girona', revenue: 11.0, ebitda: 1.05, employees: 190, quality_score: 76, growth: 9 },
    duero: { master_id: 'duero', name: 'Balneario del Duero', category: 'Balneario', province: 'Valladolid', revenue: 6.4, ebitda: 0.55, employees: 120, quality_score: 68, growth: 7 },
    levante: { master_id: 'levante', name: 'Aguas de Levante', category: 'Wellness', province: 'Alicante', revenue: 5.1, ebitda: null, employees: 80, quality_score: 63, growth: null },
  };
  const SCORE: Record<string, number> = { meridional: 0.55, termasnorte: 0.62, saludspa: 0.48, aguasvivas: 0.8, resortsib: 0.71, duero: 0.66, levante: 0.74 };
  const wait = <T,>(v: T, ms = 220): Promise<T> => new Promise((r) => setTimeout(() => r(v), ms));
  const get = (id: string) => enrich({ ...(RAW[id] ?? RAW.olmedo) } as MarketCompany);
  return {
    getEnriched: async (id) => wait(get(id)),
    getEnrichedMany: async (ids) => wait(ids.map(get)),
    getComparables: async (anchorId, limit = 10) => {
      const items: ComparableItem[] = Object.keys(SCORE)
        .map((id) => ({ score: SCORE[id] ?? 0, candidate: { master_id: id, name: RAW[id]?.name ?? id }, fit_dimensions: { sector: 0.95, industry: 0.9, capabilities: 0.8, business_model: 0.85 }, explanation: null }))
        .sort((a, b) => a.score - b.score)
        .slice(0, limit);
      return wait({ target: { master_id: anchorId, name: RAW[anchorId]?.name ?? RAW.olmedo?.name ?? anchorId }, count: items.length, recommendations: items });
    },
    getWhiteSpace: async () => wait([{ area: 'Consolidación regional', level: 'Alta', activity_score: 0.82, concentration_index: 0.21 }]),
    getSavedMarket: async () => wait<SavedMarket>({ market_id: 'mkt_termal_es', label: 'Turismo termal · España', anchor_id: 'olmedo', members: ['olmedo', 'meridional', 'termasnorte', 'saludspa', 'aguasvivas'], pinned: ['meridional', 'termasnorte', 'saludspa', 'aguasvivas'], excluded: [], filters: { geo_mode: 'nacional' }, plan_limit: 10 }),
    saveMarket: async (m) => wait({ ok: true, market_id: m.market_id }, 380),
    getUniverseCandidates: async (_anchorId, activeIds) => {
      const cand = ['resortsib', 'duero', 'levante'].filter((id) => !activeIds.includes(id));
      return wait(cand.map((id) => ({ master_id: id, name: RAW[id]?.name ?? id, score: SCORE[id] ?? 0 })));
    },
    getCredits: async () => wait({ monthly_limit: 200, monthly_used: 38, purchased: 60 }),
    quoteAction: async (action, params = {}) => {
      const CATALOG: Record<string, { base: number; llm?: boolean; perThousandRows?: number }> = {
        report_market_full: { base: 40, llm: true },
        report_comparative: { base: 30, llm: true },
        export_excel: { base: 5, perThousandRows: 6 },
      };
      const c = CATALOG[action] ?? { base: 0 };
      let credits = c.base;
      const brk = [`Base: ${c.base}`];
      if (c.perThousandRows && params.rows) {
        const extra = Math.ceil(params.rows / 1000) * c.perThousandRows;
        credits += extra;
        brk.push(`${params.rows} filas: +${extra}`);
      }
      if (c.llm) brk.push('Incluye generación con LLM');
      return wait({ action, credits, breakdown: brk }, 100);
    },
    generateReport: async () => wait({ status: 'succeeded', output_url: '#' }, 850),
  };
})();

/* ═══════════════════════════════════════════════════════════════════════════
   LIVE ADAPTER (Fase 1, read-only) — un único fetch memoizado a
   `/api/companies/{cif}/market-analysis` (backend de arroba → proxya Intel:
   resolve + recommendation/comparables + company-taxonomy/summary). La
   service-key S2S nunca viaja al navegador. saved_markets / créditos / informe
   son Fase 2 → estos métodos rechazan y la UI degrada limpio.
   ═══════════════════════════════════════════════════════════════════════════ */
interface LiveData {
  anchor_id: string | null;
  companies: MarketCompany[];
  comparables: { master_id: string; name: string; score: number | null }[];
}
let _liveCache: { cif: string; data: LiveData } | null = null;

async function _loadAnalysis(cif: string): Promise<LiveData> {
  if (_liveCache && _liveCache.cif === cif) return _liveCache.data;
  const raw: MarketAnalysisResponse = await apiClient.companies.marketAnalysis(cif);
  const companies = (raw.companies ?? []).map((c) =>
    enrich({
      master_id: c.master_id,
      name: c.name,
      category: c.category,
      province: c.province ?? undefined,
      revenue: c.revenue ?? 0,
      ebitda: c.ebitda,
      employees: c.employees,
      quality_score: c.quality_score,
      growth: c.growth,
      ebitda_margin: null,
      rev_per_emp: null,
    }),
  );
  const data: LiveData = { anchor_id: raw.anchor_id, companies, comparables: raw.comparables ?? [] };
  _liveCache = { cif, data };
  return data;
}

const LiveAdapter: MarketDataClient = {
  getEnriched: async (id) => {
    const c = _liveCache?.data.companies.find((x) => x.master_id === id);
    if (!c) throw new Error('market_analysis_not_loaded');
    return c;
  },
  getEnrichedMany: async (ids) => (_liveCache?.data.companies ?? []).filter((c) => ids.includes(c.master_id)),
  getComparables: async (anchorId) => {
    const d = _liveCache?.data;
    const recommendations: ComparableItem[] = (d?.comparables ?? []).map((c) => ({ score: c.score ?? 0, candidate: { master_id: c.master_id, name: c.name } }));
    return { target: { master_id: anchorId, name: d?.companies.find((x) => x.master_id === anchorId)?.name ?? anchorId }, count: recommendations.length, recommendations };
  },
  getWhiteSpace: async () => [], // sector_geo_cross (rama B) = Fase 2 → degrada
  getSavedMarket: async (cif) => {
    const d = await _loadAnalysis(cif);
    const anchorId = d.anchor_id ?? d.companies[0]?.master_id ?? '';
    const members = d.companies.map((c) => c.master_id);
    const cat = d.companies.find((c) => c.master_id === anchorId)?.category;
    return {
      market_id: 'live:' + cif,
      label: cat && cat !== '—' ? `${cat} · España` : 'Mercado',
      anchor_id: anchorId,
      members,
      pinned: members.filter((m) => m !== anchorId),
      excluded: [],
      filters: { geo_mode: 'nacional' },
      plan_limit: Math.max(10, members.length),
    };
  },
  saveMarket: async () => {
    throw new Error('saved_markets_not_available'); // persistencia = Fase 2
  },
  getUniverseCandidates: async () => [], // el universo ya viene resuelto en el análisis
  getCredits: async () => {
    throw new Error('credits_not_available'); // metering = Fase 2
  },
  quoteAction: async () => {
    throw new Error('quote_not_available');
  },
  generateReport: async () => {
    throw new Error('report_not_available');
  },
};

const API: MarketDataClient = USE_LIVE ? LiveAdapter : MockAdapter;

/* ═══════════════════════════════════════════════════════════════════════════
   TOOLTIP compartido (control por estado, no DOM global)
   ═══════════════════════════════════════════════════════════════════════════ */
interface TipContent {
  label?: string;
  title: string;
  detail?: string;
}
interface TipCtl {
  show: (c: TipContent, e: { clientX: number; clientY: number }) => void;
  move: (e: { clientX: number; clientY: number }) => void;
  hide: () => void;
}

/* ═══════════════════════════════════════════════════════════════════════════
   ÁTOMOS UI (tarjeta, título, sub, botón) — reutilizan tokens del DS de la ficha
   ═══════════════════════════════════════════════════════════════════════════ */
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl border border-border-default bg-surface-elevated p-5', className)}>{children}</div>;
}
function H3({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <h3 className="flex items-center gap-2 text-body-sm font-bold text-text-primary m-0">
      <span className="inline-block w-[3px] h-[15px] rounded-sm" style={{ background: tone || RED }} />
      {children}
    </h3>
  );
}
function Sub({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('text-caption text-text-secondary leading-snug my-1 mb-3', className)}>{children}</div>;
}
function Btn({ children, onClick, variant = 'default', disabled, className, title }: { children: React.ReactNode; onClick?: () => void; variant?: 'default' | 'primary' | 'outline-red'; disabled?: boolean; className?: string; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold cursor-pointer transition-colors',
        variant === 'primary' && 'bg-brand-primary text-text-on-brand hover:bg-brand-primary-hover border border-brand-primary',
        variant === 'outline-red' && 'border border-brand-primary text-brand-primary hover:bg-brand-primary/5 bg-surface-elevated',
        variant === 'default' && 'border border-border-default text-text-secondary hover:bg-surface-muted bg-surface-elevated',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   GRÁFICOS SVG (JSX, con handlers React y tooltip por estado)
   ═══════════════════════════════════════════════════════════════════════════ */
function Scatter({ set, medRev, medMar, anchorId, tip, onPick }: { set: MarketCompany[]; medRev: number; medMar: number; anchorId: string; tip: TipCtl; onPick: (id: string) => void }) {
  const w = 560, h = 300, pl = 48, pr = 18, pt = 16, pb = 34;
  const iw = w - pl - pr, ih = h - pt - pb;
  const revs = set.map((c) => c.revenue);
  const mars = set.filter((c) => c.ebitda_margin != null).map((c) => c.ebitda_margin as number);
  const xmin = Math.max(0, Math.min(...revs) - 2), xmax = Math.max(...revs) + 2;
  const ymin = Math.min(...mars, 0) - 2, ymax = Math.max(...mars) + 4;
  const X = (v: number) => pl + (iw * (v - xmin)) / (xmax - xmin);
  const Y = (v: number) => pt + ih - (ih * (v - ymin)) / (ymax - ymin);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label="Dispersión revenue vs margen">
      {[0, 1, 2, 3, 4].map((k) => {
        const yy = pt + (ih * k) / 4;
        const val = (ymax - ((ymax - ymin) * k) / 4).toFixed(0);
        return (
          <g key={`gy${k}`}>
            <line x1={pl} y1={yy} x2={w - pr} y2={yy} stroke={N2} />
            <text x={pl - 8} y={yy + 4} textAnchor="end" fontSize="10" fill={NEU}>{val}%</text>
          </g>
        );
      })}
      {[0, 1, 2, 3, 4, 5].map((k) => {
        const v = xmin + ((xmax - xmin) * k) / 5;
        return <text key={`gx${k}`} x={X(v)} y={h - 9} textAnchor="middle" fontSize="10" fill={NEU}>{v.toFixed(0)} M€</text>;
      })}
      <line x1={X(medRev)} y1={pt} x2={X(medRev)} y2={pt + ih} stroke={NEU} strokeDasharray="4 3" opacity="0.5" />
      <line x1={pl} y1={Y(medMar)} x2={w - pr} y2={Y(medMar)} stroke={NEU} strokeDasharray="4 3" opacity="0.5" />
      {set.map((c) => {
        if (c.ebitda_margin == null) return null;
        const clu = clusterOf(c, medRev, medMar);
        const me = c.master_id === anchorId;
        return (
          <circle
            key={c.master_id}
            cx={X(c.revenue)}
            cy={Y(c.ebitda_margin)}
            r={me ? 9 : 7}
            fill={CLU[clu]}
            style={{ cursor: 'pointer' }}
            stroke={me ? '#161412' : undefined}
            strokeWidth={me ? 2.5 : undefined}
            onMouseEnter={(e) => tip.show({ label: c.category, title: c.name, detail: `${fmtM(c.revenue)} · ${fmtPct(c.ebitda_margin)}` }, e)}
            onMouseMove={(e) => tip.move(e)}
            onMouseLeave={() => tip.hide()}
            onClick={() => onPick(c.master_id)}
          />
        );
      })}
      <text x={pl} y={pt - 4} fontSize="10" fill={NEU}>Margen EBITDA (%)</text>
    </svg>
  );
}

function Radar({ axes, me, tip }: { axes: string[]; me: number[]; tip: TipCtl }) {
  const w = 520, h = 270, cx = 210, cy = 135, R = 95;
  const Nn = axes.length;
  const med = axes.map(() => 50);
  const top = axes.map(() => 75);
  const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / Nn), cy + r * Math.sin(-Math.PI / 2 + (i * 2 * Math.PI) / Nn)];
  const poly = (d: number[]) => d.map((v, i) => pt(i, (R * v) / 100).join(',')).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label="Radar comparativo">
      {[0.25, 0.5, 0.75, 1].map((f, k) => <polygon key={`ring${k}`} points={axes.map((_, i) => pt(i, R * f).join(',')).join(' ')} fill="none" stroke={N2} />)}
      {axes.map((a, i) => {
        const [px, py] = pt(i, R + 16);
        return <text key={`ax${i}`} x={px} y={py} textAnchor="middle" fontSize="10" fill={NEU}>{a}</text>;
      })}
      <polygon points={poly(top)} fill="none" stroke={INFO} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8" />
      <polygon points={poly(med)} fill={NEU} opacity="0.1" stroke={NEU} strokeOpacity="0.5" />
      <polygon points={poly(me)} fill={RED} opacity="0.18" stroke={RED} strokeWidth="2" />
      {axes.map((a, i) => {
        const [px, py] = pt(i, (R * (me[i] ?? 0)) / 100);
        return (
          <circle
            key={`pt${i}`}
            cx={px}
            cy={py}
            r={4}
            fill={RED}
            style={{ cursor: 'pointer' }}
            onMouseEnter={(e) => tip.show({ label: a, title: `Tu empresa: P${me[i]}`, detail: 'mediana P50 · top P75' }, e)}
            onMouseMove={(e) => tip.move(e)}
            onMouseLeave={() => tip.hide()}
          />
        );
      })}
    </svg>
  );
}

function OppMap({ set, medRev, medMar, anchorId, tip, onPick }: { set: MarketCompany[]; medRev: number; medMar: number; anchorId: string; tip: TipCtl; onPick: (id: string) => void }) {
  const w = 560, h = 300, pl = 44, pr = 16, pt = 14, pb = 32;
  const iw = w - pl - pr, ih = h - pt - pb;
  const revs = set.map((c) => c.revenue);
  const mars = set.filter((c) => c.ebitda_margin != null).map((c) => c.ebitda_margin as number);
  const xmin = 0, xmax = Math.max(...revs) + 3, ymin = Math.min(...mars, 0) - 3, ymax = Math.max(...mars) + 3;
  const X = (v: number) => pl + (iw * (v - xmin)) / (xmax - xmin);
  const Y = (v: number) => pt + ih - (ih * (v - ymin)) / (ymax - ymin);
  const mx = X(medRev), my = Y(medMar);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label="Mapa de oportunidades">
      <rect x={pl} y={pt} width={mx - pl} height={my - pt} fill={OK} opacity="0.1" />
      <rect x={mx} y={pt} width={w - pr - mx} height={my - pt} fill={WARN} opacity="0.1" />
      <rect x={pl} y={my} width={mx - pl} height={pt + ih - my} fill={RED} opacity="0.08" />
      <rect x={mx} y={my} width={w - pr - mx} height={pt + ih - my} fill={NEU} opacity="0.08" />
      <text x={pl + 6} y={pt + 14} fontSize="10.5" fontWeight="700" fill={OK}>Oportunidad alta</text>
      <text x={w - pr - 6} y={pt + 14} textAnchor="end" fontSize="10.5" fontWeight="700" fill={WARN}>Competido</text>
      <text x={pl + 6} y={pt + ih - 6} fontSize="10.5" fontWeight="700" fill={RED}>Poco atractivo</text>
      <text x={w - pr - 6} y={pt + ih - 6} textAnchor="end" fontSize="10.5" fontWeight="700" fill={NEU}>Saturado</text>
      <line x1={mx} y1={pt} x2={mx} y2={pt + ih} stroke={NEU} strokeDasharray="4 3" opacity="0.5" />
      <line x1={pl} y1={my} x2={w - pr} y2={my} stroke={NEU} strokeDasharray="4 3" opacity="0.5" />
      {[0, 1, 2, 3, 4].map((k) => {
        const v = xmin + ((xmax - xmin) * k) / 4;
        return <text key={`ox${k}`} x={X(v)} y={h - 9} textAnchor="middle" fontSize="10" fill={NEU}>{v.toFixed(0)} M€</text>;
      })}
      {set.map((c) => {
        if (c.ebitda_margin == null) return null;
        const me = c.master_id === anchorId;
        const clu = clusterOf(c, medRev, medMar);
        return (
          <circle
            key={c.master_id}
            cx={X(c.revenue)}
            cy={Y(c.ebitda_margin)}
            r={me ? 8 : 6}
            fill={CLU[clu]}
            style={{ cursor: 'pointer' }}
            stroke={me ? '#161412' : undefined}
            strokeWidth={me ? 2.5 : undefined}
            onMouseEnter={(e) => tip.show({ label: c.category, title: c.name, detail: `${fmtM(c.revenue)} · ${fmtPct(c.ebitda_margin)}` }, e)}
            onMouseMove={(e) => tip.move(e)}
            onMouseLeave={() => tip.hide()}
            onClick={() => onPick(c.master_id)}
          />
        );
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TABLA de compañías del mercado (reutilizada en Posicionamiento y Comparables)
   ═══════════════════════════════════════════════════════════════════════════ */
function MarketTable({ set, anchorId, withDist, onPick, onCategory }: { set: MarketCompany[]; anchorId: string; withDist: boolean; onPick: (id: string) => void; onCategory: (cat: string) => void }) {
  const na = (v: React.ReactNode) => (v == null || v === '—' ? <span className="text-text-muted">n/d</span> : v);
  return (
    <table className="w-full border-collapse text-[12.5px]">
      <thead>
        <tr className="[&>th]:text-right [&>th:first-child]:text-left [&>th]:uppercase [&>th]:tracking-wide [&>th]:text-[10px] [&>th]:text-text-muted [&>th]:py-2.5 [&>th]:px-2 [&>th]:border-b [&>th]:border-border-default">
          <th>Empresa</th><th>Categoría</th><th>Revenue</th><th>EBITDA</th><th>Margen</th><th>Empleados</th><th>Rev/Emp</th><th>Calidad</th><th>{withDist ? 'Distancia' : 'Crec.'}</th>
        </tr>
      </thead>
      <tbody>
        {set.map((c) => {
          const me = c.master_id === anchorId;
          return (
            <tr key={c.master_id} className={cn('[&>td]:text-right [&>td:first-child]:text-left [&>td]:py-2.5 [&>td]:px-2 [&>td]:border-b [&>td]:border-border-default/60 [&>td]:text-text-secondary', me ? 'bg-brand-primary/5' : 'hover:bg-surface-muted')}>
              <td>
                <span className="inline-flex items-center gap-1.5 font-semibold text-text-primary">
                  {me ? <span className="w-[7px] h-[7px] rounded-full inline-block" style={{ background: RED }} /> : null}
                  <button type="button" className="cursor-pointer hover:text-brand-primary hover:underline" onClick={() => onPick(c.master_id)}>{c.name}</button>
                </span>
              </td>
              <td className="!text-left text-[11px] text-text-muted"><button type="button" className="cursor-pointer hover:text-text-secondary hover:underline" onClick={() => onCategory(c.category)}>{c.category}</button></td>
              <td>{na(c.revenue == null ? null : fmtM(c.revenue))}</td>
              <td>{na(c.ebitda == null ? null : fmtM(c.ebitda))}</td>
              <td>{na(c.ebitda_margin == null ? null : fmtPct(c.ebitda_margin))}</td>
              <td>{c.employees}</td>
              <td>{na(c.rev_per_emp == null ? null : fmtK(c.rev_per_emp))}</td>
              <td>{c.quality_score}</td>
              <td>{withDist ? (me ? '—' : c.__score != null ? c.__score.toFixed(2).replace('.', ',') : '—') : c.growth == null ? <span className="text-text-muted">n/d</span> : '+' + c.growth + '%'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════════════════════════════════════════ */
type SubTab = 'mercado' | 'posicionamiento' | 'comparables' | 'oportunidades' | 'informe';
const SUBTABS: { id: SubTab; label: string }[] = [
  { id: 'mercado', label: 'Mercado' },
  { id: 'posicionamiento', label: 'Posicionamiento' },
  { id: 'comparables', label: 'Comparables' },
  { id: 'oportunidades', label: 'Oportunidades' },
  { id: 'informe', label: 'Informe' },
];

export interface MercadoTabProps {
  /** CIF / master_id de la empresa de la ficha — es el ancla del análisis. */
  companyId: string;
  /** Lectura de mercado IA ya calculada por el monolito (market-reading de Intel). Opcional. */
  initialReading?: string | null;
}

export function MercadoTab({ companyId, initialReading }: MercadoTabProps) {
  const [tab, setTab] = useState<SubTab>('mercado');
  const [market, setMarket] = useState<SavedMarket | null>(null);
  const [members, setMembers] = useState<MarketCompany[]>([]);
  const [candidates, setCandidates] = useState<UniverseCandidate[]>([]);
  const [credits, setCredits] = useState<CreditsState | null>(null);
  const [comparables, setComparables] = useState<ComparablesResponse | null>(null);
  const [whiteSpace, setWhiteSpace] = useState<WhiteSpaceItem[]>([]);
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saveNote, setSaveNote] = useState(false);
  const snapshotRef = useRef<string[]>([]);

  // tooltip
  const [tipState, setTipState] = useState<{ show: boolean; c: TipContent; x: number; y: number }>({ show: false, c: { title: '' }, x: 0, y: 0 });
  const tip: TipCtl = useMemo(
    () => ({
      show: (c, e) => setTipState({ show: true, c, x: e.clientX, y: e.clientY }),
      move: (e) => setTipState((s) => (s.show ? { ...s, x: e.clientX, y: e.clientY } : s)),
      hide: () => setTipState((s) => ({ ...s, show: false })),
    }),
    [],
  );

  // modal
  const [modal, setModal] = useState<{ action: string; title: string; quote: Quote; warnChange: boolean; note?: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  // HARDENING-038f (2026-09-17 · Daniel opción b) · Análisis diferido con
  // polling limitado — mismo patrón que market-reading en CompanyFichaF01Client
  // (commit 5861634): backend devuelve `{status: 'pending'|'ready'|'unavailable'}`
  // y aquí hacemos hasta 10 intentos con `refreshInterval: 3000` (inline, NO
  // en FETCH_CONFIG compartido). El pipeline (resolve + comparables + summary)
  // corre en background del backend con TASK_ANALYSIS_TIMEOUT_S=25s, fuera del
  // edge (8s), porque `recommendation-intelligence/comparables` tarda 11-14s
  // consistentemente. Reset del contador al cambiar de empresa.
  const ANALYSIS_MAX_ATTEMPTS = 10;
  const analysisAttemptRef = useRef(0);
  useEffect(() => {
    analysisAttemptRef.current = 0;
  }, [companyId]);

  const { data: analysis } = useSWR<MarketAnalysisResponse | null>(
    USE_LIVE && companyId ? ['market-analysis', companyId] : null,
    () => apiClient.companies.marketAnalysis(companyId).catch(() => null),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      refreshInterval: (latest) => {
        if (!latest || latest.status !== 'pending') return 0;
        if (analysisAttemptRef.current >= ANALYSIS_MAX_ATTEMPTS) return 0;
        return 3000;
      },
      onSuccess: (latest) => {
        if (latest?.status === 'pending') {
          analysisAttemptRef.current += 1;
        } else {
          analysisAttemptRef.current = 0;
        }
      },
    },
  );

  // Carga inicial: en modo LIVE espera al primer `analysis?.status !== 'pending'`
  // y siembra `_liveCache` con esos datos antes de arrancar el flujo (para que
  // `LiveAdapter.getSavedMarket` los lea directamente sin re-fetch). En modo
  // MOCK dispara inmediatamente. R15: `unavailable`/companies vacío → estado
  // vacío honesto (`market=null` → tarjeta "Sin datos de mercado suficientes").
  useEffect(() => {
    let alive = true;
    if (USE_LIVE) {
      if (!analysis) {
        // Aún esperando el 1er hit (SWR sin data): mantener loading limpio.
        setLoading(true);
        return () => {
          alive = false;
        };
      }
      if (analysis.status === 'pending') {
        setLoading(true);
        return () => {
          alive = false;
        };
      }
      if (analysis.status === 'unavailable' || (analysis.companies ?? []).length === 0) {
        setMarket(null);
        setMembers([]);
        setComparables(null);
        setCandidates([]);
        setWhiteSpace([]);
        setLoading(false);
        return () => {
          alive = false;
        };
      }
      // `ready` con companies>=1: sembrar _liveCache antes de LiveAdapter.
      const companiesEnriched = (analysis.companies ?? []).map((c) =>
        enrich({
          master_id: c.master_id,
          name: c.name,
          category: c.category,
          province: c.province ?? undefined,
          revenue: c.revenue ?? 0,
          ebitda: c.ebitda,
          employees: c.employees,
          quality_score: c.quality_score,
          growth: c.growth,
          ebitda_margin: null,
          rev_per_emp: null,
        }),
      );
      _liveCache = {
        cif: companyId,
        data: {
          anchor_id: analysis.anchor_id,
          companies: companiesEnriched,
          comparables: analysis.comparables ?? [],
        },
      };
    }
    (async () => {
      setLoading(true);
      try {
        const [cr, mkt] = await Promise.all([API.getCredits().catch(() => null), API.getSavedMarket(companyId)]);
        if (!alive) return;
        setCredits(cr);
        setMarket(mkt);
        setNameInput(mkt.label);
        snapshotRef.current = [...mkt.members];
        const mem = await API.getEnrichedMany(mkt.members);
        if (!alive) return;
        setMembers(mem);
        // comparables + universo + white-space en paralelo (best-effort)
        const anchor = mem.find((c) => c.master_id === mkt.anchor_id) ?? mem[0];
        const [comp, cand, ws] = await Promise.all([
          API.getComparables(mkt.anchor_id, 20).catch(() => null),
          API.getUniverseCandidates(mkt.anchor_id, mkt.members).catch(() => []),
          API.getWhiteSpace(anchor?.category ?? '', 'España').catch(() => []),
        ]);
        if (!alive) return;
        setComparables(comp);
        setCandidates(cand);
        setWhiteSpace(ws);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [companyId, analysis]);

  // scores de cercanía aplicados a los miembros
  const scoreMap = useMemo(() => {
    const m: Record<string, number> = {};
    comparables?.recommendations.forEach((r) => (m[r.candidate.master_id] = r.score));
    return m;
  }, [comparables]);
  const membersScored = useMemo(() => members.map((c) => ({ ...c, __score: scoreMap[c.master_id] ?? null })), [members, scoreMap]);
  const anchor = useMemo(() => (market ? membersScored.find((c) => c.master_id === market.anchor_id) ?? membersScored[0] : undefined), [membersScored, market]);

  const reloadMembers = useCallback(
    async (mkt: SavedMarket) => {
      const mem = await API.getEnrichedMany(mkt.members);
      setMembers(mem);
      const [comp, cand] = await Promise.all([API.getComparables(mkt.anchor_id, 20).catch(() => null), API.getUniverseCandidates(mkt.anchor_id, mkt.members).catch(() => [])]);
      setComparables(comp);
      setCandidates(cand);
    },
    [],
  );

  const markDirty = useCallback((mkt: SavedMarket) => {
    setDirty(JSON.stringify([...mkt.members].sort()) !== JSON.stringify([...snapshotRef.current].sort()));
  }, []);

  const addMember = useCallback(
    (id: string) => {
      if (!market || market.members.includes(id)) return;
      const next: SavedMarket = { ...market, members: [...market.members, id], pinned: market.pinned.includes(id) ? market.pinned : [...market.pinned, id], excluded: market.excluded.filter((x) => x !== id) };
      setMarket(next);
      markDirty(next);
      void reloadMembers(next);
    },
    [market, markDirty, reloadMembers],
  );
  const removeMember = useCallback(
    (id: string) => {
      if (!market || id === market.anchor_id) return;
      const next: SavedMarket = { ...market, members: market.members.filter((x) => x !== id), pinned: market.pinned.filter((x) => x !== id), excluded: market.excluded.includes(id) ? market.excluded : [...market.excluded, id] };
      setMarket(next);
      markDirty(next);
      void reloadMembers(next);
    },
    [market, markDirty, reloadMembers],
  );
  const onSaveMarket = useCallback(async () => {
    if (!market) return;
    const nm = nameInput.trim();
    const next = nm ? { ...market, label: nm } : market;
    setMarket(next);
    try {
      await API.saveMarket(next);
      snapshotRef.current = [...next.members];
      setDirty(false);
      setSaveNote(true);
      setTimeout(() => setSaveNote(false), 1800);
      showToast(nm ? 'Mercado guardado: ' + nm : 'Mercado guardado');
    } catch {
      // Fase 1 read-only: la persistencia de mercados guardados llega en Fase 2.
      showToast('Guardar mercados estará disponible próximamente.');
    }
  }, [market, nameInput, showToast]);

  const openCompany = useCallback((id: string) => showToast('→ Ficha de empresa: ' + (membersScored.find((c) => c.master_id === id)?.name ?? id)), [membersScored, showToast]);
  const openCategory = useCallback((cat: string) => showToast('→ Sector de actividad: ' + cat), [showToast]);

  const onGenerateReport = useCallback(
    async (action: string) => {
      const q = await API.quoteAction(action);
      setModal({ action, title: action === 'report_market_full' ? 'Generar informe de análisis de mercado' : 'Generar informe comparativo', quote: q, warnChange: dirty });
    },
    [dirty],
  );
  const onExport = useCallback(async () => {
    const q = await API.quoteAction('export_excel', { rows: 10000 });
    setModal({ action: 'export_excel', title: 'Exportar resultados a Excel', quote: q, warnChange: false, note: 'Ejemplo: 10.000 filas.' });
  }, []);
  const confirmAction = useCallback(
    async (action: string, cost: number) => {
      setModal(null);
      showToast('Generando…');
      const res = await API.generateReport(action, { market_id: market?.market_id, members: market?.members });
      if (res.status === 'succeeded') {
        setCredits((prev) => {
          if (!prev) return prev;
          let used = prev.monthly_used + cost;
          let purchased = prev.purchased;
          if (used > prev.monthly_limit) {
            purchased -= used - prev.monthly_limit;
            used = prev.monthly_limit;
          }
          return { ...prev, monthly_used: used, purchased };
        });
        snapshotRef.current = market ? [...market.members] : [];
        setDirty(false);
        showToast(action === 'export_excel' ? 'Exportado · ' + cost + ' créditos' : 'Informe generado · ' + cost + ' créditos');
      } else {
        showToast('No se pudo generar. No se han cobrado créditos.');
      }
    },
    [market, showToast],
  );

  const creditBalance = credits ? credits.monthly_limit - credits.monthly_used + credits.purchased : null;

  if (loading) {
    const pendingLabel =
      USE_LIVE && analysis?.status === 'pending' ? 'Preparando análisis estratégico…' : null;
    return (
      <div className="flex flex-col gap-3 p-2">
        {pendingLabel ? (
          <div className="text-caption font-semibold text-text-secondary" data-testid="market-analysis-pending-label">
            {pendingLabel}
          </div>
        ) : null}
        {[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-2xl border border-border-default bg-surface-muted animate-pulse" />)}
      </div>
    );
  }
  if (!market || !anchor) {
    return (
      <Card className="text-center !py-10">
        <div className="text-[15px] font-bold text-text-primary">Sin datos de mercado suficientes</div>
        <p className="text-caption text-text-secondary max-w-[460px] mx-auto mt-2 leading-snug">
          Todavía no hay comparables con financieros y score suficientes para construir el análisis de mercado de esta empresa.
        </p>
      </Card>
    );
  }

  return (
    <div className="relative" onMouseLeave={() => tip.hide()}>
      {/* Cabecera de la pestaña */}
      <div className="flex items-center gap-3 flex-wrap pb-3.5">
        <div className="text-lg font-bold text-text-primary tracking-tight">Análisis estratégico de mercado</div>
        <span className="inline-flex items-center gap-2 rounded-full bg-text-primary text-surface-elevated px-3.5 py-1.5 text-[12.5px] font-semibold">
          ◉ {market.label} <span className="text-text-muted font-normal">· {membersScored.length} empresas · ancla: {anchor.name}</span>
        </span>
        {saveNote ? <span className="text-[11.5px] font-semibold text-success">Mercado guardado</span> : null}
        <span className="flex-1" />
        {creditBalance != null ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-border-default px-3 py-1.5 text-caption font-semibold text-text-secondary">
            <span className="w-[7px] h-[7px] rounded-full" style={{ background: OK }} /> <b className="text-text-primary">{creditBalance}</b> créditos
          </span>
        ) : null}
        <Btn onClick={() => setTab('mercado')}>▤ Modificar mercado</Btn>
        <Btn onClick={onExport}>⤓ Exportar</Btn>
      </div>

      {/* Sub-pestañas */}
      <div className="flex gap-0.5 border-b border-border-default mb-5 flex-wrap">
        {SUBTABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn('px-4 py-2.5 text-sm font-semibold cursor-pointer border-b-2 -mb-px transition-colors', tab === t.id ? 'text-brand-primary border-brand-primary' : 'text-text-secondary border-transparent hover:text-text-primary')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'mercado' && <PanelMercado market={market} members={membersScored} candidates={candidates} anchorId={market.anchor_id} nameInput={nameInput} setNameInput={setNameInput} onAdd={addMember} onRemove={removeMember} onSave={onSaveMarket} onPick={openCompany} />}
      {tab === 'posicionamiento' && <PanelPosicionamiento set={membersScored} anchor={anchor} tip={tip} onPick={openCompany} onCategory={openCategory} onModify={() => setTab('mercado')} reading={initialReading} />}
      {tab === 'comparables' && <PanelComparables set={membersScored} anchor={anchor} costLabel={undefined} onPick={openCompany} onCategory={openCategory} onGenerate={() => onGenerateReport('report_comparative')} quoteFn={API.quoteAction} />}
      {tab === 'oportunidades' && <PanelOportunidades set={membersScored} anchor={anchor} whiteSpace={whiteSpace} tip={tip} onPick={openCompany} />}
      {tab === 'informe' && <PanelInforme onGenerate={() => onGenerateReport('report_market_full')} quoteFn={API.quoteAction} />}

      {/* Tooltip */}
      {tipState.show ? <TooltipView c={tipState.c} x={tipState.x} y={tipState.y} /> : null}

      {/* Modal cotización */}
      {modal && credits ? (
        <QuoteModal modal={modal} balance={credits.monthly_limit - credits.monthly_used + credits.purchased} onCancel={() => setModal(null)} onConfirm={confirmAction} />
      ) : null}

      {/* Toast */}
      {toast ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-2.5 rounded-xl bg-text-primary text-surface-elevated px-4 py-3 text-sm font-semibold shadow-lg">
          <span className="w-2 h-2 rounded-full" style={{ background: OK }} /> {toast}
        </div>
      ) : null}
    </div>
  );
}

/* ─── Tooltip view ─────────────────────────────────────────────────────────── */
function TooltipView({ c, x, y }: { c: TipContent; x: number; y: number }) {
  const L = Math.min(x + 14, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 250);
  const T = Math.max(8, y - 60);
  return (
    <div className="fixed z-[200] pointer-events-none rounded-lg bg-text-primary text-surface-elevated text-xs font-semibold px-3 py-2 shadow-xl max-w-[240px] leading-snug" style={{ left: L, top: T }}>
      {c.label ? <span className="block text-[10.5px] font-normal uppercase tracking-wide text-text-muted mb-0.5">{c.label}</span> : null}
      <b>{c.title}</b>
      {c.detail ? <span> · {c.detail}</span> : null}
    </div>
  );
}

/* ─── QuoteModal ───────────────────────────────────────────────────────────── */
function QuoteModal({ modal, balance, onCancel, onConfirm }: { modal: { action: string; title: string; quote: Quote; warnChange: boolean; note?: string }; balance: number; onCancel: () => void; onConfirm: (a: string, c: number) => void }) {
  const enough = balance >= modal.quote.credits;
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-5 bg-black/45" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="w-full max-w-[440px] rounded-2xl bg-surface-elevated shadow-2xl overflow-hidden">
        <div className="px-6 pt-5"><h4 className="text-base font-bold text-text-primary m-0">{modal.title}</h4></div>
        <div className="px-6 pt-1.5 text-[13px] text-text-secondary leading-relaxed">
          {modal.note ? <div className="text-text-muted text-xs mb-1">{modal.note}</div> : null}
          {modal.warnChange ? (
            <div className="flex gap-2.5 rounded-lg border border-warning/40 bg-warning-subtle px-3 py-2.5 my-3 text-[12.5px] text-text-secondary leading-snug">
              ⚠ <div>Este mercado ha cambiado desde tu última descarga. Generar de nuevo consume créditos.</div>
            </div>
          ) : null}
          <div className="flex items-center justify-between rounded-lg border border-border-default px-3.5 py-3 my-3">
            <div><div className="text-[11px] text-text-muted">Coste</div><div className="text-xl font-bold text-text-primary">{modal.quote.credits} créditos</div></div>
            <div className="text-[11.5px] text-text-muted leading-relaxed text-right">{modal.quote.breakdown.map((b, i) => <div key={i}>{b}</div>)}</div>
          </div>
          <div className={cn('text-xs', enough ? 'text-text-muted' : 'text-brand-primary')}>Saldo tras la acción: {balance - modal.quote.credits} créditos{enough ? '' : ' · saldo insuficiente'}</div>
        </div>
        <div className="flex gap-2.5 justify-end px-6 py-5">
          <Btn onClick={onCancel}>Cancelar</Btn>
          <Btn variant="primary" disabled={!enough} onClick={() => onConfirm(modal.action, modal.quote.credits)}>Confirmar y {modal.action === 'export_excel' ? 'exportar' : 'generar'}</Btn>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PANEL · MERCADO (builder)
   ═══════════════════════════════════════════════════════════════════════════ */
function PanelMercado({ market, members, candidates, anchorId, nameInput, setNameInput, onAdd, onRemove, onSave, onPick }: { market: SavedMarket; members: MarketCompany[]; candidates: UniverseCandidate[]; anchorId: string; nameInput: string; setNameInput: (v: string) => void; onAdd: (id: string) => void; onRemove: (id: string) => void; onSave: () => void; onPick: (id: string) => void }) {
  const active = members.filter((c) => c.master_id !== anchorId);
  return (
    <div>
      <Sub className="text-[13px]">Construye tu mercado: elige entre las compañías similares que propone Arroba. Podrás <b>guardarlo</b> y reutilizarlo.</Sub>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <H3>Comparables activas <span className="text-text-muted font-normal">({members.length}/{market.plan_limit})</span></H3>
          <Sub>Empresas incluidas en el análisis</Sub>
          <div className="flex flex-wrap gap-2">
            {members.map((c) => {
              const isAnchor = c.master_id === anchorId;
              // HARDENING-038g (2026-09-17 · Daniel ajuste β) · Chips aligerados
              // en peso visual: rounded-lg (menos redondeo → más compacto vs
              // rounded-full anterior), borde neutro (no rojo), sin fondo tenue,
              // badge del ✓ reducido de w-4/h-4 con fondo RED saturado a w-3.5/h-3.5
              // con fondo brand-primary/85 más discreto. El anchor se distingue
              // con un punto RED pequeño, no con toda la card teñida.
              return (
                <span key={c.master_id} className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-surface-elevated px-2.5 py-1 text-[12.5px] font-semibold text-text-secondary">
                  <span className="w-3.5 h-3.5 rounded grid place-items-center text-[10px] font-extrabold text-text-on-brand bg-brand-primary/85">✓</span>
                  <button type="button" className="hover:text-brand-primary hover:underline" onClick={() => onPick(c.master_id)}>{c.name}</button>
                  {isAnchor ? (
                    <span className="inline-flex items-center gap-1 text-[10.5px] text-text-muted font-normal">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: RED }} />
                      Tu empresa
                    </span>
                  ) : (
                    <>
                      <span className="text-[10.5px] text-text-muted font-normal">Comparable</span>
                      <button type="button" className="text-text-muted font-extrabold ml-0.5 hover:text-text-primary" title="Quitar" onClick={() => onRemove(c.master_id)}>×</button>
                    </>
                  )}
                </span>
              );
            })}
          </div>
          <label className="block mt-3 text-[11px] font-bold uppercase tracking-wide text-text-secondary" htmlFor="mkt-name">Nombre del mercado</label>
          <input id="mkt-name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Ej. Turismo termal · España" className="w-full mt-1 rounded-lg border border-border-default bg-surface-primary px-3 py-2.5 text-[13px] text-text-primary focus:outline-none focus:border-brand-primary" />
          <Btn variant="outline-red" className="mt-2.5" onClick={onSave}>Guardar mercado</Btn>
        </Card>
        <Card>
          <H3>Selecciona del universo</H3>
          <Sub>Compañías similares propuestas por Arroba (por fingerprint)</Sub>
          <div className="flex flex-col gap-2">
            {candidates.map((u) => (
              <button key={u.master_id} type="button" onClick={() => onAdd(u.master_id)} className="flex items-center justify-between rounded-lg border border-border-default px-3 py-2.5 text-[13px] hover:border-brand-primary/40 text-left">
                <span className="text-text-primary">{u.name}</span>
                <span className="font-bold text-brand-primary">{u.score.toFixed(2).replace('.', ',')} +</span>
              </button>
            ))}
            {active.map((c) => (
              <button key={c.master_id} type="button" onClick={() => onRemove(c.master_id)} className="flex items-center justify-between rounded-lg border border-brand-primary/30 bg-brand-primary/5 px-3 py-2.5 text-[13px] text-left">
                <span className="text-text-primary">{c.name}</span>
                <span className="font-bold text-brand-primary">{c.__score != null ? c.__score.toFixed(2).replace('.', ',') : ''} ×</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PANEL · POSICIONAMIENTO
   ═══════════════════════════════════════════════════════════════════════════ */
function PanelPosicionamiento({ set, anchor, tip, onPick, onCategory, onModify, reading }: { set: MarketCompany[]; anchor: MarketCompany; tip: TipCtl; onPick: (id: string) => void; onCategory: (cat: string) => void; onModify: () => void; reading?: string | null }) {
  const revs = set.map((c) => c.revenue);
  const mars = set.filter((c) => c.ebitda_margin != null).map((c) => c.ebitda_margin as number);
  const medRev = S.median(revs);
  const medMar = S.median(mars);

  const CL: [ClusterKey, string, string][] = [['lider', 'Líderes de mercado', OK], ['plat', 'Plataformas de escala', INFO], ['nicho', 'Especialistas de nicho', WARN], ['sub', 'Jugadores subescala', RED]];
  const cnt: Record<ClusterKey, number> = { lider: 0, plat: 0, nicho: 0, sub: 0 };
  set.forEach((c) => {
    const k = clusterOf(c, medRev, medMar);
    cnt[k] = (cnt[k] ?? 0) + 1;
  });

  const radarAxes: [string, keyof MarketCompany][] = [['Margen', 'ebitda_margin'], ['EBITDA', 'ebitda'], ['Revenue', 'revenue'], ['Rev/Emp', 'rev_per_emp'], ['Empleados', 'employees'], ['Calidad', 'quality_score']];
  const me = radarAxes.map(([, f]) => S.pct(set.map((c) => c[f] as number).filter((v) => v != null), anchor[f] as number));

  const rkAxes: [string, keyof MarketCompany][] = [['EBITDA', 'ebitda'], ['Margen EBITDA', 'ebitda_margin'], ['Revenue', 'revenue'], ['Rev/Empleado', 'rev_per_emp'], ['Empleados', 'employees'], ['Calidad', 'quality_score']];
  const rankRows = rkAxes.map(([lab, f]) => {
    const arr = set.map((c) => c[f] as number).filter((v) => v != null);
    return { lab, p: S.pct(arr, anchor[f] as number), rk: S.rank(arr, anchor[f] as number), total: arr.length };
  });
  const scored = rkAxes.map(([lab, f]) => ({ lab, p: S.pct(set.map((c) => c[f] as number).filter((v) => v != null), anchor[f] as number) }));
  const str = scored.filter((x) => x.p >= 70).sort((a, b) => b.p - a.p);
  const weak = scored.filter((x) => x.p <= 35).sort((a, b) => a.p - b.p);
  const q = (p: number, hi: boolean) => (hi ? (p >= 85 ? 'muy por encima del mercado' : 'por encima del mercado') : p <= 15 ? 'muy por debajo del mercado' : 'por debajo del mercado');

  const distDefs: [string, keyof MarketCompany, (v: number | null) => string][] = [['EBITDA', 'ebitda', fmtM], ['Margen EBITDA', 'ebitda_margin', fmtPct], ['Revenue', 'revenue', fmtM], ['Rev/Empleado', 'rev_per_emp', fmtK]];

  return (
    <div className="flex flex-col gap-4">
      {reading ? (
        <Card>
          <div className="flex items-center gap-2 mb-2"><span className="text-body-sm font-bold text-text-primary">Lectura de mercado</span><span className="text-caption text-text-muted bg-surface-muted rounded-full px-2 py-0.5">IA · sobre datos verificados</span></div>
          <p className="text-body text-text-primary leading-relaxed m-0">{reading}</p>
        </Card>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <H3>Clustering de posición competitiva</H3>
            <div className="text-[11.5px] text-text-muted inline-flex items-center gap-1.5">Eje Y · Margen EBITDA · Eje X · Revenue</div>
          </div>
          <Sub>Compara tamaño de negocio y rentabilidad operativa: grandes y rentables, grandes poco eficientes, o pequeñas muy rentables.</Sub>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border-default rounded-lg overflow-hidden my-3.5">
            {CL.map(([k, l, col]) => (
              <div key={k} className="bg-surface-elevated px-3.5 py-3 border-t-[3px]" style={{ borderColor: col }}>
                <div className="text-[10.5px] font-bold uppercase tracking-wide leading-tight" style={{ color: col }}>{l}</div>
                <div className="text-[22px] font-extrabold text-text-primary mt-1">{cnt[k]}</div>
              </div>
            ))}
          </div>
          <Scatter set={set} medRev={medRev} medMar={medMar} anchorId={anchor.master_id} tip={tip} onPick={onPick} />
          <div className="grid grid-cols-2 gap-3 mt-3.5 text-xs text-text-secondary leading-snug">
            <div><b style={{ color: OK }}>Líderes de mercado:</b> escala alta + margen alto: referentes de pricing y consolidación.</div>
            <div><b style={{ color: INFO }}>Plataformas de escala:</b> escala alta con margen por mejorar: foco en eficiencia y mix.</div>
            <div><b style={{ color: WARN }}>Especialistas de nicho:</b> escala menor pero margen sólido: potencial de crecimiento selectivo.</div>
            <div><b style={{ color: RED }}>Jugadores subescala:</b> escala y margen bajos: candidatas a transformación o integración.</div>
          </div>
        </Card>
        <Card>
          <H3>Radar comparativo</H3>
          <Sub>Compara tu empresa frente a la mediana y el top 25% del mercado.</Sub>
          <Radar axes={radarAxes.map((x) => x[0])} me={me} tip={tip} />
          <div className="flex gap-4 justify-center flex-wrap text-[11.5px] text-text-secondary mt-2">
            <span className="inline-flex items-center gap-1.5"><i className="w-3.5 h-[3px] rounded-sm inline-block" style={{ background: RED }} /> Tu empresa</span>
            <span className="inline-flex items-center gap-1.5"><i className="w-3.5 h-[3px] rounded-sm inline-block" style={{ background: NEU }} /> Mediana</span>
            <span className="inline-flex items-center gap-1.5"><i className="w-3.5 h-[3px] rounded-sm inline-block" style={{ background: INFO }} /> Top 25%</span>
          </div>
          <p className="text-caption text-text-secondary mt-3 leading-snug">Percentil de tu empresa (rojo) frente a la mediana (P50, gris) y el cuartil superior (P75, azul) en 6 dimensiones. Donde superas la mediana tu posición es sólida; donde quedas por debajo, hay oportunidad.</p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <H3>Ranking de posición competitiva</H3>
          <Sub>Tu puesto en el mercado y percentil por métrica</Sub>
          <div>
            {rankRows.map((r) => (
              <div key={r.lab} className="grid items-center gap-3 py-2.5 border-b border-border-default/60 text-[12.5px]" style={{ gridTemplateColumns: '130px 40px 1fr 44px' }}>
                <span className="text-text-secondary">{r.lab}</span>
                <span className="text-text-muted text-center font-semibold">{r.rk}/{r.total}</span>
                <span className="h-2 rounded bg-surface-muted overflow-hidden"><i className="block h-full rounded" style={{ width: `${r.p}%`, background: RED }} /></span>
                <span className="text-right font-bold text-text-primary">P{r.p}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <H3>Resumen ejecutivo</H3>
          <Sub>¿Cómo está esta empresa respecto a su mercado?</Sub>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <h5 className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: OK }}>Fortalezas</h5>
              {(str.length ? str : [{ lab: 'Posición equilibrada', p: 50 }]).map((x) => <div key={x.lab} className="text-[12.5px] text-text-secondary leading-snug mb-1.5">{x.lab} — {x.p === 50 ? 'en línea con el mercado' : q(x.p, true)}</div>)}
            </div>
            <div>
              <h5 className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: WARN }}>Debilidades</h5>
              {(weak.length ? weak : [{ lab: 'Sin debilidades marcadas', p: null as number | null }]).map((x) => <div key={x.lab} className="text-[12.5px] text-text-secondary leading-snug mb-1.5">{x.lab}{x.p != null ? ' — ' + q(x.p, false) : ''}</div>)}
            </div>
            <div>
              <h5 className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: INFO }}>Oportunidad</h5>
              <div className="text-[12.5px] text-text-secondary leading-snug mb-1.5">Mejorar eficiencia sin tocar margen</div>
              <div className="text-[12.5px] text-text-secondary leading-snug mb-1.5">Escalar vía consolidación</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="text-[13px] font-bold text-text-primary mt-1">Distribución del mercado vs tu posición</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {distDefs.map(([lab, f, fmt]) => {
          const arr = set.map((c) => c[f] as number).filter((v) => v != null);
          const mn = Math.min(...arr), mx = Math.max(...arr);
          const q1 = S.quantile(arr, 0.25), md = S.quantile(arr, 0.5), q3 = S.quantile(arr, 0.75);
          const P = (v: number) => ((v - mn) / (mx - mn || 1)) * 100;
          const av = anchor[f] as number | null;
          return (
            <div key={lab} className="rounded-lg border border-border-default px-3.5 py-3">
              <div className="text-[10.5px] font-bold uppercase tracking-wide text-text-secondary">{lab}</div>
              <div className="relative h-[7px] bg-surface-muted rounded mx-1.5 mt-6 mb-2">
                {[q1, md, q3].map((v, i) => <span key={i} className="absolute -top-[5px] w-px h-[17px] bg-border-emphasis" style={{ left: `${P(v)}%` }} />)}
                {av != null ? <span className="absolute top-1/2 w-3 h-3 rounded-full border-2 border-white -translate-x-1/2 -translate-y-1/2 shadow" style={{ left: `${Math.max(3, Math.min(97, P(av)))}%`, background: RED }} /> : null}
              </div>
              <div className="flex justify-between text-[9px] text-text-muted"><span>Mín</span><span>Med</span><span>Máx</span></div>
              <div className="text-[13px] font-extrabold text-center mt-2" style={{ color: RED }}>Tú: {av == null ? 'sin dato' : fmt(av)}</div>
            </div>
          );
        })}
      </div>

      <div className="text-[13px] font-bold text-text-primary mt-1">Compañías del mercado</div>
      <Card className="!py-1.5 !px-5"><MarketTable set={set} anchorId={anchor.master_id} withDist={false} onPick={onPick} onCategory={onCategory} /></Card>
      <div><Btn onClick={onModify}>▤ Modificar mercado</Btn></div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PANEL · COMPARABLES
   ═══════════════════════════════════════════════════════════════════════════ */
function PanelComparables({ set, anchor, onPick, onCategory, onGenerate, quoteFn }: { set: MarketCompany[]; anchor: MarketCompany; costLabel?: string; onPick: (id: string) => void; onCategory: (cat: string) => void; onGenerate: () => void; quoteFn: (a: string, p?: Record<string, number>) => Promise<Quote> }) {
  const [cost, setCost] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    quoteFn('report_comparative').then((q) => alive && setCost(q.credits)).catch(() => {});
    return () => { alive = false; };
  }, [quoteFn]);

  const grp = set.filter((c) => c.master_id !== anchor.master_id);
  const gm = (f: keyof MarketCompany) => S.mean(grp.map((c) => c[f] as number).filter((v) => v != null));
  // HARDENING-038g (2026-09-17 · Daniel micro-fix α) · Fórmulas que dividen por
  // la media del grupo pueden producir NaN (grupo vacío tras filter · anchor con
  // null) o Infinity (media 0). R15: degradar a "n/d", no pintar "NaN%"/"Infinity%".
  const gEscRaw = (anchor.revenue / gm('revenue') - 1) * 100;
  const gMarRaw = (anchor.ebitda_margin ?? 0) - gm('ebitda_margin');
  const gEfRaw = ((anchor.rev_per_emp ?? 0) / gm('rev_per_emp') - 1) * 100;
  const gCalRaw = anchor.quality_score - gm('quality_score');
  const gEsc = Number.isFinite(gEscRaw) ? gEscRaw : null;
  const gMar = Number.isFinite(gMarRaw) ? gMarRaw : null;
  const gEf = Number.isFinite(gEfRaw) ? gEfRaw : null;
  const gCal = Number.isFinite(gCalRaw) ? gCalRaw : null;

  const fmtPctGap = (v: number | null) =>
    v == null ? 'n/d' : (v >= 0 ? '+' : '') + v.toFixed(0) + '%';
  const fmtPpGap = (v: number | null) =>
    v == null ? 'n/d' : (v >= 0 ? '+' : '') + v.toFixed(1).replace('.', ',') + ' pp';
  const fmtPtsGap = (v: number | null) =>
    v == null ? 'n/d' : (v >= 0 ? '+' : '') + v.toFixed(0) + ' pts';
  const gapDir = (v: number | null, positive: string, negative: string) =>
    v == null ? 'sin dato para comparar' : v >= 0 ? positive : negative;

  const gaps: { t: string; d: string; v: string; x: string; up: boolean }[] = [
    { t: 'Gap de escala', d: 'Revenue vs promedio grupo', v: fmtPctGap(gEsc), x: gapDir(gEsc, 'por encima del promedio', 'por debajo del promedio'), up: (gEsc ?? 0) >= 0 },
    { t: 'Gap de margen', d: 'Margen EBITDA vs promedio', v: fmtPpGap(gMar), x: gapDir(gMar, 'muy por encima del promedio del grupo', 'por debajo del promedio del grupo'), up: (gMar ?? 0) >= 0 },
    { t: 'Gap de eficiencia', d: 'Rev/Empleado vs promedio', v: fmtPctGap(gEf), x: gapDir(gEf, 'por encima del promedio del grupo', 'por debajo del promedio del grupo'), up: (gEf ?? 0) >= 0 },
    { t: 'Gap de calidad', d: 'Quality Score vs promedio', v: fmtPtsGap(gCal), x: gapDir(gCal, 'por encima del promedio del grupo', 'por debajo del promedio del grupo'), up: (gCal ?? 0) >= 0 },
  ];

  const cols: [string, keyof MarketCompany, 'pp' | '%'][] = [['Revenue', 'revenue', '%'], ['EBITDA', 'ebitda', '%'], ['Margen', 'ebitda_margin', 'pp'], ['Rev/Emp', 'rev_per_emp', '%'], ['Calidad', 'quality_score', '%']];

  const closest = [...grp].filter((c) => c.__score != null).sort((x, y) => (x.__score as number) - (y.__score as number))[0];
  const gMarTxt = gMar == null ? 'n/d' : Math.abs(gMar).toFixed(1).replace('.', ',');
  const effTxt = gEf == null ? 'n/d' : Math.abs(gEf).toFixed(0);

  return (
    <div className="flex flex-col gap-4">
      <Sub className="text-[13px]">Comparando frente a tu mercado · Empresa base: <b>{anchor.name}</b></Sub>
      <Card className="!py-1.5 !px-5"><MarketTable set={set} anchorId={anchor.master_id} withDist onPick={onPick} onCategory={onCategory} /></Card>

      <div className="text-[13px] font-bold text-text-primary">Distancia frente al promedio del grupo comparable</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {gaps.map((g) => (
          <div key={g.t} className="rounded-lg border border-border-default px-3.5 py-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">{g.t}</div>
            <div className="text-[11.5px] text-text-muted mt-0.5 leading-snug">{g.d}</div>
            <div className="text-2xl font-extrabold my-2" style={{ color: g.up ? OK : WARN }}>{g.v}</div>
            <div className="text-[11.5px] text-text-muted leading-snug">{g.x}</div>
          </div>
        ))}
      </div>

      <div className="text-[13px] font-bold text-text-primary">Matriz de diferencias vs tu empresa</div>
      <Card>
        <div className="flex gap-4 text-[11.5px] text-text-muted mb-2.5">
          <span><i className="inline-block w-2.5 h-2.5 rounded mr-1.5 align-[-1px]" style={{ background: OK, opacity: 0.25 }} />Mejor que tú</span>
          <span><i className="inline-block w-2.5 h-2.5 rounded mr-1.5 align-[-1px]" style={{ background: RED, opacity: 0.25 }} />Por debajo</span>
          <span><i className="inline-block w-2.5 h-2.5 rounded mr-1.5 align-[-1px] bg-surface-muted" />Similar</span>
        </div>
        <table className="w-full text-xs" style={{ borderCollapse: 'separate', borderSpacing: 3 }}>
          <thead>
            <tr className="[&>th]:text-[10px] [&>th]:uppercase [&>th]:tracking-wide [&>th]:text-text-muted [&>th]:p-1.5 [&>th]:text-center [&>th:first-child]:text-left">
              <th>Empresa</th>{cols.map((c) => <th key={c[0]}>{c[0]}</th>)}
            </tr>
          </thead>
          <tbody>
            {grp.map((c) => (
              <tr key={c.master_id}>
                <td className="text-left font-semibold text-text-primary p-2"><button type="button" className="hover:text-brand-primary hover:underline" onClick={() => onPick(c.master_id)}>{c.name}</button></td>
                {cols.map(([, f, u]) => {
                  const cv = c[f] as number | null, av = anchor[f] as number | null;
                  if (cv == null || av == null) return <td key={String(f)} className="text-center rounded p-2 bg-surface-muted text-text-muted font-semibold">n/d</td>;
                  let d: number, txt: string;
                  if (u === 'pp') { d = cv - av; txt = (d >= 0 ? '+' : '') + d.toFixed(0) + ' pp'; }
                  else { d = (cv / av - 1) * 100; txt = (d >= 0 ? '+' : '') + d.toFixed(0) + '%'; }
                  // HARDENING-038g · matriz: div/0 puede dar Infinity → degradar n/d.
                  if (!Number.isFinite(d)) return <td key={String(f)} className="text-center rounded p-2 bg-surface-muted text-text-muted font-semibold">n/d</td>;
                  const near = Math.abs(d) < 3;
                  const style = near ? { background: 'var(--surface-muted, #f4f4f2)' } : d > 0 ? { background: OK, opacity: undefined } : { background: RED };
                  const cls = near ? 'bg-surface-muted text-text-secondary' : d > 0 ? 'text-success' : 'text-danger';
                  return <td key={String(f)} className={cn('text-center rounded p-2 font-semibold', cls)} style={near ? undefined : { background: (d > 0 ? OK : RED) + '20' }}>{txt}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <H3 tone={OK}>Comparables más cercanas y ventajas</H3>
          <Sub>Perfil más parecido al tuyo por fingerprint</Sub>
          <div className="text-[13px] text-text-secondary leading-relaxed">
            {closest ? (
              <>
                <b>{closest.name}</b> (distancia {(closest.__score as number).toFixed(2).replace('.', ',')}) es la más parecida en tamaño y modelo{closest.ebitda_margin != null && anchor.ebitda_margin != null && closest.ebitda_margin < anchor.ebitda_margin ? ', aunque con menor margen' : ''}. Tu <b>margen EBITDA</b> está {gMarTxt} pp {gMar == null ? 'sin dato para comparar' : gMar >= 0 ? 'por encima' : 'por debajo'} del promedio del grupo y tu <b>calidad</b> {gCal == null ? 'n/d' : (gCal >= 0 ? '+' : '') + gCal.toFixed(0) + ' pts'}.
              </>
            ) : '—'}
          </div>
        </Card>
        <Card>
          <H3 tone={INFO}>Principales gaps y mejoras</H3>
          <Sub>Dónde puedes ganar terreno</Sub>
          <div className="text-[13px] text-text-secondary leading-relaxed">
            El principal gap está en <b>rev/empleado</b>: {gEf == null ? 'sin dato para comparar (no hay eficiencia calculable en el grupo)' : <>un {effTxt}% {gEf >= 0 ? 'por encima' : 'por debajo'} del promedio</>}. Hay margen para <b>mejorar eficiencia operativa o escalar</b> sin deteriorar el margen, que ya es líder del grupo.
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-4 rounded-2xl px-6 py-4" style={{ background: 'linear-gradient(135deg,#1c1a18,#34302b)' }}>
        <div className="flex-1"><b className="text-white text-[15px] block">Informe comparativo del mercado</b><span className="text-white/60 text-[12.5px]">Todas las compañías, gaps y matriz de diferencias, exportable con marca ARROBA.</span></div>
        <div className="text-right"><Btn variant="primary" onClick={onGenerate}>Generar informe</Btn><div className="text-[11px] text-white/60 mt-1.5">{cost != null ? cost + ' créditos' : ''}</div></div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PANEL · OPORTUNIDADES
   ═══════════════════════════════════════════════════════════════════════════ */
function PanelOportunidades({ set, anchor, whiteSpace, tip, onPick }: { set: MarketCompany[]; anchor: MarketCompany; whiteSpace: WhiteSpaceItem[]; tip: TipCtl; onPick: (id: string) => void }) {
  const medRev = S.median(set.map((c) => c.revenue));
  const medMar = S.median(set.filter((c) => c.ebitda_margin != null).map((c) => c.ebitda_margin as number));

  const gemsBase = set.filter((c) => c.master_id !== anchor.master_id && c.revenue < medRev && (c.ebitda_margin ?? -99) >= medMar);
  const gems = gemsBase.length ? gemsBase : set.filter((c) => c.master_id !== anchor.master_id).slice(0, 1);

  const targets = [...set].filter((c) => c.master_id !== anchor.master_id && c.__score != null).sort((x, y) => (x.__score as number) - (y.__score as number)).slice(0, 4);

  const effP = S.pct(set.map((c) => c.rev_per_emp as number).filter((v) => v != null), anchor.rev_per_emp);

  const brkAxes: [string, keyof MarketCompany][] = [['Escala (Revenue)', 'revenue'], ['Eficiencia (Rev/Emp)', 'rev_per_emp'], ['Margen EBITDA', 'ebitda_margin'], ['Calidad (QS)', 'quality_score']];

  // potencial de crecimiento §3
  const rpe = set.map((c) => c.rev_per_emp as number).filter((v) => v != null);
  const p50 = S.quantile(rpe, 0.5), p75 = S.quantile(rpe, 0.75);
  const rp = anchor.rev_per_emp ?? 0;
  const orgLo = Math.max(0, ((p50 - rp) * anchor.employees) / 1000);
  const orgHi = Math.max(orgLo, ((p75 - rp) * anchor.employees) / 1000);
  const pctLo = (orgLo / anchor.revenue) * 100, pctHi = (orgHi / anchor.revenue) * 100;
  const grpTop = set.filter((c) => c.master_id !== anchor.master_id).sort((x, y) => (x.__score ?? 9) - (y.__score ?? 9)).slice(0, 4);
  const maSum = grpTop.reduce((s, c) => s + c.revenue, 0);

  const Gem = ({ children }: { children: React.ReactNode }) => <div className="grid items-center gap-x-3.5 py-2.5 border-b border-border-default/60 last:border-0" style={{ gridTemplateColumns: '1fr auto auto' }}>{children}</div>;

  return (
    <div className="flex flex-col gap-4">
      <Sub className="text-[13px]">Detecta espacio de crecimiento, targets relevantes y ventajas competitivas en tu mercado.</Sub>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <H3>Hidden gems</H3><Sub>Compañías pequeñas con márgenes altos y potencial.</Sub>
          <div className="grid gap-1 text-[10px] font-bold uppercase tracking-wide text-text-muted pb-1.5 border-b border-border-default" style={{ gridTemplateColumns: '1fr auto auto', columnGap: 14 }}><span>Empresa</span><span>Revenue</span><span>Margen</span></div>
          {gems.map((c) => <Gem key={c.master_id}><button type="button" className="text-[12.5px] font-semibold text-text-primary hover:text-brand-primary hover:underline text-left" onClick={() => onPick(c.master_id)}>{c.name}</button><span className="text-xs text-text-secondary text-right">{fmtM(c.revenue)}</span><span className="text-xs text-right" style={{ color: OK }}>{fmtPct(c.ebitda_margin)}</span></Gem>)}
        </Card>
        <Card>
          <H3>Targets interesantes</H3><Sub>Buen equilibrio entre tamaño, rentabilidad y cercanía.</Sub>
          <div className="grid gap-1 text-[10px] font-bold uppercase tracking-wide text-text-muted pb-1.5 border-b border-border-default" style={{ gridTemplateColumns: '1fr auto auto', columnGap: 14 }}><span>Empresa</span><span>Margen</span><span>Cercanía</span></div>
          {targets.map((c) => <Gem key={c.master_id}><button type="button" className="text-[12.5px] font-semibold text-text-primary hover:text-brand-primary hover:underline text-left" onClick={() => onPick(c.master_id)}>{c.name}</button><span className="text-xs text-text-secondary text-right">{fmtPct(c.ebitda_margin)}</span><span className="text-xs text-text-secondary text-right">{(c.__score as number).toFixed(2).replace('.', ',')}</span></Gem>)}
        </Card>
        <Card>
          <H3>White space</H3><Sub>Espacios poco atendidos con alta oportunidad.</Sub>
          <div className="grid gap-1 text-[10px] font-bold uppercase tracking-wide text-text-muted pb-1.5 border-b border-border-default" style={{ gridTemplateColumns: '1fr auto auto', columnGap: 14 }}><span>Área de oportunidad</span><span /><span>Oportunidad</span></div>
          <Gem><span className="text-[12.5px] font-semibold text-text-primary">Eficiencia (Rev/Emp)</span><span /><span className="text-xs text-right" style={{ color: effP <= 33 ? OK : effP <= 66 ? WARN : NEU }}>{effP <= 33 ? 'Alta' : effP <= 66 ? 'Media' : 'Baja'}</span></Gem>
          {whiteSpace.map((w) => <Gem key={w.area}><span className="text-[12.5px] font-semibold text-text-primary">{w.area}</span><span /><span className="text-xs text-right" style={{ color: OK }}>{w.level}</span></Gem>)}
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <H3>Mapa de oportunidades</H3><Sub>Revenue vs Margen EBITDA. Las zonas representan el nivel de oportunidad del mercado.</Sub>
          <OppMap set={set} medRev={medRev} medMar={medMar} anchorId={anchor.master_id} tip={tip} onPick={onPick} />
        </Card>
        <Card>
          <H3>Cómo leer las zonas</H3><Sub>Las líneas discontinuas dividen el plano por la mediana de revenue y margen del mercado.</Sub>
          <div className="flex flex-col gap-3 text-[12.5px] text-text-secondary leading-snug">
            <div className="flex gap-2.5"><span className="w-3 h-3 rounded-sm mt-0.5 shrink-0" style={{ background: OK + '22', border: `1px solid ${OK}` }} /><div><b style={{ color: OK }}>Oportunidad alta</b> — margen alto + escala baja. Espacio para crecer sin gran competencia.</div></div>
            <div className="flex gap-2.5"><span className="w-3 h-3 rounded-sm mt-0.5 shrink-0" style={{ background: WARN + '22', border: `1px solid ${WARN}` }} /><div><b style={{ color: WARN }}>Competido</b> — margen alto + escala alta. Atractivo pero más disputado.</div></div>
            <div className="flex gap-2.5"><span className="w-3 h-3 rounded-sm mt-0.5 shrink-0" style={{ background: RED + '22', border: `1px solid ${RED}` }} /><div><b style={{ color: RED }}>Poco atractivo</b> — margen bajo + escala baja. Baja atractividad relativa.</div></div>
            <div className="flex gap-2.5"><span className="w-3 h-3 rounded-sm mt-0.5 shrink-0 bg-surface-muted border border-border-emphasis" /><div><b className="text-text-primary">Saturado</b> — escala alta + margen bajo. Mercado maduro con poco margen de mejora.</div></div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <H3>Brechas de posicionamiento</H3><Sub>Áreas donde puedes mejorar y ganar ventaja</Sub>
          <div>
            {brkAxes.map(([lab, f]) => {
              const p = S.pct(set.map((c) => c[f] as number).filter((v) => v != null), anchor[f] as number);
              const lvl = p <= 33 ? ['Alta', OK, 'success-subtle'] : p <= 66 ? ['Media', WARN, 'warning-subtle'] : ['Baja', NEU, 'surface-muted'];
              return (
                <div key={lab} className="grid items-center gap-3 py-2.5 border-b border-border-default/60 last:border-0 text-[12.5px]" style={{ gridTemplateColumns: '150px 1fr 44px 64px' }}>
                  <span className="text-text-secondary">{lab}</span>
                  <span className="h-2 rounded bg-surface-muted overflow-hidden"><i className="block h-full rounded" style={{ width: `${p}%`, background: OK }} /></span>
                  <span className="text-right font-bold text-text-primary">P{p}</span>
                  <span className="text-[10.5px] font-bold text-center py-0.5 rounded" style={{ background: (lvl[1] as string) + '22', color: lvl[1] as string }}>{lvl[0]}</span>
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <H3>Potencial de crecimiento</H3><Sub>Crecimiento estimado capturable en 3–5 años</Sub>
          <div className="rounded-lg border border-dashed p-4 text-center" style={{ borderColor: WARN, background: WARN + '14' }}>
            <div className="text-xs text-text-secondary">Potencial incremental (orgánico)</div>
            <div className="text-[26px] font-extrabold my-1" style={{ color: WARN }}>+{orgLo.toFixed(1).replace('.', ',')} – {orgHi.toFixed(1).replace('.', ',')} M€</div>
            <div className="text-xs text-text-secondary">+{pctLo.toFixed(0)}% a +{pctHi.toFixed(0)}% sobre tu revenue actual</div>
          </div>
          <div className="border-t border-dashed border-border-emphasis mt-3 pt-2.5 text-xs text-text-secondary">Vía <b className="text-text-primary">consolidación selectiva</b> ({grpTop.length} targets): hasta <b className="text-text-primary">+{maSum.toFixed(1).replace('.', ',')} M€</b> de facturación adicional — crecimiento inorgánico, mostrado aparte del orgánico.</div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-text-secondary mt-3.5 mb-1.5">Palancas principales</div>
          <div className="flex flex-col gap-1 text-[13px] text-text-secondary">
            <div className="flex gap-2"><span style={{ color: OK }}>●</span> Aumentar eficiencia operativa (rev/empleado)</div>
            <div className="flex gap-2"><span style={{ color: INFO }}>●</span> Consolidación selectiva ({grpTop.length} targets)</div>
            <div className="flex gap-2"><span style={{ color: RED }}>●</span> Escalar sin deteriorar rentabilidad</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PANEL · INFORME
   ═══════════════════════════════════════════════════════════════════════════ */
function PanelInforme({ onGenerate, quoteFn }: { onGenerate: () => void; quoteFn: (a: string, p?: Record<string, number>) => Promise<Quote> }) {
  const [cost, setCost] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    quoteFn('report_market_full').then((q) => alive && setCost(q.credits)).catch(() => {});
    return () => { alive = false; };
  }, [quoteFn]);
  return (
    <Card className="text-center !py-10">
      <div className="text-[15px] font-bold text-text-primary">Informe de análisis de mercado</div>
      <p className="text-caption text-text-secondary max-w-[460px] mx-auto mt-2 mb-4 leading-snug">Genera un informe profesional con el posicionamiento, los comparables y las oportunidades de este mercado, exportable a PDF con marca ARROBA.</p>
      <Btn variant="primary" onClick={onGenerate}>Generar informe{cost != null ? ' · ' + cost + ' créditos' : ''}</Btn>
    </Card>
  );
}

export default MercadoTab;
