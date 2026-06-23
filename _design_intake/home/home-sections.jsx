// arroba.com — Home sections (matched to reference layout)

function Card({ children, style, pad = 20 }) {
  return <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: pad, ...style }}>{children}</div>;
}

function Eyebrow({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#E8001D', marginBottom: 6 }}>
      {children}
    </div>);

}

function SeeAll({ label = 'Ver todas' }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#E8001D', cursor: 'pointer' }}>
      {label} <HIcon name="arrowRight" size={12} color="#E8001D" sw={2} />
    </span>);

}

/* ══ HERO (left) ═══════════════════════════════════════════ */
function LiveCount() {
  const n = useCountUp(3386432, 1800);
  return n.toLocaleString('es-ES');
}

function Hero() {
  const { examples } = window.HOME_DATA;
  const [q, setQ] = React.useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#E8001D', marginBottom: 18 }}>
        Inteligencia empresarial en España
      </div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 700, lineHeight: 1.04, letterSpacing: '-.02em', color: 'var(--text)', marginBottom: 18 }}>
        Toda la información<br />empresarial.<br />
        <span style={{ color: '#E8001D' }}>En un solo lugar.</span>
      </h1>
      <p style={{ fontSize: 16, lineHeight: 1.6, maxWidth: 440, marginBottom: 24, color: "rgb(12, 12, 14)" }}>Analiza cualquier empresa, valora su potencial y descubre oportunidades de <span style={{ color: '#E8001D', fontWeight: 600 }}>compra-venta</span> con datos reales y actualizados en tiempo real.

      </p>

      {/* Live company count — magnificence */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16, alignSelf: 'flex-start' }}>
        <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8, flexShrink: 0 }}>
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#1A8A4A', animation: 'ping 1.8s cubic-bezier(0,0,.2,1) infinite' }}></span>
          <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: '#1A8A4A' }}></span>
        </span>
        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          <span style={{ fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em' }}><LiveCount/></span> empresas monitorizadas ahora mismo
        </span>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 10, maxWidth: 540, marginBottom: 16 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', background: 'var(--surface)', border: '1.5px solid var(--border-strong)', borderRadius: 11, transition: 'border-color .15s, box-shadow .15s' }}
        onMouseEnter={(e) => {e.currentTarget.style.borderColor = '#E8001D';}}
        onMouseLeave={(e) => {e.currentTarget.style.borderColor = 'var(--border-strong)';}}>
          <span style={{ fontSize: 16, color: '#E8001D' }}>✦</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca una empresa, sector, CIF, propietario..."
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: 'var(--text)', padding: '15px 0', fontFamily: 'var(--font-body)' }} />
        </div>
        <button style={{ padding: '0 26px', borderRadius: 11, border: 'none', background: '#E8001D', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
          Buscar
        </button>
      </div>

      {/* Examples */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>Ejemplos:</span>
        {examples.map((ex) =>
        <span key={ex} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)', padding: '5px 11px', borderRadius: 20, cursor: 'pointer', transition: 'all .12s' }}
        onMouseEnter={(e) => {e.currentTarget.style.borderColor = '#E8001D';e.currentTarget.style.color = '#E8001D';}}
        onMouseLeave={(e) => {e.currentTarget.style.borderColor = 'var(--border)';e.currentTarget.style.color = 'var(--text-muted)';}}>
            {ex}
          </span>
        )}
      </div>
    </div>);

}

/* ══ PANORAMA card (right) ═════════════════════════════════ */
function Panorama() {
  const { panorama, evolution, dynamicSectors } = window.HOME_DATA;
  return (
    <Card pad={22} style={{ boxShadow: '0 8px 40px rgba(12,12,14,.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Panorama empresarial de España</h3>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          Últimos 30 días <span style={{ fontSize: 8 }}>▼</span>
        </span>
      </div>

      {/* 4 mini KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
        {panorama.map((k) =>
        <div key={k.label} style={{ padding: '12px', background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
              <HIcon name={k.icon} size={13} color="var(--text-subtle)" sw={1.75} />
              <span style={{ fontSize: 10, color: 'var(--text-subtle)', fontWeight: 500, lineHeight: 1.2 }}>{k.label}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em' }}>{k.value}</div>
            <div style={{ fontSize: 10, marginTop: 3 }}>
              <span style={{ color: k.trend === 'up' ? '#1A8A4A' : '#E8001D', fontWeight: 600 }}>{k.delta}</span>
              <span style={{ color: 'var(--text-subtle)' }}> {k.sub}</span>
            </div>
          </div>
        )}
      </div>

      {/* Chart + dynamic sectors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>Evolución de empresas (últimos 12 meses)</div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 6 }}>
            {[['Nuevas empresas', '#0C0C0E'], ['Empresas cerradas', '#ADADAA'], ['Empresas activas', '#E8001D']].map(([l, c]) =>
            <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-muted)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: c }}></span>{l}
              </span>
            )}
          </div>
          <EvolutionChart data={evolution} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>Sectores más dinámicos</div>
          {dynamicSectors.map((s) =>
          <div key={s.rank} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)', width: 12 }}>{s.rank}</span>
              <span style={{ fontSize: 12, color: 'var(--text)', flex: 1, lineHeight: 1.3 }}>{s.name}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#1A8A4A' }}>{s.delta}</span>
            </div>
          )}
          <div style={{ marginTop: 12 }}><SeeAll label="Ver todos los sectores" /></div>
        </div>
      </div>
    </Card>);

}

/* ══ MACRO KPI ROW (7 cards) ═══════════════════════════════ */
function MacroKpis() {
  const { macroKpis } = window.HOME_DATA;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12 }}>
      {macroKpis.map((k) =>
      <Card key={k.label} pad={16}>
          <HIcon name={k.icon} size={20} color="var(--text-subtle)" sw={1.6} />
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em', marginTop: 12, lineHeight: 1, fontFamily: 'var(--font-display)' }}>{k.value}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.3 }}>{k.label}</div>
          <div style={{ fontSize: 10, marginTop: 6 }}>
            <span style={{ color: k.trend === 'up' ? '#1A8A4A' : '#E8001D', fontWeight: 600 }}>{k.delta}</span>
            <span style={{ color: 'var(--text-subtle)' }}> {k.sub}</span>
          </div>
        </Card>
      )}
    </div>);

}

/* ══ ACTION CTAs (always present) ══════════════════════════ */
function ActionCTAs() {
  const actions = [
  { icon: 'search', label: 'Analizar', sub: 'Consulta una empresa', href: 'Company Profile.html', primary: false },
  { icon: 'euro', label: 'Valorar', sub: 'Estimación al instante', href: '#', primary: false },
  { icon: 'deal', label: 'Comprar', sub: 'Explora oportunidades', href: '#', primary: false },
  { icon: 'trending', label: 'Vender', sub: 'Pon tu empresa a la venta', href: '#', primary: false },
  { icon: 'agency', label: 'Registra tu empresa', sub: 'Dar de alta', href: '#', primary: true }];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
      {actions.map((a) =>
      <a key={a.label} href={a.href} style={{ textDecoration: 'none' }}>
          <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px', borderRadius: 14, cursor: 'pointer',
          background: a.primary ? '#E8001D' : 'var(--surface)',
          border: a.primary ? '1px solid #E8001D' : '1px solid var(--border)',
          transition: 'transform .12s, box-shadow .12s, border-color .12s'
        }}
        onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-2px)';e.currentTarget.style.boxShadow = '0 8px 24px rgba(12,12,14,.1)';if (!a.primary) e.currentTarget.style.borderColor = '#E8001D';}}
        onMouseLeave={(e) => {e.currentTarget.style.transform = '';e.currentTarget.style.boxShadow = '';if (!a.primary) e.currentTarget.style.borderColor = 'var(--border)';}}>
          
            <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: a.primary ? 'rgba(255,255,255,.18)' : 'var(--surface-2)',
            border: a.primary ? 'none' : '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
              <HIcon name={a.icon} size={18} color={a.primary ? '#fff' : '#E8001D'} sw={1.75} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: a.primary ? '#fff' : 'var(--text)', lineHeight: 1.2, whiteSpace: 'nowrap' }}>{a.label}</div>
              <div style={{ fontSize: 10.5, color: a.primary ? 'rgba(255,255,255,.75)' : 'var(--text-subtle)', marginTop: 3, lineHeight: 1.3 }}>{a.sub}</div>
            </div>
          </div>
        </a>
      )}
    </div>);

}

/* ══ MAP SECTION (bottom, split card — replaces network) ═══ */
function MapSection() {
  const { provinces } = window.HOME_DATA;
  return (
    <Card pad={0} style={{ overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr' }}>
        {/* Left: text + top provincias */}
        <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Eyebrow>Mapa económico</Eyebrow>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Mapa empresarial de España</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 18, maxWidth: 320 }}>
            Actividad empresarial por provincia: creación, cierres, operaciones y sectores calientes en tiempo real.
          </p>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Top provincias (nuevas empresas)</div>
            {provinces.map((p) =>
            <div key={p.rank} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)', maxWidth: 300 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)', width: 10 }}>{p.rank}</span>
                <span style={{ fontSize: 12, color: 'var(--text)', flex: 1 }}>{p.name}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{p.value}</span>
              </div>
            )}
          </div>
          <a href="Mapa Empresarial.html" style={{ alignSelf: 'flex-start', textDecoration: 'none' }}>
            <button style={{ padding: '9px 16px', borderRadius: 9, border: '1.5px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              Ver mapa completo <HIcon name="arrowRight" size={13} color="var(--text)" sw={2} />
            </button>
          </a>
        </div>
        {/* Right: map visual */}
        <div style={{ background: 'var(--surface-2)', minHeight: 320, position: 'relative', borderLeft: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 40px' }}>
          <div style={{ width: '100%', maxWidth: 360 }}>
            <SpainMap provinces={provinces} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, maxWidth: 220, marginInline: 'auto' }}>
              <span style={{ fontSize: 9, color: 'var(--text-subtle)' }}>Alta</span>
              <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'linear-gradient(90deg, #E8001D, rgba(232,0,29,.12))' }}></div>
              <span style={{ fontSize: 9, color: 'var(--text-subtle)' }}>Baja</span>
            </div>
          </div>
        </div>
      </div>
    </Card>);

}

/* ══ 4-COLUMN: Map / ForSale / Valuations / Trends ═════════ */
function MapColumn() {
  const { provinces } = window.HOME_DATA;
  return (
    <Card style={{ display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>Mapa empresarial de España</h3>
      <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 14 }}>Actividad empresarial por provincia</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 12, alignItems: 'center' }}>
        <div>
          <SpainMap provinces={provinces} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <span style={{ fontSize: 9, color: 'var(--text-subtle)' }}>Alta</span>
            <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'linear-gradient(90deg, #E8001D, rgba(232,0,29,.12))' }}></div>
            <span style={{ fontSize: 9, color: 'var(--text-subtle)' }}>Baja</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Top provincias (nuevas)</div>
          {provinces.map((p) =>
          <div key={p.rank} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)', width: 10 }}>{p.rank}</span>
              <span style={{ fontSize: 12, color: 'var(--text)', flex: 1 }}>{p.name}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{p.value}</span>
            </div>
          )}
          <div style={{ marginTop: 10 }}><SeeAll label="Ver mapa completo" /></div>
        </div>
      </div>
    </Card>);

}

function ForSaleColumn() {
  const { forSale } = window.HOME_DATA;
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <Eyebrow>Compra/Vende</Eyebrow>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Empresas en venta destacadas</h3>
        </div>
        <SeeAll />
      </div>
      {forSale.map((c, i) =>
      <div key={i} style={{ display: 'flex', gap: 12, padding: '11px 0', borderBottom: i < forSale.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}>
          <div style={{ width: 52, height: 52, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HIcon name="agency" size={20} color="var(--text-subtle)" sw={1.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{c.name}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#E8001D', fontVariantNumeric: 'tabular-nums' }}>{c.price}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', margin: '2px 0 5px' }}>{c.city}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '2px 7px', borderRadius: 4, border: '1px solid var(--border)' }}>{c.sector}</span>
              <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>EBITDA: {c.ebitda} · Fact.: {c.revenue}</span>
            </div>
          </div>
        </div>
      )}
      <div style={{ marginTop: 12 }}><SeeAll label="Ver todas las oportunidades" /></div>
    </Card>);

}

function ValuationsColumn() {
  const { valuations } = window.HOME_DATA;
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <Eyebrow>Valora</Eyebrow>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Últimas valoraciones</h3>
        </div>
        <SeeAll />
      </div>
      {valuations.map((v, i) =>
      <div key={i} style={{ display: 'flex', gap: 11, padding: '12px 0', borderBottom: i < valuations.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 13, color: '#E8001D' }}>✦</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{v.type}</div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{v.city}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--text-subtle)' }}>Valor estimado</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{v.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-subtle)' }}>{v.time}</div>
          </div>
        </div>
      )}
      <div style={{ marginTop: 12 }}><SeeAll label="Ver todas las valoraciones" /></div>
    </Card>);

}

function TrendColumn() {
  const { trendSectors } = window.HOME_DATA;
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <Eyebrow>Analiza</Eyebrow>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Sectores en tendencia</h3>
        </div>
        <SeeAll label="Ver todos" />
      </div>
      {trendSectors.map((s, i) =>
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: i < trendSectors.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HIcon name={s.icon} size={14} color="var(--text-muted)" sw={1.75} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text)', flex: 1, lineHeight: 1.3 }}>{s.name}</span>
          <Sparkline data={s.spark} color="#1A8A4A" w={56} h={22} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#1A8A4A', width: 44, textAlign: 'right' }}>{s.delta}</span>
        </div>
      )}
    </Card>);

}

/* ══ NETWORK ═══════════════════════════════════════════════ */
function NetworkSection() {
  const { network } = window.HOME_DATA;
  return (
    <Card pad={0} style={{ overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr' }}>
        <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Red empresarial</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 18, maxWidth: 320 }}>
            Explora relaciones entre empresas, administradores y grupos empresariales. Descubre estructuras de propiedad ocultas.
          </p>
          <button style={{ alignSelf: 'flex-start', padding: '9px 16px', borderRadius: 9, border: '1.5px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            Explorar red empresarial <HIcon name="arrowRight" size={13} color="var(--text)" sw={2} />
          </button>
        </div>
        <div style={{ background: 'var(--surface-2)', minHeight: 220, position: 'relative', borderLeft: '1px solid var(--border)' }}>
          <NetworkGraph network={network} />
          {/* Locked overlay hint */}
          <div style={{ position: 'absolute', bottom: 12, right: 16, fontSize: 10, color: 'var(--text-subtle)', background: 'var(--surface)', padding: '4px 9px', borderRadius: 6, border: '1px solid var(--border)' }}>
            Vista limitada · regístrate para explorar
          </div>
        </div>
      </div>
    </Card>);

}

/* ══ DARK CTA ══════════════════════════════════════════════ */
function CTABar() {
  return (
    <div style={{ background: '#0C0C0E', borderRadius: 16, padding: '28px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(232,0,29,.15)', border: '1px solid rgba(232,0,29,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <HIcon name="chartBar" size={24} color="#E8001D" sw={1.75} />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Accede a análisis completos y datos sin límites</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)' }}>Crea tu cuenta gratuita y comienza a tomar mejores decisiones hoy.</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button style={{ padding: '12px 22px', borderRadius: 10, border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Solicitar demo</button>
        <button style={{ padding: '12px 22px', borderRadius: 10, border: 'none', background: '#E8001D', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Crear cuenta gratuita</button>
      </div>
    </div>);

}

/* ══ FOOTER sources ════════════════════════════════════════ */
function FooterSources() {
  const { sources } = window.HOME_DATA;
  return (
    <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
        Datos oficiales. &nbsp;Tecnología avanzada. &nbsp;Decisiones inteligentes.
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 36, flexWrap: 'wrap', opacity: .5 }}>
        {sources.map((s) =>
        <span key={s} style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.02em' }}>{s}</span>
        )}
      </div>
    </div>);

}

Object.assign(window, { Hero, Panorama, MacroKpis, ActionCTAs, MapSection, MapColumn, ForSaleColumn, ValuationsColumn, TrendColumn, NetworkSection, CTABar, FooterSources });