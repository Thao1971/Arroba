// arroba.com — Resultado de Valoración de Mercado · app interactiva

function fmtM(n) {
  // n en M€ → "86,60M€"
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + 'M€';
}
function fmtX(n) { return n.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'x'; }

function VALApp() {
  const [dark, setDark] = React.useState(() => localStorage.getItem('arr-dark') === 'true');
  const [stage, setStage] = React.useState('intro'); // intro | loading | result
  const [nif, setNif] = React.useState('');
  const [picked, setPicked] = React.useState(null);
  const [qsOpen, setQsOpen] = React.useState(false);
  const [buyer, setBuyer] = React.useState('financiero');
  const [ebitdaMode, setEbitdaMode] = React.useState('reportado');
  const [mult, setMult] = React.useState(6.9);
  const [benchOpen, setBenchOpen] = React.useState(false);
  const [methodOpen, setMethodOpen] = React.useState(false);

  React.useEffect(() => {
    if (dark) document.documentElement.setAttribute('data-dark', '');
    else document.documentElement.removeAttribute('data-dark');
    localStorage.setItem('arr-dark', dark);
  }, [dark]);

  // Compañía / inputs
  const company = 'Grupo Olmedo Hoteles';
  const ebitdaReported = 14.60, ebitdaAdjusted = 15.10, ebitdaMean = 15.51;
  const ebitda = ebitdaMode === 'reportado' ? ebitdaReported : ebitdaMode === 'ajustado' ? ebitdaAdjusted : ebitdaMean;
  const buyerMult = { financiero: 1.00, estrategico: 1.15, industrial: 1.10 };
  const netDebt = 0; // equity ≈ EV − deuda neta (no disponible → "—")

  // Escenarios
  const lowM = +(mult - 1).toFixed(1), midM = +mult.toFixed(1), highM = +(mult + 1).toFixed(1);
  const scenarios = [
    { id: 'bajo', label: 'Bajo', color: '#E8001D', m: lowM },
    { id: 'medio', label: 'Medio', color: '#2164E3', m: midM },
    { id: 'alto', label: 'Alto', color: '#1A8A4A', m: highM },
  ].map(s => ({ ...s, ev: +(ebitda * s.m).toFixed(2) }));
  const maxEV = Math.max(...scenarios.map(s => s.ev)) * 1.12;

  const pos = [
    { label: 'Margen EBITDA', pct: 88, p: 'P88' },
    { label: 'Revenue / Empleado', pct: 52, p: 'P52' },
    { label: 'Salud Balance', pct: 90, p: 'P90' },
  ];

  const Card = ({ children, style }) => (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, ...style }}>{children}</div>
  );
  const CardHead = ({ icon, title, action }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
      <HIcon name={icon} size={18} color="#E8001D" sw={1.75}/>
      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{title}</span>
      <div style={{ flex: 1 }}></div>
      {action}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <style>{`
        * { transition: background-color .15s, border-color .12s, color .1s; }
        .val-slider { -webkit-appearance: none; appearance: none; height: 5px; border-radius: 3px; outline: none; }
        .val-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #fff; border: 2px solid #E8001D; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,.2); }
        .val-slider::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: #fff; border: 2px solid #E8001D; cursor: pointer; }
        .val-btn:hover { filter: brightness(1.06); }
        .val-collapse:hover { background: var(--surface-2) !important; }
        @media (max-width: 920px) { .val-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* Top nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 300, background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid var(--border)', height: 72, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 28 }}>
        <a href="Home.html" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="uploads/logo.png" alt="arroba" style={{ height: 55, filter: dark ? 'brightness(0) invert(1)' : 'none' }}/>
        </a>
        <div style={{ display: 'flex', gap: 4 }} className="val-nav">
          {[['Analiza', 'Analiza.html'], ['Valora', 'Valora.html'], ['Compra/Vende', 'Compra-Vende.html']].map(([l, href]) => (
            <a key={l} href={href} style={{ fontSize: 14, fontWeight: l === 'Valora' ? 700 : 500, color: l === 'Valora' ? '#E8001D' : 'var(--text-muted)', padding: '7px 14px', borderRadius: 8, textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
        <div style={{ flex: 1 }}></div>
        <button onClick={() => setDark(!dark)} title="Tema" style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>{dark ? '☀' : '◑'}</button>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#A8C03E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#0C0C0E' }}>D</div>
      </nav>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 28px 70px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
              <HIcon name="chartBar" size={22} color="var(--text)" sw={1.75}/>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', letterSpacing: '-.02em' }}>Valoración de Mercado</h1>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#E8001D', background: 'rgba(232,0,29,.07)', border: '1px solid rgba(232,0,29,.18)', padding: '3px 9px', borderRadius: 999 }}>✦ Generada por arroba</span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: 32 }}>{company} · múltiplos sugeridos basados en posicionamiento sectorial</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setMult(6.9); setEbitdaMode('reportado'); setBuyer('financiero'); }} className="val-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>↺ Restablecer</button>
            <button className="val-btn" style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Guardar</button>
            <button className="val-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 10, border: 'none', background: '#E8001D', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 11l5 4 5-4M5 21h14"/></svg> Descargar Valoración
            </button>
          </div>
        </div>

        {/* 3 columnas */}
        <div className="val-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18, marginBottom: 18 }}>

          {/* Posicionamiento */}
          <Card>
            <CardHead icon="target" title="Posicionamiento"/>
            <div style={{ padding: 22 }}>
              <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '20px', textAlign: 'center', marginBottom: 22 }}>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 4 }}>Quality Score</div>
                <div style={{ fontSize: 52, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>73</div>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 6 }}>de 100 · 1.002 comparables</div>
              </div>
              {pos.map(p => (
                <div key={p.label} style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.label}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1A8A4A', fontVariantNumeric: 'tabular-nums' }}>{p.p}</span>
                  </div>
                  <div style={{ height: 7, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: p.pct + '%', background: '#0C0C0E', borderRadius: 4 }}/>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Parámetros */}
          <Card>
            <CardHead icon="layers" title="Parámetros"/>
            <div style={{ padding: 22 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 8 }}>Tipo de comprador</label>
              <select value={buyer} onChange={e => setBuyer(e.target.value)} style={{ width: '100%', padding: '11px 13px', borderRadius: 9, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font-body)', cursor: 'pointer', marginBottom: 20 }}>
                <option value="financiero">Comprador financiero · {fmtX(buyerMult.financiero).replace('x','')}x ajuste</option>
                <option value="estrategico">Comprador estratégico · 1,15x ajuste</option>
                <option value="industrial">Comprador industrial · 1,10x ajuste</option>
              </select>

              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 8 }}>EBITDA base</label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {[['reportado', 'Reportado'], ['ajustado', 'Ajustado'], ['media', 'Media']].map(([id, l]) => (
                  <button key={id} onClick={() => setEbitdaMode(id)} style={{ flex: 1, padding: '9px 6px', borderRadius: 8, border: ebitdaMode === id ? 'none' : '1px solid var(--border-strong)', background: ebitdaMode === id ? '#0C0C0E' : 'var(--surface)', color: ebitdaMode === id ? '#fff' : 'var(--text)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{l}</button>
                ))}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span>Reportado:</span><span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>{fmtM(ebitdaReported)}</span></div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span>Media (3 ej.):</span><span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>{fmtM(ebitdaMean)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)', borderRadius: 9, padding: '11px 14px', margin: '12px 0 20px' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>EBITDA usado:</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>{fmtM(ebitda)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Múltiplo</span>
                <button onClick={() => setMult(6.9)} style={{ fontSize: 12, fontWeight: 600, color: '#E8001D', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Usar sugerido</button>
              </div>
              <input type="range" className="val-slider" min="4" max="8" step="0.1" value={mult} onChange={e => setMult(+e.target.value)}
                style={{ width: '100%', background: `linear-gradient(90deg, #E8001D ${((mult - 4) / 4) * 100}%, var(--surface-2) ${((mult - 4) / 4) * 100}%)` }}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, marginBottom: 18 }}>
                <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>4x</span>
                <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>{fmtX(mult)}</span>
                <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>8x</span>
              </div>
            </div>
          </Card>

          {/* Enterprise Value */}
          <Card>
            <CardHead icon="euro" title="Enterprise Value" action={
              <button title="Descargar" style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}><path d="M12 3v12M7 11l5 4 5-4M5 21h14"/></svg>
              </button>
            }/>
            <div style={{ padding: 22 }}>
              {/* bar chart */}
              <div style={{ marginBottom: 18 }}>
                {scenarios.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ width: 38, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>{s.label}</span>
                    <div style={{ flex: 1, height: 26, background: 'var(--surface-2)', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: (s.ev / maxEV * 100) + '%', background: s.color, borderRadius: 6, transition: 'width .35s ease' }}/>
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginLeft: 48, marginTop: 2, fontSize: 10.5, color: 'var(--text-subtle)' }}>
                  <span>0M</span><span>30M</span><span>60M</span><span>90M</span><span>120M</span>
                </div>
              </div>
              {/* scenario cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {scenarios.map(s => (
                  <div key={s.id} style={{ border: `1.5px solid ${s.color}`, borderRadius: 11, padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>{fmtM(s.ev)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{fmtX(s.m)}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Resumen de Escenarios */}
        <Card style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Resumen de escenarios</span>
            <div style={{ flex: 1 }}></div>
            <button className="val-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 9, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 11l5 4 5-4M5 21h14"/></svg> Exportar
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Escenario', 'Múltiplo', 'Enterprise Value', 'Equity Value (aprox.)'].map((h, i) => (
                  <th key={h} style={{ textAlign: i === 0 ? 'left' : i === 3 ? 'right' : 'center', padding: '12px 22px', fontSize: 11.5, fontWeight: 600, letterSpacing: '.03em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s, i) => (
                <tr key={s.id} style={{ background: i === 1 ? 'var(--surface-2)' : 'transparent', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '14px 22px', fontSize: 13.5 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontWeight: 600, color: 'var(--text)' }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.color }}/>{s.label}
                    </span>
                  </td>
                  <td style={{ padding: '14px 22px', textAlign: 'center', fontSize: 13.5, fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{fmtX(s.m)}</td>
                  <td style={{ padding: '14px 22px', textAlign: 'center', fontSize: 13.5, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{fmtM(s.ev)}</td>
                  <td style={{ padding: '14px 22px', textAlign: 'right', fontSize: 13.5, color: 'var(--text-subtle)' }}>—</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '12px 22px', fontSize: 11.5, color: 'var(--text-subtle)', borderTop: '1px solid var(--border)' }}>
            Equity Value = Enterprise Value − deuda financiera neta. Deuda neta no disponible en la ficha → se muestra «—».
          </div>
        </Card>

        {/* Colapsables */}
        {[
          { open: benchOpen, set: setBenchOpen, icon: 'target', title: 'Benchmark vs. categoría (Hoteles y alojamientos)',
            body: (
              <div style={{ padding: '4px 22px 20px' }}>
                {[['Múltiplo EV/EBITDA mediano del sector', '6,9x'], ['Rango intercuartílico', '5,9x – 7,9x'], ['Margen EBITDA mediano', '18,4%'], ['Posición de la compañía', 'Cuartil superior · P88']].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{v}</span>
                  </div>
                ))}
              </div>
            ) },
          { open: methodOpen, set: setMethodOpen, icon: 'document', title: 'Ver metodología de valoración',
            body: (
              <div style={{ padding: '4px 22px 20px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65 }}>
                Esta valoración aplica el método de <strong style={{ color: 'var(--text)' }}>múltiplos comparables</strong> (EV/EBITDA) sobre una muestra de 1.002 compañías del sector. El múltiplo sugerido se ajusta por el posicionamiento de la compañía (Quality Score, margen y salud de balance) y por el tipo de comprador. Es una <strong style={{ color: 'var(--text)' }}>estimación orientativa</strong>, no una valoración formal: no sustituye a una due diligence ni a un informe de experto independiente.
              </div>
            ) },
        ].map((c, i) => (
          <Card key={i} style={{ marginBottom: 14 }}>
            <button onClick={() => c.set(!c.open)} className="val-collapse" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 22px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              <HIcon name={c.icon} size={17} color="#E8001D" sw={1.75}/>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text)' }}>{c.title}</span>
              <div style={{ flex: 1 }}></div>
              <span style={{ transform: c.open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', color: 'var(--text-muted)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </span>
            </button>
            {c.open && c.body}
          </Card>
        ))}

        {/* Footer meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '14px 18px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12.5, color: 'var(--text-muted)' }}>
          <span style={{ color: '#E8001D' }}>✦</span>
          Valoración generada el 18/06/2026, 15:54 — Motor valuation_v1.2 — Comprador {buyer} — EBITDA {ebitdaMode}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<VALApp/>);
