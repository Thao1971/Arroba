// arroba.com — Ficha sectorial app (public nav like Home)

function SectorNav() {
  const [dark, setDark] = React.useState(() => localStorage.getItem('arr-dark') === 'true');
  React.useEffect(() => {
    if (dark) document.documentElement.setAttribute('data-dark', '');
    else document.documentElement.removeAttribute('data-dark');
    localStorage.setItem('arr-dark', dark);
  }, [dark]);
  const links = ['Analiza', 'Valora', 'Compra/Vende'];
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 300, background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', height: 64, display: 'flex', alignItems: 'center', padding: '0 max(32px, calc((100vw - 1320px) / 2))' }}>
      <a href="Home.html" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <img src="uploads/logo.png" alt="arroba" style={{ height: 55, filter: dark ? 'brightness(0) invert(1)' : 'none' }}/>
      </a>
      <div style={{ display: 'flex', gap: 4, marginLeft: 40 }}>
        {links.map(l => {
          const active = l === 'Analiza';
          return (
            <span key={l} style={{ fontSize: 14, fontWeight: active ? 700 : 500, color: active ? '#E8001D' : 'var(--text-muted)', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', transition: 'all .12s' }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--surface-2)'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; } }}>{l}</span>
          );
        })}
      </div>
      <div style={{ flex: 1, maxWidth: 440, margin: '0 24px', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'var(--surface)', border: '1.5px solid var(--border-strong)', borderRadius: 10, cursor: 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#E8001D'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}>
        <span style={{ fontSize: 15, color: '#E8001D' }}>✦</span>
        <span style={{ fontSize: 13, color: 'var(--text-subtle)', flex: 1 }}>Busca sectores, empresas, territorios...</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-subtle)', background: 'var(--surface-2)', padding: '2px 7px', borderRadius: 4, border: '1px solid var(--border)' }}>⌘K</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={() => setDark(!dark)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontSize: 14 }}>{dark ? '☀' : '◑'}</button>
        <a href="Company Profile.html" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', padding: '9px 16px', textDecoration: 'none' }}>Iniciar sesión</a>
        <button style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: '#E8001D', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Crear cuenta</button>
      </div>
    </nav>
  );
}

function SectorApp() {
  const [tab, setTab] = React.useState('resumen');
  React.useEffect(() => { window.__sectorSetTab = setTab; }, []);
  const TABS = [
    ['resumen', 'Resumen'],
    ['empresas', 'Empresas'],
    ['analisis', 'Análisis'],
    ['graficos', 'Magnitudes sectoriales'],
  ];
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <style>{`
        @keyframes secbounce { 0%,100%{transform:translateY(0);opacity:.5} 50%{transform:translateY(-4px);opacity:1} }
        * { box-sizing: border-box; transition: background-color .15s, border-color .15s, color .1s; }
        button { transition: background-color .15s, border-color .15s, box-shadow .15s; }
        ::-webkit-scrollbar { width: 7px; height: 7px; } ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 4px; }
        input::placeholder { color: rgba(255,255,255,.4); }
        @media (max-width: 920px) {
          .sec-graf-grid { grid-template-columns: 1fr 1fr !important; }
          .sec-graf-2col, .sec-an-2col { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 620px) {
          .sec-graf-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <SectorNav/>

      <div style={{ padding: '28px 32px 60px', maxWidth: 1320, margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
          <span style={{ fontSize: 12, color: 'var(--text-subtle)', cursor: 'pointer' }}>Analiza</span>
          <span style={{ color: 'var(--text-subtle)', fontSize: 11 }}>/</span>
          <span style={{ fontSize: 12, color: 'var(--text-subtle)', cursor: 'pointer' }}>Sectores</span>
          <span style={{ color: 'var(--text-subtle)', fontSize: 11 }}>/</span>
          <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>Información y Comunicaciones</span>
        </div>

        {/* Header + KPIs always visible */}
        <SectorHeader/>
        <SectorKpis/>

        {/* Sub-menu tabs */}
        <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', marginBottom: 24, position: 'sticky', top: 64, background: 'var(--bg)', zIndex: 90 }}>
          {TABS.map(([id, label]) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '12px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
                fontSize: 14, fontWeight: active ? 700 : 500,
                color: active ? '#E8001D' : 'var(--text-muted)',
                borderBottom: `2px solid ${active ? '#E8001D' : 'transparent'}`,
                marginBottom: -1, fontFamily: 'var(--font-body)',
              }}>
                {id === 'ia' && <span style={{ fontSize: 13, color: active ? '#E8001D' : 'var(--text-subtle)' }}>✦</span>}
                {label}
              </button>
            );
          })}
        </div>

        {/* ── RESUMEN ── */}
        {tab === 'resumen' && (
          <div>
            <SectorAISummary/>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16, alignItems: 'start' }}>
              <SectorEvolutionCard/>
              <SectorGeoCard/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 16, marginBottom: 16, alignItems: 'start' }}>
              <SectorLeadersCard/>
              <SubsectorsCard/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: 16, marginBottom: 16, alignItems: 'start' }}>
              <MARadarCard/>
              <ProcurementCard/>
              <FeaturedCard/>
            </div>
            <SignalsCard/>
          </div>
        )}

        {/* ── EMPRESAS ── */}
        {tab === 'empresas' && <EmpresasTab/>}

        {/* ── ANÁLISIS ── */}
        {tab === 'analisis' && <AnalisisTab/>}

        {/* ── GRÁFICOS ── */}
        {tab === 'graficos' && <GraficosTab/>}
      </div>

      {/* arroba copilot — transversal a todas las secciones */}
      <CopilotDock/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<SectorApp/>);
