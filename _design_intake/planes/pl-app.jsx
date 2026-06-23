// arroba.com — Página de Planes · secciones inferiores + app

function SharedIntel() {
  const S = window.PL.shared;
  return (
    <section style={{ maxWidth: 1080, margin: '0 auto', padding: '64px 28px' }}>
      <h2 style={{ fontSize: 'clamp(26px, 3.4vw, 34px)', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-.02em', textAlign: 'center', marginBottom: 8 }}>
        La misma inteligencia para todos
      </h2>
      <p style={{ fontSize: 16, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.55 }}>
        Ningún plan es superior. Todos acceden al mismo universo de datos y a los mismos motores.
      </p>
      <div className="pl-shared-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {S.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '18px 20px', borderRadius: 13, border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {s.icon === 'spark' ? <Spark size={17}/> : <HIcon name={s.icon} size={18} color="#E8001D" sw={1.75}/>}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.35 }}>{s.t}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SuccessModel() {
  const F = window.PL.fees;
  return (
    <section style={{ background: '#0C0C0E', color: '#fff', padding: '72px 28px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#E8001D', marginBottom: 18 }}>Modelo de éxito compartido</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-.025em', lineHeight: 1.1, marginBottom: 20 }}>
            Solo ganamos cuando tú avanzas
          </h2>
          <p style={{ fontSize: 16.5, color: 'rgba(255,255,255,.6)', lineHeight: 1.65, maxWidth: 640, margin: '0 auto 52px' }}>
            La suscripción te da acceso a toda la infraestructura de inteligencia económica de España. Cuando una operación avanza o se completa dentro de la plataforma, compartimos el éxito contigo.
          </p>
        </div>
        <div className="pl-fees-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {F.map(f => (
            <div key={f.name} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, padding: '28px 24px' }}>
              <div style={{ fontSize: 52, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-.03em', lineHeight: 1, color: '#E8001D', marginBottom: 6 }}>{f.pct}</div>
              <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 14 }}>{f.name}</div>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,.6)', lineHeight: 1.6, marginBottom: 14 }}>{f.text}</p>
              {f.note && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(232,0,29,.1)', border: '1px solid rgba(232,0,29,.25)', borderRadius: 9, padding: '9px 11px', marginBottom: 14 }}>
                  <Spark size={11} style={{ marginTop: 2 }}/>
                  <span style={{ fontSize: 12.5, color: '#fff', lineHeight: 1.5, fontWeight: 500 }}>{f.note}</span>
                </div>
              )}
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.85)', fontWeight: 600, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.1)' }}>{f.who}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CreditsBlock() {
  const C = window.PL.creditsUses;
  return (
    <section style={{ maxWidth: 940, margin: '0 auto', padding: '72px 28px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }} className="pl-credits">
        <div>
          <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 32px)', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-.02em', marginBottom: 16 }}>
            ¿Cómo funcionan los créditos?
          </h2>
          <p style={{ fontSize: 15.5, color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: 12 }}>
            La suscripción da acceso a la plataforma. Todos los planes incluyen créditos mensuales que puedes usar cuando los necesites.
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-subtle)', lineHeight: 1.6 }}>
            Los créditos no caducan y puedes comprar más en cualquier momento.
          </p>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 26px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 16 }}>Los créditos se utilizan para</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {C.map(c => (
              <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <Spark size={12}/>
                <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqBlock() {
  const F = window.PL.faq;
  const [open, setOpen] = React.useState(0);
  return (
    <section style={{ maxWidth: 760, margin: '0 auto', padding: '40px 28px 90px' }}>
      <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 32px)', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-.02em', textAlign: 'center', marginBottom: 36 }}>
        Preguntas frecuentes
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {F.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 13, background: 'var(--surface)', overflow: 'hidden' }}>
              <button onClick={() => setOpen(isOpen ? -1 : i)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, width: '100%', textAlign: 'left', padding: '18px 20px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                <span style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--text)' }}>{f.q}</span>
                <span style={{ flexShrink: 0, transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform .2s', color: '#E8001D', fontSize: 22, fontWeight: 300, lineHeight: 1 }}>+</span>
              </button>
              {isOpen && (
                <div style={{ padding: '0 20px 18px', fontSize: 14.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.a}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Cierre */}
      <div style={{ textAlign: 'center', marginTop: 56 }}>
        <h3 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-.02em', lineHeight: 1.2, marginBottom: 14 }}>
          Un Bloomberg conversacional para la economía española
        </h3>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 500, margin: '0 auto 28px' }}>
          No estás contratando un software. Estás entrando en la infraestructura de inteligencia económica de España.
        </p>
        <a href={window.GO_REGISTER} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '15px 32px', borderRadius: 12, background: '#E8001D', color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none' }}>
          Comenzar ahora
        </a>
      </div>
    </section>
  );
}

function PlanFooter() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 28px', textAlign: 'center' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: 'var(--text-subtle)' }}>© 2026 arroba.com · Inteligencia económica de España</span>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacidad', 'Términos', 'Contacto'].map(l => <a key={l} href="#" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>{l}</a>)}
        </div>
      </div>
    </footer>
  );
}

function App() {
  const [dark, setDark] = React.useState(() => localStorage.getItem('arr-dark') === 'true');
  React.useEffect(() => {
    if (dark) document.documentElement.setAttribute('data-dark', '');
    else document.documentElement.removeAttribute('data-dark');
    localStorage.setItem('arr-dark', dark);
  }, [dark]);
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <PlanNav dark={dark} setDark={setDark}/>
      <PlanHero/>
      <PlanBand/>
      <PlanCards/>
      <SharedIntel/>
      <SuccessModel/>
      <CreditsBlock/>
      <FaqBlock/>
      <PlanFooter/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
