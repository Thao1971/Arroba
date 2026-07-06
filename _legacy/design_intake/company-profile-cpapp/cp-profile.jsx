// Arroba — Company Profile main content sections

const signalColors = {
  positive: { bg: '#E8F5EE', border: '#1A8A4A', text: '#1A6A38', dot: '#1A8A4A' },
  neutral:  { bg: 'var(--surface-2)', border: 'var(--border)', text: 'var(--text-muted)', dot: '#ADADAA' },
  warning:  { bg: '#FEF3E2', border: '#D97708', text: '#92540A', dot: '#D97708' },
  negative: { bg: '#FDE8EA', border: '#E8001D', text: '#B5001A', dot: '#E8001D' },
};

function Card({ children, style, pad = 24 }) {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 12,
      border: '1px solid var(--border)', padding: pad,
      ...style,
    }}>{children}</div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 16 }}>
      {children}
    </div>
  );
}

/* ── Company Header ────────────────────────────────────────── */
function CompanyHeader({ company }) {
  const [watchlisted, setWatchlisted] = React.useState(false);
  return (
    <div style={{ marginBottom: 0 }}>
      <Card pad={28}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
            {/* Logo placeholder */}
            <div style={{
              width: 56, height: 56, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, #0C0C0E, #2E2E2C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 900, color: '#E8001D',
              fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-1px',
              border: '1px solid var(--border)',
            }}>CE</div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', fontFamily: 'Space Grotesk, sans-serif', lineHeight: 1 }}>
                  {company.name}
                </h1>
                {company.verified && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#1A8A4A', background: '#E8F5EE', padding: '3px 8px', borderRadius: 4, border: '1px solid #C2E8D0' }}>
                    <span style={{ color: '#E8001D', fontSize: 10 }}>✦</span> Verificada
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
                {company.legal} · CIF {company.cif}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: '#E8001D', padding: '3px 10px', borderRadius: 4 }}>
                  {company.sector}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '3px 10px', borderRadius: 4, border: '1px solid var(--border)' }}>
                  {company.subsector}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '3px 10px', borderRadius: 4, border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ color: '#E8001D', fontSize: 10 }}>✦</span> {company.location.city}, {company.location.district}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '3px 10px', borderRadius: 4, border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ color: '#E8001D', fontSize: 10 }}>✦</span> {company.employees} empleados
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '3px 10px', borderRadius: 4, border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ color: '#E8001D', fontSize: 10 }}>✦</span> Fundada {company.founded}
                </span>
                {/* Deal status */}
                <span style={{ fontSize: 12, fontWeight: 600, color: '#B45309', background: '#FEF3E2', padding: '3px 10px', borderRadius: 4, border: '1px solid #FCD9A3', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D97708', flexShrink: 0 }}></div>
                  No listada · Open to conversations
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => setWatchlisted(!watchlisted)} style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: `1.5px solid ${watchlisted ? '#1A8A4A' : 'var(--border-strong)'}`,
              background: watchlisted ? '#E8F5EE' : 'var(--surface)',
              color: watchlisted ? '#1A8A4A' : 'var(--text)',
              fontFamily: 'var(--font-body)', display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <CPIcon name="watchlist" size={13} color={watchlisted ? '#1A8A4A' : 'var(--text-muted)'} sw={2}/>
              {watchlisted ? 'Guardada' : 'Watchlist'}
            </button>
            <button style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: '1.5px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)',
              fontFamily: 'var(--font-body)', display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <CPIcon name="document" size={13} color="var(--text-muted)" sw={2}/> Teaser
            </button>
            <button style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: 'none', background: '#E8001D', color: '#fff',
              fontFamily: 'var(--font-body)',
            }}>Ver oportunidad →</button>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginTop: 18, padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, borderLeft: '3px solid var(--border-strong)' }}>
          {company.description}
        </div>
      </Card>
    </div>
  );
}

/* ── KPI Strip ─────────────────────────────────────────────── */
function KPIStrip({ kpis }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {kpis.map(kpi => (
        <Card key={kpi.label} pad={18}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>
            {kpi.label}
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: kpi.trend === 'star' ? '#E8001D' : 'var(--text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 4, fontFamily: 'Space Grotesk, sans-serif' }}>
            {kpi.value}
            {kpi.trend === 'star' && <span style={{ fontSize: 14, marginLeft: 4 }}>⭐</span>}
          </div>
          <div style={{ fontSize: 12, color: kpi.trend === 'up' ? '#1A8A4A' : 'var(--text-subtle)', fontWeight: kpi.trend === 'up' ? 600 : 400 }}>
            {kpi.sub}
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ── Financials Section ────────────────────────────────────── */
function FinancialsSection({ data }) {
  return (
    <Card>
      <SectionLabel>Evolución financiera</SectionLabel>
      <FinancialChart data={data} />

      {/* Financial table */}
      <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', color: 'var(--text-subtle)', fontWeight: 600, paddingBottom: 8, letterSpacing: '.05em' }}>Métrica</th>
              {data.years.map(y => (
                <th key={y} style={{ textAlign: 'right', color: y === '2024' ? '#E8001D' : 'var(--text-subtle)', fontWeight: 600, paddingBottom: 8 }}>{y}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Revenue', vals: data.revenue, fmt: v => `${v}M€` },
              { label: 'EBITDA', vals: data.ebitda, fmt: v => `${v}M€` },
              { label: 'Margen EBITDA', vals: data.ebitdaMargin, fmt: v => `${v}%` },
              { label: 'Empleados', vals: data.employees, fmt: v => v },
            ].map(row => (
              <tr key={row.label} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '9px 0', color: 'var(--text-muted)', fontWeight: 500 }}>{row.label}</td>
                {row.vals.map((v, i) => (
                  <td key={i} style={{ padding: '9px 0', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: i === row.vals.length - 1 ? 700 : 400, color: i === row.vals.length - 1 ? 'var(--text)' : 'var(--text-muted)' }}>
                    {row.fmt(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ── Signal Timeline ───────────────────────────────────────── */
function SignalTimeline({ signals }) {
  return (
    <Card>
      <SectionLabel>Señales recientes</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {signals.map((s, i) => {
          const c = signalColors[s.type] || signalColors.neutral;
          return (
            <div key={i} style={{
              display: 'flex', gap: 12, padding: '12px 14px',
              borderRadius: 8, background: c.bg, border: `1px solid ${c.border}22`,
              borderLeft: `3px solid ${c.dot}`,
            }}>
              <div style={{ flexShrink: 0, marginTop: 1 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, marginTop: 4 }}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: c.text, opacity: .8, lineHeight: 1.4 }}>{s.detail}</div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: c.dot, fontWeight: 600, background: `${c.dot}18`, padding: '2px 7px', borderRadius: 3, marginBottom: 4 }}>{s.family}</div>
                    <div style={{ fontSize: 10, color: c.text, opacity: .6 }}>{s.date}</div>
                  </div>
                </div>
                {/* Strength bar */}
                <div style={{ marginTop: 8, height: 3, background: `${c.dot}22`, borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${s.strength * 100}%`, background: c.dot, borderRadius: 2 }}/>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── Comparables ───────────────────────────────────────────── */
function ComparablesSection({ comparables, thisScore }) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <SectionLabel style={{ margin: 0 }}>Comparables sectoriales</SectionLabel>
        <span style={{ fontSize: 11, color: '#E8001D', fontWeight: 600, cursor: 'pointer' }}>Ver todos →</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              {['Compañía','Revenue','Margen','Equipo','Score'].map(h => (
                <th key={h} style={{ padding: '9px 12px', textAlign: h === 'Compañía' ? 'left' : 'right', fontSize: 11, color: 'var(--text-subtle)', fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Current company row */}
            <tr style={{ background: 'rgba(232,0,29,.04)', borderBottom: '1px solid rgba(232,0,29,.15)' }}>
              <td style={{ padding: '10px 12px', fontWeight: 700, color: '#E8001D' }}>Creativa Estratégica ←</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>3.2M€</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>18.1%</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text)' }}>23</td>
              <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#E8001D', background: 'rgba(232,0,29,.1)', padding: '2px 8px', borderRadius: 4 }}>82</span>
              </td>
            </tr>
            {comparables.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text)' }}>{c.name}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{c.revenue}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{c.margin}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>{c.emp}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>{c.score}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-subtle)' }}>
        Similitud calculada por embeddings semánticos + financieros · Fuente: arroba.com Intelligence
      </div>
    </Card>
  );
}

/* ── Ownership ─────────────────────────────────────────────── */
function OwnershipSection({ ownership }) {
  const stakeColors = ['#E8001D','#0C0C0E','#ADADAA','#E8E8E2'];
  return (
    <Card>
      <SectionLabel>Ownership & administración</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>Accionistas</div>
          {/* Stacked bar */}
          <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
            {ownership.shareholders.map((s, i) => (
              <div key={i} style={{ width: `${s.stake}%`, background: stakeColors[i % stakeColors.length] }} title={`${s.name} ${s.stake}%`}/>
            ))}
          </div>
          {ownership.shareholders.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: stakeColors[i % stakeColors.length], flexShrink: 0 }}/>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{s.name}</div>
                  {s.role && <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{s.role}</div>}
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{s.stake}%</div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>Administración</div>
          {ownership.administrators.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text)', flexShrink: 0 }}>
                {a.name.split(' ').map(w => w[0]).join('').slice(0,2)}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{a.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{a.role}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: '12px', background: '#FEF3E2', borderRadius: 8, border: '1px solid #FCD9A3' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#B45309', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ color: '#E8001D', fontSize: 10 }}>✦</span> Dependencia fundador
              </div>
            <div style={{ fontSize: 11, color: '#92540A', lineHeight: 1.4 }}>62% ownership concentrado. Considerar en negociación y due diligence.</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ── Revenue CTAs (full-width, bottom of profile) ─────────── */
function RevenueSection({ company }) {
  const [interest, setInterest] = React.useState(false);
  const [riskLoading, setRiskLoading] = React.useState(false);
  const [riskReport, setRiskReport] = React.useState(null);

  const generateRisk = async () => {
    setRiskLoading(true);
    try {
      const resp = await window.claude.complete({ messages: [{ role: 'user', content: `Agente de análisis de riesgos M&A (arroba.com). Genera un análisis de riesgos ejecutivo para esta compañía: ${company.name}, Revenue 3.2M€, EBITDA 18.1%, 23 empleados, Madrid, sector Madtech. Fundador con 62% stake. Clientes B2B, ticket medio 18 meses. Formato: 5 riesgos concretos, cada uno en una sola frase directa. Sin introducción ni conclusión.` }] });
      setRiskReport(resp);
    } catch { setRiskReport('Error al generar. Inténtalo de nuevo.'); }
    setRiskLoading(false);
  };

  const ctaBase = { background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 12 };

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 14 }}>
        Accede a más información
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>

        {/* CTA 1: Memorias financieras */}
        <div style={ctaBase}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CPIcon name="document" size={18} color="var(--text-muted)" sw={1.75}/>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Memorias financieras</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>Cuentas anuales completas 2020–2024. Balance, P&L, ratios y notas a los estados financieros.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
            <button style={{ flex: 1, padding: '9px 14px', borderRadius: 8, border: 'none', background: '#0C0C0E', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <CPIcon name="download" size={13} color="#fff" sw={2}/> Descargar
            </button>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#E8001D', background: 'rgba(232,0,29,.08)', padding: '4px 8px', borderRadius: 4, border: '1px solid rgba(232,0,29,.2)', whiteSpace: 'nowrap' }}>Premium</span>
          </div>
        </div>

        {/* CTA 2: Análisis de riesgos IA */}
        <div style={{ ...ctaBase, border: riskReport ? '1.5px solid rgba(232,0,29,.25)' : '1px solid var(--border)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: riskReport ? 'rgba(232,0,29,.06)' : 'var(--surface-2)', border: `1px solid ${riskReport ? 'rgba(232,0,29,.2)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 16, color: '#E8001D' }}>✦</span>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Análisis de riesgos IA</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>Informe de riesgos generado por inteligencia artificial sobre los datos verificados de la compañía.</div>
          </div>
          {riskReport ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, background: 'var(--surface-2)', borderRadius: 8, padding: '12px', borderLeft: '3px solid #E8001D', marginTop: 4 }}>
              {riskReport}
            </div>
          ) : (
            <button onClick={generateRisk} disabled={riskLoading} style={{
              marginTop: 'auto', padding: '9px 14px', borderRadius: 8, border: '1.5px solid #E8001D',
              background: riskLoading ? 'rgba(232,0,29,.05)' : '#E8001D', color: riskLoading ? '#E8001D' : '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 12 }}>✦</span>
              {riskLoading ? 'Analizando...' : 'Generar informe'}
            </button>
          )}
        </div>

        {/* CTA 3: Estado de operación */}
        <div style={{ ...ctaBase, background: interest ? '#E8F5EE' : 'var(--surface)', border: interest ? '1.5px solid #1A8A4A' : '1px solid var(--border)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CPIcon name="deal" size={18} color="var(--text-muted)" sw={1.75}/>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Estado de operación</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, background: '#FEF3E2', color: '#B45309', padding: '3px 8px', borderRadius: 4, border: '1px solid #FCD9A3', marginBottom: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D97708' }}></div>
              No listada oficialmente
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>El propietario podría estar abierto a conversaciones. Expresa tu interés de forma confidencial.</div>
          </div>
          {interest ? (
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1A8A4A', background: '#E8F5EE', padding: '10px', borderRadius: 8, textAlign: 'center', border: '1px solid #C2E8D0' }}>
              ✓ Interés registrado · Te contactaremos
            </div>
          ) : (
            <button onClick={() => setInterest(true)} style={{
              marginTop: 'auto', padding: '9px 14px', borderRadius: 8, border: '1.5px solid var(--border-strong)',
              background: 'var(--surface)', color: 'var(--text)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <CPIcon name="target" size={13} color="var(--text-muted)" sw={2}/> Me interesa esta compañía
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { CompanyHeader, KPIStrip, FinancialsSection, SignalTimeline, ComparablesSection, OwnershipSection, RevenueSection });
