// Arroba — Company Entity: Finanzas (Progressive Disclosure: Ejecutiva → Negocio → Detalle)
// 4 bloques (Cuenta de Resultados · Balance · Cash Flow · Ratios), misma arquitectura en los 4.
// La Inteligencia Arroba precede siempre al dato bruto.

const FIN_MONO = { fontFamily: 'var(--font-mono, ui-monospace, monospace)', fontVariantNumeric: 'tabular-nums' };

function SrcBadge({ src }) {
  const M = {
    rec:  { l: 'Recibido', c: 'var(--text-subtle)', bg: 'var(--surface-2)' },
    calc: { l: 'Calculado', c: '#2164E3', bg: 'rgba(33,100,227,.08)' },
    est:  { l: 'Estimado ✦', c: '#D97708', bg: 'rgba(217,119,8,.08)' },
  };
  const m = M[src] || M.rec;
  return <span style={{ fontSize: 9.5, fontWeight: 700, color: m.c, background: m.bg, padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>{m.l}</span>;
}

/* ── Inteligencia Arroba: precede siempre al dato bruto ── */
function IntelCard({ intel }) {
  const [why, setWhy] = React.useState(false);
  const trendMap = { positiva: { c: '#1A8A4A', l: '↗ Tendencia positiva' }, estable: { c: '#2164E3', l: '→ Tendencia estable' }, negativa: { c: '#D97708', l: '↘ Tendencia negativa' } };
  const tr = trendMap[intel.evolucion.trend];
  return (
    <div style={{ background: 'linear-gradient(135deg,#0C0C0E,#1A1A18)', borderRadius: 14, padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
      <span style={{ position: 'absolute', right: -14, top: -24, fontSize: 130, color: 'rgba(232,0,29,.07)', fontWeight: 800, lineHeight: 1, pointerEvents: 'none' }}>✦</span>
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 800 }}>✦</div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Inteligencia Arroba</span>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: tr.c }}>{tr.l}</span>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,.85)', marginBottom: 14, maxWidth: 820 }}>{intel.resumen}</p>

        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginBottom: 14 }}>
          {intel.positivos.length > 0 && (
            <div style={{ flex: '1 1 260px' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'rgba(26,138,74,.9)', marginBottom: 7 }}>Aspectos positivos</div>
              {intel.positivos.map((p, i) => <div key={i} style={{ display: 'flex', gap: 7, fontSize: 12.5, color: 'rgba(255,255,255,.75)', lineHeight: 1.5, marginBottom: 5 }}><span style={{ color: '#3EBE7E', flexShrink: 0 }}>✓</span>{p}</div>)}
            </div>
          )}
          {intel.atencion.length > 0 && (
            <div style={{ flex: '1 1 260px' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'rgba(217,119,8,.95)', marginBottom: 7 }}>Aspectos de atención</div>
              {intel.atencion.map((p, i) => <div key={i} style={{ display: 'flex', gap: 7, fontSize: 12.5, color: 'rgba(255,255,255,.75)', lineHeight: 1.5, marginBottom: 5 }}><span style={{ color: '#E8A93B', flexShrink: 0 }}>⚠</span>{p}</div>)}
            </div>
          )}
        </div>

        {intel.comparacion.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {intel.comparacion.map((c, i) => (
              <span key={i} style={{ fontSize: 11.5, fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)', padding: '5px 11px', borderRadius: 7 }}>{c.l}: <b style={{ color: '#E8001D' }}>{c.v}</b></span>
            ))}
          </div>
        )}

        <button onClick={() => setWhy(!why)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.9)', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.16)', padding: '7px 13px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          {why ? 'Ocultar evidencias' : '¿Por qué Arroba dice esto?'}
        </button>
        {why && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.12)' }}>
            {intel.evidencia.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'rgba(255,255,255,.65)', lineHeight: 1.6, marginBottom: 6 }}><span style={{ color: 'rgba(255,255,255,.35)', flexShrink: 0 }}>{i + 1}.</span>{e}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* Aviso cuando el ejercicio seleccionado no tiene detalle contable completo (solo 2024 lo tiene) */
function YearGate({ year }) {
  return (
    <CECard>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <CPIcon name="signal" size={18} color="var(--text-subtle)" sw={2}/>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Sin detalle contable para {year}</div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0, maxWidth: 620 }}>El desglose por categorías y el detalle contable completo solo están disponibles para <b>2024</b>, el único ejercicio auditado cargado. {year} forma parte de la serie ilustrativa de evolución (vista Ejecutiva).</p>
        </div>
      </div>
    </CECard>
  );
}

/* ── Nivel 1 · Executive View ── */
function Level1({ block, year, isReal }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {block.multiYear && (
        <CECard>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <Eyebrow style={{ margin: 0 }}>Evolución 2020–2024 · individual</Eyebrow>
            {!isReal && <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-subtle)', background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: 5 }}>Serie ilustrativa</span>}
          </div>
          <EvolutionChart series={window.CE_DATA.historico.individual}/>
          <EvolutionLegend/>
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}><CagrCards series={window.CE_DATA.historico.individual}/></div>
        </CECard>
      )}
      {!isReal && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--surface-2)', border: '1px dashed var(--border-strong)', borderRadius: 10, padding: '10px 14px' }}>
          <CPIcon name="signal" size={15} color="var(--text-subtle)" sw={2}/>
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Los indicadores y el gráfico de abajo corresponden al ejercicio <b>2024</b>, el único con detalle completo cargado.</span>
        </div>
      )}
      <div style={{ display: `grid`, gridTemplateColumns: `repeat(${block.kpis.length}, 1fr)`, gap: 14 }}>
        {block.kpis.map(k => (
          <CECard key={k.l} pad={18}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>{k.l}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', ...FIN_MONO, lineHeight: 1 }}>{k.v}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginTop: 5 }}>{k.d}</div>
          </CECard>
        ))}
      </div>
      <CECard>
        <Eyebrow>{block.vizTitle}</Eyebrow>
        {block.viz}
      </CECard>
    </div>
  );
}

/* Waterfall bar mini-viz reused across PNL/Balance/CashFlow executive views */
function WaterfallViz({ items }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: '6px 4px' }}>
      {items.map((w, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 132, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>{w.l}</span>
          <div style={{ flex: 1, height: 22, position: 'relative', borderLeft: '1px dashed var(--border-strong)', borderRight: '1px dashed var(--border-strong)' }}>
            <div style={{ position: 'absolute', left: '50%', top: -3, bottom: -3, width: 1, background: 'var(--border-strong)' }}></div>
            <div style={{ position: 'absolute', top: 3, bottom: 3, borderRadius: 3, background: w.c, [w.side]: '50%', width: Math.abs(w.w) + '%' }}></div>
          </div>
          <span style={{ width: 68, fontSize: 11.5, ...FIN_MONO, color: 'var(--text)', textAlign: 'right', flexShrink: 0 }}>{w.v}</span>
        </div>
      ))}
    </div>
  );
}

function RadarBars({ dims }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
      {dims.map((d, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
            <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>{d.l}
              <span title={d.def} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--border-strong)', fontSize: 9, fontWeight: 700, color: 'var(--text-subtle)', cursor: 'help' }}>i</span>
            </span>
            <b style={{ ...FIN_MONO, fontWeight: 700 }}>{d.p}</b>
          </div>
          <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' }}><div style={{ height: '100%', width: d.e + '%', background: '#E8001D', borderRadius: 4 }}></div></div>
        </div>
      ))}
    </div>
  );
}

/* ── Nivel 2 · Business View (grandes categorías, sin cuentas) ── */
function Level2({ block }) {
  if (block.categoriesKind === 'bars') {
    const max = Math.max(...block.categories.map(c => Math.abs(c.pct)));
    return (
      <CECard>
        <Eyebrow>Grandes categorías · % sobre ventas</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {block.categories.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 190, fontSize: 13, fontWeight: c.bold ? 700 : 500, color: c.bold ? 'var(--text)' : 'var(--text-muted)', flexShrink: 0 }}>{c.l}</span>
              <div style={{ flex: 1, height: 20, background: 'var(--surface-2)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: Math.min(100, Math.abs(c.pct) / max * 100) + '%', background: c.color || (c.pct < 0 ? '#E8001D' : '#0C0C0E'), borderRadius: 5 }}></div>
              </div>
              <span style={{ width: 90, fontSize: 13, fontWeight: c.bold ? 700 : 500, ...FIN_MONO, color: 'var(--text)', textAlign: 'right', flexShrink: 0 }}>{c.v}</span>
              <span style={{ width: 52, fontSize: 11.5, ...FIN_MONO, color: 'var(--text-subtle)', textAlign: 'right', flexShrink: 0 }}>{c.pct.toLocaleString('es-ES', { maximumFractionDigits: 1 })}%</span>
            </div>
          ))}
        </div>
      </CECard>
    );
  }
  // groups: cards for Balance / Cash Flow
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${block.groups.length}, 1fr)`, gap: 14 }}>
      {block.groups.map((g, gi) => (
        <CECard key={gi}>
          <Eyebrow>{g.title}</Eyebrow>
          {g.rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderTop: i ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.l}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 700, color: 'var(--text)', ...FIN_MONO }}>{r.v} {r.src && <SrcBadge src={r.src}/>}</span>
            </div>
          ))}
        </CECard>
      ))}
    </div>
  );
}

/* ── Nivel 3 · Financial Detail (todas las cuentas, sin resumir) ── */
function Level3PL() {
  const rows = window.CE_DATA.finanzas.individual.pyg;
  const ventas = 6.406136;
  return (
    <CECard pad={0}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}><Eyebrow style={{ margin: 0 }}>Cuenta de resultados completa · individual 2024</Eyebrow></div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
        <thead><tr>{['Concepto', 'Importe', '% ventas'].map((th, i) => (<th key={th} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '9px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle)', background: 'var(--surface-2)' }}>{th}</th>))}</tr></thead>
        <tbody>
          {rows.map((r, i) => {
            const numeric = parseFloat(r.val.replace(/[^0-9,.-]/g, '').replace(',', '.').replace('−', '-'));
            const pct = Math.abs(numeric / ventas * 100).toLocaleString('es-ES', { maximumFractionDigits: 1 }) + '%';
            return (
              <tr key={i} style={{ background: r.accent ? 'rgba(232,0,29,.045)' : r.bold ? 'var(--surface-2)' : 'transparent' }}>
                <td style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', fontWeight: r.bold ? 700 : 400 }}>{r.label}{r.note && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-subtle)', fontWeight: 500 }}>{r.note}</span>}</td>
                <td style={{ padding: '10px 20px', textAlign: 'right', borderTop: '1px solid var(--border)', fontWeight: r.bold ? 700 : 400, color: r.accent ? '#E8001D' : 'var(--text)', ...FIN_MONO }}>{r.val}</td>
                <td style={{ padding: '10px 20px', textAlign: 'right', borderTop: '1px solid var(--border)', color: 'var(--text-subtle)', ...FIN_MONO }}>{pct}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </CECard>
  );
}

function Level3Balance() {
  const bal = window.CE_DATA.finanzas.individual.balance;
  const Tbl = ({ title, rows }) => (
    <CECard pad={0}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}><Eyebrow style={{ margin: 0 }}>{title}</Eyebrow></div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: r.accent ? 'rgba(232,0,29,.045)' : 'transparent' }}>
              <td style={{ padding: '10px 20px', paddingLeft: r.sub ? 32 : 20, borderTop: i ? '1px solid var(--border)' : 'none', fontWeight: r.bold ? 700 : 400, color: r.sub ? 'var(--text-muted)' : 'var(--text)' }}>{r.label}</td>
              <td style={{ padding: '10px 20px', textAlign: 'right', borderTop: i ? '1px solid var(--border)' : 'none', fontWeight: r.bold ? 700 : 400, color: r.accent ? '#E8001D' : 'var(--text)', ...FIN_MONO }}>{r.val}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </CECard>
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
      <Tbl title="Activo completo · 2024" rows={bal.activo}/>
      <Tbl title="Patrimonio neto y pasivo completo · 2024" rows={bal.pasivo}/>
    </div>
  );
}

function Level3CashFlow() {
  const groups = [
    { title: 'Flujo de explotación (estimado)', rows: [
      { l: 'EBITDA', v: '1,87M€', src: 'rec' },
      { l: 'Impuesto sobre beneficios', v: '−0,36M€', src: 'rec' },
      { l: 'Variación de capital circulante', v: '0,00M€', src: 'est' },
      { l: 'Total flujo de explotación', v: '1,51M€', src: 'est', bold: true },
    ]},
    { title: 'Flujo de inversión (estimado)', rows: [
      { l: 'Inversión en inmovilizado material', v: '−0,36M€', src: 'est' },
      { l: 'Total flujo de inversión', v: '−0,36M€', src: 'est', bold: true },
    ]},
    { title: 'Flujo de financiación', rows: [
      { l: 'Dividendo a cuenta pagado', v: '−0,90M€', src: 'rec' },
      { l: 'Variación de deuda financiera L/P', v: '−0,21M€', src: 'est' },
      { l: 'Total flujo de financiación', v: '−1,11M€', src: 'est', bold: true },
    ]},
    { title: 'Caja', rows: [
      { l: 'Caja inicial 2024 (estimada)', v: '0,17M€', src: 'est' },
      { l: 'Variación neta de caja', v: '+0,04M€', src: 'est' },
      { l: 'Caja final 2024 (tesorería, balance)', v: '0,21M€', src: 'rec', bold: true },
    ]},
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'rgba(217,119,8,.06)', border: '1px solid rgba(217,119,8,.22)', borderRadius: 10, padding: '12px 14px' }}>
        <CPIcon name="signal" size={16} color="#D97708" sw={2}/>
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}><strong style={{ color: 'var(--text)' }}>Iberinform no publica el estado de flujos de efectivo de esta compañía.</strong> Las líneas marcadas «Estimado ✦» son una aproximación de Arroba a partir del balance y la cuenta de resultados; solo el dividendo a cuenta y la caja final son datos recibidos directamente.</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {groups.map((g, gi) => (
          <CECard key={gi} pad={0}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}><Eyebrow style={{ margin: 0 }}>{g.title}</Eyebrow></div>
            <div style={{ padding: '4px 20px 12px' }}>
              {g.rows.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderTop: i ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 13, color: r.bold ? 'var(--text)' : 'var(--text-muted)', fontWeight: r.bold ? 700 : 400 }}>{r.l}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 13.5, fontWeight: r.bold ? 700 : 500, color: 'var(--text)', ...FIN_MONO }}>{r.v}</span>
                  </span>
                </div>
              ))}
            </div>
          </CECard>
        ))}
      </div>
    </div>
  );
}

function Level3Ratios() {
  const families = [
    { title: 'Rentabilidad', items: [
      { l: 'Margen EBITDA', v: '29,19%', src: 'calc' },
      { l: 'ROE (beneficio / patrimonio neto)', v: '7,47%', src: 'calc' },
      { l: 'ROA (beneficio / activo)', v: '6,20%', src: 'calc' },
    ]},
    { title: 'Liquidez', items: [
      { l: 'Ratio de liquidez (AC / PC)', v: '5,49x', src: 'calc' },
      { l: 'Fondo de maniobra', v: '6,25M€', src: 'calc' },
      { l: 'Availability Ratio', v: '0,15', src: 'rec' },
    ]},
    { title: 'Solvencia', items: [
      { l: 'Solvency (Iberinform)', v: '10 / 10', src: 'rec' },
      { l: 'Solvency Ratio', v: '5,85', src: 'rec' },
      { l: 'Patrimonio neto / Activo', v: '82,91%', src: 'calc' },
    ]},
    { title: 'Endeudamiento', items: [
      { l: 'Debt Ratio', v: '17,09%', src: 'rec' },
      { l: 'Quality of Debt', v: '20,62%', src: 'rec' },
      { l: 'Interest Coverage', v: '10,58x', src: 'rec' },
      { l: 'Deuda financiera neta / EBITDA', v: '3,02x', src: 'calc' },
    ]},
    { title: 'Productividad', items: [
      { l: 'Ventas por empleado', v: '79,1 mil€', src: 'calc' },
      { l: 'EBITDA por empleado', v: '23,1 mil€', src: 'calc' },
    ]},
    { title: 'Cobros y pagos', items: [
      { l: 'Rating Iberinform', v: '7 / 10', src: 'rec' },
      { l: 'Límite de crédito', v: '2,71M€', src: 'rec' },
      { l: 'Plazo medio de pago', v: '41,53 días', src: 'rec' },
    ]},
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
      {families.map((f, fi) => (
        <CECard key={fi} pad={0}>
          <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)' }}><Eyebrow style={{ margin: 0 }}>{f.title}</Eyebrow></div>
          <div style={{ padding: '4px 18px 12px' }}>
            {f.items.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderTop: i ? '1px solid var(--border)' : 'none', gap: 8 }}>
                <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{r.l}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', ...FIN_MONO }}>{r.v}</span>
                </span>
              </div>
            ))}
          </div>
        </CECard>
      ))}
    </div>
  );
}

/* ── Nivel 4 · Comparables (todos los ejercicios disponibles, lado a lado) ── */
function Level4Comparables({ block }) {
  if (block.id !== 'pnl') {
    return (
      <CECard>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <CPIcon name="signal" size={18} color="var(--text-subtle)" sw={2}/>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Sin serie histórica para este bloque</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0, maxWidth: 620 }}>Solo la Cuenta de resultados tiene serie multi-año cargada (facturación, EBITDA y margen). El resto de bloques solo tienen detalle de 2024.</p>
          </div>
        </div>
      </CECard>
    );
  }
  const h = window.CE_DATA.historico;
  const realYears = h.realYears || [];
  const Tbl = ({ title, s }) => (
    <CECard pad={0}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}><Eyebrow style={{ margin: 0 }}>{title}</Eyebrow></div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '9px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle)', background: 'var(--surface-2)' }}>Ejercicio</th>
            {s.years.map(y => (
              <th key={y} style={{ textAlign: 'right', padding: '9px 20px', fontSize: 10, fontWeight: 700, background: 'var(--surface-2)' }}>
                <div style={{ color: 'var(--text-subtle)', letterSpacing: '.05em', textTransform: 'uppercase' }}>{y}</div>
                <div style={{ fontWeight: 700, marginTop: 3, color: realYears.indexOf(y) > -1 ? '#1A8A4A' : 'var(--text-subtle)' }}>{realYears.indexOf(y) > -1 ? 'Real' : 'Ilustrativo'}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            { l: 'Ventas', vals: s.facturacion.map(v => v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + 'M€') },
            { l: 'EBITDA', vals: s.ebitda.map(v => v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + 'M€') },
            { l: 'Margen EBITDA', vals: s.margen.map(v => v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%') },
          ].map((row, i) => (
            <tr key={i} style={{ background: row.l === 'EBITDA' ? 'rgba(26,138,74,.05)' : 'transparent' }}>
              <td style={{ padding: '11px 20px', borderTop: '1px solid var(--border)', fontWeight: 700 }}>{row.l}</td>
              {row.vals.map((v, j) => <td key={j} style={{ padding: '11px 20px', textAlign: 'right', borderTop: '1px solid var(--border)', fontWeight: j === row.vals.length - 1 ? 700 : 500, color: row.l === 'EBITDA' ? '#1A8A4A' : 'var(--text)', ...FIN_MONO }}>{v}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </CECard>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {h.demoYears && h.demoYears.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--surface-2)', border: '1px dashed var(--border-strong)', borderRadius: 10, padding: '10px 14px' }}>
          <CPIcon name="signal" size={15} color="var(--text-subtle)" sw={2}/>
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{h.demoYears.join('-')} son una serie ilustrativa · solo {h.realYears.join(', ')} está confirmado por Iberinform.</span>
        </div>
      )}
      <Tbl title="Individual · todos los ejercicios" s={h.individual}/>
      <Tbl title="Consolidado · todos los ejercicios" s={h.consolidado}/>
    </div>
  );
}

/* ── Config de los 4 bloques ── */
function buildBlocks() {
  const FIN = window.CE_DATA.finanzas.individual;
  const radar = window.CE_DATA.radar;

  const pnl = {
    id: 'pnl', label: 'Cuenta de resultados', icon: 'euro', multiYear: true,
    intel: {
      resumen: 'La cuenta de resultados individual de 2024 muestra una facturación de 6,41M€ con un margen EBITDA del 29,2%, muy por encima de la media del sector hotelero. El resultado financiero positivo (dividendos de participadas) eleva el beneficio neto a 2,45M€.',
      positivos: ['Margen EBITDA del 29,2%, percentil 92 del sector', 'Resultado financiero positivo por dividendos de las participadas', 'Beneficio neto equivale al 38% de las ventas'],
      atencion: ['Alta dependencia de ingresos financieros de participadas frente al negocio hotelero directo'],
      evolucion: { trend: 'positiva', reason: '' },
      comparacion: [{ l: 'Margen EBITDA', v: 'P92' }, { l: 'Crecimiento en ventas', v: 'P62' }],
      evidencia: ['EBITDA / Ventas = 1,87M€ / 6,41M€ = 29,19% (cuentas auditadas 2024)', 'Percentil calculado frente a 1.002 comparables del sector hoteles y alojamientos', 'Resultado financiero de +1,36M€ proviene de dividendos de las 7 sociedades participadas'],
    },
    kpis: [
      { l: 'Ventas 2024', v: '6,41M€', d: '+8,2% vs 2023' },
      { l: 'EBITDA', v: '1,87M€', d: 'Margen 29,2%' },
      { l: 'Resultado neto', v: '2,45M€', d: 'Margen 38,2%' },
    ],
    vizTitle: 'De ventas a resultado · cascada visual',
    viz: <WaterfallViz items={[
      { l: 'Ventas', side: 'left', w: 50, v: '6,41M€', c: '#0C0C0E' },
      { l: 'Aprovisionamientos', side: 'right', w: 10.9, v: '−1,40M€', c: '#E8001D' },
      { l: 'Gastos de personal', side: 'right', w: 15.2, v: '−1,94M€', c: '#E8001D' },
      { l: 'Otros gastos', side: 'right', w: 10.2, v: '−1,30M€', c: '#E8001D' },
      { l: 'EBITDA', side: 'left', w: 14.6, v: '1,87M€', c: '#1A8A4A' },
      { l: 'Amortización', side: 'right', w: 3.2, v: '−0,41M€', c: '#E8001D' },
      { l: 'Result. financiero', side: 'left', w: 10.6, v: '+1,36M€', c: '#2164E3' },
      { l: 'Resultado neto', side: 'left', w: 19.1, v: '2,45M€', c: '#1A8A4A' },
    ]}/>,
    categoriesKind: 'bars',
    categories: [
      { l: 'Ingresos', v: '6,41M€', pct: 100, bold: true },
      { l: 'Aprovisionamientos', v: '−1,40M€', pct: -21.9 },
      { l: 'Gastos de personal', v: '−1,94M€', pct: -30.3 },
      { l: 'Otros gastos', v: '−1,30M€', pct: -20.3 },
      { l: 'EBITDA', v: '1,87M€', pct: 29.2, bold: true, color: '#1A8A4A' },
      { l: 'Amortizaciones', v: '−0,41M€', pct: -6.4 },
      { l: 'EBIT (result. explotación)', v: '1,46M€', pct: 22.8, bold: true },
      { l: 'Resultado financiero', v: '+1,36M€', pct: 21.2, color: '#2164E3' },
      { l: 'Resultado antes de impuestos', v: '2,81M€', pct: 43.9, bold: true },
      { l: 'Resultado neto', v: '2,45M€', pct: 38.2, bold: true, color: '#1A8A4A' },
    ],
    detail: <Level3PL/>,
  };

  const balance = {
    id: 'balance', label: 'Balance', icon: 'summary',
    intel: {
      resumen: 'El balance está financiado en un 83% con recursos propios y presenta una deuda financiera neta moderada (3,02x EBITDA): una estructura muy solvente para el tamaño de la compañía.',
      positivos: ['Patrimonio neto del 82,91% sobre el activo total', 'Solvency Ratio de 5,85, muy por encima del umbral de riesgo (1,0)', 'Fondo de maniobra positivo de 6,25M€'],
      atencion: ['Deuda financiera neta de 5,65M€ (3,02x EBITDA)', 'Alta concentración del activo en inversiones en empresas del grupo (66% del activo no corriente)'],
      evolucion: { trend: 'estable', reason: '' },
      comparacion: [{ l: 'Ratio de solvencia', v: 'P90' }],
      evidencia: ['Patrimonio neto (32,81M€) / Activo total (39,57M€) = 82,91%', 'Deuda financiera neta = Deuda bruta (5,85M€) − Caja (0,21M€) = 5,65M€', 'Fondo de maniobra = Activo corriente (7,64M€) − Pasivo corriente (1,39M€) = 6,25M€'],
    },
    kpis: [
      { l: 'Activo total', v: '39,57M€', d: '2024' },
      { l: 'Patrimonio neto', v: '32,81M€', d: '82,9% del activo' },
      { l: 'Deuda financiera neta', v: '5,65M€', d: '3,02x EBITDA' },
    ],
    vizTitle: 'Composición del balance',
    viz: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginBottom: 6 }}>Activo (39,57M€) por naturaleza</div>
          <div style={{ height: 22, borderRadius: 5, overflow: 'hidden', display: 'flex' }}><div style={{ width: '81%', background: '#2164E3' }}></div><div style={{ width: '19%', background: '#7C3AED' }}></div></div>
          <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 11.5, color: 'var(--text-muted)' }}><span>■ No corriente 31,93M€</span><span>■ Corriente 7,64M€</span></div>
        </div>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginBottom: 6 }}>Financiación</div>
          <div style={{ height: 22, borderRadius: 5, overflow: 'hidden', display: 'flex' }}><div style={{ width: '82.9%', background: '#1A8A4A' }}></div><div style={{ width: '13.6%', background: '#D97708' }}></div><div style={{ width: '3.5%', background: '#E8001D' }}></div></div>
          <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 11.5, color: 'var(--text-muted)' }}><span>■ Patrimonio neto 82,9%</span><span>■ Pasivo no corriente 13,6%</span><span>■ Pasivo corriente 3,5%</span></div>
        </div>
      </div>
    ),
    categoriesKind: 'groups',
    groups: [
      { title: 'Activo', rows: [
        { l: 'Activo no corriente', v: '31,93M€' },
        { l: 'Activo corriente', v: '7,64M€' },
        { l: 'Total activo', v: '39,57M€' },
      ]},
      { title: 'Patrimonio neto y pasivo', rows: [
        { l: 'Patrimonio neto', v: '32,81M€' },
        { l: 'Pasivo no corriente', v: '5,37M€' },
        { l: 'Pasivo corriente', v: '1,39M€' },
      ]},
    ],
    detail: <Level3Balance/>,
  };

  const cashflow = {
    id: 'cashflow', label: 'Cash Flow', icon: 'chartBar',
    intel: {
      resumen: 'Iberinform no publica el estado de flujos de efectivo de esta compañía. A partir del balance y la cuenta de resultados, Arroba estima una generación de caja operativa sólida, parcialmente destinada a dividendos.',
      positivos: ['Flujo de explotación estimado positivo (1,51M€), superior al EBITDA menos impuestos', 'La compañía distribuyó un dividendo a cuenta de 0,90M€ sin comprometer la caja final'],
      atencion: ['Estas cifras son una estimación de Arroba; interpretarlas con cautela hasta disponer del estado de flujos oficial'],
      evolucion: { trend: 'estable', reason: '' },
      comparacion: [],
      evidencia: ['Flujo de explotación (estimado) = EBITDA (1,87M€) − Impuesto sobre beneficios (0,36M€) = 1,51M€', 'Flujo de financiación incluye el dividendo a cuenta real de −0,90M€ (dato recibido, ver Balance)', 'Caja final de 0,21M€ coincide con la tesorería reportada en el balance 2024 (dato recibido)'],
    },
    kpis: [
      { l: 'Caja final 2024', v: '0,21M€', d: 'Dato real · tesorería' },
      { l: 'Flujo de explotación', v: '1,51M€', d: 'Estimado ✦' },
      { l: 'Flujo de financiación', v: '−1,11M€', d: 'Estimado ✦' },
    ],
    vizTitle: 'De la caja inicial a la caja final (estimado)',
    viz: <WaterfallViz items={[
      { l: 'Caja inicial (est.)', side: 'left', w: 8, v: '0,17M€', c: '#0C0C0E' },
      { l: 'Flujo explotación', side: 'left', w: 74, v: '+1,51M€', c: '#1A8A4A' },
      { l: 'Flujo inversión', side: 'right', w: 17.6, v: '−0,36M€', c: '#E8001D' },
      { l: 'Flujo financiación', side: 'right', w: 54.4, v: '−1,11M€', c: '#E8001D' },
      { l: 'Caja final (real)', side: 'left', w: 10.3, v: '0,21M€', c: '#0C0C0E' },
    ]}/>,
    categoriesKind: 'groups',
    groups: [
      { title: 'Flujos del ejercicio', rows: [
        { l: 'Flujo de explotación', v: '1,51M€', src: 'est' },
        { l: 'Flujo de inversión', v: '−0,36M€', src: 'est' },
        { l: 'Flujo de financiación', v: '−1,11M€', src: 'est' },
      ]},
      { title: 'Caja', rows: [
        { l: 'Caja inicial (estimada)', v: '0,17M€', src: 'est' },
        { l: 'Variación neta de caja', v: '+0,04M€', src: 'est' },
        { l: 'Caja final (dato real)', v: '0,21M€', src: 'rec' },
      ]},
    ],
    detail: <Level3CashFlow/>,
  };

  const ratios = {
    id: 'ratios', label: 'Ratios', icon: 'signal',
    intel: {
      resumen: 'Rentabilidad, solvencia y liquidez se sitúan por encima de la mediana del sector hotelero, con un endeudamiento moderado y bien cubierto por el resultado de explotación.',
      positivos: ['Margen EBITDA en el percentil 92 del sector', 'Interest Coverage de 10,58x: el resultado cubre la carga financiera con amplio margen', 'Solvency Ratio de 5,85, muy por encima del umbral de riesgo'],
      atencion: ['Deuda financiera neta / EBITDA de 3,02x — moderado pero a vigilar si se financian nuevas adquisiciones'],
      evolucion: { trend: 'positiva', reason: '' },
      comparacion: [{ l: 'Calidad', v: 'P88' }, { l: 'Salud financiera', v: 'P90' }, { l: 'Productividad', v: 'P70' }],
      evidencia: ['Percentiles calculados frente a 1.002 comparables del sector hoteles y alojamientos (CNAE 5510)', 'Interest Coverage = Resultado de explotación / Gastos financieros = 10,58x (Iberinform)', 'Rating Iberinform 7/10 y Solvency 10/10, ambos datos recibidos directamente del proveedor'],
    },
    kpis: [
      { l: 'Margen EBITDA', v: '29,2%', d: 'Percentil 92' },
      { l: 'Solvency Ratio', v: '5,85', d: 'Iberinform' },
      { l: 'Deuda neta / EBITDA', v: '3,02x', d: 'Calculado' },
    ],
    vizTitle: 'Posicionamiento frente al sector (percentil)',
    viz: <RadarBars dims={radar}/>,
    categoriesKind: 'groups',
    groups: [
      { title: 'Rentabilidad y solvencia', rows: [
        { l: 'Margen EBITDA', v: '29,19%', src: 'calc' },
        { l: 'Solvency Ratio', v: '5,85', src: 'rec' },
      ]},
      { title: 'Endeudamiento y productividad', rows: [
        { l: 'Deuda neta / EBITDA', v: '3,02x', src: 'calc' },
        { l: 'Ventas por empleado', v: '79,1 mil€', src: 'calc' },
      ]},
    ],
    detail: <Level3Ratios/>,
  };

  return [pnl, balance, cashflow, ratios];
}

/* ══ FINANZAS — Sección completa ══ */
function SecFinanzas({ E }) {
  const BLOCKS = React.useMemo(buildBlocks, []);
  const [blockId, setBlockId] = React.useState('pnl');
  const [level, setLevel] = React.useState(1);
  const years = (window.CE_DATA.historico.individual.years || ['2024']).slice().reverse();
  const [year, setYear] = React.useState(years[0]);
  const [yearOpen, setYearOpen] = React.useState(false);
  const block = BLOCKS.find(b => b.id === blockId);
  const LEVELS = [
    { n: 1, l: 'Ejecutiva', d: 'La situación en menos de un minuto' },
    { n: 2, l: 'Negocio', d: 'Grandes categorías, sin cuentas' },
    { n: 3, l: 'Detalle', d: 'Todas las cuentas, sin resumir' },
    { n: 4, l: 'Evolución', d: 'Todos los ejercicios disponibles, lado a lado' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <CETitle sub="Cuenta de resultados, balance, cash flow y ratios — de la vista ejecutiva al detalle contable completo.">Finanzas</CETitle>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={() => years.length > 1 && setYearOpen(!yearOpen)} title={years.length === 1 ? 'Cuando se incorporen más ejercicios auditados, podrás compararlos aquí' : 'Cambiar de ejercicio'} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 10, border: '1.5px solid #0C0C0E', background: 'var(--text)', color: 'var(--bg)', fontSize: 13, fontWeight: 700, cursor: years.length > 1 ? 'pointer' : 'default', fontFamily: 'var(--font-body)' }}>
            <CPIcon name="summary" size={14} color="var(--bg)" sw={2}/> Ejercicio analizado: {year}
            {years.length > 1 && <span style={{ fontSize: 10 }}>▾</span>}
          </button>
          {yearOpen && years.length > 1 && (
            <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,.14)', overflow: 'hidden', zIndex: 20, minWidth: 200 }}>
              {years.map(y => {
                const real = (window.CE_DATA.historico.realYears || []).indexOf(y) > -1;
                return (
                  <button key={y} onClick={() => { setYear(y); setYearOpen(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%', textAlign: 'left', padding: '9px 14px', border: 'none', background: y === year ? 'var(--surface-2)' : 'transparent', color: 'var(--text)', fontWeight: y === year ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                    {y}
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: real ? '#1A8A4A' : 'var(--text-subtle)', background: real ? 'rgba(26,138,74,.1)' : 'var(--surface-2)', padding: '2px 6px', borderRadius: 4 }}>{real ? 'Real' : 'Ilustrativo'}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {years.length === 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--surface-2)', border: '1px dashed var(--border-strong)', borderRadius: 10, padding: '10px 14px', marginTop: -6 }}>
          <CPIcon name="chartBar" size={15} color="var(--text-subtle)" sw={2}/>
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Solo hay un ejercicio auditado disponible (2024). En cuanto se incorporen ejercicios anteriores, este selector permitirá analizar y comparar cada año por separado.</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -10 }}><AskAdvisor q="¿Qué partidas explican el beneficio neto de 2024?" label="Preguntar sobre las finanzas"/></div>

      {/* Selector de bloque */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {BLOCKS.map(b => (
          <button key={b.id} onClick={() => setBlockId(b.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10, border: blockId === b.id ? '1.5px solid #0C0C0E' : '1px solid var(--border-strong)', background: blockId === b.id ? 'var(--text)' : 'var(--surface)', color: blockId === b.id ? 'var(--bg)' : 'var(--text)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            <CPIcon name={b.icon} size={15} color={blockId === b.id ? 'var(--bg)' : 'var(--text-muted)'} sw={2}/> {b.label}
          </button>
        ))}
      </div>

      {/* Inteligencia Arroba — precede siempre al dato bruto */}
      <IntelCard intel={block.intel}/>

      {/* Selector de nivel (Progressive Disclosure) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 3 }}>
          {LEVELS.map(lv => (
            <button key={lv.n} onClick={() => setLevel(lv.n)} style={{ padding: '8px 16px', borderRadius: 7, border: 'none', background: level === lv.n ? 'var(--surface)' : 'transparent', color: level === lv.n ? 'var(--text)' : 'var(--text-muted)', fontSize: 12.5, fontWeight: level === lv.n ? 700 : 500, cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: level === lv.n ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>{lv.l}</button>
          ))}
        </div>
        <span style={{ fontSize: 12.5, color: 'var(--text-subtle)' }}>{LEVELS.find(l => l.n === level).d}</span>
      </div>

      {level === 1 && <Level1 block={block} year={year} isReal={year === '2024'}/>}
      {level === 2 && (year === '2024' ? <Level2 block={block}/> : <YearGate year={year}/>)}
      {level === 3 && (year === '2024' ? block.detail : <YearGate year={year}/>)}
      {level === 4 && <Level4Comparables block={block}/>}
    </div>
  );
}

Object.assign(window, { SecFinanzas });
