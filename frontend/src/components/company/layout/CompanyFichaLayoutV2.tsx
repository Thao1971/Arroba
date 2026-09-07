'use client';
/**
 * CompanyFichaLayoutV2 — Ficha de Empresa reproducida 1:1 desde la fuente
 * canónica `arroba.com/mockups/ficha-empresa-f01.html` (Daniel 2026-08-09:
 * "usa siempre la fuente"). El CSS es el del mockup, extraído verbatim y
 * scopeado bajo `.afk` (ver fichaMockupCss.ts). El maquetado reproduce las
 * clases del mockup; los datos son SIEMPRE reales (R4/R10: el front no calcula
 * ni inventa). Las secciones sin motor cableado quedan como "pronto".
 */
import React, { Component, Fragment, useEffect, useMemo, useState } from 'react';
import {
  Activity, BarChart3, Bell, Bookmark, Coins, Euro, ExternalLink, File, FileText, Files, Folder,
  Gauge, GitCompare, Hourglass, LayoutGrid, Linkedin, Lock, type LucideIcon, Network, PieChart,
  Scale, Share2, Shield, Sparkles, Target, Users, Zap,
} from 'lucide-react';

import type {
  BuyerItem, CapitalMarketsBlock, CashFlowRow, CashFlowStatement, ControlGraphAggregated, ControlGraphBlock, ControlGraphNominal, FinancialAnalysis, FinancialAnalysisBalanceSheet, FinancialAnalysisRatioDetail,
  FinancialSection, FinancialTableBlock, GovernanceAggregated, GovernanceBlock, GovernanceNominal,
  IdentitySection, MarketBlock, OwnershipAggregated, OwnershipBlock, OwnershipNominal,
  RecommendationSet, SemanticSection, SignalAnalysis, ValuationAnalysis,
} from '@/lib/companies/intelligence-types';
import { FICHA_MOCKUP_CSS } from './fichaMockupCss';
import { MethodDetails, METHOD_VALORACION, METHOD_HHI, METHOD_RANKINGS } from '@/components/company/atoms/MethodDetails';
import { useRevealOnScroll, useCountUp, useBarFill } from '@/hooks/useRevealOnScroll';
import { SrcDot } from '@/components/company/atoms/SrcDot';
import { provenanceFor, type ProvenanceValue } from '@/lib/companies/provenance';
import { PROPIEDAD_MOCKUP_CSS } from './propiedadMockupCss';
import { notify } from '@/lib/notify';
import { useCopilot } from '@/components/copilot/CopilotProvider';
import { buildChipPrompt, hasPromptForChip } from '@/lib/copilot/prompts';
import { computeDnEbitdaState, type DnEbitdaState } from '@/lib/companies/dn-ebitda';

// HARDENING-037 · Cableado del sectionRegistry (puntos de extensión) para las
// pestañas Mercado / Oportunidades / Comité (blocks aterrizados en
// components/blocks/*). Adapters puros mapean payload canónico → shape del
// bloque. Detalle de decisiones en /app/docs/HARDENING-037_puntos_extension.md.
import { getSection, type FichaSectionContext } from './sectionRegistry';
import {
  marketBlockToContextView,
  opportunityToThesisView,
} from './adapters';
// HARDENING-037 · SingleExerciseChart en Resumen cuando evolution tiene 1 año.
import {
  SingleExerciseChart,
  singleExerciseFromEvolution,
  resolveSingleExerciseCascade,
} from '@/components/blocks/financial/SingleExerciseChart';
// HARDENING-038 · Proxies JWT para el Committee. Se inyecta como callback en
// el context del registry; el bloque llama runCommittee(lens) y no conoce apiClient.
import { apiClient } from '@/lib/api/client';

export interface CompanyFichaLayoutV2Props {
  identity: IdentitySection;
  financial: FinancialSection | null;
  financialAnalysis: FinancialAnalysis | null;
  financialAnalysisLoading?: boolean;
  valuation: ValuationAnalysis | null;
  valuationLoading?: boolean;
  semantic: SemanticSection | null;
  signal?: SignalAnalysis | null;
  buyers?: RecommendationSet | null;
  opportunities?: RecommendationSet | null;
  /**
   * HARDENING-022b · Bloque `opportunity` (singular) del payload `/ficha`
   * emitido por Intel. Contiene:
   *   - `thesis.narrative`: prosa CF combinada de sector + posicionamiento + veredicto (T4).
   *   - `chips[]`: chips de oportunidades activas `{enum, label_es}` para la cabecera T1.
   * Passthrough puro. `undefined`/`null` → UI degrada a Empty (R15).
   */
  opportunity?: {
    thesis?: { narrative?: string | null } | null;
    chips?: Array<{ enum?: string | null; label_es?: string | null }> | null;
  } | null;
  /**
   * B-2.3 · Bloque `governance` del agregador `/ficha`. Union type discriminado
   * por `available` + presencia de `officers`/`summary`:
   *   - Autenticado con datos → shape nominal (officers[]).
   *   - Anónimo con datos → shape agregado DPD (summary{total,roles[]}, sin PII).
   *   - `available:false` → passthrough para ambos.
   * El frontend NUNCA transforma. Solo renderiza el shape recibido.
   */
  governance?: GovernanceBlock | null;
  /**
   * B-2.2 · Bloque `ownership` del agregador `/ficha`. Union type discriminado:
   *   - Autenticado con datos → shape nominal (shareholders[] + control).
   *   - Anónimo con datos → shape agregado DPD (summary{total_shareholders,tier?,top1_pct?}).
   *   - `available:false` → passthrough para ambos.
   * El backend garantiza que el usuario anónimo NUNCA recibe nombres ni
   * porcentajes individuales. Cero heurística de clasificación jurídica/física.
   */
  ownership?: OwnershipBlock | null;
  /**
   * HARDENING-014 · Bloque `control_graph` top-level Intel. Union type discriminado:
   *   - Autenticado con datos → shape nominal (upstream[]/downstream[]/ubo/nodes/edges/narrative).
   *   - Anónimo con datos → shape agregado DPD (summary sin PII, mantiene narrative/coverage/control.tier).
   *   - `available:false` → passthrough para ambos.
   * Fuente canónica de la sección **Propiedad** (mockup con tabs Árbol/Distribución/Grafo).
   * Fallback al bloque `ownership` legacy sólo si `control_graph` es `null` o `unavailable`.
   */
  controlGraph?: ControlGraphBlock | null;
  /** B-2 · Events shell: `ficha.events` passthrough. Público. */
  events?: Record<string, unknown> | null;
  /**
   * HARDENING-012 · Bloque `market` top-level Intel. Passthrough puro.
   * Sub-paneles independientes: sector/geo/concentration públicos · position gated.
   */
  market?: MarketBlock | null;
  /** Fase 2 (2026-09-01) · bloque `capital_markets` top-level Intel (CNMV/BME). Passthrough puro. */
  capitalMarkets?: CapitalMarketsBlock | null;
  /**
   * HARDENING-038b · Payloads crudos de los proxies Intel para poblar sell
   * (sucesión) y buy (roll-up) del bloque Oportunidades. Passthrough; el adapter
   * `opportunityToThesisView` mapea. `null` → sell/buy undefined (R15).
   */
  succession?: unknown;
  rollup?: unknown;
  /**
   * HARDENING-038b · Lectura de mercado en prosa (proxy market-reading). Se
   * inyecta al adapter `marketBlockToContextView` como `reading`.
   */
  marketReading?: string | null;
  /** false = visitante anónimo (mixed-access): cifras bajo CTA de registro. */
  authenticated?: boolean;
  /**
   * Columna derecha de la ficha (`aside.deal`, HARDENING pendiente de número):
   * próxima acción + CTAs de créditos, adaptada al perfil real de quien mira
   * (Comprador/Vendedor/Busca capital/Asesor/Anónimo), calcada del diseño y la
   * lógica ya verificados en `mockups/ficha-empresa-f01.html` (`applyPersona`),
   * alineada con `STAGES_V1` de Intel (transaction_os). Passthrough puro:
   * `undefined`/`null` → degrada al card genérico "Pendiente" (R15), porque hoy
   * el agregador `/ficha` de Intel todavía no expone si hay una operación activa
   * en esta empresa ni qué perfil tiene el usuario en ella — ese es el único
   * hueco real que falta cerrar para que este panel muestre datos de verdad.
   */
  dealAside?: DealAsideState | null;
}

/* ============================ Deal aside (columna derecha) ============================
 * Puerto 1:1 de `applyPersona()`/`deal()` de `mockups/ficha-empresa-f01.html` (verificado y
 * aprobado por Daniel 2026-08-22) a un componente de datos: el componente solo renderiza
 * `DealAsideState`, no decide qué perfil ni qué etapa mostrar — esa decisión (quién es el
 * usuario respecto a esta empresa + en qué paso de STAGES_V1 está) es responsabilidad de un
 * adapter futuro (mismo patrón que `opportunityToThesisView`/`marketBlockToContextView` más
 * abajo), alimentado por un endpoint de Intel que hoy no existe. Mientras no exista,
 * `props.dealAside` se deja sin usar y la ficha sigue mostrando el card "Pendiente" de
 * siempre — cero riesgo de mostrar datos de ejemplo en producción.
 * ======================================================================================== */
export type DealPersona = 'comprador' | 'vendedor' | 'capital' | 'asesor' | 'anonimo';

const DEAL_ICONS: Record<string, LucideIcon> = {
  lock: Lock, shield: Shield, folder: Folder, files: Files, file: File,
  compare: GitCompare, users: Users, fileText: FileText, gauge: Gauge,
};

export interface DealActionItem {
  /** Clave de `DEAL_ICONS`. */
  icon: string;
  label: string;
  /** Coste en créditos a mostrar, p.ej. "8 créd." o "3 pend."; `null`/omitido = acción gratuita. */
  credits?: string | null;
  /** true = botón bloqueado (candado), esperando el paso anterior de STAGES_V1. */
  locked?: boolean;
  /** Nota bajo el botón bloqueado explicando qué lo desbloquea. */
  lockNote?: string | null;
  /** Clave de acción para wiring futuro (p.ej. 'firmar-nda'); sin handler todavía. */
  actionKey?: string | null;
}

export interface DealStep { label: string; state: 'done' | 'cur' | 'todo'; }

export interface DealReportItem { icon: string; label: string; credits?: string | null; }

export interface DealAsideState {
  persona: DealPersona;
  /** Eyebrow superior del card, p.ej. "Tu próxima acción · En venta". */
  escc: string;
  /** Variables CSS ya definidas en `.afk` (p.ej. 'var(--red)'), no colores sueltos. */
  accentColor: string;
  accentTint: string;
  accentTintBorder: string;
  /** Etiqueta pequeña de la cabecera del card (`.dh .k`). */
  kicker: string;
  /** Valor grande de la cabecera del card (`.dh .v`), p.ej. "En venta". */
  stateLabel: string;
  paragraph: string;
  rows?: Array<[string, string]>;
  actions: DealActionItem[];
  steps?: DealStep[];
  footnote?: string | null;
  /** Bloque opcional "Informes y documentos" — independiente de la etapa del proceso. */
  reports?: DealReportItem[];
}

function DealAsideCard({ state }: { state: DealAsideState }): React.ReactElement {
  return (
    <>
      <div className="escc">{state.escc}</div>
      <div className="dcard" style={{ borderColor: state.accentColor }}>
        <div className="dh" style={{ background: state.accentTint, borderColor: state.accentTintBorder }}>
          <div className="k" style={{ color: state.accentColor }}>{state.kicker}</div>
          <div className="v">{state.stateLabel}</div>
        </div>
        <div className="db">
          <p>{state.paragraph}</p>
          {!!state.rows?.length && (
            <div className="dgrid">
              {state.rows.map(([l, v], i) => (
                <div key={i}><div className="l">{l}</div><div className="v">{v}</div></div>
              ))}
            </div>
          )}
          <div className="dacts">
            {state.actions.map((a, i) => {
              const Icon = DEAL_ICONS[a.locked ? 'lock' : a.icon] ?? Lock;
              return (
                <Fragment key={i}>
                  <div
                    className={`dbtn${i === 0 && !a.locked ? ' p' : ''}${a.locked ? ' locked' : ''}`}
                    data-act={a.actionKey ?? undefined}
                  >
                    <span data-ic={a.locked ? 'lock' : a.icon}><Icon size={16} /></span>
                    {a.label}
                    {a.credits ? <span className="crd">{a.credits}</span> : null}
                  </div>
                  {a.locked && a.lockNote ? <div className="locknote">{a.lockNote}</div> : null}
                </Fragment>
              );
            })}
          </div>
          {!!state.steps?.length && (
            <div className="proc">
              <div className="ph">Próximos pasos</div>
              {state.steps.map((s, i) => (
                <div key={i} className={`step${s.state === 'todo' ? ' todo' : s.state === 'cur' ? ' cur' : ''}`}>
                  <span className="d" /> {s.label}
                </div>
              ))}
            </div>
          )}
          {!!state.reports?.length && (
            <div className="reports">
              <div className="ph">Informes y documentos</div>
              <div className="dacts">
                {state.reports.map((r, i) => {
                  const Icon = DEAL_ICONS[r.icon] ?? FileText;
                  return (
                    <div className="dbtn" key={i}>
                      <span data-ic={r.icon}><Icon size={16} /></span>
                      {r.label}
                      {r.credits ? <span className="crd">{r.credits}</span> : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {state.footnote ? (
            <p style={{ marginTop: 12, fontSize: 11.5, color: 'var(--n400)' }}>{state.footnote}</p>
          ) : null}
        </div>
      </div>
    </>
  );
}

type SectionId =
  | 'resumen' | 'finanzas' | 'valoracion' | 'propiedad' | 'gobierno' | 'mercado'
  | 'rankings' | 'comparativa' | 'senales' | 'oportunidades' | 'comite'
  | 'sucesion' | 'sector' | 'eventos' | 'registros' | 'documentos';

interface NavItem { id: SectionId; label: string; icon: LucideIcon; ready: boolean; grp: string; }
const NAV: NavItem[] = [
  { id: 'resumen', label: 'Resumen', icon: LayoutGrid, ready: true, grp: 'Perfil' },
  { id: 'finanzas', label: 'Finanzas', icon: Euro, ready: true, grp: 'Perfil' },
  { id: 'valoracion', label: 'Valoración', icon: Coins, ready: true, grp: 'Perfil' },
  { id: 'propiedad', label: 'Propiedad', icon: Network, ready: true, grp: 'Perfil' },
  { id: 'gobierno', label: 'Gobierno', icon: Users, ready: true, grp: 'Perfil' },
  { id: 'mercado', label: 'Mercado', icon: BarChart3, ready: true, grp: 'Perfil' },
  { id: 'rankings', label: 'Rankings', icon: Target, ready: true, grp: 'Perfil' },
  { id: 'comparativa', label: 'Comparativa', icon: GitCompare, ready: true, grp: 'Perfil' },
  { id: 'senales', label: 'Cambios relevantes', icon: Activity, ready: true, grp: 'Inteligencia' },
  { id: 'oportunidades', label: 'Oportunidades', icon: Zap, ready: true, grp: 'Inteligencia' },
  // HARDENING-037 · comite pasa a `ready:true` (cableado a InvestmentCommitteeBlock).
  { id: 'comite', label: 'Comité de inversión', icon: Scale, ready: true, grp: 'Inteligencia' },
  // HARDENING-037 · `sucesion` y `sector` retiradas del NAV. Absorbidas por
  // Oportunidades vía OpportunityThesisBlock (`sell` = sucesión, `buy` = roll-up).
  // El wiring completo (sell.*/buy.* con data real) queda en HARDENING-038b.
  { id: 'eventos', label: 'Eventos y BORME', icon: Bell, ready: true, grp: 'Fuentes' },
  { id: 'registros', label: 'Registros públicos', icon: FileText, ready: false, grp: 'Fuentes' },
  { id: 'documentos', label: 'Documentos', icon: Files, ready: false, grp: 'Fuentes' },
];

/* ============================ helpers ============================ */
const RED = '#FF5757', DARK = '#2a2724', N = '#9A9A93', N2 = '#E9E9E5', OK = '#1B9E5A', INFO = '#2563EB';

function fmtEUR(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toLocaleString('es-ES', { maximumFractionDigits: 1 })} M€`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toLocaleString('es-ES', { maximumFractionDigits: 0 })} k€`;
  return `${v.toLocaleString('es-ES')} €`;
}
/** Compact EUR con Intl (ej: 71,5 M €). B-1.5 · Item 5. */
function fmtEurCompact(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(v);
}
function fmtNum(v: number | null | undefined): string {
  return v === null || v === undefined ? '—' : v.toLocaleString('es-ES');
}
/** Márgenes/crecimiento llegan del motor como fracción (0,29 = 29%). */
function pctF(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  const n = Math.abs(v) <= 1.5 ? v * 100 : v;
  return `${n.toLocaleString('es-ES', { maximumFractionDigits: 1 })}%`;
}
function clamp100(v: number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = v <= 1 ? v * 100 : v;
  return Math.max(0, Math.min(100, n));
}
function fmtCell(value: number | null, format: string): string {
  if (value === null || value === undefined) return '—';
  if (format === 'percent') return `${value.toLocaleString('es-ES', { maximumFractionDigits: 1 })}%`;
  if (format === 'ratio' || format === 'multiple') return `${value.toLocaleString('es-ES', { maximumFractionDigits: 2 })}×`;
  if (format === 'currency') return fmtEUR(value);
  if (format === 'days') return `${value.toLocaleString('es-ES', { maximumFractionDigits: 0 })} días`;
  return value.toLocaleString('es-ES');
}
function fmtDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}
/* (helpers de escape/SVG-string retirados: los gráficos y anillos son React nativo) */

/* ---- Evolución financiera: SVG React con ejes numerados + tooltips ---- */
interface EvoSerie { label: string; data: (number | null)[]; unit: string; color: string; area?: boolean; }
function EvolutionChart({ series, years, masked }: { series: EvoSerie[]; years: string[]; masked?: boolean }) {
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  if (!series.length || !years.length) return null;
  const w = 680, h = 230, pl = 44, pr = 14, pt = 18, pb = 28, iw = w - pl - pr, ih = h - pt - pb;
  const nums = series.flatMap((s) => s.data.filter((v): v is number => v != null));
  const yMinRaw = nums.length ? Math.min(...nums) : 0;
  const yMaxRaw = nums.length ? Math.max(...nums) : 1;
  const range = yMaxRaw - yMinRaw;
  const pad = range === 0 ? (Math.abs(yMaxRaw) * 0.15 || 1) : range * 0.12;
  const yMin = yMinRaw - pad;
  const yMax = yMaxRaw + pad;
  const yRange = yMax - yMin || 1;
  const showZeroLine = yMinRaw < 0 && yMaxRaw > 0;
  const x = (i: number) => pl + iw * i / Math.max(1, years.length - 1);
  const y = (v: number) => pt + ih - ((v - yMin) / yRange) * ih;
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <style>{`@keyframes afDraw{to{stroke-dashoffset:0}}`}</style>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }} onMouseLeave={() => setTip(null)}>
        {[0, 1, 2, 3, 4].map((k) => {
          const yy = pt + ih * k / 4;
          const labelVal = yMax - (yRange * k / 4);
          const labelDecimals = Math.abs(yMax) < 10 || Math.abs(yMin) < 10 ? 1 : 0;
          return (
            <g key={k}>
              <line x1={pl} y1={yy} x2={w - pr} y2={yy} stroke={N2} />
              <text x={pl - 8} y={yy + 4} textAnchor="end" fontSize={10} fill={N}>
                {masked ? '•••' : labelVal.toLocaleString('es-ES', { maximumFractionDigits: labelDecimals })}
              </text>
            </g>
          );
        })}
        {showZeroLine && !masked && (
          <g>
            <line x1={pl} y1={y(0)} x2={w - pr} y2={y(0)} stroke="#8B8B8B" strokeWidth={1.2} />
            <text x={pl - 8} y={y(0) + 4} textAnchor="end" fontSize={10} fill="#4E4E48">0</text>
          </g>
        )}
        {years.map((l, i) => <text key={i} x={x(i)} y={h - 8} textAnchor="middle" fontSize={10.5} fill={N}>{l}</text>)}
        {series.map((s, si) => {
          const pts = s.data.map((v, i) => (v == null ? null : `${x(i)},${y(v)}`)).filter(Boolean).join(' ');
          return (
            <g key={si}>
              {s.area && !masked && (() => {
                const baselineY = y(Math.max(0, yMin));
                const firstX = pl;
                const lastX = w - pr;
                return <polygon points={`${firstX},${baselineY} ${pts} ${lastX},${baselineY}`} fill={s.color} opacity={0.08} />;
              })()}
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth={2.6} opacity={masked ? 0.35 : 1} pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: `afDraw 1s ease ${si * 0.15}s forwards` }} />
              {!masked && s.data.map((v, i) => v == null ? null : (
                <circle key={i} cx={x(i)} cy={y(v)} r={4} fill="#fff" stroke={s.color} strokeWidth={2}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setTip({ x: x(i) / w * 100, y: y(v) / h * 100, text: `${s.label} · ${years[i]}: ${v.toLocaleString('es-ES', { maximumFractionDigits: 2 })} ${s.unit}` })} />
              ))}
            </g>
          );
        })}
        {series.map((s, si) => {
          const lx = pl + si * 150;
          return <g key={`l${si}`}><circle cx={lx} cy={11} r={4} fill={s.color} /><text x={lx + 9} y={15} fontSize={10.5} fill="#4E4E48">{s.label}</text></g>;
        })}
      </svg>
      {tip && !masked && (
        <div style={{ position: 'absolute', left: `${tip.x}%`, top: `${tip.y}%`, transform: 'translate(-50%,-130%)', background: '#161412', color: '#fff', fontSize: 12, fontWeight: 600, padding: '7px 10px', borderRadius: 8, whiteSpace: 'nowrap', pointerEvents: 'none', boxShadow: '0 8px 24px rgba(20,18,16,.28)', zIndex: 5 }}>{tip.text}</div>
      )}
      {masked && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--n500)', fontSize: 13, fontWeight: 700 }}><Lock size={14} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 6 }} />Regístrate para ver las cifras</div>
      )}
    </div>
  );
}
function Ring({ val, label, color, tooltip }: { val: number; label: string; color: string; tooltip?: string }) {
  /**
   * HARDENING-021 · Fase 1 · Ring anima al aparecer en viewport (no al mount).
   * Respeta `prefers-reduced-motion`. Una única animación por elemento.
   */
  const r = 34, c = 2 * Math.PI * r;
  const [off, setOff] = React.useState(c);
  const [num, setNum] = React.useState(0);
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof window === 'undefined') return;
    const prefersReduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (prefersReduce) {
      setNum(Math.round(val));
      setOff(c * (1 - val / 100));
      return;
    }
    let started = false;
    let raf = 0;
    const observer: IntersectionObserver | null = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && !started) {
              started = true;
              const t0 = performance.now(), dur = 1150;
              const tick = (now: number) => {
                const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
                setOff(c * (1 - (val / 100) * e));
                setNum(Math.round(val * e));
                if (p < 1) raf = requestAnimationFrame(tick);
              };
              raf = requestAnimationFrame(tick);
              if (observer) observer.disconnect();
              break;
            }
          }
        }, { threshold: 0.1 })
      : null;
    if (observer) observer.observe(el);
    else {
      // Fallback SSR/legacy: mostrar valor final.
      setNum(Math.round(val));
      setOff(c * (1 - val / 100));
    }
    return () => {
      if (observer) observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [val, c]);
  return (
    <div className="aring" ref={wrapRef}>
      <div className="lbl">
        {tooltip
          ? <span className="help" data-tip={tooltip} tabIndex={0}>{label}</span>
          : label}
      </div>
      <svg width={92} height={92} viewBox="0 0 92 92">
        <circle cx={46} cy={46} r={r} fill="none" stroke={N2} strokeWidth={8} />
        <circle cx={46} cy={46} r={r} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 46 46)"
          style={{ transition: 'stroke-dashoffset .1s linear' }} />
        <text x={46} y={52} textAnchor="middle" fontSize={22} fontWeight={750} fill="#161412">{num}</text>
      </svg>
    </div>
  );
}
/**
 * HARDENING-021 · Fase 1 · Componente para el "Percentil grande" de Rankings.
 * Anima el número de 0 → value al entrar en viewport (con `useCountUp`).
 * Si `value` es null → renderiza guión (R15).
 */
function PercentileValue({ value }: { value: number | null | undefined }) {
  const { ref, display } = useCountUp<HTMLSpanElement>(
    typeof value === 'number' ? value : null,
    { duration: 900, format: (n) => `${Math.round(n)}º` },
  );
  if (value == null) return <b style={{ fontSize: 22 }}>—</b>;
  return <b ref={ref} style={{ fontSize: 22 }}>{display}</b>;
}
/**
 * HARDENING-021 · Fase 1 · Barra `.owbar .obt i` de la lista de Distribución
 * (Propiedad). Anima `width` de 0 → pct al aparecer en viewport (transición
 * CSS `.9s cubic-bezier(.3,.7,.3,1)` ya definida en fichaMockupCss.ts).
 */
function OwnBar({ pct }: { pct: number }) {
  const ref = useBarFill<HTMLElement>(pct);
  return <i ref={ref} data-w={String(pct)} />;
}
/**
 * HARDENING-021 · Fase 1 · Wrapper de reveal para cards que se benefician
 * de una entrada al scrollear (Fase 3 · MethodDetails, "¿Por qué este valor?",
 * etc.). Aplica `useRevealOnScroll` con mesura: `once: true`, respeta
 * `prefers-reduced-motion`, opacidad 0 → 1 con `translateY(10px)` inicial.
 * Un solo trigger por elemento — no re-anima en scroll de vuelta.
 */
function RevealCard({ children, style, className, testid }: { children: React.ReactNode; style?: React.CSSProperties; className?: string; testid?: string }) {
  const ref = useRevealOnScroll<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={className}
      style={{ opacity: 0, transform: 'translateY(10px)', ...style }}
      data-testid={testid}
    >
      {children}
    </div>
  );
}

/** CTA de registro (mixed-access): el visitante anónimo ve esto en lugar de las cifras. */
function Gate({ what }: { what: string }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '34px 22px' }}>
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}><Lock size={22} strokeWidth={2} color="var(--n500)" /></div>
      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--n900)' }}>Regístrate para ver {what}</div>
      <div className="cs" style={{ marginTop: 6, marginBottom: 16 }}>Accede al análisis financiero, la valoración y los compradores</div>
      <a href="/es/login" className="btn primary" style={{ display: 'inline-flex' }}>Registrarse o entrar</a>
    </div>
  );
}

/** Componente vacío estándar: dato que el motor aún no proporciona. */
function Pending({ label }: { label?: string }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
      <div style={{ fontSize: 20, opacity: 0.45, marginBottom: 6 }}>◔</div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--n700)' }}>Información en preparación{label ? ` · ${label}` : ''}</div>
      <div className="cs" style={{ marginTop: 4, marginBottom: 0 }}>Estamos consolidando este apartado.</div>
    </div>
  );
}

/** Alias semántico de Pending: respuesta 200 del backend sin dato para el apartado. */
const Empty = Pending;

/** Estado de error de sección: fallo de red / 4xx-5xx al cargar el apartado. */
function SectionError() {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--n700)' }}>No hemos podido cargar este apartado</div>
      <div className="cs" style={{ marginTop: 4, marginBottom: 0 }}>Vuelve a intentarlo en unos minutos.</div>
    </div>
  );
}

/** Estado de carga estándar: shimmer neutro con la misma tarjeta que Empty/SectionError. */
function Skeleton() {
  return (
    <div className="card" style={{ padding: '28px 20px' }}>
      <style>{`@keyframes afkShimmer{0%{background-position:-200px 0}100%{background-position:calc(200px + 100%) 0}}.afkSkeleton{display:block;border-radius:6px;background:linear-gradient(90deg,var(--n200) 0%,var(--n100) 40%,var(--n200) 80%);background-size:200px 100%;background-repeat:no-repeat;animation:afkShimmer 1.4s ease-in-out infinite}`}</style>
      <div className="afkSkeleton" style={{ height: 14, width: '55%', marginBottom: 12 }} />
      <div className="afkSkeleton" style={{ height: 10, width: '80%', marginBottom: 8 }} />
      <div className="afkSkeleton" style={{ height: 10, width: '70%' }} />
    </div>
  );
}

/* HARDENING-022c · Componente `TrendPill` (B-1.5 Item 5 legacy) retirado
   junto con el grid de 4 KPIs 2ª fila del Resumen. La tendencia global vive
   ahora implícita en la evolución T7 y en la Tesis de oportunidad T4. */

/**
 * HARDENING-022 · Sparkline SVG minimalista para KPIs (T2 Resumen).
 * · Consume `points[]` (2-5 valores). Requiere al menos 2 puntos válidos.
 * · Cero ejes. Cero labels. Cero animación si `prefers-reduced-motion`.
 * · Si menos de 2 puntos → no renderiza nada (R15).
 * · Color pasado como prop (verde/rojo según YoY, gris si neutro).
 */
function Sparkline({ points, color = 'var(--n400)', width = 60, height = 20 }: {
  points: Array<number | null | undefined>;
  color?: string;
  width?: number;
  height?: number;
}) {
  const clean = points.filter((v): v is number => typeof v === 'number' && isFinite(v));
  if (clean.length < 2) return null;
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const range = max - min || 1;
  const stepX = width / (clean.length - 1);
  const d = clean
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * (height - 2) - 1;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * HARDENING-022 · T2 · KPI card con sparkline + YoY. Passthrough puro R15:
 * · `value` null → renderiza "—" en gris.
 * · `deltaPct` null → no renderiza flecha.
 * · `points` null/<2 → no renderiza sparkline.
 * · `invertColor` = true (para DN/EBITDA): ▲ rojo (peor), ▼ verde (mejor).
 */
function KpiCard({
  label,
  tooltip,
  value,
  valueFormatter,
  deltaPct,
  points,
  invertColor = false,
  emptyReason,
  testid,
  srcDot,
}: {
  label: string;
  tooltip?: string;
  value: number | null | undefined;
  valueFormatter: (v: number) => string;
  deltaPct?: number | null | undefined;
  points?: Array<number | null | undefined> | null;
  invertColor?: boolean;
  emptyReason?: string;
  testid?: string;
  srcDot?: React.ReactNode;
}) {
  const hasValue = typeof value === 'number' && isFinite(value);
  const isUp = typeof deltaPct === 'number' && deltaPct > 0;
  const isDown = typeof deltaPct === 'number' && deltaPct < 0;
  const positive = invertColor ? isDown : isUp;
  const negative = invertColor ? isUp : isDown;
  const arrowColor = positive ? 'var(--ok)' : negative ? 'var(--red-hover)' : 'var(--n400)';
  return (
    <div className="kpi" data-testid={testid}>
      <div className="l" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {srcDot}
        {tooltip
          ? <span className="help" data-tip={tooltip} tabIndex={0}>{label}</span>
          : <span>{label}</span>}
      </div>
      {hasValue ? (
        <>
          <div className="v" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span>{valueFormatter(value!)}</span>
            {points && points.length >= 2 && (
              <Sparkline points={points} color={arrowColor} />
            )}
          </div>
          {typeof deltaPct === 'number' && (
            <div className={`d ${positive ? 'up' : negative ? 'down' : 'inf'}`}>
              {positive ? '▲' : negative ? '▼' : '●'} {Math.abs(deltaPct * 100).toLocaleString('es-ES', { maximumFractionDigits: 1 })}% interanual
            </div>
          )}
        </>
      ) : (
        <div className="v" style={{ color: 'var(--n400)', fontSize: 16, fontWeight: 600 }}>
          — <small style={{ fontSize: 11, color: 'var(--n400)', fontWeight: 500, marginLeft: 4 }}>{emptyReason ?? 'sin dato'}</small>
        </div>
      )}
    </div>
  );
}

/** Hero + card "Veredicto de ARROBA" — bloque de portada del Resumen (compartido anon/auth).
 *  Cascada de descripción: `identity.description` → `identity.objeto_social` → `financialAnalysis.identity.description` → `financialAnalysis.identity.objeto_social` → <Empty/>.
 *  El fallback a `financialAnalysis.identity` resuelve la descoordinación Intel I-1 en la que `/section/identity` aún devuelve null pero `/financial-analysis` sí puebla el dato. */

/* ============================ RESUMEN ============================ */
/**
 * HARDENING-022 · Redistribución completa (2026-08-13). Orden estricto:
 *   T2 KPIs (4 nuevos + sparklines + YoY)
 *   T3 Resumen de compañía (prosa · card oscura + disclaimer condicional)
 *   T4 Tesis de oportunidad (rename Veredicto · card destacada)
 *   T5 Detalles de la compañía (rename Identificación + Resultado neto + Empleados)
 *   T6 Diagnóstico de ARROBA (scores sin marco azul)
 *   T7 Evolución financiera (al final)
 *
 * T1 (Cabecera) NO vive dentro de Resumen · vive en `chead` top-level (aplica
 * a todas las pestañas). Ver componente `CompanyFichaLayoutV2` raíz.
 */
function Resumen(p: CompanyFichaLayoutV2Props & { anon?: boolean }) {
  const { identity, financial, financialAnalysis, semantic, signal, buyers } = p;
  const cls = identity.classification, loc = identity.location, sz = identity.size;
  const k = financialAnalysis?.kpis ?? null;

  // Hooks SIEMPRE antes de cualquier return condicional (react-hooks/rules-of-hooks).
  const evo = financial?.evolution;
  const evoSeries: EvoSerie[] = useMemo(() => {
    if (!evo) return [];
    return evo.series.slice(0, 2).map((s, i) => ({
      label: s.format === 'currency' ? `${s.label} (M€)` : s.label,
      unit: s.format === 'currency' ? 'M€' : s.format === 'percent' ? '%' : '',
      data: s.values.map((v) => (v == null ? null : s.format === 'currency' ? v / 1_000_000 : v)),
      color: i === 0 ? RED : DARK, area: i === 0,
    }));
  }, [evo]);
  const hasChart = evo != null && evoSeries.length > 0;
  // HARDENING-037 · Cuando evolution tiene un solo ejercicio, `EvolutionChart`
  // (multi-año) no aporta lectura. Renderizamos `SingleExerciseChart` como
  // visualización complementaria con los datos del único año disponible.
  const singleExercise = useMemo(
    () => (evo && evo.years.length === 1
      ? singleExerciseFromEvolution({
          years: evo.years,
          series: evo.series.map((s) => ({ key: s.key, values: s.values })),
        })
      : null),
    [evo],
  );

  // HARDENING-022 · T2 · Series históricas para sparklines (2-5 puntos).
  // `finances.evolution.points[]` ordenados año descendente por Intel; los
  // invertimos para renderizar cronológicamente (izq→der).
  const evoPoints = useMemo(() => {
    const anyEvo = (financialAnalysis?.evolution as unknown as { points?: Array<Record<string, unknown>> } | null) ?? null;
    const pts = Array.isArray(anyEvo?.points) ? [...(anyEvo!.points as Array<Record<string, unknown>>)] : [];
    // Orden cronológico ascendente (año más antiguo → más reciente).
    pts.sort((a, b) => (Number(a['year']) || 0) - (Number(b['year']) || 0));
    return pts;
  }, [financialAnalysis?.evolution]);
  const revenuePoints = useMemo(() => evoPoints.map((p) => p['revenue'] as number | null | undefined), [evoPoints]);
  const ebitdaPoints = useMemo(() => evoPoints.map((p) => p['ebitda'] as number | null | undefined), [evoPoints]);
  // DN/EBITDA histórico: Intel no emite (verificado Fase 0 Servier). Sparkline ausente.
  const dnEbitdaPoints: Array<number | null | undefined> = [];
  // Activos totales: no en `points[]` · Intel no emite serie. Sparkline ausente.
  const totalAssetsPoints: Array<number | null | undefined> = [];

  // HARDENING-030c · Gráfico de UN ejercicio con fuente en cascada: (1) el
  // `financialSection` legacy si trae exactamente 1 año; (2) en su defecto, el
  // ÚNICO punto del agregador `finances.evolution.points[]` (misma fuente que
  // KPIs/sparklines). Cubre empresas cuyo único año solo vive en el agregador
  // (antes caían a «Información en preparación»). Sin síntesis (R15).
  // Fuente = pipeline financiero real (Iberinform → norm_financials → evolution.points).
  // El único ejercicio lo emite Intel `compute_evolution` (fix 2026-08-17). NO se
  // fabrica desde los KPIs de cabecera. Sin punto → Pending honesto (R15).
  const single = useMemo(
    () => resolveSingleExerciseCascade(singleExercise, evoPoints, financial?.profit_loss ?? null),
    [singleExercise, evoPoints, financial?.profit_loss],
  );
  const showSingleExercise = single != null && single.year != null;

  // HARDENING-022 · T3 · Descripción prosa + flag de origen (cascada canon CF).
  const descriptionText =
    identity.description
    || identity.objeto_social
    || financialAnalysis?.identity?.description
    || financialAnalysis?.identity?.objeto_social
    || null;
  const descriptionSource = identity.description_source ?? null;
  const showDisclaimer = descriptionSource === 'ai' || descriptionSource === 'web';

  // HARDENING-022d (2026-08-13) · T4 · Tesis de oportunidad.
  // Fuente preferida: Intel emite `opportunity.thesis.narrative` (bloque
  // `opportunity` de `/ficha`). Fallback R15-compliant a `finances.assessment.verdict`
  // (otro campo REAL, no fabricación): restaurado tras confirmar que Prod y
  // Dev pods pueden ir desincronizados en el rollout Intel. Cascada:
  //     opportunity.thesis.narrative → finances.assessment.verdict → null.
  const thesisNarrative = p.opportunity?.thesis?.narrative;
  const verdictRaw = financialAnalysis?.assessment?.verdict;
  const thesisText: string | null = (
    (typeof thesisNarrative === 'string' && thesisNarrative.trim().length > 0)
      ? thesisNarrative.trim()
      : (typeof verdictRaw === 'string' && verdictRaw.trim().length > 0)
        ? verdictRaw.trim()
        : null
  );

  // ─────────────────────────────────────────────────────────────────────────
  // T2 · KPI DN/EBITDA · 4 estados (HARDENING-023 · HARDENING-025 Item 4)
  //
  // Lógica extraída a `@/lib/companies/dn-ebitda` para cobertura unitaria.
  // Ver `dn-ebitda.test.ts` (13 tests) para todos los estados y regresiones.
  // ─────────────────────────────────────────────────────────────────────────
  const dnEbitdaState: DnEbitdaState = computeDnEbitdaState(
    financialAnalysis?.kpis as unknown as Record<string, unknown> | null,
    financialAnalysis?.balance_sheet as unknown as Record<string, unknown> | null,
  );

  // T2 · Activos totales · passthrough puro desde balance_sheet.
  const totalAssets: number | null = (() => {
    const bs = financialAnalysis?.balance_sheet as unknown as Record<string, unknown> | null;
    const v = bs?.['total_assets'];
    return (typeof v === 'number' && isFinite(v)) ? v : null;
  })();

  // T2 · KPI Patrimonio Neto (Daniel, 2026-08-30) · sustituye a DN/EBITDA.
  // DN/EBITDA dependía de `financial_debt`, un dato que la mayoría de empresas
  // no declara por separado (cuentas abreviadas). `equity` (patrimonio neto)
  // es una partida obligatoria del balance y casi siempre está disponible.
  // Passthrough puro desde `financialAnalysis.kpis.equity` — sin cascada,
  // sin fabricación (R15): si Intel no lo trae, honestamente "sin dato".
  const equity: number | null = (() => {
    const v = (financialAnalysis?.kpis as unknown as Record<string, unknown> | null)?.['equity'];
    return (typeof v === 'number' && isFinite(v)) ? v : null;
  })();

  if (p.anon) {
    // Vista anónima simplificada: descripción pública + Gate + Detalles registrales.
    return (
      <section className="panel on">
        {/* T3 · Resumen de compañía (público, sin cifras). */}
        <ResumenProsaCard
          text={descriptionText}
          showDisclaimer={showDisclaimer}
        />
        <div style={{ marginTop: 16 }}><Gate what="el análisis financiero, la valoración y los compradores" /></div>
        {/* T5 · Detalles de la compañía (rename anon). */}
        <div className="card" style={{ marginTop: 16 }} data-testid="detalles-compania-anon">
          <h3><span className="k" />Detalles de la compañía</h3>
          <div className="cs">Datos registrales y de registros públicos</div>
          <div className="idrow"><span className="k">Razón social</span><span className="v">{identity.legal_name ?? '—'}</span></div>
          <div className="idrow"><span className="k">CIF</span><span className="v">{identity.cif_normalized ?? '—'}</span></div>
          <div className="idrow"><span className="k">CNAE</span><span className="v">{cls.cnae_code ? `${cls.cnae_code} · ${cls.cnae_description ?? ''}` : '—'}</span></div>
          <div className="idrow"><span className="k">Domicilio</span><span className="v">{[loc.municipio, loc.provincia].filter(Boolean).join(' · ') || '—'}</span></div>
        </div>
        {/* HARDENING-022c · Retirado `<IdentidadAmpliada>` (34 campos) tanto en
            anon como en auth. Toda la identidad registral relevante vive ya en
            "Detalles de la compañía" (T5). Anti-duplicidad. */}
      </section>
    );
  }

  const quality = clamp100(financialAnalysis?.financial_quality?.score ?? null);
  const opp = clamp100(signal?.score?.signal_score ?? null);
  const topFit = clamp100(buyers?.recommendations?.[0]?.score ?? null);
  const rings: { v: number; label: string; color: string; tooltip?: string }[] = [];
  if (quality != null) rings.push({ v: quality, label: 'Calidad', color: OK, tooltip: 'QUALITY_SCORE' });
  if (topFit != null) rings.push({ v: topFit, label: 'Encaje comprador', color: RED, tooltip: 'BUYER_FIT_SCORE' });
  if (opp != null) rings.push({ v: opp, label: 'Oportunidad', color: INFO, tooltip: 'OPPORTUNITY_SCORE' });

  return (
    <section className="panel on">
      {/* ═══════════════════════ T2 · KPIs (4 principales) ═══════════════════════ */}
      {k ? (
        <div className="kgrid" data-testid="t2-kpis-grid">
          <KpiCard
            label="Facturación"
            tooltip="FACTURACION"
            value={k.revenue ?? null}
            valueFormatter={fmtEUR}
            deltaPct={k.revenue_growth_yoy ?? null}
            points={revenuePoints}
            testid="kpi-facturacion"
            srcDot={<SrcDot type={provenanceFor(financialAnalysis?.provenance, 'kpis', 'revenue') as ProvenanceValue | null} />}
          />
          <KpiCard
            label="EBITDA"
            tooltip="EBITDA"
            value={k.ebitda ?? null}
            valueFormatter={fmtEUR}
            deltaPct={k.ebitda_growth_yoy ?? null}
            points={ebitdaPoints}
            testid="kpi-ebitda"
            srcDot={<SrcDot type={provenanceFor(financialAnalysis?.provenance, 'kpis', 'ebitda') as ProvenanceValue | null} />}
          />
          <KpiCard
            label="Patrimonio Neto"
            tooltip="PATRIMONIO_NETO"
            value={equity}
            valueFormatter={fmtEUR}
            testid="kpi-patrimonio-neto"
            srcDot={<SrcDot type={provenanceFor(financialAnalysis?.provenance, 'kpis', 'equity') as ProvenanceValue | null} />}
          />
          <KpiCard
            label="Activos totales"
            tooltip="ACTIVOS_TOTALES"
            value={totalAssets}
            valueFormatter={fmtEUR}
            points={totalAssetsPoints}
            testid="kpi-activos-totales"
            srcDot={<SrcDot type={provenanceFor(financialAnalysis?.provenance, 'balance_sheet', 'total_assets') as ProvenanceValue | null} />}
          />
        </div>
      ) : <Pending label="Indicadores financieros" />}

      {/* ═══════════════════════ T3 · Resumen de compañía (prosa) ═══════════════════════ */}
      <div style={{ marginTop: 18 }}>
        <ResumenProsaCard text={descriptionText} showDisclaimer={showDisclaimer} />
      </div>

      {/* ═══════════════════════ T4 · Tesis de oportunidad (rename destacada) ═══════════════════════ */}
      <TesisOportunidadCard text={thesisText} />

      {/* ═══════════════════════ T5 · Detalles de la compañía (rename + campos movidos) ═══════════════════════ */}
      <div className="card" style={{ marginTop: 18 }} data-testid="detalles-compania">
        <h3><span className="k" />Detalles de la compañía</h3>
        <div className="cs">Datos registrales y de registros públicos</div>
        <div className="idrow"><span className="k">Razón social</span><span className="v">{identity.legal_name ?? '—'}</span></div>
        <div className="idrow"><span className="k">CIF</span><span className="v">{identity.cif_normalized ?? '—'}</span></div>
        {identity.registry_status?.legal_form && <div className="idrow"><span className="k">Forma jurídica</span><span className="v">{identity.registry_status.legal_form}</span></div>}
        <div className="idrow"><span className="k">CNAE</span><span className="v">{cls.cnae_code ? `${cls.cnae_code} · ${cls.cnae_description ?? ''}` : '—'}</span></div>
        <div className="idrow"><span className="k">Domicilio</span><span className="v">{[loc.municipio, loc.provincia].filter(Boolean).join(' · ') || '—'}</span></div>
        <div className="idrow"><span className="k">Capital social</span><span className="v">{fmtEUR(sz.capital_social)}</span></div>
        {identity.contact.web && <div className="idrow"><span className="k">Web</span><span className="v">{identity.contact.web}</span></div>}
        {/* Movidos del hero: Resultado neto + Empleados (canon CF: bajan de jerarquía). */}
        {k?.net_income != null && (
          <div className="idrow" data-testid="detalles-net-income">
            <span className="k">
              <SrcDot type={provenanceFor(financialAnalysis?.provenance, 'kpis', 'net_income') as ProvenanceValue | null} />
              <span className="help" data-tip="RESULTADO_NETO" tabIndex={0} style={{ marginLeft: 4 }}>Resultado neto</span>
            </span>
            <span className="v">{fmtEUR(k.net_income)}{k.net_margin != null && <small style={{ color: 'var(--n500)', fontWeight: 500, marginLeft: 6 }}>margen {pctF(k.net_margin)}</small>}</span>
          </div>
        )}
        {sz.employees_total != null && (
          <div className="idrow" data-testid="detalles-employees">
            <span className="k">Empleados</span>
            <span className="v">{fmtNum(sz.employees_total)}</span>
          </div>
        )}
        {/* Fase 0 (2026-09-01) · 3 campos Iberinform que ya baja `adaptIdentityFromFicha`
            (audited/balance_model/last_balance_year). Passthrough puro (R15): solo se
            renderiza la fila si Intel provee valor; nada se fabrica. */}
        {identity.audited && (
          <div className="idrow" data-testid="detalles-audited">
            <span className="k">Cuentas auditadas</span>
            <span className="v">{identity.audited}</span>
          </div>
        )}
        {identity.balance_model && (
          <div className="idrow" data-testid="detalles-balance-model">
            <span className="k">Modelo de balance</span>
            <span className="v">{identity.balance_model}</span>
          </div>
        )}
        {identity.last_balance_year && (
          <div className="idrow" data-testid="detalles-last-balance-year">
            <span className="k">Último ejercicio depositado</span>
            <span className="v">{identity.last_balance_year}</span>
          </div>
        )}
      </div>

      {/* HARDENING-022c · Retirado `<IdentidadAmpliada>` (34 campos legacy).
          Todos los campos registrales relevantes ya viven en el card
          "Detalles de la compañía" (T5) arriba. Anti-duplicidad UI. */}

      {/* HARDENING-022c · Retirado grid con 4 KPIs 2ª fila (CAGR, Fondos
          propios, Tendencia global, Percentil por ingresos). Su información
          vive en Finanzas / Rankings / Tesis. Anti-duplicidad UI R15. */}

      {/* HARDENING-022c · Retirado card "Lectura de posicionamiento".
          `opportunity.thesis.narrative` (T4) ya absorbe esa lectura combinada. */}

      {/* ═══════════════════════ T6 · Diagnóstico de ARROBA (sin card wrapper) ═══════════════════════ */}
      {/* HARDENING-022c · Retirado el `<div className="card">` wrapper que
          creaba el marco perimetral. Los anillos (`Ring`) mantienen su borde
          individual `.ring` del mockup. Título en el flujo abierto. */}
      <div style={{ marginTop: 18 }} data-testid="diagnostico-arroba">
        {rings.length > 0 ? (
          <>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--n900)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ width: 3, height: 15, background: 'var(--red)', borderRadius: 2 }} />
              Diagnóstico de ARROBA
            </h3>
            <div className="scores" style={{ gridTemplateColumns: `repeat(${rings.length},1fr)` }}>
              {rings.map((r) => (
                <Ring
                  key={r.label}
                  val={r.v}
                  label={r.label}
                  color={r.color}
                  tooltip={r.tooltip}
                />
              ))}
            </div>
          </>
        ) : <Pending label="Diagnóstico de ARROBA" />}
      </div>

      {/* ═══════════════════════ T7 · Evolución financiera (al final) ═══════════════════════ */}
      <div style={{ marginTop: 18 }}>
        {hasChart ? (
          <div className="card" data-testid="evolucion-financiera">
            <h3><span className="k" />Evolución financiera</h3>
            <div className="cs">Facturación y <span className="help" data-tip="EBITDA" tabIndex={0}>EBITDA</span> · {evo!.years[0]}–{evo!.years[evo!.years.length - 1]}</div>
            <EvolutionChart series={evoSeries} years={evo!.years.map(String)} />
          </div>
        ) : showSingleExercise ? (
          // HARDENING-037/030c · single exercise chart cuando no hay serie temporal
          // (sólo 1 año). Fuente en cascada: financialSection legacy o el único
          // punto del agregador. No fabricamos evolución sintética (R15).
          <div className="card" data-testid="resumen-single-exercise-chart">
            <SingleExerciseChart
              year={single!.year}
              revenue={single!.revenue}
              ebitda={single!.ebitda}
              ebitdaMargin={single!.ebitdaMargin}
            />
          </div>
        ) : <Pending label="Evolución financiera" />}
      </div>
    </section>
  );
}

/**
 * HARDENING-022 · T3 · Card de prosa con estilo oscuro + disclaimer condicional.
 * · Card oscura tipo `.ctadark` (gradiente `#1c1a18 → #34302b`).
 * · Disclaimer sólo si `description_source === 'ai' | 'web'`. R15 estricto.
 * · Sin texto → `<Empty label="Descripción de la compañía"/>`.
 */
function ResumenProsaCard({ text, showDisclaimer }: { text: string | null; showDisclaimer: boolean }) {
  if (!text || !text.trim()) return <Empty label="Descripción de la compañía" />;
  return (
    <div
      data-testid="resumen-prosa-card"
      style={{
        background: 'linear-gradient(135deg, #1c1a18, #34302b)',
        color: '#EDEBE8',
        borderRadius: 12,
        padding: '22px 24px',
        boxShadow: '0 1px 2px rgba(20,18,16,.04),0 6px 20px rgba(20,18,16,.05)',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9C948C', marginBottom: 10 }}>
        Resumen de compañía
      </div>
      <p style={{ fontSize: 14.5, lineHeight: 1.65, color: '#DED9D3', margin: 0 }}>{text.trim()}</p>
      {showDisclaimer && (
        <div
          data-testid="resumen-prosa-disclaimer"
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            fontSize: 11.5,
            color: '#9C948C',
            fontStyle: 'italic',
            lineHeight: 1.55,
          }}
        >
          Descripción generada/recopilada por IA a partir de fuentes públicas; puede contener imprecisiones sobre personas, lugares, hechos o cifras. Tómala como orientativa.
        </div>
      )}
    </div>
  );
}

/**
 * HARDENING-022 (d · 2026-08-13) · T4 · Tesis de oportunidad.
 * · Card destacada con acento rojo (borde-izq rojo + fondo rosa muy suave).
 * · Fuente preferida: `opportunity.thesis.narrative` (bloque `opportunity` de `/ficha`).
 *   Fallback R15-compliant: `finances.assessment.verdict` (otro campo real Intel).
 *   Sub-card "Contexto sectorial" retirado en 022c (la prosa Intel ya lo combina).
 * · Si NI narrative NI verdict → Empty honesto "En preparación".
 * · CTA "Explorar oportunidad" (link a la pestaña Oportunidades cuando exista).
 */
function TesisOportunidadCard({ text }: { text: string | null }) {
  return (
    <div
      className="card"
      data-testid="tesis-oportunidad-card"
      style={{
        marginTop: 18,
        borderLeft: '3px solid var(--red)',
        background: 'linear-gradient(180deg, var(--red-tint), var(--n0))',
        borderColor: 'var(--red-tint2)',
      }}
    >
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="k" />
        Tesis de oportunidad
        <Sparkles size={13} style={{ color: 'var(--red-hover)', marginLeft: 4 }} />
      </h3>
      <div className="cs">Por qué esta compañía puede constituir una oportunidad</div>
      {text ? (
        <p
          data-testid="tesis-oportunidad-text"
          style={{ margin: 0, fontSize: 14.5, lineHeight: 1.65, color: 'var(--n800)' }}
        >
          {text}
        </p>
      ) : (
        <div data-testid="tesis-oportunidad-empty">
          <Empty label="Tesis de oportunidad" />
        </div>
      )}
      {/* HARDENING-022c · Retirado sub-card `SectorSignalWidget`. La prosa
          `opportunity.thesis.narrative` ya combina sector + posicionamiento +
          veredicto. Sin sub-cards, sin enums crudos. R15 estricto. */}
      <div style={{ marginTop: 14 }}>
        <button
          className="btn primary"
          data-testid="tesis-oportunidad-cta"
          onClick={() => notify({ kind: 'info', text: 'Exploración de oportunidad disponible próximamente.' })}
          style={{ fontSize: 13, fontWeight: 700 }}
        >
          Explorar oportunidad
        </button>
      </div>
    </div>
  );
}

/* ============================ ESTRUCTURA DE DEUDA ============================ */
/**
 * Item 6.b · Estructura de deuda (2026-08-11).
 * Consume `financialAnalysis.balance_sheet.{st_debt, lt_debt, financial_debt}`
 * (shape plano · un único año · confirmado en Fase 0 sobre Servier).
 * R15 estricto: NO calculamos `financial_debt = st_debt + lt_debt` en frontend;
 * si Intel no entrega el agregado, `<Empty/>` local en esa fila.
 * Gating: incluida dentro del tab Balance (bloque Finanzas, ya gated en anon).
 */
function DebtBreakdownCard({ balance, year }: { balance: FinancialAnalysisBalanceSheet | null; year: number | null }) {
  const st = balance?.st_debt ?? null;
  const lt = balance?.lt_debt ?? null;
  const fin = balance?.financial_debt ?? null;
  const allNull = st == null && lt == null && fin == null;
  return (
    <div className="card" style={{ marginTop: 16 }} data-testid="debt-breakdown-card">
      <h3><span className="k" />Estructura de deuda</h3>
      <div className="cs">Deuda por horizonte temporal · fuente: cuentas depositadas{year != null ? ` · ejercicio ${year}` : ''}</div>
      {allNull ? (
        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--n500)', fontSize: 13 }}>Desglose de deuda en preparación</div>
      ) : (
        <table className="rec" data-testid="debt-breakdown-table">
          <tbody>
            <tr><th>Concepto</th><th style={{ textAlign: 'right' }}>{year ?? 'Último ejercicio'}</th></tr>
            <tr data-testid={`debt-breakdown-st-${year ?? 'na'}`}>
              <td>Deuda a corto plazo</td>
              <td style={{ textAlign: 'right' }}>{st != null ? fmtEUR(st) : <span style={{ color: 'var(--n400)', fontStyle: 'italic' }}>En preparación</span>}</td>
            </tr>
            <tr data-testid={`debt-breakdown-lt-${year ?? 'na'}`}>
              <td>Deuda a largo plazo</td>
              <td style={{ textAlign: 'right' }}>{lt != null ? fmtEUR(lt) : <span style={{ color: 'var(--n400)', fontStyle: 'italic' }}>En preparación</span>}</td>
            </tr>
            <tr data-testid={`debt-breakdown-financial-${year ?? 'na'}`}>
              <td><b>Deuda financiera total</b></td>
              <td style={{ textAlign: 'right' }}><b>{fin != null ? fmtEUR(fin) : <span style={{ color: 'var(--n400)', fontStyle: 'italic', fontWeight: 400 }}>En preparación</span>}</b></td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ============================ FINANZAS ============================ */
const RLEVEL: Record<string, number> = { total: 1, subtotal: 2, line: 2, derived: 3 };
function filterRows(b: FinancialTableBlock, lvl: number): FinancialTableBlock {
  return { years: b.years, rows: b.rows.filter((r) => (RLEVEL[r.category] ?? 3) <= lvl) };
}
function FinTable({ block }: { block: FinancialTableBlock }) {
  return (
    <table className="rec">
      <tbody>
        <tr><th>Concepto</th>{block.years.map((y) => <th key={y} style={{ textAlign: 'right' }}>{y}</th>)}</tr>
        {block.rows.map((row) => {
          const strong = row.category === 'total' || row.category === 'subtotal';
          return (
            <tr key={row.key}>
              <td>{strong ? <b>{row.label}</b> : row.label}</td>
              {row.values.map((c, i) => (
                <td key={i} style={{ textAlign: 'right' }} className={c.semantic === 'positive' ? 'up' : c.semantic === 'negative' ? 'down' : undefined}>
                  {strong ? <b>{fmtCell(c.value, c.format)}</b> : fmtCell(c.value, c.format)}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ============================ CASH FLOW ============================ */
/**
 * B-2.5 · Estado de flujos de efectivo.
 * Passthrough puro desde `analysis.cash_flow` (Intel · `analyze.statements.cash_flow`).
 * R15: sin cálculos de subtotales en frontend; solo pintamos las 6 filas que llegan.
 * Los `values[i]` alinean 1:1 con `years[i]`. Los signos (Capex/financing negativos)
 * se preservan tal como los emite Intel; `fmtCell` los renderiza con separador `es-ES`.
 *
 * HARDENING-019 · Fase B canon CF (2026-08-13): el enum local `CF_CATEGORY_LABEL`
 * se retiró en el mismo commit; los labels ES vienen de `cf.category_labels_es`
 * (Intel `analyze.statements.cash_flow.category_labels_es`). El orden por
 * categoría se preserva como convención estable (`operating → investing →
 * financing → net_change → summary`); nuevas categorías Intel se apilan al final.
 */
const CF_CATEGORY_ORDER: readonly string[] = ['operating', 'investing', 'financing', 'net_change', 'summary'];
function CashFlowTable({ cf }: { cf: CashFlowStatement }) {
  const groups = useMemo(() => {
    const map = new Map<string, CashFlowRow[]>();
    for (const row of cf.rows) {
      const cat = String(row.category);
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(row);
    }
    const ordered = [...CF_CATEGORY_ORDER.filter((c) => map.has(c)), ...Array.from(map.keys()).filter((c) => !CF_CATEGORY_ORDER.includes(c))];
    const catLabels = cf.category_labels_es ?? null;
    return ordered.map((cat) => ({
      cat,
      label: catLabels?.[cat] ?? cat,
      rows: map.get(cat)!,
    }));
  }, [cf]);
  const colCount = cf.years.length + 1;
  return (
    <table className="rec" data-testid="cashflow-table">
      <tbody>
        <tr><th>Concepto</th>{cf.years.map((y) => <th key={y} style={{ textAlign: 'right' }}>{y}</th>)}</tr>
        {groups.map(({ cat, label, rows }) => (
          <Fragment key={cat}>
            <tr className="subhead"><td colSpan={colCount} style={{ paddingTop: 8, opacity: 0.72, fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</td></tr>
            {rows.map((row) => {
              const strong = row.category === 'net_change';
              return (
                <tr key={row.key} data-testid={`cashflow-row-${row.key}`}>
                  <td>{strong ? <b>{row.label}</b> : row.label}</td>
                  {cf.years.map((_, i) => {
                    const cell = row.values[i];
                    let value = cell?.value ?? null;
                    const format = cell?.format ?? 'currency';
                    // BRIDGING FALLBACK · INTEL_PAYLOAD_INCOHERENCIAS.md caso 3
                    // Intel entrega cash_conversion con format="percent" pero value en base 1 (ratio).
                    // El resto de porcentajes del payload ya vienen en base 100.
                    // Este puente se retira cuando Intel armonice el contrato (opción a o b del documento de incoherencias).
                    if (
                      row.key === 'cash_conversion' &&
                      format === 'percent' &&
                      typeof value === 'number' &&
                      Math.abs(value) <= 1
                    ) {
                      value = value * 100;
                    }
                    return (
                      <td key={i} style={{ textAlign: 'right' }}>
                        {strong ? <b>{fmtCell(value, String(format))}</b> : fmtCell(value, String(format))}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}

const RATIO_FAM: { key: string; label: string }[] = [
  { key: 'growth', label: 'Crecimiento' }, { key: 'profitability', label: 'Rentabilidad' },
  { key: 'liquidity', label: 'Liquidez' }, { key: 'solvency', label: 'Solvencia' },
  { key: 'efficiency', label: 'Circulante / eficiencia' },
];
function Finanzas({ financial, analysis }: { financial: FinancialSection | null; analysis: FinancialAnalysis | null }) {
  const [tab, setTab] = useState<'pl' | 'balance' | 'cashflow' | 'ratios'>('pl');
  const [lvl, setLvl] = useState(1);
  const fq = analysis?.financial_quality ?? null;
  const hasQuality = !!fq && !!(fq.assessment || fq.strengths?.length || fq.weaknesses?.length || fq.risks?.length);
  if (!financial || (!financial.profit_loss && !financial.balance && !(financial.ratios?.items?.length))) return <Pending label="Finanzas" />;
  const ratios = financial.ratios?.items ?? [];
  const fams = RATIO_FAM.filter((f) => ratios.some((r) => r.category === f.key));
  const lvlName = ['', 'Ejecutiva', 'Negocio', 'Detalle', 'Máximo'][lvl];
  return (
    <section className="panel on">
      <div className="sec-h">Finanzas</div>
      <div className="sec-s">Cuenta de resultados, balance y ratios — de la vista ejecutiva al detalle contable.</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="seg dark">
          <button className={tab === 'pl' ? 'on' : ''} onClick={() => setTab('pl')}>Cuenta de resultados</button>
          <button className={tab === 'balance' ? 'on' : ''} onClick={() => setTab('balance')}>Balance</button>
          <button className={tab === 'cashflow' ? 'on' : ''} onClick={() => setTab('cashflow')} data-testid="finanzas-tab-cashflow">Flujos de efectivo</button>
          <button className={tab === 'ratios' ? 'on' : ''} onClick={() => setTab('ratios')}>Ratios</button>
        </div>
        <span style={{ flex: 1 }} />
        {(tab === 'pl' || tab === 'balance') && (
          <div className="lvlctl">
            <span className="lb">Nivel de detalle</span>
            <input type="range" min={1} max={3} step={1} value={lvl} onChange={(e) => setLvl(Number(e.target.value))} className="lvlrange" />
            <span className="lvlval">{lvlName}</span>
          </div>
        )}
      </div>

      {hasQuality && (
        <div className="intel" style={{ marginBottom: 16 }}>
          <div className="ih"><span className="m">@</span><b>Lectura financiera de ARROBA</b>{fq!.score != null && <span className="tr">Calidad {Math.round(clamp100(fq!.score) ?? 0)}</span>}</div>
          {fq!.assessment && <p>{fq!.assessment}</p>}
          <div className="pos-att">
            {fq!.strengths?.length ? (
              <div className="pa"><h5>Aspectos positivos</h5>
                {fq!.strengths.map((t, i) => <div key={i} className="li"><span className="m">✓</span> {t}</div>)}
              </div>
            ) : null}
            {(fq!.weaknesses?.length || fq!.risks?.length) ? (
              <div className="pa att"><h5>Aspectos de atención</h5>
                {[...(fq!.weaknesses ?? []), ...(fq!.risks ?? [])].map((t, i) => <div key={i} className="li"><span className="m">⚠</span> {t}</div>)}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {tab === 'pl' && (financial.profit_loss
        ? <div className="card"><h3><span className="k" />Cuenta de resultados</h3><div className="cs">Arrastra {'"Nivel de detalle"'} para desplegar más partidas</div><FinTable block={filterRows(financial.profit_loss, lvl)} /></div>
        : <Pending label="Cuenta de resultados" />)}
      {tab === 'balance' && (financial.balance
        ? <><div className="card"><h3><span className="k" />Balance</h3><FinTable block={filterRows(financial.balance, lvl)} /></div><DebtBreakdownCard balance={analysis?.balance_sheet ?? null} year={analysis?.year ?? null} /></>
        : (analysis?.balance_sheet
            ? <DebtBreakdownCard balance={analysis.balance_sheet} year={analysis.year ?? null} />
            : <Pending label="Balance" />))}
      {tab === 'cashflow' && (analysis?.cash_flow && Array.isArray(analysis.cash_flow.rows) && analysis.cash_flow.rows.length > 0
        ? <div className="card"><h3><span className="k" />Estado de flujos de efectivo</h3><div className="cs">Fuente: cuentas depositadas (PGC) · flujos por actividad y resumen (FCF, conversión de caja).</div><CashFlowTable cf={analysis.cash_flow} /></div>
        : <Empty label="Estado de flujos de efectivo" />)}

      {tab === 'ratios' && (fams.length ? (
        <div className="card">
          <h3><span className="k" />Ratios financieros</h3>
          <div className="cs">Valor · percentil sectorial. Pasa el ratón por cada ratio para su definición.</div>
          {(clamp100(fq?.score ?? null) != null || clamp100(analysis?.iberinform_ratios?.solvency_score?.value ?? null) != null) && (
            <div className="scores" style={{ gridTemplateColumns: 'repeat(2, 1fr)', maxWidth: 220, marginBottom: 18 }}>
              {clamp100(fq?.score ?? null) != null && (
                <div title="Score de calidad financiera de ARROBA (márgenes, solvencia y tendencia).">
                  <Ring val={clamp100(fq?.score ?? null)!} label="Calidad" color={OK} />
                </div>
              )}
              {clamp100(analysis?.iberinform_ratios?.solvency_score?.value ?? null) != null && (
                <div title="Score de solvencia (Iberinform), 0-100.">
                  <Ring val={clamp100(analysis?.iberinform_ratios?.solvency_score?.value ?? null)!} label="Score de solvencia" color={OK} />
                </div>
              )}
            </div>
          )}
          <div className="rfams">
            {fams.map((f) => (
              <div key={f.key} className="rfam">
                <h5><span className="k" />{f.label}</h5>
                {ratios.filter((r) => r.category === f.key).map((r) => {
                  const pct = r.benchmark?.percentile;
                  // ÍTEM 3 · Turno post-D · fix R15: `FinancialRatioItem.value` viene
                  // como ratio decimal `[−1,1]` cuando `format="percent"`. El helper
                  // global `fmtCell` no multiplica × 100 (uso compartido con Cash
                  // Flow, currency, ratio), así que aplicamos bridging local
                  // acotado al render de ratios de esta card. Coherente con
                  // `fmtRatioValue` del `RatiosTrendCard` (que ya × 100). Cero
                  // efecto sobre `ratio`, `multiple`, o `value=null` (sigue `—`).
                  let displayValue: number | null = r.value;
                  if (
                    r.format === 'percent' &&
                    typeof displayValue === 'number' &&
                    Math.abs(displayValue) <= 1
                  ) {
                    displayValue = displayValue * 100;
                  }
                  return (
                    <div key={r.key} className="rrow">
                      <span className="rn" title={r.formula ?? undefined}>
                        {r.name}
                        {r.verified === false && (
                          <span
                            title="Pendiente de verificar antes de publicar"
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                              background: 'var(--warning-subtle)', color: 'var(--warning)',
                              fontSize: 10, fontWeight: 800, cursor: 'help',
                            }}
                          >!</span>
                        )}
                      </span>
                      <span className="rv">{fmtCell(displayValue, r.format)}</span>
                      {pct != null ? <span className="rp"><i style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} /></span> : <span className="rp na">—</span>}
                      <span className="rt f">▬</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="rleg">
            <span><span className="srcdot r" /> Verificado en fuente</span>
            <span><span className="srcdot c" /> Estimación de ARROBA</span>
            <span>La barra indica el percentil frente al sector</span>
          </div>
        </div>
      ) : <Pending label="Ratios" />)}

      {tab === 'ratios' && <RatiosTrendCard analysis={analysis} />}
    </section>
  );
}

/** Tarjeta B-1.4 · Ratios financieros con evolución (▲▼) vs año anterior, alimentada por /financial-analysis.ratios.*. */
const RATIO_TREND_META: ReadonlyArray<{ key: string; label: string; abbrTitle?: string; format: 'pct' | 'eur' }> = [
  { key: 'ebitda_margin', label: 'Margen EBITDA', format: 'pct' },
  { key: 'ebit_margin', label: 'Margen EBIT', format: 'pct' },
  { key: 'net_margin', label: 'Margen neto', format: 'pct' },
  { key: 'roa', label: 'ROA', abbrTitle: 'Return On Assets: Beneficio neto / Activos totales. Rentabilidad de los activos.', format: 'pct' },
  { key: 'roe', label: 'ROE', abbrTitle: 'Return On Equity: Beneficio neto / Fondos propios. Rentabilidad del accionista.', format: 'pct' },
  { key: 'solvency', label: 'Solvencia', format: 'pct' },
  { key: 'debt_ratio', label: 'Ratio de deuda', format: 'pct' },
  { key: 'revenue_per_employee', label: 'Ingresos por empleado', format: 'eur' },
  { key: 'capital_intensity', label: 'Intensidad de capital', format: 'pct' },
];

function fmtRatioValue(v: number | null | undefined, format: 'pct' | 'eur'): string {
  if (v === null || v === undefined) return '—';
  if (format === 'pct') return `${(v * 100).toLocaleString('es-ES', { maximumFractionDigits: 1 })} %`;
  return `${v.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €`;
}

function fmtRatioDelta(v: number | null | undefined, format: 'pct' | 'eur'): string {
  if (v === null || v === undefined) return '';
  const sign = v > 0 ? '+' : '';
  if (format === 'pct') return `${sign}${(v * 100).toLocaleString('es-ES', { maximumFractionDigits: 2 })} pp`;
  return `${sign}${v.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €`;
}

function RatiosTrendCard({ analysis }: { analysis: FinancialAnalysis | null }) {
  const raw = analysis?.ratios;
  if (!raw || typeof raw !== 'object') return null;
  const items = RATIO_TREND_META.map((meta) => {
    const cell = (raw as Record<string, FinancialAnalysisRatioDetail | number | undefined>)[meta.key];
    if (!cell || typeof cell !== 'object' || cell.available === false || cell.value == null) return null;
    return { meta, detail: cell };
  }).filter((x): x is { meta: typeof RATIO_TREND_META[number]; detail: FinancialAnalysisRatioDetail } => x !== null);
  if (items.length === 0) return null;
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <style>{`.rat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-top:12px}.rat-card{border:1px solid var(--n200);border-radius:var(--r);padding:12px 14px;background:var(--n0);cursor:help}.rat-card .lbl{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--n700);text-transform:uppercase;letter-spacing:.4px}.rat-card .val{font-size:22px;font-weight:800;color:var(--n900);margin-top:6px}.rat-card .dlt{font-size:12.5px;margin-top:2px}.rat-card .up{color:#16a34a}.rat-card .down{color:#dc2626}`}</style>
      <h3><span className="k" />Ratios financieros</h3>
      <div className="cs">Valor y variación vs año anterior. Pasa el ratón por cada tarjeta para ver la definición.</div>
      <div className="rat-grid">
        {items.map(({ meta, detail }) => {
          const trend = detail.trend;
          const trendClass = trend === '▲' ? 'up' : trend === '▼' ? 'down' : '';
          const tooltip = detail.explanation || detail.formula || undefined;
          return (
            <div key={meta.key} className="rat-card" title={tooltip}>
              <div className="lbl">
                <span>{meta.abbrTitle ? <abbr title={meta.abbrTitle}>{meta.label}</abbr> : meta.label}</span>
                {trend && <span className={trendClass}>{trend}</span>}
              </div>
              <div className="val">{fmtRatioValue(detail.value, meta.format)}</div>
              {detail.delta != null && <div className={`dlt ${trendClass}`}>{fmtRatioDelta(detail.delta, meta.format)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================ VALORACIÓN ============================ */
function Valoracion({ valuation, financialAnalysis }: { valuation: ValuationAnalysis | null; financialAnalysis: FinancialAnalysis | null }) {
  if (!valuation || !valuation.has_valuation) return <Pending label="Valoración" />;
  const r = valuation.range;
  const q = clamp100(financialAnalysis?.financial_quality?.score ?? null);
  const maxEv = r ? (Math.max(r.low ?? 0, r.central ?? 0, r.high ?? 0) || 1) : 1;
  const pctOf = (v: number | null) => (v == null ? 0 : Math.max(6, Math.min(100, (v / maxEv) * 100)));
  const scenarioName = (i: 0 | 1 | 2): string => {
    const fallback: readonly [string, string, string] = ['Bajo', 'Medio', 'Alto'];
    const raw = valuation.scenarios?.[i]?.name;
    if (!raw) return fallback[i];
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  };
  // ÍTEM 1 · Turno post-D · Retirado fallback a `financialAnalysis.valuation`.
  // Ahora `valuation` proviene del agregador `ficha.finances.valuation`
  // (Turno D · cobertura 6/6 para benchmark + methodology). R15 puro.
  const b = valuation.benchmark;
  const methodology = valuation.methodology;
  const fmtMillions = (v: number | null | undefined): string => (v == null ? '—' : `${(v / 1_000_000).toLocaleString('es-ES', { maximumFractionDigits: 1 })} M€`);
  return (
    <section className="panel on">
      <style>{`.perc-pill{display:inline-block;padding:5px 12px;border-radius:999px;background:var(--n100);color:var(--n900);font-size:12.5px;font-weight:700;margin-bottom:12px}.bmk-row{display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:8px 0;border-top:1px solid var(--n200)}.bmk-row .lbl{font-size:12.5px;color:var(--n700);text-transform:uppercase;letter-spacing:.4px}.bmk-row .val{font-size:15px;font-weight:800;color:var(--n900);margin-top:2px}`}</style>
      <div className="sec-h">Valoración</div>
      <div className="sec-s">Aproximación de valor por múltiplos comparables. Estimación orientativa, no una valoración formal.</div>
      <div className="intel" style={{ borderColor: 'var(--n200)', background: 'var(--n50)' }}>
        <p><b>Equity Value ajustado por deuda financiera neta.</b> Valor de referencia calculado con la metodología de ARROBA.</p>
      </div>
      <div className="row r3" style={{ marginTop: 16 }}>
        {q != null && (
          <div className="card">
            <h3><span className="k" />Posicionamiento</h3>
            <div className="scores" style={{ gridTemplateColumns: '1fr' }}><Ring val={q} label="Calidad financiera" color={OK} /></div>
          </div>
        )}
        {r && (
          <div className="card">
            <h3><span className="k" /><span className="help" data-tip="ENTERPRISE_VALUE" tabIndex={0}>Enterprise Value</span></h3>
            <div className="evrow"><span className="lb">{scenarioName(0)}</span><div className="evbar"><i style={{ width: `${pctOf(r.low)}%`, background: 'var(--red)' }} /></div><span className="val">{fmtEUR(r.low)}</span></div>
            <div className="evrow"><span className="lb">{scenarioName(1)}</span><div className="evbar"><i style={{ width: `${pctOf(r.central)}%`, background: 'var(--info)' }} /></div><span className="val">{fmtEUR(r.central)}</span></div>
            <div className="evrow"><span className="lb">{scenarioName(2)}</span><div className="evbar"><i style={{ width: `${pctOf(r.high)}%`, background: 'var(--ok)' }} /></div><span className="val">{fmtEUR(r.high)}</span></div>
            {valuation.multiple != null && <div className="idrow" style={{ marginTop: 10 }}><span className="k"><span className="help" data-tip="EV_EBITDA" tabIndex={0}>Múltiplo</span></span><span className="v">{valuation.multiple.toLocaleString('es-ES', { maximumFractionDigits: 1 })}× {valuation.multiple_basis ?? 'EBITDA'}</span></div>}
            <div className="idrow"><span className="k" style={{ fontWeight: 700, color: 'var(--n900)' }}><span className="help" data-tip="EQUITY_VALUE" tabIndex={0}>Equity value</span></span><span className="v" style={{ color: 'var(--red-hover)' }}>{fmtEUR(valuation.equity_value)}</span></div>
          </div>
        )}
      </div>
      {b && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3><span className="k" />Benchmark del sector</h3>
          <div className="cs">Comparativa contra la mediana de compañías del mismo sector y banda de tamaño</div>
          <div className="perc-pill">Percentil {b.ebitda_margin_percentile ?? '—'} del sector · n={b.peers_count} peers</div>
          <div className="bmk-row">
            <div>
              <div className="lbl">Margen <abbr title="Beneficio antes de intereses, impuestos, depreciación y amortización.">EBITDA</abbr> · Esta compañía</div>
              <div className="val">{pctF(b.subject_ebitda_margin)}</div>
            </div>
            <div>
              <div className="lbl">Mediana sector</div>
              <div className="val">{pctF(b.median_ebitda_margin)}</div>
            </div>
          </div>
          <div className="bmk-row">
            <div>
              <div className="lbl">Ingresos · Esta compañía</div>
              <div className="val">{fmtMillions(b.subject_revenue)}</div>
            </div>
            <div>
              <div className="lbl">Mediana sector</div>
              <div className="val">{fmtMillions(b.median_revenue)}</div>
            </div>
          </div>
        </div>
      )}
      {valuation.hypotheses.length > 0 && (
        <RevealCard className="card" style={{ marginTop: 16 }} testid="valuation-why-this-value">
          <h3><span className="k" />¿Por qué este valor?</h3>
          <div className="cs">Explicación detrás del número, no sólo la cifra</div>
          <div style={{ paddingTop: 4 }}>
            {valuation.hypotheses.map((h, i) => <div key={i} style={{ fontSize: 13, color: 'var(--n700)', padding: '4px 0', lineHeight: 1.55 }}>◆ {h}</div>)}
          </div>
        </RevealCard>
      )}
      {/* HARDENING-021 · Fase 3 · Metodología estática canónica (prosa CF redactada por Arroba,
          no dato de empresa · R15 respetado). Reemplaza el `<details className="method">`
          genérico que sólo mostraba el string `methodology` del payload. */}
      <RevealCard style={{ marginTop: 16 }} testid="valuation-method-wrap">
        <MethodDetails
          title={METHOD_VALORACION.title}
          formula={METHOD_VALORACION.formula}
          steps={[...METHOD_VALORACION.steps]}
          testid="method-valoracion"
        />
      </RevealCard>
      {methodology && (
        <div className="cs" style={{ marginTop: 8, fontSize: 11, color: 'var(--n500)', fontStyle: 'italic' }} data-testid="method-valoracion-source-note">
          Nota metodológica del motor: {methodology}
        </div>
      )}
    </section>
  );
}

/* ============================ COMPARATIVA ============================ */
function Comparativa({ semantic, buyers }: { semantic: SemanticSection | null; buyers?: RecommendationSet | null }) {
  const [sel, setSel] = useState(0);
  const list = buyers?.recommendations ?? [];
  const similar = semantic?.similar ?? [];
  const chips = [...(semantic?.activities ?? []), ...(semantic?.markets ?? []), ...(semantic?.keywords ?? [])].slice(0, 8);
  if (!list.length && !similar.length && !chips.length) return <Pending label="Comparativa" />;
  const cur: BuyerItem | undefined = list[sel];
  const fitEntries = cur ? Object.entries(cur.fit_dimensions ?? {}) : [];
  return (
    <section className="panel on">
      <div className="sec-h">Comparativa</div>
      <div className="sec-s">Con quién se compara la empresa y quién encajaría como comprador.</div>

      {chips.length > 0 && (
        <div className="card">
          <h3><span className="k" />Perfil de negocio</h3>
          <div className="cs">Rasgos de negocio que definen a la compañía frente a sus comparables</div>
          <div className="chips">{chips.map((c, i) => <span key={i} className={`schip${i > 2 ? ' n' : ''}`}>{c}</span>)}</div>
        </div>
      )}

      {list.length > 0 && (
        <div className="card">
          <h3><span className="k" />Compradores que mejor encajarían con esta compañía</h3>
          <div className="cs">Ordenados por grado de encaje. Selecciona un comprador para ver por qué encaja.</div>
          <table className="rec buyers">
            <tbody>
              <tr><th>Comprador</th><th>Tipo</th><th>Encaje</th><th>Por qué, en una línea</th></tr>
              {list.map((b, i) => {
                const fit = clamp100(b.score) ?? 0;
                return (
                  <tr key={b.master_id ?? i} className={i === sel ? 'on' : ''} onClick={() => setSel(i)} style={{ cursor: 'pointer' }}>
                    <td>{b.name ?? 'Comprador'}</td>
                    <td>{b.recommendation_type ?? b.sector ?? '—'}</td>
                    <td><span className="fit">{Math.round(fit)}</span><span className="mbar"><i style={{ width: `${fit}%` }} /></span></td>
                    <td>{b.reason ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="buywhy">Arroba cruza el <b>perfil de esta compañía</b> (sector, tamaño, márgenes, territorio y estructura) con las <b>tesis de compra activas</b>. Cada encaje se calcula frente a los rasgos concretos de la empresa, no es un listado genérico.</div>
        </div>
      )}

      <div className="row r2">
        {cur && (
          <div className="card">
            <h3><span className="k" />Por qué encaja <span className="whytag">{cur.name ?? ''}</span></h3>
            <div className="cs">Cómo se descompone el encaje de {cur.name ?? 'este comprador'}, factor a factor.</div>
            <div>
              {fitEntries.map(([kk, v]) => {
                const val = clamp100(v) ?? 0;
                return (
                  <div key={kk} className="fac"><span className="fn">{kk}</span><span className="fb"><i style={{ width: `${val}%` }} /></span><span className="fv">{Math.round(val)}</span></div>
                );
              })}
            </div>
            {cur.reason && <div className="whynar">{cur.reason}</div>}
          </div>
        )}
        {similar.length > 0 && (
          <div className="card">
            <h3><span className="k" />Empresas parecidas</h3>
            <div className="cs">Compañías con un perfil de negocio análogo por sector, tamaño, márgenes y territorio.</div>
            {similar.map((s, i) => (
              <div key={s.master_id ?? i} className="simrow">
                <div className="lg">{(s.name || '?').slice(0, 2).toUpperCase()}</div>
                <div>
                  <div className="snm">{s.name}</div>
                  <div className="sd">{[s.sector, s.region].filter(Boolean).join(' · ')}</div>
                  {s.matched_dimensions.length > 0 && <div className="sb">Se parece en <b>{s.matched_dimensions.join(', ')}</b>.</div>}
                </div>
                <div className="sm"><b>{s.score.toLocaleString('es-ES', { maximumFractionDigits: 2 })}</b><small>similitud</small></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * HARDENING-020 · ErrorBoundary genérico para secciones inteligencia
 * (`Senales`, `Oportunidades`, futuras). Aísla crashes de un sub-bloque
 * para que la ficha completa siga montándose (defensa contra shape shifts
 * del payload Intel, edge cases de mapeo, etc.). Loguea a consola en dev
 * y degrada la sección a `<Empty label={label}/>` (nunca fabrica prosa).
 */
interface IntelSectionErrorBoundaryProps { label: string; sectionTestid?: string; children: React.ReactNode }
interface IntelSectionErrorBoundaryState { hasError: boolean; error?: Error }
class IntelligenceSectionErrorBoundary extends Component<IntelSectionErrorBoundaryProps, IntelSectionErrorBoundaryState> {
  constructor(props: IntelSectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error): IntelSectionErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error(`[IntelligenceSectionErrorBoundary:${this.props.label}] section crashed:`, error, info);
    }
  }
  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <section className="panel on" data-testid={this.props.sectionTestid ?? 'intel-section-error-boundary'}>
          <div className="sec-h">{this.props.label}</div>
          <Empty label={this.props.label} />
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <div className="cs" style={{ marginTop: 8, color: 'var(--n500)', fontSize: 11 }}>
              [dev] {this.state.error.message}
            </div>
          )}
        </section>
      );
    }
    return this.props.children;
  }
}

/* ============================ SEÑALES ============================ */
/**
 * ÍTEM 2 · Turno post-D · consumo enriquecido del payload `signal-intelligence`.
 * HARDENING-020 (2026-08-13) · Canon Narrativa CF · Anexo B (Señales) aplicado:
 *   · Titular = `explanation` (prosa Intel: "EBITDA +24,4% interanual"). Nunca
 *     se muestra `title`/`signal_type`/`rule.id` porque son tokens técnicos
 *     de máquina (p. ej. `growth.ebitda_expansion`).
 *   · Polaridad = etiqueta ES canónica "Señal {favorable|desfavorable|de
 *     alerta|informativa}" (mapa `SIG_POLARITY_LABEL_ES`; fallback si Intel
 *     no emite `polarity_label`).
 *   · Evidencia cruda (`ebitda_growth_yoy · 0,24 · yoy`) → OCULTA. La prosa
 *     del titular ya la comunica en lenguaje CF (§Anexo B).
 *   · Scores (impact/confidence) → bandas cualitativas ES ("muy alto/alto/
 *     moderado/bajo") vía `qualitativeBand()`. Urgency/persistence se omiten.
 *   · Acciones → etiquetas ES vía `SIG_ACTION_LABEL_ES`; sin "→".
 *   · Categoría → etiqueta ES vía `SIG_CATEGORY_LABEL_ES` (fallback local
 *     porque el motor aún no emite `category_label_es` per señal · TODO
 *     migrar cuando Intel lo emita, mismo patrón que HARDENING-019).
 *   · "Regla · {rule.id}" → RETIRADO (mecanismo interno). `rule.id` sigue
 *     disponible como `data-rule` para debugging DOM.
 *   · Subtítulo sección = copy literal Anexo B.
 */
const SIG_POLARITY_LABEL_ES: Record<string, string> = {
  positive: 'Señal favorable',
  negative: 'Señal desfavorable',
  warning: 'Señal de alerta',
  info: 'Señal informativa',
  neutral: 'Señal informativa',
};
const SIG_CATEGORY_LABEL_ES: Record<string, string> = {
  growth: 'Crecimiento',
  market: 'Mercado',
  operational: 'Operativo',
  ownership: 'Propiedad',
  financial: 'Financiero',
  legal: 'Legal',
  compliance: 'Cumplimiento',
  reputation: 'Reputacional',
  strategic: 'Estratégico',
  governance: 'Gobierno',
};
const SIG_ACTION_LABEL_ES: Record<string, string> = {
  analyze: 'Analizar',
  add_to_watchlist: 'Añadir a seguimiento',
  compare: 'Comparar',
  contact: 'Contactar',
  value: 'Valorar',
  request_due_diligence: 'Solicitar due diligence',
  share: 'Compartir',
  export: 'Exportar',
  dismiss: 'Descartar',
};
const SIG_DIM_LABEL_ES: Record<string, string> = {
  impact: 'Impacto',
  confidence: 'Confianza',
};
/**
 * HARDENING-020 · Bandas cualitativas Anexo B (score 0-1 · dividido por 100
 * si viene >1, o multiplicado por 100 si es 0-1). Devuelve la banda ES.
 *   ≥80 → "muy alto"  ·  60-79 → "alto"  ·  40-59 → "moderado"  ·  <40 → "bajo"
 * HARDENING-020-fix · guard contra inputs inválidos (`null`, `undefined`,
 * `NaN`, `Infinity`). Retorna `null` para no fabricar prosa (R15).
 */
function qualitativeBand(rawScore: number | null | undefined): string | null {
  if (rawScore === null || rawScore === undefined) return null;
  if (typeof rawScore !== 'number' || !Number.isFinite(rawScore)) return null;
  const pct = rawScore <= 1 ? rawScore * 100 : rawScore;
  if (pct >= 80) return 'muy alto';
  if (pct >= 60) return 'alto';
  if (pct >= 40) return 'moderado';
  return 'bajo';
}
function Senales({ signal }: { signal?: SignalAnalysis | null }) {
  const items = signal?.signals ?? [];
  if (!items.length) {
    // ÍTEM 2 · Turno post-D · copy Corporate Finance exacto (no reusa `Empty` estándar
    // porque `Empty` prepone "Información en preparación · {label}").
    return (
      <section className="panel on" data-testid="senales-empty">
        <div className="sec-h">Señales</div>
        <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
          <div style={{ fontSize: 20, opacity: 0.45, marginBottom: 6 }}>◔</div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--n700)' }}>Sin señales relevantes</div>
        </div>
      </section>
    );
  }
  const cls = (pol: string | null) => pol === 'positive' ? 'ok' : pol === 'negative' ? 'r' : pol === 'warning' ? 'w' : 'i';
  return (
    <section className="panel on" data-testid="senales-section">
      <style>{`.sig-explain{font-size:14px;color:var(--n800);line-height:1.55;margin-top:6px}.sig-dims{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.sig-dim{padding:3px 10px;border-radius:999px;background:var(--n100);color:var(--n800);font-size:11.5px;font-weight:600}.sig-actions{margin-top:8px;display:flex;gap:6px;flex-wrap:wrap}.sig-actions .a{padding:3px 10px;border:1px solid var(--n200);border-radius:6px;font-size:11.5px;color:var(--n700);background:var(--n0)}`}</style>
      <div className="sec-h">Señales</div>
      <div className="sec-s">Hechos y cambios recientes que afectan al atractivo de la compañía para una operación.</div>
      <div className="tl">
        {items.map((s) => {
          // HARDENING-020 · Titular = prosa Intel (`explanation`). Nunca `title`
          // porque en el shape actual Intel emite `title = signal_type` (token
          // técnico tipo `growth.ebitda_expansion`). Si `explanation` no viene
          // → mostramos un fallback CF neutro (nunca el token técnico).
          const headline = s.explanation ?? 'Cambio detectado';
          // Polaridad ES canónica (fallback si Intel no emite `polarity_label`).
          const polarityLabel = s.polarity ? (SIG_POLARITY_LABEL_ES[s.polarity] ?? null) : null;
          // Category ES canónica (fallback local · TODO migrar a `category_label_es` Intel).
          const categoryLabel = s.category ? (SIG_CATEGORY_LABEL_ES[s.category] ?? null) : null;
          // Dimensions cualitativas (sólo impact + confidence per §Anexo B).
          const dims = s.dimensions ?? null;
          const impactBand = dims && typeof dims.impact === 'number' ? qualitativeBand(dims.impact) : null;
          const confidenceBand = dims && typeof dims.confidence === 'number' ? qualitativeBand(dims.confidence) : null;
          return (
            <div
              key={s.signal_id}
              className={`ev ${cls(s.polarity)}`}
              data-testid={`senal-${s.signal_id}`}
              data-rule={s.rule?.id ?? undefined}
            >
              <div className="mk" />
              <div className="c">
                <div className="th">
                  <div>
                    <div className="t">{headline}</div>
                    {polarityLabel && <div className="m" data-testid={`senal-${s.signal_id}-polarity`}>{polarityLabel}</div>}
                  </div>
                  {categoryLabel && <span className="tag" data-testid={`senal-${s.signal_id}-category`}>{categoryLabel}</span>}
                </div>
                {(impactBand || confidenceBand) && (
                  <div className="sig-dims">
                    {impactBand && (
                      <span
                        className="sig-dim"
                        data-testid={`senal-${s.signal_id}-impact`}
                        data-score={typeof dims?.impact === 'number' ? dims.impact : undefined}
                      >
                        {SIG_DIM_LABEL_ES.impact} {impactBand}
                      </span>
                    )}
                    {confidenceBand && (
                      <span
                        className="sig-dim"
                        data-testid={`senal-${s.signal_id}-confidence`}
                        data-score={typeof dims?.confidence === 'number' ? dims.confidence : undefined}
                      >
                        {SIG_DIM_LABEL_ES.confidence} {confidenceBand}
                      </span>
                    )}
                  </div>
                )}
                {(s.recommended_actions?.length ?? 0) > 0 && Array.isArray(s.recommended_actions) && (
                  <div className="sig-actions" data-testid={`senal-${s.signal_id}-actions`}>
                    {(s.recommended_actions ?? []).map((a, j) => (
                      <span key={j} className="a" data-action={a}>{SIG_ACTION_LABEL_ES[a] ?? a}</span>
                    ))}
                  </div>
                )}
                {fmtDate(s.detected_at) && <div className="yr">{fmtDate(s.detected_at)}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ============================ RANKINGS · sección independiente ============================ */
/**
 * B-2 · Rankings sección independiente (2026-08-12).
 * Consume `financialAnalysis.ranking` — mismo objeto que ya alimenta la 2ª fila
 * kgrid del Resumen (B-2.1) y ahora una card dedicada CF con contexto extendido.
 * Gated · el ranking se deriva de los ingresos de la empresa.
 */
function Rankings({ analysis }: { analysis: FinancialAnalysis | null }) {
  const r = analysis?.ranking ?? null;
  if (!r) {
    return (
      <section className="panel on" data-testid="rankings-empty">
        <div className="sec-h">Posicionamiento sectorial y competitivo</div>
        <div className="sec-s">Ranking por ingresos frente al universo Intel de comparables.</div>
        <Empty label="Posicionamiento en preparación" />
      </section>
    );
  }
  const pct = r.sector_revenue_percentile ?? null;
  const mp = r.market_position ?? null;
  const lp = r.locality_position ?? null;
  const explain = Array.isArray(r.explain) ? r.explain : [];
  return (
    <section className="panel on" data-testid="rankings-section">
      <div className="sec-h">Posicionamiento sectorial y competitivo</div>
      <div className="sec-s">Ranking por ingresos frente al universo Intel de comparables.</div>
      <div className="card">
        <h3><span className="k" />Percentil sectorial</h3>
        <div className="cs">Posición relativa por ingresos dentro del sector CNAE</div>
        <div className="idrow" data-testid="rankings-percentile">
          <span className="k"><SrcDot type={provenanceFor(analysis?.provenance, 'ranking', 'sector_revenue_percentile') as ProvenanceValue | null} /> <span className="help" data-tip="PERCENTIL_SECTORIAL" tabIndex={0}>Percentil</span></span>
          <span className="v"><PercentileValue value={pct} /></span>
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3><span className="k" />Universo comparable · mismo sector y banda de tamaño</h3>
        <div className="cs" data-testid="rankings-market-position-scope">{mp?.scope ?? '—'}</div>
        <div className="idrow" data-testid="rankings-market-position">
          <span className="k">Posición</span>
          <span className="v">
            {mp?.rank != null && mp?.total != null
              ? <><b>#{mp.rank}</b> de {fmtNum(mp.total)}</>
              : <Empty label="Sin datos" />}
          </span>
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3><span className="k" />Posición local · municipio</h3>
        <div className="cs" data-testid="rankings-locality-position-scope">{lp?.scope ?? '—'}</div>
        <div className="idrow" data-testid="rankings-locality-position">
          <span className="k">Posición</span>
          <span className="v">
            {lp?.rank != null && lp?.total != null
              ? <><b>#{lp.rank}</b> de {fmtNum(lp.total)}</>
              : <Empty label="Sin datos" />}
          </span>
        </div>
      </div>
      {explain.length > 0 && (
        <div className="card" style={{ marginTop: 16 }} data-testid="rankings-explain-bullets">
          <h3><span className="k" />Lectura CF</h3>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.7, color: 'var(--n800)' }}>
            {explain.map((line, i) => (
              <li key={i} data-testid={`rankings-explain-item-${i}`}>{line}</li>
            ))}
          </ul>
        </div>
      )}
      {/* HARDENING-021 · Fase 3 · Metodología estática (universo comparable). */}
      <RevealCard style={{ marginTop: 16 }} testid="rankings-method-wrap">
        <MethodDetails
          title={METHOD_RANKINGS.title}
          steps={[...METHOD_RANKINGS.steps]}
          testid="method-rankings"
        />
      </RevealCard>
    </section>
  );
}

/* ============================ MERCADO · Contexto sectorial y territorial ============================ */
/**
 * B-2 · Sección Mercado (HARDENING-012 · 2026-08-12).
 * Consume `ficha.market` top-level Intel. 4 sub-paneles independientes:
 *   - sector (contexto CNAE): PÚBLICO
 *   - geo (contexto provincia): PÚBLICO
 *   - concentration (HHI + degraded flag): PÚBLICO
 *   - position (posición de la empresa): GATED (derivado de ingresos)
 * R15: passthrough puro · sin cálculo derivado en frontend.
 */
function fmtScore(v: number | null | undefined): React.ReactNode {
  if (v == null) return <span style={{ color: 'var(--n400)', fontStyle: 'italic' }}>En preparación</span>;
  return <b>{v}</b>;
}
function TrendBadge({ direction }: { direction?: string | null }) {
  if (!direction) return null;
  const color = direction === 'up' ? '#0a7f3f' : direction === 'down' ? 'var(--red)' : 'var(--n600)';
  const arrow = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';
  const label = direction === 'up' ? 'Al alza' : direction === 'down' ? 'A la baja' : 'Estable';
  return <span style={{ color, fontWeight: 700, fontSize: 12 }}>{arrow} {label}</span>;
}
function MercadoSectorPanel({ sector }: { sector?: import('@/lib/companies/intelligence-types').MarketSector | null }) {
  if (!sector || sector.available === false) return <Empty label="Contexto sectorial" />;
  const isDegraded = sector.cnae_level === 'section' || sector.cnae_level === 'division';
  // HARDENING-019 · Fase B canon CF · Impulsor y prosa 100% ES desde Intel.
  const driverLabel = sector.primary_driver_label ?? null;
  return (
    <div className="card" data-testid="mercado-sector-panel">
      <h3><span className="k" />Contexto sectorial · {sector.cnae_label ?? '—'}</h3>
      {isDegraded && sector.cnae_level && (
        <div className="cs" data-testid="mercado-sector-caveat" style={{ background: 'var(--warn-tint)', padding: '6px 10px', borderRadius: 4, marginTop: 6 }}>
          <Lock size={12} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 6 }} />
          Cobertura Intel a nivel <b>{sector.cnae_level === 'division' ? 'división CNAE (2 dígitos)' : 'sección CNAE'}</b> — nivel más granular no disponible para este sector.
        </div>
      )}
      {sector.narrative && (
        <p data-testid="mercado-sector-narrative" style={{ fontSize: 13.5, color: 'var(--n700)', lineHeight: 1.6, margin: '10px 0 12px' }}>{sector.narrative}</p>
      )}
      <div className="idrow"><span className="k">Tamaño (size)</span><span className="v">{fmtScore(sector.size_score)}</span></div>
      <div className="idrow"><span className="k">Dinamismo</span><span className="v">{fmtScore(sector.dynamism_score)}</span></div>
      <div className="idrow"><span className="k">Crecimiento</span><span className="v">{fmtScore(sector.growth_score)}</span></div>
      <div className="idrow"><span className="k">Actividad</span><span className="v">{fmtScore(sector.activity_score)}</span></div>
      <div className="idrow"><span className="k">Tendencia nacional</span><span className="v"><TrendBadge direction={sector.trend_direction} /> {sector.national_yoy_pct != null && <span style={{ marginLeft: 8 }}>{sector.national_yoy_pct > 0 ? '+' : ''}{sector.national_yoy_pct}% interanual</span>}</span></div>
      {/* HARDENING-020 · Canon §2 · el enum crudo `sector.signal` (p. ej. `sector_contraction`) YA está descrito en prosa dentro de `sector.narrative`. Se retira el row para no duplicar en jerga. */}
      {driverLabel && <div className="idrow" data-testid="mercado-sector-driver"><span className="k">Impulsor principal</span><span className="v">{driverLabel}</span></div>}
      {sector.active_companies != null && sector.active_companies > 0 && (
        <div className="idrow"><span className="k">Empresas activas</span><span className="v">{fmtNum(sector.active_companies)}</span></div>
      )}
    </div>
  );
}
function MercadoGeoPanel({ geo }: { geo?: import('@/lib/companies/intelligence-types').MarketGeo | null }) {
  if (!geo || geo.available === false) return <Empty label="Contexto territorial" />;
  // HARDENING-019 · Fase B canon CF · consume `geo.narrative` de Intel (retirada del TODO previo).
  const driverLabel = geo.primary_driver_label ?? null;
  return (
    <div className="card" style={{ marginTop: 16 }} data-testid="mercado-geo-panel">
      <h3><span className="k" />Contexto territorial · {geo.geo_name ?? '—'}</h3>
      {geo.narrative && (
        <p data-testid="mercado-geo-narrative" style={{ fontSize: 13.5, color: 'var(--n700)', lineHeight: 1.6, margin: '10px 0 12px' }}>{geo.narrative}</p>
      )}
      <div className="idrow"><span className="k">Tamaño (size)</span><span className="v">{fmtScore(geo.size_score)}</span></div>
      <div className="idrow"><span className="k">Dinamismo</span><span className="v">{fmtScore(geo.dynamism_score)}</span></div>
      <div className="idrow"><span className="k">Crecimiento</span><span className="v">{fmtScore(geo.growth_score)}</span></div>
      <div className="idrow"><span className="k">Tendencia</span><span className="v"><TrendBadge direction={geo.trend_direction} /></span></div>
      {/* HARDENING-020 · Canon §2 · el enum crudo `geo.signal` (`corporate_hub`, etc.) YA está descrito en prosa dentro de `geo.narrative`. Se retira el row. */}
      {driverLabel && <div className="idrow" data-testid="mercado-geo-driver"><span className="k">Impulsor principal</span><span className="v">{driverLabel}</span></div>}
      {geo.active_companies != null && (
        <div className="idrow"><span className="k">Empresas activas</span><span className="v">{fmtNum(geo.active_companies)}</span></div>
      )}
      {geo.net_company_creation != null && (
        <div className="idrow"><span className="k">Creación neta de empresas</span><span className="v"><b>{geo.net_company_creation > 0 ? '+' : ''}{fmtNum(geo.net_company_creation)}</b></span></div>
      )}
    </div>
  );
}
function MercadoConcentrationPanel({ conc, marketProvenance }: {
  conc?: import('@/lib/companies/intelligence-types').MarketConcentration | null;
  marketProvenance?: unknown;
}) {
  if (!conc || conc.available === false) return <Empty label="Concentración de mercado" />;
  // HARDENING-019 · Fase B canon CF · consume `concentration.narrative` + `concentration_label_es` de Intel.
  const degradationCaveat = conc.degraded_reason ?? conc.caveat ?? null;
  const classLabel = conc.concentration_label_es ?? null;
  return (
    <div className="card" style={{ marginTop: 16 }} data-testid="mercado-concentration-panel">
      <h3><span className="k" />Concentración de mercado</h3>
      {/* HARDENING-020 · Canon §3 · retirado el sufijo "(HHI)" y el prefijo "Nivel: {conc.level}" (jerga codificada). La narrative ya describe el nivel en prosa CF. */}
      {conc.degraded && (
        <div className="cs" data-testid="mercado-concentration-degraded" style={{ background: 'var(--warn-tint)', padding: '6px 10px', borderRadius: 4, marginTop: 6 }}>
          <Lock size={12} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 6 }} />
          Concentración calculada con muestra parcial (universo insuficiente para nivel más granular).
        </div>
      )}
      {conc.narrative && (
        <p data-testid="mercado-concentration-narrative" style={{ fontSize: 13.5, color: 'var(--n700)', lineHeight: 1.6, margin: '10px 0 12px' }}>{conc.narrative}</p>
      )}
      <div className="idrow"><span className="k"><SrcDot type={provenanceFor(marketProvenance, 'concentration', 'hhi') as ProvenanceValue | null} /> <span className="help" data-tip="HHI" tabIndex={0}>Índice de concentración</span></span><span className="v"><b style={{ fontSize: 18 }}>{conc.hhi != null ? fmtNum(conc.hhi) : '—'}</b></span></div>
      {/* HARDENING-020 · Canon §2 · "HHI" retirado como etiqueta suelta (acrónimo·metodología). El número se preserva como dato dentro de la fila, con label CF ES neutro. */}
      {classLabel && (
        <div className="idrow" data-testid="mercado-concentration-classification"><span className="k">Clasificación</span><span className="v">{classLabel}</span></div>
      )}
      {conc.market_actors_count != null && conc.market_actors_count > 0 && (
        <div className="idrow"><span className="k">Actores en el mercado</span><span className="v">{fmtNum(conc.market_actors_count)}</span></div>
      )}
      {conc.total_companies_in_universe != null && conc.total_companies_in_universe > 0 && (
        <div className="idrow"><span className="k">Empresas en el universo</span><span className="v">{fmtNum(conc.total_companies_in_universe)}</span></div>
      )}
      {degradationCaveat && (
        <div className="cs" data-testid="mercado-concentration-caveat" style={{ marginTop: 10, fontStyle: 'italic' }}>{degradationCaveat}</div>
      )}
      {conc.hhi_methodology && (
        <div className="cs" style={{ marginTop: 6, fontSize: 10.5, color: 'var(--n500)' }}>{conc.hhi_methodology}</div>
      )}
      {/* HARDENING-021 · Fase 3 · Metodología estática HHI (prosa CF · Anexo B). */}
      <RevealCard style={{ marginTop: 12 }} testid="hhi-method-wrap">
        <MethodDetails
          title={METHOD_HHI.title}
          formula={METHOD_HHI.formula}
          steps={[...METHOD_HHI.steps]}
          testid="method-hhi"
        />
      </RevealCard>
    </div>
  );
}
function MercadoPositionPanel({ pos, anon }: { pos?: import('@/lib/companies/intelligence-types').MarketPosition | null; anon: boolean }) {
  // Gated: la posición depende de ingresos → CTA de registro en anon.
  if (anon) {
    return (
      <div className="card" style={{ marginTop: 16 }} data-testid="mercado-position-gated">
        <h3><span className="k" />Posición de la empresa en el sector</h3>
        <Gate what="tu posición en el sector, la posición local y la lectura CF" />
      </div>
    );
  }
  if (!pos || pos.available === false) return <Empty label="Posición sectorial" />;
  // HARDENING-019 · Fase B canon CF · consume `position.narrative` de Intel (foldea
  // rank/percentil/scope/explain en una única frase CF); rows crudos se preservan
  // debajo como detalle numérico cuando existen.
  const mp = pos.market_position ?? null;
  const lp = pos.locality_position ?? null;
  return (
    <div className="card" style={{ marginTop: 16 }} data-testid="mercado-position-panel">
      <h3><span className="k" />Posición de la empresa en el sector</h3>
      {pos.narrative && (
        <p data-testid="mercado-position-narrative" style={{ fontSize: 13.5, color: 'var(--n700)', lineHeight: 1.6, margin: '10px 0 12px' }}>{pos.narrative}</p>
      )}
      <div className="idrow"><span className="k">Percentil sectorial (ingresos)</span><span className="v"><b style={{ fontSize: 18 }}>{pos.sector_revenue_percentile != null ? `${pos.sector_revenue_percentile}º` : '—'}</b></span></div>
      {mp?.rank != null && mp?.total != null && (
        <div className="idrow"><span className="k">{mp.scope ?? 'Universo comparable'}</span><span className="v"><b>#{mp.rank}</b> de {fmtNum(mp.total)}</span></div>
      )}
      {lp?.rank != null && lp?.total != null && (
        <div className="idrow"><span className="k">{lp.scope ?? 'Posición local'}</span><span className="v"><b>#{lp.rank}</b> de {fmtNum(lp.total)}</span></div>
      )}
    </div>
  );
}
function Mercado({ market, anon }: { market?: MarketBlock | null; anon: boolean }) {
  if (!market || market.available === false) {
    return (
      <section className="panel on" data-testid="mercado-empty">
        <div className="sec-h">Contexto sectorial y territorial</div>
        <div className="sec-s">Sector CNAE, territorio, concentración y posición competitiva.</div>
        <Empty label="Contexto sectorial en preparación" />
      </section>
    );
  }
  return (
    <section className="panel on" data-testid="mercado-section">
      <div className="sec-h">Contexto sectorial y territorial</div>
      <div className="sec-s">Sector CNAE, territorio, concentración de mercado y posición competitiva.</div>
      <MercadoSectorPanel sector={market.sector} />
      <MercadoGeoPanel geo={market.geo} />
      <MercadoConcentrationPanel conc={market.concentration} marketProvenance={(market as { provenance?: unknown } | null)?.provenance} />
      <MercadoPositionPanel pos={market.position} anon={anon} />
    </section>
  );
}

/* ============================ EVENTS · BORME ============================ */
/**
 * Eventos societarios y BORME (2026-08-11).
 * Shape observado en Servier: `{available:false}` puro. Cuando Intel entregue
 * eventos, esperamos un `items[]` con `{date, type, extract, borme_section?, borme_province?}`.
 * Passthrough puro R15: cero derivadas. Público (BORME es dato registral).
 */
interface EventItem {
  date?: string | null;
  type?: string | null;
  extract?: string | null;
  borme_section?: string | null;
  borme_province?: string | null;
  [k: string]: unknown;
}
function Eventos({ events }: { events?: Record<string, unknown> | null }) {
  const available = events?.available === true;
  const itemsRaw = (events?.items as EventItem[] | undefined) ?? (events?.events as EventItem[] | undefined) ?? [];
  const items: EventItem[] = Array.isArray(itemsRaw) ? itemsRaw : [];
  if (!available || items.length === 0) {
    return (
      <section className="panel on" data-testid="events-empty">
        <div className="sec-h">Eventos societarios y BORME</div>
        <div className="sec-s">Cronología de hechos registrales publicados en el Boletín Oficial del Registro Mercantil.</div>
        <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
          <div style={{ fontSize: 20, opacity: 0.45, marginBottom: 6 }}>◔</div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--n700)' }}>Eventos registrales no disponibles</div>
          <div className="cs" style={{ marginTop: 4, marginBottom: 0 }}>Información en preparación.</div>
        </div>
      </section>
    );
  }
  return (
    <section className="panel on" data-testid="events-timeline">
      <div className="sec-h">Eventos societarios y BORME</div>
      <div className="sec-s">Cronología de hechos registrales publicados en el Boletín Oficial del Registro Mercantil.</div>
      <div className="tl">
        {items.map((ev, i) => (
          <div key={`${ev.date ?? i}-${i}`} className="ev i" data-testid={`events-item-${i}`}>
            <div className="mk" />
            <div className="c">
              <div className="th">
                <div>
                  <div className="t">{ev.type || 'Evento registral'}</div>
                  {fmtDate(ev.date ?? null) && <div className="m">{fmtDate(ev.date ?? null)}</div>}
                </div>
              </div>
              {ev.extract && <div style={{ fontSize: 14, color: 'var(--n800)', lineHeight: 1.55, marginTop: 6 }}>{ev.extract}</div>}
              {(ev.borme_section || ev.borme_province) && (
                <div style={{ fontSize: 10.5, color: 'var(--n500)', marginTop: 10, fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace', letterSpacing: 0.2 }}>
                  BORME · {[ev.borme_section, ev.borme_province].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* HARDENING-022c · Componente `IdentidadAmpliada` (Item 6.a legacy)
   + helpers `fmtYesNo` / `IdentityRow` retirados. Los 34 campos han sido
   consolidados en el card "Detalles de la compañía" (T5 del Resumen). */

/* ============================ PROPIEDAD (Refactor 1:1 mockup · HARDENING-018 · 2026-08-13) ============================
 * Fuente canónica: `mockup_propiedad.html` (`#ownSeg` + `#ownTree` + `#ownList` + `#ownGraph`).
 * Reproduce el mockup con estructura DOM y clases `.own-*` / `.owbar` / `.ig-*` calcadas.
 * Datos reales de `control_graph` v2 Intel (shape post-REQ 2026-08-13).
 * Rail "Operación activa" (aside.deal del mockup) NO se porta (directiva del usuario).
 * ================================================================================ */

/**
 * HARDENING-017 · ErrorBoundary local para la sección Propiedad.
 * Evita que un shape inesperado del payload Intel rompa toda la ficha. Loguea a
 * consola en dev y degrada la sección a `<Empty/>` en prod. NO silencia errores.
 */
interface ControlGraphErrorBoundaryProps { children: React.ReactNode }
interface ControlGraphErrorBoundaryState { hasError: boolean; error?: Error }
class ControlGraphErrorBoundary extends Component<ControlGraphErrorBoundaryProps, ControlGraphErrorBoundaryState> {
  constructor(props: ControlGraphErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error): ControlGraphErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[ControlGraphErrorBoundary] Propiedad section crashed:', error, info);
    }
  }
  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <section className="panel on" data-testid="control-graph-error-boundary">
          <div className="sec-h">Propiedad</div>
          <div className="sec-s">Quién es el dueño de la empresa, a quién controla ella y cómo se reparte la propiedad.</div>
          <Empty label="Estructura accionarial" />
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <div className="cs" style={{ marginTop: 8, color: 'var(--n500)', fontSize: 11 }}>
              [dev] {this.state.error.message}
            </div>
          )}
        </section>
      );
    }
    return this.props.children;
  }
}

/* ==== Type guards union ControlGraphBlock (shape v2 Intel) ==== */
function isOwnershipNominal(o: OwnershipBlock): o is OwnershipNominal {
  return o.available === true && Array.isArray((o as OwnershipNominal).shareholders);
}
function isOwnershipAggregated(o: OwnershipBlock): o is OwnershipAggregated {
  return o.available === true && typeof (o as OwnershipAggregated).summary === 'object'
    && typeof (o as OwnershipAggregated).summary?.total_shareholders === 'number';
}
function isControlGraphNominal(c: ControlGraphBlock): c is ControlGraphNominal {
  return c.available === true && Array.isArray((c as ControlGraphNominal).shareholders);
}
function isControlGraphAggregated(c: ControlGraphBlock): c is ControlGraphAggregated {
  return c.available === true && typeof (c as ControlGraphAggregated).summary === 'object'
    && typeof (c as ControlGraphAggregated).summary?.shareholders_count === 'number'
    && !Array.isArray((c as unknown as ControlGraphNominal).shareholders);
}
function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `${v.toLocaleString('es-ES', { maximumFractionDigits: 2 })}%`;
}
/** Paleta accionistas (extraída del mockup `.ownbar2 i` inline styles). */
const OWN_STAKE_COLORS = ['#FF5757', '#8a827a', '#cfc7bf', '#4E4E48', '#9A9A93', '#D6D6D0'];
/** Iniciales para el nodo central desde el legal_name (2 letras significativas). */
function initialsFromName(name: string | null | undefined): string {
  if (!name) return '—';
  const words = name.replace(/[.,·]/g, ' ').split(/\s+/).filter((w) => w.length >= 2);
  if (words.length === 0) return name.slice(0, 2).toUpperCase();
  if (words.length === 1) return (words[0] ?? '').slice(0, 2).toUpperCase();
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase();
}

type OwnTab = 'tree' | 'list' | 'graph';

/* ============================ Sub-blocks ============================ */

function OwnSegTabs({ active, setActive }: { active: OwnTab; setActive: (t: OwnTab) => void }) {
  const tabs: { id: OwnTab; label: string; icon: React.ReactNode }[] = [
    { id: 'tree', label: 'Árbol', icon: <Network size={13} strokeWidth={1.8} /> },
    { id: 'list', label: 'Distribución', icon: <BarChart3 size={13} strokeWidth={1.8} /> },
    { id: 'graph', label: 'Grafo', icon: <Target size={13} strokeWidth={1.8} /> },
  ];
  return (
    <div className="segtiny" id="ownSeg" data-testid="own-seg">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={active === t.id ? 'on' : ''}
          data-v={t.id}
          data-testid={`own-tab-${t.id}`}
          onClick={() => setActive(t.id)}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}

function OwnTreeView({ cg, identity }: { cg: ControlGraphNominal; identity: Record<string, unknown> | null }) {
  const shs = (Array.isArray(cg.shareholders) ? cg.shareholders : []).slice().sort((a, b) => (b?.pct ?? -1) - (a?.pct ?? -1));
  const subs = (Array.isArray(cg.subsidiaries) ? cg.subsidiaries : []).slice().sort((a, b) => (b?.pct ?? -1) - (a?.pct ?? -1));
  const legalName = (identity?.['legal_name'] as string | undefined)
    ?? (identity?.['name'] as string | undefined)
    ?? cg.company?.name
    ?? '—';
  const cif = (identity?.['cif'] as string | undefined) ?? cg.company?.cif ?? '—';
  const city = (identity?.['city'] as string | undefined) ?? '';
  const province = (identity?.['province'] as string | undefined) ?? '';
  const location = [city, province].filter(Boolean).join(city && province ? ' (' : '') + (city && province ? ')' : '');
  const initials = initialsFromName(legalName);

  return (
    <div id="ownTree" data-testid="own-tree">
      <div className="own-th"><b>Accionistas</b><span className="cnt">{shs.length}</span><span className="mut">· participan en</span></div>
      <div className="ownbar2">
        {shs.map((sh, i) => {
          const color = OWN_STAKE_COLORS[i] ?? OWN_STAKE_COLORS[OWN_STAKE_COLORS.length - 1];
          const pct = typeof sh?.pct === 'number' ? sh.pct : 0;
          return (
            <i
              key={`ob-${i}`}
              style={{ width: `${pct}%`, background: color }}
              title={`${sh?.name ?? '—'} · ${fmtPct(sh?.pct ?? null)}`}
              data-testid={`own-bar-seg-${i}`}
            />
          );
        })}
      </div>
      <div className="own-g">
        {shs.map((sh, i) => {
          const color = OWN_STAKE_COLORS[i] ?? OWN_STAKE_COLORS[OWN_STAKE_COLORS.length - 1];
          const isHl = i === 0 || !!sh?.is_ubo;
          return (
            <div key={`onode-${i}`} className={`onode${isHl ? ' hl' : ''}`} data-testid={`own-shareholder-${i}`} style={{ animation: `revUp .5s cubic-bezier(.2,.7,.3,1) ${80 + i * 60}ms both`, opacity: 0, transform: 'translateY(8px)' }}>
              <div>
                <span className="dot" style={{ background: color, borderRadius: sh?.type === 'legal' ? 2 : '50%' }} />
                <span className="nn">{sh?.name || '—'}</span>
              </div>
              <div className="nr">{sh?.label || (sh?.is_ubo ? 'UBO · titular real' : (sh?.type === 'legal' ? 'Persona jurídica' : 'Persona física'))}</div>
              <div className="np">{fmtPct(sh?.pct ?? null)}</div>
            </div>
          );
        })}
      </div>
      <div className="own-stem" />
      <div className="own-ent">
        <div className="box" data-testid="own-entity-central">
          <div className="lg">{initials}</div>
          <div>
            <div className="en">{legalName}</div>
            <div className="em">Holding · CIF {cif}{location ? ` · ${location}` : ''}</div>
          </div>
        </div>
      </div>
      <div className="own-stem" />
      <div className="own-th"><span className="mut">controla a ·</span><b>Empresas participadas</b><span className="cnt">{subs.length}</span></div>
      <div className="own-g">
        {subs.map((p, i) => {
          const isControl = typeof p?.pct === 'number' && p.pct >= 50;
          return (
            <a key={`pnode-${i}`} className="pnode" data-testid={`own-participation-${i}`} style={{ animation: `revUp .5s cubic-bezier(.2,.7,.3,1) ${140 + i * 60}ms both`, opacity: 0, transform: 'translateY(8px)' }}>
              <div className="ph">
                <div className="pi"><Network size={16} strokeWidth={1.8} /></div>
                <div className="pn">{p?.name || '—'}</div>
                <ExternalLink size={14} strokeWidth={1.8} style={{ color: 'var(--n400)' }} />
              </div>
              <div className="pr">
                <span className="pa">{p?.activity || '—'}</span>
                <span className={`pp ${isControl ? 'ctrl' : 'min'}`}>{fmtPct(p?.pct ?? null)}</span>
              </div>
            </a>
          );
        })}
      </div>
      {cg.narrative && (
        <div className="own-impl" data-testid="own-narrative">
          <span className="t" dangerouslySetInnerHTML={{ __html: cg.narrative.replace(/</g, '&lt;') }} />
          <a className="lk2" href="/es/oportunidades" data-testid="own-cta-explore">Explorar oportunidad →</a>
        </div>
      )}
    </div>
  );
}

function OwnListView({ cg }: { cg: ControlGraphNominal }) {
  const shs = Array.isArray(cg.shareholders) ? cg.shareholders : [];
  const subs = Array.isArray(cg.subsidiaries) ? cg.subsidiaries : [];
  const items: { tag: 'Accionista' | 'Participada'; name: string; pct: number | null; is_ubo?: boolean }[] = [
    ...shs.map((s) => ({ tag: 'Accionista' as const, name: (s?.name ?? '—') + (s?.is_ubo ? ' (UBO)' : ''), pct: typeof s?.pct === 'number' ? s.pct : null, is_ubo: !!s?.is_ubo })),
    ...subs.map((p) => ({ tag: 'Participada' as const, name: p?.name ?? '—', pct: typeof p?.pct === 'number' ? p.pct : null })),
  ];
  return (
    <div id="ownList" data-testid="own-list">
      {items.map((it, i) => {
        const w = typeof it.pct === 'number' ? Math.max(0, Math.min(100, it.pct)) : 0;
        const isSep = it.tag === 'Participada' && i > 0 && items[i - 1]?.tag === 'Accionista';
        return (
          <div key={`ow-${i}`} className="owbar" data-testid={`own-list-item-${i}`} style={isSep ? { marginTop: 8 } : undefined}>
            <span className="obn"><span className="obtag">{it.tag}</span>{it.name}</span>
            <span className="obt"><OwnBar pct={w} /></span>
            <span className="obp">{fmtPct(it.pct)}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ============ Interactive Control Graph (portado de `interactiveGraph` del mockup) ============ */

interface CGNodeIn { id: string; x: number; y: number; r: number; color: string; label: string; tip?: string; center?: boolean; expand?: CGExpandChild[]; }
interface CGExpandChild { id?: string; label: string; r?: number; color?: string; edgeColor?: string; edgeLabel?: string; dashed?: boolean }
interface CGEdgeIn { a: string; b: string; width?: number; color?: string; opacity?: number; dashed?: boolean; label?: string }

/**
 * Componente React que renderiza `interactiveGraph` del mockup con la misma
 * semántica imperativa (pan/zoom, hover-highlight, drag de nodo, expand+collapse).
 * Portado literalmente para preservar animaciones y comportamiento.
 * TODO Intel (REQ `PARA_INTEL_control_graph_expand.md`): consumir `expand[]` de
 * cada nodo tipo shareholder/ubo cuando Intel entregue el vecindario.
 */
function InteractiveControlGraph({ cfg, onNodeExpandPlaceholder }: { cfg: { w: number; h: number; nodes: CGNodeIn[]; edges: CGEdgeIn[] }; onNodeExpandPlaceholder?: (nodeId: string) => void }) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Limpiar cualquier render previo.
    el.innerHTML = '';

    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${cfg.w} ${cfg.h}`);
    svg.style.width = '100%';
    svg.style.height = 'auto';
    svg.style.touchAction = 'none';
    svg.style.userSelect = 'none';

    const gRoot = document.createElementNS(NS, 'g');
    const gE = document.createElementNS(NS, 'g');
    const gL = document.createElementNS(NS, 'g');
    const gN = document.createElementNS(NS, 'g');
    gRoot.appendChild(gE); gRoot.appendChild(gL); gRoot.appendChild(gN);
    svg.appendChild(gRoot);
    el.appendChild(svg);
    el.style.position = 'relative';

    const pos: Record<string, { x: number; y: number }> = {};
    const adj: Record<string, Set<string>> = {};
    const nodes: Record<string, { g: SVGGElement; c: SVGCircleElement; t: SVGTextElement; pl?: SVGTextElement }> = {};
    const edges: { e: CGEdgeIn; p: SVGPathElement; t: SVGTextElement | null }[] = [];
    const defs: Record<string, CGNodeIn & { _parent?: string }> = {};
    const expanded = new Set<string>();
    let idx = 0;

    const view = { tx: 0, ty: 0, s: 1 };
    const applyView = (anim: boolean) => {
      gRoot.style.transition = anim ? 'transform .35s cubic-bezier(.2,.7,.3,1)' : 'none';
      gRoot.setAttribute('transform', `translate(${view.tx} ${view.ty}) scale(${view.s})`);
    };

    const clientVB = (ev: PointerEvent | WheelEvent) => {
      const ctm = svg.getScreenCTM();
      if (!ctm) return { x: 0, y: 0 };
      const m = ctm.inverse();
      const p = svg.createSVGPoint();
      p.x = ev.clientX; p.y = ev.clientY;
      return p.matrixTransform(m);
    };

    const fit = (anim: boolean) => {
      const ks = Object.keys(pos);
      if (!ks.length) return;
      let mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9;
      ks.forEach((k) => {
        const p = pos[k]; const r = (defs[k]?.r || 20) + 18;
        if (!p) return;
        mnx = Math.min(mnx, p.x - r); mny = Math.min(mny, p.y - r);
        mxx = Math.max(mxx, p.x + r); mxy = Math.max(mxy, p.y + r);
      });
      const cw = mxx - mnx, ch = mxy - mny, pad = 10;
      let s = Math.min((cfg.w - pad * 2) / cw, (cfg.h - pad * 2) / ch);
      s = Math.max(.35, Math.min(s, 1.6));
      view.s = s;
      view.tx = (cfg.w - cw * s) / 2 - mnx * s;
      view.ty = (cfg.h - ch * s) / 2 - mny * s;
      applyView(anim);
    };
    const zoomAt = (vx: number, vy: number, f: number) => {
      const ns = Math.max(.3, Math.min(2.4, view.s * f));
      view.tx = vx - (vx - view.tx) * (ns / view.s);
      view.ty = vy - (vy - view.ty) * (ns / view.s);
      view.s = ns;
      applyView(false);
    };

    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const v = clientVB(ev);
      zoomAt(v.x, v.y, ev.deltaY < 0 ? 1.12 : 0.89);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });

    let panning = false, panStart: { x: number; y: number; tx: number; ty: number } | null = null;
    const onPointerDown = (ev: PointerEvent) => {
      const t = ev.target as HTMLElement | null;
      if (t && t.closest && t.closest('.ig-node')) return;
      panning = true; panStart = { x: ev.clientX, y: ev.clientY, tx: view.tx, ty: view.ty };
      svg.style.cursor = 'grabbing';
    };
    const onPointerMove = (ev: PointerEvent) => {
      if (!panning || !panStart) return;
      const sc = svg.getBoundingClientRect().width / cfg.w || 1;
      view.tx = panStart.tx + (ev.clientX - panStart.x) / sc;
      view.ty = panStart.ty + (ev.clientY - panStart.y) / sc;
      applyView(false);
    };
    const onPointerUp = () => { panning = false; svg.style.cursor = ''; };
    svg.addEventListener('pointerdown', onPointerDown);
    svg.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const ctl = document.createElement('div');
    ctl.className = 'ig-ctl';
    ctl.setAttribute('data-testid', 'own-graph-ctl');
    ctl.innerHTML = '<button data-z="in" aria-label="Zoom in">+</button><button data-z="out" aria-label="Zoom out">−</button><button data-z="fit" title="Ajustar" aria-label="Ajustar">⤢</button>';
    el.appendChild(ctl);
    const onCtl = (ev: MouseEvent) => {
      const b = (ev.target as HTMLElement).closest('button') as HTMLButtonElement | null;
      if (!b) return;
      if (b.dataset.z === 'fit') fit(true);
      else zoomAt(cfg.w / 2, cfg.h / 2, b.dataset.z === 'in' ? 1.2 : 0.83);
    };
    ctl.addEventListener('click', onCtl);

    function addEdge(e: CGEdgeIn) {
      adj[e.a] = adj[e.a] || new Set(); adj[e.b] = adj[e.b] || new Set();
      adj[e.a]!.add(e.b); adj[e.b]!.add(e.a);
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('class', 'ig-edge');
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', e.color || '#FF5757');
      p.setAttribute('stroke-width', String(e.width || 1.6));
      p.setAttribute('stroke-linecap', 'round');
      p.dataset.op = String(e.opacity != null ? e.opacity : .5);
      p.setAttribute('opacity', p.dataset.op);
      if (e.dashed) p.setAttribute('stroke-dasharray', '4 4');
      gE.appendChild(p);
      let t: SVGTextElement | null = null;
      if (e.label) {
        t = document.createElementNS(NS, 'text');
        t.setAttribute('font-size', '9.5');
        t.setAttribute('fill', '#9A9A93');
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('pointer-events', 'none');
        t.textContent = e.label;
        gL.appendChild(t);
      }
      edges.push({ e, p, t });
    }
    function addNode(n: CGNodeIn & { _parent?: string }) {
      if (nodes[n.id]) return;
      pos[n.id] = { x: n.x, y: n.y };
      adj[n.id] = adj[n.id] || new Set();
      defs[n.id] = n;
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'ig-node');
      g.style.setProperty('--d', ((idx++) * 0.05) + 's');
      g.style.cursor = (n.expand && n.expand.length) ? 'pointer' : 'grab';
      const tip = n.tip || '';
      if (tip) g.setAttribute('data-tip', tip);
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', String(n.r));
      c.setAttribute('fill', n.color);
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('pointer-events', 'none');
      if (n.center) { t.setAttribute('font-size', '12'); t.setAttribute('font-weight', '800'); t.setAttribute('fill', '#fff'); }
      else { t.setAttribute('font-size', '10.5'); t.setAttribute('fill', '#4E4E48'); }
      t.textContent = n.label;
      g.appendChild(c);
      let pl: SVGTextElement | undefined;
      if (n.expand && n.expand.length) {
        pl = document.createElementNS(NS, 'text');
        pl.setAttribute('class', 'ig-plus');
        pl.setAttribute('text-anchor', 'middle');
        pl.setAttribute('pointer-events', 'none');
        pl.setAttribute('fill', '#fff');
        pl.setAttribute('font-size', '13');
        pl.setAttribute('font-weight', '800');
        pl.textContent = '+';
        g.appendChild(pl);
        nodes[n.id] = { g, c, t, pl };
      } else {
        nodes[n.id] = { g, c, t };
      }
      g.appendChild(t);
      gN.appendChild(g);

      g.addEventListener('mouseenter', () => hl(n.id));
      g.addEventListener('mouseleave', () => hl(null));
      let drag = false, moved = false;
      g.addEventListener('pointerdown', (ev) => { drag = true; moved = false; g.setPointerCapture((ev as PointerEvent).pointerId); });
      g.addEventListener('pointermove', (ev) => {
        if (!drag) return;
        moved = true;
        (ev as PointerEvent).stopPropagation();
        const ctm = gRoot.getScreenCTM();
        if (!ctm) return;
        const m = ctm.inverse();
        const pt = svg.createSVGPoint();
        pt.x = (ev as PointerEvent).clientX;
        pt.y = (ev as PointerEvent).clientY;
        const lp = pt.matrixTransform(m);
        pos[n.id] = { x: lp.x, y: lp.y };
        redraw();
      });
      g.addEventListener('pointerup', () => {
        drag = false;
        if (!moved) {
          // HARDENING-018 · Si el nodo tiene `expand` poblado → despliega vecindario.
          // Si no → placeholder callback (REQ Intel `PARA_INTEL_control_graph_expand.md`).
          if (n.expand && n.expand.length) expandNode(n.id);
          else if (onNodeExpandPlaceholder) onNodeExpandPlaceholder(n.id);
        }
      });
    }

    function expandNode(id: string) {
      const def = defs[id];
      if (!def || !def.expand || !def.expand.length) return;
      if (expanded.has(id)) { collapse(id); return; }
      expanded.add(id);
      const par = pos[id];
      if (!par) return;
      const cxg = cfg.w / 2, cyg = cfg.h / 2;
      let base = Math.atan2(par.y - cyg, par.x - cxg);
      if (!isFinite(base)) base = 0;
      const k = def.expand.length;
      const spread = Math.min(Math.PI * 0.9, 0.6 * k);
      const dist = 88;
      def.expand.forEach((ch, i) => {
        const ang = base + (k > 1 ? (i - (k - 1) / 2) * (spread / (k - 1)) : 0);
        const cid = id + '::' + (ch.id || i);
        addNode({
          id: cid,
          x: par.x + Math.cos(ang) * dist,
          y: par.y + Math.sin(ang) * dist,
          r: ch.r ?? 15,
          color: ch.color ?? '#7aa0e0',
          label: ch.label,
          _parent: id,
        } as CGNodeIn & { _parent: string });
        addEdge({ a: id, b: cid, color: ch.edgeColor || '#FF5757', width: 1.5, opacity: .4, dashed: ch.dashed, label: ch.edgeLabel });
      });
      redraw(); fit(true);
    }
    function collapse(id: string) {
      expanded.delete(id);
      Object.keys(nodes).forEach((k) => {
        if (defs[k] && defs[k]!._parent === id) {
          if (expanded.has(k)) collapse(k);
          nodes[k]!.g.remove();
          delete nodes[k]; delete pos[k]; delete defs[k];
        }
      });
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i]!.e;
        if (!pos[e.a] || !pos[e.b]) {
          edges[i]!.p.remove();
          const et = edges[i]!.t;
          if (et) et.remove();
          edges.splice(i, 1);
        }
      }
      redraw(); fit(true);
    }
    function redraw() {
      edges.forEach(({ e, p, t }) => {
        const a = pos[e.a], b = pos[e.b];
        if (!a || !b) return;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2 - Math.min(40, Math.hypot(b.x - a.x, b.y - a.y) * 0.12);
        p.setAttribute('d', `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`);
        if (t) { t.setAttribute('x', String(mx)); t.setAttribute('y', String(my)); }
      });
      Object.keys(nodes).forEach((k) => {
        const p = pos[k]; const o = nodes[k]; const n = defs[k];
        if (!p || !o || !n) return;
        o.c.setAttribute('cx', String(p.x)); o.c.setAttribute('cy', String(p.y));
        o.t.setAttribute('x', String(p.x)); o.t.setAttribute('y', String(n.center ? p.y + 4 : p.y + n.r + 14));
        if (o.pl) { o.pl.setAttribute('x', String(p.x + n.r - 3)); o.pl.setAttribute('y', String(p.y - n.r + 7)); o.pl.style.display = expanded.has(k) ? 'none' : ''; }
      });
    }
    function hl(id: string | null) {
      if (id == null) {
        edges.forEach(({ p }) => { p.setAttribute('opacity', p.dataset.op || '0.5'); p.classList.remove('ig-hot'); });
        Object.values(nodes).forEach((o) => o?.g.classList.remove('ig-dim'));
        return;
      }
      edges.forEach(({ e, p }) => {
        const on = e.a === id || e.b === id;
        p.setAttribute('opacity', on ? '0.95' : '0.08');
        p.classList.toggle('ig-hot', on);
      });
      Object.keys(nodes).forEach((k) => {
        const near = k === id || !!(adj[id] && adj[id].has(k));
        nodes[k]?.g.classList.toggle('ig-dim', !near);
      });
    }

    cfg.nodes.forEach(addNode);
    cfg.edges.forEach(addEdge);
    redraw();

    return () => {
      svg.removeEventListener('wheel', onWheel);
      svg.removeEventListener('pointerdown', onPointerDown);
      svg.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      ctl.removeEventListener('click', onCtl);
      if (el) el.innerHTML = '';
    };
  }, [cfg, onNodeExpandPlaceholder]);

  return <div ref={containerRef} id="controlGraph" data-testid="own-graph-container" />;
}

function OwnGraphView({ cg }: { cg: ControlGraphNominal }) {
  const [placeholder, setPlaceholder] = useState<string | null>(null);
  // Mapea `control_graph.graph.nodes/edges` v2 Intel al shape del interactiveGraph.
  const cfg = useMemo(() => {
    const RED = '#FF5757', DARK = '#0C0C0E', INFO = '#4E4E48', SUB = '#5a544e';
    const graphNodes = cg.graph?.nodes ?? [];
    const graphEdges = cg.graph?.edges ?? [];
    if (!graphNodes.length) return null;

    // Layout determinístico: shareholders arriba, company centro, subs abajo.
    const center = graphNodes.find((n) => n?.kind === 'company');
    const shs = graphNodes.filter((n) => n?.kind === 'shareholder' || n?.kind === 'ubo');
    const subs = graphNodes.filter((n) => n?.kind === 'subsidiary');
    const W = 680, H = 290;

    const nodesMapped: CGNodeIn[] = [];
    if (center) {
      nodesMapped.push({ id: center.id, x: 330, y: 150, r: 36, color: RED, label: (center.label ?? '').slice(0, 12), center: true, tip: `<b>${center.label ?? ''}</b>` });
    }
    shs.forEach((n, i) => {
      const spacing = W / (shs.length + 1);
      nodesMapped.push({
        id: n.id, x: spacing * (i + 1), y: 44, r: n.kind === 'ubo' ? 24 : 20,
        color: n.kind === 'ubo' ? DARK : INFO,
        label: (n.label ?? '').slice(0, 16),
        tip: `<span class='tl'>${n.kind === 'ubo' ? 'UBO · titular real' : 'Accionista'}</span><b>${n.label ?? ''}</b>`,
        // TODO Intel · REQ `PARA_INTEL_control_graph_expand.md`: consumir n.expand[] cuando Intel lo emita.
        expand: undefined,
      });
    });
    subs.forEach((n, i) => {
      const spacing = W / (subs.length + 1);
      nodesMapped.push({
        id: n.id, x: spacing * (i + 1), y: 250, r: 20, color: SUB,
        label: (n.label ?? '').slice(0, 14),
        tip: `<b>${n.label ?? ''}</b>`,
      });
    });

    const edgesMapped: CGEdgeIn[] = graphEdges
      .filter((e) => e && e.from && e.to)
      .map((e) => ({
        a: e.from, b: e.to,
        width: typeof e.pct === 'number' && e.pct >= 50 ? 2.4 : 1.8,
        opacity: typeof e.pct === 'number' && e.pct >= 50 ? 0.7 : 0.45,
        label: typeof e.pct === 'number' ? `${Math.round(e.pct)}%` : undefined,
      }));

    return { w: W, h: H, nodes: nodesMapped, edges: edgesMapped };
  }, [cg]);

  const onPlaceholder = React.useCallback((nodeId: string) => {
    setPlaceholder(nodeId);
    window.setTimeout(() => setPlaceholder((cur) => cur === nodeId ? null : cur), 3200);
  }, []);

  return (
    <div id="ownGraph" data-testid="own-graph">
      {cfg
        ? <InteractiveControlGraph cfg={cfg} onNodeExpandPlaceholder={onPlaceholder} />
        : <Empty label="Grafo de control" />
      }
      {placeholder && (
        <div className="own-impl" data-testid="own-graph-neighborhood-pending" style={{ marginTop: 12 }}>
          <span className="t">Vecindario en preparación · en cuanto Intel publique el mapa de participaciones cruzadas del nodo seleccionado, se desplegarán aquí sus conexiones.</span>
        </div>
      )}
    </div>
  );
}

function PropiedadControlGraph({ cg, identity }: { cg: ControlGraphBlock; identity: Record<string, unknown> | null }) {
  const [tab, setTab] = useState<OwnTab>('tree');

  // Estado no disponible.
  if (cg.available === false) {
    return (
      <section className="panel on" data-testid="own-empty">
        <div className="sec-h">Propiedad</div>
        <div className="sec-s">Quién es el dueño de la empresa, a quién controla ella y cómo se reparte la propiedad.</div>
        <Empty label="Estructura accionarial" />
      </section>
    );
  }
  // Anónimo agregado · CTA login (decisión HARDENING-018: no mostrar tarjetas "anónimas" fabricadas · R15).
  if (isControlGraphAggregated(cg)) {
    const s = cg.summary;
    return (
      <section className="panel on" data-testid="own-aggregated">
        <div className="sec-h">Propiedad</div>
        <div className="sec-s">Quién es el dueño de la empresa, a quién controla ella y cómo se reparte la propiedad.</div>
        <div className="card">
          <h3><span className="k" />Estructura de propiedad y control</h3>
          <div className="cs">Vista agregada · el detalle nominal se muestra a usuarios registrados</div>
          <div className="idrow" data-testid="own-summary-shareholders"><span className="k">Accionistas registrados</span><span className="v"><b>{fmtNum(s.shareholders_count)}</b></span></div>
          <div className="idrow" data-testid="own-summary-participations"><span className="k">Participadas registradas</span><span className="v"><b>{fmtNum(s.participations_count)}</b></span></div>
          <div className="cs" style={{ marginTop: 14, fontStyle: 'italic' }}>
            <Lock size={12} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 6 }} />
            <a href="/es/login" style={{ color: 'var(--red)', fontWeight: 600, textDecoration: 'none' }}>Iniciar sesión</a> para ver accionistas, participadas y grafo de control.
          </div>
        </div>
      </section>
    );
  }
  if (isControlGraphNominal(cg)) {
    return (
      <section className="panel on" data-testid="own-nominal">
        <div className="sec-h">Propiedad</div>
        <div className="sec-s">Quién es el dueño de la empresa, a quién controla ella y cómo se reparte la propiedad.</div>
        <div className="card">
          <h3><span className="k" />Estructura de propiedad y control <span style={{ fontSize: 11, color: 'var(--n400)', fontWeight: 500 }}>· matriz última → participadas</span></h3>
          <div className="cs">Elige la visualización — accionistas (arriba) → compañía → participadas (abajo)</div>
          <OwnSegTabs active={tab} setActive={setTab} />
          {tab === 'tree' && <OwnTreeView cg={cg} identity={identity} />}
          {tab === 'list' && <OwnListView cg={cg} />}
          {tab === 'graph' && <OwnGraphView cg={cg} />}
        </div>
      </section>
    );
  }
  return (
    <section className="panel on" data-testid="own-unknown">
      <div className="sec-h">Propiedad</div>
      <Empty label="Estructura accionarial" />
    </section>
  );
}

function Propiedad({ ownership, controlGraph, identity }: { ownership?: OwnershipBlock | null; controlGraph?: ControlGraphBlock | null; identity?: Record<string, unknown> | null }) {
  // HARDENING-014/018: prioriza `control_graph` (fuente canónica del mockup).
  // Fallback a `ownership` legacy sólo si `control_graph` es null.
  if (controlGraph) {
    return <PropiedadControlGraph cg={controlGraph} identity={identity ?? null} />;
  }
  if (!ownership || ownership.available !== true) {
    return (
      <section className="panel on" data-testid="ownership-empty">
        <div className="sec-h">Propiedad</div>
        <div className="sec-s">Quién es el dueño de la empresa, a quién controla ella y cómo se reparte la propiedad.</div>
        <Empty label="Estructura accionarial" />
      </section>
    );
  }
  if (isOwnershipAggregated(ownership)) {
    const s = ownership.summary;
    return (
      <section className="panel on" data-testid="ownership-aggregated">
        <div className="sec-h">Propiedad</div>
        <div className="sec-s">Quién es el dueño de la empresa, a quién controla ella y cómo se reparte la propiedad.</div>
        <div className="card">
          <h3><span className="k" />Vista agregada</h3>
          <div className="cs">Datos no identificativos · el detalle nominal se muestra a usuarios registrados</div>
          <div className="idrow"><span className="k">Accionistas registrados</span><span className="v"><b>{fmtNum(s.total_shareholders)}</b></span></div>
          <div className="cs" style={{ marginTop: 12, fontStyle: 'italic' }}>
            <Lock size={12} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 6 }} />
            <a href="/es/login" style={{ color: 'var(--red)', fontWeight: 600, textDecoration: 'none' }}>Iniciar sesión</a> para ver el detalle nominal completo.
          </div>
        </div>
      </section>
    );
  }
  if (isOwnershipNominal(ownership)) {
    const shs = [...ownership.shareholders].sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));
    return (
      <section className="panel on" data-testid="ownership-nominal">
        <div className="sec-h">Propiedad</div>
        <div className="sec-s">Accionariado y estructura de control según fuentes registrales.</div>
        <div className="card">
          <h3><span className="k" />Accionistas</h3>
          <div className="cs">{shs.length} accionista{shs.length === 1 ? '' : 's'} registrado{shs.length === 1 ? '' : 's'} · ordenados por participación descendente</div>
          {shs.length > 0 ? (
            <table className="rec" data-testid="ownership-shareholders-table">
              <tbody>
                <tr><th>Nombre</th><th>CIF/NIF</th><th style={{ textAlign: 'right' }}>Participación</th></tr>
                {shs.map((sh, i) => (
                  <tr key={`${sh.name}-${i}`} data-testid={`ownership-shareholder-${i}`}>
                    <td>{sh.name || '—'}</td>
                    <td>{sh.cif || '—'}</td>
                    <td style={{ textAlign: 'right' }}>{fmtPct(sh.pct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty label="Accionistas" />}
        </div>
      </section>
    );
  }
  return (
    <section className="panel on" data-testid="ownership-unknown">
      <div className="sec-h">Propiedad</div>
      <Empty label="Estructura accionarial" />
    </section>
  );
}


/* ============================ GOBIERNO ============================ */
/**
 * B-2.3 · Órgano de administración.
 * Union type discriminado desde backend:
 *   - `available:false` → <Empty/> Corporate Finance.
 *   - `summary` presente (anónimo DPD) → tabla agregada rol/count.
 *   - `officers` presente (autenticado) → tabla nominal role/name/since/year.
 * R11 (Frontend Freeze): usamos los mismos primitivos del mockup (`.card`,
 * `.rec` table, `.chip`). R15: cero derivación; solo pintamos lo que llega.
 */
function isGovernanceNominal(g: GovernanceBlock): g is GovernanceNominal {
  return g.available === true && Array.isArray((g as GovernanceNominal).officers);
}
function isGovernanceAggregated(g: GovernanceBlock): g is GovernanceAggregated {
  return g.available === true && typeof (g as GovernanceAggregated).summary === 'object'
    && Array.isArray((g as GovernanceAggregated).summary?.roles);
}
function Gobierno({ governance }: { governance?: GovernanceBlock | null }) {
  if (!governance || governance.available !== true) {
    return (
      <section className="panel on" data-testid="gobierno-empty">
        <div className="sec-h">Gobierno</div>
        <div className="sec-s">Órgano de administración y apoderamientos vigentes según registros públicos.</div>
        <Empty label="Órgano de administración" />
      </section>
    );
  }
  if (isGovernanceAggregated(governance)) {
    const roles = governance.summary.roles ?? [];
    const total = governance.summary.total ?? 0;
    return (
      <section className="panel on" data-testid="gobierno-aggregated">
        <div className="sec-h">Gobierno</div>
        <div className="sec-s">Órgano de administración y apoderamientos vigentes según registros públicos.</div>
        <div className="card">
          <h3><span className="k" />Composición del órgano</h3>
          <div className="cs">Vista agregada por cargo · {total} personas físicas identificadas en fuentes registrales</div>
          {roles.length > 0 ? (
            <table className="rec" data-testid="gobierno-roles-table">
              <tbody>
                <tr><th>Cargo</th><th style={{ textAlign: 'right' }}>Personas</th></tr>
                {roles.map((r) => (
                  <tr key={r.role} data-testid={`gobierno-role-${r.role}`}>
                    <td>{r.role_label}</td>
                    <td style={{ textAlign: 'right' }}><b>{fmtNum(r.count)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty label="Cargos vigentes" />}
          <div className="cs" style={{ marginTop: 12, fontStyle: 'italic' }}>
            <Lock size={12} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 6 }} />
            Los nombres nominales están disponibles para usuarios registrados.
          </div>
        </div>
      </section>
    );
  }
  if (isGovernanceNominal(governance)) {
    const officers = governance.officers ?? [];
    return (
      <section className="panel on" data-testid="gobierno-nominal">
        <div className="sec-h">Gobierno</div>
        <div className="sec-s">Órgano de administración y apoderamientos vigentes según registros públicos.</div>
        <div className="card">
          <h3><span className="k" />Cargos vigentes</h3>
          <div className="cs">{officers.length} personas físicas · fuentes registrales verificadas</div>
          {officers.length > 0 ? (
            <table className="rec" data-testid="gobierno-officers-table">
              <tbody>
                <tr><th>Nombre</th><th>Cargo</th><th style={{ textAlign: 'right' }}>Desde</th></tr>
                {officers.map((o, i) => (
                  <tr key={`${o.name}-${i}`} data-testid={`gobierno-officer-${i}`}>
                    <td>{o.name || '—'}</td>
                    <td>{o.role_label_es ?? o.role_es ?? o.role ?? '—'}</td>
                    <td style={{ textAlign: 'right' }}>{fmtDate(o.since) ?? (o.year != null ? String(o.year) : '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty label="Cargos vigentes" />}
        </div>
      </section>
    );
  }
  // Shape desconocido (should be unreachable · defensivo).
  return (
    <section className="panel on" data-testid="gobierno-unknown">
      <div className="sec-h">Gobierno</div>
      <Empty label="Órgano de administración" />
    </section>
  );
}

/* ============================ OPORTUNIDADES ============================ */
/**
 * HARDENING-020 (2026-08-13) · Canon Narrativa CF · Anexo B (Oportunidades) aplicado:
 *   · "Puntuación 0–100 de cada tesis" → RETIRADO. Copy CF: "Atractivo por tesis."
 *     La barra sigue mostrando la magnitud proporcional; el número absoluto (`db > i`)
 *     se preserva sólo como atributo `data-score` para debug.
 *   · Tesis = `o.name` (nombre en prosa, ya emitido por Intel). Nunca
 *     `recommendation_type` crudo.
 *   · Reason = prosa Intel (ya llega ES).
 *   · Acciones → labels ES via `OPP_ACTION_LABEL_ES` (superset de las de Señales
 *     más las específicas de deal · `request_due_diligence`, `value`, `contact`).
 *     Sin "→".
 *   · Subtítulo sección = copy literal Anexo B / Corporate Finance.
 */
const OPP_ACTION_LABEL_ES: Record<string, string> = {
  analyze: 'Analizar',
  value: 'Valorar',
  request_due_diligence: 'Solicitar due diligence',
  contact: 'Contactar',
  compare: 'Comparar',
  add_to_watchlist: 'Añadir a seguimiento',
  prepare_teaser: 'Preparar teaser',
  find_buyer: 'Buscar comprador',
  save: 'Guardar',
  share: 'Compartir',
  export: 'Exportar',
  dismiss: 'Descartar',
};

/**
 * HARDENING-020-fix (2026-08-13) · Prosa CF ES a partir de campos estructurados
 * (Escenario A del brief). El `opportunity.reason` de Intel es texto crudo con
 * tokens técnicos (`opportunity`, `acquisition_target`, `0.083638`) — se
 * descarta por completo (R15: no parsear el string con regex).
 *
 * En su lugar leemos `opportunity.fit_dimensions.{strategic_fit,financial_fit,
 * semantic_fit}` cada uno con `{value, evidence[], sources[]}` y componemos
 * frases CF con vocabulario controlado local (mapa mínimo).
 *
 * TODO CANON · consumir `opportunity.reason_narrative_cf` cuando Intel lo
 * emita (mismo patrón que `sector.narrative`, `geo.narrative`, etc.) y
 * retirar este helper — REQ pendiente de emitir.
 */
type FitEntry = { value?: number | null; evidence?: string[] | null };
function _findEvidenceFlag(entries: string[] | null | undefined, key: string): boolean | null {
  if (!Array.isArray(entries)) return null;
  const prefix = `${key}=`;
  const hit = entries.find((e) => typeof e === 'string' && e.startsWith(prefix));
  if (!hit) return null;
  const v = hit.slice(prefix.length).trim().toLowerCase();
  if (v === 'true') return true;
  if (v === 'false') return false;
  return null;
}
function _fitBand(value: number | null | undefined, kind: 'strategic' | 'semantic' | 'financial'): string | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  // Escala Intel [0..1]. Umbrales del canon Anexo B para bandas cualitativas.
  const pct = value <= 1 ? value * 100 : value;
  if (kind === 'financial') {
    if (pct >= 70) return 'buen encaje financiero';
    if (pct >= 40) return 'encaje financiero moderado';
    return 'encaje financiero ajustado';
  }
  if (kind === 'semantic') {
    if (pct >= 70) return 'alta afinidad estratégica';
    if (pct >= 40) return 'afinidad moderada';
    return 'afinidad ligera';
  }
  // strategic
  if (pct >= 70) return 'alta compatibilidad estratégica';
  if (pct >= 40) return 'compatibilidad estratégica moderada';
  return 'compatibilidad estratégica ligera';
}
function formatOpportunityReason(opp: BuyerItem): string | null {
  const dims = opp.fit_dimensions as unknown as Record<string, FitEntry> | null;
  if (!dims || typeof dims !== 'object') return null;
  const strategic = dims.strategic_fit ?? null;
  const financial = dims.financial_fit ?? null;
  const semantic = dims.semantic_fit ?? null;
  const parts: string[] = [];
  // 1) Sector match (proviene de strategic_fit.evidence).
  const sameSector = _findEvidenceFlag(strategic?.evidence ?? null, 'same_sector');
  if (sameSector === true) parts.push('mismo sector');
  else if (sameSector === false) parts.push('sector adyacente');
  // 2) Semantic fit → afinidad.
  const semBand = _fitBand(semantic?.value ?? null, 'semantic');
  if (semBand) parts.push(semBand);
  // 3) Financial fit → encaje financiero.
  const finBand = _fitBand(financial?.value ?? null, 'financial');
  if (finBand) parts.push(finBand);
  if (!parts.length) return null;
  // Capitaliza la primera letra de la primera parte.
  const head = parts[0]!;
  const capitalized = head.charAt(0).toUpperCase() + head.slice(1);
  const rest = parts.slice(1);
  return rest.length ? `${capitalized}, ${rest.join(', ')}.` : `${capitalized}.`;
}

function Oportunidades({ opportunities }: { opportunities?: RecommendationSet | null }) {
  const items = opportunities?.recommendations ?? [];
  if (!items.length) return <Pending label="Oportunidades" />;
  return (
    <section className="panel on" data-testid="oportunidades-section">
      <div className="sec-h">Oportunidades</div>
      <div className="sec-s">Las jugadas que tienen sentido para esta empresa, ordenadas por lo atractivas que son.</div>
      <div className="card">
        <h3><span className="k" />Atractivo por dimensión estratégica</h3>
        <div className="cs">Atractivo por tesis para esta compañía.</div>
        {items.map((o, i) => {
          const v = clamp100(o.score) ?? 0;
          const label = o.name ?? 'Tesis';
          return (
            <div key={o.master_id ?? i} className="dim" data-testid={`opp-dim-${i}`} data-score={v}>
              <span className="dn">{label}</span>
              <span className="db"><i style={{ width: `${v}%` }} /></span>
              <span className="dv">{qualitativeBand(v)}</span>
            </div>
          );
        })}
      </div>
      <div className="row r2">
        {items.slice(0, 2).map((o, i) => {
          // HARDENING-020-fix · Prosa CF construida desde `fit_dimensions` (R15-safe · sin regex sobre `reason` crudo).
          const prose = formatOpportunityReason(o);
          return (
          <div key={i} className="card" data-testid={`opp-card-${i}`}>
            <h3><span className="k" />{o.name ?? 'Tesis'}</h3>
            {prose && <p style={{ fontSize: 13.5, color: 'var(--n700)', lineHeight: 1.6 }} data-testid={`opp-card-${i}-reason`}>{prose}</p>}
            {(o.recommended_actions?.length ?? 0) > 0 && Array.isArray(o.recommended_actions) && (
              <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }} data-testid={`opp-card-${i}-actions`}>
                {(o.recommended_actions ?? []).map((a, j) => (
                  <span
                    key={j}
                    className="sact"
                    data-action={a}
                    style={{ padding: '3px 10px', border: '1px solid var(--n200)', borderRadius: 6, fontSize: 11.5, color: 'var(--n700)', background: 'var(--n0)' }}
                  >
                    {OPP_ACTION_LABEL_ES[a] ?? a}
                  </span>
                ))}
              </div>
            )}
          </div>
          );
        })}
      </div>
    </section>
  );
}

/* ============================ COPILOT ============================ */
/* HARDENING-026 · Eliminado el composer interno muerto (`Copilot`) + los
 * helpers `AtMark`/`AT_GRID`. El Copilot canónico es ahora el `CopilotDock`
 * reskinneado como barra inferior anclada (Regla 1 · Sprint 1 · e1_tester
 * `data-testid="composer"`). Ver `components/copilot/CopilotDock.tsx` +
 * philosophy §12. Los 3 chips inertes que había aquí (`Prepárame un teaser`,
 * `Riesgos para el comprador`, `¿Quién me la compraría?`) fabricaban texto
 * fuera de Intel y violaban R15 → retirados. Los chips reales viven en
 * `opportunity.chips[]` (T1 header) y disparan `prefillComposer()`. */

/* ============================ LAYOUT ============================ */
/**
 * HARDENING-022 · Extrae el nombre del auditor desde `governance` (union type
 * nominal). Regla R15: retorna null si no consta o si el shape no expone
 * `officers[]` con rol de tipo auditor. Cero fabricación.
 */
function extractAuditorName(governance: GovernanceBlock | null | undefined): string | null {
  if (!governance) return null;
  const gov = governance as unknown as { officers?: Array<Record<string, unknown>> };
  const officers = gov?.officers;
  if (!Array.isArray(officers)) return null;
  const AUDITOR_KEYWORDS = ['auditor', 'auditor de cuentas', 'auditoría', 'auditoria'];
  for (const off of officers) {
    const role = String(
      (off?.['role_label_es'] as string | undefined)
      ?? (off?.['role_label'] as string | undefined)
      ?? (off?.['role'] as string | undefined)
      ?? '',
    ).toLowerCase();
    if (!role) continue;
    if (AUDITOR_KEYWORDS.some((k) => role.includes(k))) {
      const name = (off?.['name'] as string | undefined) ?? null;
      if (name && name.trim()) return name.trim();
    }
  }
  return null;
}

export function CompanyFichaLayoutV2(props: CompanyFichaLayoutV2Props) {
  const identityRaw = props.identity;
  // HARDENING-025 · Item 3 · handle imperativo para dispatch de chips al Copilot.
  const { prefillComposer } = useCopilot();
  // HARDENING-022b · enriquecer identity con:
  //   • `auditor_name` desde `identity.auditor` (adapter) o fallback governance.
  //   • `has_financials` desde `financialAnalysis.has_financials` (Intel emite
  //     `finances.has_financials`; el badge Verificada requiere ambos flags).
  const identity: IdentitySection = useMemo(() => ({
    ...identityRaw,
    auditor_name: identityRaw.auditor_name ?? extractAuditorName(props.governance),
    has_financials: identityRaw.has_financials ?? props.financialAnalysis?.has_financials ?? null,
  }), [identityRaw, props.governance, props.financialAnalysis?.has_financials]);
  const anon = props.authenticated === false;
  const [active, setActive] = useState<SectionId>('resumen');
  const [collapsed, setCollapsed] = useState(false);

  const name = identity.legal_name ?? identity.cif_normalized ?? 'Empresa';
  // HARDENING-037 · `cif` en scope del componente principal para poder pasarlo
  // al context del sectionRegistry (Committee proxy). Prefiere `cif_normalized`
  // (canónico) y cae a `cif` bruto si el normalizado no está.
  const cif = identity.cif_normalized ?? (identity as { cif?: string | null }).cif ?? '';
  const cls = identity.classification;
  const grps = ['Perfil', 'Inteligencia', 'Fuentes'];

  return (
    <div className="afk">
      <style>{FICHA_MOCKUP_CSS}</style>
      <style>{`abbr[title]{text-decoration:underline dotted;text-underline-offset:3px;cursor:help}`}</style>
      <style>{PROPIEDAD_MOCKUP_CSS}</style>
      <style>{`@keyframes cg-fade-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}@keyframes cg-scale-in{from{opacity:0;transform:scale(.75)}to{opacity:1;transform:scale(1)}}`}</style>
      <div className="wrap">
        <div className="crumb">Analizar / Empresas / <b>{name}</b></div>
        <div className="chead" data-testid="company-header">
          <div className="clogo">{name.slice(0, 2).toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* HARDENING-022 T1 · Nombre + badges (mercantil, Verificada, Auditada) */}
            <h1>
              {name}
              {identity.registry_status?.mercantile_status && (
                <span className="vbadge v" data-testid="header-badge-mercantile">● {identity.registry_status.mercantile_status}</span>
              )}
              {/* Badge Verificada: cuentas depositadas y verificadas en fuente oficial.
                  R15: sólo si Intel emite ambos flags `verified=true` AND `has_financials=true`. */}
              {identity.verified === true && identity.has_financials === true && (
                <span
                  className="vbadge v"
                  data-testid="header-badge-verified"
                  data-tip="Cuentas depositadas y verificadas en fuente oficial (registral)."
                  tabIndex={0}
                >
                  ● Verificada
                </span>
              )}
              {/* Badge Auditada · {auditor}: nombre del auditor cuando conste. */}
              {identity.auditor_name && identity.auditor_name.trim() && (
                <span
                  className="vbadge a"
                  data-testid="header-badge-audited"
                  data-tip="Cuentas anuales auditadas por el auditor indicado."
                  tabIndex={0}
                >
                  ● Auditada · {identity.auditor_name}
                </span>
              )}
            </h1>
            {/* HARDENING-022 T1 · Subtítulo:
                Razón social · CIF · [actividad ES] · Localidad (Provincia) · URL clicable ↗ · [icono LinkedIn] */}
            <div className="csub" data-testid="company-header-subtitle">
              {(() => {
                const activityEs = identity.activity_es
                  ?? cls.cnae_description
                  ?? identity.activity
                  ?? null;
                const localidad = identity.location.municipio;
                const provincia = identity.location.provincia;
                const localidadProvincia = localidad && provincia && localidad !== provincia
                  ? `${localidad} (${provincia})`
                  : (localidad ?? provincia ?? null);
                const parts: Array<string | null> = [
                  identity.legal_name,
                  identity.cif_normalized ? `CIF ${identity.cif_normalized}` : null,
                  activityEs,
                  localidadProvincia,
                ];
                const web = identity.contact.web;
                const linkedin = identity.contact.linkedin;
                return (
                  <>
                    {parts.filter(Boolean).join(' · ')}
                    {web && (
                      <>
                        {' · '}
                        <a
                          href={web}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid="company-header-website"
                          aria-label={`Sitio web: ${web}`}
                        >
                          {web.replace(/^https?:\/\//i, '')} <ExternalLink size={11} style={{ display: 'inline-block', verticalAlign: '-1px' }} />
                        </a>
                      </>
                    )}
                    {linkedin && (
                      <>
                        {' · '}
                        <a
                          href={linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid="company-header-linkedin"
                          aria-label="Perfil de LinkedIn"
                          title="LinkedIn"
                          style={{ display: 'inline-flex', verticalAlign: 'middle' }}
                        >
                          <Linkedin size={13} />
                        </a>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
            {/* HARDENING-022b T1 · Chips de oportunidades activas · consume
                `opportunity.chips[]` con shape `{enum, label_es}`. Passthrough
                puro: si null o vacío → slot invisible (R15).
                HARDENING-025 · Item 2/3 · guard DPD defensivo (además del backend)
                y dispatch al Copilot: chips con plantilla en `@/lib/copilot/prompts`
                son clicables → `prefillComposer(...)` abre el dock + precarga el
                composer. Chips sin plantilla renderizan como span estático. */}
            {(() => {
              // Guard DPD defensivo (además del backend HARDENING-024): no
              // renderizar chips si visitante anónimo.
              if (anon) return null;
              const chips = props.opportunity?.chips;
              if (!Array.isArray(chips) || chips.length === 0) return null;
              const empresaName = identity.legal_name ?? identity.cif_normalized ?? null;
              return (
                <div
                  className="opps"
                  data-testid="company-header-opportunities"
                  style={{ padding: '10px 0 0' }}
                >
                  <span className="lbl">Oportunidades activas</span>
                  {chips.map((c, i) => {
                    const label = c.label_es ?? c.enum ?? '—';
                    const chipEnum = c.enum ?? null;
                    const clickable = hasPromptForChip(chipEnum);
                    if (clickable) {
                      return (
                        <button
                          key={chipEnum ?? i}
                          type="button"
                          className="chk"
                          data-testid={`header-opp-chip-${chipEnum ?? i}`}
                          data-enum={chipEnum ?? undefined}
                          onClick={() => {
                            const prompt = buildChipPrompt(chipEnum, empresaName);
                            if (prompt) prefillComposer(prompt);
                          }}
                          title="Preguntar al Copilot"
                          style={{
                            font: 'inherit',
                            color: 'inherit',
                            background: 'transparent',
                            border: 0,
                            padding: 0,
                            margin: 0,
                            cursor: 'pointer',
                          }}
                        >
                          <span className="c">✓</span>{label}
                        </button>
                      );
                    }
                    return (
                      <span
                        key={chipEnum ?? i}
                        className="chk"
                        data-testid={`header-opp-chip-${chipEnum ?? i}`}
                        data-enum={chipEnum ?? undefined}
                      >
                        <span className="c">✓</span>{label}
                      </span>
                    );
                  })}
                </div>
              );
            })()}
          </div>
          {/* TODO: cablear a seguimiento/alertas cuando arroba.v2 lo exponga (Plan Intel I-2). */}
          <div className="actions">
            <button
              className="btn"
              data-testid="btn-guardar"
              onClick={() => notify({ kind: 'info', text: 'El seguimiento de empresas estará disponible próximamente.' })}
            >
              <Bookmark size={15} /> Guardar
            </button>
            <button
              className="btn"
              data-testid="btn-seguir"
              onClick={() => notify({ kind: 'info', text: 'Las alertas de esta empresa estarán disponibles próximamente.' })}
            >
              <Bell size={15} /> Seguir
            </button>
            <button
              className="btn"
              data-testid="btn-compartir"
              aria-label="Compartir"
              title="Compartir"
              onClick={() => {
                void (async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    notify({ kind: 'success', text: 'Enlace copiado al portapapeles.' });
                  } catch {
                    notify({ kind: 'info', text: 'Copia el enlace desde la barra del navegador.' });
                  }
                })();
              }}
            >
              <Share2 size={15} />
            </button>
          </div>
        </div>

        <div className="grid">
          <aside className={`side${collapsed ? ' collapsed' : ''}`}>
            <div className="siderail">
              <div className="railtop"><button className="toggle" onClick={() => setCollapsed((c) => !c)}>‹</button></div>
              {grps.map((g) => (
                <div key={g}>
                  <div className="grp">{g}</div>
                  {NAV.filter((n) => n.grp === g).map((n) => {
                    const Icon = n.icon;
                    return (
                      <div key={n.id} className={`snav${n.id === active ? ' on' : ''}`} onClick={() => setActive(n.id)}>
                        <span className="ic"><Icon size={18} /></span>
                        <span className="tx">{n.label}</span>
                        {!n.ready && !collapsed && <span className="tx" style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--n400)' }}>En preparación</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </aside>

          <main className="main">
            {/* HARDENING-037 · Puntos de extensión (`sectionRegistry`).
                Se resuelve ANTES del switch inline; si la sección `active` está
                en el registry, renderiza el bloque nuevo directamente. Ver
                /app/docs/HARDENING-037_puntos_extension.md.
                Cubre: mercado, oportunidades, comite (con sucesion + sector
                absorbidos por oportunidades vía OpportunityThesisBlock).
                Gate DPD: en anonimo mostramos `<Gate>` como el resto de secciones. */}
            {(() => {
              const entry = getSection(active);
              if (!entry?.render) return null;
              const ctx: FichaSectionContext = {
                cif,
                anon,
                market: marketBlockToContextView(props.market, props.marketReading, props.capitalMarkets),
                opportunity: opportunityToThesisView(
                  props.opportunity ?? null,
                  props.succession,
                  props.rollup,
                ),
                runCommittee: (lens) =>
                  apiClient.companies.committee(
                    cif,
                    lens as 'neutral' | 'buyer' | 'investor',
                  ) as Promise<never>,
                committeeDefaultLens: 'neutral',
              };
              const label =
                NAV.find((n) => n.id === active)?.label ?? active;
              const gateWhat =
                active === 'mercado'
                  ? 'el análisis de mercado'
                  : active === 'oportunidades'
                    ? 'las oportunidades'
                    : active === 'comite'
                      ? 'el comité de inversión'
                      : `la sección ${label}`;
              return (
                <section className="panel on" data-testid={`section-${active}`}>
                  <div className="sec-h">{label}</div>
                  {anon ? <Gate what={gateWhat} /> : entry.render(ctx)}
                </section>
              );
            })()}
            {active === 'resumen' && <Resumen {...props} identity={identity} anon={anon} />}
            {active === 'finanzas' && (anon
              ? <section className="panel on"><div className="sec-h">Finanzas</div><Gate what="las finanzas" /></section>
              : <Finanzas financial={props.financial} analysis={props.financialAnalysis} />)}
            {active === 'valoracion' && (anon
              ? <section className="panel on"><div className="sec-h">Valoración</div><Gate what="la valoración" /></section>
              : <Valoracion valuation={props.valuation} financialAnalysis={props.financialAnalysis} />)}
            {active === 'comparativa' && (anon
              ? <section className="panel on"><div className="sec-h">Comparativa</div><Gate what="los compradores y comparables" /></section>
              : <Comparativa semantic={props.semantic} buyers={props.buyers} />)}
            {active === 'senales' && (anon
              ? <section className="panel on"><div className="sec-h">Señales</div><Gate what="las señales" /></section>
              : <IntelligenceSectionErrorBoundary label="Señales" sectionTestid="senales-error-boundary"><Senales signal={props.signal} /></IntelligenceSectionErrorBoundary>)}
            {/* HARDENING-037 · Ramas `oportunidades` y `mercado` retiradas del
                switch inline (ahora las sirve `getSection(active)` arriba). Se
                mantiene la lógica de Oportunidades legacy accesible vía Mercado
                si el nuevo bloque devuelve empty (fallback interno del bloque). */}
            {active === 'gobierno' && <Gobierno governance={props.governance} />}
            {active === 'propiedad' && (
              <ControlGraphErrorBoundary>
                <Propiedad ownership={props.ownership} controlGraph={props.controlGraph} identity={props.identity as unknown as Record<string, unknown> | null} />
              </ControlGraphErrorBoundary>
            )}
            {active === 'eventos' && <Eventos events={props.events} />}
            {active === 'rankings' && (anon
              ? <section className="panel on" data-testid="rankings-gated"><div className="sec-h">Posicionamiento sectorial y competitivo</div><Gate what="tu posición en el sector, la posición local y la lectura CF" /></section>
              : <Rankings analysis={props.financialAnalysis} />)}
            {/* HARDENING-037 · `comite`, `sucesion` y `sector` retiradas del
                array Pending. `comite` ahora vive en el registry; `sucesion` y
                `sector` fueron absorbidas por Oportunidades. Solo quedan aquí
                `registros` y `documentos` (aún sin motor Intel). */}
            {['registros', 'documentos'].includes(active) && (
              <section className="panel on">
                <div className="sec-h">{NAV.find((n) => n.id === active)?.label}</div>
                <Pending label={NAV.find((n) => n.id === active)?.label ?? active} />
              </section>
            )}
          </main>

          <aside className="deal">
            {props.dealAside ? (
              <DealAsideCard state={props.dealAside} />
            ) : (
              <>
                <div className="escc">Próxima acción</div>
                <div className="dcard">
                  <div className="dh"><div className="k">◉ Estado de la compañía</div><div className="v">Pendiente</div></div>
                  <div className="db"><p>Aún no consta el estado de la compañía (en venta, buscando capital, comprando). En cuanto se determine, aquí verás la recomendación de actuación.</p></div>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>

    </div>
  );
}
