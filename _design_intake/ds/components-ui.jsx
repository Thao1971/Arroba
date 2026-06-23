// Arroba DS — Components Library
// Buttons · Form Controls · Cards · Badges · Alerts · Navigation

/* ─── Shared helpers ──────────────────────────────────────────── */
function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '32px 0 16px' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
    </div>
  );
}
function CompSectionHeader({ title, desc }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', marginBottom: 6 }}>{title}</h2>
      {desc && <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 520 }}>{desc}</p>}
    </div>
  );
}
function Row({ label, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {label && <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 10, fontWeight: 500, letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>{children}</div>
    </div>
  );
}
function DemoCard({ children, dark, style }) {
  return (
    <div style={{
      borderRadius: 12, border: '1px solid var(--border)',
      background: dark ? 'var(--brand-black, #0C0C0E)' : 'var(--surface)',
      padding: '28px 24px', ...style,
    }}>{children}</div>
  );
}

/* ─── Button ──────────────────────────────────────────────────── */
function Btn({ variant = 'primary', size = 'md', disabled, loading, iconLeft, children, fullWidth }) {
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);

  const sizes = { sm: { padding: '6px 14px', fontSize: 13, height: 32 }, md: { padding: '9px 20px', fontSize: 14, height: 40 }, lg: { padding: '12px 28px', fontSize: 16, height: 48 } };
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 8, fontFamily: 'var(--font-body)', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none', outline: 'none', transition: 'background .15s, box-shadow .15s, transform .08s, opacity .15s',
    opacity: disabled ? .45 : 1, userSelect: 'none', width: fullWidth ? '100%' : 'auto',
    transform: active && !disabled ? 'scale(.98)' : 'scale(1)',
    ...sizes[size],
  };

  const variants = {
    primary:   { background: hover && !disabled ? '#C50019' : '#E8001D', color: '#fff', boxShadow: hover && !disabled ? '0 4px 12px rgba(232,0,29,.35)' : 'none' },
    secondary: { background: hover && !disabled ? 'var(--surface-2)' : 'var(--surface)', color: 'var(--text)', border: '1.5px solid var(--border-strong)' },
    ghost:     { background: hover && !disabled ? 'var(--surface-2)' : 'transparent', color: 'var(--text)', border: '1.5px solid transparent' },
    danger:    { background: hover && !disabled ? '#B5001A' : 'rgba(232,0,29,.1)', color: hover && !disabled ? '#fff' : '#E8001D', border: '1.5px solid rgba(232,0,29,.25)' },
    link:      { background: 'transparent', color: '#E8001D', padding: '0', height: 'auto', textDecoration: hover ? 'underline' : 'none', fontWeight: 500 },
  };

  return (
    <button
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{ ...base, ...variants[variant] }}
    >
      {loading ? <span style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }}></span> : iconLeft}
      {children}
    </button>
  );
}

function ButtonsSection() {
  return (
    <div>
      <CompSectionHeader title="Buttons" desc="Jerarquía de acciones. Primary para CTAs principales, Secondary para acciones alternativas, Ghost para contextos de menor peso." />

      <DemoCard>
        <Row label="Variants">
          <Btn variant="primary">Ver agencias</Btn>
          <Btn variant="secondary">Cómo funciona</Btn>
          <Btn variant="ghost">Cancelar</Btn>
          <Btn variant="danger">Eliminar listing</Btn>
          <Btn variant="link">Ver más →</Btn>
        </Row>
        <Row label="Sizes">
          <Btn variant="primary" size="sm">Small</Btn>
          <Btn variant="primary" size="md">Medium</Btn>
          <Btn variant="primary" size="lg">Large</Btn>
        </Row>
        <Row label="States">
          <Btn variant="primary">Normal</Btn>
          <Btn variant="primary" disabled>Disabled</Btn>
          <Btn variant="primary" loading>Loading</Btn>
          <Btn variant="secondary" disabled>Secondary disabled</Btn>
        </Row>
        <Row label="Full width">
          <div style={{ width: '100%' }}>
            <Btn variant="primary" fullWidth>Publicar agencia en venta</Btn>
          </div>
        </Row>
      </DemoCard>
    </div>
  );
}

/* ─── Form Controls ───────────────────────────────────────────── */
function Input({ label, placeholder, helper, error, disabled, type = 'text', prefix }) {
  const [focus, setFocus] = React.useState(false);
  const borderColor = error ? '#E8001D' : focus ? '#E8001D' : 'var(--border-strong)';
  const shadow = focus ? '0 0 0 3px rgba(232,0,29,.18)' : 'none';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</label>}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {prefix && (
          <div style={{
            position: 'absolute', left: 12, color: 'var(--text-subtle)', fontSize: 14, pointerEvents: 'none',
          }}>{prefix}</div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            width: '100%', padding: `10px ${prefix ? '12px' : '12px'} 10px ${prefix ? '36px' : '12px'}`,
            borderRadius: 8, border: `1.5px solid ${borderColor}`, outline: 'none',
            background: disabled ? 'var(--surface-2)' : 'var(--surface)',
            color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font-body)',
            transition: 'border-color .15s, box-shadow .15s', boxShadow: shadow,
            opacity: disabled ? .6 : 1, cursor: disabled ? 'not-allowed' : 'text',
          }}
        />
      </div>
      {(helper || error) && (
        <span style={{ fontSize: 12, color: error ? '#E8001D' : 'var(--text-muted)' }}>
          {error || helper}
        </span>
      )}
    </div>
  );
}

function Select({ label, options }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</label>}
      <select
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          padding: '10px 12px', borderRadius: 8,
          border: `1.5px solid ${focus ? '#E8001D' : 'var(--border-strong)'}`,
          background: 'var(--surface)', color: 'var(--text)', fontSize: 14,
          fontFamily: 'var(--font-body)', outline: 'none',
          boxShadow: focus ? '0 0 0 3px rgba(232,0,29,.18)' : 'none',
          transition: 'border-color .15s, box-shadow .15s', cursor: 'pointer',
        }}
      >
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Toggle({ label, defaultChecked }) {
  const [on, setOn] = React.useState(defaultChecked || false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div onClick={() => setOn(!on)} style={{
        width: 44, height: 24, borderRadius: 12,
        background: on ? '#E8001D' : 'var(--border-strong)',
        cursor: 'pointer', position: 'relative', transition: 'background .2s',
        flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: 3, left: on ? 23 : 3,
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        }}></div>
      </div>
      {label && <span style={{ fontSize: 14, color: 'var(--text)' }}>{label}</span>}
    </div>
  );
}

function FormControlsSection() {
  return (
    <div>
      <CompSectionHeader title="Form Controls" desc="Inputs, selects y controles interactivos con estados completos: default, focus, error y disabled." />
      <DemoCard>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Input label="Nombre de la agencia" placeholder="ej. Creatividad Estratégica S.L." helper="Tal como aparece en el Registro Mercantil" />
          <Input label="Revenue anual (€)" placeholder="0" prefix="€" type="number" helper="Cifra de negocio del último ejercicio" />
          <Input label="Email de contacto" placeholder="hola@agencia.com" type="email" />
          <Input label="Valoración pedida" placeholder="0" prefix="€" error="Debe ser mayor que 0" />
          <Select label="Sector" options={['Madtech', 'Performance', 'Branding', 'SEO/Content', 'Social Media', 'Full-service']} />
          <Select label="Tamaño de equipo" options={['1–5 personas', '6–15 personas', '16–30 personas', '31–50 personas', '50+ personas']} />
          <Input label="Contraseña" placeholder="••••••••" type="password" disabled />
        </div>
        <Divider label="Toggles" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Toggle label="Mostrar valoración en el listing" />
          <Toggle label="Recibir alertas de compradores interesados" defaultChecked />
          <Toggle label="Listing verificado por Arroba" />
        </div>
      </DemoCard>
    </div>
  );
}

/* ─── Badges ──────────────────────────────────────────────────── */
function Badge({ variant = 'neutral', size = 'md', dot, children }) {
  const variants = {
    success: { bg: '#E8F5EE', color: '#1A8A4A', border: '#C2E8D0' },
    warning: { bg: '#FEF3E2', color: '#B45309', border: '#FCD9A3' },
    error:   { bg: '#FDE8EA', color: '#B5001A', border: '#F9B8BE' },
    info:    { bg: '#E8EFFE', color: '#1A4FC2', border: '#C0D3FA' },
    neutral: { bg: 'var(--surface-2)', color: 'var(--text-muted)', border: 'var(--border)' },
    brand:   { bg: '#E8001D', color: '#fff', border: 'transparent' },
    dark:    { bg: 'var(--text)', color: 'var(--surface)', border: 'transparent' },
  };
  const sizes = {
    sm: { padding: '2px 8px', fontSize: 10, height: 18 },
    md: { padding: '4px 10px', fontSize: 12, height: 22 },
    lg: { padding: '6px 14px', fontSize: 13, height: 28 },
  };
  const v = variants[variant];
  const s = sizes[size];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      borderRadius: 4, border: `1px solid ${v.border}`,
      background: v.bg, color: v.color,
      fontWeight: 600, letterSpacing: '.02em', fontFamily: 'var(--font-body)',
      ...s,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: v.color, flexShrink: 0 }}></span>}
      {children}
    </span>
  );
}

function BadgesSection() {
  return (
    <div>
      <CompSectionHeader title="Badges & Tags" desc="Indicadores de estado, categorías y etiquetas. Usados en listings, deals y datos de empresa." />
      <DemoCard>
        <Row label="Status badges">
          <Badge variant="success" dot>Verificado</Badge>
          <Badge variant="warning" dot>En revisión</Badge>
          <Badge variant="error" dot>Requiere acción</Badge>
          <Badge variant="info" dot>Nuevo listing</Badge>
          <Badge variant="neutral" dot>Borrador</Badge>
        </Row>
        <Row label="Brand & dark">
          <Badge variant="brand">Madtech</Badge>
          <Badge variant="dark">Performance</Badge>
          <Badge variant="neutral">SEO/Content</Badge>
          <Badge variant="neutral">Branding</Badge>
          <Badge variant="neutral">Full-service</Badge>
        </Row>
        <Row label="Sizes">
          <Badge size="sm" variant="success" dot>Small</Badge>
          <Badge size="md" variant="info" dot>Medium</Badge>
          <Badge size="lg" variant="brand">Large</Badge>
        </Row>
        <Row label="En contexto">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge variant="success" dot>Activo</Badge>
            <Badge variant="brand">Agencia verificada</Badge>
            <Badge variant="neutral">15 empleados</Badge>
            <Badge variant="info">2.4M€ revenue</Badge>
            <Badge variant="warning">NDA pendiente</Badge>
          </div>
        </Row>
      </DemoCard>
    </div>
  );
}

/* ─── Agency Listing Card ─────────────────────────────────────── */
function AgencyCard({ name, sector, size, revenue, asking, location, status, verified }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'var(--surface)', borderRadius: 12,
        border: `1.5px solid ${hover ? '#E8001D' : 'var(--border)'}`,
        padding: 24, cursor: 'pointer',
        transition: 'border-color .15s, box-shadow .15s',
        boxShadow: hover ? '0 8px 24px rgba(232,0,29,.1)' : 'var(--shadow-sm)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {hover && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#E8001D', borderRadius: '12px 12px 0 0' }}></div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text)', flexShrink: 0 }}>
              {name[0]}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>{name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{location}</div>
            </div>
          </div>
        </div>
        <Badge variant={status === 'Activo' ? 'success' : status === 'En proceso' ? 'info' : 'warning'} dot size="sm">{status}</Badge>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        <Badge variant="brand" size="sm">{sector}</Badge>
        {verified && <Badge variant="success" size="sm">✓ Verificado</Badge>}
        <Badge variant="neutral" size="sm">{size}</Badge>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
        <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>Revenue anual</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-body)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em' }}>{revenue}</div>
        </div>
        <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>Valoración</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#E8001D', fontFamily: 'var(--font-body)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em' }}>{asking}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Publicado hace 3 días</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: hover ? '#E8001D' : 'var(--text-muted)', transition: 'color .15s' }}>Ver detalle →</span>
      </div>
    </div>
  );
}

function CardsSection() {
  return (
    <div>
      <CompSectionHeader title="Cards" desc="Tarjetas de listing de agencias. Variantes para vista grid y lista. Hover state con acento rojo." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        <AgencyCard
          name="Creatividad Estratégica" sector="Madtech" location="Madrid, ES"
          size="18 empleados" revenue="2.4M €" asking="4.8M €"
          status="Activo" verified
        />
        <AgencyCard
          name="Performance Lab" sector="Performance" location="Barcelona, ES"
          size="9 empleados" revenue="980K €" asking="1.8M €"
          status="En proceso" verified
        />
        <AgencyCard
          name="Brand Stories" sector="Branding" location="Bilbao, ES"
          size="6 empleados" revenue="420K €" asking="750K €"
          status="Revisión"
        />
      </div>
    </div>
  );
}

/* ─── Alerts ──────────────────────────────────────────────────── */
function Alert({ variant = 'info', title, desc, dismissible }) {
  const [visible, setVisible] = React.useState(true);
  if (!visible) return null;
  const map = {
    success: { bg: '#E8F5EE', border: '#1A8A4A', icon: '✓', color: '#1A6A38' },
    warning: { bg: '#FEF3E2', border: '#D97708', icon: '⚠', color: '#92540A' },
    error:   { bg: '#FDE8EA', border: '#E8001D', icon: '✕', color: '#B5001A' },
    info:    { bg: '#E8EFFE', border: '#2164E3', icon: 'i', color: '#1A4FC2' },
  };
  const m = map[variant];
  return (
    <div style={{
      display: 'flex', gap: 12, padding: '14px 16px',
      borderRadius: 8, background: m.bg, borderLeft: `3px solid ${m.border}`,
      alignItems: 'flex-start',
    }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: m.border, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{m.icon}</div>
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontSize: 14, fontWeight: 600, color: m.color, marginBottom: 2 }}>{title}</div>}
        {desc && <div style={{ fontSize: 13, color: m.color, opacity: .85 }}>{desc}</div>}
      </div>
      {dismissible && <div onClick={() => setVisible(false)} style={{ cursor: 'pointer', color: m.color, opacity: .6, fontSize: 16, lineHeight: 1 }}>×</div>}
    </div>
  );
}

function AlertsSection() {
  return (
    <div>
      <CompSectionHeader title="Alerts & Feedback" desc="Mensajes de estado para el usuario. Siempre acompañados de acción cuando es posible." />
      <DemoCard>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Alert variant="success" title="Listing publicado" desc="Tu agencia ya es visible para compradores verificados en Arroba." dismissible />
          <Alert variant="info" title="NDA requerido" desc="Este listing requiere firma de NDA antes de acceder al dossier completo." />
          <Alert variant="warning" title="Documentación incompleta" desc="Falta adjuntar el P&L de los últimos 3 ejercicios para verificar el listing." dismissible />
          <Alert variant="error" title="Error al guardar" desc="No se pudo guardar el borrador. Comprueba tu conexión e inténtalo de nuevo." dismissible />
        </div>
      </DemoCard>
    </div>
  );
}

/* ─── Navigation ──────────────────────────────────────────────── */
function NavigationSection() {
  const [activeTab, setActiveTab] = React.useState('listings');
  const tabs = [
    { id: 'listings', label: 'Listings' },
    { id: 'deals', label: 'Mis deals' },
    { id: 'watchlist', label: 'Watchlist' },
    { id: 'insights', label: 'Insights' },
  ];
  return (
    <div>
      <CompSectionHeader title="Navigation" desc="Top nav de la plataforma y tabs de sección. El rojo marca el estado activo." />

      {/* Top nav */}
      <DemoCard style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 56, background: '#0C0C0E', borderBottom: '1px solid #2E2E2C' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-.01em' }}>
              <span style={{ color: '#E8001D' }}>/</span>rrob<span style={{ color: '#E8001D' }}>.</span>
            </div>
            <nav style={{ display: 'flex', gap: 4 }}>
              {['Explorar', 'Vender', 'Cómo funciona', 'Recursos'].map((item, i) => (
                <a key={item} href="#" style={{
                  padding: '8px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                  color: i === 0 ? '#fff' : '#858580',
                  background: i === 0 ? 'rgba(255,255,255,.08)' : 'transparent',
                  textDecoration: 'none', transition: 'color .15s',
                }}>{item}</a>
              ))}
            </nav>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Btn variant="ghost" size="sm">Iniciar sesión</Btn>
            <Btn variant="primary" size="sm">Publicar agencia</Btn>
          </div>
        </div>
      </DemoCard>

      {/* Tabs */}
      <DemoCard>
        <div style={{ display: 'flex', gap: 0, borderBottom: '1.5px solid var(--border)', marginBottom: 20 }}>
          {tabs.map(t => (
            <div key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '10px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              color: activeTab === t.id ? '#E8001D' : 'var(--text-muted)',
              borderBottom: `2px solid ${activeTab === t.id ? '#E8001D' : 'transparent'}`,
              marginBottom: -1.5, transition: 'color .15s',
            }}>{t.label}</div>
          ))}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Contenido de <strong style={{ color: 'var(--text)' }}>{tabs.find(t => t.id === activeTab)?.label}</strong>
        </div>
      </DemoCard>
    </div>
  );
}

/* ─── Data Table ──────────────────────────────────────────────── */
function DataTableSection() {
  const rows = [
    { name: 'Creatividad Estratégica', sector: 'Madtech', revenue: '2.4M €', asking: '4.8M €', status: 'Activo', match: '94%' },
    { name: 'Performance Lab', sector: 'Performance', revenue: '980K €', asking: '1.8M €', status: 'En proceso', match: '87%' },
    { name: 'Brand Stories', sector: 'Branding', revenue: '420K €', asking: '750K €', status: 'Revisión', match: '72%' },
    { name: 'SEO Iberia', sector: 'SEO/Content', revenue: '1.1M €', asking: '2.0M €', status: 'Activo', match: '68%' },
  ];
  const [sortCol, setSortCol] = React.useState(null);
  const statusVariant = { 'Activo': 'success', 'En proceso': 'info', 'Revisión': 'warning' };

  return (
    <div>
      <CompSectionHeader title="Data Table" desc="Tabla de listings con sorting, badges de estado y match score." />
      <DemoCard style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
          <thead>
            <tr style={{ borderBottom: '1.5px solid var(--border)' }}>
              {['Agencia', 'Sector', 'Revenue', 'Valoración', 'Estado', 'Match'].map(col => (
                <th key={col} onClick={() => setSortCol(col)} style={{
                  padding: '12px 20px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '.08em', color: sortCol === col ? '#E8001D' : 'var(--text-subtle)',
                  textAlign: 'left', cursor: 'pointer', userSelect: 'none',
                  background: 'var(--surface-2)',
                }}>
                  {col} {sortCol === col ? '↑' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', transition: 'background .1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
              >
                <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{row.name}</td>
                <td style={{ padding: '14px 20px' }}><Badge variant="brand" size="sm">{row.sector}</Badge></td>
                <td style={{ padding: '14px 20px', fontSize: 14, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{row.revenue}</td>
                <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600, color: '#E8001D', fontVariantNumeric: 'tabular-nums' }}>{row.asking}</td>
                <td style={{ padding: '14px 20px' }}><Badge variant={statusVariant[row.status]} dot size="sm">{row.status}</Badge></td>
                <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{row.match}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DemoCard>
    </div>
  );
}

// Export all
Object.assign(window, {
  ButtonsSection, FormControlsSection, BadgesSection,
  CardsSection, AlertsSection, NavigationSection, DataTableSection,
  Badge, Btn,
});
