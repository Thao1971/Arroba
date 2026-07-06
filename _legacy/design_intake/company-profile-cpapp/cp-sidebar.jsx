// Arroba — Company Profile right sidebar + agent

/* ── Inline Agent (collapsed by default) ──────────────────── */
function InlineAgent({ company, financials, scores }) {
  const [open, setOpen] = React.useState(false);
  const [msgs, setMsgs] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const bottomRef = React.useRef(null);

  React.useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async (text) => {
    const q = text || query.trim();
    if (!q || loading) return;
    setQuery('');
    setMsgs(m => [...m, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const ctx = `${company.name}: Revenue 3.2M€ (+24%), EBITDA 580K€ (18.1%), Opportunity 82/100, Quality 74, Risk 38, Madtech, Madrid, 23 empleados. Valoración base 4.8M€. Dependencia fundador 62%.`;
      const resp = await window.claude.complete({ messages: [{ role: 'user', content: `Agente de análisis M&A de arroba.com. Responde de forma ejecutiva (max 3 frases). Datos: ${ctx}. Pregunta: ${q}` }] });
      setMsgs(m => [...m, { role: 'agent', text: resp }]);
    } catch { setMsgs(m => [...m, { role: 'agent', text: 'Error al procesar. Inténtalo de nuevo.' }]); }
    setLoading(false);
  };

  const presets = ['¿Por qué tiene Opportunity Score alto?', '¿Cuáles son los riesgos principales?', '¿Qué múltiplo es razonable?'];

  return (
    <div style={{ border: '1px solid rgba(232,0,29,.25)', borderRadius: 10, overflow: 'hidden', background: open ? 'var(--surface)' : 'rgba(232,0,29,.03)' }}>
      {/* Header — always visible, click to toggle */}
      <div onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
        cursor: 'pointer', userSelect: 'none',
      }}>
        <span style={{ fontSize: 14, color: '#E8001D' }}>✦</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Agente de compañía</div>
          {!open && <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Pregunta sobre esta compañía...</div>}
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-subtle)', transform: open ? 'rotate(180deg)' : '', transition: 'transform .2s' }}>▼</span>
      </div>

      {/* Expanded content */}
      {open && (
        <div style={{ borderTop: '1px solid rgba(232,0,29,.15)' }}>
          {/* Messages */}
          {msgs.length > 0 && (
            <div style={{ maxHeight: 200, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '88%', padding: '7px 10px', borderRadius: 8, fontSize: 12, lineHeight: 1.5,
                    background: m.role === 'user' ? '#E8001D' : 'var(--surface-2)',
                    color: m.role === 'user' ? '#fff' : 'var(--text)',
                    border: m.role === 'agent' ? '1px solid var(--border)' : 'none',
                  }}>{m.text}</div>
                </div>
              ))}
              {loading && <div style={{ fontSize: 12, color: 'var(--text-subtle)', padding: '4px 0' }}>Analizando...</div>}
              <div ref={bottomRef}/>
            </div>
          )}

          {/* Presets (only if no messages) */}
          {msgs.length === 0 && (
            <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {presets.map(p => (
                <button key={p} onClick={() => send(p)} style={{
                  textAlign: 'left', padding: '6px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                  border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)',
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}>{p}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6 }}>
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Escribe tu pregunta..."
              style={{ flex: 1, padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12, outline: 'none', fontFamily: 'var(--font-body)' }}
            />
            <button onClick={() => send()} style={{
              padding: '7px 12px', borderRadius: 7, border: 'none', fontSize: 13, fontWeight: 600,
              background: query.trim() ? '#E8001D' : 'var(--border)', color: query.trim() ? '#fff' : 'var(--text-subtle)',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>→</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Tooltip component ─────────────────────────────────────── */
function Tooltip({ children, content, position = 'left' }) {
  const [visible, setVisible] = React.useState(false);
  const ref = React.useRef(null);

  return (
    <span ref={ref}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'help' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <span style={{ fontSize: 9, color: 'var(--text-subtle)', border: '1px solid var(--border)', borderRadius: '50%', width: 14, height: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, lineHeight: 1, flexShrink: 0 }}>?</span>
      {visible && (
        <div style={{
          position: 'absolute',
          ...(position === 'left' ? { right: 0 } : { left: 0 }),
          top: '100%', marginTop: 8, zIndex: 9999,
          width: 260, background: '#0C0C0E', color: '#F4F4F0',
          borderRadius: 10, padding: '14px 16px',
          boxShadow: '0 8px 32px rgba(0,0,0,.35)',
          border: '1px solid rgba(255,255,255,.08)',
          pointerEvents: 'none',
        }}>
          {/* Arrow */}
          <div style={{
            position: 'absolute', top: -5,
            ...(position === 'left' ? { right: 20 } : { left: 20 }),
            width: 10, height: 10, background: '#0C0C0E',
            border: '1px solid rgba(255,255,255,.08)',
            borderBottom: 'none', borderRight: 'none',
            transform: 'rotate(45deg)',
          }}/>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#FAFAF8', marginBottom: 6 }}>{content.title}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', lineHeight: 1.55, marginBottom: 8 }}>{content.desc}</div>
          {content.method && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 8, lineHeight: 1.5 }}>
              <span style={{ color: '#E8001D', fontWeight: 600 }}>Metodología:</span> {content.method}
            </div>
          )}
          {content.range && (
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {content.range.map(r => (
                <div key={r.label} style={{ flex: 1, padding: '5px 6px', borderRadius: 5, background: `${r.color}22`, border: `1px solid ${r.color}44`, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: r.color }}>{r.label}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', marginTop: 1 }}>{r.range}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </span>
  );
}

const SCORE_TOOLTIPS = {
  opportunity: {
    title: 'Opportunity Score',
    desc: 'Puntuación global de oportunidad de inversión o adquisición. Combina crecimiento, calidad financiera, compatibilidad con compradores activos y fragmentación del mercado. Es el score principal de arroba.com.',
    method: 'Modelo propietario: pesos ponderados de Growth (30%), Quality (25%), M&A Readiness (25%) y Risk inverso (20%). Calibrado sobre +1.200 operaciones históricas.',
    range: [
      { label: 'Alta', range: '70–100', color: '#E8001D' },
      { label: 'Media', range: '45–69', color: '#D97708' },
      { label: 'Baja', range: '0–44', color: '#636360' },
    ],
  },
  quality: {
    title: 'Quality Score',
    desc: 'Mide la solidez financiera y operativa de la compañía: estabilidad de márgenes, eficiencia del equipo, recurrencia de clientes y diversificación de ingresos.',
    method: 'Variables: margen EBITDA relativo al sector (P-score), revenue por empleado, concentración de top-3 clientes, crecimiento de OPEX vs. revenue.',
    range: [
      { label: 'Sólida', range: '65–100', color: '#1A8A4A' },
      { label: 'Media', range: '40–64', color: '#D97708' },
      { label: 'Frágil', range: '0–39', color: '#E8001D' },
    ],
  },
  growth: {
    title: 'Growth Score',
    desc: 'Evalúa la trayectoria y sostenibilidad del crecimiento. Compara el CAGR de la compañía contra la mediana sectorial y penaliza crecimientos puntuales no recurrentes.',
    method: 'CAGR 3Y revenue vs. P50 sectorial, aceleración o desaceleración YoY, expansión de headcount alineada al revenue, contratos plurianuales como proxy de visibilidad.',
    range: [
      { label: 'Alto', range: '65–100', color: '#2164E3' },
      { label: 'Medio', range: '40–64', color: '#D97708' },
      { label: 'Bajo', range: '0–39', color: '#636360' },
    ],
  },
  risk: {
    title: 'Risk Score',
    desc: 'Score de riesgo. A diferencia de los demás scores, un valor BAJO es positivo. Mide concentración de clientes, dependencia del fundador, deuda, litigios y concentración accionarial.',
    method: 'Factores: % stake del fundador, ratio top-cliente/revenue, deuda financiera neta/EBITDA, número de litigios mercantiles activos, antigüedad media del equipo directivo.',
    range: [
      { label: 'Bajo ✓', range: '0–35', color: '#1A8A4A' },
      { label: 'Medio', range: '36–65', color: '#D97708' },
      { label: 'Alto', range: '66–100', color: '#E8001D' },
    ],
  },
  ma: {
    title: 'M&A Readiness',
    desc: 'Nivel de preparación de la compañía para una operación de M&A. Evalúa la calidad documental, estructura societaria, gobierno corporativo y la presencia de cuentas auditadas.',
    method: 'Checklist ponderado: cuentas auditadas (+25), acuerdos de socios (+20), pacto de no competencia (+15), plan de negocio actualizado (+15), CIM disponible (+25).',
    range: [
      { label: 'Lista', range: '70–100', color: '#7C3AED' },
      { label: 'Parcial', range: '40–69', color: '#D97708' },
      { label: 'Pendiente', range: '0–39', color: '#636360' },
    ],
  },
};


function ScoresPanel({ scores, company, financials }) {
  const [hovered, setHovered] = React.useState(null);
  const hero = scores.find(s => s.hero);
  const rest = scores.filter(s => !s.hero);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Hero: Opportunity Score */}
      <div style={{
        background: 'var(--surface)', border: '1.5px solid rgba(232,0,29,.3)',
        borderRadius: 12, padding: 20,
        boxShadow: '0 4px 20px rgba(232,0,29,.08)',
      }}>
        <Tooltip content={SCORE_TOOLTIPS.opportunity} position="left">
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: '#E8001D' }}>
            Opportunity Score
          </div>
        </Tooltip>
        <div style={{ marginBottom: 14 }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ScoreRing value={hero.value} color="#E8001D" size={88} sw={8}/>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
              Alta oportunidad
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {hero.desc}
            </div>
          </div>
        </div>
        {/* Driver pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
          {['Crecimiento P82', 'Margen P75+', 'Sector fragmentado'].map(t => (
            <span key={t} style={{ fontSize: 10, fontWeight: 600, color: '#1A6A38', background: '#E8F5EE', padding: '3px 8px', borderRadius: 3, border: '1px solid #C2E8D0' }}>
              ↑ {t}
            </span>
          ))}
          <span style={{ fontSize: 10, fontWeight: 600, color: '#B45309', background: '#FEF3E2', padding: '3px 8px', borderRadius: 3, border: '1px solid #FCD9A3' }}>
            ↓ Dependencia fundador
          </span>
        </div>
      </div>

      {/* Inline Agent between hero and score bars */}
      <InlineAgent company={company} financials={financials} scores={scores}/>

      {/* Other scores */}
      <div style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 16 }}>
          Scores de inteligencia
        </div>
        {rest.map(s => (
          <div key={s.id} onMouseEnter={() => setHovered(s.id)} onMouseLeave={() => setHovered(null)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Tooltip content={SCORE_TOOLTIPS[s.id]} position="left">
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</span>
              </Tooltip>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {s.inverted && (
                  <span style={{ fontSize: 10, fontWeight: 600, color: s.value < 40 ? '#1A8A4A' : s.value < 65 ? '#D97708' : '#E8001D', background: `${s.color}18`, padding: '1px 6px', borderRadius: 3 }}>
                    {s.value < 40 ? 'Bajo' : s.value < 65 ? 'Medio' : 'Alto'}
                  </span>
                )}
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', width: 24, textAlign: 'right' }}>{s.value}</span>
              </div>
            </div>
            <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ height: '100%', width: `${s.inverted ? 100 - s.value : s.value}%`, background: s.color, borderRadius: 3 }}/>
            </div>
            {hovered === s.id && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '8px 10px', borderRadius: 6, marginBottom: 10, marginTop: -8, lineHeight: 1.5 }}>
                {s.desc}
              </div>
            )}
          </div>
        ))}
        <div style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 4 }}>
          Hover sobre el nombre para ver metodología
        </div>
      </div>
    </div>
  );
}

/* ── Valuation Card ────────────────────────────────────────── */
function ValuationCard({ val }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
          Valoración indicativa
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#1A8A4A', background: '#E8F5EE', padding: '2px 8px', borderRadius: 3, border: '1px solid #C2E8D0' }}>
          {val.confidenceLabel}
        </span>
      </div>

      <ValuationRange val={val} />
      <ConfidenceBar value={val.confidenceValue} label={val.confidenceLabel} />

      <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 10 }}>{val.method}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          {[
            { l: 'Múltiplo bajo', v: `${val.multiple.low}x` },
            { l: 'Múltiplo base', v: `${val.multiple.mid}x`, highlight: true },
            { l: 'Múltiplo alto', v: `${val.multiple.high}x` },
          ].map(m => (
            <div key={m.l} style={{ textAlign: 'center', padding: '8px 4px', background: m.highlight ? 'rgba(232,0,29,.05)' : 'var(--surface-2)', borderRadius: 6, border: m.highlight ? '1px solid rgba(232,0,29,.2)' : '1px solid var(--border)' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: m.highlight ? '#E8001D' : 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{m.v}</div>
              <div style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 2 }}>{m.l}</div>
            </div>
          ))}
        </div>

        {/* Value drivers */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {val.drivers.map(d => {
            const c = d.impact === 'positive' ? { color: '#1A6A38', bg: '#E8F5EE', icon: '↑' }
              : d.impact === 'negative' ? { color: '#B5001A', bg: '#FDE8EA', icon: '↓' }
              : { color: '#92540A', bg: '#FEF3E2', icon: '~' };
            return (
              <span key={d.label} style={{ fontSize: 10, fontWeight: 600, color: c.color, background: c.bg, padding: '2px 7px', borderRadius: 3 }}>
                {c.icon} {d.label}
              </span>
            );
          })}
        </div>

        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-subtle)', lineHeight: 1.5 }}>{val.note}</div>
      </div>

      <button style={{
        marginTop: 16, width: '100%', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 600,
        border: '1.5px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)',
        cursor: 'pointer', fontFamily: 'var(--font-body)',
      }}>
        Abrir valoración completa →
      </button>
    </div>
  );
}

/* ── Buyers Panel ──────────────────────────────────────────── */
function BuyersPanel({ buyers }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
          Compradores potenciales
        </div>
        <span style={{ fontSize: 10, color: '#E8001D', fontWeight: 600, cursor: 'pointer' }}>Ver todos →</span>
      </div>
      {buyers.map((b, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: i < buyers.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{b.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{b.reason}</div>
            <span style={{ display: 'inline-block', marginTop: 4, fontSize: 10, fontWeight: 600, color: 'var(--text-subtle)', background: 'var(--surface-2)', padding: '1px 6px', borderRadius: 3, border: '1px solid var(--border)' }}>{b.type}</span>
          </div>
          <div style={{ flexShrink: 0, marginLeft: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: b.fit >= 85 ? '#E8001D' : 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{b.fit}%</div>
            <div style={{ fontSize: 10, color: 'var(--text-subtle)', textAlign: 'center' }}>fit</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Contextual Agent ──────────────────────────────────────── */
function AgentPanel({ company, financials, scores }) {
  const [query, setQuery] = React.useState('');
  const [msgs, setMsgs] = React.useState([
    { role: 'agent', text: 'Hola. Soy el agente de análisis de Creativa Estratégica. Puedes preguntarme sobre su perfil financiero, señales, valoración o encaje con compradores.' }
  ]);
  const [loading, setLoading] = React.useState(false);
  const bottomRef = React.useRef(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const presets = [
    '¿Por qué tiene un Opportunity Score alto?',
    '¿Cuáles son los principales riesgos?',
    '¿Qué múltiplo tiene sentido para esta compañía?',
  ];

  const send = async (text) => {
    const q = text || query.trim();
    if (!q || loading) return;
    setQuery('');
    setMsgs(m => [...m, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const context = `Compañía: ${company.name} (${company.legal}). Sector: ${company.sector}. Empleados: ${company.employees}. Revenue 2024: 3.2M€ (+24%). EBITDA: 580K€ (18.1% margen). Opportunity Score: 82/100. Quality: 74. Growth: 68. Risk: 38 (bajo). M&A Readiness: 61. Valoración base: 4.8M€ (EV/EBITDA 8.3x). Señales positivas: revenue P82 sectorial, adjudicación pública 1.2M€. Riesgo principal: dependencia fundador (62% stake). Fundada 2014, Madrid.`;
      const resp = await window.claude.complete({
        messages: [{ role: 'user', content: `Eres el agente de análisis de arroba.com, una plataforma de inteligencia empresarial y M&A. Analiza esta compañía de forma ejecutiva y concisa (máx 3-4 frases). Datos: ${context}. Pregunta del usuario: ${q}` }]
      });
      setMsgs(m => [...m, { role: 'agent', text: resp }]);
    } catch {
      setMsgs(m => [...m, { role: 'agent', text: 'No pude procesar la consulta. Inténtalo de nuevo.' }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-2)' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0C0C0E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#E8001D', fontWeight: 900 }}>@</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Agente de análisis</div>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Contextual · Creativa Estratégica</div>
        </div>
        <div style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: '#1A8A4A' }}/>
      </div>

      {/* Messages */}
      <div style={{ height: 220, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.role === 'agent' && (
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#0C0C0E', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#E8001D', fontWeight: 900, marginTop: 2 }}>@</div>
            )}
            <div style={{
              maxWidth: '85%', padding: '9px 12px', borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
              background: m.role === 'user' ? '#E8001D' : 'var(--surface-2)',
              color: m.role === 'user' ? '#fff' : 'var(--text)',
              fontSize: 12, lineHeight: 1.55,
              border: m.role === 'agent' ? '1px solid var(--border)' : 'none',
            }}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#0C0C0E', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#E8001D', fontWeight: 900 }}>@</div>
            <div style={{ padding: '10px 14px', borderRadius: '12px 12px 12px 4px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0,1,2].map(j => <div key={j} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--text-subtle)', animation: `bounce .8s ${j*0.15}s infinite` }}/>)}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Presets */}
      {msgs.length <= 1 && (
        <div style={{ padding: '0 14px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {presets.map(p => (
            <button key={p} onClick={() => send(p)} style={{
              textAlign: 'left', padding: '7px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500,
              border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>{p}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Pregunta sobre esta compañía..."
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-strong)',
            background: 'var(--surface)', color: 'var(--text)', fontSize: 12,
            outline: 'none', fontFamily: 'var(--font-body)',
          }}
        />
        <button onClick={() => send()} disabled={loading || !query.trim()} style={{
          padding: '8px 14px', borderRadius: 8, border: 'none',
          background: query.trim() && !loading ? '#E8001D' : 'var(--border)',
          color: query.trim() && !loading ? '#fff' : 'var(--text-subtle)',
          fontSize: 13, cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-body)',
        }}>→</button>
      </div>
    </div>
  );
}

Object.assign(window, { InlineAgent, ScoresPanel, ValuationCard, BuyersPanel, AgentPanel });
