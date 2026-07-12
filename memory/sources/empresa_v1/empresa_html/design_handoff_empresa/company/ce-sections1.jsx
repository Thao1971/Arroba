// Arroba — Company Entity: section components

// Extra icons not in CP_ICON_PATHS
Object.assign(window.CP_ICON_PATHS, {
  summary:   '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  valuation: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/>',
  signal:    '<polyline points="3,17 8,12 12,14.5 17,9 21,11"/><circle cx="17" cy="9" r="1.6"/>',
  layers:    '<polygon points="12,2 2,7 12,12 22,7"/><polyline points="2,17 12,22 22,17"/><polyline points="2,12 12,17 22,12"/>',
  share:     '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/>',
  bell:      '<path d="M6 10a6 6 0 0112 0v5l2 2H4l2-2v-5z"/><path d="M10 20a2 2 0 004 0"/>',
  link:      '<path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.7-1.7"/>',
});

const fmtM = v => `${v < 0 ? '−' : ''}${Math.abs(v).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M€`;
const YEARS = ['2020', '2021', '2022', '2023', '2024'];

function CECard({ children, style, pad = 22 }) {
  return <div className="ce-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: pad, ...style }}>{children}</div>;
}

function YoY({ pct }) {
  if (pct == null) return null;
  const up = pct >= 0;
  const color = up ? '#1A8A4A' : '#D97708';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11.5, fontWeight: 700, color }}>
      <span style={{ fontSize: 10 }}>{up ? '▲' : '▼'}</span>{Math.abs(pct).toLocaleString('es-ES', { maximumFractionDigits: 1 })}% vs 2023
    </span>
  );
}
function CETitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h2 style={{ fontSize: 21, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', letterSpacing: '-.01em' }}>{children}</h2>
      {sub && <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5, maxWidth: 620 }}>{sub}</p>}
    </div>
  );
}
function Eyebrow({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 14 }}>{children}</div>;
}

/* Connected Intelligence — every module ends in "¿Y esto qué implica?" */
function Implies({ text, cta, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginTop: 14, padding: '13px 16px', background: 'rgba(232,0,29,.04)', border: '1px solid rgba(232,0,29,.18)', borderRadius: 10 }}>
      <span style={{ width: 22, height: 22, borderRadius: 6, background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 800, flexShrink: 0 }}>✦</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#E8001D', marginRight: 8 }}>Y esto implica</span>
        <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{text}</span>
      </div>
      {cta && <button onClick={onAction} style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: '#E8001D', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{cta} →</button>}
    </div>
  );
}

/* Financial statement table */
function FinTable({ rows, label }) {
  return (
    <CECard pad={0}>
      {label && <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{label}</div>}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              <th style={{ textAlign: 'left', padding: '10px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Concepto</th>
              {YEARS.map(y => <th key={y} style={{ textAlign: 'right', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: y === '2024' ? '#E8001D' : 'var(--text-subtle)' }}>{y}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.label} style={{ borderTop: '1px solid var(--border)', background: r.accent ? 'rgba(232,0,29,.03)' : 'transparent' }}>
                <td style={{ padding: '9px 20px', fontWeight: r.bold ? 700 : 400, color: r.bold ? 'var(--text)' : 'var(--text-muted)' }}>{r.label}</td>
                {r.vals.map((v, j) => (
                  <td key={j} style={{ padding: '9px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: r.bold ? 700 : 400, color: r.accent && j === r.vals.length - 1 ? '#E8001D' : r.bold ? 'var(--text)' : 'var(--text-muted)' }}>{fmtM(v)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CECard>
  );
}

/* Individual vs Consolidado snapshot (real data, no fabricated time series) */
function IndConsSnapshot({ fin }) {
  const rows = [
    { l: 'Ventas',         i: fin.individual.ventas,     c: fin.consolidado.ventas,     iv: 6.41,  cv: 32.01, kind: 'rec' },
    { l: 'EBITDA',         i: fin.individual.ebitda,     c: fin.consolidado.ebitda,     iv: 1.87,  cv: 8.16,  kind: 'rec' },
    { l: 'Beneficio neto', i: fin.individual.neto,       c: fin.consolidado.neto,       iv: 2.45,  cv: 3.13,  kind: 'rec' },
    { l: 'Patrimonio neto',i: fin.individual.patrimonio, c: fin.consolidado.patrimonio, iv: 32.81, cv: 38.00, kind: 'rec' },
  ];
  const max = 66.26; // activo consolidado as scale ceiling for bars
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 12, alignItems: 'center', fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
        <span></span>
        <span>Individual</span>
        <span>Consolidado</span>
      </div>
      {rows.map(r => (
        <div key={r.l} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Prov kind={r.kind}/> {r.l}</span>
          {[['i', r.iv, '#ADADAA'], ['c', r.cv, '#E8001D']].map(([key, val, col]) => (
            <div key={key} style={{ position: 'relative', height: 26, background: 'var(--surface-2)', borderRadius: 6, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(val / max) * 100}%`, background: col, opacity: key === 'c' ? 1 : .55, borderRadius: 6 }}></div>
              <span style={{ position: 'relative', marginLeft: 9, fontSize: 12.5, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{r[key]}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ══ RESUMEN ══ */
function SecResumen({ C, E, go }) {
  const co = C.company;
  const [evo, setEvo] = React.useState('consolidado');
  const serie = E.historico[evo];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <CECard pad={24} style={{ background: 'linear-gradient(135deg,#0C0C0E,#1A1A18)', border: 'none', position: 'relative', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', right: -16, top: -28, fontSize: 150, color: 'rgba(232,0,29,.07)', fontWeight: 800, lineHeight: 1, pointerEvents: 'none' }}>✦</span>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 800 }}>✦</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Resumen de compañía</span>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: 'rgba(255,255,255,.85)', maxWidth: 760 }}>{E.aiSummary}</p>
        </div>
      </CECard>

      {/* Evolución financiera */}
      <CECard>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle)', background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: 5 }}>Conocimiento</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 15.5, fontWeight: 700, color: 'var(--text)' }}>Evolución financiera</span>
          </div>
          <button onClick={() => go('finanzas')} style={{ padding: '7px 13px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: '#E8001D', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Ver cifras exactas</button>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-muted)', marginBottom: 10 }}>Las ventas crecen de forma sostenida desde 2020, con una aceleración del EBITDA superior al crecimiento de ingresos en los últimos dos ejercicios.</p>
        {window.CE_DATA.historico.demoYears && window.CE_DATA.historico.demoYears.length > 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: 'var(--text-subtle)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 7, padding: '5px 11px', marginBottom: 14 }}>
            <CPIcon name="signal" size={13} color="var(--text-subtle)" sw={2}/> {window.CE_DATA.historico.demoYears.join('-')} son una serie ilustrativa · solo {window.CE_DATA.historico.realYears.join(', ')} está confirmado por Iberinform
          </div>
        )}
        <EvolutionChart series={serie}/>
        <EvolutionLegend/>
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <CagrCards series={serie}/>
        </div>
      </CECard>

      {/* KPIs — responde en 10s: quién, dónde, cuánto factura, cuánto gana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { l: 'Ventas', v: E.finanzas.consolidado.ventas, s: 'Consolidado 2024', kind: 'rec', yoy: 8.3 },
          { l: 'EBITDA', v: E.finanzas.consolidado.ebitda, s: E.finanzas.consolidado.margen + ' margen', kind: 'rec', subCalc: true, yoy: 14.0 },
          { l: 'Beneficio neto', v: E.finanzas.consolidado.neto, s: 'Consolidado 2024', kind: 'rec', yoy: -3.5 },
          { l: 'Empleados', v: String(co.employees), s: co.plantilla.fijos + ' fijos · ' + co.plantilla.temporales + ' temp.', kind: 'rec', yoy: 2.5 },
        ].map(k => (
          <CECard key={k.l} pad={18}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>{k.l}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 5 }}>{k.v}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--text-subtle)', fontWeight: 500 }}>{k.s}</span>
              <YoY pct={k.yoy}/>
            </div>
          </CECard>
        ))}
      </div>

      {/* KPIs adicionales — posicionamiento */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { l: 'Ranking en el mercado', v: '#3 de 47', s: 'Hoteles termales · España', kind: 'inf', yoy: null },
          { l: 'Ranking en el sector', v: 'P88', s: 'Percentil por margen EBITDA', kind: 'inf', yoy: 4.0 },
          { l: 'Ranking en la localidad', v: '#1 de 6', s: 'Olmedo (Valladolid)', kind: 'inf', yoy: null },
          { l: 'Nivel de innovación', v: 'Medio', s: 'Sin patentes ni I+D declarada', kind: 'inf', yoy: null },
        ].map(k => (
          <CECard key={k.l} pad={18}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>{k.l} <span style={{ color: '#E8001D', fontWeight: 800 }}>✦</span></div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 5 }}>{k.v}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--text-subtle)', fontWeight: 500 }}>{k.s}</span>
              <YoY pct={k.yoy}/>
            </div>
          </CECard>
        ))}
      </div>

      {/* Identity grid — campos oficiales Iberinform */}
      <CECard>
        <Eyebrow>Identificación</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 20px' }}>
          <Field label="Razón social" value={co.legal}/>
          <Field label="Nombre comercial" value={co.comercial}/>
          <Field label="CIF" value={co.cif}/>
          <Field label="Forma jurídica" value={co.forma}/>
          <Field label="Situación mercantil" value={co.status}/>
          <Field label="Actividad (CNAE)" value={co.cnae + ' · ' + co.sector}/>
          <Field label="Domicilio" value={co.domicilio}/>
          <Field label="Código postal" value={co.cp}/>
          <Field label="Municipio" value={co.location.city}/>
          <Field label="Provincia" value={co.location.province}/>
          <Field label="Capital social" value={co.capital}/>
          <Field label="Modelo de cuentas" value={co.modeloCuentas}/>
          <Field label="Objeto social" value={null}/>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', alignItems: 'center' }}>
          <a href={co.webFull} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: '#E8001D', background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 8, textDecoration: 'none' }}>
            <CPIcon name="link" size={13} color="#E8001D" sw={2}/> {co.web}
          </a>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 8 }}>
            Tel. {co.telefono}
          </span>
        </div>
      </CECard>

      {/* Scores — inferidos por Arroba */}
      <CECard>
        <Eyebrow>Scores de inteligencia</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {[
            ['Quality', 86, '#1A8A4A', 'Calidad del negocio: combina rentabilidad, solvencia y estabilidad de los ingresos.'],
            ['Growth', 64, '#2164E3', 'Crecimiento: evolución de ventas y EBITDA en los últimos ejercicios frente al sector.'],
            ['Risk', 34, '#D97708', 'Riesgo: probabilidad de impago o tensión financiera. Cuanto más bajo, mejor.'],
            ['Opportunity', 84, '#E8001D', 'Oportunidad: encaje estimado para una operación de compra, inversión o alianza.'],
          ].map(([l, v, c, tip]) => (
            <div key={l} title={tip} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'help' }}>
              <ScoreRing value={v} color={c} size={76} sw={7}/>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>{l}
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--border-strong)', fontSize: 9, fontWeight: 700, color: 'var(--text-subtle)' }}>i</span>
              </span>
            </div>
          ))}
        </div>
      </CECard>

    </div>
  );
}

/* ══ VALORACIÓN (interactiva por múltiplos) ══ */
function BenchRadar({ dims }) {
  const n = dims.length, cx = 100, cy = 96, R = 74;
  const ang = i => -Math.PI / 2 + i * (2 * Math.PI / n);
  const pt = (i, f) => [cx + Math.cos(ang(i)) * R * f, cy + Math.sin(ang(i)) * R * f];
  const poly = f => dims.map((_, i) => pt(i, f).join(',')).join(' ');
  const ePoly = dims.map((d, i) => pt(i, d.eScore / 100).join(',')).join(' ');
  const sPoly = dims.map((d, i) => pt(i, d.sScore / 100).join(',')).join(' ');
  return (
    <svg width={240} height={200} viewBox="-20 0 240 192" style={{ flexShrink: 0, overflow: 'visible' }}>
      {[0.25, 0.5, 0.75, 1].map(f => <polygon key={f} points={poly(f)} fill="none" stroke="var(--border)" strokeWidth={1}/>)}
      {dims.map((_, i) => { const p = pt(i, 1); return <line key={i} x1={cx} y1={cy} x2={p[0]} y2={p[1]} stroke="var(--border)" strokeWidth={1}/>; })}
      <polygon points={sPoly} fill="#D97708" fillOpacity={0.12} stroke="#D97708" strokeWidth={1.6} strokeDasharray="4,3"/>
      <polygon points={ePoly} fill="#2164E3" fillOpacity={0.14} stroke="#2164E3" strokeWidth={2}/>
      {dims.map((d, i) => {
        const p = pt(i, 1.24);
        return <text key={i} x={p[0]} y={p[1]} fontSize={9.5} textAnchor="middle" fill="var(--text-muted)">{d.l}</text>;
      })}
    </svg>
  );
}

function MethodBlock({ children, title }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 7 }}>{title}</div>
      {children}
    </div>
  );
}

function SecValoracion({ C, go }) {
  const EBITDA_MODES = {
    reportado: { l: 'Reportado', v: 1.87, note: 'EBITDA del ejercicio 2024, según cuentas auditadas.' },
    ajustado:  { l: 'Ajustado', v: 1.99, note: 'Reportado + ajustes por normalizaciones (retribución del socio, gastos no recurrentes...). Edita el importe del ajuste abajo.' },
    media:     { l: 'Media (3 ej.)', v: 1.63, note: 'Promedio aritmético del EBITDA individual de 2022-2024 (1,38 / 1,64 / 1,87 M€).' },
  };
  const BUYERS = {
    financiero: { l: 'Financiero', factor: 1.00, icon: 'summary' },
    nacional:   { l: 'Estratégico nacional', factor: 1.10, icon: 'target' },
    internacional: { l: 'Estratégico internacional', factor: 1.20, icon: 'chartBar' },
  };
  const DFN = 5.65; // deuda financiera neta real (M€) — ver Finanzas
  const [ebitdaMode, setEbitdaMode] = React.useState('reportado');
  const [ajuste, setAjuste] = React.useState(0.12);
  const [buyer, setBuyer] = React.useState('financiero');
  const [mult, setMult] = React.useState(7.9);
  const [showMethod, setShowMethod] = React.useState(false);
  const [pulse, setPulse] = React.useState(false);
  const ebitdaValues = { reportado: EBITDA_MODES.reportado.v, ajustado: EBITDA_MODES.reportado.v + ajuste, media: EBITDA_MODES.media.v };
  const EBITDA = ebitdaValues[ebitdaMode];
  const buyerFactor = BUYERS[buyer].factor;
  const fmt = n => n.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' M€';
  const fx = n => n.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'x';
  const ev = m => EBITDA * m * buyerFactor;
  const eq = m => ev(m) - DFN;
  const lo = mult - 1, hi = mult + 1;
  const mono = { fontFamily: 'var(--font-mono, ui-monospace, monospace)', fontVariantNumeric:'tabular-nums' };
  const evMax = ev(hi);
  const scen = [['Bajo','#E8001D',lo],['Medio','#2164E3',mult],['Alto','#1A8A4A',hi]];
  const recalc = () => { setPulse(true); setTimeout(() => setPulse(false), 550); };
  const BENCH = [
    { l: 'Quality Score', eScore: 86, sScore: 54, eVal: '86', sVal: '54', dif: '+32', def: 'Percentil ponderado dentro de la categoría: 50% margen EBITDA, 35% revenue/empleado, 15% salud de balance.' },
    { l: 'Margen EBITDA', eScore: 91, sScore: 56, eVal: '29,19%', sVal: '14,80%', dif: '+14,39 pp', def: 'EBITDA / Ventas, comparado con la mediana de la categoría.' },
    { l: 'Rev / Empleado', eScore: 72, sScore: 58, eVal: '79,1 mil€', sVal: '54,3 mil€', dif: '+24,8 mil€', def: 'Ventas entre número de empleados.' },
    { l: 'Salud Balance', eScore: 89, sScore: 52, eVal: '5,85', sVal: '1,90', dif: '+3,95', def: 'Solvency Ratio de Iberinform (activo / pasivo exigible).' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <CETitle sub="Aproximación de valor por múltiplos comparables. Ajusta los parámetros para explorar escenarios.">Valoración</CETitle>

      <div style={{ display:'flex', alignItems:'flex-start', gap:10, background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
        <CPIcon name="valuation" size={16} color="var(--text-muted)" sw={2}/>
        <span style={{ fontSize:12.5, color:'var(--text-muted)', lineHeight:1.5 }}><strong style={{ color:'var(--text)' }}>Equity Value ajustado por deuda financiera neta.</strong> El valor mostrado es una aproximación. Estimación orientativa, no una valoración formal.</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.1fr 1.1fr', gap:14, alignItems:'stretch' }} className="ce-val-cols">
        {/* Posicionamiento */}
        <CECard style={{ display: 'flex', flexDirection: 'column' }}>
          <Eyebrow>Posicionamiento</Eyebrow>
          <div style={{ background:'var(--surface-2)', borderRadius:12, padding:22, textAlign:'center', marginBottom:20 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize:12.5, color:'var(--text-muted)' }}>Quality Score
              <span title="Percentil ponderado dentro de la categoría: 50% margen EBITDA, 35% revenue por empleado, 15% salud de balance." style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--border-strong)', fontSize: 9, fontWeight: 700, color: 'var(--text-subtle)', cursor: 'help' }}>i</span>
            </div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:52, fontWeight:700, lineHeight:1, margin:'6px 0', color:'var(--text)' }}>82</div>
            <div style={{ fontSize:11.5, color:'var(--text-subtle)' }}>de 100 · 1.002 comparables</div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 10, lineHeight: 1.5, borderTop: '1px solid var(--border)', paddingTop: 10 }}>50% margen EBITDA · 35% revenue/empleado · 15% salud de balance</div>
          </div>
          {[['Margen EBITDA','P88',88],['Revenue / empleado','P63',63],['Salud de balance','P90',90]].map((p,i)=>(
            <div key={i} style={{ marginBottom:19 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:7 }}><span style={{ color:'var(--text-muted)' }}>{p[0]}</span><b style={{ ...mono, fontWeight:600 }}>{p[1]}</b></div>
              <div style={{ height:11, background:'var(--surface-2)', borderRadius:5, overflow:'hidden' }}><div style={{ height:'100%', width:p[2]+'%', background:'var(--text)', borderRadius:5 }}></div></div>
            </div>
          ))}
        </CECard>

        {/* Parámetros */}
        <CECard style={{ display: 'flex', flexDirection: 'column' }}>
          <Eyebrow>Parámetros</Eyebrow>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 7, display: 'block' }}>Tipo de comprador</label>
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 9, overflow: 'hidden' }}>
              {Object.entries(BUYERS).map(([id, b]) => (
                <button key={id} onClick={() => setBuyer(id)} title={'Factor '+fx(b.factor)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 4px', border: 'none', borderRight: id !== 'internacional' ? '1px solid var(--border)' : 'none', background: buyer === id ? 'var(--text)' : 'var(--surface)', color: buyer === id ? 'var(--bg)' : 'var(--text-muted)', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  <span style={{ fontSize: 11.5 }}>{b.l}</span><span style={{ ...mono, fontSize: 10, opacity: .85 }}>{fx(b.factor)}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:600, marginBottom:7, display:'block' }}>EBITDA base</label>
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 9, overflow: 'hidden', marginBottom: 9 }}>
              {Object.entries(EBITDA_MODES).map(([id, m]) => (
                <button key={id} onClick={() => setEbitdaMode(id)} title={m.note} style={{ flex: 1, padding: '8px 6px', border: 'none', borderRight: id !== 'media' ? '1px solid var(--border)' : 'none', background: ebitdaMode === id ? 'var(--text)' : 'var(--surface)', color: ebitdaMode === id ? 'var(--bg)' : 'var(--text-muted)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{m.l}</button>
              ))}
            </div>
            {Object.entries(EBITDA_MODES).map(([id, m]) => (
              <div key={id} style={{ display:'flex', justifyContent:'space-between', fontSize:12.5, color: id === ebitdaMode ? 'var(--text)' : 'var(--text-subtle)', padding:'3px 0' }}><span>{m.l}:</span><span style={{ ...mono }}>{fmt(id === 'ajustado' ? ebitdaValues.ajustado : m.v)}</span></div>
            ))}
            {ebitdaMode === 'ajustado' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 6 }}>
                <label style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Ajustes (normalizaciones):</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input type="number" step="0.01" value={ajuste} onChange={e => setAjuste(parseFloat(e.target.value) || 0)} style={{ width: 80, padding: '6px 8px', borderRadius: 7, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12.5, textAlign: 'right', ...mono }}/>
                  <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>M€</span>
                </div>
              </div>
            )}
            <div style={{ marginTop: 8, background: 'var(--surface-2)', borderRadius: 8, padding: '8px 11px', fontSize: 12.5, color: 'var(--text-muted)' }}>EBITDA usado: <b style={{ color: 'var(--text)', ...mono }}>{fmt(EBITDA)}</b></div>
          </div>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}><label style={{ fontSize:13, fontWeight:600 }}>Múltiplo EV/EBITDA</label><button onClick={()=>setMult(7.9)} style={{ fontSize:12, color:'#E8001D', background:'none', border:'none', fontWeight:600, cursor:'pointer' }}>Usar sugerido</button></div>
            <input type="range" min="4" max="11" step="0.1" value={mult} onChange={e=>setMult(parseFloat(e.target.value))} style={{ width:'100%', accentColor:'#E8001D' }}/>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-subtle)', marginTop:4 }}><span>4x</span><span style={{ color:'#E8001D', fontWeight:700, ...mono }}>{fx(mult)}</span><span>11x</span></div>
          </div>
          <button onClick={recalc} style={{ width: '100%', marginTop: 16, padding: '11px 14px', borderRadius: 9, border: 'none', background: pulse ? '#E8001D' : 'var(--text)', color: 'var(--bg)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'background .2s' }}>Recalcular</button>
        </CECard>

        {/* Enterprise Value */}
        <CECard style={{ display: 'flex', flexDirection: 'column', transition: 'box-shadow .3s', boxShadow: pulse ? '0 0 0 2px rgba(232,0,29,.35)' : 'none' }}>
          <Eyebrow>Enterprise Value</Eyebrow>
          {scen.map((s,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <span style={{ width:46, fontSize:12.5, color:'var(--text-muted)' }}>{s[0]}</span>
              <div style={{ flex:1, height:14, background:'var(--surface-2)', borderRadius:6, overflow:'hidden' }}><div style={{ height:'100%', width:(ev(s[2])/evMax*100)+'%', background:s[1], borderRadius:6 }}></div></div>
            </div>
          ))}
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:8 }}>
            {scen.map((s,i)=>(
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, border:'1px solid '+s[1], borderRadius:10, padding:'12px 16px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize:12.5, fontWeight:700, color:s[1] }}><span style={{ width:8, height:8, borderRadius:'50%', background:s[1] }}></span>{s[0]}</span>
                <span style={{ fontSize:12, color:'var(--text-subtle)', ...mono }}>{fx(s[2])}</span>
                <span style={{ fontSize:17, fontWeight:800, color:'var(--text)', ...mono }}>{fmt(ev(s[2]))}</span>
              </div>
            ))}
          </div>
          {buyerFactor !== 1 && <div style={{ marginTop: 14, fontSize: 11.5, color: 'var(--text-subtle)' }}>Incluye factor de comprador {BUYERS[buyer].l.toLowerCase()} ({fx(buyerFactor)}) sobre el múltiplo.</div>}
        </CECard>
      </div>

      {/* Escenarios */}
      <CECard pad={0}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)' }}><Eyebrow style={{ margin:0 }}>Resumen de escenarios</Eyebrow></div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead><tr>{['Escenario','Múltiplo','Enterprise Value','Equity Value (aprox.)'].map((th,i)=>(<th key={th} style={{ textAlign:i?'right':'left', padding:'10px 20px', fontSize:10, fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase', color:'var(--text-subtle)' }}>{th}</th>))}</tr></thead>
          <tbody>
            {scen.map((s,i)=>(
              <tr key={i} style={{ borderTop:'1px solid var(--border)' }}>
                <td style={{ padding:'11px 20px' }}><span style={{ display:'inline-flex', alignItems:'center', gap:8 }}><span style={{ width:9, height:9, borderRadius:'50%', background:s[1] }}></span>{s[0]}</span></td>
                <td style={{ padding:'11px 20px', textAlign:'right', ...mono }}>{fx(s[2])}</td>
                <td style={{ padding:'11px 20px', textAlign:'right', ...mono }}>{fmt(ev(s[2]))}</td>
                <td style={{ padding:'11px 20px', textAlign:'right', fontWeight:700, ...mono }}>{fmt(eq(s[2]))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CECard>

      {/* Múltiplos de la categoría */}
      <CECard>
        <Eyebrow>Múltiplos de la categoría · Hoteles y alojamientos similares</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[['P25 categoría', '4,8x'], ['Mediana categoría', '6,2x'], ['P75 categoría', '8,1x'], ['Sugerido para esta empresa', '7,9x', true]].map((s, i) => (
            <div key={i} style={{ background: s[2] ? 'rgba(232,0,29,.05)' : 'var(--surface-2)', border: s[2] ? '1px solid rgba(232,0,29,.25)' : '1px solid var(--border)', borderRadius: 10, padding: '13px 14px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 6 }}>{s[0]}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s[2] ? '#E8001D' : 'var(--text)', ...mono }}>{s[1]}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 12, lineHeight: 1.5 }}>El múltiplo sugerido (7,9x) resulta de aplicar el Quality Score de la compañía (82/100) sobre el rango de la categoría — ver metodología abajo.</p>
      </CECard>

      {/* Benchmark frente a la categoría */}
      <CECard>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <Eyebrow style={{ margin: 0 }}>Benchmark frente a la categoría</Eyebrow>
          <AskAdvisor q="¿Por qué tiene esta valoración?" label="¿Por qué esta valoración?"/>
        </div>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <BenchRadar dims={BENCH}/>
            <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-muted)', marginTop: 6, justifyContent: 'center' }}>
              <span><span style={{ color: '#2164E3' }}>■</span> Empresa</span>
              <span><span style={{ color: '#D97708' }}>■</span> Mediana categoría</span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 320 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 6, fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle)', padding: '0 0 9px', borderBottom: '1px solid var(--border)' }}>
              <span>Métrica</span><span style={{ textAlign: 'right', color: '#2164E3' }}>Empresa</span><span style={{ textAlign: 'right', color: '#D97708' }}>Mediana</span><span style={{ textAlign: 'right' }}>Dif.</span>
            </div>
            {BENCH.map((b, i) => (
              <div key={i} title={b.def} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 6, padding: '11px 0', borderBottom: '1px solid var(--border)', alignItems: 'center', cursor: 'help' }}>
                <span style={{ fontSize: 13, color: 'var(--text)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>{b.l}<span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 13, height: 13, borderRadius: '50%', border: '1px solid var(--border-strong)', fontSize: 8.5, fontWeight: 700, color: 'var(--text-subtle)' }}>i</span></span>
                <span style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#2164E3', ...mono }}>{b.eVal}</span>
                <span style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#D97708', ...mono }}>{b.sVal}</span>
                <span style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#1A8A4A', ...mono }}>{b.dif}</span>
              </div>
            ))}
            <p style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginTop: 10 }}>Basado en 1.002 comparables de "Hoteles y alojamientos similares" (CNAE 5510).</p>
          </div>
        </div>
      </CECard>

      {/* Metodología */}
      <CECard pad={0}>
        <button onClick={() => setShowMethod(!showMethod)} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '16px 20px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          <CPIcon name="signal" size={16} color="var(--text-muted)" sw={2}/>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>Ver metodología de valoración</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-subtle)' }}>{showMethod ? '▲' : '▼'}</span>
        </button>
        {showMethod && (
          <div style={{ padding: '4px 20px 22px', borderTop: '1px solid var(--border)' }}>
            <MethodBlock title="Quality Score (0-100)">
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 8px' }}>Percentil ponderado dentro de la categoría "Hoteles y alojamientos similares":</p>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.8 }}>
                <li><b style={{ color: 'var(--text)' }}>50%</b> Margen EBITDA</li>
                <li><b style={{ color: 'var(--text)' }}>35%</b> Revenue por empleado</li>
                <li><b style={{ color: 'var(--text)' }}>15%</b> Salud de balance</li>
              </ul>
            </MethodBlock>
            <MethodBlock title="Cálculo del múltiplo">
              <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 14px', fontSize: 12.5, ...mono, color: 'var(--text)' }}>múltiplo = 4x + (quality / 100) × (11x − 4x)</div>
            </MethodBlock>
            <MethodBlock title="Factor comprador">
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.8 }}>
                {Object.values(BUYERS).map((b, i) => <li key={i}>{b.l}: <b style={{ color: 'var(--text)' }}>{fx(b.factor)}</b></li>)}
              </ul>
            </MethodBlock>
            <MethodBlock title="Equity Value (aprox.)">
              <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 14px', fontSize: 12.5, ...mono, color: 'var(--text)', marginBottom: 8 }}>Equity (aprox.) = EV − Deuda financiera neta</div>
              <p style={{ fontSize: 12, color: 'var(--text-subtle)', margin: 0 }}>Deuda financiera neta: 5,65M€ (deuda bruta 5,85M€ − caja 0,21M€ — ver Finanzas).</p>
            </MethodBlock>
            <MethodBlock title="EBITDA Ajustado y Media">
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>Ajustado: EBITDA reportado + normalizaciones no recurrentes. Media: promedio aritmético de los 3 últimos ejercicios disponibles (2022-2024).</p>
            </MethodBlock>
          </div>
        )}
      </CECard>

      {/* CTA valoración avanzada */}
      <CECard pad={24} style={{ background: 'linear-gradient(135deg,#0C0C0E,#1A1A18)', border: 'none', position: 'relative', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', right: -16, top: -28, fontSize: 150, color: 'rgba(232,0,29,.07)', fontWeight: 800, lineHeight: 1, pointerEvents: 'none' }}>✦</span>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 800 }}>✦</div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Valoración avanzada</span>
          </div>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,.7)', lineHeight: 1.6, marginBottom: 18, maxWidth: 600 }}>
            Genera un <strong style={{ color: '#fff' }}>informe profesional descargable</strong> con DCF, comparables, escenarios y sensibilidad, y el racional para comprador estratégico y financiero.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <button style={{ padding: '13px 22px', borderRadius: 11, border: 'none', background: '#E8001D', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Solicitar valoración avanzada</button>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 700, color: '#fff' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E8001D' }}></span> 75 créditos</span>
          </div>
        </div>
      </CECard>
    </div>
  );
}

Object.assign(window, { CECard, CETitle, Eyebrow, Implies, FinTable, SecResumen, SecValoracion });

