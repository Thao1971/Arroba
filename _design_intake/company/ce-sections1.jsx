// Arroba — Company Entity: section components

// Extra icons not in CP_ICON_PATHS
Object.assign(window.CP_ICON_PATHS, {
  summary:   '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  valuation: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/>',
  signal:    '<polyline points="3,17 8,12 12,14.5 17,9 21,11"/><circle cx="17" cy="9" r="1.6"/>',
  layers:    '<polygon points="12,2 2,7 12,12 22,7"/><polyline points="2,17 12,22 22,17"/><polyline points="2,12 12,17 22,12"/>',
  share:     '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/>',
  bell:      '<path d="M6 10a6 6 0 0112 0v5l2 2H4l2-2v-5z"/><path d="M10 20a2 2 0 004 0"/>',
  link:      '<path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.7-1.7"/>',
});

const fmtM = v => `${v < 0 ? '−' : ''}${Math.abs(v).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M€`;
const YEARS = ['2020', '2021', '2022', '2023', '2024'];

function CECard({ children, style, pad = 22 }) {
  return <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: pad, ...style }}>{children}</div>;
}
function CETitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h2 style={{ fontSize: 21, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', letterSpacing: '-.01em' }}>{children}</h2>
      {sub && <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5, maxWidth: 620 }}>{sub}</p>}
    </div>
  );
}
function Eyebrow({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 14 }}>{children}</div>;
}

/* Connected Intelligence — every module ends in "¿Y esto qué implica?" */
function Implies({ text, cta, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginTop: 14, padding: '13px 16px', background: 'rgba(232,0,29,.04)', border: '1px solid rgba(232,0,29,.18)', borderRadius: 10 }}>
      <span style={{ width: 22, height: 22, borderRadius: 6, background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 800, flexShrink: 0 }}>✦</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#E8001D', marginRight: 8 }}>Y esto implica</span>
        <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{text}</span>
      </div>
      {cta && <button onClick={onAction} style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: '#E8001D', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{cta} →</button>}
    </div>
  );
}

/* Financial statement table */
function FinTable({ rows, label }) {
  return (
    <CECard pad={0}>
      {label && <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{label}</div>}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              <th style={{ textAlign: 'left', padding: '10px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Concepto</th>
              {YEARS.map(y => <th key={y} style={{ textAlign: 'right', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: y === '2024' ? '#E8001D' : 'var(--text-subtle)' }}>{y}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.label} style={{ borderTop: '1px solid var(--border)', background: r.accent ? 'rgba(232,0,29,.03)' : 'transparent' }}>
                <td style={{ padding: '9px 20px', fontWeight: r.bold ? 700 : 400, color: r.bold ? 'var(--text)' : 'var(--text-muted)' }}>{r.label}</td>
                {r.vals.map((v, j) => (
                  <td key={j} style={{ padding: '9px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: r.bold ? 700 : 400, color: r.accent && j === r.vals.length - 1 ? '#E8001D' : r.bold ? 'var(--text)' : 'var(--text-muted)' }}>{fmtM(v)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CECard>
  );
}

/* Individual vs Consolidado snapshot (real data, no fabricated time series) */
function IndConsSnapshot({ fin }) {
  const rows = [
    { l: 'Ventas',         i: fin.individual.ventas,     c: fin.consolidado.ventas,     iv: 6.41,  cv: 32.01, kind: 'rec' },
    { l: 'EBITDA',         i: fin.individual.ebitda,     c: fin.consolidado.ebitda,     iv: 1.87,  cv: 8.16,  kind: 'rec' },
    { l: 'Beneficio neto', i: fin.individual.neto,       c: fin.consolidado.neto,       iv: 2.45,  cv: 3.13,  kind: 'rec' },
    { l: 'Patrimonio neto',i: fin.individual.patrimonio, c: fin.consolidado.patrimonio, iv: 32.81, cv: 38.00, kind: 'rec' },
  ];
  const max = 66.26; // activo consolidado as scale ceiling for bars
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 12, alignItems: 'center', fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
        <span></span>
        <span>Individual</span>
        <span>Consolidado</span>
      </div>
      {rows.map(r => (
        <div key={r.l} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Prov kind={r.kind}/> {r.l}</span>
          {[['i', r.iv, '#ADADAA'], ['c', r.cv, '#E8001D']].map(([key, val, col]) => (
            <div key={key} style={{ position: 'relative', height: 26, background: 'var(--surface-2)', borderRadius: 6, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(val / max) * 100}%`, background: col, opacity: key === 'c' ? 1 : .55, borderRadius: 6 }}></div>
              <span style={{ position: 'relative', marginLeft: 9, fontSize: 12.5, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{r[key]}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ══ RESUMEN ══ */
function SecResumen({ C, E, go }) {
  const co = C.company;
  const [evo, setEvo] = React.useState('consolidado');
  const serie = E.historico[evo];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <CECard pad={24} style={{ background: 'linear-gradient(135deg,#0C0C0E,#1A1A18)', border: 'none', position: 'relative', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', right: -16, top: -28, fontSize: 150, color: 'rgba(232,0,29,.07)', fontWeight: 800, lineHeight: 1, pointerEvents: 'none' }}>✦</span>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 800 }}>✦</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Resumen de Arroba</span>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: 'rgba(255,255,255,.85)', maxWidth: 760 }}>{E.aiSummary}</p>
        </div>
      </CECard>

      {/* KPIs — responde en 10s: quién, dónde, cuánto factura, cuánto gana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { l: 'Ventas', v: E.finanzas.consolidado.ventas, s: 'Consolidado 2024', kind: 'rec' },
          { l: 'EBITDA', v: E.finanzas.consolidado.ebitda, s: E.finanzas.consolidado.margen + ' margen', kind: 'rec', subCalc: true },
          { l: 'Beneficio neto', v: E.finanzas.consolidado.neto, s: 'Consolidado 2024', kind: 'rec' },
          { l: 'Empleados', v: String(co.employees), s: co.plantilla.fijos + ' fijos · ' + co.plantilla.temporales + ' temp.', kind: 'rec' },
        ].map(k => (
          <CECard key={k.l} pad={18}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>{k.l}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 5 }}>{k.v}</div>
            <div style={{ fontSize: 12, color: 'var(--text-subtle)', fontWeight: 500 }}>{k.s}</div>
          </CECard>
        ))}
      </div>

      {/* Identity grid — campos oficiales Iberinform */}
      <CECard>
        <Eyebrow>Identificación</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 20px' }}>
          <Field label="Razón social" value={co.legal}/>
          <Field label="Nombre comercial" value={co.comercial}/>
          <Field label="CIF" value={co.cif}/>
          <Field label="Forma jurídica" value={co.forma}/>
          <Field label="Situación mercantil" value={co.status}/>
          <Field label="Actividad (CNAE)" value={co.cnae + ' · ' + co.sector}/>
          <Field label="Domicilio" value={co.domicilio}/>
          <Field label="Código postal" value={co.cp}/>
          <Field label="Municipio" value={co.location.city}/>
          <Field label="Provincia" value={co.location.province}/>
          <Field label="Capital social" value={co.capital}/>
          <Field label="Modelo de cuentas" value={co.modeloCuentas}/>
          <Field label="Empleados" value={String(co.employees)}/>
          <Field label="Auditada" value={co.audited ? 'Sí · ' + co.auditor : 'No'}/>
          <Field label="ID Iberinform" value={co.iberinformId}/>
          <Field label="Objeto social" value={null}/>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', alignItems: 'center' }}>
          <a href={co.webFull} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: '#E8001D', background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 8, textDecoration: 'none' }}>
            <CPIcon name="link" size={13} color="#E8001D" sw={2}/> {co.web}
          </a>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 8 }}>
            Tel. {co.telefono}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            Plantilla: {co.plantilla.fijos} fijos · {co.plantilla.temporales} temporales · {co.plantilla.hombres} hombres · {co.plantilla.mujeres} mujeres
          </span>
        </div>
      </CECard>

      {/* Qué haría Arroba — information → interpretation → action */}
      <CECard pad={22} style={{ border: '1.5px solid rgba(232,0,29,.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 800 }}>✦</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Qué haría Arroba</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { obs: 'Margen EBITDA del 29% en individual y 25% consolidado: rentabilidad en el percentil 90 del sector hotelero.', cta: 'Ver mercado', go: 'mercado' },
            { obs: 'Holding con 7 sociedades participadas: base idónea para consolidar el segmento termal en España.', cta: 'Explorar oportunidad', go: 'oportunidades' },
            { obs: 'Accionariado con inversores institucionales activos (Ruralia Europa, Muggio Holding, ADE Capital Sodical).', cta: 'Ver propiedad', go: 'propiedad' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 15px', background: 'var(--surface-2)', borderRadius: 10 }}>
              <span style={{ color: '#E8001D', flexShrink: 0, fontSize: 12, marginTop: 1 }}>✦</span>
              <p style={{ flex: 1, fontSize: 13, color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>{r.obs}</p>
              <button onClick={() => go(r.go)} style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: '#E8001D', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{r.cta} →</button>
            </div>
          ))}
        </div>
      </CECard>

      {/* Scores — inferidos por Arroba */}
      <CECard>
        <Eyebrow>Scores de inteligencia</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {[['Quality', 86, '#1A8A4A'], ['Growth', 64, '#2164E3'], ['Risk', 34, '#D97708'], ['Opportunity', 84, '#E8001D']].map(([l, v, c]) => (
            <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <ScoreRing value={v} color={c} size={76} sw={7}/>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)' }}>{l}</span>
            </div>
          ))}
        </div>
      </CECard>

      {/* Evolución histórica + CAGR */}
      <CECard>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <Eyebrow>Evolución · facturación, EBITDA y margen</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'inline-flex', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 9, padding: 3 }}>
              {[['consolidado', 'Consolidado'], ['individual', 'Individual']].map(([id, lbl]) => (
                <button key={id} onClick={() => setEvo(id)} style={{ padding: '6px 13px', borderRadius: 6, border: 'none', background: evo === id ? 'var(--surface)' : 'transparent', color: evo === id ? 'var(--text)' : 'var(--text-muted)', fontSize: 12, fontWeight: evo === id ? 700 : 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{lbl}</button>
              ))}
            </div>
            <AskAdvisor q="¿Cómo ha evolucionado la rentabilidad?" label="Preguntar al Advisor"/>
          </div>
        </div>
        {serie.years.length >= 2 ? (
          <>
            <EvolutionChart series={serie}/>
            <EvolutionLegend/>
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 12 }}>Crecimiento medio anual (CAGR)</div>
              <CagrCards series={serie}/>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '8px 4px 4px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 22 }}>
              {[['Facturación', serie.facturacion[0] + 'M€', '#E8001D'], ['EBITDA', serie.ebitda[0] + 'M€', '#0C0C0E'], ['Margen', serie.margen[0].toLocaleString('es-ES') + '%', '#D97708']].map(([l, v, c]) => (
                <div key={l}>
                  <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 4 }}>{l} · {serie.years[0]}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: c, fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 11, padding: '13px 15px', background: 'var(--surface-2)', border: '1px dashed var(--border-strong)', borderRadius: 11 }}>
              <CPIcon name="chartBar" size={18} color="var(--text-subtle)" sw={2}/>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>Solo hay un ejercicio confirmado (2024). Añade <strong style={{ color: 'var(--text)' }}>2021–2023</strong> para ver la evolución y el CAGR.</span>
            </div>
          </div>
        )}
      </CECard>

      {/* Individual vs Consolidado — datos reales 2024 */}
      <CECard>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Eyebrow>Individual vs. consolidado · 2024</Eyebrow>
          <button onClick={() => go('finanzas')} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: '#E8001D', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Ver finanzas →</button>
        </div>
        <IndConsSnapshot fin={E.finanzas}/>
      </CECard>
    </div>
  );
}

/* ══ FINANZAS (cascada P&L + balance + ratios) ══ */
function SecFinanzas({ E }) {
  const pnl = [
    { l: 'Ventas', v: '6,41 M€', p: '100 %' , k:'base'},
    { l: '− Aprovisionamientos', v: '(1,02 M€)', p: '15,9 %', k:'sub', neg:true },
    { l: '= Margen bruto', v: '5,39 M€', p: '84,1 %', k:'tot' },
    { l: '− Personal', v: '(2,18 M€)', p: '34,0 %', k:'sub', neg:true },
    { l: '− Otros gastos', v: '(1,34 M€)', p: '20,9 %', k:'sub', neg:true },
    { l: '= EBITDA', v: '1,87 M€', p: '29,2 %', k:'ebitda' },
    { l: '= Resultado del ejercicio', v: '2,45 M€', p: '38,2 %', k:'tot' },
  ];
  const wf = [
    { l: 'Ventas', side:'left', w:50, c:'#0C0C0E' },
    { l: 'Aprov.', side:'right', w:7.95, c:'#E8001D' },
    { l: 'M. bruto', side:'left', w:42.05, c:'#2164E3' },
    { l: 'Personal', side:'right', w:17, c:'#E8001D' },
    { l: 'Otros', side:'right', w:10.45, c:'#E8001D' },
    { l: 'EBITDA', side:'left', w:14.6, c:'#1A8A4A' },
    { l: 'Resultado', side:'left', w:19.1, c:'#1A8A4A' },
  ];
  const kpis = [
    { l:'Ventas 2024', v:'6,41 M€', d:'+8,2 % vs 2023' },
    { l:'EBITDA', v:'1,87 M€', d:'Margen 29,2 %' },
    { l:'Resultado neto', v:'2,45 M€', d:'Margen 38,2 %' },
    { l:'Activo total', v:'39,57 M€', d:'2024' },
  ];
  const mono = { fontFamily: 'var(--font-mono, ui-monospace, monospace)', fontVariantNumeric:'tabular-nums' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <CETitle sub="Cuenta de resultados en cascada, balance y ratios del ejercicio 2024.">Finanzas</CETitle>
      <div style={{ display:'flex', justifyContent:'flex-end' }}><AskAdvisor q="¿Qué partidas explican el beneficio neto de 2024?" label="Preguntar sobre las finanzas"/></div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {kpis.map(k => (
          <CECard key={k.l} pad={18}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>{k.l}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', ...mono, lineHeight: 1 }}>{k.v}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginTop: 5 }}>{k.d}</div>
          </CECard>
        ))}
      </div>

      <CECard>
        <Eyebrow>Mini P&L (cascada) · individual 2024</Eyebrow>
        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:20 }} className="ce-pnl-wrap">
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
            <thead><tr>{['Concepto','Importe','% Ventas'].map((th,i)=>(<th key={th} style={{ textAlign:i?'right':'left', fontSize:10, fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase', color:'var(--text-subtle)', padding:'9px 10px', background:'var(--surface-2)', borderBottom:'1px solid var(--border)' }}>{th}</th>))}</tr></thead>
            <tbody>
              {pnl.map((r,i)=>{
                const bg = r.k==='ebitda' ? 'rgba(26,138,74,.08)' : r.k==='tot' ? 'var(--surface-2)' : 'transparent';
                const bold = r.k!=='sub' && r.k!=='base';
                const col = r.k==='ebitda' ? '#1A8A4A' : 'var(--text)';
                return (
                  <tr key={i} style={{ background:bg }}>
                    <td style={{ padding:'11px 10px', paddingLeft: r.k==='sub'?22:10, borderBottom:'1px solid var(--border)', fontWeight: bold?700:400, color: r.k==='sub'?'var(--text-muted)':col }}>{r.l}</td>
                    <td style={{ padding:'11px 10px', textAlign:'right', borderBottom:'1px solid var(--border)', fontWeight:bold?700:400, color: r.neg?'#E8001D':col, ...mono }}>{r.v}</td>
                    <td style={{ padding:'11px 10px', textAlign:'right', borderBottom:'1px solid var(--border)', fontWeight:bold?700:400, color: r.neg?'#E8001D':col, ...mono }}>{r.p}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div>
            <div style={{ display:'flex', flexDirection:'column', gap:9, padding:'6px 4px' }}>
              {wf.map((w,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ width:74, fontSize:12, color:'var(--text-muted)', textAlign:'right', flexShrink:0 }}>{w.l}</span>
                  <div style={{ flex:1, height:22, position:'relative', borderLeft:'1px dashed var(--border-strong)', borderRight:'1px dashed var(--border-strong)' }}>
                    <div style={{ content:'', position:'absolute', left:'50%', top:-3, bottom:-3, width:1, background:'var(--border-strong)' }}></div>
                    <div style={{ position:'absolute', top:3, bottom:3, borderRadius:3, background:w.c, [w.side]:'50%', width:w.w+'%' }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10.5, color:'var(--text-subtle)', padding:'4px 0 0 84px' }}><span>−100 %</span><span>0 %</span><span>100 %</span></div>
            <p style={{ fontSize:11.5, color:'var(--text-subtle)', textAlign:'center', marginTop:8 }}>% sobre ventas</p>
          </div>
        </div>
      </CECard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems:'start' }}>
        <CECard>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:12 }}>Balance · 2024</div>
          {[['Activo no corriente','31,20 M€'],['Activo corriente','8,37 M€'],['Patrimonio neto','32,81 M€'],['Pasivo total','6,76 M€'],['Deuda financiera neta','−2,90 M€']].map((r,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderTop:i?'1px solid var(--border)':'none' }}><span style={{ fontSize:13, color:'var(--text-muted)' }}>{r[0]}</span><span style={{ fontSize:13.5, fontWeight:700, color:'var(--text)', ...mono }}>{r[1]}</span></div>
          ))}
        </CECard>
        <CECard>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:12 }}>Ratios <span style={{ color:'#E8001D' }}>✦</span></div>
          {[['Margen EBITDA','29,2 %'],['ROE','7,5 %'],['Ratio de solvencia','82,9 %'],['Liquidez','3,17x']].map((r,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderTop:i?'1px solid var(--border)':'none' }}><span style={{ fontSize:13, color:'var(--text-muted)' }}>{r[0]}</span><span style={{ fontSize:13.5, fontWeight:700, color:'var(--text)', ...mono }}>{r[1]}</span></div>
          ))}
        </CECard>
      </div>
    </div>
  );
}

/* ══ VALORACIÓN (interactiva por múltiplos) ══ */
function SecValoracion({ C, go }) {
  const EBITDA = 1.87, DFN = -2.90;
  const [mult, setMult] = React.useState(7.9);
  const fmt = n => n.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' M€';
  const fx = n => n.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'x';
  const ev = m => EBITDA * m;
  const eq = m => ev(m) - DFN;
  const lo = mult - 1, hi = mult + 1;
  const mono = { fontFamily: 'var(--font-mono, ui-monospace, monospace)', fontVariantNumeric:'tabular-nums' };
  const evMax = ev(hi);
  const scen = [['Bajo','#E8001D',lo],['Medio','#2164E3',mult],['Alto','#1A8A4A',hi]];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <CETitle sub="Aproximación de valor por múltiplos comparables. Ajusta los parámetros para explorar escenarios.">Valoración</CETitle>

      <div style={{ display:'flex', alignItems:'flex-start', gap:10, background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
        <CPIcon name="valuation" size={16} color="var(--text-muted)" sw={2}/>
        <span style={{ fontSize:12.5, color:'var(--text-muted)', lineHeight:1.5 }}><strong style={{ color:'var(--text)' }}>Equity Value ajustado por deuda financiera neta.</strong> El valor mostrado es una aproximación. Estimación orientativa, no una valoración formal.</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.1fr 1.1fr', gap:14, alignItems:'start' }} className="ce-val-cols">
        {/* Posicionamiento */}
        <CECard>
          <Eyebrow>Posicionamiento</Eyebrow>
          <div style={{ background:'var(--surface-2)', borderRadius:12, padding:18, textAlign:'center', marginBottom:16 }}>
            <div style={{ fontSize:12.5, color:'var(--text-muted)' }}>Quality Score</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:46, fontWeight:700, lineHeight:1, margin:'2px 0', color:'var(--text)' }}>82</div>
            <div style={{ fontSize:11.5, color:'var(--text-subtle)' }}>de 100 · 1.002 comparables</div>
          </div>
          {[['Margen EBITDA','P88',88],['Revenue / empleado','P63',63],['Salud de balance','P90',90]].map((p,i)=>(
            <div key={i} style={{ marginBottom:13 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:5 }}><span style={{ color:'var(--text-muted)' }}>{p[0]}</span><b style={{ ...mono, fontWeight:600 }}>{p[1]}</b></div>
              <div style={{ height:7, background:'var(--surface-2)', borderRadius:4, overflow:'hidden' }}><div style={{ height:'100%', width:p[2]+'%', background:'var(--text)', borderRadius:4 }}></div></div>
            </div>
          ))}
        </CECard>

        {/* Parámetros */}
        <CECard>
          <Eyebrow>Parámetros</Eyebrow>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:600, marginBottom:7, display:'block' }}>EBITDA base</label>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text-muted)', padding:'4px 0' }}><span>Reportado:</span><span style={{ ...mono, color:'var(--text)' }}>1,87 M€</span></div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text-muted)', padding:'4px 0' }}><span>Media (3 ej.):</span><span style={{ ...mono, color:'var(--text)' }}>1,71 M€</span></div>
          </div>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}><label style={{ fontSize:13, fontWeight:600 }}>Múltiplo EV/EBITDA</label><button onClick={()=>setMult(7.9)} style={{ fontSize:12, color:'#E8001D', background:'none', border:'none', fontWeight:600, cursor:'pointer' }}>Usar sugerido</button></div>
            <input type="range" min="4" max="11" step="0.1" value={mult} onChange={e=>setMult(parseFloat(e.target.value))} style={{ width:'100%', accentColor:'#E8001D' }}/>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-subtle)', marginTop:4 }}><span>4x</span><span style={{ color:'#E8001D', fontWeight:700, ...mono }}>{fx(mult)}</span><span>11x</span></div>
          </div>
        </CECard>

        {/* Enterprise Value */}
        <CECard>
          <Eyebrow>Enterprise Value</Eyebrow>
          {scen.map((s,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <span style={{ width:42, fontSize:12, color:'var(--text-muted)' }}>{s[0]}</span>
              <div style={{ flex:1, height:8, background:'var(--surface-2)', borderRadius:4, overflow:'hidden' }}><div style={{ height:'100%', width:(ev(s[2])/evMax*100)+'%', background:s[1], borderRadius:4 }}></div></div>
            </div>
          ))}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:14 }}>
            {scen.map((s,i)=>(
              <div key={i} style={{ border:'1px solid '+s[1], borderRadius:10, padding:'10px 8px', textAlign:'center' }}>
                <div style={{ fontSize:11, fontWeight:700, color:s[1] }}>{s[0]}</div>
                <div style={{ fontSize:15, fontWeight:800, color:'var(--text)', ...mono, marginTop:2 }}>{fmt(ev(s[2]))}</div>
                <div style={{ fontSize:11, color:'var(--text-subtle)', ...mono }}>{fx(s[2])}</div>
              </div>
            ))}
          </div>
        </CECard>
      </div>

      {/* Escenarios */}
      <CECard pad={0}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)' }}><Eyebrow style={{ margin:0 }}>Resumen de escenarios</Eyebrow></div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead><tr>{['Escenario','Múltiplo','Enterprise Value','Equity Value (aprox.)'].map((th,i)=>(<th key={th} style={{ textAlign:i?'right':'left', padding:'10px 20px', fontSize:10, fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase', color:'var(--text-subtle)' }}>{th}</th>))}</tr></thead>
          <tbody>
            {scen.map((s,i)=>(
              <tr key={i} style={{ borderTop:'1px solid var(--border)' }}>
                <td style={{ padding:'11px 20px' }}><span style={{ display:'inline-flex', alignItems:'center', gap:8 }}><span style={{ width:9, height:9, borderRadius:'50%', background:s[1] }}></span>{s[0]}</span></td>
                <td style={{ padding:'11px 20px', textAlign:'right', ...mono }}>{fx(s[2])}</td>
                <td style={{ padding:'11px 20px', textAlign:'right', ...mono }}>{fmt(ev(s[2]))}</td>
                <td style={{ padding:'11px 20px', textAlign:'right', fontWeight:700, ...mono }}>{fmt(eq(s[2]))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CECard>

      {/* CTA valoración avanzada */}
      <CECard pad={24} style={{ background: 'linear-gradient(135deg,#0C0C0E,#1A1A18)', border: 'none', position: 'relative', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', right: -16, top: -28, fontSize: 150, color: 'rgba(232,0,29,.07)', fontWeight: 800, lineHeight: 1, pointerEvents: 'none' }}>✦</span>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 800 }}>✦</div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Valoración avanzada</span>
          </div>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,.7)', lineHeight: 1.6, marginBottom: 18, maxWidth: 600 }}>
            Genera un <strong style={{ color: '#fff' }}>informe profesional descargable</strong> con DCF, comparables, escenarios y sensibilidad, y el racional para comprador estratégico y financiero.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <button style={{ padding: '13px 22px', borderRadius: 11, border: 'none', background: '#E8001D', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Solicitar valoración avanzada</button>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 700, color: '#fff' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E8001D' }}></span> 75 créditos</span>
          </div>
        </div>
      </CECard>
    </div>
  );
}

Object.assign(window, { CECard, CETitle, Eyebrow, Implies, FinTable, SecResumen, SecFinanzas, SecValoracion });
