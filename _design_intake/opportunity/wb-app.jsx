// arroba.com — Workbench Engine V3 · shell con layout universal (Left 20% · Workspace 60% · Copilot 20%)

function WBApp() {
  const D = window.WB_DATA;
  const [dark, setDark] = React.useState(() => localStorage.getItem('arr-dark') === 'true');
  const [mode, setMode] = React.useState('activo');          // activo | tranquilo
  const [openId, setOpenId] = React.useState('pr-dd');
  const [railActive, setRailActive] = React.useState('atencion');

  React.useEffect(() => {
    if (dark) document.documentElement.setAttribute('data-dark', '');
    else document.documentElement.removeAttribute('data-dark');
    localStorage.setItem('arr-dark', dark);
  }, [dark]);

  const hour = new Date().getHours();
  const greeting = hour < 13 ? 'Buenos días' : hour < 21 ? 'Buenas tardes' : 'Buenas noches';
  const b = D.briefing;
  const ordered = [...D.priorities].sort((a, z) => (a.priority === 'alta' ? 0 : 1) - (z.priority === 'alta' ? 0 : 1));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* ── Nav superior fija ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 300, background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid var(--border)', height: 56, display: 'flex', alignItems: 'center', padding: '0 22px', gap: 20 }}>
        <a href="Home.html" style={{ display: 'flex' }}><img src="uploads/logo.png" alt="arroba" style={{ height: 55, filter: dark ? 'brightness(0) invert(1)' : 'none' }}/></a>
        <div style={{ display: 'flex', gap: 4 }} className="wb-nav">
          {['Analiza', 'Valora', 'Compra/Vende'].map(l => (
            <a key={l} href="Universal Search.html" style={{ fontSize: 13.5, fontWeight: l === 'Compra/Vende' ? 700 : 500, color: l === 'Compra/Vende' ? 'var(--text)' : 'var(--text-muted)', padding: '7px 13px', borderRadius: 8, textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
        <div style={{ flex: 1 }}></div>
        {/* ⌘K buscador universal */}
        <button className="wb-cmdk" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, height: 34, padding: '0 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-subtle)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12.5 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>
          Buscar
          <span style={{ fontSize: 11, fontWeight: 600, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 5, padding: '1px 6px' }}>⌘K</span>
        </button>
        {/* 🔔 notificaciones */}
        <button title="Notificaciones" style={{ position: 'relative', width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <OPIcon name="bell" size={16} color="var(--text-muted)"/>
          <span style={{ position: 'absolute', top: 6, right: 7, width: 7, height: 7, borderRadius: '50%', background: '#E8001D', border: '1.5px solid var(--bg)' }}></span>
        </button>
        {/* ✦ Copilot */}
        <button title="Arroba Copilot" style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: '#0C0C0E', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 800 }}>✦</button>
        <button onClick={() => setDark(!dark)} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>{dark ? '☀' : '◑'}</button>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>AM</div>
      </nav>

      {/* ── Layout universal de 3 columnas ── */}
      <div className="wb-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(190px, 1fr) minmax(0, 3fr) minmax(220px, 1fr)', gap: 26, maxWidth: 1480, margin: '0 auto', padding: '22px 24px 80px', alignItems: 'start' }}>
        <LeftRail active={railActive} setActive={setRailActive}/>

        {/* WORKSPACE central */}
        <main style={{ minWidth: 0 }}>
          {/* Bienvenida del Copilot */}
          <div style={{ marginBottom: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
              <h1 style={{ fontSize: 27, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', letterSpacing: '-.02em' }}>{greeting}, {D.user}.</h1>
              <div style={{ display: 'inline-flex', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 9, padding: 3 }}>
                {[['activo', 'Con procesos'], ['tranquilo', 'Día tranquilo']].map(([id, l]) => (
                  <button key={id} onClick={() => setMode(id)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: mode === id ? 'var(--surface)' : 'transparent', color: mode === id ? 'var(--text)' : 'var(--text-muted)', fontSize: 12, fontWeight: mode === id ? 700 : 500, cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: mode === id ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 15, color: '#E8001D', fontWeight: 700, marginTop: 2 }}>✦</span>
              <p style={{ fontSize: 15.5, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                Mientras estabas fuera, arroba siguió trabajando. He detectado <strong style={{ color: 'var(--text)' }}>{b.nuevasOportunidades} nuevas oportunidades</strong>, <strong style={{ color: 'var(--text)' }}>{b.senales} señales relevantes</strong> y <strong style={{ color: 'var(--text)' }}>{b.compradores} comprador compatible</strong>.
                {mode === 'activo' && <span> Hay <strong style={{ color: '#E8001D' }}>trabajo que requiere tu atención</strong>.</span>}
              </p>
            </div>
          </div>

          {/* Modo tranquilo */}
          {mode === 'tranquilo' && (
            <div style={{ background: 'linear-gradient(135deg, #0C0C0E, #1A1A18)', borderRadius: 16, padding: '24px 26px', marginBottom: 30, position: 'relative', overflow: 'hidden' }}>
              <span style={{ position: 'absolute', right: -10, top: -28, fontSize: 140, color: 'rgba(232,0,29,.08)', fontWeight: 800, lineHeight: 1, pointerEvents: 'none' }}>✦</span>
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.55)', marginBottom: 14 }}>No hay procesos que requieran tu atención inmediata. Esto es lo que he preparado:</div>
                <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', marginBottom: 18 }}>
                  {[[b.nuevasOportunidades, 'nuevas oportunidades'], [b.senales, 'señales relevantes'], [b.compradores, 'comprador compatible']].map(([n, l], i) => (
                    <div key={i}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{n}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginTop: 4 }}>{l}</div>
                    </div>
                  ))}
                </div>
                <PrimaryBtn>Revisar lo nuevo</PrimaryBtn>
              </div>
            </div>
          )}

          {/* Prioridades */}
          {mode === 'activo' && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Requiere tu atención</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#E8001D', background: 'rgba(232,0,29,.08)', padding: '2px 8px', borderRadius: 10, fontVariantNumeric: 'tabular-nums' }}>{ordered.filter(p => p.priority === 'alta').length} urgentes</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {ordered.map(p => (
                  <PriorityCard key={p.id} p={p} open={openId === p.id} onToggle={() => setOpenId(openId === p.id ? null : p.id)}/>
                ))}
              </div>
            </div>
          )}

          {/* Oportunidades activas */}
          <div style={{ marginBottom: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Oportunidades activas</span>
              <a href="Universal Search.html" style={{ fontSize: 12.5, fontWeight: 600, color: '#E8001D', textDecoration: 'none' }}>Ver todas →</a>
            </div>
            <div className="wb-oppgrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {D.opportunities.map(o => <OppWorkCard key={o.id} o={o}/>)}
            </div>
          </div>

          {/* Señales y recomendaciones */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Señales y recomendaciones</span>
              <Sparkle/>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '6px 16px 8px' }}>
              {D.feed.map((f, i) => <FeedRow key={i} f={f}/>)}
            </div>
          </div>
        </main>

        <CopilotRail/>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<WBApp/>);
