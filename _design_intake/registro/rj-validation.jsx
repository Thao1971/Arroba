// Arroba — Registration Journey · validación + pago + éxito (enriquecimiento progresivo)

const PLAZO_TXT = { 'Ahora': 'de forma inmediata', 'En los próximos 12 meses': 'en los próximos 12 meses', 'Más adelante': 'más adelante' };

const RJ_ENTITY_ICON = { 'Tesis de Inversión': 'target', 'Oportunidad potencial': 'handshake', 'Caso de Capital': 'trend' };

function entityTitle(data) {
  const it = window.RJ.intents.find(x => x.id === data.intent);
  const co = data.company ? data.company.name : data.vehicle;
  return (it && it.entity ? it.entity : 'Oportunidad') + (co ? ' · ' + co : '');
}

function buildSummary(data) {
  const co = data.company ? data.company.name : (data.vehicle || 'Tu empresa');
  const goals = Array.isArray(data.objetivo) ? data.objetivo.map(g => g.toLowerCase()).join(', ') : (data.objetivo || '').toLowerCase();
  const plazo = (window.PLAZO_TXT && window.PLAZO_TXT[data.plazo]) || (data.plazo || '').toLowerCase();
  if (data.intent === 'vender') return `${co} está estudiando su futuro: ${goals}. Se plantea avanzar ${plazo}, manteniendo el control del proceso en todo momento.`;
  if (data.intent === 'financiar') return `${co} busca financiación para ${goals}, con la intención de avanzar ${plazo}.`;
  if (data.intent === 'comprar') return `Estás preparando una tesis de adquisición para ${goals}, operando desde ${co}, con un horizonte de ${plazo}.`;
  return `${co}: oportunidad en preparación.`;
}

/* Tarjeta editable del resumen */
function EditCard({ label, value, icon, onChange, editable = true }) {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState(value);
  React.useEffect(() => setVal(value), [value]);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 15px', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)' }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={15} color="var(--text-muted)"/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 3 }}>{label}</div>
        {editing ? (
          <input value={val} onChange={e => setVal(e.target.value)} autoFocus
            onBlur={() => { setEditing(false); onChange && onChange(val); }}
            onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); onChange && onChange(val); } }}
            style={{ width: '100%', border: '1.5px solid #E8001D', borderRadius: 8, padding: '6px 9px', fontSize: 14, color: 'var(--text)', background: 'var(--surface)', fontFamily: 'var(--font-body)', outline: 'none' }}/>
        ) : (
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>{value || '—'}</div>
        )}
      </div>
      {editable && !editing && (
        <button onClick={() => setEditing(true)} title="Editar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', display: 'flex', padding: 4, flexShrink: 0 }}>
          <Icon name="edit" size={15}/>
        </button>
      )}
    </div>
  );
}

function Validation({ data, setData, onContinue }) {
  const it = window.RJ.intents.find(x => x.id === data.intent);
  const co = data.company ? data.company.name : data.vehicle;
  const goalsStr = Array.isArray(data.objetivo) ? data.objetivo.join(' · ') : data.objetivo;
  return (
    <div style={{ animation: 'rjIn .4s ease both' }}>
      {/* Resumen del Copilot */}
      <div style={{ background: 'var(--surface)', border: '1.5px solid rgba(232,0,29,.22)', borderRadius: 16, padding: '18px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spark size={13} color="#fff"/></div>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>Resumen preparado por Arroba Copilot</span>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 600, color: '#E8001D', background: 'rgba(232,0,29,.07)', border: '1px solid rgba(232,0,29,.2)', padding: '4px 10px', borderRadius: 6, marginBottom: 12 }}>
          <Icon name={RJ_ENTITY_ICON[it.entity] || 'target'} size={13} color="#E8001D"/> {entityTitle(data)}
        </div>
        <p style={{ fontSize: 16, color: 'var(--text)', lineHeight: 1.6 }}>“{buildSummary(data)}”</p>
      </div>

      {/* Tarjetas editables */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
        {co && <EditCard label="Empresa" icon="building" value={co} onChange={v => setData(d => ({ ...d, company: d.company ? { ...d.company, name: v } : null, vehicle: v }))}/>}
        <EditCard label="Objetivo" icon="target" value={goalsStr} editable={false}/>
        <EditCard label="Horizonte" icon="clock" value={data.plazo} editable={false}/>
        <EditCard label="Tipo de entidad" icon="layers" value={it.entity} editable={false}/>
      </div>

      <button onClick={onContinue} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#E8001D', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        Continuar <Icon name="arrow" size={17} color="#fff"/>
      </button>
      <p style={{ fontSize: 12, color: 'var(--text-subtle)', textAlign: 'center', marginTop: 11, lineHeight: 1.5 }}>Podrás revisar y completar todos los detalles más adelante, sin prisa.</p>
    </div>
  );
}

/* Paywall (mock) */
function Payment({ data, onPaid }) {
  const explore = data.intent === 'explorar';
  return (
    <div style={{ animation: 'rjIn .4s ease both' }}>
      <div style={{ background: 'linear-gradient(135deg,#0C0C0E,#1A1A18)', borderRadius: 16, padding: 22, position: 'relative', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', right: -10, top: -20, fontSize: 110, color: 'rgba(232,0,29,.12)', fontWeight: 800, lineHeight: 1, pointerEvents: 'none' }}>✦</span>
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: 8 }}>Activa tu espacio de trabajo</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', lineHeight: 1.2, marginBottom: 8 }}>
            {explore ? 'Empieza a explorar arroba' : entityTitle(data)}
          </div>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,.66)', lineHeight: 1.55, marginBottom: 18 }}>
            {explore
              ? 'Accede a la inteligencia de mercado, analiza empresas y descubre oportunidades. Arroba Copilot creará tu primera oportunidad cuando la necesites.'
              : 'Al activar tu espacio, Arroba Copilot empieza a trabajar tu oportunidad con confidencialidad: análisis, valoración, matching y procesos.'}
          </p>
          {[['Arroba Copilot ✦ trabajando para ti', 'sparkles'], ['Análisis y valoración con datos de mercado', 'trend'], ['Confidencialidad y control del proceso', 'lock']].map(([t, ic]) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Icon name={ic} size={15} color="#E8001D"/><span style={{ fontSize: 13, color: 'rgba(255,255,255,.85)' }}>{t}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '16px 0 16px' }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>49€</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,.5)' }}>/ mes · cancela cuando quieras</span>
          </div>
          <button onClick={onPaid} style={{ width: '100%', padding: '14px', borderRadius: 11, border: 'none', background: '#E8001D', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            Activar mi espacio de trabajo
          </button>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', textAlign: 'center', marginTop: 10 }}>Demo · no se realiza ningún cobro real</p>
        </div>
      </div>
    </div>
  );
}

/* Éxito + enriquecimiento progresivo */
function Success({ data }) {
  const explore = data.intent === 'explorar';
  return (
    <div style={{ animation: 'rjIn .4s ease both' }}>
      <div style={{ textAlign: 'center', padding: '8px 0 22px' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: '#E8F5EE', border: '1px solid #C2E8D0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Icon name="check" size={28} color="#1A8A4A" sw={2.4}/>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: 8 }}>Tu espacio está listo</h2>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.55, maxWidth: 400, margin: '0 auto' }}>
          {explore ? 'Ya puedes analizar, valorar y descubrir oportunidades en arroba.' : <>He guardado <strong style={{ color: 'var(--text)' }}>{entityTitle(data)}</strong> en Mis Oportunidades y empiezo a trabajarla.</>}
        </p>
      </div>

      {/* Enriquecimiento progresivo */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>Tu perfil</span>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#E8001D', fontVariantNumeric: 'tabular-nums' }}>67%</span>
        </div>
        <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ height: '100%', width: '67%', background: 'linear-gradient(90deg,#E8001D,#FF1A35)', borderRadius: 8 }}></div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 14 }}>Cuanto mejor te conozca, mejores oportunidades podré proponerte. No hay prisa: lo iremos completando desde tu espacio.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 11 }}>
          <Spark size={14}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Siguiente paso recomendado</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-subtle)' }}>Sectores de interés · 1 minuto</div>
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#E8001D' }}>Completar →</span>
        </div>
      </div>

      <a href="Mis Oportunidades.html" style={{ display: 'inline-flex', width: '100%', boxSizing: 'border-box', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 12, border: 'none', background: '#E8001D', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', textDecoration: 'none' }}>
        Entrar en Mis Oportunidades <Icon name="arrow" size={17} color="#fff"/>
      </a>
    </div>
  );
}

Object.assign(window, { Validation, Payment, Success, PLAZO_TXT, entityTitle, buildSummary });
