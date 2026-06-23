// arroba.com — Oportunidad: global shell + single-scroll blocks + Arroba Advisor

const BLOCKS = [
  { id: 'resumen',     label: 'Resumen' },
  { id: 'empresas',    label: 'Empresas' },
  { id: 'compradores', label: 'Compradores' },
  { id: 'inversores',  label: 'Inversores' },
  { id: 'senales',     label: 'Señales' },
  { id: 'plan',        label: 'Plan' },
  { id: 'actividad',   label: 'Actividad' },
];

const DISCOVERIES = [
  { target: 'senales', toast: 'Nueva señal detectada', advisor: 'He detectado una nueva señal en Costa Digital: opta a un contrato público de 0,4M€.',
    item: { type: 'positive', date: '02/06/2026', family: 'Contratación', label: 'Costa Digital opta a contrato público de 0,4M€', detail: 'Nueva oportunidad de ingresos recurrentes detectada en una empresa objetivo.', isNew: true },
    activity: { actor: 'Arroba ✦', action: 'detectó una nueva señal en Costa Digital', time: 'ahora', kind: 'discover', isNew: true } },
  { target: 'compradores', toast: 'Nuevo comprador compatible', advisor: 'Andalucía Media Group encaja como comprador (79%): busca expandirse hacia el Levante.',
    item: { name: 'Andalucía Media Group', type: 'Corporate', fit: 79, deals: 5, ticket: '3–7M€', last: 'hace 2 meses', reason: 'Expansión hacia el Levante desde el sur', isNew: true },
    activity: { actor: 'Arroba ✦', action: 'identificó un nuevo comprador: Andalucía Media Group', time: 'ahora', kind: 'discover', isNew: true } },
  { target: 'empresas', toast: 'Nueva empresa objetivo', advisor: 'He añadido Sur Creativo (Almería) como empresa objetivo en rol de especialista.',
    item: { name: 'Sur Creativo', loc: 'Almería', revenue: '0,8M€', ebitda: '0,13M€', margin: '16,3%', emp: 7, dealScore: 64, valuation: '1,0M€', role: 'Especialista', signal: 'Cartera estable', isNew: true },
    activity: { actor: 'Arroba ✦', action: 'añadió Sur Creativo a las empresas objetivo', time: 'ahora', kind: 'discover', isNew: true } },
  { target: 'inversores', toast: 'Nuevo inversor compatible', advisor: 'Atlas Buyout (PE, 260M€ AUM) podría financiar el roll-up: tesis buy & build activa.',
    item: { name: 'Atlas Buyout', type: 'Private Equity', fit: 70, aum: '260M€', focus: 'Buy & build en servicios', last: 'hace 1 mes', isNew: true },
    activity: { actor: 'Arroba ✦', action: 'identificó un nuevo inversor: Atlas Buyout', time: 'ahora', kind: 'discover', isNew: true } },
];

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 800, animation: 'opToastIn .4s cubic-bezier(.2,.8,.2,1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#0C0C0E', border: '1px solid rgba(232,0,29,.3)', borderRadius: 12, padding: '14px 18px', boxShadow: '0 12px 40px rgba(0,0,0,.3)', minWidth: 280 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 800, flexShrink: 0 }}>✦</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{toast.toast}</div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.55)', marginTop: 1 }}>Arroba acaba de descubrirlo</div>
        </div>
      </div>
    </div>
  );
}

/* ── Arroba Advisor (right column) ─────────────────────────── */
function ArrobaAdvisor({ D, live, advisorFeed, go, nat }) {
  const done = D.plan.filter(p => p.status === 'done').length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 76 }}>
      {/* Advisor header + next best action */}
      <div style={{ background: 'linear-gradient(135deg, #0C0C0E, #1A1A18)', borderRadius: 14, padding: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 14, pointerEvents: 'none' }}><span style={{ position: 'absolute', right: -8, top: -22, fontSize: 100, color: 'rgba(232,0,29,.08)', fontWeight: 800, lineHeight: 1 }}>✦</span></div>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 800 }}>✦</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Arroba Advisor</span>
            <span style={{ marginLeft: 'auto', display: 'inline-flex', width: 7, height: 7 }}>
              <span style={{ position: 'relative', width: 7, height: 7, borderRadius: '50%', background: '#1A8A4A' }}><span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#1A8A4A', animation: 'opLive 1.8s ease-out infinite' }}></span></span>
            </span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 8 }}>Siguiente mejor acción</div>
          <p style={{ fontSize: 14.5, fontWeight: 600, color: '#fff', lineHeight: 1.35, marginBottom: 14 }}>{nat.nextAction || 'Revisa el plan de acción recomendado'}</p>
          <button onClick={() => go('plan')} style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: '#E8001D', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{nat.primary || 'Empezar'} →</button>
        </div>
      </div>

      {/* Compact roadmap — operational command center */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Roadmap</span>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#E8001D', fontVariantNumeric: 'tabular-nums' }}>{Math.round((done / D.plan.length) * 100)}%</span>
        </div>
        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 16 }}><div style={{ height: '100%', width: `${(done / D.plan.length) * 100}%`, background: '#E8001D', borderRadius: 2 }}></div></div>
        <div style={{ position: 'relative' }}>
          {D.plan.map((p, i) => {
            const isLast = i === D.plan.length - 1;
            return (
              <div key={p.step} onClick={() => go('plan')} style={{ display: 'flex', gap: 11, cursor: 'pointer', paddingBottom: isLast ? 0 : 14, position: 'relative' }}>
                {!isLast && <div style={{ position: 'absolute', left: 8, top: 18, bottom: 0, width: 1.5, background: p.status === 'done' ? '#1A8A4A' : 'var(--border)' }}></div>}
                <div style={{ width: 17, height: 17, borderRadius: '50%', flexShrink: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: p.status === 'done' ? '#1A8A4A' : p.status === 'current' ? '#E8001D' : 'var(--surface)',
                  border: p.status === 'pending' ? '1.5px solid var(--border-strong)' : 'none' }}>
                  {p.status === 'done' ? <OPIcon name="check" size={9} color="#fff" sw={3}/> : p.status === 'current' ? <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }}></span> : null}
                </div>
                <div style={{ flex: 1, minWidth: 0, marginTop: -1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: p.status === 'current' ? 700 : 500, color: p.status === 'pending' ? 'var(--text-subtle)' : 'var(--text)', lineHeight: 1.3 }}>{p.title}</div>
                  {p.status === 'current' && <div style={{ fontSize: 10.5, fontWeight: 600, color: '#E8001D', marginTop: 2 }}>En curso</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live advisor recommendations */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 14 }}>Recomendaciones</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {advisorFeed.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, opacity: i === 0 && m.fresh ? 1 : 0.95 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(232,0,29,.08)', border: '1px solid rgba(232,0,29,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#E8001D', fontWeight: 800, flexShrink: 0, marginTop: 1 }}>✦</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>{m.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 14 }}>Acciones sugeridas</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {[
            { icon: 'layers', label: 'Crear shortlist', go: 'empresas' },
            { icon: 'euro', label: 'Valorar la plataforma', go: 'resumen' },
            { icon: 'team', label: 'Aproximar compradores', go: 'compradores' },
            { icon: nat.docIcon || 'document', label: nat.doc || 'Generar informe', go: null },
          ].map(a => (
            <button key={a.label} onClick={() => a.go && go(a.go)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', width: '100%', border: '1px solid var(--border)', background: 'var(--surface)', fontFamily: 'var(--font-body)', transition: 'border-color .12s, transform .1s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#E8001D'; e.currentTarget.style.transform = 'translateX(2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = ''; }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><OPIcon name={a.icon} size={14} color="#E8001D"/></div>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function OpApp() {
  const D = window.OP_DATA;
  const [activating, setActivating] = React.useState(true);
  const [dark, setDark] = React.useState(() => localStorage.getItem('arr-dark') === 'true');
  const [toast, setToast] = React.useState(null);
  const [pulse, setPulse] = React.useState(false);
  const [activeBlk, setActiveBlk] = React.useState('resumen');
  const [saved, setSaved] = React.useState(false);

  const [live, setLive] = React.useState({ empresas: D.empresas, compradores: D.compradores, inversores: D.inversores, senales: D.senales, actividad: D.actividad });
  const [advisorFeed, setAdvisorFeed] = React.useState([
    { text: 'Prioriza Creativa Estratégica (Deal 91): es la plataforma natural de la consolidación.' },
    { text: 'Stratex Media aporta el mejor margen (21,3%) — clave para la valoración agregada.' },
  ]);
  const discIdx = React.useRef(0);

  React.useEffect(() => {
    if (dark) document.documentElement.setAttribute('data-dark', '');
    else document.documentElement.removeAttribute('data-dark');
    localStorage.setItem('arr-dark', dark);
  }, [dark]);

  // Living command center — discovers new entities over time
  React.useEffect(() => {
    if (activating) return;
    const tick = () => {
      if (discIdx.current >= DISCOVERIES.length) return;
      const d = DISCOVERIES[discIdx.current];
      discIdx.current += 1;
      setLive(prev => ({ ...prev, [d.target]: [d.item, ...prev[d.target]], actividad: [d.activity, ...prev.actividad] }));
      setAdvisorFeed(prev => [{ text: d.advisor, fresh: true }, ...prev].slice(0, 6));
      setToast(d); setPulse(true);
      setTimeout(() => setPulse(false), 1200);
      setTimeout(() => setToast(null), 4200);
    };
    const first = setTimeout(tick, 4500);
    const iv = setInterval(tick, 9000);
    return () => { clearTimeout(first); clearInterval(iv); };
  }, [activating]);

  const go = (id) => {
    const el = document.getElementById('blk-' + id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120 });
  };

  const nat = D.natureConfig[D.meta.type] || {};

  if (activating) return <ActivationState onDone={() => setActivating(false)}/>;

  const Block = ({ id, children }) => (
    <section id={'blk-' + id} style={{ scrollMarginTop: 120 }}>{children}</section>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* ── Global shell top nav ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 300, background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid var(--border)', height: 58, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 22 }}>
        <a href="Home.html" style={{ display: 'flex' }}><img src="uploads/logo.png" alt="arroba" style={{ height: 55, filter: dark ? 'brightness(0) invert(1)' : 'none' }}/></a>
        <div style={{ display: 'flex', gap: 4 }}>
          {['Analiza', 'Valora', 'Compra/Vende'].map(l => (
            <a key={l} href="Universal Search.html" style={{ fontSize: 13.5, fontWeight: l === 'Compra/Vende' ? 700 : 500, color: l === 'Compra/Vende' ? 'var(--text)' : 'var(--text-muted)', padding: '7px 13px', borderRadius: 8, textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
        <div style={{ flex: 1 }}></div>
        <button onClick={() => setDark(!dark)} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>{dark ? '☀' : '◑'}</button>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>AM</div>
      </nav>

      {/* ── Opportunity header ── */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '22px 28px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, marginBottom: 12 }}>
            <a href="Universal Search.html" style={{ color: 'var(--text-subtle)', textDecoration: 'none' }}>Comprar / Vender</a>
            <span style={{ color: 'var(--text-subtle)' }}>/</span>
            <span style={{ color: 'var(--text-subtle)' }}>Oportunidades</span>
            <span style={{ color: 'var(--text-subtle)' }}>/</span>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>{D.meta.id}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 18 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#fff', background: '#E8001D', padding: '3px 9px', borderRadius: 5 }}>{D.meta.type}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                  <span style={{ position: 'relative', display: 'inline-flex', width: 7, height: 7 }}>
                    <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: pulse ? '#E8001D' : '#1A8A4A', animation: 'opLive 1.8s ease-out infinite' }}></span>
                    <span style={{ position: 'relative', width: 7, height: 7, borderRadius: '50%', background: pulse ? '#E8001D' : '#1A8A4A' }}></span>
                  </span>
                  {pulse ? 'Arroba ha descubierto algo nuevo' : 'En vivo · Arroba está rastreando el mercado'}
                </span>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', letterSpacing: '-.01em', lineHeight: 1.15, maxWidth: 680 }}>{D.meta.title}</h1>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={() => setSaved(!saved)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 9, border: `1.5px solid ${saved ? '#E8001D' : 'var(--border-strong)'}`, background: saved ? 'rgba(232,0,29,.06)' : 'var(--surface)', color: saved ? '#E8001D' : 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                <OPIcon name={saved ? 'bookmarkFill' : 'bookmark'} size={14} color={saved ? '#E8001D' : 'var(--text-muted)'}/> {saved ? 'Guardada' : 'Guardar'}
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 9, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}><OPIcon name="share" size={14} color="var(--text-muted)"/> Compartir</button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 9, border: 'none', background: '#E8001D', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}><OPIcon name={nat.docIcon || 'document'} size={14} color="#fff"/> {nat.doc || 'Generar informe'}</button>
            </div>
          </div>
          {/* In-page anchor chips (not a permanent sidebar) */}
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
            {BLOCKS.map(b => (
              <button key={b.id} onClick={() => go(b.id)} style={{ padding: '10px 14px', border: 'none', background: 'transparent', borderBottom: `2px solid ${activeBlk === b.id ? '#E8001D' : 'transparent'}`, marginBottom: -1, fontSize: 13.5, fontWeight: activeBlk === b.id ? 700 : 500, color: activeBlk === b.id ? 'var(--text)' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{b.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body: single scroll + Advisor column ── */}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '28px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'start' }}>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 44 }}>
          <Block id="resumen"><SecResumen D={D} live={live} go={go}/></Block>
          <Block id="empresas"><SecEmpresas live={live}/></Block>
          <Block id="compradores"><SecCompradores live={live}/></Block>
          <Block id="inversores"><SecInversores live={live}/></Block>
          <Block id="senales"><SecSenales live={live}/></Block>
          <Block id="plan"><SecPlan D={D}/></Block>
          <Block id="actividad"><SecActividad live={live}/></Block>
        </div>
        <ArrobaAdvisor D={D} live={live} advisorFeed={advisorFeed} go={go} nat={nat}/>
      </div>

      <Toast toast={toast}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<OpApp/>);
