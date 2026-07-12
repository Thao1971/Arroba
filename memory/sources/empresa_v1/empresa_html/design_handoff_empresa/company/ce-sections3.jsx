// Arroba — Company Entity: section components (batch 3 — intelligence, matching, sources)

/* ══ SEÑALES ══ */
function SecSenales({ C }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <CETitle sub="Motor de inteligencia: eventos inferidos por Arroba a partir de los datos de la compañía.">Señales</CETitle>
      <div style={{ position: 'relative', paddingLeft: 24 }}>
        <div style={{ position: 'absolute', left: 5, top: 6, bottom: 6, width: 2, background: 'var(--border)' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {C.signals.map((s, i) => {
            const c = window.SIG_C[s.type] || window.SIG_C.neutral;
            return (
              <div key={i} style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: -23, top: 5, width: 12, height: 12, borderRadius: '50%', background: c.dot, border: '2px solid var(--bg)' }}></div>
                <CECard pad={16} style={{ background: c.bg, border: `1px solid ${c.bd}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: c.tx, marginBottom: 3 }}>{s.label}</div>
                      <div style={{ fontSize: 12.5, color: c.tx, opacity: .85, lineHeight: 1.45 }}>{s.detail}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: c.dot, background: `${c.dot}1e`, padding: '2px 7px', borderRadius: 3, marginBottom: 4 }}>{s.family}</div>
                      <div style={{ fontSize: 11, color: c.tx, opacity: .6 }}>{s.date}</div>
                    </div>
                  </div>
                </CECard>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══ OPORTUNIDADES ══ */
function SecOportunidades({ E }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <CETitle sub="Oportunidades de decisión empresarial inferidas por Arroba sobre la compañía.">Oportunidades</CETitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {E.oportunidades.map((o, i) => {
          const hc = o.heat === 'Alta' ? '#E8001D' : '#D97708';
          return (
            <a key={i} href="Oportunidad.html" style={{ display: 'flex', alignItems: 'flex-start', gap: 18, textDecoration: 'none', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', transition: 'border-color .12s, transform .12s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#E8001D'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = ''; }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(232,0,29,.08)', border: '1px solid rgba(232,0,29,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CPIcon name="target" size={22} color="#E8001D"/></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>{o.type}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: hc, background: `${hc}14`, padding: '2px 8px', borderRadius: 4 }}>{o.heat}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{o.title}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: o.origin ? 8 : 0 }}>{o.desc}</div>
                {o.origin && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#E8001D', textTransform: 'uppercase', letterSpacing: '.04em', flexShrink: 0, marginTop: 1 }}>Generada por:</span>
                    {o.origin.map(g => <span key={g} style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 5, border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{g}</span>)}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#E8001D', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{o.value}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-subtle)', marginTop: 3 }}>{o.conf}% confianza</div>
              </div>
              <button style={{ flexShrink: 0, padding: '10px 16px', borderRadius: 9, border: 'none', background: '#E8001D', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}><span>✦</span> Activar oportunidad</button>
            </a>
          );
        })}
      </div>
    </div>
  );
}

/* ══ COMPRADORES ══ */
function WhyFit({ items }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
      <button onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: 0, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#E8001D' }}>¿Por qué encaja?</span>
        <span style={{ fontSize: 10, color: 'var(--text-subtle)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>▶</span>
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
          {items.map(w => (
            <div key={w} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text)' }}>
              <span style={{ color: '#1A8A4A', flexShrink: 0 }}>✓</span> {w}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SecCompradores({ C }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <CETitle sub="Matching automático de compradores: encaje, racional estratégico y adquisiciones similares.">Compradores</CETitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {C.buyers.map((b, i) => (
          <CECard key={i} pad={18}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CPIcon name="team" size={19} color="#E8001D"/></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>{b.name}</span><span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '1px 7px', borderRadius: 4, border: '1px solid var(--border)' }}>{b.type}</span></div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>{b.reason}</div>
              </div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: 18, fontWeight: 800, color: b.fit >= 85 ? '#E8001D' : 'var(--text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{b.fit}%</div><div style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 2 }}>encaje</div></div>
            </div>
            {b.why && <WhyFit items={b.why}/>}
          </CECard>
        ))}
      </div>
    </div>
  );
}

/* ══ INVERSORES ══ */
function SecInversores({ E }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <CETitle sub="Matching automático de inversores: tesis, encaje, sector y ticket.">Inversores</CETitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {E.inversores.map((v, i) => (
          <CECard key={i} pad={18}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CPIcon name="euro" size={19} color="#E8001D"/></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>{v.name}</span><span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '1px 7px', borderRadius: 4, border: '1px solid var(--border)' }}>{v.type}</span></div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>{v.thesis} · Ticket {v.ticket}</div>
              </div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: 18, fontWeight: 800, color: v.fit >= 85 ? '#E8001D' : 'var(--text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{v.fit}%</div><div style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 2 }}>encaje</div></div>
            </div>
            {v.why && <WhyFit items={v.why}/>}
          </CECard>
        ))}
      </div>
    </div>
  );
}

/* ══ REGISTROS PÚBLICOS ══ */
function SourceTable({ rows, cols, render }) {
  return (
    <CECard pad={0}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead><tr style={{ background: 'var(--surface-2)' }}>{cols.map((h, i) => <th key={h} style={{ padding: '10px 16px', textAlign: i === cols.length - 1 ? 'right' : 'left', fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>{h}</th>)}</tr></thead>
        <tbody>{rows.map(render)}</tbody>
      </table>
    </CECard>
  );
}
function SecRegistros({ E }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <CETitle sub="Información societaria oficial de la compañía.">Registros públicos</CETitle>

      <div>
        <Eyebrow>Órganos sociales y nombramientos</Eyebrow>
        <CECard pad={0}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: 'var(--surface-2)' }}>{['Año', 'Acto', 'Detalle'].map((h, i) => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>{h}</th>)}</tr></thead>
            <tbody>
              {E.borme.map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '11px 16px', color: 'var(--text-subtle)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{r.date}</td>
                  <td style={{ padding: '11px 16px' }}><span style={{ fontSize: 11, fontWeight: 600, color: '#E8001D', background: 'rgba(232,0,29,.07)', padding: '2px 8px', borderRadius: 4 }}>{r.act}</span></td>
                  <td style={{ padding: '11px 16px', color: 'var(--text)' }}>{r.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CECard>
      </div>

      <div>
        <Eyebrow>Cuentas anuales depositadas</Eyebrow>
        <CECard pad={0}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: 'var(--surface-2)' }}>{['Ejercicio', 'Tipo', 'Estado', 'Auditor'].map((h, i) => <th key={h} style={{ padding: '10px 16px', textAlign: i > 1 ? 'right' : 'left', fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>{h}</th>)}</tr></thead>
            <tbody>
              {E.cuentas.map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '11px 16px', fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{r.ejercicio}</td>
                  <td style={{ padding: '11px 16px', color: 'var(--text-muted)' }}>{r.tipo}</td>
                  <td style={{ padding: '11px 16px', textAlign: 'right' }}><span style={{ fontSize: 11, fontWeight: 600, color: '#1A8A4A', background: '#E8F5EE', border: '1px solid #C2E8D0', padding: '2px 8px', borderRadius: 4 }}>{r.estado}</span></td>
                  <td style={{ padding: '11px 16px', textAlign: 'right', color: 'var(--text)', fontWeight: 600 }}>{r.auditor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CECard>
      </div>

      <div>
        <Eyebrow>Datos registrales</Eyebrow>
        <CECard>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 20px' }}>
            <Field label="Situación mercantil" value="Activa"/>
            <Field label="País" value="España"/>
            <Field label="Moneda" value="EUR"/>
            <Field label="Capital social" value={null}/>
            <Field label="Modelo de balance" value={null}/>
            <Field label="Tipo de cuenta" value={null}/>
          </div>
        </CECard>
      </div>
    </div>
  );
}

/* ══ ACTIVOS ESTRATÉGICOS ══ */
function SecActivos({ E }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <CETitle sub="Propiedad industrial e intelectual de la compañía.">Activos estratégicos</CETitle>
      <CECard pad={30} style={{ textAlign: 'center', borderStyle: 'dashed' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <CPIcon name="layers" size={24} color="var(--text-subtle)" sw={2}/>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>No disponible</div>
        <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.55, maxWidth: 480, margin: '0 auto' }}>
          Aún no hay patentes, marcas ni otros activos intangibles registrados para esta compañía en las fuentes conectadas. Esta sección se completará cuando haya información disponible.
        </p>
      </CECard>
    </div>
  );
}

/* ══ DOCUMENTOS ══ */
function SecDocumentos({ E }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <CETitle sub="Informes generados por Arroba sobre la compañía.">Documentos</CETitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {E.documentos.map((d, i) => (
          <CECard key={i} pad={18} style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'border-color .12s', borderColor: d.premium ? 'rgba(232,0,29,.25)' : 'var(--border)' }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: 'rgba(232,0,29,.08)', border: '1px solid rgba(232,0,29,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CPIcon name={d.icon} size={20} color="#E8001D"/></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{d.name}</span>
                {d.premium && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.04em', color: '#fff', background: '#E8001D', padding: '1px 6px', borderRadius: 3 }}>PREMIUM</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{d.desc}</div>
              {d.credits && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 11.5, fontWeight: 600, color: '#E8001D' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#E8001D' }}></span> {d.credits}</div>}
            </div>
            <CPIcon name="download" size={16} color="var(--text-subtle)"/>
          </CECard>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { SecSenales, SecOportunidades, SecCompradores, SecInversores, SecRegistros, SecActivos, SecDocumentos });
