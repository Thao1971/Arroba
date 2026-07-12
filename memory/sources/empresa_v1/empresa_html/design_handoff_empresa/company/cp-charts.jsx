// Arroba — Company Profile SVG chart components

/* ── Financial Chart (Revenue bars + EBITDA margin line) ─── */
function FinancialChart({ data }) {
  const { years, revenue, ebitdaMargin } = data;
  const W = 540, H = 210;
  const padL = 42, padR = 36, padT = 20, padB = 38;
  const cW = W - padL - padR;
  const cH = H - padT - padB;
  const maxRev = 4.0;
  const maxMargin = 25;
  const n = years.length;
  const step = cW / n;
  const barW = step * 0.48;

  const bars = revenue.map((r, i) => ({
    x: padL + i * step + (step - barW) / 2,
    y: padT + cH - (r / maxRev) * cH,
    h: (r / maxRev) * cH,
    v: r, isLast: i === n - 1,
  }));

  const mPts = ebitdaMargin.map((m, i) => ({
    x: padL + i * step + step / 2,
    y: padT + cH - (m / maxMargin) * cH,
    v: m,
  }));
  const lineD = mPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = `${lineD} L${mPts[n-1].x},${padT+cH} L${mPts[0].x},${padT+cH} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-black, #0C0C0E)" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="var(--brand-black, #0C0C0E)" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* Gridlines */}
      {[1, 2, 3, 4].map(v => {
        const gy = padT + cH - (v / maxRev) * cH;
        return (
          <g key={v}>
            <line x1={padL} x2={W-padR} y1={gy} y2={gy} stroke="var(--border)" strokeWidth={1} strokeDasharray="3,4"/>
            <text x={padL-8} y={gy+4} fontSize={10} textAnchor="end" fill="var(--text-subtle)">{v}M</text>
          </g>
        );
      })}

      {/* Revenue bars */}
      {bars.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={b.y} width={barW} height={b.h} rx={3}
            fill={b.isLast ? '#E8001D' : 'var(--surface-2)'}
            stroke={b.isLast ? '#E8001D' : 'var(--border)'} strokeWidth={1}
          />
          <text x={b.x + barW/2} y={b.y - 5} fontSize={9} textAnchor="middle"
            fill={b.isLast ? '#E8001D' : 'var(--text-subtle)'} fontWeight={b.isLast ? 700 : 400}>
            {b.v}M
          </text>
        </g>
      ))}

      {/* X-axis labels */}
      {years.map((y, i) => (
        <text key={i} x={padL + i*step + step/2} y={H - 8} fontSize={10} textAnchor="middle" fill="var(--text-subtle)">{y}</text>
      ))}

      {/* EBITDA margin area + line */}
      <path d={areaD} fill="url(#areaGrad)"/>
      <path d={lineD} fill="none" stroke="#0C0C0E" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" strokeDasharray="5,3"/>
      {mPts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3.5} fill="var(--surface)" stroke="#0C0C0E" strokeWidth={2}/>
          {i === n-1 && (
            <text x={p.x+10} y={p.y+4} fontSize={10} fill="#0C0C0E" fontWeight={700}>{p.v}%</text>
          )}
        </g>
      ))}

      {/* Right axis */}
      {[10, 15, 20, 25].map(v => (
        <text key={v} x={W - padR + 6} y={padT + cH - (v/maxMargin)*cH + 4} fontSize={9} fill="var(--text-subtle)">{v}%</text>
      ))}

      {/* Legend */}
      <g transform={`translate(${padL},${H-2})`}>
        <rect width={10} height={8} rx={2} y={-4} fill="#E8001D"/>
        <text x={14} y={4} fontSize={10} fill="var(--text-muted)">Revenue (M€)</text>
        <line x1={110} y1={0} x2={122} y2={0} stroke="#0C0C0E" strokeWidth={2} strokeDasharray="4,3"/>
        <circle cx={116} cy={0} r={3} fill="var(--surface)" stroke="#0C0C0E" strokeWidth={2}/>
        <text x={126} y={4} fontSize={10} fill="var(--text-muted)">EBITDA Margen %</text>
      </g>
    </svg>
  );
}

/* ── Evolution Chart (Facturación + EBITDA bars, Margen line) ── */
function EvolutionChart({ series }) {
  const { years, facturacion, ebitda, margen } = series;
  const n = years.length;
  const W = 560, H = 240;
  const padL = 46, padR = 44, padT = 24, padB = 40;
  const cW = W - padL - padR, cH = H - padT - padB;
  const maxVal = Math.max(...facturacion, ...ebitda) * 1.18;
  const step = cW / n;
  const gap = step * 0.16;
  const groupW = step - gap;
  const barW = groupW / 2 - 3;
  const fmt = v => (v >= 10 ? v.toFixed(0) : v.toFixed(1).replace('.', ',')) + 'M';
  // Referencia del eje derecho: el 100% del margen equivale a la facturación del último ejercicio,
  // así el punto de margen queda exactamente a la altura de su barra de EBITDA (EBITDA = Ventas × margen).
  const refSales = facturacion[n - 1];

  const yVal = v => padT + cH - (v / maxVal) * cH;
  const mPts = margen.map((m, i) => ({ x: padL + i * step + step / 2, y: yVal(ebitda[i]), v: m }));
  const lineD = mPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', display: 'block' }}>
      {/* gridlines */}
      {[0.25, 0.5, 0.75, 1].map(f => {
        const v = maxVal * f, gy = yVal(v);
        return (
          <g key={f}>
            <line x1={padL} x2={W - padR} y1={gy} y2={gy} stroke="var(--border)" strokeWidth={1} strokeDasharray="3,4"/>
            <text x={padL - 8} y={gy + 4} fontSize={9.5} textAnchor="end" fill="var(--text-subtle)">{Math.round(v)}M</text>
          </g>
        );
      })}
      {years.map((yr, i) => {
        const gx = padL + i * step + gap / 2;
        const last = i === n - 1;
        return (
          <g key={i}>
            {/* Facturación */}
            <rect x={gx} y={yVal(facturacion[i])} width={barW} height={yVal(0) - yVal(facturacion[i])} rx={3}
              fill={last ? '#E8001D' : 'var(--surface-2)'} stroke={last ? '#E8001D' : 'var(--border)'} strokeWidth={1}/>
            <text x={gx + barW / 2} y={yVal(facturacion[i]) - 5} fontSize={8.5} textAnchor="middle" fill={last ? '#E8001D' : 'var(--text-subtle)'} fontWeight={last ? 700 : 400}>{fmt(facturacion[i])}</text>
            {/* EBITDA */}
            <rect x={gx + barW + 6} y={yVal(ebitda[i])} width={barW} height={yVal(0) - yVal(ebitda[i])} rx={3}
              fill={last ? '#0C0C0E' : 'var(--border)'}/>
            <text x={gx + barW * 1.5 + 6} y={yVal(ebitda[i]) - 5} fontSize={8.5} textAnchor="middle" fill="var(--text-subtle)">{fmt(ebitda[i])}</text>
            <text x={padL + i * step + step / 2} y={H - 10} fontSize={10} textAnchor="middle" fill={last ? 'var(--text)' : 'var(--text-subtle)'} fontWeight={last ? 700 : 400}>{yr}</text>
          </g>
        );
      })}
      {/* Margen line — coincide exactamente con la altura de la barra de EBITDA (EBITDA = Ventas × margen) */}
      <path d={lineD} fill="none" stroke="#D97708" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round"/>
      {mPts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3.6} fill="var(--surface)" stroke="#D97708" strokeWidth={2}/>
          <text x={p.x} y={p.y - 9} fontSize={9} textAnchor="middle" fill="#D97708" fontWeight={700}>{p.v.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}%</text>
        </g>
      ))}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <text key={f} x={W - padR + 6} y={yVal(maxVal * f) + 4} fontSize={9} fill="var(--text-subtle)">{Math.round(maxVal * f / refSales * 100)}%</text>
      ))}
    </svg>
  );
}

function EvolutionLegend() {
  return (
    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 8 }}>
      {[['#E8001D', 'Facturación'], ['#0C0C0E', 'EBITDA'], ['#D97708', 'Margen EBITDA %', true]].map(([c, l, line]) => (
        <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: 'var(--text-muted)' }}>
          {line ? <span style={{ width: 16, height: 2.5, borderRadius: 2, background: c }}></span> : <span style={{ width: 11, height: 9, borderRadius: 2, background: c }}></span>}
          {l}
        </span>
      ))}
    </div>
  );
}

/* CAGR helper + cards */
function cagr(first, last, years) {
  if (!first || !last || years <= 0) return null;
  return (Math.pow(last / first, 1 / years) - 1) * 100;
}

function CagrCards({ series }) {
  const n = series.years.length;
  if (n < 2) return null;
  const span = n - 1;
  const rows = [
    { l: 'CAGR Facturación', v: cagr(series.facturacion[0], series.facturacion[n - 1], span) },
    { l: 'CAGR EBITDA', v: cagr(series.ebitda[0], series.ebitda[n - 1], span) },
    { l: 'Δ Margen EBITDA', v: series.margen[n - 1] - series.margen[0], pp: true },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      {rows.map(r => {
        const pos = r.v >= 0;
        return (
          <div key={r.l} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 11, padding: '13px 15px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 6 }}>{r.l}<span style={{ fontSize: 10 }}> · {series.years[0]}–{series.years[n - 1]}</span></div>
            <div style={{ fontSize: 21, fontWeight: 800, color: pos ? '#1A8A4A' : '#E8001D', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>
              {pos ? '+' : ''}{r.v.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{r.pp ? ' pp' : '%'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { EvolutionChart, EvolutionLegend, CagrCards, cagr });

/* ── Score Ring (SVG arc) ──────────────────────────────────── */
function ScoreRing({ value, color, size = 80, sw = 7 }) {
  const r = size/2 - sw - 2;
  const circ = 2 * Math.PI * r;
  const target = circ - (value / 100) * circ;
  const [offset, setOffset] = React.useState(circ);
  React.useEffect(() => {
    const t = setTimeout(() => setOffset(target), 60);
    return () => clearTimeout(t);
  }, [target]);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={sw}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={circ.toFixed(2)} strokeDashoffset={offset.toFixed(2)}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 1.15s cubic-bezier(.35,0,.2,1)' }}
      />
      <text x={size/2} y={size/2 + 6} textAnchor="middle"
        fontSize={size * 0.24} fontWeight={800} fill="var(--text)"
        fontFamily="'Plus Jakarta Sans', sans-serif">{value}</text>
    </svg>
  );
}

/* ── Score Bar ─────────────────────────────────────────────── */
function ScoreBar({ label, value, color, inverted }) {
  const fill = inverted ? 100 - value : value;
  const badge = inverted ? (value < 40 ? 'Bajo' : value < 65 ? 'Medio' : 'Alto') : null;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {badge && (
            <span style={{ fontSize: 10, fontWeight: 600, color, background: `${color}18`, padding: '1px 6px', borderRadius: 3 }}>
              {badge}
            </span>
          )}
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', width: 24, textAlign: 'right' }}>
            {value}
          </span>
        </div>
      </div>
      <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${fill}%`, background: color, borderRadius: 3 }}/>
      </div>
    </div>
  );
}

/* ── Valuation Range ───────────────────────────────────────── */
function ValuationRange({ val }) {
  const { conservative: lo, base: mid, optimistic: hi } = val;
  const midPct = ((mid - lo) / (hi - lo)) * 100;
  return (
    <div>
      <div style={{ position: 'relative', height: 8, background: 'var(--border)', borderRadius: 4, margin: '16px 0 0' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, rgba(232,0,29,.08), rgba(232,0,29,.4), rgba(232,0,29,.08))',
          borderRadius: 4,
        }}/>
        <div style={{
          position: 'absolute', left: `${midPct}%`, top: '50%',
          transform: 'translate(-50%,-50%)',
          width: 20, height: 20, borderRadius: '50%',
          background: '#E8001D', border: '3px solid var(--surface)',
          boxShadow: '0 2px 8px rgba(232,0,29,.4)',
        }}/>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
        {[
          { v: lo, label: 'Conservador', hero: false },
          { v: mid, label: 'Base',        hero: true  },
          { v: hi, label: 'Optimista',   hero: false },
        ].map(({ v, label, hero }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: hero ? 18 : 14, fontWeight: 800, color: hero ? '#E8001D' : 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
              {v}M€
            </div>
            <div style={{ fontSize: 11, color: hero ? '#E8001D' : 'var(--text-subtle)', marginTop: 2, fontWeight: hero ? 600 : 400 }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Confidence Bar ────────────────────────────────────────── */
function ConfidenceBar({ value, label }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Confianza de valoración</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
      </div>
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${value * 100}%`, background: '#1A8A4A', borderRadius: 2 }}/>
      </div>
    </div>
  );
}

Object.assign(window, { FinancialChart, ScoreRing, ScoreBar, ValuationRange, ConfidenceBar });

/* ── Shared icon paths (from Arroba icon set) ──────────────── */
window.CP_ICON_PATHS = {
  search:    '<circle cx="11" cy="11" r="7.5"/><line x1="16.5" y1="16.5" x2="21.5" y2="21.5"/>',
  chartBar:  '<line x1="2" y1="20" x2="22" y2="20"/><rect x="4" y="12" width="4" height="8"/><rect x="10" y="7" width="4" height="13"/><rect x="16" y="4" width="4" height="16"/>',
  target:    '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2.5"/>',
  location:  '<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>',
  team:      '<path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.74"/>',
  bookmark:  '<path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>',
  watchlist: '<path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>',
  download:  '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  verified:  '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9,12 11,14 15,10"/>',
  document:  '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/>',
  deal:      '<circle cx="8" cy="12" r="5"/><circle cx="16" cy="12" r="5"/>',
  trending:  '<polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/>',
  euro:      '<path d="M18 6.5a7 7 0 100 11"/><line x1="4" y1="9.5" x2="14" y2="9.5"/><line x1="4" y1="14.5" x2="14" y2="14.5"/>',
  warning:   '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  home:      '<path d="M3 12L12 3l9 9"/><path d="M5 10v9a1 1 0 001 1h4v-4h4v4h4a1 1 0 001-1v-9"/>',
  user:      '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  calendar:  '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  eye:       '<path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/><circle cx="12" cy="12" r="3"/>',
  sliders:   '<line x1="4" y1="6" x2="7" y2="6"/><circle cx="9" cy="6" r="2"/><line x1="11" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="13" y2="12"/><circle cx="15" cy="12" r="2"/><line x1="17" y1="12" x2="20" y2="12"/>',
  nda:       '<rect x="5" y="11" width="14" height="11" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>',
  'chevron-right': '<polyline points="9,6 15,12 9,18"/>',
};

function CPIcon({ name, size = 16, color = 'currentColor', sw = 1.75 }) {
  const paths = window.CP_ICON_PATHS[name];
  if (!paths) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth={sw}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline-block', flexShrink: 0 }}
      dangerouslySetInnerHTML={{ __html: paths }}
    />
  );
}

Object.assign(window, { CPIcon });

/* ─────────────────────────────────────────────────────────────
   PROCEDENCIA DEL DATO — Recibido · Calculado por Arroba · No disponible
   Recibido  = dato oficial del feed (Valu8 / Iberinform)
   Calculado = KPI derivado por Arroba (✦)
   No dispon. = campo oficial existe pero sin valor en la fuente
   ───────────────────────────────────────────────────────────── */
const PROV = {
  rec:  { t: 'Recibido', long: 'Dato recibido de Iberinform', c: '#1A8A4A', bg: '#E8F5EE', bd: '#C2E8D0' },
  calc: { t: 'Calculado por Arroba', long: 'KPI calculado por Arroba', c: '#E8001D', bg: 'rgba(232,0,29,.07)', bd: 'rgba(232,0,29,.2)' },
  inf:  { t: 'Inferido por Arroba', long: 'Señal inferida por Arroba', c: '#D97708', bg: '#FEF3E2', bd: '#FCD9A3' },
  nd:   { t: 'No disponible', long: 'Campo oficial sin dato en la fuente', c: 'var(--text-subtle)', bg: 'var(--surface-2)', bd: 'var(--border)' },
};

/* Procedencia del dato — desactivada (no se muestra en la ficha) */
function Prov() { return null; }
function ProvTag() { return null; }
function ProvLegend() { return null; }
/* Identity / KPI field with provenance + automatic No-disponible state */
function Field({ label, value, kind = 'rec', big }) {
  const nd = value == null || value === '';
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {!nd && <Prov kind={kind}/>}
        <span style={{ fontSize: big ? 17 : 13.5, fontWeight: nd ? 500 : (big ? 700 : 600), color: nd ? 'var(--text-subtle)' : 'var(--text)', fontStyle: nd ? 'italic' : 'normal', fontVariantNumeric: 'tabular-nums', fontFamily: big ? 'var(--font-display)' : 'inherit' }}>
          {nd ? 'No disponible' : value}
        </span>
      </div>
    </div>
  );
}

Object.assign(window, { Prov, ProvTag, ProvLegend, Field, PROV });

/* Acceso contextual al Company Advisor desde un módulo */
function AskAdvisor({ q, label }) {
  const fire = () => {
    window.dispatchEvent(new CustomEvent('arr-advisor-focus'));
    window.dispatchEvent(new CustomEvent('arr-advisor-ask', { detail: { q } }));
  };
  return (
    <button onClick={fire} title="Preguntar al Company Advisor" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#E8001D'; e.currentTarget.style.color = '#E8001D'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
      <span style={{ color: '#E8001D', fontWeight: 800 }}>✦</span> {label || 'Preguntar al Advisor'}
    </button>
  );
}

Object.assign(window, { AskAdvisor });
