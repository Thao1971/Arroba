// Arroba — Registration Journey Engine · motor de conversación + validación + pago

function normalizeES(s) { return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }

function App() {
  const R = window.RJ;
  const [dark, setDark] = React.useState(false);
  const [msgs, setMsgs] = React.useState([]);     // hilo: {role:'copilot'|'user', text}
  const [waiting, setWaiting] = React.useState(true);
  const [stage, setStage] = React.useState('intent');
  const [branchIdx, setBranchIdx] = React.useState(0);
  const [data, setData] = React.useState({});     // {intent, about, company, vehicle, objetivo, plazo}
  const [multiSel, setMultiSel] = React.useState([]);
  const scroller = React.useRef(null);

  React.useEffect(() => { document.documentElement.toggleAttribute('data-dark', dark); }, [dark]);

  // arranque: intro + Q1
  React.useEffect(() => {
    setTimeout(() => { pushCopilot(R.intro); setTimeout(() => { pushCopilot('Para empezar, ¿qué te gustaría hacer?'); setWaiting(false); }, 900); }, 450);
  }, []);

  React.useEffect(() => { if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }, [msgs, waiting, stage, branchIdx, multiSel]);

  function pushCopilot(text) { setMsgs(m => [...m, { role: 'copilot', text }]); }
  function pushUser(text) { setMsgs(m => [...m, { role: 'user', text }]); }
  function copilotThen(text, fn, delay = 760) { setWaiting(true); setTimeout(() => { pushCopilot(text); setWaiting(false); fn && fn(); }, delay); }

  const flow = data.intent && data.intent !== 'explorar' ? R.flows[data.intent] : null;

  // progreso (4 pasos)
  const stepIdx = { intent: 0, about: 1, vehicle: 2, company: 2, confirm: 2, branch: 2, validation: 3, auth: 3, payment: 3, success: 3 }[stage] ?? 0;

  // ── crear cuenta (al final, antes de activar) ──
  function submitAuth(creds) {
    setData(d => ({ ...d, account: creds }));
    pushUser(`Crear cuenta · ${creds.email}`);
    copilotThen(`Listo, ${creds.nombre}. Tu cuenta queda asociada a esta oportunidad. Activa tu espacio para que empiece a trabajar.`, () => setStage('payment'));
  }

  // ── Q1 intención ──
  function chooseIntent(it) {
    pushUser(it.title);
    setData(d => ({ ...d, intent: it.id }));
    copilotThen('Cuéntame un poco sobre ti, así ajusto lo que te propongo.', () => setStage('about'));
  }

  // ── Q2 sobre ti ──
  function chooseAbout(ab) {
    pushUser(ab.title);
    setData(d => ({ ...d, about: ab.id }));
    const it = R.intents.find(x => x.id === data.intent);
    if (data.intent === 'explorar') {
      copilotThen('Perfecto. Te dejo explorar libremente: analiza empresas, valora y descubre oportunidades. Iré aprendiendo de lo que mires para proponerte cosas relevantes. Antes, crea tu cuenta.', () => setStage('auth'));
      return;
    }
    // crea entidad y pide empresa/vehículo
    if (data.intent === 'comprar') {
      copilotThen(`Voy a preparar tu ${it.entity}. ${flowFor('comprar').vehicleQ}`, () => setStage('vehicle'));
    } else {
      const f = flowFor(data.intent);
      copilotThen(`Voy a preparar tu ${it.entity}. ${f.companyQ}`, () => setStage('company'));
    }
  }
  function flowFor(id) { return R.flows[id]; }

  // ── empresa / vehículo ──
  function pickCompany(c) {
    pushUser(c.name);
    setData(d => ({ ...d, pending: c }));
    copilotThen(`He localizado esta empresa en nuestra base de datos. Confírmame que es la tuya antes de seguir.`, () => setStage('confirm'));
  }
  function confirmCompany(c) {
    pushUser('Sí, es esta');
    setData(d => ({ ...d, company: c, pending: null }));
    copilotThen(`Perfecto. Ya estoy construyendo su ficha. ${flowFor(data.intent).steps[0].q}`, () => { setStage('branch'); setBranchIdx(0); });
  }
  function rejectCompany() {
    pushUser('No, buscar otra');
    setData(d => ({ ...d, pending: null }));
    const f = flowFor(data.intent);
    const q = data.intent === 'comprar' ? f.vehicleQ : f.companyQ;
    copilotThen(`Sin problema. ${q}`, () => setStage(data.intent === 'comprar' ? 'vehicle' : 'company'));
  }
  function freeVehicle(text) {
    pushUser(text);
    setData(d => ({ ...d, vehicle: text, company: { name: text, free: true } }));
    copilotThen(`Anotado: ${text}. ${flowFor('comprar').steps[0].q}`, () => { setStage('branch'); setBranchIdx(0); });
  }

  // ── pasos de la rama ──
  function answerBranch(step, displayText, value) {
    pushUser(displayText);
    setData(d => ({ ...d, [step.field]: value }));
    setMultiSel([]);
    const steps = flowFor(data.intent).steps;
    if (branchIdx < steps.length - 1) {
      const next = steps[branchIdx + 1];
      copilotThen(next.q, () => setBranchIdx(branchIdx + 1));
    } else {
      copilotThen('Gracias. Con esto ya puedo preparar tu resumen.', () => setStage('validation'), 700);
    }
  }

  const cur = flow && stage === 'branch' ? flow.steps[branchIdx] : null;

  // ── Render ──
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Cabecera: logo + progreso discreto */}
      <header style={{ height: 60, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 max(20px, calc((100vw - 1100px) / 2))', borderBottom: '1px solid var(--border)', background: 'color-mix(in srgb, var(--bg) 86%, transparent)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', position: 'sticky', top: 0, zIndex: 20 }}>
        <a href="Home.html" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="uploads/logo.png" alt="arroba" style={{ height: 55, filter: dark ? 'brightness(0) invert(1)' : 'none' }}/>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {stage !== 'success' && <ProgressDots total={4} current={stepIdx}/>}
          <button onClick={() => setDark(!dark)} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={dark ? 'sun' : 'moon'} size={15} color="var(--text-muted)"/>
          </button>
        </div>
      </header>

      {/* Hilo conversacional (crece verticalmente) */}
      <div ref={scroller} style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 620, margin: '0 auto', padding: '34px 24px 60px', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {msgs.map((m, i) => m.role === 'copilot'
            ? <CopilotBubble key={i} fade={i === msgs.length - 1}>{m.text}</CopilotBubble>
            : <UserBubble key={i}>{m.text}</UserBubble>)}
          {waiting && <Typing/>}

          {/* Zona de respuesta activa (inline, al final del hilo) */}
          {!waiting && (
            <div style={{ paddingLeft: 45, animation: 'rjIn .4s ease both' }}>
              {stage === 'intent' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {R.intents.map(it => <AnswerCard key={it.id} {...it} onClick={() => chooseIntent(it)}/>)}
                </div>
              )}
              {stage === 'about' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {R.about.map(ab => <AnswerCard key={ab.id} {...ab} onClick={() => chooseAbout(ab)}/>)}
                </div>
              )}
              {stage === 'vehicle' && <CompanyPicker hint={flowFor('comprar').vehicleHint} onPick={pickCompany} onFree={freeVehicle} allowFree/>}
              {stage === 'company' && <CompanyPicker hint={flowFor(data.intent).companyHint} onPick={pickCompany}/>}
              {stage === 'confirm' && <CompanyConfirm c={data.pending} onConfirm={() => confirmCompany(data.pending)} onReject={rejectCompany}/>}
              {cur && cur.type === 'single' && (
                <ChipRow chips={cur.chips} onPick={c => answerBranch(cur, c, c)}/>
              )}
              {cur && cur.type === 'multi' && (
                <MultiChips chips={cur.chips} sel={multiSel} setSel={setMultiSel} hint={cur.hint}
                  onSend={() => answerBranch(cur, multiSel.join(' · '), [...multiSel])}/>
              )}
              {stage === 'validation' && <Validation data={data} setData={setData} onContinue={() => copilotThen('Perfecto. Crea tu cuenta para guardar esta oportunidad en tu espacio.', () => setStage('auth'))}/>}
              {stage === 'auth' && <AuthForm onSubmit={submitAuth}/>}
              {stage === 'payment' && <Payment data={data} onPaid={() => setStage('success')}/>}
              {stage === 'success' && <Success data={data}/>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Fila de chips (single) */
function ChipRow({ chips, onPick }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>{chips.map(c => <Chip key={c} onClick={() => onPick(c)}>{c}</Chip>)}</div>;
}

/* Multi-select con botón continuar */
function MultiChips({ chips, sel, setSel, onSend, hint }) {
  const toggle = c => setSel(s => s.includes(c) ? s.filter(x => x !== c) : [...s, c]);
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
        {chips.map(c => <Chip key={c} active={sel.includes(c)} onClick={() => toggle(c)}>{c}</Chip>)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 13 }}>
        <button onClick={onSend} disabled={!sel.length}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 999, border: 'none', cursor: sel.length ? 'pointer' : 'not-allowed', background: sel.length ? '#E8001D' : 'var(--surface-2)', color: sel.length ? '#fff' : 'var(--text-subtle)', fontSize: 13.5, fontWeight: 700, fontFamily: 'var(--font-body)', minHeight: 40 }}>
          Continuar <Icon name="arrow" size={14} color={sel.length ? '#fff' : 'var(--text-subtle)'}/>
        </button>
        {hint && <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{hint}</span>}
      </div>
    </div>
  );
}

/* Crear cuenta — credenciales al final del journey */
function AuthForm({ onSubmit }) {
  const [f, setF] = React.useState({ nombre: '', email: '', pass: '' });
  const [foc, setFoc] = React.useState('');
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const valid = f.nombre.trim() && /\S+@\S+\.\S+/.test(f.email) && f.pass.length >= 6;
  const fields = [['nombre', 'Nombre', 'text', 'Tu nombre'], ['email', 'Email', 'email', 'tu@empresa.com'], ['pass', 'Contraseña', 'password', 'Mínimo 6 caracteres']];
  return (
    <div style={{ animation: 'rjIn .4s ease both' }}>
      <div style={{ border: '1px solid var(--border)', borderRadius: 16, background: 'var(--surface)', padding: '22px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spark size={13} color="#fff"/></div>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Crea tu cuenta</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {fields.map(([k, label, type, ph]) => (
            <div key={k}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6 }}>{label}</label>
              <input type={type} value={f[k]} onChange={e => set(k, e.target.value)} onFocus={() => setFoc(k)} onBlur={() => setFoc('')} placeholder={ph}
                style={{ width: '100%', padding: '11px 13px', borderRadius: 10, border: `1.5px solid ${foc === k ? '#E8001D' : 'var(--border-strong)'}`, background: 'var(--surface)', color: 'var(--text)', fontSize: 14.5, fontFamily: 'var(--font-body)', outline: 'none', boxShadow: foc === k ? '0 0 0 3px rgba(232,0,29,.15)' : 'none' }}/>
            </div>
          ))}
        </div>
        <button onClick={() => valid && onSubmit(f)} disabled={!valid}
          style={{ width: '100%', marginTop: 18, padding: '13px', borderRadius: 11, border: 'none', cursor: valid ? 'pointer' : 'not-allowed', background: valid ? '#E8001D' : 'var(--surface-2)', color: valid ? '#fff' : 'var(--text-subtle)', fontSize: 14.5, fontWeight: 700, fontFamily: 'var(--font-body)' }}>
          Crear cuenta
        </button>
        <p style={{ fontSize: 11.5, color: 'var(--text-subtle)', textAlign: 'center', marginTop: 11, lineHeight: 1.5 }}>Al continuar aceptas los términos y la política de privacidad de arroba.</p>
      </div>
    </div>
  );
}

/* Confirmación: muestra los datos de la empresa identificada */
function CompanyConfirm({ c, onConfirm, onReject }) {
  if (!c) return null;
  const rows = [
    ['Razón social', c.razon], ['CIF', c.cif], ['Forma jurídica', c.forma],
    ['Sector', c.sector], ['Domicilio', `${c.city} (${c.province})`], ['Web', c.web],
  ];
  return (
    <div style={{ animation: 'rjIn .4s ease both' }}>
      <div style={{ border: '1.5px solid var(--border)', borderRadius: 16, background: 'var(--surface)', overflow: 'hidden', marginBottom: 14 }}>
        {/* cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 11, background: 'linear-gradient(135deg,#0C0C0E,#2E2E2C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 800, color: '#E8001D', fontFamily: 'var(--font-display)', flexShrink: 0 }}>{c.name[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{c.name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{c.sector} · {c.city}</div>
          </div>
        </div>
        {/* datos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px', padding: '16px 18px' }}>
          {rows.map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 3 }}>{k}</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', wordBreak: 'break-word' }}>{v}</div>
            </div>
          ))}
        </div>
        {/* cifras */}
        <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--border)' }}>
          {[['Facturación', c.revenue], ['EBITDA', c.ebitda], ['Empleados', String(c.employees)]].map(([k, v], i) => (
            <div key={k} style={{ flex: 1, padding: '13px 16px', borderLeft: i ? '1px solid var(--border)' : 'none', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>{v}</div>
              <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>{k}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onConfirm} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 11, border: 'none', background: '#E8001D', color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          Sí, es esta <Icon name="check" size={16} color="#fff" sw={2.4}/>
        </button>
        <button onClick={onReject} style={{ padding: '13px 20px', borderRadius: 11, border: '1.5px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          No, buscar otra
        </button>
      </div>
    </div>
  );
}

/* Buscador de empresa (nombre o CIF) + campo libre opcional */
function CompanyPicker({ hint, onPick, onFree, allowFree }) {
  const [q, setQ] = React.useState('');
  const [state, setState] = React.useState('idle');
  const [res, setRes] = React.useState([]);
  const [f, setF] = React.useState(false);
  const req = React.useRef(0);
  React.useEffect(() => {
    if (!q.trim()) { setState('idle'); setRes([]); return; }
    setState('loading'); const id = ++req.current;
    const t = setTimeout(() => {
      if (id !== req.current) return;
      const nq = normalizeES(q), nqCif = nq.replace(/[\s.\-]/g, '');
      const r = window.RJ.companies.filter(c => normalizeES(c.name).includes(nq) || normalizeES(c.sector).includes(nq) || (nqCif.length >= 3 && normalizeES(c.cif).replace(/[\s.\-]/g, '').includes(nqCif)));
      setRes(r); setState(r.length ? 'results' : 'empty');
    }, 480);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div>
      {state !== 'idle' && (
        <div style={{ marginBottom: 11, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {state === 'loading' && [0, 1].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', border: '1px solid var(--border)', borderRadius: 12 }}>
              <div className="rj-skel" style={{ width: 34, height: 34, borderRadius: 9 }}></div>
              <div style={{ flex: 1 }}><div className="rj-skel" style={{ width: '48%', height: 11, borderRadius: 4, marginBottom: 6 }}></div><div className="rj-skel" style={{ width: '70%', height: 9, borderRadius: 4 }}></div></div>
            </div>
          ))}
          {state === 'results' && res.map(c => (
            <button key={c.id} onClick={() => onPick(c)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', border: '1.5px solid var(--border)', borderRadius: 12, background: 'var(--surface)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)', transition: 'border-color .12s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#E8001D'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', flexShrink: 0 }}>{c.name[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{c.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{c.razon} · {c.cif} · {c.city}</div>
              </div>
              <Icon name="arrow" size={16} color="var(--text-subtle)"/>
            </button>
          ))}
          {state === 'empty' && (
            <div style={{ padding: '13px', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span>Sin resultados para «{q}».</span>
              {allowFree && <button onClick={() => onFree(q)} style={{ fontSize: 12.5, fontWeight: 700, color: '#E8001D', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Usar «{q}» →</button>}
            </div>
          )}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 7px 7px 14px', borderRadius: 14, border: `1.5px solid ${f ? '#E8001D' : 'var(--border-strong)'}`, background: 'var(--surface)', boxShadow: f ? '0 0 0 3px rgba(232,0,29,.16)' : 'none' }}>
        <Icon name="search" size={17} color="var(--text-subtle)"/>
        <input value={q} onChange={e => setQ(e.target.value)} onFocus={() => setF(true)} onBlur={() => setF(false)} autoFocus
          onKeyDown={e => { if (e.key === 'Enter' && allowFree && q.trim() && state !== 'results') onFree(q.trim()); }}
          placeholder="Razón social o CIF…"
          style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 15, color: 'var(--text)', fontFamily: 'var(--font-body)' }}/>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginTop: 9 }}>{hint} Prueba: «kitchen», «olmedo», «B-47 594 478»…</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
