// arroba.com — Página de Planes · secciones (nav, hero, banda, planes)

const GO_REGISTER = 'Registro.html';

function Spark({ size = 12, color = '#E8001D', style }) {
  return <span style={{ color, fontSize: size, fontWeight: 700, lineHeight: 1, fontFamily: 'var(--font-display)', flexShrink: 0, ...style }}>✦</span>;
}

function PlanNav({ dark, setDark }) {
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 300, background: 'color-mix(in srgb, var(--bg) 86%, transparent)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid var(--border)', height: 60, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 28 }}>
      <a href="Home.html" style={{ display: 'flex', alignItems: 'center' }}>
        <img src="uploads/logo.png" alt="arroba" style={{ height: 55, filter: dark ? 'brightness(0) invert(1)' : 'none' }}/>
      </a>
      <div className="pl-nav-links" style={{ display: 'flex', gap: 4 }}>
        {[['Analiza', 'Analiza.html'], ['Valora', 'Valora.html'], ['Compra/Vende', 'Compra-Vende.html']].map(([l, href]) => (
          <a key={l} href={href} style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', padding: '7px 14px', borderRadius: 8, textDecoration: 'none' }}>{l}</a>
        ))}
      </div>
      <div style={{ flex: 1 }}></div>
      <a href="#planes" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }} className="pl-hide-sm">Planes</a>
      <button onClick={() => setDark(!dark)} title="Tema" style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{dark ? '☀' : '◑'}</button>
      <a href={GO_REGISTER} style={{ display: 'inline-flex', alignItems: 'center', padding: '9px 18px', borderRadius: 9, background: '#E8001D', color: '#fff', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}>Comenzar</a>
    </nav>
  );
}

function PlanHero() {
  return (
    <section style={{ maxWidth: 1080, margin: '0 auto', padding: '72px 28px 40px', textAlign: 'center' }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: '#E8001D', marginBottom: 22 }}>Planes</div>
      <h1 style={{ fontSize: 'clamp(34px, 5.4vw, 56px)', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-.03em', lineHeight: 1.07, maxWidth: 880, margin: '0 auto 24px' }}>
        Elige el plan que mejor se adapte a tu forma de trabajar
      </h1>
      <p style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 620, margin: '0 auto 14px' }}>
        Todos los planes incluyen acceso a la misma inteligencia económica y transaccional.
      </p>
      <p style={{ fontSize: 16, color: 'var(--text-subtle)', lineHeight: 1.6, maxWidth: 600, margin: '0 auto 40px' }}>
        La diferencia no está en los datos a los que puedes acceder, sino en cómo trabajas y con quién trabajas.
      </p>

      {/* Card destacada */}
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '20px 32px', borderRadius: 16, border: '1px solid var(--border)', background: 'var(--surface)', boxShadow: '0 8px 30px rgba(12,12,14,.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Spark size={15}/>
          <span style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-.02em' }}>Más de 3,3 millones de compañías españolas</span>
        </div>
        <span style={{ fontSize: 13.5, color: 'var(--text-subtle)', fontWeight: 500 }}>Información financiera • Valoraciones • Compra-Venta • IA</span>
      </div>
    </section>
  );
}

function PlanBand() {
  const P = window.PL.pillars;
  return (
    <section style={{ background: '#0C0C0E', color: '#fff', padding: '64px 28px', marginTop: 40 }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(26px, 3.6vw, 36px)', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-.02em', lineHeight: 1.15, marginBottom: 14 }}>
            La infraestructura de inteligencia económica de España
          </h2>
          <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,.55)', fontWeight: 500 }}>3,3 millones de compañías • Valoraciones automáticas • M&A • IA</p>
        </div>
        <div className="pl-band-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
          {P.map((p, i) => (
            <div key={i} style={{ padding: '8px 28px', borderLeft: i ? '1px solid rgba(255,255,255,.12)' : 'none', textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-.02em', lineHeight: 1.1, color: '#fff' }}>{p.big}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,.5)', marginTop: 6, fontWeight: 500 }}>{p.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlanCards() {
  const P = window.PL.plans;
  const B = window.PL.billing;
  const [billing, setBilling] = React.useState('mensual');
  const period = B.find(b => b.id === billing);
  return (
    <section id="planes" style={{ maxWidth: 1120, margin: '0 auto', padding: '72px 28px 24px' }}>
      {/* selector de periodo */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 38 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: 5, borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface)' }}>
          {B.map(b => {
            const on = b.id === billing;
            return (
              <button key={b.id} onClick={() => setBilling(b.id)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, transition: 'background .15s, color .15s',
                  background: on ? '#0C0C0E' : 'transparent', color: on ? '#fff' : 'var(--text-muted)' }}>
                {b.label}
                {b.off > 0 && <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: on ? '#E8001D' : 'rgba(232,0,29,.1)', color: on ? '#fff' : '#E8001D' }}>−{b.off}%</span>}
              </button>
            );
          })}
        </div>
      </div>
      <div className="pl-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'stretch' }}>
        {P.map(plan => <PlanCard key={plan.id} plan={plan} period={period}/>)}
      </div>
      <p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--text-subtle)', marginTop: 26 }}>
        Todos los precios sin IVA. Sin permanencia · cancela cuando quieras.
      </p>
    </section>
  );
}

function PlanCard({ plan, period }) {
  const [h, setH] = React.useState(false);
  const featured = plan.featured;
  const eur = n => Math.round(n).toLocaleString('es-ES') + ' €';
  const monthly = plan.base * (period ? period.factor : 1);
  const discounted = period && period.off > 0;
  // total facturado por periodo (×6 semestral, ×12 anual)
  const totalMonths = period ? (period.id === 'anual' ? 12 : period.id === 'semestral' ? 6 : 1) : 1;
  const billedTotal = monthly * totalMonths;
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', borderRadius: 18, padding: '30px 28px',
        border: `1.5px solid ${featured || h ? '#E8001D' : 'var(--border)'}`,
        background: 'var(--surface)',
        boxShadow: featured || h ? '0 16px 50px rgba(232,0,29,.16)' : '0 2px 10px rgba(12,12,14,.03)',
        transform: featured || h ? 'translateY(-6px)' : 'none', transition: 'box-shadow .18s, border-color .15s, transform .18s' }}>
      {featured && (
        <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#E8001D', color: '#fff', fontSize: 11.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 999, whiteSpace: 'nowrap' }}>Recomendado</div>
      )}
      <div style={{ fontSize: 19, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: 4 }}>{plan.name}</div>
      <div style={{ fontSize: 13.5, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 18, minHeight: 20 }}>{plan.tagline}</div>

      {/* precio */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
        {plan.from && <span style={{ fontSize: 15, color: 'var(--text-muted)', fontWeight: 500, marginRight: 1 }}>Desde</span>}
        <span style={{ fontSize: 34, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-.02em', lineHeight: 1 }}>{eur(monthly)}</span>
        <span style={{ fontSize: 15, color: 'var(--text-muted)', fontWeight: 500 }}>{plan.perUser ? '/usuario/mes' : '/mes'}</span>
        {discounted && <span style={{ fontSize: 15, color: 'var(--text-subtle)', fontWeight: 500, textDecoration: 'line-through', marginLeft: 4 }}>{eur(plan.base)}</span>}
      </div>
      <div style={{ minHeight: 18, marginTop: 5, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {plan.aux && <span style={{ fontSize: 12.5, color: 'var(--text-subtle)', fontWeight: 500 }}>{plan.aux}</span>}
        {discounted && <span style={{ fontSize: 12.5, color: '#E8001D', fontWeight: 600 }}>{plan.perUser ? `${eur(billedTotal)}/usuario · ${period.note}` : `${eur(billedTotal)} · ${period.note}`}</span>}
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: '#E8001D', background: 'rgba(232,0,29,.06)', border: '1px solid rgba(232,0,29,.16)', padding: '6px 11px', borderRadius: 8, marginTop: 10, marginBottom: 20, alignSelf: 'flex-start' }}>
        <Spark size={11}/> {plan.credits}
      </div>

      <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 22 }}>{plan.desc}</p>

      {/* features */}
      {plan.featuresHead && (
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>{plan.featuresHead}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 28 }}>
        {plan.features.map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ width: 18, height: 18, borderRadius: '50%', background: featured ? '#E8001D' : 'var(--surface-2)', border: featured ? 'none' : '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={featured ? '#fff' : '#1A8A4A'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
            <span style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.4 }}>{f}</span>
          </div>
        ))}
      </div>

      <a href={GO_REGISTER} style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 11, textDecoration: 'none', fontSize: 14.5, fontWeight: 700, fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'background .14s, color .14s, border-color .14s',
        background: featured || h ? '#E8001D' : 'transparent',
        color: featured || h ? '#fff' : 'var(--text)',
        border: `1.5px solid ${featured || h ? '#E8001D' : 'var(--border-strong)'}` }}>
        Comenzar
      </a>
    </div>
  );
}

Object.assign(window, { PlanNav, PlanHero, PlanBand, PlanCards, GO_REGISTER, Spark });
