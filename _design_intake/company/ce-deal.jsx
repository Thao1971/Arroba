// Arroba — Company Entity: "Operación activa" (mandato M&A)
// Detecta el estado de la compañía (en venta, comprando, financiación, fusión)
// y destaca el proceso con mensaje, acciones y timeline. Conmutable para validar el blueprint.

const DEAL_SCENARIOS = {
  none: {
    id: 'none', label: 'Sin proceso activo', color: 'var(--text-subtle)', bg: 'var(--surface-2)', icon: 'summary',
  },
  venta: {
    id: 'venta', label: 'En venta', short: 'Proceso de venta activo', color: '#E8001D', bg: 'rgba(232,0,29,.07)', bd: 'rgba(232,0,29,.22)', icon: 'deal',
    counterpart: 'el vendedor',
    headline: 'El propietario ha abierto un proceso de venta / entrada de socio. Arroba coordina el acceso a la información de forma confidencial.',
    terms: [
      { l: 'Tipo de proceso', v: 'Venta / entrada de socio' },
      { l: 'Participación', v: 'Hasta 100%' },
      { l: 'Asesor', v: 'Mandato Arroba' },
      { l: 'Rango orientativo', v: 'Pendiente de valoración', link: 'valoracion' },
    ],
    actions: [
      { id: 'nda', label: 'Descargar NDA', done: 'NDA descargado', icon: 'document', primary: true },
      { id: 'cuaderno', label: 'Solicitar cuaderno de venta', done: 'Cuaderno solicitado', icon: 'layers' },
      { id: 'match', label: 'Hacer match con el vendedor', done: 'Match solicitado', icon: 'deal' },
      { id: 'interes', label: 'Indicar interés', done: 'Interés registrado', icon: 'verified' },
    ],
    timeline: [
      { l: 'Mandato firmado', s: 'done' }, { l: 'Teaser disponible', s: 'done' },
      { l: 'Firma de NDA', s: 'active' }, { l: 'Cuaderno de venta', s: 'todo' },
      { l: 'Ofertas indicativas', s: 'todo' }, { l: 'Due diligence', s: 'todo' }, { l: 'Cierre', s: 'todo' },
    ],
  },
  compra: {
    id: 'compra', label: 'Comprando', short: 'Mandato de compra activo', color: '#2164E3', bg: 'rgba(33,100,227,.07)', bd: 'rgba(33,100,227,.22)', icon: 'target',
    counterpart: 'el comprador',
    headline: 'Esta compañía busca adquisiciones para su estrategia de consolidación. Si representas a un target que encaja, puedes proponerlo.',
    terms: [
      { l: 'Tipo de proceso', v: 'Compra · buy & build' },
      { l: 'Sectores objetivo', v: 'Hotelero · termal · bienestar' },
      { l: 'Geografía', v: 'España' },
      { l: 'Ticket', v: 'Por definir' },
    ],
    actions: [
      { id: 'oportunidad', label: 'Presentar una oportunidad', done: 'Oportunidad enviada', icon: 'target', primary: true },
      { id: 'match', label: 'Hacer match con el comprador', done: 'Match solicitado', icon: 'deal' },
      { id: 'tesis', label: 'Compartir tesis de encaje', done: 'Tesis enviada', icon: 'share' },
      { id: 'nda', label: 'Descargar NDA', done: 'NDA descargado', icon: 'document' },
    ],
    timeline: [
      { l: 'Mandato de compra', s: 'done' }, { l: 'Criterios definidos', s: 'done' },
      { l: 'Búsqueda de targets', s: 'active' }, { l: 'Primer contacto', s: 'todo' },
      { l: 'Firma de NDA', s: 'todo' }, { l: 'Negociación', s: 'todo' },
    ],
  },
  financiacion: {
    id: 'financiacion', label: 'Buscando financiación', short: 'Ronda de financiación abierta', color: '#1A8A4A', bg: 'rgba(26,138,74,.08)', bd: 'rgba(26,138,74,.25)', icon: 'euro',
    counterpart: 'el inversor',
    headline: 'La compañía tiene una ronda abierta para financiar su plan de expansión y nuevas aperturas.',
    terms: [
      { l: 'Tipo de proceso', v: 'Ampliación de capital / deuda' },
      { l: 'Destino', v: 'Aperturas y expansión' },
      { l: 'Instrumento', v: 'Equity / deuda' },
      { l: 'Importe', v: 'Por definir' },
    ],
    actions: [
      { id: 'nda', label: 'Descargar NDA', done: 'NDA descargado', icon: 'document', primary: true },
      { id: 'dossier', label: 'Solicitar dossier de inversión', done: 'Dossier solicitado', icon: 'chartBar' },
      { id: 'match', label: 'Hacer match con el inversor', done: 'Match solicitado', icon: 'deal' },
      { id: 'interes', label: 'Indicar interés', done: 'Interés registrado', icon: 'verified' },
    ],
    timeline: [
      { l: 'Ronda abierta', s: 'done' }, { l: 'Teaser disponible', s: 'done' },
      { l: 'Firma de NDA', s: 'active' }, { l: 'Dossier de inversión', s: 'todo' },
      { l: 'Term sheet', s: 'todo' }, { l: 'Cierre de ronda', s: 'todo' },
    ],
  },
  fusion: {
    id: 'fusion', label: 'Fusión', short: 'Explorando una fusión', color: '#7C3AED', bg: 'rgba(124,58,237,.07)', bd: 'rgba(124,58,237,.22)', icon: 'share',
    counterpart: 'la contraparte',
    headline: 'La compañía explora una fusión con un actor complementario del sector para ganar escala.',
    terms: [
      { l: 'Tipo de proceso', v: 'Fusión / integración' },
      { l: 'Perfil buscado', v: 'Hotelero complementario' },
      { l: 'Estructura', v: 'Por definir' },
      { l: 'Geografía', v: 'España' },
    ],
    actions: [
      { id: 'nda', label: 'Descargar NDA', done: 'NDA descargado', icon: 'document', primary: true },
      { id: 'encaje', label: 'Explorar encaje estratégico', done: 'Análisis solicitado', icon: 'layers' },
      { id: 'match', label: 'Hacer match', done: 'Match solicitado', icon: 'deal' },
      { id: 'interes', label: 'Indicar interés', done: 'Interés registrado', icon: 'verified' },
    ],
    timeline: [
      { l: 'Intención de fusión', s: 'done' }, { l: 'Firma de NDA', s: 'active' },
      { l: 'Análisis de encaje', s: 'todo' }, { l: 'Valoración relativa', s: 'todo' },
      { l: 'Estructura del acuerdo', s: 'todo' }, { l: 'Cierre', s: 'todo' },
    ],
  },
};

const DEAL_ORDER = ['venta', 'compra', 'financiacion', 'fusion', 'none'];

/* Slim banner under the company header */
function DealBanner({ deal }) {
  const s = DEAL_SCENARIOS[deal];
  if (!s || s.id === 'none') return null;
  const focus = () => window.dispatchEvent(new CustomEvent('arr-deal-focus'));
  return (
    <div style={{ background: s.color, color: '#fff' }}>
      <div style={{ maxWidth: 'min(1760px, 95vw)', margin: '0 auto', padding: '9px 28px', display: 'flex', alignItems: 'center', gap: 13, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, letterSpacing: '.02em' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'dealPulse 1.6s infinite' }}></span>
          {s.label.toUpperCase()}
        </span>
        <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,.88)' }}>{s.short} · esta compañía tiene una operación en curso en Arroba</span>
        <button onClick={focus} style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 13px', borderRadius: 7, border: '1px solid rgba(255,255,255,.45)', background: 'rgba(255,255,255,.12)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Ver acciones →</button>
      </div>
    </div>
  );
}

/* Right-column "Operación activa" card */
function CEDeal({ deal, setDeal, C, E, go }) {
  const [acted, setActed] = React.useState({});
  const rootRef = React.useRef(null);
  const s = DEAL_SCENARIOS[deal];

  React.useEffect(() => { setActed({}); }, [deal]);
  React.useEffect(() => {
    const onFocus = () => { if (rootRef.current) rootRef.current.scrollIntoView({ block: 'start', behavior: 'smooth' }); };
    window.addEventListener('arr-deal-focus', onFocus);
    return () => window.removeEventListener('arr-deal-focus', onFocus);
  }, []);

  const Switcher = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Escenario · demo</span>
      <select value={deal} onChange={e => setDeal(e.target.value)} style={{ flex: 1, fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, padding: '5px 8px', fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
        {DEAL_ORDER.map(id => <option key={id} value={id}>{DEAL_SCENARIOS[id].label}</option>)}
      </select>
    </div>
  );

  if (s.id === 'none') {
    return (
      <div ref={rootRef}>
        {Switcher}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 16px' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', marginBottom: 5 }}>Sin proceso activo</div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 12px' }}>Esta compañía no tiene un proceso de M&A en curso. Si la representas, puedes activar un mandato de venta, compra, financiación o fusión.</p>
          <button onClick={() => go('resumen')} style={{ width: '100%', padding: '9px 14px', borderRadius: 9, border: '1.5px solid #0C0C0E', background: 'var(--surface)', color: 'var(--text)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Reclamar mi empresa</button>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef}>
      {Switcher}
      <div style={{ background: 'var(--surface)', border: `1.5px solid ${s.bd}`, borderRadius: 14, overflow: 'hidden' }}>
        {/* header */}
        <div style={{ padding: '13px 15px', background: s.bg, borderBottom: `1px solid ${s.bd}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CPIcon name={s.icon} size={14} color="#fff" sw={2.2}/></div>
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: s.color }}>Operación activa</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>{s.label}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 15px' }}>
          <p style={{ fontSize: 12.3, color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 13px' }}>{s.headline}</p>

          {/* terms */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px 12px', marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
            {s.terms.map(t => (
              <div key={t.l}>
                <div style={{ fontSize: 10, color: 'var(--text-subtle)', marginBottom: 2 }}>{t.l}</div>
                {t.link
                  ? <button onClick={() => go(t.link)} style={{ padding: 0, border: 'none', background: 'none', fontSize: 12, fontWeight: 700, color: s.color, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}>{t.v} →</button>
                  : <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{t.v}</div>}
              </div>
            ))}
          </div>

          {/* actions */}
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 8 }}>Acciones</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
            {s.actions.map(a => {
              const done = acted[a.id];
              const primary = a.primary && !done;
              return (
                <button key={a.id} onClick={() => setActed(p => ({ ...p, [a.id]: true }))} disabled={done}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 9, cursor: done ? 'default' : 'pointer', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, textAlign: 'left',
                    border: primary ? 'none' : `1px solid ${done ? s.bd : 'var(--border-strong)'}`,
                    background: done ? s.bg : primary ? s.color : 'var(--surface)',
                    color: done ? s.color : primary ? '#fff' : 'var(--text)' }}>
                  <CPIcon name={done ? 'verified' : a.icon} size={15} color={done ? s.color : primary ? '#fff' : 'var(--text-muted)'} sw={2}/>
                  <span style={{ flex: 1 }}>{done ? a.done : a.label}</span>
                  {done && <span style={{ fontSize: 13, color: s.color }}>✓</span>}
                </button>
              );
            })}
          </div>

          {/* timeline */}
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 10 }}>Proceso</div>
          <div style={{ position: 'relative', paddingLeft: 4 }}>
            {s.timeline.map((step, i) => {
              const last = i === s.timeline.length - 1;
              const c = step.s === 'done' ? s.color : step.s === 'active' ? s.color : 'var(--border-strong)';
              return (
                <div key={i} style={{ position: 'relative', display: 'flex', gap: 11, paddingBottom: last ? 0 : 13 }}>
                  {!last && <div style={{ position: 'absolute', left: 5, top: 13, bottom: 0, width: 2, background: step.s === 'done' ? s.color : 'var(--border)' }}></div>}
                  <div style={{ position: 'relative', zIndex: 1, flexShrink: 0, marginTop: 2, width: 12, height: 12, borderRadius: '50%',
                    background: step.s === 'todo' ? 'var(--surface)' : s.color,
                    border: step.s === 'todo' ? '2px solid var(--border-strong)' : step.s === 'active' ? `2px solid ${s.color}` : 'none',
                    boxShadow: step.s === 'active' ? `0 0 0 4px ${s.bg}` : 'none' }}>
                    {step.s === 'active' && <span style={{ position: 'absolute', inset: 2, borderRadius: '50%', background: '#fff' }}></span>}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: step.s === 'active' ? 700 : 500, color: step.s === 'todo' ? 'var(--text-subtle)' : 'var(--text)' }}>
                    {step.l}{step.s === 'active' && <span style={{ fontSize: 10, fontWeight: 700, color: s.color, marginLeft: 7, background: s.bg, padding: '1px 6px', borderRadius: 4 }}>Fase actual</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DEAL_SCENARIOS, DealBanner, CEDeal });
