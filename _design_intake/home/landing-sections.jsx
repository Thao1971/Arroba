// arroba.com — Landing sections (public, unregistered)

/* ══ NAV ═══════════════════════════════════════════════════ */
function LandingNav() {
  const [dark, setDark] = React.useState(() => localStorage.getItem('arr-dark') === 'true');
  React.useEffect(() => {
    if (dark) document.documentElement.setAttribute('data-dark', '');
    else document.documentElement.removeAttribute('data-dark');
    localStorage.setItem('arr-dark', dark);
  }, [dark]);
  const links = ['Analiza', 'Valora', 'Compra/Vende'];
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 300, background: 'color-mix(in srgb, var(--bg) 86%, transparent)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid var(--border)', height: 64, display: 'flex', alignItems: 'center', padding: '0 max(32px, calc((100vw - 1240px) / 2))' }}>
      <a href="Home.html" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <img src="uploads/logo.png" alt="arroba" style={{ height: 55, filter: dark ? 'brightness(0) invert(1)' : 'none' }}/>
      </a>
      <div style={{ display: 'flex', gap: 4, marginLeft: 36 }}>
        {links.map(l => (
          <span key={l} style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', transition: 'all .12s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--surface-2)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>{l}</span>
        ))}
      </div>
      <div style={{ flex: 1 }}></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => setDark(!dark)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontSize: 14 }}>{dark ? '☀' : '◑'}</button>
        <a href="Login.html" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', padding: '9px 16px', textDecoration: 'none' }}>Iniciar sesión</a>
        <a href="Registro.html" style={{ display: 'inline-flex', alignItems: 'center', padding: '9px 18px', borderRadius: 9, border: 'none', background: '#E8001D', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', textDecoration: 'none' }}>Crear cuenta</a>
      </div>
    </nav>
  );
}

/* ══ HERO ══════════════════════════════════════════════════ */
function fmtMiles(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function LiveCount() {
  const n = useCountUp(5265, 1600);
  return fmtMiles(n);
}
function LandingHero() {
  const { examples, hero } = window.LANDING;
  const [q, setQ] = React.useState('');
  const [ph, setPh] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setPh(p => (p + 1) % hero.placeholders.length), 2600);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ textAlign: 'center', padding: '64px 0 56px', maxWidth: 880, margin: '0 auto' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)', padding: '6px 14px', borderRadius: 30, marginBottom: 28 }}>
        <span style={{ color: '#E8001D' }}>✦</span> Inteligencia económica · M&A · España
      </div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 58, fontWeight: 700, lineHeight: 1.06, letterSpacing: '-.03em', color: 'var(--text)', marginBottom: 22, textWrap: 'balance' }}>
        ¿Qué quieres hacer<br/>con <span style={{ color: '#E8001D' }}>tu compañía?</span>
      </h1>
      <p style={{ fontSize: 18, lineHeight: 1.6, color: 'var(--text-muted)', maxWidth: 620, margin: '0 auto 36px' }}>
        {hero.subtitle}
      </p>

      {/* Universal search */}
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 6px 6px 18px', background: 'var(--surface)', border: '1.5px solid var(--border-strong)', borderRadius: 14, boxShadow: '0 8px 40px rgba(12,12,14,.08)', transition: 'border-color .15s, box-shadow .15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#E8001D'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(232,0,29,.12)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(12,12,14,.08)'; }}>
          <span style={{ fontSize: 20, color: '#E8001D', flexShrink: 0 }}>✦</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={hero.placeholders[ph]}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 16, color: 'var(--text)', padding: '15px 0', fontFamily: 'var(--font-body)' }}/>
          <button style={{ padding: '13px 26px', borderRadius: 10, border: 'none', background: '#E8001D', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>Explorar</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          {examples.map(ex => (
            <span key={ex} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)', padding: '5px 12px', borderRadius: 20, cursor: 'pointer', transition: 'all .12s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#E8001D'; e.currentTarget.style.color = '#E8001D'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>{ex}</span>
          ))}
        </div>
      </div>

      {/* Live count */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, marginTop: 32 }}>
        <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#1A8A4A', animation: 'lping 1.8s cubic-bezier(0,0,.2,1) infinite' }}></span>
          <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: '#1A8A4A' }}></span>
        </span>
        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}><LiveCount/></strong> empresas con inteligencia activa, cruzadas con 5 capas de datos
        </span>
      </div>
    </div>
  );
}

/* ══ THESIS — the three movements ══════════════════════════ */
function ThesisFlow() {
  const { movements } = window.LANDING;
  const toneStyle = (tone, active) => {
    if (tone === 'red') return { bg: active ? '#E8001D' : 'var(--surface)', fg: active ? '#fff' : 'var(--text)', accent: '#E8001D' };
    if (tone === 'dark') return { bg: active ? '#0C0C0E' : 'var(--surface)', fg: active ? '#fff' : 'var(--text)', accent: '#E8001D' };
    return { bg: 'var(--surface)', fg: 'var(--text)', accent: '#E8001D' };
  };
  return (
    <div style={{ padding: '64px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#E8001D', marginBottom: 14 }}>Una sola plataforma · tres movimientos</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em', lineHeight: 1.1 }}>
          El recorrido completo de una decisión
        </h2>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 560, margin: '14px auto 0', lineHeight: 1.6 }}>
          Cada fase conduce naturalmente a la siguiente. La transacción parece la consecuencia lógica del análisis.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: 0, alignItems: 'stretch' }}>
        {movements.map((m, i) => {
          const dark = m.tone === 'dark', red = m.tone === 'red';
          const cardBg = dark ? '#0C0C0E' : red ? 'linear-gradient(155deg,#E8001D,#B5001A)' : 'var(--surface)';
          const fg = (dark || red) ? '#fff' : 'var(--text)';
          const muted = (dark || red) ? 'rgba(255,255,255,.65)' : 'var(--text-muted)';
          const chipBg = (dark || red) ? 'rgba(255,255,255,.1)' : 'var(--surface-2)';
          const chipBd = (dark || red) ? 'rgba(255,255,255,.15)' : 'var(--border)';
          return (
            <React.Fragment key={m.id}>
              <div style={{ background: cardBg, border: (dark || red) ? 'none' : '1px solid var(--border)', borderRadius: 18, padding: '30px 26px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                {(dark || red) && <span style={{ position: 'absolute', right: -12, top: -24, fontSize: 130, color: 'rgba(255,255,255,.07)', fontWeight: 800, pointerEvents: 'none', lineHeight: 1 }}>✦</span>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, position: 'relative' }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: (dark || red) ? 'rgba(255,255,255,.12)' : 'rgba(232,0,29,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: red ? '#fff' : '#E8001D', fontFamily: 'var(--font-display)' }}>{m.n}</span>
                  <div>
                    <div style={{ fontSize: 19, fontWeight: 700, color: fg, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{m.verb}</div>
                  </div>
                </div>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: muted, marginBottom: 18, position: 'relative', flex: 1 }}>{m.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, position: 'relative' }}>
                  {m.points.map(p => (
                    <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: fg, fontWeight: 500 }}>
                      <span style={{ width: 16, height: 16, borderRadius: '50%', background: chipBg, border: `1px solid ${chipBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: red ? '#fff' : '#E8001D', flexShrink: 0 }}>✓</span>
                      {p}
                    </div>
                  ))}
                </div>
              </div>
              {i < movements.length - 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--surface)', border: '1.5px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: '#E8001D' }}>→</div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* ══ DATA SCALE ════════════════════════════════════════════ */
function ScaleCounter({ value, label, sub }) {
  const n = useCountUp(value, 1500);
  return (
    <div style={{ padding: '20px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em', lineHeight: 1 }}>{fmtMiles(n)}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 8 }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}
function DataScale() {
  const { scale, layers } = window.LANDING;
  return (
    <div style={{ padding: '56px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#E8001D', marginBottom: 14 }}>La base de datos</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em' }}>
          La economía española, cruzada y conectada
        </h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 40 }}>
        {scale.map(s => <ScaleCounter key={s.label} {...s}/>)}
      </div>

      {/* 5 intelligence layers */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Organizada en cinco capas de inteligencia, cada una con su agente</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {layers.map(l => (
          <a key={l.name} href={l.href || '#'} style={{ display: 'block', textDecoration: 'none', padding: '20px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, transition: 'border-color .12s, transform .12s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#E8001D'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = ''; }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(232,0,29,.08)', border: '1px solid rgba(232,0,29,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <HIcon name={l.icon} size={19} color="#E8001D" sw={1.75}/>
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginBottom: 6, lineHeight: 1.2 }}>{l.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 }}>{l.desc}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, color: '#E8001D', background: 'rgba(232,0,29,.06)', border: '1px solid rgba(232,0,29,.15)', padding: '3px 8px', borderRadius: 5, whiteSpace: 'nowrap' }}>
              <span>✦</span> Agente IA
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ══ THE MOAT — public procurement ═════════════════════════ */
function MoatSection() {
  const { moat } = window.LANDING;
  return (
    <div style={{ padding: '56px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ background: 'linear-gradient(135deg, #0C0C0E 0%, #1A1A18 100%)', borderRadius: 20, padding: '48px 52px', position: 'relative', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', right: 40, top: -40, fontSize: 280, color: 'rgba(232,0,29,.06)', fontWeight: 800, pointerEvents: 'none', lineHeight: 1 }}>✦</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 48, alignItems: 'center', position: 'relative' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#E8001D', marginBottom: 16 }}>{moat.eyebrow}</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 700, color: '#fff', letterSpacing: '-.02em', lineHeight: 1.1, marginBottom: 18 }}>{moat.title}</h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,.7)', lineHeight: 1.65 }}>{moat.body}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {moat.stats.map(s => (
              <div key={s.l} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: '18px 22px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,.6)' }}>{s.l}</span>
                <span style={{ fontSize: 26, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══ COPILOT ═══════════════════════════════════════════════ */
function CopilotSection() {
  return (
    <div style={{ padding: '56px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 48, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#E8001D', marginBottom: 16 }}>El copiloto</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em', lineHeight: 1.1, marginBottom: 18 }}>
            Pregunta. Te llevo del dato al deal.
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: 20 }}>
            El Copilot ✦ es el tejido que conecta las cinco capas. No solo responde: ejecuta. Construye un screener, lanza una valoración, genera una shortlist de compradores o prepara un teaser — todo desde una conversación.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['Cita siempre la fuente del dato', 'Mantiene el contexto al navegar', 'Del "pregúntame" al "he detectado"'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text)' }}>
                <span style={{ color: '#E8001D' }}>✦</span> {t}
              </div>
            ))}
          </div>
        </div>

        {/* Chat preview */}
        <div style={{ background: '#0C0C0E', borderRadius: 16, border: '1px solid #2E2E2C', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,.08)', marginBottom: 16 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 800 }}>✦</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Copilot Arroba</span>
            <div style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: '#1A8A4A' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <div style={{ maxWidth: '85%', padding: '10px 14px', borderRadius: '12px 12px 4px 12px', background: '#E8001D', color: '#fff', fontSize: 13, lineHeight: 1.5 }}>
              Agencias de marketing rentables en Levante con dueño mayor de 60 años
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#E8001D', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 800, marginTop: 2 }}>✦</div>
            <div style={{ flex: 1 }}>
              <div style={{ padding: '12px 14px', borderRadius: '12px 12px 12px 4px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', fontSize: 13, lineHeight: 1.55, color: 'rgba(255,255,255,.9)' }}>
                He encontrado <strong style={{ color: '#fff' }}>14 empresas</strong> que encajan. 3 tienen contratación pública recurrente y 5 muestran señales de relevo generacional.
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  {['Ver shortlist', 'Valorar las 3 mejores', 'Generar teasers'].map(a => (
                    <span key={a} style={{ fontSize: 11, fontWeight: 600, color: '#fff', background: 'rgba(232,0,29,.25)', border: '1px solid rgba(232,0,29,.4)', padding: '4px 10px', borderRadius: 6 }}>{a}</span>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 6 }}>Fuentes: Registro Mercantil · PLACSP · BORME</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══ OPPORTUNITY ENGINE — the differentiator ═══════════════ */
function OpportunityEngine() {
  const { opportunities } = window.LANDING;
  return (
    <div style={{ padding: '56px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#E8001D', marginBottom: 14 }}>Opportunity Engine</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em', lineHeight: 1.1, maxWidth: 720, margin: '0 auto', textWrap: 'balance' }}>
          Arroba detecta oportunidades antes de que las busques
        </h2>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 600, margin: '14px auto 0', lineHeight: 1.6 }}>
          No solo analiza datos. Detecta señales, identifica patrones y transforma información económica en oportunidades accionables.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {opportunities.map(o => (
          <div key={o.title} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, transition: 'border-color .12s, transform .12s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#E8001D'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = ''; }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: 'rgba(232,0,29,.08)', border: '1px solid rgba(232,0,29,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <HIcon name={o.icon} size={20} color="#E8001D" sw={1.75}/>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{o.title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.35 }}>{o.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 26px', borderRadius: 11, border: 'none', background: '#E8001D', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          <span>✦</span> Activar oportunidad
        </button>
      </div>
    </div>
  );
}

/* ══ AGENT-READY ═══════════════════════════════════════════ */
function AgentReady() {
  const { agentReady } = window.LANDING;
  return (
    <div style={{ padding: '52px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 48, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#E8001D', marginBottom: 14 }}>Agent-ready</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em', lineHeight: 1.15, marginBottom: 14, textWrap: 'balance' }}>{agentReady.title}</h2>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6 }}>{agentReady.text}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {agentReady.access.map(a => (
            <div key={a.name} style={{ padding: '20px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <HIcon name={a.icon} size={17} color="#E8001D" sw={1.75}/>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginBottom: 5 }}>{a.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>{a.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══ CTA + FOOTER ══════════════════════════════════════════ */
function LandingCTA() {
  const { sources } = window.LANDING;
  return (
    <div style={{ padding: '56px 0 40px', borderTop: '1px solid var(--border)' }}>
      <div style={{ background: 'linear-gradient(135deg,#E8001D,#B5001A)', borderRadius: 20, padding: '48px', textAlign: 'center', position: 'relative', overflow: 'hidden', marginBottom: 48 }}>
        <span style={{ position: 'absolute', left: '50%', top: -60, transform: 'translateX(-50%)', fontSize: 240, color: 'rgba(255,255,255,.08)', fontWeight: 800, pointerEvents: 'none', lineHeight: 1 }}>✦</span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, color: '#fff', letterSpacing: '-.02em', lineHeight: 1.1, marginBottom: 14, position: 'relative' }}>
          Empieza a analizar. Descubre oportunidades.
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,.8)', maxWidth: 480, margin: '0 auto 28px', position: 'relative' }}>
          Crea tu cuenta gratuita y recorre el camino completo, del dato a la decisión.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', position: 'relative' }}>
          <a href="Registro.html" style={{ display: 'inline-flex', alignItems: 'center', padding: '13px 26px', borderRadius: 11, border: 'none', background: '#fff', color: '#E8001D', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', textDecoration: 'none' }}>Crear cuenta gratuita</a>
          <button style={{ padding: '13px 26px', borderRadius: 11, border: '1px solid rgba(255,255,255,.4)', background: 'transparent', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Solicitar demo</button>
        </div>
      </div>

      {/* Sources — official institution logos */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 22 }}>Datos oficiales. Tecnología avanzada. Decisiones inteligentes.</div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {sources.map(s => (
            <div key={s.name} title={s.name} style={{
              height: 64, width: 130, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px',
              transition: 'border-color .12s, transform .12s', boxShadow: '0 1px 3px rgba(12,12,14,.04)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = ''; }}>
              <img src={s.img} alt={s.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', display: 'block' }}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LandingNav, LandingHero, ThesisFlow, DataScale, MoatSection, OpportunityEngine, AgentReady, CopilotSection, LandingCTA });
