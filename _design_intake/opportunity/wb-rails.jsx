// arroba.com — Workbench Engine V3 · Left Rail + Copilot Rail

/* ── Sección del rail con título ── */
function RailSection({ title, children, mt = 22 }) {
  return (
    <div style={{ marginTop: mt }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-subtle)', padding: '0 10px', marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

/* Fila tipo Notion: label + contador */
function RailItem({ label, n, icon, active, accent, onClick, dot, when }) {
  const [h, setH] = React.useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 10px', borderRadius: 7, cursor: 'pointer', background: active ? 'var(--surface-2)' : h ? 'var(--surface-2)' : 'transparent', transition: 'background .12s' }}>
      {icon && <OPIcon name={icon} size={14} color={active ? '#E8001D' : 'var(--text-subtle)'}/>}
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent ? '#E8001D' : 'var(--text-subtle)', flexShrink: 0 }}></span>}
      <span style={{ flex: 1, fontSize: 13, fontWeight: active ? 600 : 500, color: active ? 'var(--text)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      {when && <span style={{ fontSize: 10.5, color: 'var(--text-subtle)', flexShrink: 0 }}>{when}</span>}
      {n != null && <span style={{ fontSize: 11, fontWeight: 700, color: accent ? '#E8001D' : 'var(--text-subtle)', background: accent ? 'rgba(232,0,29,.08)' : 'var(--surface-2)', padding: '1px 7px', borderRadius: 9, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{n}</span>}
    </div>
  );
}

function LeftRail({ active, setActive }) {
  const r = window.WB_DATA.rail;
  return (
    <aside className="wb-leftrail" style={{ alignSelf: 'start', position: 'sticky', top: 74, maxHeight: 'calc(100vh - 90px)', overflowY: 'auto', paddingRight: 6 }}>
      <RailSection title="Mis oportunidades" mt={0}>
        {r.oportunidades.map(o => <RailItem key={o.id} label={o.label} n={o.n} dot accent={o.accent} active={active === o.id} onClick={() => setActive(o.id)}/>)}
      </RailSection>
      <RailSection title="Tipo">
        {r.tipos.map(t => <RailItem key={t.id} label={t.label} n={t.n} icon={t.icon} active={active === t.id} onClick={() => setActive(t.id)}/>)}
      </RailSection>
      <RailSection title="Favoritos">
        {r.favoritos.map((f, i) => <RailItem key={i} label={f.label} icon={f.icon}/>)}
      </RailSection>
      <RailSection title="Actividad reciente">
        {r.reciente.map((f, i) => <RailItem key={i} label={f.label} when={f.when}/>)}
      </RailSection>
      <RailSection title="Seguimiento">
        {r.seguimiento.map(s => <RailItem key={s.id} label={s.label} n={s.n} icon={s.icon} active={active === s.id} onClick={() => setActive(s.id)}/>)}
      </RailSection>
    </aside>
  );
}

/* ── COPILOT RAIL ── */
function CopilotSection({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function CopilotRail() {
  const c = window.WB_DATA.copilot;
  return (
    <aside className="wb-copilotrail" style={{ alignSelf: 'start', position: 'sticky', top: 74, maxHeight: 'calc(100vh - 90px)', overflowY: 'auto' }}>
      {/* Identidad del Copilot + buscador integrado */}
      <div style={{ background: 'linear-gradient(135deg, #0C0C0E, #1A1A18)', borderRadius: 14, padding: '15px 16px 16px', position: 'relative', overflow: 'hidden', marginBottom: 18 }}>
        <span style={{ position: 'absolute', right: -8, top: -18, fontSize: 84, color: 'rgba(232,0,29,.1)', fontWeight: 800, lineHeight: 1, pointerEvents: 'none' }}>✦</span>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 800 }}>✦</div>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>Arroba Copilot</span>
          </div>
          <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,.6)', lineHeight: 1.45, margin: '0 0 13px' }}>Tu jefe de gabinete. Trabaja en tus operaciones aunque no estés.</p>
          {/* Buscador / composer integrado en el cuadro negro */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px', borderRadius: 10, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)', cursor: 'text' }}>
            <OPIcon name="search" size={14} color="rgba(255,255,255,.55)" sw={2}/>
            <span style={{ flex: 1, fontSize: 12.5, color: 'rgba(255,255,255,.55)' }}>Pregunta a Arroba Copilot…</span>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: '#E8001D', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff' }}>↑</span>
          </div>
        </div>
      </div>

      <CopilotSection title="En qué estoy trabajando">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {c.working.map((w, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text)' }}>
              <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#E8F5EE', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><OPIcon name="check" size={10} color="#1A8A4A" sw={2.5}/></span>
              {w}
            </div>
          ))}
        </div>
      </CopilotSection>

      <CopilotSection title="Próximas acciones">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {c.nextActions.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: a.urgent ? '#E8001D' : 'var(--text-subtle)', flexShrink: 0, marginTop: 5 }}></span>
              <span>{a.txt} <span style={{ color: 'var(--text-subtle)' }}>· {a.opp}</span></span>
            </div>
          ))}
        </div>
      </CopilotSection>

      <CopilotSection title="Actividad del equipo">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {c.team.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Ava id={t.avatar} size={22}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.35 }}><strong style={{ fontWeight: 600 }}>{t.who}</strong> {t.what}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-subtle)' }}>{t.when}</div>
              </div>
            </div>
          ))}
        </div>
      </CopilotSection>

      <CopilotSection title="Memoria">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {c.memoria.map((m, i) => (
            <div key={i} style={{ paddingBottom: 8, borderBottom: i < c.memoria.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 2 }}>{m.type}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.35 }}>{m.label}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-subtle)', marginTop: 1 }}>{m.when}</div>
            </div>
          ))}
        </div>
      </CopilotSection>

      <CopilotSection title="Acciones rápidas">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
          {c.quickActions.map((q, i) => (
            <button key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 10px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#E8001D'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
              <OPIcon name={q.icon} size={13} color="#E8001D"/> <span style={{ lineHeight: 1.2 }}>{q.label}</span>
            </button>
          ))}
        </div>
      </CopilotSection>
    </aside>
  );
}

Object.assign(window, { LeftRail, CopilotRail, RailItem, RailSection });
