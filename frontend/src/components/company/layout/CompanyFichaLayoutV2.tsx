'use client';
/**
 * CompanyFichaLayoutV2 — Ficha de Empresa redibujada desde el mockup canónico
 * `arroba.com/mockups/ficha-empresa-f01.html` (decisión Daniel 2026-08-08).
 * Pasada de fidelidad visual 2026-08-09: estilo de marca (#FF5757), tarjetas,
 * tipografía, anillos, tablas, chips, barra EV, compradores y dock del Copilot,
 * acercándolo al mockup. NO consume datos: recibe las secciones ya cargadas por
 * `CompanyFichaF01Client` (identity/financial/valuation/semantic/signal/buyers/
 * opportunities). R4/R10: el front NO calcula; solo pinta lo que llega.
 */
import { useEffect, useRef, useState } from 'react';

import {
  Activity, Coins, FileText, GitCompare, Globe, LayoutDashboard, Lightbulb,
  type LucideIcon, Network, Scale, Share2, Star, Target, Users,
} from 'lucide-react';

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
import { UnavailableBlock } from '@/components/blocks/UnavailableBlock';

const RED = '#FF5757';

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
  | 'resumen' | 'finanzas' | 'valoracion' | 'comparativa' | 'propiedad'
  | 'gobierno' | 'mercado' | 'rankings' | 'senales' | 'oportunidades' | 'comite';

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

/* ============================ helpers ============================ */
function useCountUp(target: number | null | undefined, duration = 900): number {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (target === null || target === undefined || !isFinite(target)) { setVal(0); return; }
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(target * eased);
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);
  return val;
}

function fmtEUR(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} M€`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)} k€`;
  return `${v.toLocaleString('es-ES')} €`;
}
function fmtNum(v: number | null | undefined): string {
  return v === null || v === undefined ? '—' : v.toLocaleString('es-ES');
}
function fmtPct(v: number | null | undefined): string {
  return v === null || v === undefined ? '—' : `${v.toFixed(1)}%`;
}
function fmtCell(value: number | null, format: string): string {
  if (value === null || value === undefined) return '—';
  if (format === 'percent') return `${value.toFixed(1)}%`;
  if (format === 'ratio' || format === 'multiple') return `${value.toFixed(2)}×`;
  if (format === 'currency') return fmtEUR(value);
  return value.toLocaleString('es-ES');
}
function fmtDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}
const RATIO_CAT_LABEL: Record<string, string> = {
  profitability: 'Rentabilidad', liquidity: 'Liquidez', solvency: 'Solvencia',
  efficiency: 'Eficiencia', growth: 'Crecimiento',
};
const LEVEL_NAMES: Record<number, string> = { 1: 'Ejecutiva', 2: 'Negocio', 3: 'Detalle', 4: 'Máximo' };

/* ============================ átomos UI ============================ */
function Card({ title, sub, children, pad = true }: { title?: string; sub?: string; children: React.ReactNode; pad?: boolean }) {
  return (
    <div className="af-card" style={{ padding: pad ? 20 : 0 }}>
      {title && <h3 className="af-cardh"><span className="af-key" />{title}</h3>}
      {sub && <div className="af-cs">{sub}</div>}
      {children}
    </div>
  );
}
function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="af-lbl">{k}</div>
      <div className="af-factv">{v}</div>
    </div>
  );
}
function Kpi({ label, raw, format, sub }: { label: string; raw: number | null | undefined; format: (n: number) => string; sub?: string }) {
  const animated = useCountUp(raw ?? null);
  const display = raw === null || raw === undefined ? '—' : format(animated);
  return (
    <div className="af-kpi">
      <div className="af-lbl">{label}</div>
      <div className="af-kpiv">{display}</div>
      {sub && <div className="af-kpisub">{sub}</div>}
    </div>
  );
}
function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span className="af-tipw" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span className="af-tiptrg">{children}</span>
      {show && <span className="af-tip">{label}</span>}
    </span>
  );
}
function HeaderBtn({ icon: Icon, label, primary }: { icon: LucideIcon; label: string; primary?: boolean }) {
  return (
    <button type="button" className={primary ? 'af-btn af-btn-primary' : 'af-btn'}>
      <Icon size={14} /> {label}
    </button>
  );
}
function Ring({ label, value, color, pendingNote }: { label: string; value: number | null; color: string; pendingNote?: string }) {
  let v = value;
  if (v != null && v <= 1) v = v * 100;
  if (v != null) v = Math.max(0, Math.min(100, v));
  const animated = useCountUp(v ?? 0, 900);
  const R = 30, C = 2 * Math.PI * R;
  const offset = v == null ? C : C * (1 - animated / 100);
  return (
    <div className="af-ringw" title={v == null ? pendingNote : undefined}>
      <svg width={84} height={84} viewBox="0 0 84 84">
        <circle cx={42} cy={42} r={R} fill="none" stroke="#F0EDE8" strokeWidth={8} />
        {v != null && (
          <circle cx={42} cy={42} r={R} fill="none" stroke={color} strokeWidth={8}
            strokeDasharray={C} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 42 42)" />
        )}
        <text x={42} y={48} textAnchor="middle" fontSize={20} fontWeight={750} fill={v == null ? '#B8B0A6' : '#141210'}>
          {v == null ? '—' : Math.round(animated)}
        </text>
      </svg>
      <div className="af-ringlbl">{label}</div>
    </div>
  );
}
function MiniBars({ values }: { values: (number | null)[] }) {
  const nums = values.map((v) => v ?? 0);
  const max = Math.max(1, ...nums.map((n) => Math.abs(n)));
  const w = 170, h = 46, gap = 6;
  const bw = (w - gap * (nums.length - 1)) / Math.max(1, nums.length);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxWidth: w, height: 'auto' }}>
      {nums.map((n, i) => {
        const bh = Math.max(3, (Math.abs(n) / max) * (h - 4));
        return <rect key={i} x={i * (bw + gap)} y={h - bh} width={bw} height={bh} rx={3} fill={RED} opacity={0.3 + 0.7 * (i / Math.max(1, nums.length - 1))} />;
      })}
    </svg>
  );
}
function EVRangeBar({ low, central, high }: { low: number | null; high: number | null; central: number | null }) {
  if (low === null || high === null || high <= low) return null;
  const pos = central !== null ? Math.min(100, Math.max(0, ((central - low) / (high - low)) * 100)) : 50;
  return (
    <div style={{ marginTop: 14 }}>
      <div className="af-evtrack"><div className="af-evfill" /><div className="af-evknob" style={{ left: `calc(${pos}% - 9px)` }} /></div>
      <div className="af-evlabels"><span>{fmtEUR(low)}</span><span className="af-evc">{fmtEUR(central)}</span><span>{fmtEUR(high)}</span></div>
    </div>
  );
}
function Soon({ label }: { label: string }) {
  return (
    <UnavailableBlock testId={`ficha-v2-soon-${label}`} title={`${label} · próximamente`}
      description="Esta sección se conectará a su motor de inteligencia en la siguiente fase de cableado."
      req="intelligence_layer · provider pendiente" />
  );
}
function FinTable({ block }: { block: FinancialTableBlock }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="af-table">
        <thead>
          <tr><th>Concepto</th>{block.years.map((y) => <th key={y} className="r">{y}</th>)}</tr>
        </thead>
        <tbody>
          {block.rows.map((row) => {
            const strong = row.category === 'total' || row.category === 'subtotal';
            return (
              <tr key={row.key}>
                <td style={{ fontWeight: strong ? 700 : 400 }}>{row.label}</td>
                {row.values.map((c, i) => (
                  <td key={i} className="r tab" style={{ fontWeight: strong ? 700 : 500, color: c.semantic === 'positive' ? '#1B9E5A' : c.semantic === 'negative' ? '#C0392B' : '#141210' }}>
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

/* ============================ secciones ============================ */
function Resumen({ identity, financialAnalysis, valuation, semantic, signal, buyers }: Pick<CompanyFichaLayoutV2Props, 'identity' | 'financialAnalysis' | 'valuation' | 'semantic' | 'signal' | 'buyers'>) {
  const loc = identity.location, cls = identity.classification;
  const k = financialAnalysis?.kpis ?? null;
  const quality = financialAnalysis?.financial_quality?.score ?? null;
  const opportunity = signal?.score?.signal_score ?? null;
  const topBuyer = buyers?.recommendations?.[0]?.score ?? null;
  const engagement = topBuyer != null ? (topBuyer <= 1 ? topBuyer * 100 : topBuyer) : null;
  return (
    <>
      <Card title="Scoring Arroba" sub="Calidad · encaje · oportunidad">
        <div className="af-rings">
          <Ring label="Calidad" value={quality} color="#1B9E5A" />
          <Ring label="Encaje" value={engagement} color={RED} pendingNote="Se activa al cablear el motor de recomendación" />
          <Ring label="Oportunidad" value={opportunity} color="#2563EB" pendingNote="Se activa al cablear el motor de señales" />
        </div>
        <div className="af-note">Con dato real de sus motores: calidad financiera · encaje de comprador · señales.</div>
      </Card>

      {k && (
        <div className="af-kpigrid">
          <Kpi label="Facturación" raw={k.revenue ?? null} format={fmtEUR} />
          <Kpi label="EBITDA" raw={k.ebitda ?? null} format={fmtEUR} sub={k.ebitda_margin != null ? `margen ${fmtPct(k.ebitda_margin)}` : undefined} />
          <Kpi label="Resultado neto" raw={k.net_income ?? null} format={fmtEUR} sub={k.net_margin != null ? `margen ${fmtPct(k.net_margin)}` : undefined} />
          <Kpi label="Crecimiento" raw={k.revenue_cagr ?? k.revenue_growth_yoy ?? null} format={(n) => `${n.toFixed(1)}%`} sub={k.revenue_cagr != null ? 'CAGR' : 'interanual'} />
        </div>
      )}

      <Card title="Resumen de la compañía">
        <p className="af-body">
          {identity.description || identity.objeto_social ||
            `${identity.legal_name ?? 'La compañía'} opera en ${cls.cnae_description ?? 'su sector'}${loc.provincia ? `, con domicilio en ${loc.provincia}` : ''}.`}
        </p>
        <div className="af-facts">
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
      {semantic?.value_proposition && (
        <Card title="Qué hace" sub="Perfil semántico"><p className="af-body">{semantic.value_proposition}</p></Card>
      )}
    </>
  );
}

function rowMinLevel(cat: string): number { return cat === 'total' || cat === 'subtotal' ? 1 : cat === 'line' ? 2 : 3; }
function filterBlock(b: FinancialTableBlock, level: number): FinancialTableBlock {
  return { years: b.years, rows: b.rows.filter((r) => rowMinLevel(r.category) <= level) };
}
function Finanzas({ financial }: { financial: FinancialSection | null }) {
  const [level, setLevel] = useState(1);
  if (!financial) return <Soon label="Finanzas" />;
  const ratios = financial.ratios?.items ?? [];
  const cats = Array.from(new Set(ratios.map((r) => r.category)));
  if (!financial.profit_loss && !financial.balance && ratios.length === 0 && !financial.evolution) return <Soon label="Finanzas" />;
  return (
    <>
      <div className="af-slider">
        <span className="af-lbl">Nivel de detalle</span>
        <input type="range" min={1} max={4} step={1} value={level} onChange={(e) => setLevel(Number(e.target.value))} style={{ accentColor: RED, width: 150 }} />
        <span className="af-sliderv">{LEVEL_NAMES[level]}</span>
      </div>
      {financial.evolution && financial.evolution.series.length > 0 && (
        <Card title="Evolución" sub={financial.evolution.years.join(' · ')}>
          <div className="af-evo">
            {financial.evolution.series.slice(0, 2).map((s) => (
              <div key={s.key}><div className="af-lbl" style={{ marginBottom: 4 }}>{s.label}</div><MiniBars values={s.values} /></div>
            ))}
          </div>
        </Card>
      )}
      {financial.profit_loss && <Card title="Cuenta de resultados"><FinTable block={filterBlock(financial.profit_loss, level)} /></Card>}
      {financial.balance && <Card title="Balance"><FinTable block={filterBlock(financial.balance, level)} /></Card>}
      {level >= 2 && ratios.length > 0 && (
        <Card title="Ratios financieros" sub="Valor · percentil sectorial">
          {cats.map((cat) => (
            <div key={cat} style={{ marginBottom: 12 }}>
              <div className="af-lbl" style={{ marginBottom: 4 }}>{RATIO_CAT_LABEL[cat] ?? cat}</div>
              {ratios.filter((r) => r.category === cat).map((r) => (
                <div key={r.key} className="af-row">
                  {r.formula ? <Tip label={r.formula}><span>{r.name}</span></Tip> : <span>{r.name}</span>}
                  <span className="af-rowr">
                    {r.benchmark?.percentile != null && <span className="af-chip">P{Math.round(r.benchmark.percentile)}</span>}
                    <b className="tab">{fmtCell(r.value, r.format)}</b>
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
      <div className="af-facts3">
        <Fact k="Enterprise Value" v={fmtEUR(valuation.enterprise_value)} />
        <Fact k="Equity Value" v={fmtEUR(valuation.equity_value)} />
        <Fact k="Múltiplo" v={valuation.multiple ? `${valuation.multiple.toFixed(1)}× ${valuation.multiple_basis ?? ''}` : '—'} />
      </div>
      {valuation.range && <EVRangeBar low={valuation.range.low} central={valuation.range.central} high={valuation.range.high} />}
      {valuation.hypotheses.length > 0 && (
        <ul className="af-hyp">{valuation.hypotheses.map((h, i) => <li key={i}>{h}</li>)}</ul>
      )}
    </Card>
  );
}

function BuyerList({ items, title, sub }: { items: RecommendationSet['recommendations']; title: string; sub: string }) {
  return (
    <Card title={title} sub={sub}>
      {items.map((b) => (
        <div key={b.master_id ?? b.name} className="af-brow">
          <div className="af-browtop">
            <div style={{ flex: 1 }}>
              <div className="af-bname">{b.name ?? 'Comprador'}</div>
              <div className="af-bsub">{[b.sector, b.recommendation_type].filter(Boolean).join(' · ')}</div>
            </div>
            {b.score != null && (
              <div style={{ textAlign: 'right' }}>
                <div className="af-bscore">{Math.round(b.score <= 1 ? b.score * 100 : b.score)}</div>
                <div className="af-lbl">encaje</div>
              </div>
            )}
          </div>
          {Object.keys(b.fit_dimensions ?? {}).length > 0 && (
            <div className="af-chips">{Object.entries(b.fit_dimensions).map(([k, v]) => (
              <span key={k} className="af-chip">{k} {Math.round(v <= 1 ? v * 100 : v)}</span>
            ))}</div>
          )}
          {b.reason && <div className="af-bsub" style={{ marginTop: 4 }}>{b.reason}</div>}
        </div>
      ))}
    </Card>
  );
}
function Comparativa({ semantic, buyers }: { semantic: SemanticSection | null; buyers?: RecommendationSet | null }) {
  const items = semantic?.similar ?? [];
  const buyerItems = buyers?.recommendations ?? [];
  if (items.length === 0 && buyerItems.length === 0) return <Soon label="Comparativa" />;
  return (
    <>
      {buyerItems.length > 0 && <BuyerList items={buyerItems} title="Compradores que mejor encajarían" sub="Ordenados por encaje (fit); el detalle explica por qué encaja cada uno." />}
      {items.length > 0 && (
        <Card title="Empresas parecidas" sub="Similitud por Fingerprint (modelo, sector, tamaño, márgenes, territorio)">
          {items.map((s) => (
            <div key={s.master_id ?? s.name} className="af-simrow">
              <div style={{ flex: 1 }}>
                <div className="af-bname">{s.name}</div>
                <div className="af-bsub">{[s.sector, s.region].filter(Boolean).join(' · ')}{s.matched_dimensions.length > 0 && ` · se parece en ${s.matched_dimensions.join(', ')}`}</div>
              </div>
              <div style={{ textAlign: 'right' }}><div className="af-bscore">{s.score.toFixed(2)}</div><div className="af-lbl">similitud</div></div>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

function Senales({ signal }: { signal?: SignalAnalysis | null }) {
  const items = signal?.signals ?? [];
  if (items.length === 0) return <Soon label="Señales" />;
  const pol = (p: string | null) => p === 'positive' ? '#1B9E5A' : p === 'negative' ? '#C0392B' : '#8A827A';
  return (
    <Card title="Señales" sub={signal?.score?.signal_score != null ? `Signal score ${Math.round(signal.score.signal_score)}` : undefined}>
      {items.map((s) => (
        <div key={s.signal_id} className="af-simrow" style={{ alignItems: 'flex-start' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: pol(s.polarity), marginTop: 6, flexShrink: 0 }} />
          <div style={{ flex: 1, marginLeft: 10 }}>
            <div className="af-bname">{s.title ?? s.signal_type ?? 'Señal'}</div>
            <div className="af-bsub">{[s.category, s.severity ? `severidad ${s.severity}` : null, s.detected_at].filter(Boolean).join(' · ')}</div>
          </div>
          {s.confidence != null && <span className="af-bsub">{Math.round(s.confidence * 100)}%</span>}
        </div>
      ))}
    </Card>
  );
}
function Oportunidades({ opportunities }: { opportunities?: RecommendationSet | null }) {
  const items = opportunities?.recommendations ?? [];
  if (items.length === 0) return <Soon label="Oportunidades" />;
  return <BuyerList items={items} title="Oportunidades detectadas" sub="Tesis y movimientos con encaje para esta compañía" />;
}

/* ============================ Copilot dock (@ dot-matrix) ============================ */
const AT_GRID = ['..XXXX..', '.X....X.', 'X..XX..X', 'X.X..X.X', 'X.X..X.X', 'X..XXXXX', '.X......', '..XXXX..'];
function AtMark({ color = '#fff', size = 20 }: { color?: string; size?: number }) {
  const cell = size / 8;
  const rects: React.ReactNode[] = [];
  AT_GRID.forEach((row, r) => row.split('').forEach((c, x) => {
    if (c === 'X') rects.push(<rect key={`${r}-${x}`} x={x * cell} y={r * cell} width={cell * 0.82} height={cell * 0.82} rx={cell * 0.2} fill={color} />);
  }));
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{rects}</svg>;
}
function CopilotDock({ companyName }: { companyName: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  if (!open) {
    return (
      <div className="af-dockmin"><button onClick={() => setOpen(true)} className="af-dockbtn"><AtMark /> Preguntar al Copilot</button></div>
    );
  }
  return (
    <div className="af-dock">
      <div className="af-dockhead">
        <span className="af-dockat"><AtMark size={16} /></span>
        <span className="af-dockttl">Copilot · {companyName}</span>
        <button onClick={() => setOpen(false)} className="af-dockmini" aria-label="Minimizar">—</button>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Pregunta sobre esta compañía…" rows={2} className="af-dockta" />
      <div className="af-dockfoot">
        <div className="af-chips">
          {['¿Es atractiva a esta valoración?', '¿Quién encaja como comprador?', 'Resume los riesgos'].map((c) => (
            <button key={c} onClick={() => setText(c)} className="af-chip af-chipbtn">{c}</button>
          ))}
        </div>
        <button className="af-btn af-btn-primary" style={{ opacity: text.trim() ? 1 : 0.5 }} disabled={!text.trim()}>Enviar</button>
      </div>
    </div>
  );
}

/* ============================ layout ============================ */
export function CompanyFichaLayoutV2({
  identity, financial, financialAnalysis, valuation, semantic, signal, buyers, opportunities,
}: CompanyFichaLayoutV2Props) {
  const [active, setActive] = useState<SectionId>('resumen');
  const [navOpen, setNavOpen] = useState(true);

  return (
    <div className="af-wrap">
      <style>{AF_CSS}</style>

      <header className="af-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="af-eyebrow">{identity.classification.cnae_description ?? 'Empresa'}</div>
          <h1 className="af-title">{identity.legal_name ?? identity.cif_normalized ?? 'Empresa'}</h1>
          <div className="af-sub">{[identity.cif_normalized, identity.location.provincia].filter(Boolean).join(' · ')}</div>
          {(fmtDate(identity.metadata?.updated_at) || identity.metadata?.confidence?.level) && (
            <div className="af-meta">
              {fmtDate(identity.metadata?.updated_at) && <span>Actualizado {fmtDate(identity.metadata?.updated_at)}</span>}
              {identity.metadata?.confidence?.level && <span className="af-chip">confianza {identity.metadata.confidence.level}</span>}
            </div>
          )}
        </div>
        <div className="af-actions">
          <HeaderBtn icon={Star} label="Watchlist" />
          <HeaderBtn icon={Share2} label="Compartir" />
          <HeaderBtn icon={FileText} label="Generar informe" primary />
        </div>
      </header>

      <div className="af-body-grid">
        <nav className="af-nav" style={{ width: navOpen ? 232 : 60 }} onMouseEnter={() => setNavOpen(true)}>
          <button className="af-navcollapse" onClick={() => setNavOpen((o) => !o)} aria-label="Colapsar">{navOpen ? '«' : '»'}</button>
          {navOpen && <div className="af-navgrp">Empresa</div>}
          {NAV.map((n) => {
            const on = n.id === active; const Icon = n.icon;
            return (
              <button key={n.id} onClick={() => setActive(n.id)} title={n.label} className={`af-navitem${on ? ' on' : ''}`}>
                <Icon size={17} style={{ flexShrink: 0 }} />
                {navOpen && <span>{n.label}</span>}
                {navOpen && !n.ready && <span className="af-soon">pronto</span>}
              </button>
            );
          })}
        </nav>

        <main className="af-main">
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

        <aside className="af-aside">
          <div className="af-nba">
            <div className="af-nbah">Próxima acción</div>
            <div className="af-nbat">La recomendación por perfil y estado se activará al cablear el estado de la compañía.</div>
          </div>
        </aside>
      </div>

      <CopilotDock companyName={identity.legal_name ?? identity.cif_normalized ?? 'empresa'} />
    </div>
  );
}

/* ============================ estilos (look mockup) ============================ */
const AF_CSS = `
.af-wrap{min-height:100vh;background:#FAF8F5;color:#141210;font-feature-settings:"tnum" 0}
.af-wrap .tab{font-variant-numeric:tabular-nums}
.af-lbl{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#8A827A;margin-bottom:3px}
.af-body{font-size:14px;line-height:1.6;color:#3A362F;margin:0}
/* header */
.af-header{display:flex;align-items:flex-start;gap:16px;padding:20px 28px;background:#fff;border-bottom:1px solid #ECE9E4;position:sticky;top:0;z-index:20}
.af-eyebrow{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#B8B0A6}
.af-title{font-size:24px;font-weight:800;letter-spacing:-.01em;margin:2px 0 0;color:#141210;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.af-sub{font-size:13.5px;color:#8A827A;margin-top:2px}
.af-meta{font-size:11px;color:#B8B0A6;margin-top:6px;display:flex;align-items:center;gap:8px}
.af-actions{display:flex;gap:8px;flex-shrink:0}
.af-btn{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:650;border-radius:9px;padding:8px 13px;background:#fff;color:#3A362F;border:1px solid #ECE9E4;cursor:pointer;transition:.14s}
.af-btn:hover{border-color:#D9D3CB;background:#FCFBF9}
.af-btn-primary{background:#141210;color:#fff;border:0}
.af-btn-primary:hover{background:#2a2620}
/* layout grid */
.af-body-grid{display:flex}
.af-nav{flex-shrink:0;background:#fff;border-right:1px solid #ECE9E4;padding:14px 0;min-height:calc(100vh - 78px);transition:width .16s}
.af-navcollapse{margin:0 14px 8px;font-size:13px;color:#B8B0A6;background:none;border:0;cursor:pointer}
.af-navgrp{padding:6px 18px 4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#C7BFB5}
.af-navitem{width:100%;text-align:left;display:flex;align-items:center;gap:11px;padding:9px 18px;font-size:13.5px;font-weight:550;color:#3A362F;background:none;border:0;border-left:3px solid transparent;cursor:pointer;transition:.12s}
.af-navitem:hover{background:#FAF8F5}
.af-navitem.on{color:#E84545;font-weight:750;background:#FFF1F1;border-left-color:#FF5757}
.af-soon{margin-left:auto;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;background:#F0EDE8;color:#8A827A;border-radius:100px;padding:2px 7px}
.af-main{flex:1;padding:24px 28px;max-width:820px}
.af-aside{flex-shrink:0;width:300px;padding:24px 20px}
@media(max-width:1100px){.af-aside{display:none}}
/* cards */
.af-card{background:#fff;border:1px solid #ECE9E4;border-radius:14px;margin-bottom:16px;box-shadow:0 1px 2px rgba(20,18,16,.03);animation:afIn .4s ease both}
.af-cardh{display:flex;align-items:center;gap:9px;font-size:14.5px;font-weight:700;color:#141210;margin:0 0 2px}
.af-key{width:4px;height:15px;border-radius:3px;background:#FF5757;flex-shrink:0}
.af-cs{font-size:12px;color:#8A827A;margin-bottom:14px}
/* scoring rings */
.af-rings{display:flex;gap:44px;justify-content:center;flex-wrap:wrap;padding:6px 0 2px}
.af-ringw{display:flex;flex-direction:column;align-items:center;gap:6px}
.af-ringlbl{font-size:12px;font-weight:650;color:#3A362F}
.af-note{font-size:11px;text-align:center;color:#B8B0A6;margin-top:8px}
/* kpis */
.af-kpigrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}
@media(max-width:720px){.af-kpigrid{grid-template-columns:repeat(2,1fr)}}
.af-kpi{background:#fff;border:1px solid #ECE9E4;border-radius:12px;padding:15px;animation:afIn .4s ease both}
.af-kpiv{font-size:22px;font-weight:800;color:#141210;letter-spacing:-.01em}
.af-kpisub{font-size:11px;color:#8A827A;margin-top:2px}
/* facts */
.af-facts{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:16px}
.af-facts3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
@media(max-width:720px){.af-facts{grid-template-columns:repeat(2,1fr)}}
.af-factv{font-size:14px;font-weight:650;color:#141210;word-break:break-word}
/* tables */
.af-table{width:100%;border-collapse:collapse;font-size:13px}
.af-table th{text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#8A827A;padding:0 10px 9px;border-bottom:1px solid #ECE9E4}
.af-table th.r{text-align:right}
.af-table td{padding:9px 10px;border-top:1px solid #F3F0EB;color:#3A362F}
.af-table td.r{text-align:right}
/* rows / chips */
.af-row{display:flex;align-items:center;justify-content:space-between;padding:7px 0;font-size:13px;border-top:1px solid #F3F0EB;color:#3A362F}
.af-rowr{display:flex;align-items:center;gap:10px}
.af-chip{font-size:10.5px;font-weight:650;background:#FFF1F1;color:#E84545;border-radius:100px;padding:2px 9px;white-space:nowrap}
.af-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.af-chipbtn{cursor:pointer;border:0}
/* slider */
.af-slider{display:inline-flex;align-items:center;gap:12px;background:#fff;border:1px solid #ECE9E4;border-radius:100px;padding:8px 16px;margin-bottom:16px}
.af-sliderv{font-size:13px;font-weight:750;color:#E84545;min-width:76px}
.af-evo{display:grid;grid-template-columns:1fr 1fr;gap:24px}
/* valuation range */
.af-evtrack{position:relative;height:8px;border-radius:100px;background:#F0EDE8}
.af-evfill{position:absolute;inset:0;border-radius:100px;background:#FFE0E0}
.af-evknob{position:absolute;top:-5px;width:18px;height:18px;border-radius:50%;background:#fff;border:2px solid #FF5757;box-shadow:0 1px 4px rgba(20,18,16,.2)}
.af-evlabels{display:flex;justify-content:space-between;font-size:11px;color:#8A827A;margin-top:7px}
.af-evc{color:#E84545;font-weight:750}
.af-hyp{margin:12px 0 0;padding-left:18px;font-size:12px;color:#8A827A;line-height:1.6}
/* buyers / similar / signals rows */
.af-brow{padding:11px 0;border-top:1px solid #F3F0EB}
.af-brow:first-child,.af-simrow:first-child{border-top:0}
.af-browtop{display:flex;align-items:center;gap:12px}
.af-simrow{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid #F3F0EB}
.af-bname{font-size:13.5px;font-weight:650;color:#141210}
.af-bsub{font-size:11.5px;color:#8A827A;line-height:1.45}
.af-bscore{font-size:15px;font-weight:800;color:#E84545}
/* tooltip */
.af-tipw{position:relative;display:inline-flex}
.af-tiptrg{border-bottom:1px dotted #B8B0A6;cursor:help}
.af-tip{position:absolute;bottom:calc(100% + 6px);left:0;z-index:60;background:#141210;color:#fff;font-size:12px;line-height:1.45;padding:8px 10px;border-radius:8px;width:230px;box-shadow:0 8px 24px rgba(20,18,16,.28);pointer-events:none}
/* NBA */
.af-nba{background:#141210;color:#fff;border-radius:14px;padding:16px}
.af-nbah{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#FF5757;font-weight:700;margin-bottom:5px}
.af-nbat{font-size:13px;color:#EDEAE5;line-height:1.5}
/* copilot dock */
.af-dockmin{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:50}
.af-dockbtn{display:inline-flex;align-items:center;gap:9px;background:#141210;color:#fff;border:0;border-radius:100px;padding:12px 20px;font-size:14px;font-weight:650;box-shadow:0 8px 28px rgba(20,18,16,.28);cursor:pointer}
.af-dock{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:50;width:min(680px,92vw);background:#fff;border:1px solid #ECE9E4;border-radius:18px;box-shadow:0 18px 48px rgba(20,18,16,.22);padding:14px;animation:afIn .22s ease both}
.af-dockhead{display:flex;align-items:center;gap:9px;margin-bottom:10px}
.af-dockat{display:grid;place-items:center;width:26px;height:26px;border-radius:8px;background:#141210}
.af-dockttl{font-size:12.5px;font-weight:700;color:#141210}
.af-dockmini{margin-left:auto;font-size:16px;color:#8A827A;background:none;border:0;cursor:pointer}
.af-dockta{width:100%;resize:none;font-size:14px;padding:10px;border-radius:10px;border:1px solid #ECE9E4;color:#141210;outline:none}
.af-dockta:focus{border-color:#FF5757}
.af-dockfoot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px;flex-wrap:wrap}
@keyframes afIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
`;
