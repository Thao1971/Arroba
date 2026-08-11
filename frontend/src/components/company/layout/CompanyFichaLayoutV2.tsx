'use client';
/**
 * CompanyFichaLayoutV2 — Ficha de Empresa reproducida 1:1 desde la fuente
 * canónica `arroba.com/mockups/ficha-empresa-f01.html` (Daniel 2026-08-09:
 * "usa siempre la fuente"). El CSS es el del mockup, extraído verbatim y
 * scopeado bajo `.afk` (ver fichaMockupCss.ts). El maquetado reproduce las
 * clases del mockup; los datos son SIEMPRE reales (R4/R10: el front no calcula
 * ni inventa). Las secciones sin motor cableado quedan como "pronto".
 */
import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  Activity, BarChart3, Bell, Bookmark, Coins, Euro, FileText, Files, GitCompare,
  Hourglass, LayoutGrid, Lock, type LucideIcon, Network, PieChart, Scale, Share2,
  Target, Users, Zap,
} from 'lucide-react';

import type {
  BuyerItem, CashFlowRow, CashFlowStatement, FinancialAnalysis, FinancialAnalysisBalanceSheet, FinancialAnalysisRatioDetail,
  FinancialSection, FinancialTableBlock, GovernanceAggregated, GovernanceBlock, GovernanceNominal,
  IdentitySection, OwnershipAggregated, OwnershipBlock, OwnershipNominal,
  RecommendationSet, SemanticSection, SignalAnalysis, ValuationAnalysis,
} from '@/lib/companies/intelligence-types';
import { FICHA_MOCKUP_CSS } from './fichaMockupCss';
import { notify } from '@/lib/notify';

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
  /** B-2 · Events shell: `ficha.events` passthrough. Público. */
  events?: Record<string, unknown> | null;
  /** false = visitante anónimo (mixed-access): cifras bajo CTA de registro. */
  authenticated?: boolean;
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
  { id: 'mercado', label: 'Mercado', icon: BarChart3, ready: false, grp: 'Perfil' },
  { id: 'rankings', label: 'Rankings', icon: Target, ready: false, grp: 'Perfil' },
  { id: 'comparativa', label: 'Comparativa', icon: GitCompare, ready: true, grp: 'Perfil' },
  { id: 'senales', label: 'Cambios relevantes', icon: Activity, ready: true, grp: 'Inteligencia' },
  { id: 'oportunidades', label: 'Oportunidades', icon: Zap, ready: true, grp: 'Inteligencia' },
  { id: 'comite', label: 'Comité de inversión', icon: Scale, ready: false, grp: 'Inteligencia' },
  { id: 'sucesion', label: 'Sucesión', icon: Hourglass, ready: false, grp: 'Inteligencia' },
  { id: 'sector', label: 'Sector & Roll-up', icon: PieChart, ready: false, grp: 'Inteligencia' },
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
function Ring({ val, label, color }: { val: number; label: string; color: string }) {
  const r = 34, c = 2 * Math.PI * r;
  const [off, setOff] = useState(c);
  const [num, setNum] = useState(0);
  useEffect(() => {
    const t0 = performance.now(), dur = 1150;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      setOff(c * (1 - (val / 100) * e));
      setNum(Math.round(val * e));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [val, c]);
  return (
    <div className="ring">
      <div className="lbl">{label}</div>
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
      <style>{`@keyframes afkShimmer{0%{background-position:-200px 0}100%{background-position:calc(200px + 100%) 0}}.afkSkeleton{display:block;border-radius:6px;background:linear-gradient(90deg,#eef0f2 0%,#f5f6f8 40%,#eef0f2 80%);background-size:200px 100%;background-repeat:no-repeat;animation:afkShimmer 1.4s ease-in-out infinite}`}</style>
      <div className="afkSkeleton" style={{ height: 14, width: '55%', marginBottom: 12 }} />
      <div className="afkSkeleton" style={{ height: 10, width: '80%', marginBottom: 8 }} />
      <div className="afkSkeleton" style={{ height: 10, width: '70%' }} />
    </div>
  );
}

/** Pill de tendencia global (B-1.5 · Item 5). Consume evolution.trend de FinancialAnalysis. */
function TrendPill({ trend }: { trend: string | null | undefined }) {
  const norm = (trend ?? '').toLowerCase();
  let color: string, bg: string, label: string;
  if (norm === 'growth' || norm === 'positive') { color = '#16a34a'; bg = 'var(--ok-tint)'; label = 'Crecimiento'; }
  else if (norm === 'stable' || norm === 'flat') { color = '#6b7280'; bg = 'var(--n100)'; label = 'Estable'; }
  else if (norm === 'contraction' || norm === 'decline' || norm === 'deterioration') { color = '#dc2626'; bg = 'var(--red-tint)'; label = 'Contracción'; }
  else return <div className="kpi"><div className="l">Tendencia global</div><div className="v" style={{ color: 'var(--n400)', fontSize: 16 }}>—</div><div className="d inf">sin dato</div></div>;
  return (
    <div className="kpi" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div className="l">Tendencia global</div>
      <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 999, background: bg, color, fontSize: 14, fontWeight: 800, marginTop: 8 }}>● {label}</div>
    </div>
  );
}

/** Hero + card "Veredicto de ARROBA" — bloque de portada del Resumen (compartido anon/auth).
 *  Cascada de descripción: `identity.description` → `identity.objeto_social` → `financialAnalysis.identity.description` → `financialAnalysis.identity.objeto_social` → <Empty/>.
 *  El fallback a `financialAnalysis.identity` resuelve la descoordinación Intel I-1 en la que `/section/identity` aún devuelve null pero `/financial-analysis` sí puebla el dato. */
function HeroBlock({ identity, semantic, financialAnalysis }: { identity: IdentitySection; semantic: SemanticSection | null; financialAnalysis: FinancialAnalysis | null }) {
  const fallbackDescription =
    identity.description
    || identity.objeto_social
    || financialAnalysis?.identity?.description
    || financialAnalysis?.identity?.objeto_social
    || null;
  // Hero "Veredicto de ARROBA" · fuente Intel `finances.assessment.verdict` (2026-08-11).
  // R15: passthrough puro. `financial_quality` sigue alimentando la "Lectura financiera"
  // de la pestaña Finanzas — no lo tocamos.
  const verdictRaw = financialAnalysis?.assessment?.verdict ?? null;
  const verdict = typeof verdictRaw === 'string' && verdictRaw.trim().length > 0 ? verdictRaw.trim() : null;
  return (
    <>
      <div className="hero">
        <div className="t">Resumen de compañía</div>
        {fallbackDescription ? <p>{fallbackDescription}</p> : <Empty />}
        {semantic?.value_proposition && <p style={{ marginTop: 10 }}>{semantic.value_proposition}</p>}
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3><span className="k" />Veredicto de ARROBA</h3>
        {verdict
          ? <p data-testid="hero-verdict-value" style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--n800)' }}>{verdict}</p>
          : <Empty />}
      </div>
    </>
  );
}

/* ============================ RESUMEN ============================ */
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

  if (p.anon) {
    return (
      <section className="panel on">
        <HeroBlock identity={identity} semantic={semantic} financialAnalysis={financialAnalysis} />
        <div style={{ marginTop: 16 }}><Gate what="el análisis financiero, la valoración y los compradores" /></div>
        <div className="card" style={{ marginTop: 16 }}>
          <h3><span className="k" />Identificación</h3>
          <div className="cs">Datos registrales · fuentes verificadas + BORME</div>
          <div className="idrow"><span className="k">Razón social</span><span className="v">{identity.legal_name ?? '—'}</span></div>
          <div className="idrow"><span className="k">CIF</span><span className="v">{identity.cif_normalized ?? '—'}</span></div>
          <div className="idrow"><span className="k">CNAE</span><span className="v">{cls.cnae_code ? `${cls.cnae_code} · ${cls.cnae_description ?? ''}` : '—'}</span></div>
          <div className="idrow"><span className="k">Domicilio</span><span className="v">{[loc.municipio, loc.provincia].filter(Boolean).join(' · ') || '—'}</span></div>
        </div>
        <div style={{ marginTop: 16 }}>
          <IdentidadAmpliada identity={identity} />
        </div>
      </section>
    );
  }

  const quality = clamp100(financialAnalysis?.financial_quality?.score ?? null);
  const opp = clamp100(signal?.score?.signal_score ?? null);
  const topFit = clamp100(buyers?.recommendations?.[0]?.score ?? null);
  const rings: { v: number; label: string; color: string }[] = [];
  if (quality != null) rings.push({ v: quality, label: 'Calidad', color: OK });
  if (topFit != null) rings.push({ v: topFit, label: 'Encaje comprador', color: RED });
  if (opp != null) rings.push({ v: opp, label: 'Oportunidad', color: INFO });

  return (
    <section className="panel on">
      <HeroBlock identity={identity} semantic={semantic} financialAnalysis={financialAnalysis} />

      {hasChart ? (
        <div className="card" style={{ marginTop: 16 }}>
          <h3><span className="k" />Evolución financiera</h3>
          <div className="cs">Facturación y <abbr title="Beneficio antes de intereses, impuestos, depreciación y amortización.">EBITDA</abbr> · {evo!.years[0]}–{evo!.years[evo!.years.length - 1]}</div>
          <EvolutionChart series={evoSeries} years={evo!.years.map(String)} />
        </div>
      ) : <div style={{ marginTop: 16 }}><Pending label="Evolución financiera" /></div>}

      {k ? (
        <div className="kgrid" style={{ marginTop: 16 }}>
          <div className="kpi"><div className="l">Facturación</div><div className="v">{fmtEUR(k.revenue ?? null)}</div>{k.revenue_growth_yoy != null && <div className={`d ${k.revenue_growth_yoy >= 0 ? 'up' : 'down'}`}>{k.revenue_growth_yoy >= 0 ? '▲' : '▼'} {pctF(k.revenue_growth_yoy)} YoY</div>}</div>
          <div className="kpi"><div className="l"><abbr title="Beneficio antes de intereses, impuestos, depreciación y amortización.">EBITDA</abbr></div><div className="v">{fmtEUR(k.ebitda ?? null)}</div>{k.ebitda_margin != null && <div className="d inf">margen {pctF(k.ebitda_margin)}</div>}</div>
          <div className="kpi"><div className="l">Resultado neto</div><div className="v">{fmtEUR(k.net_income ?? null)}</div>{k.net_margin != null && <div className="d inf">margen {pctF(k.net_margin)}</div>}</div>
          <div className="kpi"><div className="l">Empleados</div><div className="v">{fmtNum(sz.employees_total)}</div><div className="d inf">plantilla</div></div>
        </div>
      ) : <div style={{ marginTop: 16 }}><Pending label="Indicadores financieros" /></div>}

      {k && (
        <div className="kgrid" style={{ marginTop: 12 }}>
          <div className="kpi">
            <div className="l">CAGR Ingresos (3a)</div>
            <div className="v">{pctF(k.revenue_cagr)}</div>
            <div className="d inf">crecimiento anualizado</div>
          </div>
          <div className="kpi">
            <div className="l">Crecimiento anual</div>
            <div className="v">{pctF(k.revenue_growth_yoy)}</div>
            {k.ebitda_growth_yoy != null && <div className="d inf"><abbr title="Beneficio antes de intereses, impuestos, depreciación y amortización.">EBITDA</abbr> {pctF(k.ebitda_growth_yoy)}</div>}
          </div>
          <div className="kpi">
            <div className="l">Fondos propios</div>
            <div className="v">{fmtEurCompact(financialAnalysis?.balance_sheet?.equity ?? null)}</div>
            <div className="d inf">equity</div>
          </div>
          <TrendPill trend={financialAnalysis?.evolution?.trend ?? null} />
        </div>
      )}

      <div className="kgrid" style={{ marginTop: 12 }}>
        {(() => {
          const rk = financialAnalysis?.ranking ?? null;
          const mp = rk?.market_position;
          const lp = rk?.locality_position;
          const sp = rk?.sector_revenue_percentile;
          return (
            <>
              <div className="kpi" data-testid="kpi-market-position">
                <div className="l">Posición sectorial</div>
                {mp && mp.rank != null && mp.total != null ? (
                  <>
                    <div className="v">#{mp.rank} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--n500)' }}>de {mp.total}</span></div>
                    <div className="d inf">{mp.scope}</div>
                  </>
                ) : <div className="v" style={{ color: 'var(--n400)', fontSize: 16 }}>—</div>}
              </div>
              <div className="kpi" data-testid="kpi-locality-position">
                <div className="l">Posición local</div>
                {lp && lp.rank != null && lp.total != null ? (
                  <>
                    <div className="v">#{lp.rank} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--n500)' }}>de {lp.total}</span></div>
                    <div className="d inf">{lp.scope}</div>
                  </>
                ) : <div className="v" style={{ color: 'var(--n400)', fontSize: 16 }}>—</div>}
              </div>
              <div className="kpi" data-testid="kpi-sector-percentile">
                <div className="l">Percentil de facturación</div>
                {sp != null ? (
                  <>
                    <div className="v">{sp}<span style={{ fontSize: 14, fontWeight: 600, color: 'var(--n500)' }}>º</span></div>
                    <div className="d inf">en su sector</div>
                  </>
                ) : <div className="v" style={{ color: 'var(--n400)', fontSize: 16 }}>—</div>}
              </div>
              <div className="kpi" data-testid="kpi-innovation-pending">
                <div className="l">Innovación</div>
                <div className="v" style={{ color: 'var(--n400)', fontSize: 16 }}>—</div>
                <div className="d inf">En preparación</div>
              </div>
            </>
          );
        })()}
      </div>

      {financialAnalysis?.ranking?.explain && financialAnalysis.ranking.explain.length > 0 && (
        <div className="card" style={{ marginTop: 12 }} data-testid="rankings-explain-card">
          <h3><span className="k" />Lectura de posicionamiento</h3>
          <div className="cs">Comparativa contra el universo sectorial y territorial</div>
          <ul style={{ margin: 0, paddingLeft: 20, paddingTop: 8 }}>
            {financialAnalysis.ranking.explain.map((line, i) => (
              <li key={i} style={{ fontSize: 13.5, color: 'var(--n700)', padding: '3px 0', lineHeight: 1.55 }}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="row r2" style={{ marginTop: 16 }}>
        {rings.length > 0 ? (
          <div className="card">
            <h3><span className="k" />Scores de inteligencia</h3>
            <div className="cs">Valoración cualitativa de ARROBA</div>
            <div className="scores" style={{ gridTemplateColumns: `repeat(${rings.length},1fr)` }}>
              {rings.map((r) => <Ring key={r.label} val={r.v} label={r.label} color={r.color} />)}
            </div>
          </div>
        ) : <Pending label="Scores de inteligencia" />}
        <div className="card">
          <h3><span className="k" />Identificación</h3>
          <div className="cs">Datos registrales · fuentes verificadas + BORME</div>
          <div className="idrow"><span className="k">Razón social</span><span className="v">{identity.legal_name ?? '—'}</span></div>
          <div className="idrow"><span className="k">CIF</span><span className="v">{identity.cif_normalized ?? '—'}</span></div>
          {identity.registry_status?.legal_form && <div className="idrow"><span className="k">Forma jurídica</span><span className="v">{identity.registry_status.legal_form}</span></div>}
          <div className="idrow"><span className="k">CNAE</span><span className="v">{cls.cnae_code ? `${cls.cnae_code} · ${cls.cnae_description ?? ''}` : '—'}</span></div>
          <div className="idrow"><span className="k">Domicilio</span><span className="v">{[loc.municipio, loc.provincia].filter(Boolean).join(' · ') || '—'}</span></div>
          <div className="idrow"><span className="k">Capital social</span><span className="v">{fmtEUR(sz.capital_social)}</span></div>
          {identity.contact.web && <div className="idrow"><span className="k">Web</span><span className="v">{identity.contact.web}</span></div>}
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <IdentidadAmpliada identity={identity} />
      </div>
    </section>
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
 */
const CF_CATEGORY_LABEL: Record<string, string> = {
  operating: 'Actividades de explotación',
  investing: 'Actividades de inversión',
  financing: 'Actividades de financiación',
  net_change: 'Variación de tesorería',
  summary: 'Indicadores',
};
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
    return ordered.map((cat) => ({ cat, label: CF_CATEGORY_LABEL[cat] ?? cat, rows: map.get(cat)! }));
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
                      <span className="rn" title={r.formula ?? undefined}>{r.name}</span>
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
            <span><span className="srcdot r" /> Dato recibido (verificado)</span>
            <span><span className="srcdot c" /> Valoración cualitativa de ARROBA</span>
            <span>Barra = percentil sectorial</span>
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
            <div className="scores" style={{ gridTemplateColumns: '1fr' }}><Ring val={q} label="Quality Score" color={OK} /></div>
            <div className="cs" style={{ textAlign: 'center', marginTop: 8 }}>de 100 · calidad financiera</div>
          </div>
        )}
        {r && (
          <div className="card">
            <h3><span className="k" /><abbr title="Valor de la empresa: equity + deuda neta. Métrica de compra teórica.">Enterprise Value</abbr></h3>
            <div className="evrow"><span className="lb">{scenarioName(0)}</span><div className="evbar"><i style={{ width: `${pctOf(r.low)}%`, background: 'var(--red)' }} /></div><span className="val">{fmtEUR(r.low)}</span></div>
            <div className="evrow"><span className="lb">{scenarioName(1)}</span><div className="evbar"><i style={{ width: `${pctOf(r.central)}%`, background: 'var(--info)' }} /></div><span className="val">{fmtEUR(r.central)}</span></div>
            <div className="evrow"><span className="lb">{scenarioName(2)}</span><div className="evbar"><i style={{ width: `${pctOf(r.high)}%`, background: 'var(--ok)' }} /></div><span className="val">{fmtEUR(r.high)}</span></div>
            {valuation.multiple != null && <div className="idrow" style={{ marginTop: 10 }}><span className="k">Múltiplo</span><span className="v">{valuation.multiple.toLocaleString('es-ES', { maximumFractionDigits: 1 })}× {valuation.multiple_basis ?? 'EBITDA'}</span></div>}
            <div className="idrow"><span className="k" style={{ fontWeight: 700, color: 'var(--n900)' }}>Equity value</span><span className="v" style={{ color: 'var(--red-hover)' }}>{fmtEUR(valuation.equity_value)}</span></div>
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
        <div className="card" style={{ marginTop: 16 }}>
          <h3><span className="k" />¿Por qué este valor?</h3>
          <div className="cs">Explicación detrás del número, no sólo la cifra</div>
          <div style={{ paddingTop: 4 }}>
            {valuation.hypotheses.map((h, i) => <div key={i} style={{ fontSize: 13, color: 'var(--n700)', padding: '4px 0', lineHeight: 1.55 }}>◆ {h}</div>)}
          </div>
        </div>
      )}
      {methodology && (
        <details className="method" style={{ marginTop: 16 }}>
          <summary>Metodología</summary>
          <div className="mbody">{methodology}</div>
        </details>
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
          <div className="cs">Los rasgos con los que Arroba busca sus comparables</div>
          <div className="chips">{chips.map((c, i) => <span key={i} className={`schip${i > 2 ? ' n' : ''}`}>{c}</span>)}</div>
        </div>
      )}

      {list.length > 0 && (
        <div className="card">
          <h3><span className="k" />Compradores que mejor encajarían con esta compañía</h3>
          <div className="cs">Ordenados por encaje (0–100). Haz clic en un comprador para ver por qué encaja.</div>
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
            <div className="cs">Descomposición del encaje {Math.round(clamp100(cur.score) ?? 0)}/100. Cada factor compara al comprador con las necesidades de la compañía.</div>
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
            <div className="cs">La similitud la calcula el <b>Fingerprint</b>: modelo de negocio, sector, tamaño, márgenes y territorio.</div>
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

/* ============================ SEÑALES ============================ */
/**
 * ÍTEM 2 · Turno post-D · consumo enriquecido del payload `signal-intelligence`.
 * Preserva el estilo timeline del mockup (`.tl .ev`) y añade:
 *   · `explanation` como texto principal (prosa CF, R15 literal).
 *   · `evidence.{metric, value, window}` como bullet secundario.
 *   · `dimensions.{impact, urgency, persistence, confidence}` como tags.
 *   · `rule.id` como pie discreto (meta-información del motor).
 * Empty state · copy Corporate Finance: "Sin señales relevantes".
 */
const SIG_SEVERITY_LABEL: Record<string, string> = {
  risk: 'Riesgo',
  opportunity: 'Oportunidad',
  info: 'Informativo',
  warning: 'Alerta',
  critical: 'Crítica',
};
const SIG_DIM_LABEL: Record<string, string> = {
  impact: 'Impacto',
  urgency: 'Urgencia',
  persistence: 'Persistencia',
  confidence: 'Confianza',
};
function fmtNumOrText(v: number | string | null | undefined): string {
  if (v == null) return '—';
  if (typeof v === 'number') {
    if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toLocaleString('es-ES', { maximumFractionDigits: 1 })} M€`;
    return v.toLocaleString('es-ES', { maximumFractionDigits: 2 });
  }
  return String(v);
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
      <style>{`.sig-explain{font-size:14px;color:var(--n800);line-height:1.55;margin-top:6px}.sig-evidence{font-size:12.5px;color:var(--n700);margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;align-items:center}.sig-evidence .lb{color:var(--n600);text-transform:uppercase;letter-spacing:.3px;font-size:11px}.sig-dims{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.sig-dim{padding:3px 10px;border-radius:999px;background:var(--n100);color:var(--n800);font-size:11.5px;font-weight:600}.sig-actions{margin-top:8px;display:flex;gap:6px;flex-wrap:wrap}.sig-actions .a{padding:3px 8px;border:1px solid var(--n200);border-radius:6px;font-size:11.5px;color:var(--n700)}.sig-rule{font-size:10.5px;color:var(--n500);margin-top:10px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.2px}`}</style>
      <div className="sec-h">Señales</div>
      <div className="sec-s">Hechos y eventos que Arroba ha detectado y que hacen a la compañía más (o menos) atractiva para una operación.</div>
      <div className="tl">
        {items.map((s) => {
          const dims = s.dimensions ?? null;
          const evi = s.evidence ?? null;
          const severityLabel = s.severity ? (SIG_SEVERITY_LABEL[s.severity] ?? s.severity) : null;
          return (
            <div key={s.signal_id} className={`ev ${cls(s.polarity)}`} data-testid={`senal-${s.signal_id}`}>
              <div className="mk" />
              <div className="c">
                <div className="th">
                  <div>
                    <div className="t">{s.title ?? s.signal_type ?? 'Señal'}</div>
                    {severityLabel && <div className="m">{severityLabel}{s.confidence != null ? ` · confianza ${Math.round(s.confidence * 100)}%` : ''}</div>}
                  </div>
                  {s.category && <span className="tag">{s.category}</span>}
                </div>
                {s.explanation && <div className="sig-explain">{s.explanation}</div>}
                {evi && (evi.metric || evi.value != null) && (
                  <div className="sig-evidence">
                    <span className="lb">Evidencia</span>
                    {evi.metric && <span><b>{evi.metric}</b></span>}
                    {evi.value != null && <span>· {fmtNumOrText(evi.value)}</span>}
                    {evi.window && <span>· {evi.window}</span>}
                  </div>
                )}
                {dims && Object.keys(dims).length > 0 && (
                  <div className="sig-dims">
                    {(Object.entries(dims) as Array<[string, number]>).filter(([, v]) => typeof v === 'number').map(([k, v]) => (
                      <span key={k} className="sig-dim">{SIG_DIM_LABEL[k] ?? k}: {Math.round(v * 100)}%</span>
                    ))}
                  </div>
                )}
                {(s.recommended_actions?.length ?? 0) > 0 && (
                  <div className="sig-actions">
                    {(s.recommended_actions ?? []).map((a, j) => <span key={j} className="a">→ {a}</span>)}
                  </div>
                )}
                {fmtDate(s.detected_at) && <div className="yr">{fmtDate(s.detected_at)}</div>}
                {s.rule?.id && <div className="sig-rule">Regla · {s.rule.id}</div>}
              </div>
            </div>
          );
        })}
      </div>
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

/* ============================ IDENTIFICACIÓN AMPLIADA ============================ */
/**
 * Item 6.a · Identificación registral y societaria (2026-08-11).
 * Card estructurada en 4 subgrupos: Registro, Domicilio, Capital y plantilla, Cotización.
 * Passthrough puro R15: campo null → `<Empty/>` local sin ocultar la fila (para que el
 * usuario sepa qué falta). Cero derivadas.
 * Público (dato registral).
 */
function fmtYesNo(v: boolean | null | undefined): string | null {
  if (v === true) return 'Cotizada';
  if (v === false) return 'No cotizada';
  return null;
}
function IdentityRow({ label, value, testid }: { label: string; value: string | null | undefined; testid: string }) {
  const has = value !== null && value !== undefined && String(value).trim().length > 0 && String(value) !== '—';
  return (
    <div className="idrow" data-testid={testid}>
      <span className="k">{label}</span>
      <span className="v" style={has ? undefined : { color: 'var(--n400)', fontStyle: 'italic' }}>
        {has ? value : 'En preparación'}
      </span>
    </div>
  );
}
function IdentidadAmpliada({ identity }: { identity: IdentitySection }) {
  // Passthrough desde `identity` (proveniente de adaptIdentityFromFicha) + fallback
  // a `financialAnalysis.identity` cuando corresponda (mismo criterio que Hero).
  const cif = identity.cif_normalized ?? null;
  const legal_name = identity.legal_name ?? null;
  const registry = identity.registry_status ?? { legal_form: null, mercantile_status: null, activity_status: null, incorporation_date: null, record_status: null, is_listed: null, listed_market: null };
  const legal_form = registry.legal_form ?? null;
  const mercantile_status = registry.mercantile_status ?? null;
  const activity_status = registry.activity_status ?? null;
  const incorporation_date = fmtDate(registry.incorporation_date ?? null);
  const record_status = registry.record_status ?? null;
  const loc = identity.location ?? { provincia: null, municipio: null, codigo_postal: null, pais: null };
  const address = identity.address ?? null;
  const postal_code = loc.codigo_postal ?? null;
  const locality = loc.municipio ?? null;
  const province = loc.provincia ?? null;
  const autonomous_community = identity.autonomous_community ?? null;
  const country = identity.country ?? loc.pais ?? null;
  const sz = identity.size ?? {};
  const capital_social = sz.capital_social ?? null;
  const employees_total = sz.employees_total ?? null;
  const listed = registry.is_listed ?? null;
  const listed_market = registry.listed_market ?? null;

  return (
    <div className="card" data-testid="identity-expanded">
      <h3><span className="k" />Identificación registral y societaria</h3>
      <div className="cs">Datos registrales, domicilio, capital y estado de cotización</div>

      <div style={{ marginTop: 14, borderTop: '1px dashed var(--n200)', paddingTop: 14 }}>
        <h5 style={{ margin: 0, marginBottom: 8, fontSize: 12, color: 'var(--n600)', textTransform: 'uppercase', letterSpacing: '.4px', fontWeight: 700 }}>Registro</h5>
        <IdentityRow label="Razón social"      value={legal_name}                                testid="identity-expanded-registro-legal_name" />
        <IdentityRow label="CIF/NIF"           value={cif}                                       testid="identity-expanded-registro-cif" />
        <IdentityRow label="Forma jurídica"    value={legal_form}                                testid="identity-expanded-registro-legal_form" />
        <IdentityRow label="Estado mercantil"  value={mercantile_status}                         testid="identity-expanded-registro-mercantile_status" />
        <IdentityRow label="Situación de actividad" value={activity_status}                      testid="identity-expanded-registro-activity_status" />
        <IdentityRow label="Fecha de constitución"  value={incorporation_date}                   testid="identity-expanded-registro-incorporation_date" />
        <IdentityRow label="Estado del registro"    value={record_status}                        testid="identity-expanded-registro-record_status" />
      </div>

      <div style={{ marginTop: 14, borderTop: '1px dashed var(--n200)', paddingTop: 14 }}>
        <h5 style={{ margin: 0, marginBottom: 8, fontSize: 12, color: 'var(--n600)', textTransform: 'uppercase', letterSpacing: '.4px', fontWeight: 700 }}>Domicilio</h5>
        <IdentityRow label="Dirección"         value={address}                                   testid="identity-expanded-domicilio-address" />
        <IdentityRow label="Código postal"     value={postal_code}                               testid="identity-expanded-domicilio-postal_code" />
        <IdentityRow label="Municipio"         value={locality}                                  testid="identity-expanded-domicilio-locality" />
        <IdentityRow label="Provincia"         value={province}                                  testid="identity-expanded-domicilio-province" />
        <IdentityRow label="Comunidad autónoma" value={autonomous_community}                     testid="identity-expanded-domicilio-autonomous_community" />
        <IdentityRow label="País"              value={country}                                   testid="identity-expanded-domicilio-country" />
      </div>

      <div style={{ marginTop: 14, borderTop: '1px dashed var(--n200)', paddingTop: 14 }}>
        <h5 style={{ margin: 0, marginBottom: 8, fontSize: 12, color: 'var(--n600)', textTransform: 'uppercase', letterSpacing: '.4px', fontWeight: 700 }}>Capital y plantilla</h5>
        <IdentityRow label="Capital social"    value={capital_social != null ? fmtEUR(capital_social) : null} testid="identity-expanded-capital-capital_social" />
        <IdentityRow label="Empleados totales" value={employees_total != null ? fmtNum(employees_total) : null} testid="identity-expanded-capital-employees_total" />
        {/* R15: `employees_range` no lo entrega Intel; no lo derivamos desde `employees_total`. */}
        <IdentityRow label="Rango de plantilla" value={null}                                     testid="identity-expanded-capital-employees_range" />
      </div>

      <div style={{ marginTop: 14, borderTop: '1px dashed var(--n200)', paddingTop: 14 }}>
        <h5 style={{ margin: 0, marginBottom: 8, fontSize: 12, color: 'var(--n600)', textTransform: 'uppercase', letterSpacing: '.4px', fontWeight: 700 }}>Cotización</h5>
        <IdentityRow label="Estado de cotización" value={fmtYesNo(listed)}                       testid="identity-expanded-cotizacion-is_listed" />
        <IdentityRow label="Mercado"           value={listed_market}                             testid="identity-expanded-cotizacion-listed_market" />
        {/* R15: `ticker` no lo entrega Intel; siempre `<Empty/>`. */}
        <IdentityRow label="Ticker"            value={null}                                      testid="identity-expanded-cotizacion-ticker" />
      </div>
    </div>
  );
}

/* ============================ PROPIEDAD (Ownership) ============================ */
/**
 * B-2.2 · Estructura accionarial y control.
 * Union type discriminado desde backend (DPD política simplificada 2026-08-11):
 *   - `available:false` o null → <Empty/> Corporate Finance.
 *   - `summary` presente (anónimo) → bloque agregado no identificativo (sin nombres).
 *   - `shareholders` presente (autenticado) → tabla nominal + control block.
 * R11 (Frontend Freeze) + R15 (cero derivación).
 */
function isOwnershipNominal(o: OwnershipBlock): o is OwnershipNominal {
  return o.available === true && Array.isArray((o as OwnershipNominal).shareholders);
}
function isOwnershipAggregated(o: OwnershipBlock): o is OwnershipAggregated {
  return o.available === true && typeof (o as OwnershipAggregated).summary === 'object'
    && typeof (o as OwnershipAggregated).summary?.total_shareholders === 'number';
}
function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `${v.toLocaleString('es-ES', { maximumFractionDigits: 2 })}%`;
}
function Propiedad({ ownership }: { ownership?: OwnershipBlock | null }) {
  if (!ownership || ownership.available !== true) {
    return (
      <section className="panel on" data-testid="ownership-empty">
        <div className="sec-h">Estructura accionarial y control</div>
        <div className="sec-s">Accionariado y estructura de control según fuentes registrales.</div>
        <Empty label="Estructura accionarial" />
      </section>
    );
  }
  if (isOwnershipAggregated(ownership)) {
    const s = ownership.summary;
    return (
      <section className="panel on" data-testid="ownership-aggregated">
        <div className="sec-h">Estructura accionarial y control</div>
        <div className="sec-s">Accionariado y estructura de control según fuentes registrales.</div>
        <div className="card">
          <h3><span className="k" />Vista agregada</h3>
          <div className="cs">Datos no identificativos · el detalle nominal se muestra a usuarios registrados</div>
          <div className="idrow" data-testid="ownership-summary-total">
            <span className="k">Accionistas registrados</span>
            <span className="v"><b>{fmtNum(s.total_shareholders)}</b></span>
          </div>
          {s.tier && (
            <div className="idrow" data-testid="ownership-summary-tier">
              <span className="k">Estructura de control</span>
              <span className="v"><b>{s.tier}</b></span>
            </div>
          )}
          {s.top1_pct != null && (
            <div className="idrow" data-testid="ownership-summary-top1-pct">
              <span className="k">Participación del accionista mayoritario</span>
              <span className="v"><b>{fmtPct(s.top1_pct)}</b></span>
            </div>
          )}
          <div className="cs" style={{ marginTop: 12, fontStyle: 'italic' }}>
            <Lock size={12} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 6 }} />
            <a href="/es/login" style={{ color: 'var(--red)', fontWeight: 600, textDecoration: 'none' }}>
              Iniciar sesión
            </a> para ver el detalle nominal completo.
          </div>
        </div>
      </section>
    );
  }
  if (isOwnershipNominal(ownership)) {
    const shs = [...ownership.shareholders].sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));
    const ctrl = ownership.control ?? null;
    return (
      <section className="panel on" data-testid="ownership-nominal">
        <div className="sec-h">Estructura accionarial y control</div>
        <div className="sec-s">Accionariado y estructura de control según fuentes registrales.</div>
        {ctrl && (ctrl.top1_name || ctrl.tier || ctrl.controlling_shareholder) && (
          <div className="card" data-testid="ownership-control-block">
            <h3><span className="k" />Control</h3>
            <div className="cs">Vector principal de control según el último ejercicio disponible</div>
            {ctrl.controlling_shareholder && (
              <div className="idrow">
                <span className="k">Accionista controlador</span>
                <span className="v"><b>{ctrl.controlling_shareholder}</b></span>
              </div>
            )}
            {ctrl.top1_name && ctrl.top1_name !== ctrl.controlling_shareholder && (
              <div className="idrow">
                <span className="k">Accionista mayoritario</span>
                <span className="v"><b>{ctrl.top1_name}</b></span>
              </div>
            )}
            {ctrl.top1_pct != null && (
              <div className="idrow">
                <span className="k">Participación mayoritaria</span>
                <span className="v"><b>{fmtPct(ctrl.top1_pct)}</b></span>
              </div>
            )}
            {ctrl.tier && (
              <div className="idrow">
                <span className="k">Nivel de control</span>
                <span className="v"><b>{ctrl.tier}</b></span>
              </div>
            )}
          </div>
        )}
        <div className="card" style={{ marginTop: 16 }}>
          <h3><span className="k" />Accionistas</h3>
          <div className="cs">{shs.length} accionista{shs.length === 1 ? '' : 's'} registrado{shs.length === 1 ? '' : 's'} · ordenados por participación descendente</div>
          {shs.length > 0 ? (
            <table className="rec" data-testid="ownership-shareholders-table">
              <tbody>
                <tr>
                  <th>Nombre</th>
                  <th>CIF/NIF</th>
                  <th style={{ textAlign: 'right' }}>Participación</th>
                  <th style={{ textAlign: 'right' }}>Ejercicio</th>
                </tr>
                {shs.map((sh, i) => (
                  <tr key={`${sh.name}-${i}`} data-testid={`ownership-shareholder-${i}`}>
                    <td>{sh.name || '—'}</td>
                    <td>{sh.cif || '—'}</td>
                    <td style={{ textAlign: 'right' }}>{fmtPct(sh.pct)}</td>
                    <td style={{ textAlign: 'right' }}>{sh.as_of_year != null ? String(sh.as_of_year) : '—'}</td>
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
      <div className="sec-h">Estructura accionarial y control</div>
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
                    <td>{o.role || '—'}</td>
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
function Oportunidades({ opportunities }: { opportunities?: RecommendationSet | null }) {
  const items = opportunities?.recommendations ?? [];
  if (!items.length) return <Pending label="Oportunidades" />;
  return (
    <section className="panel on">
      <div className="sec-h">Oportunidades</div>
      <div className="sec-s">Las jugadas que tienen sentido para esta empresa, ordenadas por lo atractivas que son.</div>
      <div className="card">
        <h3><span className="k" />Atractivo por dimensión estratégica</h3>
        <div className="cs">Puntuación 0–100 de cada tesis para esta compañía</div>
        {items.map((o, i) => {
          const v = clamp100(o.score) ?? 0;
          return (
            <div key={o.master_id ?? i} className="dim"><span className="dn">{o.name ?? o.recommendation_type ?? 'Tesis'}</span><span className="db"><i style={{ width: `${v}%` }} /></span><span className="dv">{Math.round(v)}</span></div>
          );
        })}
      </div>
      <div className="row r2">
        {items.slice(0, 2).map((o, i) => (
          <div key={i} className="card">
            <h3><span className="k" />{o.name ?? o.recommendation_type ?? 'Tesis'}</h3>
            {o.reason && <p style={{ fontSize: 13.5, color: 'var(--n700)', lineHeight: 1.6 }}>{o.reason}</p>}
            {(o.recommended_actions ?? []).map((a, j) => <div key={j} className="sact" style={{ marginTop: j === 0 ? 10 : 0 }}>→ {a}</div>)}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================ COPILOT ============================ */
const AT_GRID = ['..XXXX..', '.X....X.', 'X..XX..X', 'X.X..X.X', 'X.X..X.X', 'X..XXXXX', '.X......', '..XXXX..'];
function AtMark({ color = '#fff', size = 18 }: { color?: string; size?: number }) {
  const cell = size / 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="arrobamark">
      {AT_GRID.flatMap((row, r) => row.split('').map((c, x) => c === 'X'
        ? <rect key={`${r}-${x}`} x={x * cell} y={r * cell} width={cell * 0.82} height={cell * 0.82} rx={cell * 0.2} fill={color} /> : null))}
    </svg>
  );
}
function Copilot({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  return (
    <div className="cop-wrap">
      <div className={`cop${open ? ' open' : ''}`}>
        <div className="cop-panel">
          <div className="cop-phead"><span className="lbl">arroba copilot · {name}</span><button className="ci-min" onClick={() => setOpen(false)}>—</button></div>
          <div className="pad"><div className="note">Pregunta sobre esta compañía y el Copilot responde con sus motores.</div></div>
        </div>
        <div className="cop-chips">
          {['Prepárame un teaser', 'Riesgos para el comprador', '¿Quién me la compraría?'].map((c) => (
            <span key={c} className="ccchip" onClick={() => { setOpen(true); setText(c); }}><span className="cs">✦</span> {c}</span>
          ))}
        </div>
        <div className="cop-bar" onClick={() => setOpen(true)}>
          <button className="ci-add" aria-label="Adjuntar"><AtMark color="#9A9A93" size={16} /></button>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Pregunta al copilot…" rows={1} />
          <button className="ci-send" aria-label="Enviar">↑</button>
        </div>
      </div>
    </div>
  );
}

/* ============================ LAYOUT ============================ */
export function CompanyFichaLayoutV2(props: CompanyFichaLayoutV2Props) {
  const { identity } = props;
  const anon = props.authenticated === false;
  const [active, setActive] = useState<SectionId>('resumen');
  const [collapsed, setCollapsed] = useState(false);

  const name = identity.legal_name ?? identity.cif_normalized ?? 'Empresa';
  const cls = identity.classification;
  const grps = ['Perfil', 'Inteligencia', 'Fuentes'];

  return (
    <div className="afk">
      <style>{FICHA_MOCKUP_CSS}</style>
      <style>{`abbr[title]{text-decoration:underline dotted;text-underline-offset:3px;cursor:help}`}</style>
      <div className="wrap">
        <div className="crumb">Analizar / Empresas / <b>{name}</b></div>
        <div className="chead">
          <div className="clogo">{name.slice(0, 2).toUpperCase()}</div>
          <div>
            <h1>{name}
              {identity.registry_status?.mercantile_status && <span className="vbadge v">● {identity.registry_status.mercantile_status}</span>}
            </h1>
            <div className="csub">{[identity.legal_name, identity.cif_normalized ? `CIF ${identity.cif_normalized}` : null, cls.cnae_description, identity.location.provincia].filter(Boolean).join(' · ')}{identity.contact.web && <> · <a>{identity.contact.web} ↗</a></>}</div>
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
            {active === 'resumen' && <Resumen {...props} anon={anon} />}
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
              : <Senales signal={props.signal} />)}
            {active === 'oportunidades' && (anon
              ? <section className="panel on"><div className="sec-h">Oportunidades</div><Gate what="las oportunidades" /></section>
              : <Oportunidades opportunities={props.opportunities} />)}
            {active === 'gobierno' && <Gobierno governance={props.governance} />}
            {active === 'propiedad' && <Propiedad ownership={props.ownership} />}
            {active === 'eventos' && <Eventos events={props.events} />}
            {['mercado', 'rankings', 'comite', 'sucesion', 'sector', 'registros', 'documentos'].includes(active) && (
              <section className="panel on">
                <div className="sec-h">{NAV.find((n) => n.id === active)?.label}</div>
                <Pending label={NAV.find((n) => n.id === active)?.label ?? active} />
              </section>
            )}
          </main>

          <aside className="deal">
            <div className="escc">Próxima acción</div>
            <div className="dcard">
              <div className="dh"><div className="k">◉ Estado de la compañía</div><div className="v">Pendiente</div></div>
              <div className="db"><p>La recomendación por perfil y estado (en venta, buscando capital, comprando…) se activará al cablear el estado de la compañía a su motor.</p></div>
            </div>
          </aside>
        </div>
      </div>

      <Copilot name={name} />
    </div>
  );
}
