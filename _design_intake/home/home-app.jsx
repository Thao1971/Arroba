// arroba.com — Public home assembly + top nav

function PublicNav() {
  const [dark, setDark] = React.useState(() => localStorage.getItem('arr-dark') === 'true');
  React.useEffect(() => {
    if (dark) document.documentElement.setAttribute('data-dark', '');
    else document.documentElement.removeAttribute('data-dark');
    localStorage.setItem('arr-dark', dark);
  }, [dark]);

  const links = ['Analiza', 'Valora', 'Compra/Vende'];
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 300,
      background: 'color-mix(in srgb, var(--bg) 88%, transparent)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      height: 64, display: 'flex', alignItems: 'center',
      padding: '0 max(32px, calc((100vw - 1320px) / 2))',
    }}>
      <a href="Home.html" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <img src="uploads/logo.png" alt="arroba" style={{ height: 55, filter: dark ? 'brightness(0) invert(1)' : 'none' }}/>
      </a>
      <div style={{ display: 'flex', gap: 4, marginLeft: 40 }}>
        {links.map(l => (
          <span key={l} style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', transition: 'all .12s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--surface-2)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
            {l}
          </span>
        ))}
      </div>
      <div style={{ flex: 1 }}></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => setDark(!dark)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontSize: 14 }}>{dark ? '☀' : '◑'}</button>
        <a href="Company Profile.html" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', padding: '9px 16px', cursor: 'pointer', textDecoration: 'none' }}>Iniciar sesión</a>
        <button style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: '#E8001D', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Crear cuenta</button>
      </div>
    </nav>
  );
}

function HomeApp() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }
        @keyframes ping { 75%,100%{ transform: scale(2.2); opacity: 0; } }
        * { box-sizing: border-box; transition: background-color .15s, border-color .12s, color .1s; }
        ::-webkit-scrollbar { width: 7px; }
        ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 4px; }
        input::placeholder { color: var(--text-subtle); }
      `}</style>

      <PublicNav/>

      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '32px 32px 60px' }}>

        {/* Top: Hero + Panorama */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 32, marginBottom: 32, minHeight: 420 }}>
          <Hero/>
          <Panorama/>
        </div>

        {/* 7 macro KPIs */}
        <div style={{ marginBottom: 32 }}>
          <MacroKpis/>
        </div>

        {/* Action CTAs — always present */}
        <div style={{ marginBottom: 32 }}>
          <ActionCTAs/>
        </div>

        {/* 3 columns: Analiza / Valora / Compra-Vende */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32, alignItems: 'start' }}>
          <TrendColumn/>
          <ValuationsColumn/>
          <ForSaleColumn/>
        </div>

        {/* Mapa empresarial — bottom split section */}
        <div style={{ marginBottom: 36 }}>
          <MapSection/>
        </div>

        {/* Footer sources */}
        <FooterSources/>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<HomeApp/>);
