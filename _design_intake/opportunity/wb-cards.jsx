// arroba.com — Workbench Engine · tarjetas (prioridad, feed, oportunidades)

/* ✦ marcador IA */
function Sparkle({ style, size = 12 }) {
  return <span style={{ color: '#E8001D', fontSize: size, fontWeight: 700, lineHeight: 1, flexShrink: 0, ...style }}>✦</span>;
}
function PrimaryBtn({ children, onClick }) {
  const [h, setH] = React.useState(false);
  return <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 9, border: 'none', background: h ? '#C50019' : '#E8001D', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', minHeight: 44 }}>{children}</button>;
}
function SecondaryBtn({ children, onClick }) {
  const [h, setH] = React.useState(false);
  return <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 9, border: '1px solid var(--border-strong)', background: h ? 'var(--surface-2)' : 'var(--surface)', color: 'var(--text)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', minHeight: 44 }}>{children}</button>;
}

const PRIO = {
  alta:  { label: 'Prioridad alta',  c: '#E8001D', bg: 'rgba(232,0,29,.07)', bd: 'rgba(232,0,29,.22)' },
  media: { label: 'Prioridad media', c: '#D97708', bg: '#FEF3E2', bd: '#FCD9A3' },
  baja:  { label: 'Prioridad baja',  c: 'var(--text-muted)', bg: 'var(--surface-2)', bd: 'var(--border)' },
};

/* Pequeño avatar de iniciales */
function Ava({ id, size = 22, ring }) {
  const colors = { AM: '#E8001D', F: '#2164E3', J: '#1A8A4A' };
  return (
    <span style={{ width: size, height: size, borderRadius: '50%', background: colors[id] || '#636360', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.42, fontWeight: 700, fontFamily: 'var(--font-display)', flexShrink: 0, boxShadow: ring ? '0 0 0 2px var(--surface)' : 'none' }}>{id}</span>
  );
}

/* ── Detalle según escenario (lo que el Copilot ha preparado) ── */
function PriorityDetail({ d, scenario }) {
  if (d.kind === 'qa') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 7 }}>Pregunta recibida</div>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 11, padding: '13px 15px' }}>
            <div style={{ fontSize: 14.5, color: 'var(--text)', lineHeight: 1.5, fontWeight: 500 }}>“{d.question}”</div>
            <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 7 }}>{d.from}</div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 9 }}>Documentos encontrados</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {d.docs.map(doc => (
              <div key={doc} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: 'var(--text)' }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#E8F5EE', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><OPIcon name="check" size={11} color="#1A8A4A" sw={2.5}/></span>
                {doc}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Respuesta sugerida</span>
            <Sparkle/>
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: '#1A8A4A', display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1A8A4A' }}></span>Confianza {d.confidence}</span>
          </div>
          <div style={{ border: '1px solid rgba(232,0,29,.2)', background: 'rgba(232,0,29,.03)', borderRadius: 11, padding: '13px 15px', fontSize: 13.5, color: 'var(--text)', lineHeight: 1.6 }}>{d.answer}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <PrimaryBtn>Enviar respuesta</PrimaryBtn>
          <SecondaryBtn>Revisar y editar</SecondaryBtn>
        </div>
      </div>
    );
  }

  if (d.kind === 'oferta') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 4 }}>{d.valuationNote}</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: '#E8001D', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{d.valuation}</div>
          </div>
          <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {d.terms.map(t => (
              <div key={t.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t.l}</span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{t.v}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 11, padding: '12px 14px' }}>
          <Sparkle/>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{d.bench}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <PrimaryBtn>Revisar oferta</PrimaryBtn>
          <SecondaryBtn>Comparar con mercado</SecondaryBtn>
        </div>
      </div>
    );
  }

  if (d.kind === 'dataroom') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {d.stats.map(s => (
            <div key={s.l} style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 11, padding: '12px 14px' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.c, fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#D97708', marginBottom: 9 }}>Posibles riesgos detectados</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {d.risks.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', background: '#FEF3E2', border: '1px solid #FCD9A3', borderRadius: 10, padding: '11px 13px' }}>
                <OPIcon name="bell" size={15} color="#D97708"/>
                <span style={{ fontSize: 13, color: '#92540A', lineHeight: 1.5 }}>{r}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <PrimaryBtn>Abrir Data Room</PrimaryBtn>
          <SecondaryBtn>Ver borradores</SecondaryBtn>
        </div>
      </div>
    );
  }

  if (d.kind === 'reunion') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 7 }}>{d.investor}</div>
          <div style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>{d.thesis}</div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Puntos clave para la reunión</span>
            <Sparkle/>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {d.points.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13.5, color: 'var(--text)', lineHeight: 1.5 }}>
                <span style={{ width: 19, height: 19, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700, color: '#E8001D', flexShrink: 0 }}>{i + 1}</span>
                {p}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <PrimaryBtn>Preparar reunión</PrimaryBtn>
          <SecondaryBtn>Ver perfil del inversor</SecondaryBtn>
        </div>
      </div>
    );
  }

  if (d.kind === 'mandato') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {d.stats.map(s => (
            <div key={s.l} style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 11, padding: '12px 14px' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.c, fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', background: 'rgba(232,0,29,.03)', border: '1px solid rgba(232,0,29,.2)', borderRadius: 11, padding: '12px 14px' }}>
          <Sparkle/>
          <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55 }}>{d.note}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <PrimaryBtn>Continuar mandato</PrimaryBtn>
          <SecondaryBtn>Ver respuesta sugerida</SecondaryBtn>
        </div>
      </div>
    );
  }

  if (d.kind === 'team') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {d.items.map((it, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <Ava id={it.avatar} size={30}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, color: 'var(--text)' }}><strong>{it.who}</strong> {it.what}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-subtle)' }}>{it.when}</div>
              </div>
              <OPIcon name="check" size={15} color="#1A8A4A"/>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 9, alignItems: 'center', background: 'rgba(232,0,29,.03)', border: '1px solid rgba(232,0,29,.2)', borderRadius: 11, padding: '12px 14px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E8001D', flexShrink: 0 }}></span>
          <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.45 }}>{d.approval}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <PrimaryBtn>Revisar cambios</PrimaryBtn>
          <SecondaryBtn>Aprobar envío</SecondaryBtn>
        </div>
      </div>
    );
  }
  return null;
}

/* ── Tarjeta de prioridad (expandible) ── */
function PriorityCard({ p, open, onToggle }) {
  const pr = PRIO[p.priority];
  return (
    <div style={{ background: 'var(--surface)', border: `1px solid ${open ? pr.bd : 'var(--border)'}`, borderRadius: 16, overflow: 'hidden', transition: 'border-color .15s' }}>
      {/* accent line for high priority */}
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '18px 20px', cursor: 'pointer', position: 'relative' }}>
        {p.priority === 'alta' && <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#E8001D' }}></span>}
        <div style={{ width: 38, height: 38, borderRadius: 10, background: pr.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
          <OPIcon name={p.icon} size={18} color={pr.c}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: pr.c, background: pr.bg, border: `1px solid ${pr.bd}`, padding: '2px 8px', borderRadius: 5 }}>{pr.label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{p.opp}</span>
            <span style={{ fontSize: 11.5, color: 'var(--text-subtle)' }}>· {p.timeAgo}</span>
          </div>
          <h3 style={{ fontSize: 16.5, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', letterSpacing: '-.01em', lineHeight: 1.3, marginBottom: 7 }}>{p.headline}</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Sparkle style={{ marginTop: 2 }}/>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0, maxWidth: 600 }}>{p.copilot}</p>
          </div>
        </div>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: pr.c, display: 'none' }} className="wb-action-inline">{p.action}</span>
          <span style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
            <OPIcon name="trending" size={0} color="transparent"/>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </span>
        </div>
      </div>
      {open && (
        <div style={{ padding: '4px 20px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ paddingTop: 18 }}><PriorityDetail d={p.detail} scenario={p.scenario}/></div>
        </div>
      )}
    </div>
  );
}

/* ── Fila del feed dinámico ── */
function FeedRow({ f }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 4px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <OPIcon name={f.icon} size={15} color="var(--text-muted)"/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, color: 'var(--text)', fontWeight: 500, lineHeight: 1.35 }}>{f.txt}</div>
        <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{f.detail} · {f.when}</div>
      </div>
      <button style={{ flexShrink: 0, fontSize: 12.5, fontWeight: 600, color: '#E8001D', background: hover ? 'rgba(232,0,29,.07)' : 'transparent', border: 'none', borderRadius: 7, padding: '6px 11px', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{f.action} →</button>
    </div>
  );
}

/* ── Card de oportunidad activa (nunca tabla) ── */
function OppWorkCard({ o }) {
  const pr = PRIO[o.priority];
  const [hover, setHover] = React.useState(false);
  return (
    <a href="Oportunidad.html" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'block', textDecoration: 'none', background: 'var(--surface)', border: `1px solid ${hover ? '#E8001D' : 'var(--border)'}`, borderRadius: 14, padding: '18px 20px', transition: 'border-color .12s, transform .12s', transform: hover ? 'translateY(-2px)' : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 11 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: pr.c, flexShrink: 0 }}></span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{o.type}</span>
        <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--text-subtle)' }}>{o.lastActivity}</span>
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', letterSpacing: '-.01em', lineHeight: 1.3, marginBottom: 14 }}>{o.name}</h3>

      {/* etapa */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{o.stage}</span>
          <span style={{ fontSize: 12, color: 'var(--text-subtle)', fontVariantNumeric: 'tabular-nums' }}>{o.stagePct}%</span>
        </div>
        <div style={{ height: 5, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: o.stagePct + '%', background: pr.c, borderRadius: 3 }}></div>
        </div>
      </div>

      {/* siguiente acción */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 9, marginBottom: 13 }}>
        <Sparkle/>
        <span style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 500 }}>{o.nextAction}</span>
      </div>

      {/* participantes + flecha */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {o.participants.map((p, i) => <span key={i} style={{ marginLeft: i ? -7 : 0 }}><Ava id={p} size={24} ring/></span>)}
        </div>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: hover ? '#E8001D' : 'var(--text-muted)' }}>Abrir →</span>
      </div>
    </a>
  );
}

Object.assign(window, { PriorityCard, FeedRow, OppWorkCard, Ava, PRIO, Sparkle, PrimaryBtn, SecondaryBtn });
