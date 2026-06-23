// Arroba — Company Profile app shell

const NAV_ITEMS = [
  { id: 'analiza',     label: 'Analiza',      icon: 'search',   sub: ['Mercados','Búsqueda','Señales','Explorador'] },
  { id: 'valora',      label: 'Valora',       icon: 'euro',     sub: ['Múltiplos','DCF','Comparables','Informes'] },
  { id: 'compravende', label: 'Compra/Vende', icon: 'deal',     sub: ['Matching','Oportunidades','Workflows','Dataroom'] },
];

const SAVED = ['Sector Madtech España', 'Agencias <5M€ EBITDA+', 'Madrid Highgrowth'];
const BREADCRUMB = ['Analiza', 'Búsqueda', 'Creativa Estratégica'];

/* ── Sidebar ───────────────────────────────────────────────── */
function Sidebar({ open, onToggle, activeNav, setActiveNav, dark, setDark }) {
  const [expanded, setExpanded] = React.useState('analiza');
  return (
    <aside style={{
      width: open ? 220 : 0, flexShrink: 0,
      position: 'fixed', top: 0, left: 0, bottom: 0,
      background: '#0C0C0E', display: 'flex', flexDirection: 'column',
      borderRight: open ? '1px solid rgba(255,255,255,.06)' : 'none',
      zIndex: 200, overflowX: 'hidden', overflowY: open ? 'auto' : 'hidden',
      transition: 'width .22s cubic-bezier(.4,0,.2,1)',
    }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 220 }}>
          <img src="uploads/logo.png" alt="Arroba" style={{ height: 22, display: 'block', filter: 'brightness(0) invert(1)', opacity: .9 }}/>
          <button onClick={onToggle} style={{
            width: 26, height: 26, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,.07)',
            color: 'rgba(255,255,255,.45)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>←</button>
        </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0', minWidth: 220 }}>
        {NAV_ITEMS.map(item => {
          const isActive = activeNav === item.id;
          const isExp = expanded === item.id;
          return (
            <div key={item.id}>
              <div onClick={() => { setActiveNav(item.id); setExpanded(isExp ? null : item.id); }} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 20px', cursor: 'pointer',
                background: isActive ? 'rgba(232,0,29,.15)' : 'transparent',
                borderLeft: `2px solid ${isActive ? '#E8001D' : 'transparent'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: isActive ? '#E8001D' : 'rgba(255,255,255,.3)', display: 'flex' }}>
                    <CPIcon name={item.icon} size={15} color={isActive ? '#E8001D' : 'rgba(255,255,255,.3)'} sw={2}/>
                  </span>
                  <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? '#fff' : 'rgba(255,255,255,.5)', fontFamily: 'Space Grotesk, sans-serif' }}>
                    {item.label}
                  </span>
                </div>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,.2)', transform: isExp ? 'rotate(90deg)' : '', transition: 'transform .15s' }}>▶</span>
              </div>
              {isExp && (
                <div style={{ background: 'rgba(0,0,0,.2)', paddingBottom: 4 }}>
                  {item.sub.map(s => (
                    <div key={s} style={{ padding: '6px 20px 6px 44px', fontSize: 12, color: s === 'Búsqueda' ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.35)', cursor: 'pointer', fontWeight: s === 'Búsqueda' ? 600 : 400 }}>{s}</div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div style={{ padding: '18px 20px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.2)' }}>Guardadas</div>
        {SAVED.map(s => (
          <div key={s} style={{ padding: '6px 20px', fontSize: 11, color: 'rgba(255,255,255,.35)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#E8001D', fontSize: 9 }}>✦</span> {s}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,.06)', minWidth: 220 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>AM</div>
          <div><div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.7)' }}>Ana Martínez</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>Profesional</div></div>
        </div>
        <div onClick={() => setDark(!dark)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 10px', borderRadius: 6, background: 'rgba(255,255,255,.05)' }}>
          <span style={{ fontSize: 12 }}>{dark ? '☀' : '◑'}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{dark ? 'Light' : 'Dark'}</span>
        </div>
      </div>
    </aside>
  );
}

/* ── App ───────────────────────────────────────────────────── */
function CPApp() {
  const { company, financials, kpis, scores, valuation, signals, ownership, comparables, buyers } = window.CP_DATA;
  const [activeNav, setActiveNav] = React.useState('analiza');
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [dark, setDark] = React.useState(() => localStorage.getItem('arr-dark') === 'true');

  React.useEffect(() => {
    if (dark) document.documentElement.setAttribute('data-dark', '');
    else document.documentElement.removeAttribute('data-dark');
    localStorage.setItem('arr-dark', dark);
  }, [dark]);

  const sW = sidebarOpen ? 220 : 0;

  // ── Decision journey scroll tracking ──
  const analizarRef = React.useRef(null);
  const valorarRef = React.useRef(null);
  const transaccionarRef = React.useRef(null);
  const [activePhase, setActivePhase] = React.useState('analizar');

  const jumpTo = (id) => {
    const ref = id === 'analizar' ? analizarRef : id === 'valorar' ? valorarRef : transaccionarRef;
    const top = ref.current?.getBoundingClientRect().top + window.scrollY - 150;
    window.scrollTo(0, top);
  };

  React.useEffect(() => {
    const onScroll = () => {
      const refs = [['analizar', analizarRef], ['valorar', valorarRef], ['transaccionar', transaccionarRef]];
      const y = window.scrollY + 200;
      let current = 'analizar';
      for (const [id, ref] of refs) {
        if (ref.current && ref.current.getBoundingClientRect().top + window.scrollY <= y) current = id;
      }
      setActivePhase(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0);opacity:.5} 50%{transform:translateY(-4px);opacity:1} }
        * { box-sizing: border-box; transition: background-color .15s, border-color .15s, color .1s; }
        button, input { transition: background-color .15s, border-color .15s, box-shadow .15s; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 3px; }
      `}</style>

      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} activeNav={activeNav} setActiveNav={setActiveNav} dark={dark} setDark={setDark}/>

      {/* Main area — shifts with sidebar */}
      <div style={{ marginLeft: sW, transition: 'margin-left .22s cubic-bezier(.4,0,.2,1)', minHeight: '100vh' }}>

        {/* ── Top bar: search bounded by shell ── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'var(--bg)', borderBottom: '1px solid var(--border)',
          padding: '0 24px', height: 54,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {/* Sidebar open toggle */}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer',
            fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>≡</button>

          {/* Logo when sidebar is closed */}
          {!sidebarOpen && (
            <img src="uploads/logo.png" alt="Arroba" style={{ height: 20, display: 'block', flexShrink: 0 }}/>
          )}

          {/* Universal AI search — fills available width */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px',
            background: 'var(--surface)', border: '1.5px solid var(--border-strong)', borderRadius: 10,
            cursor: 'pointer', boxShadow: '0 1px 6px rgba(12,12,14,.06)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#E8001D'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,0,29,.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = '0 1px 6px rgba(12,12,14,.06)'; }}
          >
            <span style={{ fontSize: 15, color: '#E8001D', flexShrink: 0 }}>✦</span>
            <span style={{ fontSize: 13, color: 'var(--text-subtle)', flex: 1 }}>Busca compañías, mercados, señales, oportunidades...</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-subtle)', background: 'var(--surface-2)', padding: '2px 7px', borderRadius: 4, border: '1px solid var(--border)' }}>⌘K</span>
          </div>
        </div>

        {/* ── Breadcrumb ── */}
        <div style={{
          position: 'sticky', top: 54, zIndex: 99,
          background: 'var(--bg)', borderBottom: '1px solid var(--border)',
          padding: '0 32px', height: 38,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {BREADCRUMB.map((b, i) => (
            <React.Fragment key={b}>
              {i > 0 && <span style={{ color: 'var(--text-subtle)', fontSize: 11 }}>/</span>}
              <span style={{ fontSize: 12, color: i === BREADCRUMB.length - 1 ? 'var(--text)' : 'var(--text-subtle)', fontWeight: i === BREADCRUMB.length - 1 ? 600 : 400, cursor: i < BREADCRUMB.length - 1 ? 'pointer' : 'default' }}>{b}</span>
            </React.Fragment>
          ))}
        </div>

        {/* ── Phase ribbon: ANALIZAR → VALORAR → TRANSACCIONAR ── */}
        <PhaseRibbon active={activePhase} onJump={jumpTo}/>

        {/* ── Content: the decision journey ── */}
        <div style={{ padding: '24px 32px 100px', maxWidth: 1300, margin: '0 auto' }}>

          {/* ═══ 01 · ANALIZAR ═══ */}
          <div ref={analizarRef} style={{ scrollMarginTop: 140 }}>
            <PhaseHeader n="01" label="Analizar" desc="Entender qué es esta compañía"/>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
                <CompanyHeader company={company}/>
                <KPIStrip kpis={kpis}/>
                <FinancialsSection data={financials}/>
                <SignalTimeline signals={signals}/>
                <OwnershipSection ownership={ownership}/>
                <ComparablesSection comparables={comparables}/>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <ScoresPanel scores={scores} company={company} financials={financials}/>
              </div>
            </div>
          </div>

          {/* ═══ Transition ① — Analizar → Valorar ═══ */}
          <div style={{ margin: '36px 0' }}>
            <TransitionToValorar company={company} valuation={valuation} onContinue={() => jumpTo('valorar')}/>
          </div>

          {/* ═══ 02 · VALORAR ═══ */}
          <div ref={valorarRef} style={{ scrollMarginTop: 140 }}>
            <PhaseHeader n="02" label="Valorar" desc="Convertir el análisis en un precio"/>
            <ValorarPhase valuation={valuation}/>
          </div>

          {/* ═══ Transition ② — Valorar → Transaccionar ═══ */}
          <div style={{ margin: '36px 0' }}>
            <TransitionToTransaccionar company={company} valuation={valuation} buyers={buyers} onContinue={() => jumpTo('transaccionar')}/>
          </div>

          {/* ═══ 03 · TRANSACCIONAR ═══ */}
          <div ref={transaccionarRef} style={{ scrollMarginTop: 140 }}>
            <PhaseHeader n="03" label="Transaccionar" desc="El paso lógico tras el análisis"/>
            <TransaccionarPhase company={company} buyers={buyers}/>
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<CPApp/>);
