// arroba.com — Oportunidad: empresas, compradores, inversores, señales, plan, actividad

/* ══ EMPRESAS ══════════════════════════════════════════════ */
function SecEmpresas({ live }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Empresas objetivo</h2>
        <span style={{ fontSize: 13, color: 'var(--text-subtle)' }}>{live.empresas.length} compañías que forman la plataforma</span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18, maxWidth: 640, lineHeight: 1.5 }}>Cada compañía tiene un rol dentro de la tesis. Arroba prioriza por Deal Score —probabilidad de interés transaccional— y valoración estimada.</p>
      <Card pad={0}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 0, padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          {['Compañía', 'Rol en la tesis', 'Facturación', 'EBITDA', 'Deal · Valoración'].map((h, i) => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle)', textAlign: i >= 2 && i < 4 ? 'right' : 'left' }}>{h}</div>
          ))}
        </div>
        {live.empresas.map((c, i) => (
          <div key={c.name} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 0, alignItems: 'center', padding: '15px 20px', borderBottom: i < live.empresas.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', transition: 'background .12s', position: 'relative' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
            {c.isNew && <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#E8001D' }}></span>}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{c.name}</span>
                {c.isNew && <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: '#E8001D', padding: '1px 6px', borderRadius: 3, letterSpacing: '.04em' }}>NUEVA</span>}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginTop: 2 }}>{c.loc} · {c.emp} empleados · {c.signal}</div>
            </div>
            <div><span style={{ fontSize: 11, fontWeight: 600, color: '#E8001D', background: 'rgba(232,0,29,.07)', padding: '3px 9px', borderRadius: 5, border: '1px solid rgba(232,0,29,.15)' }}>{c.role}</span></div>
            <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{c.revenue}</div>
            <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{c.ebitda} <span style={{ color: 'var(--text-subtle)', fontSize: 11 }}>({c.margin})</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'flex-end', minWidth: 130 }}>
              <ScoreChip v={c.dealScore} label="Deal"/>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{c.valuation}</div>
                <div style={{ fontSize: 9, color: 'var(--text-subtle)', marginTop: 2 }}>Valoración</div>
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ══ COMPRADORES ═══════════════════════════════════════════ */
function ActorList({ title, sub, items, render }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{title}</h2>
        <span style={{ fontSize: 13, color: 'var(--text-subtle)' }}>{sub}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>{items.map(render)}</div>
    </div>
  );
}

function SecCompradores({ live }) {
  return (
    <ActorList title="Compradores potenciales" sub={`${live.compradores.length} entidades que podrían adquirir la plataforma`} items={live.compradores}
      render={(b) => (
        <Card key={b.name} pad={18} style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', borderColor: b.isNew ? '#E8001D' : 'var(--border)' }}>
          {b.isNew && <span style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, background: '#E8001D', borderRadius: 2 }}></span>}
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><OPIcon name="team" size={19} color="#E8001D"/></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{b.name}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '1px 7px', borderRadius: 4, border: '1px solid var(--border)' }}>{b.type}</span>
              {b.isNew && <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: '#E8001D', padding: '1px 6px', borderRadius: 3 }}>NUEVO</span>}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>{b.reason}</div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 3 }}>{b.deals} adquisiciones · Ticket {b.ticket} · Última: {b.last}</div>
          </div>
          <FitBadge fit={b.fit}/>
        </Card>
      )}/>
  );
}

/* ══ INVERSORES ════════════════════════════════════════════ */
function SecInversores({ live }) {
  return (
    <ActorList title="Inversores compatibles" sub={`${live.inversores.length} fondos que podrían financiar el roll-up`} items={live.inversores}
      render={(v) => (
        <Card key={v.name} pad={18} style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', borderColor: v.isNew ? '#E8001D' : 'var(--border)' }}>
          {v.isNew && <span style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, background: '#E8001D', borderRadius: 2 }}></span>}
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><OPIcon name="euro" size={19} color="#E8001D"/></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{v.name}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '1px 7px', borderRadius: 4, border: '1px solid var(--border)' }}>{v.type}</span>
              {v.isNew && <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: '#E8001D', padding: '1px 6px', borderRadius: 3 }}>NUEVO</span>}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>{v.focus}</div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 3 }}>AUM {v.aum} · Última actividad: {v.last}</div>
          </div>
          <FitBadge fit={v.fit}/>
        </Card>
      )}/>
  );
}

/* ══ SEÑALES ═══════════════════════════════════════════════ */
function SecSenales({ live }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 18 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Señales relevantes</h2>
        <span style={{ fontSize: 13, color: 'var(--text-subtle)' }}>Eventos detectados en los últimos 90 días</span>
      </div>
      <div style={{ position: 'relative', paddingLeft: 24 }}>
        <div style={{ position: 'absolute', left: 5, top: 6, bottom: 6, width: 2, background: 'var(--border)' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {live.senales.map((s, i) => {
            const c = window.SIGNAL_C[s.type] || window.SIGNAL_C.neutral;
            return (
              <div key={i} style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: -23, top: 4, width: 12, height: 12, borderRadius: '50%', background: c.dot, border: '2px solid var(--bg)', boxShadow: s.isNew ? `0 0 0 4px ${c.dot}33` : 'none' }}></div>
                <Card pad={16} style={{ background: c.bg, border: `1px solid ${c.bd}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: c.tx }}>{s.label}</span>
                        {s.isNew && <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: '#E8001D', padding: '1px 6px', borderRadius: 3 }}>NUEVA</span>}
                      </div>
                      <div style={{ fontSize: 12.5, color: c.tx, opacity: .85, lineHeight: 1.45 }}>{s.detail}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: c.dot, background: `${c.dot}1e`, padding: '2px 7px', borderRadius: 3, marginBottom: 4 }}>{s.family}</div>
                      <div style={{ fontSize: 11, color: c.tx, opacity: .6 }}>{s.date}</div>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══ PLAN DE ACCIÓN ════════════════════════════════════════ */
function SecPlan({ D }) {
  const statusMap = { done: { c: '#1A8A4A', l: 'Completado' }, current: { c: '#E8001D', l: 'En curso' }, pending: { c: 'var(--text-subtle)', l: 'Pendiente' } };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 18 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Plan de acción</h2>
        <span style={{ fontSize: 13, color: 'var(--text-subtle)' }}>Pasos recomendados por Arroba para capturar la oportunidad</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {D.plan.map((p) => {
          const st = statusMap[p.status];
          return (
            <Card key={p.step} pad={18} style={{ display: 'flex', alignItems: 'center', gap: 16, border: p.status === 'current' ? '1.5px solid rgba(232,0,29,.25)' : '1px solid var(--border)' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: p.status === 'done' ? '#1A8A4A' : p.status === 'current' ? '#E8001D' : 'var(--surface-2)', border: p.status === 'pending' ? '1px solid var(--border-strong)' : 'none' }}>
                {p.status === 'done' ? <OPIcon name="check" size={15} color="#fff" sw={2.5}/> : <span style={{ fontSize: 13, fontWeight: 700, color: p.status === 'current' ? '#fff' : 'var(--text-subtle)' }}>{p.step}</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{p.title}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.45 }}>{p.desc}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: st.c }}>{st.l}</div>
                <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>{p.owner}</div>
              </div>
              {p.status === 'current' && <button style={{ padding: '9px 16px', borderRadius: 9, border: 'none', background: '#E8001D', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>Empezar</button>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ══ ACTIVIDAD ═════════════════════════════════════════════ */
function SecActividad({ live }) {
  const kindIcon = { create: 'plan', auto: 'signal', check: 'check', discover: 'trending' };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 18 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Actividad</h2>
        <span style={{ fontSize: 13, color: 'var(--text-subtle)' }}>Todo lo que ocurre dentro de la oportunidad</span>
      </div>
      <Card pad={0}>
        {live.actividad.map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < live.actividad.length - 1 ? '1px solid var(--border)' : 'none', position: 'relative' }}>
            {a.isNew && <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#E8001D' }}></span>}
            <div style={{ width: 30, height: 30, borderRadius: 8, background: a.actor.includes('✦') ? 'rgba(232,0,29,.08)' : 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><OPIcon name={kindIcon[a.kind] || 'activity'} size={14} color="#E8001D"/></div>
            <div style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>
              <strong style={{ fontWeight: 700 }}>{a.actor}</strong> <span style={{ color: 'var(--text-muted)' }}>{a.action}</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', flexShrink: 0 }}>{a.time}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

Object.assign(window, { SecEmpresas, SecCompradores, SecInversores, SecSenales, SecPlan, SecActividad });
