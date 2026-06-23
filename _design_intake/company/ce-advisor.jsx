// Arroba — Company Advisor: agente contextual especializado en la empresa visible
// Reglas: no inventa datos · distingue recibido/calculado/inferido · lenguaje probabilístico
// · cita módulos · sin recomendaciones categóricas · termina con una posible acción.

/* Preguntas sugeridas por sección */
const ADVISOR_Q = {
  resumen:      ['¿Esta empresa parece más operativa o holding?', '¿Qué riesgos financieros presenta?', '¿Qué oportunidades podría generar?'],
  finanzas:     ['¿Qué explica la diferencia entre ventas individuales y consolidadas?', '¿Qué partidas explican el beneficio neto de 2024?', '¿Cómo está financiada la compañía?', '¿Cómo ha evolucionado la rentabilidad?'],
  valoracion:   ['¿Qué metodologías usaría una valoración avanzada?', '¿Qué múltiplos podrían ser razonables en su sector?'],
  propiedad:    ['¿Qué significa que tenga varias participadas?', '¿Quién controla la compañía?'],
  gobierno:     ['¿Quién dirige la compañía?', '¿Qué papel tienen los consejeros dominicales?'],
  mercado:      ['¿Cómo se compara con su sector?', '¿En qué destaca frente a la mediana?'],
  senales:      ['¿Qué señales de riesgo presenta?', '¿Qué señales positivas destacan?'],
  oportunidades:['¿Qué oportunidades podría generar?', '¿Por qué encajaría una operación de Buy & Build?'],
  registros:    ['¿Qué información oficial hay disponible?'],
  documentos:   ['¿Qué documentos puedo descargar y para qué sirven?'],
};

const ADVISOR_ACTIONS = {
  finanzas:     { label: 'Ver finanzas', target: 'finanzas' },
  valoracion:   { label: 'Solicitar valoración avanzada', target: 'valoracion' },
  oportunidades:{ label: 'Activar oportunidad', target: 'oportunidades' },
  documentos:   { label: 'Descargar memoria mercantil', target: 'documentos' },
  reclamar:     { label: 'Reclamar empresa', target: 'reclamar' },
};

/* Construye la ficha textual (única fuente permitida) desde los datos reales */
function buildAdvisorContext(C, E) {
  const co = C.company;
  const L = [];
  L.push('## DATOS MAESTROS (recibidos de Iberinform)');
  L.push(`Razón social: ${co.legal}; Nombre comercial: ${co.comercial}; CIF: ${co.cif}; ID Iberinform: ${co.iberinformId}`);
  L.push(`Forma jurídica: ${co.forma}; Actividad: ${co.sector} (CNAE ${co.cnae}); Subsector: ${co.subsector}`);
  L.push(`Domicilio: ${co.domicilio}, ${co.cp} ${co.location.city} (${co.location.province}), ${co.location.comunidad}`);
  L.push(`Web: ${co.web}; Teléfono: ${co.telefono}; Situación mercantil: ${co.status}`);
  L.push(`Capital social: ${co.capital}; Modelo de cuentas: ${co.modeloCuentas}; Último ejercicio: ${co.ultimoEjercicio}`);
  L.push(`Auditada: ${co.audited ? 'Sí, por ' + co.auditor : 'No'}`);
  L.push(`Empleados: ${co.employees} (${co.plantilla.fijos} fijos, ${co.plantilla.temporales} temporales; ${co.plantilla.hombres} hombres, ${co.plantilla.mujeres} mujeres)`);

  const fin = E.finanzas;
  const pyg = arr => arr.map(r => `  - ${r.label}: ${r.val}${r.note ? ' (' + r.note + ')' : ''} [${r.src === 'calc' ? 'calculado' : 'recibido'}]`).join('\n');
  const bal = arr => arr.map(r => `  - ${r.label}: ${r.val}`).join('\n');
  L.push('\n## CUENTA DE RESULTADOS INDIVIDUAL 2024 (recibida; EBITDA e impuesto = calculados por Arroba)');
  L.push(pyg(fin.individual.pyg));
  L.push('## BALANCE INDIVIDUAL 2024 (recibido)');
  L.push('Activo:\n' + bal(fin.individual.balance.activo));
  L.push('Patrimonio neto y pasivo:\n' + bal(fin.individual.balance.pasivo));
  L.push('## RATIOS IBERINFORM (individual, recibidos)');
  L.push(fin.individual.ratiosIberinform.map(g => '  ' + g.group + ': ' + g.items.map(i => i.label + ' ' + i.value).join('; ')).join('\n'));
  L.push('## KPIs DE DEUDA Y LIQUIDEZ (individual, calculados por Arroba)');
  L.push(fin.individual.kpisArroba.map(i => `  - ${i.label}: ${i.value}${i.raw ? ' (' + i.raw + ')' : ''}`).join('\n'));
  L.push('\n## CUENTA DE RESULTADOS CONSOLIDADA 2024 (recibida)');
  L.push(pyg(fin.consolidado.pyg));
  L.push('## BALANCE CONSOLIDADO 2024 (recibido)');
  L.push('Activo:\n' + bal(fin.consolidado.balance.activo));
  L.push('Patrimonio neto y pasivo:\n' + bal(fin.consolidado.balance.pasivo));
  L.push('KPIs consolidados (calculados por Arroba): ' + fin.consolidado.kpisArroba.map(i => i.label + ' ' + i.value).join('; '));

  L.push('\n## GOBIERNO (recibido)');
  L.push('Consejo de administración: ' + C.ownership.consejo.miembros.map(m => `${m.name} (${m.role})`).join('; '));
  L.push('Secretario (no consejero): ' + C.ownership.consejo.secretario);
  L.push('Dirección: ' + C.ownership.direccion.map(d => `${d.name} (${d.role})`).join('; '));
  L.push('Apoderados: ' + C.ownership.apoderados.map(a => a.name).join('; '));
  L.push('Auditor: ' + C.ownership.auditor.name);

  L.push('\n## ACCIONISTAS (recibido)');
  L.push(C.ownership.shareholders.map(s => `  - ${s.name} (${s.role}): ${s.stake}%`).join('\n'));
  L.push('## PARTICIPADAS (recibido)');
  L.push(C.ownership.participadas.map(p => `  - ${p.name} (${p.activity}): ${p.stake}%`).join('\n'));

  L.push('\n## SEÑALES (inferidas por Arroba)');
  L.push(C.signals.map(s => `  - [${s.type}] ${s.label}: ${s.detail}`).join('\n'));
  L.push('## OPORTUNIDADES (inferidas por Arroba)');
  L.push(E.oportunidades.map(o => `  - ${o.type}: ${o.title}. ${o.desc} (confianza ${o.conf}%)`).join('\n'));

  L.push('\n## VALORACIÓN');
  L.push('No hay ninguna valoración generada todavía. La valoración avanzada (75 créditos) usaría múltiplos, comparables, DCF y escenarios.');
  return L.join('\n');
}

const ADVISOR_RULES = `Eres "Company Advisor", el agente de Arroba especializado EXCLUSIVAMENTE en esta empresa. Respondes en español.
REGLAS ESTRICTAS:
1. Usa ÚNICAMENTE los datos de la FICHA. Si algo no está, dilo claramente ("no disponible en la ficha"). No inventes cifras ni hechos.
2. Distingue siempre el tipo de dato: dato recibido de Iberinform, KPI calculado por Arroba, o señal/inferencia de Arroba.
3. Usa lenguaje probabilístico (parece, sugiere, podría, probablemente). No des recomendaciones categóricas ni asesoramiento financiero definitivo.
4. Cita los módulos/fuentes de la ficha que utilizas.
5. Sé conciso y claro (máximo ~120 palabras).
6. Termina proponiendo una posible siguiente acción.`;

const DEAL_CTX = {
  venta: 'La compañía tiene un PROCESO DE VENTA / entrada de socio ABIERTO en Arroba (mandato activo). Acciones disponibles para el comprador: descargar NDA, solicitar cuaderno de venta, hacer match con el vendedor, indicar interés.',
  compra: 'La compañía tiene un MANDATO DE COMPRA (buy & build) activo: busca adquisiciones en hotelero/termal/bienestar en España. Acciones: presentar una oportunidad, hacer match con el comprador, compartir tesis, descargar NDA.',
  financiacion: 'La compañía tiene una RONDA DE FINANCIACIÓN ABIERTA para su expansión (equity/deuda). Acciones para el inversor: descargar NDA, solicitar dossier de inversión, hacer match con el inversor, indicar interés.',
  fusion: 'La compañía EXPLORA UNA FUSIÓN con un actor complementario del sector. Acciones: descargar NDA, explorar encaje estratégico, hacer match, indicar interés.',
};
const DEAL_Q = {
  venta: '¿Qué implica que esta empresa esté en venta?',
  compra: '¿Qué tipo de empresas está buscando comprar?',
  financiacion: '¿Para qué busca financiación esta empresa?',
  fusion: '¿Qué buscaría en una fusión esta empresa?',
};

function CEAdvisor({ C, E, section, go, embedded, deal }) {
  const [msgs, setMsgs] = React.useState([]);
  const [busy, setBusy] = React.useState(false);
  const [input, setInput] = React.useState('');
  const bodyRef = React.useRef(null);
  const rootRef = React.useRef(null);
  const ctx = React.useMemo(() => buildAdvisorContext(C, E), [C, E]);
  const dealActive = deal && deal !== 'none';
  const suggestions = React.useMemo(() => {
    const base = ADVISOR_Q[section] || ADVISOR_Q.resumen;
    return dealActive && DEAL_Q[deal] ? [DEAL_Q[deal], ...base] : base;
  }, [section, deal, dealActive]);

  React.useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [msgs, busy]);

  const doAction = (target) => {
    if (target === 'reclamar') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (target && go) go(target);
  };

  const ask = React.useCallback(async (q) => {
    if (!q || busy) return;
    setInput('');
    setMsgs(m => [...m, { role: 'user', text: q }]);
    setBusy(true);
    const prompt = `${ADVISOR_RULES}

FICHA (única fuente permitida):
${ctx}${dealActive && DEAL_CTX[deal] ? '\n\n## OPERACIÓN ACTIVA (estado de mandato en Arroba)\n' + DEAL_CTX[deal] : ''}

Pregunta del usuario: "${q}"

Responde SOLO con un JSON válido (sin texto adicional, sin markdown) con esta forma exacta:
{"answer":"…","basis":"recibido|calculado|inferido|mixto","sources":["Finanzas","Propiedad"],"action":{"label":"…","target":"…"}}
- "answer": la respuesta (máx ~120 palabras), con lenguaje probabilístico, distinguiendo dato recibido / KPI calculado / inferencia cuando proceda.
- "basis": el tipo de dato predominante usado.
- "sources": módulos de la ficha utilizados (p. ej. Finanzas, Balance, Propiedad, Gobierno, Señales, Oportunidades, Datos maestros).
- "action.label" debe ser EXACTAMENTE uno de: "Ver finanzas", "Solicitar valoración avanzada", "Activar oportunidad", "Descargar memoria mercantil", "Reclamar empresa".
- "action.target" debe ser uno de: finanzas, valoracion, oportunidades, documentos, reclamar.`;

    let parsed = null, raw = '';
    try {
      raw = await window.claude.complete(prompt);
      const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
      const s = clean.indexOf('{'), e = clean.lastIndexOf('}');
      parsed = JSON.parse(clean.slice(s, e + 1));
    } catch (err) {
      parsed = null;
    }

    if (parsed && parsed.answer) {
      const act = parsed.action && parsed.action.target && ADVISOR_ACTIONS[parsed.action.target]
        ? ADVISOR_ACTIONS[parsed.action.target] : ADVISOR_ACTIONS.finanzas;
      setMsgs(m => [...m, { role: 'bot', text: parsed.answer, basis: parsed.basis, sources: parsed.sources || [], action: act }]);
    } else if (raw) {
      setMsgs(m => [...m, { role: 'bot', text: raw.trim(), sources: [], action: ADVISOR_ACTIONS.finanzas }]);
    } else {
      setMsgs(m => [...m, { role: 'bot', text: 'No he podido generar una respuesta en este momento. Puedes consultar los módulos de la ficha directamente.', sources: [], action: ADVISOR_ACTIONS.finanzas }]);
    }
    setBusy(false);
  }, [busy, ctx, go, deal, dealActive]);

  // Accesos contextuales desde los módulos
  React.useEffect(() => {
    const onAsk = (e) => { if (e.detail && e.detail.q) ask(e.detail.q); };
    const onFocus = () => { if (rootRef.current) rootRef.current.scrollIntoView({ block: 'nearest' }); };
    window.addEventListener('arr-advisor-ask', onAsk);
    window.addEventListener('arr-advisor-focus', onFocus);
    return () => { window.removeEventListener('arr-advisor-ask', onAsk); window.removeEventListener('arr-advisor-focus', onFocus); };
  }, [ask]);

  const BASIS = {
    recibido:  { t: 'Dato recibido', c: '#1A8A4A', bg: '#E8F5EE', bd: '#C2E8D0' },
    calculado: { t: 'KPI calculado', c: '#E8001D', bg: 'rgba(232,0,29,.07)', bd: 'rgba(232,0,29,.2)' },
    inferido:  { t: 'Inferencia', c: '#D97708', bg: '#FEF3E2', bd: '#FCD9A3' },
    mixto:     { t: 'Mixto', c: 'var(--text-muted)', bg: 'var(--surface-2)', bd: 'var(--border)' },
  };

  return (
    <aside ref={rootRef} style={embedded
      ? { flex: 1, minHeight: 200, display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }
      : { position: 'sticky', top: 78, alignSelf: 'start', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 96px)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '15px 16px', background: 'linear-gradient(135deg,#0C0C0E,#1A1A18)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <span style={{ position: 'absolute', right: -10, top: -20, fontSize: 96, color: 'rgba(232,0,29,.1)', fontWeight: 800, lineHeight: 1, pointerEvents: 'none' }}>✦</span>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 800 }}>✦</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Company Advisor</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.62)', lineHeight: 1.45 }}>Agente especializado en {C.company.name}. Responde solo con los datos de esta ficha.</div>
        </div>
      </div>

      {/* Conversation */}
      <div ref={bodyRef} style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 4px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 180 }}>
        {msgs.length === 0 && (
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.55, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 13px' }}>
            Pregúntame sobre las cuentas, el balance, los ratios, el gobierno, los accionistas, las participadas o las señales de <strong style={{ color: 'var(--text)' }}>{C.company.comercial}</strong>. Distingo el dato recibido del KPI calculado y de la inferencia, y no doy recomendaciones categóricas.
          </div>
        )}
        {msgs.map((m, i) => m.role === 'user' ? (
          <div key={i} style={{ alignSelf: 'flex-end', maxWidth: '88%', background: '#E8001D', color: '#fff', fontSize: 12.5, fontWeight: 500, lineHeight: 1.45, padding: '9px 12px', borderRadius: '12px 12px 3px 12px' }}>{m.text}</div>
        ) : (
          <div key={i} style={{ alignSelf: 'flex-start', maxWidth: '94%', display: 'flex', flexDirection: 'column', gap: 9 }}>
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px 12px 12px 3px', padding: '11px 13px' }}>
              {m.basis && BASIS[m.basis] && (
                <span style={{ display: 'inline-block', fontSize: 9.5, fontWeight: 700, letterSpacing: '.02em', color: BASIS[m.basis].c, background: BASIS[m.basis].bg, border: `1px solid ${BASIS[m.basis].bd}`, padding: '2px 7px', borderRadius: 4, marginBottom: 8 }}>{BASIS[m.basis].t}</span>
              )}
              <div style={{ fontSize: 12.8, color: 'var(--text)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{m.text}</div>
              {m.sources && m.sources.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10, paddingTop: 9, borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Módulos</span>
                  {m.sources.map((s, j) => <span key={j} style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)', padding: '1px 7px', borderRadius: 4 }}>{s}</span>)}
                </div>
              )}
            </div>
            {m.action && (
              <button onClick={() => doAction(m.action.target)} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 9, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: '#E8001D', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{m.action.label} →</button>
            )}
          </div>
        ))}
        {busy && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px 12px 12px 3px', padding: '11px 13px', fontSize: 12.5, color: 'var(--text-muted)' }}>
            <span className="adv-dot"></span><span className="adv-dot" style={{ animationDelay: '.15s' }}></span><span className="adv-dot" style={{ animationDelay: '.3s' }}></span>
            <span style={{ marginLeft: 4 }}>Analizando la ficha…</span>
          </div>
        )}
      </div>

      {/* Suggested questions (contextual to section) */}
      <div style={{ padding: '8px 12px 4px', flexShrink: 0 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 7 }}>Sugeridas · {(E.nav.find(n => n.id === section) || {}).label || 'Resumen'}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {suggestions.map((q, i) => (
            <button key={i} onClick={() => ask(q)} disabled={busy} style={{ textAlign: 'left', fontSize: 11.5, fontWeight: 500, color: 'var(--text)', background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: 8, cursor: busy ? 'default' : 'pointer', opacity: busy ? .5 : 1, lineHeight: 1.3, fontFamily: 'var(--font-body)' }}>{q}</button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={e => { e.preventDefault(); ask(input.trim()); }} style={{ display: 'flex', gap: 7, padding: 12, borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Pregunta sobre esta empresa…" disabled={busy} style={{ flex: 1, minWidth: 0, fontSize: 12.5, padding: '9px 11px', borderRadius: 9, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'var(--font-body)', outline: 'none' }}/>
        <button type="submit" disabled={busy || !input.trim()} style={{ width: 38, flexShrink: 0, borderRadius: 9, border: 'none', background: input.trim() && !busy ? '#E8001D' : 'var(--surface-2)', color: input.trim() && !busy ? '#fff' : 'var(--text-subtle)', cursor: input.trim() && !busy ? 'pointer' : 'default', fontSize: 15, fontWeight: 800 }}>↑</button>
      </form>
      <div style={{ padding: '0 12px 11px', fontSize: 9.5, color: 'var(--text-subtle)', lineHeight: 1.4, flexShrink: 0 }}>Respuestas orientativas generadas por Arroba a partir de la ficha. No constituyen asesoramiento financiero.</div>
    </aside>
  );
}

Object.assign(window, { CEAdvisor });
