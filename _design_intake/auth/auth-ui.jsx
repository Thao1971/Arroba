// arroba.com — Auth (login + recuperar contraseña) · componentes compartidos

const AUTH_ICONS = {
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.7 2.5M6.6 6.6A13.3 13.3 0 0 0 2 11s3.5 7 10 7a10.9 10.9 0 0 0 4.5-1M3 3l18 18"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowLeft: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  google: '<path d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.2c1.9-1.7 3-4.3 3-7.6Z"/><path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"/><path d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14Z"/><path d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6Z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
};

function AIcon({ name, size = 18, color = 'currentColor', sw = 1.6, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }} dangerouslySetInnerHTML={{ __html: AUTH_ICONS[name] || '' }}/>
  );
}

/* Campo de formulario con foco rojo y toggle de contraseña */
function AuthField({ icon, label, type = 'text', value, onChange, placeholder, autoFocus, onEnter }) {
  const [foc, setFoc] = React.useState(false);
  const [show, setShow] = React.useState(false);
  const isPass = type === 'password';
  const realType = isPass ? (show ? 'text' : 'password') : type;
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 7 }}>{label}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{ position: 'absolute', left: 13, display: 'flex', pointerEvents: 'none' }}>
          <AIcon name={icon} size={17} color={foc ? '#E8001D' : 'var(--text-subtle)'}/>
        </span>
        <input type={realType} value={value} placeholder={placeholder} autoFocus={autoFocus}
          onChange={e => onChange(e.target.value)} onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
          onKeyDown={e => { if (e.key === 'Enter' && onEnter) onEnter(); }}
          style={{ width: '100%', padding: isPass ? '13px 44px 13px 40px' : '13px 14px 13px 40px', borderRadius: 11, border: `1.5px solid ${foc ? '#E8001D' : 'var(--border-strong)'}`, background: 'var(--surface)', color: 'var(--text)', fontSize: 15, fontFamily: 'var(--font-body)', outline: 'none', boxShadow: foc ? '0 0 0 3px rgba(232,0,29,.15)' : 'none', transition: 'border-color .15s, box-shadow .15s' }}/>
        {isPass && (
          <button onClick={() => setShow(!show)} tabIndex={-1} style={{ position: 'absolute', right: 10, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-subtle)' }}>
            <AIcon name={show ? 'eyeOff' : 'eye'} size={17} color="var(--text-subtle)"/>
          </button>
        )}
      </div>
    </div>
  );
}

function AuthPrimary({ children, onClick, disabled }) {
  const [h, setH] = React.useState(false);
  return (
    <button onClick={disabled ? undefined : onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} disabled={disabled}
      style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '14px', borderRadius: 12, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, transition: 'background .15s, box-shadow .15s', background: disabled ? 'var(--surface-2)' : (h ? '#C50019' : '#E8001D'), color: disabled ? 'var(--text-subtle)' : '#fff', boxShadow: !disabled && h ? '0 8px 24px rgba(232,0,29,.28)' : 'none' }}>
      {children}
    </button>
  );
}

/* Panel de marca lateral (negro) */
function BrandPanel({ dark }) {
  const stats = [
    ['3,3M', 'compañías españolas'],
    ['5.000', 'métricas económicas'],
    ['24/7', 'copiloto de inteligencia'],
  ];
  return (
    <div className="auth-brand" style={{ position: 'relative', background: '#0C0C0E', color: '#fff', padding: '48px 52px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>
      <span style={{ position: 'absolute', right: -60, top: -40, fontSize: 360, fontWeight: 800, lineHeight: 1, color: 'rgba(232,0,29,.09)', fontFamily: 'var(--font-display)', pointerEvents: 'none', userSelect: 'none' }}>✦</span>
      <img src="uploads/logo.png" alt="arroba" style={{ height: 24, filter: 'brightness(0) invert(1)', alignSelf: 'flex-start', position: 'relative' }}/>
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 13px', borderRadius: 999, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)', marginBottom: 22 }}>
          <span style={{ color: '#E8001D', fontSize: 12, fontWeight: 700 }}>✦</span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,.85)' }}>Inteligencia económica de España</span>
        </div>
        <h2 style={{ fontSize: 27, fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1.28, letterSpacing: '-.015em', marginBottom: 30, maxWidth: 410 }}>
          Analiza mercados, valora empresas y descubre oportunidades para crecer, comprar, vender o atraer inversión desde una única plataforma.
        </h2>
        <div style={{ display: 'flex', gap: 30 }}>
          {stats.map(([n, l]) => (
            <div key={l}>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', color: '#fff', letterSpacing: '-.02em' }}>{n}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginTop: 3, maxWidth: 110, lineHeight: 1.35 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: 'relative', fontSize: 12.5, color: 'rgba(255,255,255,.4)' }}>Analiza · Valora · Compra/Vende</div>
    </div>
  );
}

/* Cascarón de página de auth: marca a la izquierda, contenido a la derecha */
function AuthShell({ children }) {
  const [dark, setDark] = React.useState(false);
  React.useEffect(() => {
    if (dark) document.documentElement.setAttribute('data-dark', '');
    else document.documentElement.removeAttribute('data-dark');
  }, [dark]);
  return (
    <div className="auth-grid" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <BrandPanel dark={dark}/>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 28px', background: 'var(--bg)' }}>
        <button onClick={() => setDark(!dark)} title="Cambiar tema" style={{ position: 'absolute', top: 22, right: 22, width: 38, height: 38, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 15 }}>{dark ? '☀' : '◐'}</button>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {/* logo visible en móvil (cuando se oculta el panel) */}
          <a href="Home.html" className="auth-mobile-logo" style={{ display: 'none', marginBottom: 28 }}>
            <img src="uploads/logo.png" alt="arroba" style={{ height: 22, filter: dark ? 'brightness(0) invert(1)' : 'none' }}/>
          </a>
          {children}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AIcon, AuthField, AuthPrimary, BrandPanel, AuthShell });
