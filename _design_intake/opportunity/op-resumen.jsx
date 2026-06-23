// arroba.com — Oportunidad: activation state + section views

/* ══ ACTIVATION STATE ══════════════════════════════════════ */
function ActivationState({ onDone }) {
  const D = window.OP_DATA;
  const steps = D.activation;
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    if (active >= steps.length) { const t = setTimeout(onDone, 700); return () => clearTimeout(t); }
    const t = setTimeout(() => setActive(a => a + 1), active === 0 ? 500 : 650);
    return () => clearTimeout(t);
  }, [active]);

  const pct = Math.min(100, Math.round((active / steps.length) * 100));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'radial-gradient(circle at 50% 30%, #1A1A18, #0C0C0E)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: 'min(560px, 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 11, background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', fontWeight: 800 }}>
            ✦
            <span style={{ position: 'absolute', inset: -4, borderRadius: 14, border: '1.5px solid rgba(232,0,29,.4)', animation: 'opPulse 1.4s ease-out infinite' }}></span>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#E8001D' }}>Activando oportunidad</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>Arroba está organizando la información</div>
          </div>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#fff', lineHeight: 1.2, letterSpacing: '-.01em', marginBottom: 32, textWrap: 'balance' }}>
          {D.meta.title}
        </h1>

        {/* progress bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,.1)', borderRadius: 2, marginBottom: 28, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: '#E8001D', borderRadius: 2, transition: 'width .5s cubic-bezier(.4,0,.2,1)' }}></div>
        </div>

        {/* steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {steps.map((s, i) => {
            const done = i < active, current = i === active;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 0', opacity: done || current ? 1 : 0.35, transition: 'opacity .4s' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? '#E8001D' : 'transparent', border: `1.5px solid ${done ? '#E8001D' : current ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.15)'}` }}>
                  {done ? <OPIcon name="check" size={12} color="#fff" sw={3}/> : current ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8001D', animation: 'opBlink 1s infinite' }}></span> : null}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: done || current ? 600 : 500, color: done || current ? '#fff' : 'rgba(255,255,255,.5)' }}>{s.label}</div>
                </div>
                {done && <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.55)' }}>{s.detail}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══ RESUMEN ═══════════════════════════════════════════════ */
function SecResumen({ D, live, go }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Thesis hero */}
      <Card pad={26} style={{ background: 'linear-gradient(135deg, #0C0C0E, #1A1A18)', border: 'none', position: 'relative', overflow: 'visible' }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 14, pointerEvents: 'none' }}>
          <span style={{ position: 'absolute', right: -20, top: -30, fontSize: 160, color: 'rgba(232,0,29,.07)', fontWeight: 800, lineHeight: 1 }}>✦</span>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#fff', background: '#E8001D', padding: '3px 9px', borderRadius: 5 }}>{D.meta.type}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#1A8A4A', background: 'rgba(26,138,74,.15)', padding: '3px 9px', borderRadius: 5 }}>Confianza {D.meta.confidence}%</span>
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,.85)', maxWidth: 720, marginBottom: 22 }}>{D.thesis}</p>
          <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
            {[
              { l: 'Horizonte', v: D.meta.horizon },
              { l: 'Creación de valor', v: D.meta.valueUpside, accent: true },
              { l: 'Empresas objetivo', v: live.empresas.length },
              { l: 'Señales activas', v: live.senales.length },
            ].map((m, i) => (
              <div key={m.l} style={{ paddingRight: 26, marginRight: 26, borderRight: i < 3 ? '1px solid rgba(255,255,255,.12)' : 'none' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: 5 }}>{m.l}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: m.accent ? '#FF4D5E' : '#fff', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-display)' }}>{m.v}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
        {/* Economic impact */}
        <Card>
          <Eyebrow>Impacto económico estimado</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 4 }}>Valor actual</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>{D.economics.current}</div>
            </div>
            <div style={{ paddingBottom: 6, color: 'var(--text-subtle)' }}>→</div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 4 }}>Valor potencial</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>{D.economics.potential}</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 4 }}>Creación estimada</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#E8001D', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>{D.economics.created}</div>
            </div>
          </div>
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-subtle)' }}>Estimación orientativa basada en EBITDA agregado y múltiplos sectoriales. No constituye una valoración formal.</div>
        </Card>

        {/* Why now */}
        <Card>
          <Eyebrow>¿Por qué ahora?</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {D.whyNow.map(w => (
              <div key={w} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>
                <span style={{ color: '#E8001D', flexShrink: 0 }}>✦</span> {w}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Entity shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { k: 'empresas', l: 'Empresas objetivo', icon: 'agency', n: live.empresas.length },
          { k: 'compradores', l: 'Compradores', icon: 'team', n: live.compradores.length },
          { k: 'inversores', l: 'Inversores', icon: 'euro', n: live.inversores.length },
          { k: 'senales', l: 'Señales', icon: 'signal', n: live.senales.length },
        ].map(e => (
          <div key={e.k} onClick={() => go(e.k)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, cursor: 'pointer', transition: 'border-color .12s, transform .12s' }}
            onMouseEnter={ev => { ev.currentTarget.style.borderColor = '#E8001D'; ev.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={ev => { ev.currentTarget.style.borderColor = 'var(--border)'; ev.currentTarget.style.transform = ''; }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(232,0,29,.08)', border: '1px solid rgba(232,0,29,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><OPIcon name={e.icon} size={18} color="#E8001D"/></div>
              <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{e.n}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{e.l}</div>
          </div>
        ))}
      </div>

      {/* Next best action */}
      <Card pad={20} style={{ display: 'flex', alignItems: 'center', gap: 18, border: '1.5px solid rgba(232,0,29,.25)' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(232,0,29,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><OPIcon name="plan" size={22} color="#E8001D"/></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 4 }}>Siguiente mejor acción</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Crear la shortlist de empresas prioritarias</div>
        </div>
        <button onClick={() => go('plan')} style={{ padding: '11px 20px', borderRadius: 10, border: 'none', background: '#E8001D', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Ver plan →</button>
      </Card>
    </div>
  );
}

Object.assign(window, { ActivationState, SecResumen });
