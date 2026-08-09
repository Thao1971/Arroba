'use client';
/**
 * CompanyFichaLayoutV2 — Ficha de Empresa reproducida 1:1 desde la fuente
 * canónica `arroba.com/mockups/ficha-empresa-f01.html` (Daniel 2026-08-09:
 * "usa siempre la fuente"). El CSS es el del mockup, extraído verbatim y
 * scopeado bajo `.afk` (ver fichaMockupCss.ts). El maquetado reproduce las
 * clases del mockup; los datos son SIEMPRE reales (R4/R10: el front no calcula
 * ni inventa). Las secciones sin motor cableado quedan como "pronto".
 */
import { useMemo, useState } from 'react';
import {
  Activity, BarChart3, Bell, Bookmark, Coins, Euro, FileText, Files, GitCompare,
  Hourglass, LayoutGrid, type LucideIcon, Network, PieChart, Scale, Share2,
  Target, Users, Zap,
} from 'lucide-react';

import type {
  BuyerItem, FinancialAnalysis, FinancialSection, FinancialTableBlock,
  IdentitySection, RecommendationSet, SemanticSection, SignalAnalysis,
  ValuationAnalysis,
} from '@/lib/companies/intelligence-types';
import { UnavailableBlock } from '@/components/blocks/UnavailableBlock';
import { FICHA_MOCKUP_CSS } from './fichaMockupCss';

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
  | 'resumen' | 'finanzas' | 'valoracion' | 'propiedad' | 'gobierno' | 'mercado'
  | 'rankings' | 'comparativa' | 'senales' | 'oportunidades' | 'comite'
  | 'sucesion' | 'sector' | 'registros' | 'documentos';

interface NavItem { id: SectionId; label: string; icon: LucideIcon; ready: boolean; grp: string; }
const NAV: NavItem[] = [
  { id: 'resumen', label: 'Resumen', icon: LayoutGrid, ready: true, grp: 'Perfil' },
  { id: 'finanzas', label: 'Finanzas', icon: Euro, ready: true, grp: 'Perfil' },
  { id: 'valoracion', label: 'Valoración', icon: Coins, ready: true, grp: 'Perfil' },
  { id: 'propiedad', label: 'Propiedad', icon: Network, ready: false, grp: 'Perfil' },
  { id: 'gobierno', label: 'Gobierno', icon: Users, ready: false, grp: 'Perfil' },
  { id: 'mercado', label: 'Mercado', icon: BarChart3, ready: false, grp: 'Perfil' },
  { id: 'rankings', label: 'Rankings', icon: Target, ready: false, grp: 'Perfil' },
  { id: 'comparativa', label: 'Comparativa', icon: GitCompare, ready: true, grp: 'Perfil' },
  { id: 'senales', label: 'Señales', icon: Activity, ready: true, grp: 'Inteligencia' },
  { id: 'oportunidades', label: 'Oportunidades', icon: Zap, ready: true, grp: 'Inteligencia' },
  { id: 'comite', label: 'Comité de inversión', icon: Scale, ready: false, grp: 'Inteligencia' },
  { id: 'sucesion', label: 'Sucesión', icon: Hourglass, ready: false, grp: 'Inteligencia' },
  { id: 'sector', label: 'Sector & Roll-up', icon: PieChart, ready: false, grp: 'Inteligencia' },
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
function esc(s: string): string { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

/* ---- charts (SVG string, portados verbatim del mockup) ---- */
interface Serie { name: string; data: number[]; color: string; area?: boolean; }
function lineChartSVG(series: Serie[], labels: string[]): string {
  if (!series.length || !labels.length) return '';
  const w = 680, h = 230, pl = 44, pr = 14, pt = 18, pb = 28, iw = w - pl - pr, ih = h - pt - pb;
  const max = Math.max(...series.flatMap((s) => s.data)) * 1.15 || 1, min = 0;
  const x = (i: number) => pl + iw * i / Math.max(1, labels.length - 1);
  const y = (v: number) => pt + ih - (v - min) / (max - min) * ih;
  let g = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto">`;
  for (let k = 0; k <= 4; k++) { const yy = pt + ih * k / 4; g += `<line x1="${pl}" y1="${yy}" x2="${w - pr}" y2="${yy}" stroke="${N2}"/><text x="${pl - 8}" y="${yy + 4}" text-anchor="end" font-size="10" fill="${N}">${(max - (max - min) * k / 4).toFixed(0)}</text>`; }
  labels.forEach((l, i) => g += `<text x="${x(i)}" y="${h - 8}" text-anchor="middle" font-size="10.5" fill="${N}">${esc(l)}</text>`);
  series.forEach((s) => {
    const p = s.data.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    if (s.area) g += `<polygon points="${pl},${pt + ih} ${p} ${w - pr},${pt + ih}" fill="${s.color}" opacity=".08"/>`;
    g += `<polyline points="${p}" fill="none" stroke="${s.color}" stroke-width="2.6"/>`;
    s.data.forEach((v, i) => { g += `<circle cx="${x(i)}" cy="${y(v)}" r="3.6" fill="#fff" stroke="${s.color}" stroke-width="2"/>`; });
  });
  let lx = pl; series.forEach((s) => { g += `<circle cx="${lx}" cy="11" r="4" fill="${s.color}"/><text x="${lx + 9}" y="15" font-size="10.5" fill="#4E4E48">${esc(s.name)}</text>`; lx += s.name.length * 6.6 + 30; });
  return g + '</svg>';
}
function ringSVG(val: number, label: string, color: string): string {
  const r = 34, c = 2 * Math.PI * r, off = c * (1 - val / 100);
  return `<div class="lbl">${esc(label)}</div><svg width="92" height="92" viewBox="0 0 92 92"><circle cx="46" cy="46" r="${r}" fill="none" stroke="${N2}" stroke-width="8"/><circle cx="46" cy="46" r="${r}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 46 46)"/><text x="46" y="52" text-anchor="middle" font-size="22" font-weight="750" fill="#161412">${Math.round(val)}</text></svg>`;
}

function Html({ html, className, id }: { html: string; className?: string; id?: string }) {
  return <div className={className} id={id} dangerouslySetInnerHTML={{ __html: html }} />;
}
function Soon({ label }: { label: string }) {
  return (
    <div className="card">
      <UnavailableBlock testId={`ficha-soon-${label}`} title={`${label} · próximamente`}
        description="Esta sección se conectará a su motor de inteligencia en la siguiente fase de cableado."
        req="intelligence_layer · provider pendiente" />
    </div>
  );
}

/* ============================ RESUMEN ============================ */
function Resumen(p: CompanyFichaLayoutV2Props) {
  const { identity, financial, financialAnalysis, semantic, signal, buyers } = p;
  const cls = identity.classification, loc = identity.location, sz = identity.size;
  const k = financialAnalysis?.kpis ?? null;

  const evo = financial?.evolution;
  const chart = useMemo(() => {
    if (!evo || !evo.series.length) return '';
    const series: Serie[] = evo.series.slice(0, 2).map((s, i) => ({
      name: s.format === 'currency' ? `${s.label} (M€)` : s.label,
      data: s.values.map((v) => (v == null ? 0 : s.format === 'currency' ? v / 1_000_000 : v)),
      color: i === 0 ? RED : DARK, area: i === 0,
    }));
    return lineChartSVG(series, evo.years.map(String));
  }, [evo]);

  const quality = clamp100(financialAnalysis?.financial_quality?.score ?? null);
  const opp = clamp100(signal?.score?.signal_score ?? null);
  const topFit = clamp100(buyers?.recommendations?.[0]?.score ?? null);
  const rings: { v: number; label: string; color: string }[] = [];
  if (quality != null) rings.push({ v: quality, label: 'Calidad', color: OK });
  if (topFit != null) rings.push({ v: topFit, label: 'Encaje comprador', color: RED });
  if (opp != null) rings.push({ v: opp, label: 'Oportunidad', color: INFO });

  return (
    <section className="panel on">
      <div className="hero">
        <div className="t">Resumen de compañía</div>
        {(identity.description || identity.objeto_social) ? (
          <p>{identity.description || identity.objeto_social}</p>
        ) : (
          <p>{identity.legal_name ?? 'La compañía'} opera en {cls.cnae_description ?? 'su sector'}{loc.provincia ? `, con domicilio en ${loc.provincia}` : ''}.</p>
        )}
        {semantic?.value_proposition && <p style={{ marginTop: 10 }}>{semantic.value_proposition}</p>}
      </div>

      {chart && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3><span className="k" />Evolución financiera</h3>
          <div className="cs">Facturación y EBITDA · {evo!.years[0]}–{evo!.years[evo!.years.length - 1]}</div>
          <Html html={chart} />
        </div>
      )}

      {k && (
        <div className="kgrid" style={{ marginTop: 16 }}>
          <div className="kpi"><div className="l">Facturación</div><div className="v">{fmtEUR(k.revenue ?? null)}</div>{k.revenue_growth_yoy != null && <div className={`d ${k.revenue_growth_yoy >= 0 ? 'up' : 'down'}`}>{k.revenue_growth_yoy >= 0 ? '▲' : '▼'} {pctF(k.revenue_growth_yoy)} YoY</div>}</div>
          <div className="kpi"><div className="l">EBITDA</div><div className="v">{fmtEUR(k.ebitda ?? null)}</div>{k.ebitda_margin != null && <div className="d inf">margen {pctF(k.ebitda_margin)}</div>}</div>
          <div className="kpi"><div className="l">Resultado neto</div><div className="v">{fmtEUR(k.net_income ?? null)}</div>{k.net_margin != null && <div className="d inf">margen {pctF(k.net_margin)}</div>}</div>
          <div className="kpi"><div className="l">Empleados</div><div className="v">{fmtNum(sz.employees_total)}</div><div className="d inf">plantilla</div></div>
        </div>
      )}

      <div className="row r2" style={{ marginTop: 16 }}>
        {rings.length > 0 && (
          <div className="card">
            <h3><span className="k" />Scores de inteligencia</h3>
            <div className="cs">Calculados por Arroba</div>
            <div className="scores" style={{ gridTemplateColumns: `repeat(${rings.length},1fr)` }}>
              {rings.map((r) => <Html key={r.label} className="ring" html={ringSVG(r.v, r.label, r.color)} />)}
            </div>
          </div>
        )}
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
    </section>
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
const RATIO_FAM: { key: string; label: string }[] = [
  { key: 'growth', label: 'Crecimiento' }, { key: 'profitability', label: 'Rentabilidad' },
  { key: 'liquidity', label: 'Liquidez' }, { key: 'solvency', label: 'Solvencia' },
  { key: 'efficiency', label: 'Circulante / eficiencia' },
];
function Finanzas({ financial }: { financial: FinancialSection | null }) {
  const [tab, setTab] = useState<'pl' | 'balance' | 'ratios'>('pl');
  const [lvl, setLvl] = useState(1);
  if (!financial || (!financial.profit_loss && !financial.balance && !(financial.ratios?.items?.length))) return <Soon label="Finanzas" />;
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
          <button className={tab === 'ratios' ? 'on' : ''} onClick={() => setTab('ratios')}>Ratios</button>
        </div>
        <span style={{ flex: 1 }} />
        {tab !== 'ratios' && (
          <div className="lvlctl">
            <span className="lb">Nivel de detalle</span>
            <input type="range" min={1} max={3} step={1} value={lvl} onChange={(e) => setLvl(Number(e.target.value))} className="lvlrange" />
            <span className="lvlval">{lvlName}</span>
          </div>
        )}
      </div>

      {tab === 'pl' && (financial.profit_loss
        ? <div className="card"><h3><span className="k" />Cuenta de resultados</h3><div className="cs">Arrastra "Nivel de detalle" para desplegar más partidas</div><FinTable block={filterRows(financial.profit_loss, lvl)} /></div>
        : <Soon label="Cuenta de resultados" />)}
      {tab === 'balance' && (financial.balance
        ? <div className="card"><h3><span className="k" />Balance</h3><FinTable block={filterRows(financial.balance, lvl)} /></div>
        : <Soon label="Balance" />)}

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
                  return (
                    <div key={r.key} className="rrow">
                      <span className="rn" title={r.formula ?? undefined}>{r.name}</span>
                      <span className="rv">{fmtCell(r.value, r.format)}</span>
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
            <span><span className="srcdot c" /> Calculado por Arroba</span>
            <span>Barra = percentil sectorial</span>
          </div>
        </div>
      ) : <Soon label="Ratios" />)}
    </section>
  );
}

/* ============================ VALORACIÓN ============================ */
function Valoracion({ valuation, financialAnalysis }: { valuation: ValuationAnalysis | null; financialAnalysis: FinancialAnalysis | null }) {
  if (!valuation || !valuation.has_valuation) return <Soon label="Valoración" />;
  const r = valuation.range;
  const q = clamp100(financialAnalysis?.financial_quality?.score ?? null);
  const maxEv = r ? (Math.max(r.low ?? 0, r.central ?? 0, r.high ?? 0) || 1) : 1;
  const pctOf = (v: number | null) => (v == null ? 0 : Math.max(6, Math.min(100, (v / maxEv) * 100)));
  return (
    <section className="panel on">
      <div className="sec-h">Valoración</div>
      <div className="sec-s">Aproximación de valor por múltiplos comparables. Estimación orientativa, no una valoración formal.</div>
      <div className="intel" style={{ borderColor: 'var(--n200)', background: 'var(--n50)' }}>
        <p><b>💲 Equity Value ajustado por deuda financiera neta.</b> El valor mostrado es una aproximación devuelta por el motor.</p>
      </div>
      <div className="row r3" style={{ marginTop: 16 }}>
        {q != null && (
          <div className="card">
            <h3><span className="k" />Posicionamiento</h3>
            <div className="scores" style={{ gridTemplateColumns: '1fr' }}><Html className="ring" html={ringSVG(q, 'Quality Score', OK)} /></div>
            <div className="cs" style={{ textAlign: 'center', marginTop: 8 }}>de 100 · calidad financiera</div>
          </div>
        )}
        {r && (
          <div className="card">
            <h3><span className="k" />Enterprise Value</h3>
            <div className="evrow"><span className="lb">Bajo</span><div className="evbar"><i style={{ width: `${pctOf(r.low)}%`, background: 'var(--red)' }} /></div><span className="val">{fmtEUR(r.low)}</span></div>
            <div className="evrow"><span className="lb">Medio</span><div className="evbar"><i style={{ width: `${pctOf(r.central)}%`, background: 'var(--info)' }} /></div><span className="val">{fmtEUR(r.central)}</span></div>
            <div className="evrow"><span className="lb">Alto</span><div className="evbar"><i style={{ width: `${pctOf(r.high)}%`, background: 'var(--ok)' }} /></div><span className="val">{fmtEUR(r.high)}</span></div>
            {valuation.multiple != null && <div className="idrow" style={{ marginTop: 10 }}><span className="k">Múltiplo</span><span className="v">{valuation.multiple.toLocaleString('es-ES', { maximumFractionDigits: 1 })}× {valuation.multiple_basis ?? 'EBITDA'}</span></div>}
            <div className="idrow"><span className="k" style={{ fontWeight: 700, color: 'var(--n900)' }}>Equity value</span><span className="v" style={{ color: 'var(--red-hover)' }}>{fmtEUR(valuation.equity_value)}</span></div>
          </div>
        )}
      </div>
      {valuation.hypotheses.length > 0 && (
        <div className="card">
          <h3><span className="k" />¿Por qué este valor?</h3>
          <div className="cs">El motor devuelve la explicación, no solo el número — sin cifras inventadas</div>
          <div style={{ paddingTop: 4 }}>
            {valuation.hypotheses.map((h, i) => <div key={i} style={{ fontSize: 13, color: 'var(--n700)', padding: '4px 0', lineHeight: 1.55 }}>◆ {h}</div>)}
          </div>
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
  if (!list.length && !similar.length && !chips.length) return <Soon label="Comparativa" />;
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
function Senales({ signal }: { signal?: SignalAnalysis | null }) {
  const items = signal?.signals ?? [];
  if (!items.length) return <Soon label="Señales" />;
  const cls = (pol: string | null) => pol === 'positive' ? 'ok' : pol === 'negative' ? 'r' : pol === 'warning' ? 'w' : 'i';
  return (
    <section className="panel on">
      <div className="sec-h">Señales</div>
      <div className="sec-s">Hechos y eventos que Arroba ha detectado y que hacen a la compañía más (o menos) atractiva para una operación.</div>
      <div className="tl">
        {items.map((s) => (
          <div key={s.signal_id} className={`ev ${cls(s.polarity)}`}>
            <div className="mk" />
            <div className="c">
              <div className="th">
                <div>
                  <div className="t">{s.title ?? s.signal_type ?? 'Señal'}</div>
                  {s.severity && <div className="m">Severidad {s.severity}{s.confidence != null ? ` · confianza ${Math.round(s.confidence * 100)}%` : ''}</div>}
                </div>
                {s.category && <span className="tag">{s.category}</span>}
              </div>
              {fmtDate(s.detected_at) && <div className="yr">{fmtDate(s.detected_at)}</div>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================ OPORTUNIDADES ============================ */
function Oportunidades({ opportunities }: { opportunities?: RecommendationSet | null }) {
  const items = opportunities?.recommendations ?? [];
  if (!items.length) return <Soon label="Oportunidades" />;
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
  const [active, setActive] = useState<SectionId>('resumen');
  const [collapsed, setCollapsed] = useState(false);

  const name = identity.legal_name ?? identity.cif_normalized ?? 'Empresa';
  const cls = identity.classification;
  const grps = ['Perfil', 'Inteligencia', 'Fuentes'];

  return (
    <div className="afk">
      <style>{FICHA_MOCKUP_CSS}</style>
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
          <div className="actions">
            <button className="btn"><Bookmark size={15} /> Guardar</button>
            <button className="btn"><Bell size={15} /> Seguir</button>
            <button className="btn"><Share2 size={15} /></button>
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
                        {!n.ready && !collapsed && <span className="tx" style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--n400)' }}>pronto</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </aside>

          <main className="main">
            {active === 'resumen' && <Resumen {...props} />}
            {active === 'finanzas' && <Finanzas financial={props.financial} />}
            {active === 'valoracion' && <Valoracion valuation={props.valuation} financialAnalysis={props.financialAnalysis} />}
            {active === 'comparativa' && <Comparativa semantic={props.semantic} buyers={props.buyers} />}
            {active === 'senales' && <Senales signal={props.signal} />}
            {active === 'oportunidades' && <Oportunidades opportunities={props.opportunities} />}
            {['propiedad', 'gobierno', 'mercado', 'rankings', 'comite', 'sucesion', 'sector', 'registros', 'documentos'].includes(active) && (
              <section className="panel on">
                <div className="sec-h">{NAV.find((n) => n.id === active)?.label}</div>
                <Soon label={NAV.find((n) => n.id === active)?.label ?? active} />
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
