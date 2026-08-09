'use client';
/**
 * CompanyFichaLayoutV2 — Ficha de Empresa redibujada desde el mockup canónico
 * `arroba.com/mockups/ficha-empresa-f01.html` (decisión Daniel 2026-08-08).
 *
 * NO consume datos: recibe las secciones ya cargadas por `CompanyFichaF01Client`
 * (identity/financial/financialAnalysis/valuation/semantic) — mismas props que el
 * layout anterior — y solo cambia la capa visual (3 columnas + nav lateral
 * colapsable + cabecera + columna Next-Best-Action + dock del Copilot).
 *
 * Secciones con dato real HOY: Resumen, Finanzas, Valoración, Comparativa
 * (empresas parecidas). El resto se muestran como bloque "Próximamente" hasta
 * cablear su provider en el intelligence_layer (signal/recommendation/strategy/…).
 * R4/R10: el front NO calcula; solo pinta lo que llega. Campos ausentes → null.
 */
import { useEffect, useRef, useState } from 'react';

import type {
  FinancialAnalysis,
  FinancialSection,
  FinancialTableBlock,
  IdentitySection,
  RecommendationSet,
  SemanticSection,
  SignalAnalysis,
  ValuationAnalysis,
} from '@/lib/companies/intelligence-types';
import {
  Activity, Coins, FileText, GitCompare, Globe, LayoutDashboard, Lightbulb,
  type LucideIcon, Network, Scale, Share2, Star, Target, Users,
} from 'lucide-react';

import { UnavailableBlock } from '@/components/blocks/UnavailableBlock';

const RED = '#FF5757';

/** Count-up animado (presentacional). Devuelve el valor interpolado 0→target. */
function useCountUp(target: number | null | undefined, duration = 800): number {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (target === null || target === undefined || !isFinite(target)) {
      setVal(0);
      return;
    }
    const start = performance.now();
    const from = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setVal(from + (target - from) * eased);
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration]);
  return val;
}

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
}

type SectionId =
  | 'resumen'
  | 'finanzas'
  | 'valoracion'
  | 'comparativa'
  | 'propiedad'
  | 'gobierno'
  | 'mercado'
  | 'rankings'
  | 'senales'
  | 'oportunidades'
  | 'comite';

const NAV: { id: SectionId; label: string; ready: boolean; icon: LucideIcon }[] = [
  { id: 'resumen', label: 'Resumen', ready: true, icon: LayoutDashboard },
  { id: 'finanzas', label: 'Finanzas', ready: true, icon: Coins },
  { id: 'valoracion', label: 'Valoración', ready: true, icon: Scale },
  { id: 'comparativa', label: 'Comparativa', ready: true, icon: GitCompare },
  { id: 'propiedad', label: 'Propiedad', ready: false, icon: Network },
  { id: 'gobierno', label: 'Gobierno', ready: false, icon: Users },
  { id: 'mercado', label: 'Mercado', ready: false, icon: Globe },
  { id: 'rankings', label: 'Rankings', ready: false, icon: Target },
  { id: 'senales', label: 'Señales', ready: true, icon: Activity },
  { id: 'oportunidades', label: 'Oportunidades', ready: true, icon: Lightbulb },
  { id: 'comite', label: 'Comité de inversión', ready: false, icon: Scale },
];

// Nota: la navegación global (Mi trabajo / Cuenta / 3 pilares) vive en el SHELL
// del producto, no en el rail de secciones de la ficha. Se añadirá al montar el shell.

/* ---------------- helpers de formato (presentación, no cálculo) ---------------- */
function fmtEUR(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} M€`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)} k€`;
  return `${v.toLocaleString('es-ES')} €`;
}
function fmtNum(v: number | null | undefined): string {
  return v === null || v === undefined ? '—' : v.toLocaleString('es-ES');
}
function fmtCell(value: number | null, format: string): string {
  if (value === null || value === undefined) return '—';
  if (format === 'percent') return `${value.toFixed(1)}%`;
  if (format === 'ratio' || format === 'multiple') return `${value.toFixed(2)}×`;
  if (format === 'currency') return fmtEUR(value);
  return value.toLocaleString('es-ES');
}
function fmtPct(v: number | null | undefined): string {
  return v === null || v === undefined ? '—' : `${v.toFixed(1)}%`;
}

const RATIO_CAT_LABEL: Record<string, string> = {
  profitability: 'Rentabilidad',
  liquidity: 'Liquidez',
  solvency: 'Solvencia',
  efficiency: 'Eficiencia',
  growth: 'Crecimiento',
};

/** Barra mini de evolución (una serie) — SVG inline, sin librería. */
function MiniBars({ values }: { values: (number | null)[] }) {
  const nums = values.map((v) => (v ?? 0));
  const max = Math.max(1, ...nums.map((n) => Math.abs(n)));
  const w = 160, h = 40, gap = 4;
  const bw = (w - gap * (nums.length - 1)) / Math.max(1, nums.length);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxWidth: w, height: 'auto' }}>
      {nums.map((n, i) => {
        const bh = Math.max(2, (Math.abs(n) / max) * (h - 4));
        return <rect key={i} x={i * (bw + gap)} y={h - bh} width={bw} height={bh} rx={2} fill={RED} opacity={0.25 + 0.75 * (i / Math.max(1, nums.length - 1))} />;
      })}
    </svg>
  );
}

/** Barra de rango de valoración low·central·high. */
function EVRangeBar({ low, central, high }: { low: number | null; high: number | null; central: number | null }) {
  if (low === null || high === null || high <= low) return null;
  const pos = central !== null ? Math.min(100, Math.max(0, ((central - low) / (high - low)) * 100)) : 50;
  return (
    <div className="mt-3">
      <div className="relative h-2 rounded-full" style={{ background: '#F0EDE8' }}>
        <div className="absolute top-0 bottom-0 rounded-full" style={{ left: 0, width: '100%', background: '#FFE0E0' }} />
        <div className="absolute -top-1.5 w-4 h-4 rounded-full border-2" style={{ left: `calc(${pos}% - 8px)`, background: '#fff', borderColor: RED }} />
      </div>
      <div className="flex justify-between text-[11px] mt-1" style={{ color: '#8A827A' }}>
        <span>{fmtEUR(low)}</span><span style={{ color: RED, fontWeight: 700 }}>{fmtEUR(central)}</span><span>{fmtEUR(high)}</span>
      </div>
    </div>
  );
}

/* ---------------- subcomponentes ---------------- */
function Card({ title, sub, children }: { title?: string; sub?: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5 mb-4"
      style={{ background: '#fff', border: '1px solid var(--border, #ECE9E4)', animation: 'arrFadeUp .4s ease both' }}
    >
      {title && <h3 className="text-sm font-semibold mb-1" style={{ color: '#141210' }}>{title}</h3>}
      {sub && <div className="text-xs mb-3" style={{ color: '#8A827A' }}>{sub}</div>}
      {children}
    </div>
  );
}

function FinTable({ block }: { block: FinancialTableBlock }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left py-2 pr-3 font-semibold" style={{ color: '#8A827A' }}>Concepto</th>
            {block.years.map((y) => (
              <th key={y} className="text-right py-2 px-3 font-semibold" style={{ color: '#8A827A' }}>{y}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row) => {
            const strong = row.category === 'total' || row.category === 'subtotal';
            return (
              <tr key={row.key} style={{ borderTop: '1px solid var(--border, #F0EDE8)' }}>
                <td className="py-2 pr-3" style={{ color: '#3A362F', fontWeight: strong ? 700 : 400 }}>{row.label}</td>
                {row.values.map((c, i) => (
                  <td
                    key={i}
                    className="py-2 px-3 text-right tabular-nums"
                    style={{
                      fontWeight: strong ? 700 : 500,
                      color:
                        c.semantic === 'positive' ? '#1B9E5A'
                          : c.semantic === 'negative' ? '#C0392B'
                            : '#141210',
                    }}
                  >
                    {fmtCell(c.value, c.format)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Soon({ label }: { label: string }) {
  return (
    <UnavailableBlock
      testId={`ficha-v2-soon-${label}`}
      title={`${label} · próximamente`}
      description="Esta sección se conectará a su motor de inteligencia en la siguiente fase de cableado."
      req="intelligence_layer · provider pendiente"
    />
  );
}

/* ---------------- secciones ---------------- */
function Resumen({ identity, financialAnalysis, valuation, semantic, signal, buyers }: Pick<CompanyFichaLayoutV2Props, 'identity' | 'financialAnalysis' | 'valuation' | 'semantic' | 'signal' | 'buyers'>) {
  const loc = identity.location;
  const cls = identity.classification;
  const k = financialAnalysis?.kpis ?? null;
  const quality = financialAnalysis?.financial_quality?.score ?? null;
  const opportunity = signal?.score?.signal_score ?? null;
  const topBuyer = buyers?.recommendations?.[0]?.score ?? null;
  const engagement = topBuyer != null ? (topBuyer <= 1 ? topBuyer * 100 : topBuyer) : null;
  return (
    <>
      <Card title="Scoring Arroba" sub="Calidad · encaje · oportunidad">
        <div className="flex gap-10 justify-center flex-wrap py-1">
          <Ring label="Calidad" value={quality} color="#1B9E5A" />
          <Ring label="Encaje" value={engagement} color={RED} pendingNote="Se activa al cablear el motor de recomendación" />
          <Ring label="Oportunidad" value={opportunity} color="#2563EB" pendingNote="Se activa al cablear el motor de señales" />
        </div>
        <div className="text-[11px] text-center mt-2" style={{ color: '#B8B0A6' }}>
          Los tres con dato real de sus motores (calidad financiera · encaje de comprador · señales).
        </div>
      </Card>
      {k && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Kpi label="Facturación" raw={k.revenue ?? null} format={fmtEUR} />
          <Kpi label="EBITDA" raw={k.ebitda ?? null} format={fmtEUR} sub={k.ebitda_margin != null ? `margen ${fmtPct(k.ebitda_margin)}` : undefined} />
          <Kpi label="Resultado neto" raw={k.net_income ?? null} format={fmtEUR} sub={k.net_margin != null ? `margen ${fmtPct(k.net_margin)}` : undefined} />
          <Kpi label="Crecimiento" raw={k.revenue_cagr ?? k.revenue_growth_yoy ?? null} format={(n) => `${n.toFixed(1)}%`} sub={k.revenue_cagr != null ? 'CAGR' : 'interanual'} />
        </div>
      )}
      <Card title="Resumen de la compañía">
        <p className="text-sm leading-relaxed" style={{ color: '#3A362F' }}>
          {identity.description || identity.objeto_social ||
            `${identity.legal_name ?? 'La compañía'} opera en ${cls.cnae_description ?? 'su sector'}${loc.provincia ? `, con domicilio en ${loc.provincia}` : ''}.`}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <Fact k="CIF" v={identity.cif_normalized ?? '—'} />
          <Fact k="CNAE" v={cls.cnae_code ? `${cls.cnae_code} · ${cls.cnae_section ?? ''}` : '—'} />
          <Fact k="Provincia" v={loc.provincia ?? '—'} />
          <Fact k="Empleados" v={fmtNum(identity.size.employees_total)} />
          <Fact k="Capital social" v={fmtEUR(identity.size.capital_social)} />
          <Fact k="Órganos" v={fmtNum(identity.officers_count)} />
          <Fact k="Valoración (EV)" v={fmtEUR(valuation?.enterprise_value ?? null)} />
          <Fact k="Web" v={identity.contact.web ?? '—'} />
        </div>
      </Card>
      {semantic && semantic.value_proposition && (
        <Card title="Qué hace" sub="Perfil semántico">
          <p className="text-sm leading-relaxed" style={{ color: '#3A362F' }}>{semantic.value_proposition}</p>
        </Card>
      )}
    </>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide mb-1" style={{ color: '#8A827A' }}>{k}</div>
      <div className="text-sm font-semibold" style={{ color: '#141210' }}>{v}</div>
    </div>
  );
}

/** Anillo de scoring con relleno horario animado (0–100). value=null → pendiente. */
function Ring({ label, value, color, pendingNote }: { label: string; value: number | null; color: string; pendingNote?: string }) {
  let v = value;
  if (v != null && v <= 1) v = v * 100; // normaliza 0–1 → 0–100
  if (v != null) v = Math.max(0, Math.min(100, v));
  const animated = useCountUp(v ?? 0, 900);
  const R = 26;
  const C = 2 * Math.PI * R;
  const offset = v == null ? C : C * (1 - animated / 100);
  return (
    <div className="flex flex-col items-center gap-1" title={v == null ? pendingNote : undefined}>
      <svg width={76} height={76} viewBox="0 0 76 76">
        <circle cx={38} cy={38} r={R} fill="none" stroke="#F0EDE8" strokeWidth={7} />
        {v != null && (
          <circle
            cx={38} cy={38} r={R} fill="none" stroke={color} strokeWidth={7}
            strokeDasharray={C} strokeDashoffset={offset} strokeLinecap="round"
            transform="rotate(-90 38 38)"
          />
        )}
        <text x={38} y={43} textAnchor="middle" fontSize={17} fontWeight={700} fill={v == null ? '#B8B0A6' : '#141210'}>
          {v == null ? '—' : Math.round(animated)}
        </text>
      </svg>
      <div className="text-[11px] font-semibold" style={{ color: '#3A362F' }}>{label}</div>
    </div>
  );
}

function fmtDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Tooltip propio (hover) al estilo del mockup — sin dependencias. */
function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span style={{ borderBottom: '1px dotted #B8B0A6', cursor: 'help' }}>{children}</span>
      {show && (
        <span
          role="tooltip"
          style={{
            position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, zIndex: 60,
            background: '#141210', color: '#fff', fontSize: 12, lineHeight: 1.45,
            padding: '8px 10px', borderRadius: 8, width: 230, whiteSpace: 'normal',
            boxShadow: '0 8px 24px rgba(20,18,16,.28)', pointerEvents: 'none',
          }}
        >
          {label}
        </span>
      )}
    </span>
  );
}

function HeaderBtn({ icon: Icon, label, primary }: { icon: LucideIcon; label: string; primary?: boolean }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5"
      style={
        primary
          ? { background: RED, color: '#fff' }
          : { background: '#fff', color: '#3A362F', border: '1px solid #ECE9E4' }
      }
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function Kpi({ label, raw, format, sub }: { label: string; raw: number | null | undefined; format: (n: number) => string; sub?: string }) {
  const animated = useCountUp(raw ?? null);
  const display = raw === null || raw === undefined ? '—' : format(animated);
  return (
    <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #ECE9E4', animation: 'arrFadeUp .4s ease both' }}>
      <div className="text-[11px] uppercase tracking-wide mb-1" style={{ color: '#8A827A' }}>{label}</div>
      <div className="text-xl font-bold tabular-nums" style={{ color: '#141210' }}>{display}</div>
      {sub && <div className="text-[11px] mt-0.5" style={{ color: '#8A827A' }}>{sub}</div>}
    </div>
  );
}

const LEVEL_NAMES: Record<number, string> = { 1: 'Ejecutiva', 2: 'Negocio', 3: 'Detalle', 4: 'Máximo' };
function rowMinLevel(cat: string): number {
  if (cat === 'total' || cat === 'subtotal') return 1;
  if (cat === 'line') return 2;
  return 3; // derived
}
function filterBlock(block: FinancialTableBlock, level: number): FinancialTableBlock {
  return { years: block.years, rows: block.rows.filter((r) => rowMinLevel(r.category) <= level) };
}

function Finanzas({ financial }: { financial: FinancialSection | null }) {
  const [level, setLevel] = useState(1);
  if (!financial) return <Soon label="Finanzas" />;
  const ratios = financial.ratios?.items ?? [];
  const cats = Array.from(new Set(ratios.map((r) => r.category)));
  const hasTables = !!(financial.profit_loss || financial.balance);
  if (!hasTables && ratios.length === 0 && !financial.evolution) return <Soon label="Finanzas" />;

  return (
    <>
      {/* Slider nivel de detalle (presentacional; controla qué filas se muestran) */}
      <div className="flex items-center gap-3 mb-4 rounded-full px-4 py-2 w-fit" style={{ background: '#fff', border: '1px solid #ECE9E4' }}>
        <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#8A827A' }}>Nivel de detalle</span>
        <input type="range" min={1} max={4} step={1} value={level} onChange={(e) => setLevel(Number(e.target.value))} style={{ accentColor: RED, width: 140 }} />
        <span className="text-sm font-bold" style={{ color: '#E84545', minWidth: 76 }}>{LEVEL_NAMES[level]}</span>
      </div>

      {financial.evolution && financial.evolution.series.length > 0 && (
        <Card title="Evolución" sub={financial.evolution.years.join(' · ')}>
          <div className="grid grid-cols-2 gap-6">
            {financial.evolution.series.slice(0, 2).map((s) => (
              <div key={s.key}>
                <div className="text-xs mb-1" style={{ color: '#8A827A' }}>{s.label}</div>
                <MiniBars values={s.values} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {financial.profit_loss && <Card title="Cuenta de resultados"><FinTable block={filterBlock(financial.profit_loss, level)} /></Card>}
      {financial.balance && <Card title="Balance"><FinTable block={filterBlock(financial.balance, level)} /></Card>}

      {level >= 2 && ratios.length > 0 && (
        <Card title="Ratios financieros" sub="Valor · percentil sectorial">
          {cats.map((cat) => (
            <div key={cat} className="mb-3">
              <div className="text-[11px] uppercase tracking-wide mb-1" style={{ color: '#8A827A' }}>{RATIO_CAT_LABEL[cat] ?? cat}</div>
              {ratios.filter((r) => r.category === cat).map((r) => (
                <div key={r.key} className="flex items-center justify-between py-1.5 text-sm" style={{ borderTop: '1px solid #F0EDE8' }}>
                  {r.formula
                    ? <Tip label={r.formula}><span style={{ color: '#3A362F' }}>{r.name}</span></Tip>
                    : <span style={{ color: '#3A362F' }}>{r.name}</span>}
                  <span className="flex items-center gap-3">
                    {r.benchmark?.percentile != null && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: '#FFF1F1', color: '#E84545' }}>P{Math.round(r.benchmark.percentile)}</span>
                    )}
                    <b className="tabular-nums" style={{ color: '#141210' }}>{fmtCell(r.value, r.format)}</b>
                  </span>
                </div>
              ))}
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

function Valoracion({ valuation }: { valuation: ValuationAnalysis | null }) {
  if (!valuation || !valuation.has_valuation) return <Soon label="Valoración" />;
  return (
    <Card title="Valoración" sub={valuation.method_label ?? valuation.method ?? undefined}>
      <div className="grid grid-cols-3 gap-4">
        <Fact k="Enterprise Value" v={fmtEUR(valuation.enterprise_value)} />
        <Fact k="Equity Value" v={fmtEUR(valuation.equity_value)} />
        <Fact k="Múltiplo" v={valuation.multiple ? `${valuation.multiple.toFixed(1)}× ${valuation.multiple_basis ?? ''}` : '—'} />
      </div>
      {valuation.range && (
        <EVRangeBar low={valuation.range.low} central={valuation.range.central} high={valuation.range.high} />
      )}
      {valuation.hypotheses.length > 0 && (
        <ul className="mt-3 text-xs list-disc pl-4" style={{ color: '#8A827A' }}>
          {valuation.hypotheses.map((h, i) => <li key={i}>{h}</li>)}
        </ul>
      )}
    </Card>
  );
}

function Comparativa({ semantic, buyers }: { semantic: SemanticSection | null; buyers?: RecommendationSet | null }) {
  const items = semantic?.similar ?? [];
  const buyerItems = buyers?.recommendations ?? [];
  if (items.length === 0 && buyerItems.length === 0) return <Soon label="Comparativa" />;
  return (
    <>
      {buyerItems.length > 0 && (
        <Card title="Compradores que mejor encajarían" sub="Ordenados por encaje (fit). El detalle explica por qué encaja cada uno.">
          {buyerItems.map((b) => (
            <div key={b.master_id ?? b.name} className="py-2.5" style={{ borderTop: '1px solid #F0EDE8' }}>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-sm font-semibold" style={{ color: '#141210' }}>{b.name ?? 'Comprador'}</div>
                  <div className="text-xs" style={{ color: '#8A827A' }}>{[b.sector, b.recommendation_type].filter(Boolean).join(' · ')}</div>
                </div>
                {b.score != null && (
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: RED }}>{Math.round((b.score <= 1 ? b.score * 100 : b.score))}</div>
                    <div className="text-[10px]" style={{ color: '#8A827A' }}>encaje</div>
                  </div>
                )}
              </div>
              {Object.keys(b.fit_dimensions ?? {}).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {Object.entries(b.fit_dimensions).map(([k, v]) => (
                    <span key={k} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: '#FFF1F1', color: '#E84545' }}>
                      {k} {Math.round((v <= 1 ? v * 100 : v))}
                    </span>
                  ))}
                </div>
              )}
              {b.reason && <div className="text-xs mt-1" style={{ color: '#8A827A' }}>{b.reason}</div>}
            </div>
          ))}
        </Card>
      )}
      {items.length > 0 && (
    <Card title="Empresas parecidas" sub="Similitud por Fingerprint (modelo, sector, tamaño, márgenes, territorio)">
      {items.map((s) => (
        <div key={s.master_id ?? s.name} className="flex items-center gap-3 py-2" style={{ borderTop: '1px solid #F0EDE8' }}>
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: '#141210' }}>{s.name}</div>
            <div className="text-xs" style={{ color: '#8A827A' }}>
              {[s.sector, s.region].filter(Boolean).join(' · ')}
              {s.matched_dimensions.length > 0 && ` · se parece en ${s.matched_dimensions.join(', ')}`}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold" style={{ color: RED }}>{s.score.toFixed(2)}</div>
            <div className="text-[10px]" style={{ color: '#8A827A' }}>similitud</div>
          </div>
        </div>
      ))}
    </Card>
      )}
    </>
  );
}

function Senales({ signal }: { signal: SignalAnalysis | null | undefined }) {
  const items = signal?.signals ?? [];
  if (items.length === 0) return <Soon label="Señales" />;
  const polColor = (p: string | null) =>
    p === 'positive' ? '#1B9E5A' : p === 'negative' ? '#C0392B' : '#8A827A';
  return (
    <Card
      title="Señales"
      sub={signal?.score?.signal_score != null ? `Signal score ${Math.round(signal.score.signal_score)}` : undefined}
    >
      {items.map((s) => (
        <div key={s.signal_id} className="flex items-start gap-3 py-2" style={{ borderTop: '1px solid #F0EDE8' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: polColor(s.polarity), marginTop: 6, flexShrink: 0 }} />
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: '#141210' }}>{s.title ?? s.signal_type ?? 'Señal'}</div>
            <div className="text-xs" style={{ color: '#8A827A' }}>
              {[s.category, s.severity ? `severidad ${s.severity}` : null, s.detected_at].filter(Boolean).join(' · ')}
            </div>
          </div>
          {s.confidence != null && (
            <span className="text-[11px]" style={{ color: '#8A827A' }}>{Math.round(s.confidence * 100)}%</span>
          )}
        </div>
      ))}
    </Card>
  );
}

function Oportunidades({ opportunities }: { opportunities?: RecommendationSet | null }) {
  const items = opportunities?.recommendations ?? [];
  if (items.length === 0) return <Soon label="Oportunidades" />;
  return (
    <Card title="Oportunidades detectadas" sub="Tesis y movimientos con encaje para esta compañía">
      {items.map((o) => (
        <div key={o.master_id ?? o.name} className="py-2.5" style={{ borderTop: '1px solid #F0EDE8' }}>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-sm font-semibold" style={{ color: '#141210' }}>{o.name ?? 'Oportunidad'}</div>
              <div className="text-xs" style={{ color: '#8A827A' }}>{o.recommendation_type ?? ''}</div>
            </div>
            {o.score != null && (
              <div className="text-right">
                <div className="text-sm font-bold" style={{ color: RED }}>{Math.round(o.score <= 1 ? o.score * 100 : o.score)}</div>
                <div className="text-[10px]" style={{ color: '#8A827A' }}>encaje</div>
              </div>
            )}
          </div>
          {o.reason && <div className="text-xs mt-1" style={{ color: '#8A827A' }}>{o.reason}</div>}
        </div>
      ))}
    </Card>
  );
}

/** Dock del Copilot: minimizado (píldora) ↔ abierto (composer). Stub sin backend. */
function CopilotDock({ companyName }: { companyName: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  if (!open) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => setOpen(true)}
          className="rounded-full px-5 py-3 text-sm font-semibold shadow-lg"
          style={{ background: RED, color: '#fff' }}
        >
          @ Preguntar al Copilot
        </button>
      </div>
    );
  }
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(680px,92vw)]" style={{ animation: 'arrFadeUp .25s ease both' }}>
      <div className="rounded-2xl shadow-2xl p-3" style={{ background: '#fff', border: '1px solid #ECE9E4' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="grid place-items-center w-6 h-6 rounded-md text-xs font-bold" style={{ background: RED, color: '#fff' }}>@</span>
          <span className="text-xs font-semibold" style={{ color: '#141210' }}>Copilot · {companyName}</span>
          <button onClick={() => setOpen(false)} className="ml-auto text-sm" style={{ color: '#8A827A' }} aria-label="Minimizar">—</button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Pregunta sobre esta compañía…"
          rows={2}
          className="w-full resize-none text-sm p-2 rounded-lg outline-none"
          style={{ border: '1px solid #ECE9E4', color: '#141210' }}
        />
        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-2 flex-wrap">
            {['¿Es atractiva a esta valoración?', '¿Quién encaja como comprador?', 'Resume los riesgos'].map((c) => (
              <button key={c} onClick={() => setText(c)} className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: '#FFF1F1', color: '#E84545' }}>{c}</button>
            ))}
          </div>
          <button className="text-sm font-semibold px-4 py-1.5 rounded-lg" style={{ background: RED, color: '#fff', opacity: text.trim() ? 1 : 0.5 }} disabled={!text.trim()}>
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- layout ---------------- */
export function CompanyFichaLayoutV2({
  identity,
  financial,
  financialAnalysis,
  valuation,
  semantic,
  signal,
  buyers,
  opportunities,
}: CompanyFichaLayoutV2Props) {
  const [active, setActive] = useState<SectionId>('resumen');
  const [navOpen, setNavOpen] = useState(true);

  return (
    <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
      {/* Cabecera */}
      <header className="px-6 py-4 flex items-start gap-4" style={{ background: '#fff', borderBottom: '1px solid #ECE9E4' }}>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-wide" style={{ color: '#8A827A' }}>
            {identity.classification.cnae_description ?? 'Empresa'}
          </div>
          <h1 className="text-xl font-bold truncate" style={{ color: '#141210' }}>
            {identity.legal_name ?? identity.cif_normalized ?? 'Empresa'}
          </h1>
          <div className="text-sm" style={{ color: '#8A827A' }}>
            {[identity.cif_normalized, identity.location.provincia].filter(Boolean).join(' · ')}
          </div>
          {(fmtDate(identity.metadata?.updated_at) || identity.metadata?.confidence?.level) && (
            <div className="text-[11px] mt-1 flex items-center gap-2" style={{ color: '#B8B0A6' }}>
              {fmtDate(identity.metadata?.updated_at) && <span>Actualizado {fmtDate(identity.metadata?.updated_at)}</span>}
              {identity.metadata?.confidence?.level && (
                <span className="px-1.5 py-0.5 rounded-full" style={{ background: '#F0EDE8', color: '#8A827A' }}>
                  confianza {identity.metadata.confidence.level}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <HeaderBtn icon={Star} label="Watchlist" />
          <HeaderBtn icon={Share2} label="Compartir" />
          <HeaderBtn icon={FileText} label="Generar informe" primary />
        </div>
      </header>

      <div className="flex">
        {/* Nav lateral colapsable */}
        <nav
          className="shrink-0 transition-all py-4"
          style={{ width: navOpen ? 220 : 56, background: '#fff', borderRight: '1px solid #ECE9E4', minHeight: 'calc(100vh - 76px)' }}
          onMouseEnter={() => setNavOpen(true)}
        >
          <button
            className="mx-3 mb-3 text-xs"
            style={{ color: '#8A827A' }}
            onClick={() => setNavOpen((o) => !o)}
            aria-label="Colapsar navegación"
          >
            {navOpen ? '«' : '»'}
          </button>
          {navOpen && <div className="px-4 mb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#B8B0A6' }}>Empresa</div>}
          {NAV.map((n) => {
            const on = n.id === active;
            const Icon = n.icon;
            return (
              <button
                key={n.id}
                onClick={() => setActive(n.id)}
                title={n.label}
                className="w-full text-left px-4 py-2 text-sm flex items-center gap-2.5"
                style={{
                  color: on ? RED : '#3A362F',
                  fontWeight: on ? 700 : 500,
                  background: on ? '#FFF1F1' : 'transparent',
                  borderLeft: on ? `3px solid ${RED}` : '3px solid transparent',
                }}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                {navOpen && <span>{n.label}</span>}
                {navOpen && !n.ready && (
                  <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: '#F0EDE8', color: '#8A827A' }}>pronto</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Contenido */}
        <main className="flex-1 p-6 max-w-4xl">
          {active === 'resumen' && <Resumen identity={identity} financialAnalysis={financialAnalysis} valuation={valuation} semantic={semantic} signal={signal} buyers={buyers} />}
          {active === 'finanzas' && <Finanzas financial={financial} />}
          {active === 'valoracion' && <Valoracion valuation={valuation} />}
          {active === 'comparativa' && <Comparativa semantic={semantic} buyers={buyers} />}
          {active === 'senales' && <Senales signal={signal} />}
          {active === 'oportunidades' && <Oportunidades opportunities={opportunities} />}
          {['propiedad', 'gobierno', 'mercado', 'rankings', 'comite'].includes(active) && (
            <Soon label={NAV.find((n) => n.id === active)?.label ?? active} />
          )}
        </main>

        {/* Columna Next-Best-Action (placeholder hasta cablear estado/intención) */}
        <aside className="shrink-0 p-5 hidden lg:block" style={{ width: 300 }}>
          <div className="rounded-xl p-4" style={{ background: '#141210', color: '#fff' }}>
            <div className="text-xs uppercase tracking-wide mb-1" style={{ color: RED }}>Próxima acción</div>
            <div className="text-sm" style={{ color: '#EDEAE5' }}>
              La recomendación por perfil y estado se activará al cablear el estado de la compañía.
            </div>
          </div>
        </aside>
      </div>

      {/* Dock Copilot funcional */}
      <CopilotDock companyName={identity.legal_name ?? identity.cif_normalized ?? 'empresa'} />

      {/* Keyframes de animación (scoped, sin librería) */}
      <style>{`@keyframes arrFadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
