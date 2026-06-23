// arroba.com — M&A Intelligence · app

function MAApp() {
  const D = window.MA_DATA;
  const [dark, setDark] = React.useState(() => localStorage.getItem('arr-dark') === 'true');
  const [query, setQuery] = React.useState('');
  const [focus, setFocus] = React.useState(false);

  React.useEffect(() => {
    if (dark) document.documentElement.setAttribute('data-dark', '');
    else document.documentElement.removeAttribute('data-dark');
    localStorage.setItem('arr-dark', dark);
  }, [dark]);

  const go = () => { window.location.href = 'Universal Search.html'; };

  const TAG = {
    acq:  { c: '#2164E3', bg: '#E8EFFE', bd: '#C0D3FA' },
    sale: { c: '#1A8A4A', bg: '#E8F5EE', bd: '#C2E8D0' },
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <style>{`
        * { transition: background-color .15s, border-color .12s, color .1s; }
        input::placeholder { color: var(--text-subtle); }
        .ma-chip:hover { border-color: var(--border-strong) !important; transform: translateY(-1px); }
        .ma-opp:hover { border-color: #E8001D !important; transform: translateY(-2px); }
        .ma-row:hover { background: var(--surface-2) !important; }
        @media (max-width: 880px) {
          .ma-kpis, .ma-opps, .ma-panels { grid-template-columns: 1fr !important; }
          .ma-nav-links { display: none !important; }
        }
      `}</style>

      {/* ── Top nav ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 300, background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid var(--border)', height: 72, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 28 }}>
        <a href="Home.html" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="uploads/logo.png" alt="arroba" style={{ height: 55, filter: dark ? 'brightness(0) invert(1)' : 'none' }}/>
        </a>
        <div className="ma-nav-links" style={{ display: 'flex', gap: 4 }}>
          {[['Analiza', 'Analiza.html'], ['Valora', 'Valora.html'], ['Compra/Vende', 'Compra-Vende.html']].map(([l, href]) => (
            <a key={l} href={href} style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', padding: '7px 14px', borderRadius: 8, textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
        <div style={{ flex: 1 }}></div>
        <button title="Ayuda" style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>?</button>
        <button onClick={() => setDark(!dark)} title="Tema" style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {dark ? '☀' : '◑'}
        </button>
        <button title="Notificaciones" style={{ position: 'relative', width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>
          <span style={{ position: 'absolute', top: 6, right: 7, width: 7, height: 7, borderRadius: '50%', background: '#E8001D', border: '1.5px solid var(--bg)' }}></span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', paddingLeft: 4 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#A8C03E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#0C0C0E' }}>D</div>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>Hola, Daniel</span>
          <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>▾</span>
        </div>
      </nav>

      <div style={{ maxWidth: 1020, margin: '0 auto', padding: '0 28px 64px' }}>

        {/* ── HERO ── */}
        <div style={{ textAlign: 'center', paddingTop: 56, marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: 26 }}>
            <span style={{ color: '#E8001D', fontSize: 12 }}>✦</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)' }}>M&A Intelligence · España</span>
          </div>
          <h1 style={{ fontSize: 'clamp(34px, 5vw, 50px)', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-.025em', lineHeight: 1.08, marginBottom: 18 }}>
            Hola, <span style={{ color: '#E8001D' }}>{D.user}</span><br/>¿Qué operación quieres entender?
          </h1>
          <p style={{ fontSize: 16.5, color: 'var(--text-muted)', lineHeight: 1.55, maxWidth: 600, margin: '0 auto' }}>
            Sigue las operaciones de compraventa, los múltiplos pagados y los compradores activos en España. Entiende cómo se mueve el mercado transaccional en cada sector.
          </p>
        </div>

        {/* ── BUSCADOR ── */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 8px 8px 20px', background: 'var(--surface)', border: `1.5px solid ${focus ? '#E8001D' : 'var(--border-strong)'}`, borderRadius: 16, boxShadow: focus ? '0 6px 28px rgba(232,0,29,.12)' : '0 6px 28px rgba(12,12,14,.06)' }}>
            <HIcon name="search" size={21} color="var(--text-subtle)" sw={2}/>
            <input value={query} onChange={e => setQuery(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
              onKeyDown={e => { if (e.key === 'Enter') go(); }}
              placeholder="Buscar operaciones, compradores o múltiplos por sector…"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 16.5, color: 'var(--text)', padding: '15px 0', fontFamily: 'var(--font-body)' }}/>
            <button onClick={go} style={{ padding: '14px 28px', borderRadius: 12, border: 'none', background: '#E8001D', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>Explorar</button>
          </div>
        </div>

        {/* Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, justifyContent: 'center', marginBottom: 22 }}>
          {D.chips.map(c => (
            <button key={c.label} className="ma-chip" onClick={go} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 15px', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text)', transition: 'border-color .12s, transform .12s' }}>
              <HIcon name={c.icon} size={14} color="var(--text-subtle)" sw={1.75}/> {c.label}
            </button>
          ))}
        </div>

        {/* Últimas búsquedas */}
        <div style={{ marginBottom: 44 }}>
          <div style={{ fontSize: 13, color: 'var(--text-subtle)', marginBottom: 11, paddingLeft: 2 }}>Tus últimas búsquedas</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
            {D.recent.map(r => (
              <button key={r} className="ma-chip" onClick={go} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 15px', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', transition: 'border-color .12s, transform .12s' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-subtle)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 106 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* ── KPIs ── */}
        <div className="ma-kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 18 }}>
          {D.kpis.map(k => (
            <div key={k.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#E8F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <HIcon name={k.icon} size={23} color="#1A8A4A" sw={1.75}/>
                </div>
                <div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.05, letterSpacing: '-.02em' }}>{k.value}</div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text)', marginTop: 4 }}>{k.label}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-subtle)' }}>{k.sub}</div>
                </div>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#1A8A4A', background: '#E8F5EE', padding: '5px 11px', borderRadius: 7 }}>
                <span style={{ fontSize: 11 }}>↑</span> {k.delta} vs. año anterior
              </span>
            </div>
          ))}
        </div>

        {/* ── OPORTUNIDADES ── */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '22px 24px', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
            <span style={{ color: '#E8001D', fontSize: 15, marginRight: 9 }}>✦</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Oportunidades detectadas</span>
            <a href="Universal Search.html" style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, color: '#E8001D', textDecoration: 'none' }}>Ver todas →</a>
          </div>
          <div className="ma-opps" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
            {D.opportunities.map((o, i) => (
              <a key={o.title} href="Universal Search.html" className="ma-opp" style={{ display: 'block', textDecoration: 'none', padding: '4px 18px', borderLeft: i ? '1px solid var(--border)' : 'none', borderRadius: 8, transition: 'border-color .12s' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: o.bg, border: `1px solid ${o.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <HIcon name={o.icon} size={18} color={o.tint} sw={1.75}/>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, marginBottom: 6 }}>{o.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)', lineHeight: 1.45 }}>{o.desc}</div>
              </a>
            ))}
          </div>
        </div>

        {/* ── PANELES ── */}
        <div className="ma-panels" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Sectores con más actividad M&A */}
          <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
              <HIcon name="chartBar" size={17} color="#E8001D" sw={1.75}/>
              <span style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', marginLeft: 9 }}>Sectores con más actividad M&amp;A</span>
              <a href="Ficha Sectorial.html" style={{ marginLeft: 'auto', fontSize: 12.5, fontWeight: 600, color: '#E8001D', textDecoration: 'none', whiteSpace: 'nowrap' }}>Ver todos →</a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--text-subtle)', paddingBottom: 10, borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
              <span>Sector</span>
              <span>Operaciones (12m)</span>
            </div>
            {D.sectors.map((s, i) => (
              <a key={s.name} href="Ficha Sectorial.html" className="ma-row" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 8px', margin: '0 -8px', borderRadius: 9, textDecoration: 'none', transition: 'background .12s' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: i === 0 ? '#E8001D' : 'var(--text-subtle)', width: 14, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{s.name}</span>
                <div style={{ width: 96, height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: s.value + '%', background: '#1A8A4A', borderRadius: 3 }}/>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', width: 32, textAlign: 'right' }}>{s.ops}</span>
              </a>
            ))}
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', lineHeight: 1.5, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              Número de operaciones de compraventa registradas por sector en los últimos 12 meses.
            </div>
          </div>

          {/* Últimas operaciones M&A */}
          <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
              <HIcon name="handshake" size={16} color="#E8001D" sw={1.75}/>
              <span style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', marginLeft: 9 }}>Últimas operaciones</span>
              <a href="Mis Oportunidades.html" style={{ marginLeft: 'auto', fontSize: 12.5, fontWeight: 600, color: '#E8001D', textDecoration: 'none', whiteSpace: 'nowrap' }}>Ver todas →</a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--text-subtle)', paddingBottom: 10, borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
              <span>Operación</span>
              <span>Múltiplo</span>
            </div>
            {D.deals.map(c => {
              const t = TAG[c.kind];
              return (
                <a key={c.name} href="Oportunidad.html" className="ma-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', margin: '0 -8px', borderRadius: 9, textDecoration: 'none', transition: 'background .12s' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', flexShrink: 0 }}>{c.initial}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: t.c, background: t.bg, border: `1px solid ${t.bd}`, padding: '1px 6px', borderRadius: 4 }}>{c.type}</span> {c.value}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#E8001D', fontVariantNumeric: 'tabular-nums' }}>{c.mult}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-subtle)' }}>{c.when}</div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 36, fontSize: 12.5, color: 'var(--text-muted)' }}>
          <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#1A8A4A', animation: 'maLive 1.8s ease-out infinite' }}></span>
            <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: '#1A8A4A' }}></span>
          </span>
          <span><strong style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{D.footerCount}</strong> operaciones con inteligencia activa y múltiplos comparables de mercado</span>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<MAApp/>);
