// arroba.com — Universal Search right rail + app

/* ══ RIGHT RAIL — registered: actions ══════════════════════ */
function ActionRail() {
  const D = window.US_DATA;
  const nba = D.nextBestAction;
  const recOpp = D.opportunities.find(o => o.recommended) || D.opportunities[0];
  const actorStep = recOpp.canvas.actors ? recOpp.canvas.actors.label : 'Actores';
  const quick = [
    { icon: 'layers', label: 'Crear shortlist',     sub: 'Las 3 mejores' },
    { icon: 'euro',   label: 'Valorar',              sub: 'Rango de valor' },
    { icon: 'deal',   label: 'Buscar actores',       sub: 'Empresas que encajan' },
  ];
  const timeline = ['Diagnóstico', 'Activar oportunidad', 'Valoración', actorStep, 'Oferta', 'Due Diligence', 'Cierre'];
  const currentStep = 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 88 }}>

      {/* Next best action + dominant CTA */}
      <div style={{ background: 'linear-gradient(135deg, #0C0C0E, #1A1A18)', borderRadius: 14, padding: 20, position: 'relative', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', right: -8, top: -22, fontSize: 100, color: 'rgba(232,0,29,.08)', fontWeight: 800, lineHeight: 1, pointerEvents: 'none' }}>✦</span>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 10, position: 'relative' }}>Siguiente mejor acción</div>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1.35, marginBottom: 14, position: 'relative' }}>{nba.action}</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, position: 'relative' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.7)' }}>Confianza <strong style={{ color: '#fff' }}>{nba.confidence}</strong></span>
          <span style={{ color: 'rgba(255,255,255,.3)' }}>·</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.7)' }}>Impacto <strong style={{ color: '#fff' }}>{nba.impact}</strong></span>
        </div>
        <button style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: '#E8001D', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, position: 'relative' }}>
          <span>✦</span> Activar oportunidad
        </button>
      </div>

      {/* Execution timeline */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 16 }}>Camino recomendado</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {timeline.map((step, i) => {
            const done = i === 0, current = i === currentStep;
            return (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', paddingBottom: i < timeline.length - 1 ? 14 : 0 }}>
                {i < timeline.length - 1 && <div style={{ position: 'absolute', left: 9, top: 18, bottom: 0, width: 2, background: done ? '#E8001D' : 'var(--border)' }}></div>}
                <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                  background: done ? '#E8001D' : current ? 'var(--surface)' : 'var(--surface-2)',
                  border: `2px solid ${done || current ? '#E8001D' : 'var(--border-strong)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 700 }}>
                  {done ? '✓' : ''}
                </div>
                <span style={{ fontSize: 13, fontWeight: current ? 700 : 500, color: done || current ? 'var(--text)' : 'var(--text-subtle)' }}>{step}</span>
                {current && <span style={{ fontSize: 10, fontWeight: 600, color: '#E8001D', background: 'rgba(232,0,29,.08)', padding: '2px 7px', borderRadius: 10, marginLeft: 'auto' }}>Aquí</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 14 }}>Acciones rápidas</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {quick.map(a => (
            <button key={a.label} style={{
              display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', width: '100%',
              border: '1px solid var(--border)', background: 'var(--surface)', fontFamily: 'var(--font-body)', transition: 'border-color .12s, transform .1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#E8001D'; e.currentTarget.style.transform = 'translateX(2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = ''; }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <HIcon name={a.icon} size={14} color="#E8001D" sw={1.75}/>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>{a.label}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}>{a.sub}</div>
              </div>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-subtle)', lineHeight: 1.5 }}>
          Teaser, cuaderno de venta y Data Room se generan al activar la oportunidad.
        </div>
      </div>
    </div>
  );
}

/* ══ RIGHT RAIL — guest: register prompt ═══════════════════ */
function RegisterRail() {
  const perks = [
    'Valoración indicativa de cada empresa',
    'Scores de oportunidad y riesgo',
    'Compradores e inversores que encajan',
    'Respuesta completa del Copilot ✦',
    'Alertas y búsquedas guardadas',
  ];
  return (
    <div style={{ position: 'sticky', top: 88 }}>
      <div style={{ background: 'linear-gradient(155deg, #0C0C0E, #1A1A18)', borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', right: -20, top: -30, fontSize: 150, color: 'rgba(232,0,29,.08)', fontWeight: 800, lineHeight: 1, pointerEvents: 'none' }}>✦</span>
        <div style={{ position: 'relative' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: 10, letterSpacing: '-.01em' }}>
            Desbloquea el análisis completo
          </h3>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', lineHeight: 1.6, marginBottom: 18 }}>
            Estás viendo una vista parcial. Crea tu cuenta gratuita para acceder a todo.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 20 }}>
            {perks.map(p => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#fff' }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(232,0,29,.2)', border: '1px solid rgba(232,0,29,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', flexShrink: 0 }}>✓</span>
                {p}
              </div>
            ))}
          </div>
          <button style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: '#E8001D', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
            Crear cuenta gratuita
          </button>
          <button style={{ width: '100%', padding: '11px', borderRadius: 10, border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            Iniciar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══ APP ═══════════════════════════════════════════════════ */
function USApp() {
  const D = window.US_DATA;
  const [guest, setGuest] = React.useState(true);
  const [tab, setTab] = React.useState('all');
  const [openThesis, setOpenThesis] = React.useState(null);
  const [dark, setDark] = React.useState(() => localStorage.getItem('arr-dark') === 'true');

  React.useEffect(() => {
    if (dark) document.documentElement.setAttribute('data-dark', '');
    else document.documentElement.removeAttribute('data-dark');
    localStorage.setItem('arr-dark', dark);
  }, [dark]);

  const showOpportunities = tab === 'all' || tab === 'opportunities';
  const showCompanies = tab === 'all' || tab === 'companies';
  const showSectors   = tab === 'all' || tab === 'sectors';
  const showInvestors = tab === 'all' || tab === 'investors';
  // Guests see only first 3 companies fully; rest hidden behind register wall
  const visibleCompanies = guest ? D.companies.slice(0, 3) : D.companies;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <style>{`
        * { box-sizing: border-box; transition: background-color .15s, border-color .12s, color .1s; }
        ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 4px; }
        input::placeholder { color: var(--text-subtle); }
      `}</style>

      {/* Top nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 300, background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid var(--border)', height: 60, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 20 }}>
        <a href="Home.html" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="uploads/logo.png" alt="arroba" style={{ height: 55, filter: dark ? 'brightness(0) invert(1)' : 'none' }}/>
        </a>
        <div style={{ flex: 1 }}></div>

        {/* State toggle (demo control) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 9, padding: 3 }}>
          <span style={{ fontSize: 11, color: 'var(--text-subtle)', paddingLeft: 6, fontWeight: 600 }}>Vista:</span>
          {[['Sin registrar', true], ['Registrado', false]].map(([lbl, g]) => (
            <button key={lbl} onClick={() => setGuest(g)} style={{
              padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
              background: guest === g ? '#E8001D' : 'transparent', color: guest === g ? '#fff' : 'var(--text-muted)',
            }}>{lbl}</button>
          ))}
        </div>

        <button onClick={() => setDark(!dark)} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>{dark ? '☀' : '◑'}</button>
        {guest
          ? <button style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: '#E8001D', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Crear cuenta</button>
          : <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>AM</div>
        }
      </nav>

      {/* Search header — full content width */}
      <div style={{ padding: '28px 28px 22px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <SearchBar query={D.query} guest={guest}/>
          <Understood chips={D.understood}/>
        </div>
      </div>

      {/* Results */}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '28px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'start' }}>

        {/* Main column */}
        <div style={{ minWidth: 0 }}>
          {/* 1. Strategic diagnosis */}
          <div style={{ marginBottom: 16 }}>
            <Diagnosis diagnosis={D.diagnosis} guest={guest}/>
          </div>

          {/* 2. Strategic recommendation — investment thesis + economics + why now */}
          <div style={{ marginBottom: 24 }}>
            <WhatWouldArroba rec={D.recommendation} guest={guest}/>
          </div>

          {/* 3. Opportunities detected — recommended + secondary */}
          <div style={{ marginBottom: 28 }}>
            <OpportunitiesDetected opportunities={D.opportunities} onOpen={setOpenThesis}/>
          </div>

          <EntityTabs groups={D.groups} active={tab} setActive={setTab}/>

          {/* Opportunities tab — conclusions */}
          {showOpportunities && (
            <div style={{ marginBottom: 28 }}>
              {tab === 'all' && <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 12 }}>Oportunidades detectadas · 4</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {D.opportunities.map((o, i) => <OpportunityCard key={i} o={o} onOpen={setOpenThesis}/>)}
              </div>
            </div>
          )}

          {/* 5. Companies — prioritized, a consequence */}
          {showCompanies && (
            <div style={{ marginBottom: 28 }}>
              {tab === 'all' && <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 12 }}>Empresas priorizadas · 23</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {visibleCompanies.map((c, i) => <CompanyRow key={i} c={c} guest={guest} locked={false}/>)}
              </div>
              {guest && (
                <div style={{ marginTop: 14, padding: '20px', borderRadius: 12, border: '1.5px dashed var(--border-strong)', background: 'var(--surface)', textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>+20 empresas más en esta oportunidad de consolidación</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>Crea tu cuenta para ver todas con su valoración, scores y Deal Score.</div>
                  <button style={{ padding: '10px 22px', borderRadius: 9, border: 'none', background: '#E8001D', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Ver las 23 empresas</button>
                </div>
              )}
            </div>
          )}

          {/* 6. Detected actors — dynamic concrete type for the recommended opportunity */}
          {(tab === 'all' || tab === 'investors') && (() => {
            const recOpp = D.opportunities.find(o => o.recommended) || D.opportunities[0];
            return (
              <div style={{ marginBottom: 28 }}>
                <ActorsBlock actors={recOpp.canvas.actors} guest={guest}/>
              </div>
            );
          })()}

          {/* 7. Related sectors */}
          {showSectors && (
            <div>
              {tab === 'all' && <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 12 }}>Sectores relacionados · 4</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {D.sectors.map((s, i) => <SectorRow key={i} s={s}/>)}
              </div>
            </div>
          )}
        </div>

        {/* Right rail */}
        <div>
          {guest ? <RegisterRail/> : <ActionRail/>}
        </div>
      </div>

      {/* Strategic thesis canvas overlay */}
      <ThesisCanvas opp={openThesis} onClose={() => setOpenThesis(null)}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<USApp/>);
