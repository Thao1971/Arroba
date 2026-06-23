// arroba.com — Universal Search sections

/* ══ EXPLAINABILITY — info tooltip ═════════════════════════ */
const TIPS = {
  confianza: {
    title: 'Nivel de confianza',
    body: 'Mide la fiabilidad de la recomendación.',
    factors: ['Calidad de los datos', 'Señales disponibles', 'Actividad de mercado', 'Consistencia de la tesis', 'Número de comparables'],
  },
  impacto: {
    title: 'Impacto económico estimado',
    body: 'Estimación orientativa, no una valoración formal.',
    factors: ['EBITDA agregado detectado', 'Múltiplos sectoriales comparables', 'Compañías compatibles', 'Operaciones similares observadas'],
    link: 'Ver cálculo',
  },
  valor: {
    title: 'Creación de valor',
    body: 'Rango estimado. No es una garantía de resultado.',
    factors: ['Expansión potencial de múltiplos', 'Economías de escala', 'Sinergias operativas', 'Transacciones comparables'],
  },
  deal: {
    title: 'Deal Score',
    body: 'Probabilidad estimada de interés comprador (0–100).',
    factors: ['Encaje estratégico', 'Tamaño', 'Geografía', 'Actividad compradora', 'Compatibilidad sectorial'],
  },
  encaje: {
    title: '¿Por qué encaja?',
    body: 'Compatibilidad del comprador con la oportunidad.',
    factors: ['Tamaño compatible', 'Tesis activa en el sector', 'Geografía compatible', 'Operaciones recientes similares'],
  },
  valoracion: {
    title: 'Valoración indicativa',
    body: 'Rango orientativo por múltiplos y comparables del sector.',
    factors: ['EV/EBITDA sectorial', 'Comparables recientes', 'Crecimiento y margen'],
  },
  ventana: {
    title: 'Ventana de actuación',
    body: 'Periodo estimado en el que la oportunidad es accionable antes de que el mercado se tensione.',
    factors: ['Señales de relevo generacional', 'Actividad compradora reciente', 'Dinámica competitiva'],
  },
};

function InfoTip({ tip, dark }) {
  const [open, setOpen] = React.useState(false);
  const t = typeof tip === 'string' ? TIPS[tip] : tip;
  if (!t) return null;
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <span style={{
        width: 14, height: 14, borderRadius: '50%', border: `1px solid ${dark ? 'rgba(255,255,255,.35)' : 'var(--border-strong)'}`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700,
        color: dark ? 'rgba(255,255,255,.55)' : 'var(--text-subtle)', cursor: 'help', flexShrink: 0, fontStyle: 'italic',
      }}>i</span>
      {open && (
        <span style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
          width: 248, background: '#0C0C0E', color: '#F4F4F0', borderRadius: 10, padding: '13px 15px',
          boxShadow: '0 8px 32px rgba(0,0,0,.35)', border: '1px solid rgba(255,255,255,.1)', zIndex: 9999, textAlign: 'left',
        }}>
          <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 5 }}>{t.title}</span>
          <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,.6)', lineHeight: 1.5, marginBottom: t.factors ? 9 : 0 }}>{t.body}</span>
          {t.factors && (
            <span style={{ display: 'block', borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 8 }}>
              <span style={{ display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#E8001D', marginBottom: 5 }}>Se calcula con</span>
              {t.factors.map(f => (
                <span key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,.8)', marginBottom: 3 }}>
                  <span style={{ color: '#E8001D', fontSize: 8 }}>✦</span> {f}
                </span>
              ))}
            </span>
          )}
          {t.link && <span style={{ display: 'block', marginTop: 9, fontSize: 11, fontWeight: 600, color: '#FF4D5E', cursor: 'pointer' }}>{t.link} →</span>}
          <span style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, background: '#0C0C0E', borderRight: '1px solid rgba(255,255,255,.1)', borderBottom: '1px solid rgba(255,255,255,.1)', marginTop: -4, rotate: '45deg' }}></span>
        </span>
      )}
    </span>
  );
}

/* ══ SEARCH BAR ════════════════════════════════════════════ */
function SearchBar({ query, guest }) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 8px 8px 22px', background: 'var(--surface)', border: '1.5px solid var(--border-strong)', borderRadius: 16, boxShadow: '0 6px 28px rgba(12,12,14,.08)' }}>
        <span style={{ fontSize: 22, color: '#E8001D', flexShrink: 0 }}>✦</span>
        <input defaultValue={query} placeholder="Pregunta cualquier cosa: una empresa, un sector, una oportunidad..."
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 17, color: 'var(--text)', padding: '15px 0', fontFamily: 'var(--font-body)' }}/>
        <button style={{ padding: '14px 28px', borderRadius: 12, border: 'none', background: '#E8001D', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>Buscar</button>
      </div>
    </div>
  );
}

/* ══ INTERPRETATION CHIPS ══════════════════════════════════ */
function Understood({ chips }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
      <span style={{ fontSize: 12, color: 'var(--text-subtle)', fontWeight: 500 }}>El sistema entendió:</span>
      {chips.map(c => (
        <span key={c.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: 'var(--text)', background: 'var(--surface)', border: '1px solid var(--border)', padding: '5px 11px', borderRadius: 20 }}>
          <HIcon name={c.icon} size={12} color="#E8001D" sw={2}/>
          <span style={{ color: 'var(--text-subtle)' }}>{c.type}:</span> {c.label}
          <span style={{ color: 'var(--text-subtle)', cursor: 'pointer', marginLeft: 2 }}>×</span>
        </span>
      ))}
    </div>
  );
}

/* ══ AI ANSWER ═════════════════════════════════════════════ */
function Diagnosis({ diagnosis, guest }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px', position: 'relative', overflow: 'visible' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 800 }}>✦</div>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Diagnóstico estratégico</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, color: '#1A8A4A', background: '#E8F5EE', padding: '2px 8px', borderRadius: 4, border: '1px solid #C2E8D0' }}>Confianza {diagnosis.confidence} <InfoTip tip="confianza"/></span>
      </div>

      <p style={{ fontSize: 17, lineHeight: 1.45, color: 'var(--text)', fontWeight: 600, marginBottom: 18, letterSpacing: '-.01em' }}>{diagnosis.headline}</p>

      <div style={{ display: 'grid', gridTemplateColumns: guest ? '1fr' : 'repeat(3, 1fr)', gap: 14, marginBottom: 16, position: 'relative' }}>
        {diagnosis.blocks.map((b, i) => (
          <div key={b.label} style={{ position: 'relative' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#E8001D', marginBottom: 7 }}>{b.label}</div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-muted)', filter: (guest && i > 0) ? 'blur(4px)' : 'none', userSelect: (guest && i > 0) ? 'none' : 'auto' }}>{b.text}</p>
            {guest && i > 0 && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 14 }}>🔒</span></div>}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
        <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Fuentes:</span>
        {diagnosis.citations.map(c => (
          <span key={c} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>{c}</span>
        ))}
      </div>
    </div>
  );
}

/* ══ OPPORTUNITIES DETECTED — recommended + secondary ══════ */
function OpportunitiesDetected({ opportunities, onOpen }) {
  const heatColor = h => h === 'Alta' ? '#E8001D' : '#D97708';
  const main = opportunities.find(o => o.recommended);
  const rest = opportunities.filter(o => !o.recommended);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ color: '#E8001D', fontSize: 13 }}>✦</span>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text)' }}>Oportunidades detectadas</span>
      </div>

      {/* Recommended — featured */}
      {main && (
        <div onClick={() => onOpen && onOpen(main)} style={{
          background: 'var(--surface)', border: '1.5px solid #E8001D', borderRadius: 14, padding: '20px 22px', cursor: 'pointer', marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 20, position: 'relative', overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(232,0,29,.1)', transition: 'transform .12s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={e => e.currentTarget.style.transform = ''}>
          <div style={{ width: 52, height: 52, borderRadius: 13, background: 'rgba(232,0,29,.08)', border: '1px solid rgba(232,0,29,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HIcon name={main.icon} size={24} color="#E8001D" sw={1.75}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#fff', background: '#E8001D', padding: '3px 9px', borderRadius: 5 }}>Recomendada por Arroba</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#1A8A4A', background: 'rgba(26,138,74,.1)', padding: '2px 8px', borderRadius: 4 }}>{main.canvas.valueCreated} de valor</span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', letterSpacing: '-.01em', marginBottom: 3 }}>{main.title}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: 6 }}>{main.desc}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-subtle)' }}>
              <span style={{ color: '#E8001D', flexShrink: 0 }}>→</span> {main.whyAppears}
            </div>
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#E8001D', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{main.count}</div>
            <div style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 2 }}>compañías</div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onOpen && onOpen(main); }} style={{ padding: '11px 20px', borderRadius: 10, border: 'none', background: '#E8001D', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>Ver oportunidad →</button>
        </div>
      )}

      {/* Secondary — alternatives */}
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-subtle)', marginBottom: 10 }}>Otras oportunidades detectadas</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {rest.map(o => (
          <div key={o.id} onClick={() => onOpen && onOpen(o)} style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', cursor: 'pointer',
            transition: 'border-color .12s, transform .12s', position: 'relative',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#E8001D'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = ''; }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HIcon name={o.icon} size={15} color="var(--text-muted)" sw={1.75}/>
              </div>
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{o.count}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 5, lineHeight: 1.2 }}>{o.title}</div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', lineHeight: 1.4, marginBottom: 10, display: 'flex', gap: 5 }}>
              <span style={{ color: '#E8001D', flexShrink: 0 }}>→</span> {o.whyAppears}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#1A8A4A', background: 'rgba(26,138,74,.1)', padding: '2px 7px', borderRadius: 4 }}>{o.canvas.valueCreated}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#E8001D' }}>Ver →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══ DETECTED ACTORS — dynamic concrete type per recommended opportunity ══ */
function ActorsBlock({ actors, guest }) {
  if (!actors) return null;
  const items = guest ? actors.items.slice(0, 2) : actors.items;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
        <span style={{ color: '#E8001D', fontSize: 13 }}>✦</span>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Actores relevantes</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{actors.label}</span>
        <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{actors.sub}</span>
      </div>

      {actors.kind === 'companies' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((t, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 16, alignItems: 'center', padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, transition: 'border-color .12s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#E8001D'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{t.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#E8001D', background: 'rgba(232,0,29,.07)', padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(232,0,29,.15)' }}>{t.role}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-subtle)' }}>{t.loc} · {t.revenue} fact. · {t.ebitda} EBITDA</span>
                </div>
              </div>
              <div style={{ textAlign: 'center', minWidth: 48 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: t.dealScore >= 80 ? '#E8001D' : 'var(--text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{t.dealScore}</div>
                <div style={{ fontSize: 9, color: 'var(--text-subtle)', marginTop: 2 }}>Deal</div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 60, position: 'relative' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, filter: guest ? 'blur(5px)' : 'none' }}>{t.valuation}</div>
                <div style={{ fontSize: 9, color: 'var(--text-subtle)', marginTop: 2 }}>Valoración</div>
                {guest && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 10 }}>🔒</span></div>}
              </div>
              <span style={{ fontSize: 15, color: 'var(--text-subtle)' }}>→</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <HIcon name="team" size={17} color="#E8001D" sw={1.75}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{b.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '1px 7px', borderRadius: 4, border: '1px solid var(--border)' }}>{b.type}</span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginTop: 2 }}>{b.deals} operaciones · Ticket {b.ticket}</div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 52, position: 'relative' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: b.fit >= 85 ? '#E8001D' : 'var(--text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, filter: guest ? 'blur(5px)' : 'none' }}>{b.fit}%</div>
                <div style={{ fontSize: 9, color: 'var(--text-subtle)', marginTop: 2 }}>encaje</div>
                {guest && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 10 }}>🔒</span></div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══ STRATEGIC THESIS CANVAS (overlay) ═════════════════════ */
function ThesisCanvas({ opp, onClose }) {
  if (!opp) return null;
  const c = opp.canvas;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(12,12,14,.55)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 'min(680px, 92vw)', height: '100%', background: 'var(--bg)', borderLeft: '1px solid var(--border)', overflowY: 'auto', boxShadow: '-20px 0 60px rgba(0,0,0,.25)' }}>
        {/* Header */}
        <div style={{ position: 'sticky', top: 0, background: 'linear-gradient(135deg, #0C0C0E, #1A1A18)', padding: '24px 28px', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: '#E8001D' }}>Oportunidad</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.5)', background: 'rgba(255,255,255,.08)', padding: '2px 8px', borderRadius: 4 }}>{opp.type}</span>
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', letterSpacing: '-.01em', lineHeight: 1.15 }}>{opp.title}</h2>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.06)', color: '#fff', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>×</button>
          </div>
        </div>

        <div style={{ padding: '24px 28px 40px' }}>
          {/* Thesis */}
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 8 }}>La tesis</div>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--text)', marginBottom: 24 }}>{c.thesis}</p>

          {/* Value aggregate */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { l: 'Valor agregado', v: c.valueAgg, accent: false },
              { l: 'Valor potencial', v: c.valuePotential, accent: false },
              { l: 'Creación de valor', v: c.valueCreated, accent: true },
            ].map(m => (
              <div key={m.l} style={{ background: m.accent ? 'rgba(232,0,29,.06)' : 'var(--surface)', border: `1px solid ${m.accent ? 'rgba(232,0,29,.2)' : 'var(--border)'}`, borderRadius: 12, padding: '16px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 8 }}>{m.l}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: m.accent ? '#E8001D' : 'var(--text)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-display)' }}>{m.v}</div>
              </div>
            ))}
          </div>

          {/* Linked entities — no transactional direction yet */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 28 }}>
            {[
              { l: 'Compañías relacionadas', v: c.companies, icon: 'agency' },
              { l: 'Operaciones comparables', v: c.comparables, icon: 'deal' },
            ].map(e => (
              <div key={e.l} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <HIcon name={e.icon} size={16} color="#E8001D" sw={1.75}/>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{e.v}</span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.3 }}>{e.l}</div>
              </div>
            ))}
          </div>

          {/* Actores relevantes — dynamic per thesis */}
          {c.actors && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 4 }}>Actores relevantes</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{c.actors.label}</span>
                <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{c.actors.sub}</span>
              </div>

              {c.actors.kind === 'companies' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {c.actors.items.map((t, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 14, alignItems: 'center', padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{t.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#E8001D', background: 'rgba(232,0,29,.07)', padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(232,0,29,.15)' }}>{t.role}</span>
                          <span style={{ fontSize: 11.5, color: 'var(--text-subtle)' }}>{t.loc} · {t.revenue} fact. · {t.ebitda} EBITDA</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', minWidth: 48 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: t.dealScore >= 80 ? '#E8001D' : 'var(--text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{t.dealScore}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-subtle)', marginTop: 2 }}>Deal</div>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: 60 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{t.valuation}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-subtle)', marginTop: 2 }}>Valoración</div>
                      </div>
                      <span style={{ fontSize: 15, color: 'var(--text-subtle)' }}>→</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {c.actors.items.map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <HIcon name="team" size={17} color="#E8001D" sw={1.75}/>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{b.name}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '1px 7px', borderRadius: 4, border: '1px solid var(--border)' }}>{b.type}</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginTop: 2 }}>{b.deals} operaciones · Ticket {b.ticket}</div>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: 52 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: b.fit >= 85 ? '#E8001D' : 'var(--text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{b.fit}%</div>
                        <div style={{ fontSize: 9, color: 'var(--text-subtle)', marginTop: 2 }}>encaje</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Risks */}
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 10 }}>Riesgos a considerar</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
            {c.risks.map(r => (
              <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#FEF3E2', border: '1px solid #FCD9A3', borderRadius: 10, fontSize: 13, color: '#92540A' }}>
                <span style={{ color: '#D97708', flexShrink: 0 }}>✦</span> {r}
              </div>
            ))}
          </div>

          {/* CTA */}
          <button style={{ width: '100%', padding: '14px', borderRadius: 11, border: 'none', background: '#E8001D', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span>✦</span> Activar esta oportunidad
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══ OPPORTUNITY CARD (for the Oportunidades tab) ══════════ */
function OpportunityCard({ o, onOpen }) {
  const heatColor = o.heat === 'Alta' ? '#E8001D' : '#D97708';
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 18 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(232,0,29,.08)', border: '1px solid rgba(232,0,29,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <HIcon name={o.icon} size={22} color="#E8001D" sw={1.75}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{o.title}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: heatColor, background: `${heatColor}14`, padding: '2px 7px', borderRadius: 4 }}>{o.heat}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#1A8A4A', background: 'rgba(26,138,74,.1)', padding: '2px 7px', borderRadius: 4 }}>{o.canvas.valueCreated}</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{o.desc}</div>
      </div>
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{o.count}</div>
        <div style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 2 }}>compañías</div>
      </div>
      <button onClick={() => onOpen && onOpen(o)} style={{ padding: '10px 18px', borderRadius: 9, border: 'none', background: '#E8001D', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>Ver oportunidad →</button>
    </div>
  );
}

/* ══ ENTITY TABS ═══════════════════════════════════════════ */
function EntityTabs({ groups, active, setActive }) {
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
      {groups.map(g => (
        <button key={g.id} onClick={() => setActive(g.id)} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '11px 16px', border: 'none', background: 'transparent',
          borderBottom: `2px solid ${active === g.id ? '#E8001D' : 'transparent'}`, marginBottom: -1,
          fontSize: 14, fontWeight: active === g.id ? 700 : 500, color: active === g.id ? 'var(--text)' : 'var(--text-muted)',
          cursor: 'pointer', fontFamily: 'var(--font-body)',
        }}>
          {g.label}
          <span style={{ fontSize: 11, fontWeight: 600, color: active === g.id ? '#E8001D' : 'var(--text-subtle)', background: active === g.id ? 'rgba(232,0,29,.08)' : 'var(--surface-2)', padding: '1px 7px', borderRadius: 10, fontVariantNumeric: 'tabular-nums' }}>{g.count}</span>
        </button>
      ))}
    </div>
  );
}

/* ══ STRATEGIC RECOMMENDATION (investment thesis + economics) ══ */
function WhatWouldArroba({ rec, guest }) {
  return (
    <div style={{ background: 'linear-gradient(135deg, #0C0C0E, #1A1A18)', borderRadius: 14, padding: '24px 26px', position: 'relative', overflow: 'visible' }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 14, pointerEvents: 'none' }}>
        <span style={{ position: 'absolute', right: -10, top: -28, fontSize: 150, color: 'rgba(232,0,29,.07)', fontWeight: 800, lineHeight: 1 }}>✦</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, position: 'relative' }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 800 }}>✦</div>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: '#E8001D' }}>Recomendación estratégica</span>
      </div>

      {/* Thesis title */}
      <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', letterSpacing: '-.015em', lineHeight: 1.2, marginBottom: 18, position: 'relative', maxWidth: 640 }}>{rec.title}</h3>

      {/* Key metrics row */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, position: 'relative', flexWrap: 'wrap' }}>
        {[
          { l: 'Confianza', v: `${rec.confidence}%`, tip: 'confianza' },
          { l: 'Horizonte', v: rec.horizon, tip: null },
          { l: 'Creación de valor', v: rec.valueUpside, accent: true, tip: 'valor' },
        ].map((m, i) => (
          <div key={m.l} style={{ paddingRight: 28, marginRight: 28, borderRight: i < 2 ? '1px solid rgba(255,255,255,.12)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)' }}>{m.l}</span>
              {m.tip && <InfoTip tip={m.tip} dark/>}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: m.accent ? '#FF4D5E' : '#fff', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-display)' }}>{m.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: guest ? '1fr' : '1.1fr 1fr', gap: 22, position: 'relative' }}>
        {/* Motives */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: 10 }}>Motivos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {rec.motives.map((m, i) => (
              <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: 'rgba(255,255,255,.85)', position: 'relative' }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(232,0,29,.25)', border: '1px solid rgba(232,0,29,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', flexShrink: 0 }}>✓</span>
                <span style={{ filter: (guest && i > 1) ? 'blur(4px)' : 'none', userSelect: (guest && i > 1) ? 'none' : 'auto' }}>{m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Economic impact box */}
        <div style={{ background: 'rgba(232,0,29,.08)', border: '1px solid rgba(232,0,29,.25)', borderRadius: 12, padding: '18px 20px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: '#FF4D5E' }}>Impacto económico estimado</span>
            <InfoTip tip="impacto" dark/>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>Valor actual</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{rec.economics.current}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>Valor potencial</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{rec.economics.potential}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.12)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.85)' }}>Creación estimada</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#FF4D5E', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-display)' }}>{rec.economics.created}</span>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 10, lineHeight: 1.4 }}>Estimación orientativa, no una valoración formal.</div>
          {guest && <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: 'rgba(12,12,14,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 18 }}>🔒</span></div>}
        </div>
      </div>

      {/* Why now — temporal urgency */}
      {rec.whyNow && (
        <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,.1)', position: 'relative' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#FF4D5E', marginBottom: 12 }}>¿Por qué ahora?</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {rec.whyNow.map(w => (
              <div key={w} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'rgba(255,255,255,.8)', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', padding: '8px 12px', borderRadius: 9, flex: '1 1 200px' }}>
                <span style={{ color: '#FF4D5E', flexShrink: 0 }}>✦</span> {w}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sources */}
      {rec.sources && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.1)', position: 'relative' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)' }}>Fuentes utilizadas</span>
          {rec.sources.map(s => (
            <span key={s} style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.7)', background: 'rgba(255,255,255,.06)', padding: '2px 9px', borderRadius: 4, border: '1px solid rgba(255,255,255,.1)' }}>{s}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══ RECOMMENDED THESIS ═════════════════════════════════════ */
function RecommendedThesis({ thesis }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1.5px solid rgba(232,0,29,.25)', borderRadius: 14, padding: '22px 24px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: '#E8001D' }}>Tesis recomendada</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '3px 10px', borderRadius: 20, border: '1px solid var(--border)' }}>{thesis.window}</span>
      </div>
      <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', letterSpacing: '-.01em', lineHeight: 1.2, marginBottom: 10 }}>{thesis.title}</h3>
      <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-muted)' }}>{thesis.body}</p>
    </div>
  );
}

/* ══ BUYERS DETECTED ════════════════════════════════════════ */
function BuyersDetected({ buyers, guest }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ color: '#E8001D', fontSize: 13 }}>✦</span>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text)' }}>Compradores detectados</span>
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          {buyers.summary.map(s => (
            <span key={s.type} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '3px 9px', borderRadius: 6, border: '1px solid var(--border)' }}>
              <strong style={{ color: 'var(--text)' }}>{s.count}</strong> {s.type}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {buyers.list.map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, transition: 'border-color .12s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#E8001D'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <HIcon name={b.icon} size={18} color="#E8001D" sw={1.75}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{b.name}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '1px 7px', borderRadius: 4, border: '1px solid var(--border)' }}>{b.type}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 3, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span>{b.deals} adquisiciones</span>
                <span>·</span>
                <span>Ticket {b.ticket}</span>
                <span>·</span>
                <span>Última operación: {b.last}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', position: 'relative', minWidth: 56 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: b.fit >= 85 ? '#E8001D' : 'var(--text)', fontVariantNumeric: 'tabular-nums', filter: guest ? 'blur(5px)' : 'none' }}>{b.fit}%</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>encaje</span>
                {!guest && <InfoTip tip={{ title: '¿Por qué encaja?', body: `Compatibilidad de ${b.name} con la oportunidad.`, factors: b.whyFit }}/>}
              </div>
              {guest && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 11 }}>🔒</span></div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══ COMPANY RESULT ROW ════════════════════════════════════ */
function ScorePill({ label, value }) {
  const color = value >= 80 ? '#E8001D' : value >= 65 ? '#0C0C0E' : '#636360';
  return (
    <div style={{ textAlign: 'center', minWidth: 52 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--text-subtle)', marginTop: 3, lineHeight: 1.1 }}>{label}</div>
    </div>
  );
}

function CompanyRow({ c, guest, locked }) {
  return (
    <a href={locked ? undefined : 'Company Profile.html'} style={{
      display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 20, alignItems: 'center',
      padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
      textDecoration: 'none', cursor: locked ? 'default' : 'pointer', transition: 'border-color .12s, transform .12s', position: 'relative',
    }}
    onMouseEnter={e => { if (!locked) { e.currentTarget.style.borderColor = '#E8001D'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = ''; }}>
      {/* Name + meta */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>{c.name}</span>
          {c.verified && <HIcon name="verified" size={13} color="#1A8A4A" sw={2}/>}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#E8001D', background: 'rgba(232,0,29,.06)', padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(232,0,29,.15)', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 9 }}>✦</span> {c.signal}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-subtle)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.legal} · {c.loc} · {c.sector} · {c.revenue} · {c.margin}</div>
      </div>

      {/* Triple scoring */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <ScorePill label="Encaje" value={c.encaje}/>
        <div style={{ width: 1, height: 28, background: 'var(--border)' }}></div>
        <ScorePill label="Oportun." value={c.oportunidad}/>
        <div style={{ width: 1, height: 28, background: 'var(--border)' }}></div>
        <ScorePill label="Transac." value={c.transaccionabilidad}/>
        <div style={{ width: 1, height: 28, background: 'var(--border)' }}></div>
        {/* Deal Score — transactional, highlighted */}
        <div style={{ textAlign: 'center', minWidth: 52, padding: '4px 8px', borderRadius: 8, background: c.dealScore >= 80 ? 'rgba(232,0,29,.08)' : 'var(--surface-2)', border: `1px solid ${c.dealScore >= 80 ? 'rgba(232,0,29,.2)' : 'var(--border)'}` }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: c.dealScore >= 80 ? '#E8001D' : 'var(--text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{c.dealScore}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginTop: 3 }}>
            <span style={{ fontSize: 9, color: c.dealScore >= 80 ? '#E8001D' : 'var(--text-subtle)', lineHeight: 1.1, fontWeight: 600 }}>Deal</span>
            <InfoTip tip="deal"/>
          </div>
        </div>
      </div>

      {/* Valuation — GATED for guests */}
      <div style={{ textAlign: 'right', position: 'relative', minWidth: 64 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#E8001D', fontVariantNumeric: 'tabular-nums', filter: guest ? 'blur(5px)' : 'none', userSelect: guest ? 'none' : 'auto' }}>{c.valuation}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
          <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>Valoración</span>
          {!guest && <InfoTip tip="valoracion"/>}
        </div>
        {guest && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 11 }}>🔒</span></div>}
      </div>

      <span style={{ fontSize: 16, color: 'var(--text-subtle)' }}>→</span>
    </a>
  );
}

/* ══ SECTOR / INVESTOR ROWS ════════════════════════════════ */
function SectorRow({ s }) {
  return (
    <a href="Ficha Sectorial.html" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, textDecoration: 'none', transition: 'border-color .12s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#E8001D'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <HIcon name="chartBar" size={18} color="#E8001D" sw={1.75}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{s.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{s.cnae} · {s.companies} empresas</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A8A4A', fontVariantNumeric: 'tabular-nums' }}>{s.growth}</div>
        <div style={{ fontSize: 10, color: 'var(--text-subtle)' }}>Crecimiento anual</div>
      </div>
    </a>
  );
}

function InvestorRow({ inv, guest }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <HIcon name="team" size={18} color="#E8001D" sw={1.75}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{inv.name}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '1px 7px', borderRadius: 4, border: '1px solid var(--border)' }}>{inv.type}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 2 }}>{inv.thesis} · {inv.deals} operaciones</div>
      </div>
      <div style={{ textAlign: 'right', position: 'relative' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: inv.fit >= 85 ? '#E8001D' : 'var(--text)', fontVariantNumeric: 'tabular-nums', filter: guest ? 'blur(5px)' : 'none' }}>{inv.fit}%</div>
        <div style={{ fontSize: 10, color: 'var(--text-subtle)' }}>Encaje</div>
      </div>
    </div>
  );
}

/* ══ CONVERSATION REFINE BAR ═══════════════════════════════ */
function RefineBar({ chips }) {
  const [val, setVal] = React.useState('');
  return (
    <div style={{ position: 'sticky', bottom: 0, zIndex: 200, background: 'color-mix(in srgb, var(--bg) 92%, transparent)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderTop: '1px solid var(--border)', padding: '14px 28px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 7, marginBottom: 10, flexWrap: 'wrap' }}>
          {chips.map(c => (
            <button key={c} onClick={() => setVal(c)} style={{
              fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)',
              padding: '5px 12px', borderRadius: 20, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all .12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#E8001D'; e.currentTarget.style.color = '#E8001D'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>{c}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 6px 6px 16px', background: 'var(--surface)', border: '1.5px solid var(--border-strong)', borderRadius: 12, boxShadow: '0 4px 20px rgba(12,12,14,.06)' }}>
          <span style={{ fontSize: 16, color: '#E8001D', flexShrink: 0 }}>✦</span>
          <input value={val} onChange={e => setVal(e.target.value)} placeholder="Refina la búsqueda o pide una acción: «ahora busca compradores»…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: 'var(--text)', padding: '9px 0', fontFamily: 'var(--font-body)' }}/>
          <button style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: '#E8001D', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>Continuar</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { InfoTip, SearchBar, Understood, Diagnosis, WhatWouldArroba, RecommendedThesis, BuyersDetected, ActorsBlock, OpportunitiesDetected, OpportunityCard, ThesisCanvas, EntityTabs, CompanyRow, SectorRow, InvestorRow, RefineBar });
