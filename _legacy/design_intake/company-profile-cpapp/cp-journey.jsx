// arroba.com — Company Profile · Decision Journey
// ANALIZAR → VALORAR → TRANSACCIONAR
// The two transition bands ARE the product: each phase seeds the next.

/* ── Phase ribbon (sticky progress) ────────────────────────── */
function PhaseRibbon({ active, onJump }) {
  const phases = [
    { id: 'analizar',     n: '01', label: 'Analizar',      sub: 'Entender' },
    { id: 'valorar',      n: '02', label: 'Valorar',       sub: 'Poner precio' },
    { id: 'transaccionar',n: '03', label: 'Transaccionar', sub: 'Actuar' },
  ];
  return (
    <div style={{
      position: 'sticky', top: 92, zIndex: 95,
      background: 'color-mix(in srgb, var(--bg) 92%, transparent)',
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border)',
      padding: '10px 32px',
      display: 'flex', alignItems: 'center', gap: 4,
    }}>
      {phases.map((p, i) => {
        const isActive = active === p.id;
        const isPast = phases.findIndex(x => x.id === active) > i;
        return (
          <React.Fragment key={p.id}>
            <button onClick={() => onJump(p.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', borderRadius: 9,
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
              background: isActive ? 'rgba(232,0,29,.08)' : 'transparent',
              transition: 'background .15s',
            }}>
              <span style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                background: isActive ? '#E8001D' : isPast ? 'rgba(232,0,29,.15)' : 'var(--surface-2)',
                color: isActive ? '#fff' : isPast ? '#E8001D' : 'var(--text-subtle)',
                border: isActive || isPast ? 'none' : '1px solid var(--border)',
              }}>{isPast ? '✓' : p.n}</span>
              <span style={{ textAlign: 'left' }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--text)' : 'var(--text-muted)', lineHeight: 1.1 }}>{p.label}</span>
                <span style={{ display: 'block', fontSize: 10, color: 'var(--text-subtle)' }}>{p.sub}</span>
              </span>
            </button>
            {i < phases.length - 1 && (
              <span style={{ color: 'var(--text-subtle)', fontSize: 14, margin: '0 2px' }}>→</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ── Phase header ──────────────────────────────────────────── */
function PhaseHeader({ n, label, desc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 18 }}>
      <span style={{ fontSize: 13, fontWeight: 800, color: '#E8001D', fontVariantNumeric: 'tabular-nums', letterSpacing: '.05em' }}>{n}</span>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', letterSpacing: '-.01em' }}>{label}</h2>
      <span style={{ fontSize: 13, color: 'var(--text-subtle)' }}>{desc}</span>
    </div>
  );
}

/* ══ TRANSITION BAND ① — Analizar → Valorar ════════════════ */
// "Esto es lo que sabemos → por tanto, esto es lo que vale"
function TransitionToValorar({ company, valuation, onContinue }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0C0C0E 0%, #1A1A18 100%)',
      borderRadius: 18, padding: '32px 36px', position: 'relative', overflow: 'hidden',
    }}>
      {/* faint ✦ watermark */}
      <span style={{ position: 'absolute', right: -10, top: -30, fontSize: 180, color: 'rgba(232,0,29,.06)', fontWeight: 800, pointerEvents: 'none', lineHeight: 1 }}>✦</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <span style={{ fontSize: 14, color: '#E8001D' }}>✦</span>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>Del análisis al precio</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 28, alignItems: 'center', position: 'relative' }}>
        {/* LEFT: what we know */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.4)', marginBottom: 10 }}>Esto es lo que sabemos</div>
          <p style={{ fontSize: 16, lineHeight: 1.55, color: '#fff', fontWeight: 400 }}>
            <strong style={{ fontWeight: 700 }}>{company.name}</strong> crece a doble dígito sostenido, con margen EBITDA en el <strong style={{ color: '#E8001D', fontWeight: 700 }}>percentil 75+</strong> del sector y una adjudicación pública que diversifica su cartera. El riesgo principal es la dependencia del fundador.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
            {['Opportunity 82', 'Crecimiento P82', 'Margen P75+', 'Contratación pública'].map(t => (
              <span key={t} style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.85)', background: 'rgba(255,255,255,.08)', padding: '3px 9px', borderRadius: 4, border: '1px solid rgba(255,255,255,.12)' }}>{t}</span>
            ))}
          </div>
        </div>

        {/* MIDDLE: therefore arrow */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)' }}>Por tanto</span>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff', boxShadow: '0 4px 20px rgba(232,0,29,.5)' }}>→</div>
        </div>

        {/* RIGHT: the price */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.4)', marginBottom: 10 }}>Esto es lo que vale</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 44, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', letterSpacing: '-.02em', lineHeight: 1 }}>{valuation.base}M€</span>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,.5)' }}>valor base</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', marginTop: 8 }}>
            Rango {valuation.conservative}–{valuation.optimistic}M€ · {valuation.multiple.mid}x EV/EBITDA · confianza {valuation.confidenceLabel.toLowerCase()}
          </div>
          <button onClick={onContinue} style={{
            marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px',
            borderRadius: 10, border: 'none', background: '#E8001D', color: '#fff',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}>
            Ver cómo se calcula <span style={{ fontSize: 14 }}>↓</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══ VALORAR phase — the hinge, full width ═════════════════ */
function ValorarPhase({ valuation }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20, alignItems: 'start' }}>
      {/* Left: the range + methodology */}
      <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Valoración indicativa</div>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#1A8A4A', background: '#E8F5EE', padding: '3px 10px', borderRadius: 4, border: '1px solid #C2E8D0' }}>Confianza {valuation.confidenceLabel}</span>
        </div>

        <div style={{ margin: '20px 0 8px' }}>
          <ValuationRange val={valuation}/>
        </div>
        <ConfidenceBar value={valuation.confidenceValue} label={valuation.confidenceLabel}/>

        <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{valuation.method}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { l: 'Múltiplo bajo', v: `${valuation.multiple.low}x` },
              { l: 'Múltiplo base', v: `${valuation.multiple.mid}x`, highlight: true },
              { l: 'Múltiplo alto', v: `${valuation.multiple.high}x` },
            ].map(m => (
              <div key={m.l} style={{ textAlign: 'center', padding: '12px 6px', background: m.highlight ? 'rgba(232,0,29,.05)' : 'var(--surface-2)', borderRadius: 8, border: m.highlight ? '1px solid rgba(232,0,29,.2)' : '1px solid var(--border)' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: m.highlight ? '#E8001D' : 'var(--text)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-display)' }}>{m.v}</div>
                <div style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 3 }}>{m.l}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>{valuation.note}</div>
        </div>
      </div>

      {/* Right: what moves the number — drivers traced to the analysis */}
      <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 6 }}>Qué mueve el precio</div>
        <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 16, lineHeight: 1.5 }}>Cada palanca enlaza con lo que vimos en el análisis</div>
        {[
          { label: 'Margen EBITDA P75+',    impact: 'positive', effect: '+0,9x', detail: 'Eficiencia superior al sector' },
          { label: 'Crecimiento sostenido', impact: 'positive', effect: '+0,7x', detail: 'CAGR 3 años por encima de P50' },
          { label: 'Contratación pública',  impact: 'positive', effect: '+0,4x', detail: 'Ingresos recurrentes predecibles' },
          { label: 'Dependencia fundador',  impact: 'negative', effect: '−0,6x', detail: '62% del capital concentrado' },
          { label: 'Concentración clientes', impact: 'warning', effect: '−0,2x', detail: 'Top-3 sobre cartera' },
        ].map((d, i) => {
          const c = d.impact === 'positive' ? { color: '#1A6A38', bg: '#E8F5EE', sign: '↑' }
            : d.impact === 'negative' ? { color: '#B5001A', bg: '#FDE8EA', sign: '↓' }
            : { color: '#92540A', bg: '#FEF3E2', sign: '~' };
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ width: 22, height: 22, borderRadius: 6, background: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{c.sign}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{d.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{d.detail}</div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: c.color, fontVariantNumeric: 'tabular-nums' }}>{d.effect}</span>
            </div>
          );
        })}
        <button style={{ marginTop: 16, width: '100%', padding: '11px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: '1.5px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          Abrir valoración completa (DCF + comparables) →
        </button>
      </div>
    </div>
  );
}

/* ══ TRANSITION BAND ② — Valorar → Transaccionar ═══════════ */
// "Vale X → aquí está quién lo compra → da el primer paso"
function TransitionToTransaccionar({ company, valuation, buyers, onContinue }) {
  const top = buyers[0];
  return (
    <div style={{
      background: 'linear-gradient(135deg, #E8001D 0%, #B5001A 100%)',
      borderRadius: 18, padding: '32px 36px', position: 'relative', overflow: 'hidden',
    }}>
      <span style={{ position: 'absolute', right: -10, top: -30, fontSize: 180, color: 'rgba(255,255,255,.08)', fontWeight: 800, pointerEvents: 'none', lineHeight: 1 }}>✦</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <span style={{ fontSize: 14, color: '#fff' }}>✦</span>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.7)' }}>Del precio a la operación</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1.1fr', gap: 28, alignItems: 'center', position: 'relative' }}>
        {/* LEFT: the price (recap) */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.6)', marginBottom: 10 }}>Hemos valorado {company.name} en</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 44, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', letterSpacing: '-.02em', lineHeight: 1 }}>{valuation.base}M€</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginTop: 8 }}>El propietario podría estar abierto a conversaciones</div>
        </div>

        {/* MIDDLE arrow */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)' }}>Y ahora</span>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#E8001D', boxShadow: '0 4px 20px rgba(0,0,0,.25)' }}>→</div>
        </div>

        {/* RIGHT: who's on the other side */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.6)', marginBottom: 10 }}>Quién está al otro lado</div>
          <div style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 11, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(255,255,255,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#0C0C0E', fontFamily: 'var(--font-display)', flexShrink: 0 }}>{top.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{top.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>{top.reason}</div>
            </div>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{top.fit}%</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,.7)' }}>encaje</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 8 }}>+{buyers.length - 1} compradores más encajan con esta tesis</div>
          <button onClick={onContinue} style={{
            marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px',
            borderRadius: 10, border: 'none', background: '#fff', color: '#E8001D',
            fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}>
            Dar el primer paso <span style={{ fontSize: 14 }}>↓</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══ TRANSACCIONAR phase ═══════════════════════════════════ */
function TransaccionarPhase({ company, buyers }) {
  const [interest, setInterest] = React.useState(false);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, alignItems: 'start' }}>
      {/* Buyers with match */}
      <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Compradores que encajan</div>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#E8001D', cursor: 'pointer' }}>Ver todos →</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 16 }}>Ordenados por encaje con la tesis de inversión</div>
        {buyers.map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: i < buyers.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)', flexShrink: 0 }}>{b.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{b.name}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '1px 7px', borderRadius: 3, border: '1px solid var(--border)' }}>{b.type}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{b.reason}</div>
            </div>
            <div style={{ width: 90, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: b.fit >= 85 ? '#E8001D' : 'var(--text)', fontFamily: 'var(--font-display)' }}>{b.fit}</span>
                <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>%</span>
              </div>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
                <div style={{ height: '100%', width: `${b.fit}%`, background: b.fit >= 85 ? '#E8001D' : 'var(--border-strong)', borderRadius: 2 }}/>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* The transaction actions */}
      <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1.5px solid rgba(232,0,29,.25)', padding: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 6 }}>Tu siguiente paso</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, background: '#FEF3E2', color: '#B45309', padding: '4px 10px', borderRadius: 5, border: '1px solid #FCD9A3', marginBottom: 16 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D97708' }}></span>
          No listada · Open to conversations
        </div>

        {interest ? (
          <div style={{ padding: '16px', background: '#E8F5EE', borderRadius: 10, border: '1px solid #C2E8D0', textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1A8A4A', marginBottom: 4 }}>✓ Interés registrado</div>
            <div style={{ fontSize: 12, color: '#1A6A38' }}>Nuestro equipo te contactará para iniciar el proceso de forma confidencial.</div>
          </div>
        ) : (
          <button onClick={() => setInterest(true)} style={{
            width: '100%', padding: '14px', borderRadius: 11, border: 'none', background: '#E8001D', color: '#fff',
            fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12,
          }}>
            <span style={{ fontSize: 15 }}>✦</span> Me interesa esta compañía
          </button>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { icon: 'document', label: 'Generar teaser de inversión', sub: 'Anónimo · 1 página' },
            { icon: 'nda',      label: 'Solicitar NDA', sub: 'Acceso a información confidencial' },
            { icon: 'team',     label: 'Contactar al asesor del deal', sub: 'Conversación directa' },
          ].map(a => (
            <button key={a.label} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer',
              fontFamily: 'var(--font-body)', textAlign: 'left', width: '100%',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#E8001D'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <CPIcon name={a.icon} size={17} color="var(--text-muted)" sw={1.75}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{a.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{a.sub}</div>
              </div>
              <CPIcon name="chevron-right" size={15} color="var(--text-subtle)" sw={2}/>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 13, color: '#E8001D', flexShrink: 0 }}>✦</span>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            El Copilot puede preparar el teaser, avisar a los compradores con mayor encaje y agendar la primera conversación. Todo desde aquí.
          </p>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PhaseRibbon, PhaseHeader, TransitionToValorar, ValorarPhase, TransitionToTransaccionar, TransaccionarPhase });
