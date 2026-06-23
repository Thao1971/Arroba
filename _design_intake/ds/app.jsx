// Arroba DS — App Shell (sidebar nav + routing + dark mode + font switcher)

const NAV = [
  { id: 'overview',   label: 'Overview',   group: null },
  { id: 'colors',     label: 'Colors',     group: 'Foundations' },
  { id: 'typography', label: 'Typography', group: 'Foundations' },
  { id: 'spacing',    label: 'Spacing & Elevation', group: 'Foundations' },
  { id: 'buttons',    label: 'Buttons',    group: 'Components' },
  { id: 'forms',      label: 'Form Controls', group: 'Components' },
  { id: 'badges',     label: 'Badges & Tags', group: 'Components' },
  { id: 'cards',      label: 'Cards',      group: 'Components' },
  { id: 'alerts',     label: 'Alerts',     group: 'Components' },
  { id: 'navigation', label: 'Navigation', group: 'Components' },
  { id: 'table',      label: 'Data Table', group: 'Components' },
  { id: 'tokens',     label: 'CSS Tokens', group: 'Reference' },
];

function TokensSection() {
  const [copied, setCopied] = React.useState(false);
  const css = window.ARROBA.cssVars;
  const copy = () => {
    navigator.clipboard?.writeText(css);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', marginBottom: 6 }}>CSS Tokens</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 520 }}>
          Variables CSS listas para copiar en tu proyecto React. Añade este bloque en tu archivo global.css o index.css.
        </p>
      </div>
      <div style={{ position: 'relative' }}>
        <button onClick={copy} style={{
          position: 'absolute', top: 14, right: 14, zIndex: 2,
          padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,.15)',
          background: 'rgba(255,255,255,.08)', color: '#fff', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'var(--font-body)',
        }}>
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
        <pre style={{
          background: '#0C0C0E', color: '#F4F4F0', borderRadius: 12, padding: '24px',
          fontSize: 12, lineHeight: 1.7, overflowX: 'auto', fontFamily: 'monospace',
          border: '1px solid #2E2E2C',
        }}>{css}</pre>
      </div>
    </div>
  );
}

function OverviewSection({ dark, setDark, fontPairIdx, setFontPairIdx }) {
  const T = window.ARROBA;
  const pair = T.typography.pairs[fontPairIdx];
  return (
    <div>
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-subtle)', background: 'var(--surface-2)', padding: '4px 10px', borderRadius: 4 }}>v1.0</span>
          <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>·</span>
          <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>React · CSS Custom Properties</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, color: 'var(--text)', lineHeight: 1.05, marginBottom: 16 }}>
          Arroba<br /><span style={{ color: '#E8001D' }}>Design System</span>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-muted)', maxWidth: 520, lineHeight: 1.6 }}>
          Sistema de diseño de arroba.com — la plataforma de inteligencia económica y decisión empresarial. Tokens, componentes y guías para el recorrido Analizar → Valorar → Comprar/Vender.
        </p>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 48 }}>
        {[
          { n: '5', label: 'Paletas de color' },
          { n: '10', label: 'Pasos tipográficos' },
          { n: '11', label: 'Componentes' },
          { n: '60+', label: 'CSS Tokens' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#E8001D', fontFamily: 'var(--font-body)', lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em' }}>{s.n}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Type pair selector on overview */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Par tipográfico activo</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {T.typography.pairs.map((p, i) => (
            <div key={p.id} onClick={() => setFontPairIdx(i)} style={{
              cursor: 'pointer', padding: '10px 16px', borderRadius: 8,
              border: `2px solid ${fontPairIdx === i ? '#E8001D' : 'var(--border)'}`,
              background: fontPairIdx === i ? 'rgba(232,0,29,.05)' : 'var(--surface)',
              transition: 'border-color .15s',
            }}>
              <div style={{ fontFamily: p.display, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Aa</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: fontPairIdx === i ? '#E8001D' : 'var(--text-muted)', marginTop: 4 }}>{p.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Principles */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 16 }}>Principios de diseño</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {[
            { title: 'Del dato a la decisión', desc: 'Cada pantalla conduce a una acción. La información existe para decidir, no para contemplar.' },
            { title: 'Claridad', desc: 'Los datos financieros son complejos. La UI debe simplificarlos, nunca añadir ruido. Punto miles, coma decimales.' },
            { title: 'Inteligencia visible ✦', desc: 'Todo lo generado por IA — Copilot, señales, scores — se marca con el símbolo ✦ en rojo de marca.' },
            { title: 'Distinción', desc: 'El rojo #E8001D es un activo. Úsalo con intención, no por decoración. Se mantiene incluso en modo oscuro.' },
          ].map(p => (
            <div key={p.title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E8001D', marginBottom: 12 }}></div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6, fontFamily: 'var(--font-display)' }}>{p.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DSApp() {
  const [active, setActive]       = React.useState('overview');
  const [dark, setDark]           = React.useState(() => localStorage.getItem('arr-dark') === 'true');
  const [fontPairIdx, setFontPairIdx] = React.useState(() => parseInt(localStorage.getItem('arr-font') || '0'));

  React.useEffect(() => {
    if (dark) document.documentElement.setAttribute('data-dark', '');
    else document.documentElement.removeAttribute('data-dark');
    localStorage.setItem('arr-dark', dark);
  }, [dark]);

  React.useEffect(() => {
    localStorage.setItem('arr-font', fontPairIdx);
  }, [fontPairIdx]);

  const groups = [...new Set(NAV.map(n => n.group))];

  const renderSection = () => {
    const p = { dark, setDark, fontPairIdx, setFontPairIdx };
    switch (active) {
      case 'overview':   return <OverviewSection {...p} />;
      case 'colors':     return <ColorsSection />;
      case 'typography': return <TypographySection {...p} />;
      case 'spacing':    return <SpacingSection />;
      case 'buttons':    return <ButtonsSection />;
      case 'forms':      return <FormControlsSection />;
      case 'badges':     return <BadgesSection />;
      case 'cards':      return <CardsSection />;
      case 'alerts':     return <AlertsSection />;
      case 'navigation': return <NavigationSection />;
      case 'table':      return <DataTableSection />;
      case 'tokens':     return <TokensSection />;
      default:           return null;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0, position: 'fixed', top: 0, left: 0, bottom: 0,
        background: 'var(--sidebar-bg, #0C0C0E)', overflowY: 'auto',
        borderRight: '1px solid rgba(255,255,255,.06)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <img src="uploads/logo.png" alt="Arroba" style={{ height: 22, filter: 'brightness(0) invert(1)' }} />
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 8, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 600 }}>Design System</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {groups.map(group => {
            const items = NAV.filter(n => n.group === group);
            return (
              <div key={group || 'root'}>
                {group && (
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', padding: '14px 20px 6px' }}>{group}</div>
                )}
                {items.map(item => (
                  <div key={item.id} onClick={() => setActive(item.id)} style={{
                    padding: '8px 20px', cursor: 'pointer', fontSize: 13,
                    color: active === item.id ? '#fff' : 'rgba(255,255,255,.45)',
                    background: active === item.id ? 'rgba(232,0,29,.18)' : 'transparent',
                    borderLeft: `2px solid ${active === item.id ? '#E8001D' : 'transparent'}`,
                    fontWeight: active === item.id ? 600 : 400,
                    transition: 'color .1s, background .1s',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    {active === item.id && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#E8001D', flexShrink: 0 }}></span>}
                    {item.label}
                  </div>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Dark mode toggle */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <div onClick={() => setDark(!dark)} style={{
            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,.05)',
          }}>
            <span style={{ fontSize: 14 }}>{dark ? '☀' : '◑'}</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', fontWeight: 500 }}>{dark ? 'Light mode' : 'Dark mode'}</span>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main style={{ marginLeft: 220, flex: 1, padding: '48px 48px', maxWidth: 1000, minHeight: '100vh' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        {renderSection()}
      </main>
    </div>
  );
}

const dsRoot = ReactDOM.createRoot(document.getElementById('root'));
dsRoot.render(<DSApp />);
