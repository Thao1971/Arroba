// Arroba — Company Entity: shell with section navigation

function CEApp() {
  const C = window.CP_DATA;
  const E = window.CE_DATA;
  const [section, setSection] = React.useState('resumen');
  const [saved, setSaved] = React.useState(false);
  const [following, setFollowing] = React.useState(false);
  const [dark, setDark] = React.useState(() => localStorage.getItem('arr-dark') === 'true');
  const [deal, setDeal] = React.useState('venta');

  React.useEffect(() => {
    if (dark) document.documentElement.setAttribute('data-dark', '');
    else document.documentElement.removeAttribute('data-dark');
    localStorage.setItem('arr-dark', dark);
  }, [dark]);

  React.useEffect(() => { window.scrollTo(0, 0); }, [section]);

  const groups = [...new Set(E.nav.map(n => n.group))];
  const cur = E.nav.find(n => n.id === section);

  const SECTIONS = {
    resumen: <SecResumen C={C} E={E} go={setSection}/>, finanzas: <SecFinanzas C={C} E={E}/>, valoracion: <SecValoracion C={C} go={setSection}/>,
    propiedad: <SecPropiedad C={C} E={E} go={setSection}/>, gobierno: <SecGobierno C={C} E={E}/>, mercado: <SecMercado C={C} E={E}/>,
    ranking: <SecRanking E={E} go={setSection}/>, comparativa: <SecComparativa C={C} E={E} go={setSection}/>,
    senales: <SecSenales C={C}/>, oportunidades: <SecOportunidades E={E}/>,
    registros: <SecRegistros E={E}/>, documentos: <SecDocumentos E={E}/>,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Global shell nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 300, background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid var(--border)', height: 72, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 22 }}>
        <a href="Home.html" style={{ display: 'flex' }}><img src="uploads/logo.png" alt="arroba" style={{ height: 55, filter: dark ? 'brightness(0) invert(1)' : 'none' }}/></a>
        <div style={{ display: 'flex', gap: 4 }}>
          {['Analiza', 'Valora', 'Compra/Vende'].map(l => (
            <a key={l} href="Universal Search.html" style={{ fontSize: 13.5, fontWeight: l === 'Analiza' ? 700 : 500, color: l === 'Analiza' ? 'var(--text)' : 'var(--text-muted)', padding: '7px 13px', borderRadius: 8, textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
        <div style={{ flex: 1 }}></div>
        <button onClick={() => setDark(!dark)} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>{dark ? '☀' : '◑'}</button>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>AM</div>
      </nav>

      {/* Company header */}
      <div style={{ borderBottom: deal !== 'none' ? 'none' : '1px solid var(--border)', background: 'var(--surface-2)' }}>
        <div style={{ maxWidth: 'min(1760px, 95vw)', margin: '0 auto', padding: '20px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, marginBottom: 14 }}>
            <a href="Universal Search.html" style={{ color: 'var(--text-subtle)', textDecoration: 'none' }}>Analizar</a>
            <span style={{ color: 'var(--text-subtle)' }}>/</span><span style={{ color: 'var(--text-subtle)' }}>Empresas</span>
            <span style={{ color: 'var(--text-subtle)' }}>/</span><span style={{ color: 'var(--text)', fontWeight: 600 }}>{C.company.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg,#0C0C0E,#2E2E2C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 900, color: '#E8001D', fontFamily: 'var(--font-display)' }}>CT</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: 23, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)', lineHeight: 1.05, whiteSpace: 'nowrap' }}>{C.company.name}</h1>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>· {C.company.comercial}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#1A8A4A', background: '#E8F5EE', padding: '3px 8px', borderRadius: 4, border: '1px solid #C2E8D0' }}><span style={{ color: '#E8001D', fontSize: 10 }}>✦</span> Verificada</span>
                  {C.company.audited && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface)', padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Auditada · {C.company.auditor}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-muted)' }}>
                  <span>{C.company.legal} · CIF {C.company.cif} · {C.company.sector} · {C.company.location.city} ({C.company.location.province})</span>
                  <a href={C.company.webFull} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#E8001D', textDecoration: 'none' }}><CPIcon name="link" size={13} color="#E8001D" sw={2}/> {C.company.web}</a>
                </div>
              </div>
            </div>
            {/* Secondary actions: Guardar · Seguir · Compartir */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button onClick={() => setSaved(!saved)} title="Guardar para revisar más adelante" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 9, border: `1.5px solid ${saved ? '#E8001D' : 'var(--border-strong)'}`, background: saved ? 'rgba(232,0,29,.06)' : 'var(--surface)', color: saved ? '#E8001D' : 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}><CPIcon name="watchlist" size={14} color={saved ? '#E8001D' : 'var(--text-muted)'} sw={2}/> {saved ? 'Guardada' : 'Guardar'}</button>
              <button onClick={() => setFollowing(!following)} title="Recibir alertas y novedades" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 9, border: `1.5px solid ${following ? '#E8001D' : 'var(--border-strong)'}`, background: following ? 'rgba(232,0,29,.06)' : 'var(--surface)', color: following ? '#E8001D' : 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}><CPIcon name="bell" size={14} color={following ? '#E8001D' : 'var(--text-muted)'} sw={2}/> {following ? 'Siguiendo' : 'Seguir'}</button>
              <button title="Compartir" style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9, border: '1px solid var(--border-strong)', background: 'var(--surface)', cursor: 'pointer' }}><CPIcon name="share" size={15} color="var(--text-muted)" sw={2}/></button>
            </div>
          </div>

          {/* Hero: opportunities detected + primary/strategic actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-subtle)', display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}><span style={{ color: '#E8001D' }}>✦</span> Oportunidades</span>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {E.oportunidades.map(o => (
                  <span key={o.type} onClick={() => setSection('oportunidades')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text)', background: 'var(--surface)', border: '1px solid var(--border)', padding: '5px 11px', borderRadius: 20, cursor: 'pointer', transition: 'border-color .12s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#E8001D'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <span style={{ color: '#E8001D', fontSize: 11 }}>✓</span> {o.type}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={() => setSection('oportunidades')} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 20px', borderRadius: 10, border: 'none', background: '#E8001D', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}><span>✦</span> Activar oportunidad</button>
              <button title="¿Eres propietario o representante de esta empresa?" onClick={() => setSection('resumen')} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 10, border: '1.5px solid #0C0C0E', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}><CPIcon name="verified" size={15} color="var(--text)" sw={2}/> Reclamar empresa</button>
            </div>
          </div>
        </div>
      </div>

      {/* Deal banner */}
      <DealBanner deal={deal}/>

      {/* Body: section nav + content + advisor */}
      <div style={{ maxWidth: 'min(1760px, 95vw)', margin: '0 auto', padding: '24px 28px 80px', display: 'grid', gridTemplateColumns: '210px minmax(0,1fr) 360px', gap: 32, alignItems: 'start' }}>
        {/* Section nav */}
        <nav style={{ position: 'sticky', top: 78 }}>
          {groups.map(g => (
            <div key={g} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 8, paddingLeft: 12 }}>{g}</div>
              {E.nav.filter(n => n.group === g).map(n => {
                const on = section === n.id;
                return (
                  <div key={n.id} className={`ce-navitem${on ? ' is-active' : ''}`} onClick={() => setSection(n.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 9, cursor: 'pointer', marginBottom: 1, transition: 'none', background: on ? 'rgba(232,0,29,.08)' : 'transparent' }}>
                    <CPIcon name={n.icon} size={15} color={on ? '#E8001D' : 'var(--text-subtle)'} sw={2}/>
                    <span style={{ fontSize: 13.5, fontWeight: on ? 700 : 500, color: on ? 'var(--text)' : 'var(--text-muted)' }}>{n.label}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Content */}
        <div style={{ minWidth: 0 }}>{SECTIONS[section]}</div>

        {/* Right column: Operación activa (sticky) — el composer transversal vive flotante */}
        <div style={{ position: 'sticky', top: 78, alignSelf: 'start', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 'calc(100vh - 96px)' }}>
          <CEDeal deal={deal} setDeal={setDeal} C={C} E={E} go={setSection}/>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<CEApp/>);
