// arroba.com — Ficha sectorial sections

function SCard({ children, style, pad = 20 }) {
  return <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: pad, ...style }}>{children}</div>;
}
function STitle({ children, sub, tip }) {
  return (
    <div style={{ marginBottom: sub ? 2 : 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{children}</h3>
        {tip && <SecTooltip content={tip} position="right"/>}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2, marginBottom: 12 }}>{sub}</div>}
    </div>
  );
}
function SSeeAll({ label = 'Ver todo' }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#E8001D', cursor: 'pointer', whiteSpace: 'nowrap' }}>{label} <SecIcon name="arrowRight" size={12} color="#E8001D" sw={2}/></span>;
}

/* ══ Header ════════════════════════════════════════════════ */
function SectorHeader() {
  const { meta } = window.SECTOR_DATA;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: '#0C0C0E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: '#E8001D', fontFamily: 'var(--font-display)' }}>{meta.cnae}</span>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#E8001D', padding: '2px 9px', borderRadius: 5 }}>CNAE {meta.cnae}</span>
            <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Ficha sectorial</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em', marginTop: 6 }}>{meta.name}</h1>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 9, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          <SecIcon name="calendar" size={14} color="var(--text-muted)" sw={1.75}/> 12 meses <span style={{ fontSize: 8 }}>▼</span>
        </button>
        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 9, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          <SecIcon name="share" size={14} color="var(--text-muted)" sw={1.75}/> Compartir
        </button>
      </div>
    </div>
  );
}

/* ══ AI executive summary ══════════════════════════════════ */
function SectorAISummary() {
  const { aiSummary } = window.SECTOR_DATA;
  return (
    <SCard pad={24} style={{ background: 'linear-gradient(135deg, rgba(232,0,29,.04), rgba(232,0,29,.01))', border: '1px solid rgba(232,0,29,.18)', marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 20, color: '#fff', fontWeight: 800 }}>✦</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Resumen ejecutivo</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#E8001D', background: 'rgba(232,0,29,.1)', padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(232,0,29,.2)' }}>Generado por IA</span>
          </div>
          <p style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.6, fontWeight: 400 }}>{aiSummary}</p>
          <button onClick={() => window.__sectorSetTab && window.__sectorSetTab('ia')} style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 9, border: 'none', background: '#E8001D', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            <span style={{ fontSize: 13 }}>✦</span> Preguntar al analista sectorial
          </button>
        </div>
      </div>
    </SCard>
  );
}

/* ══ KPIs ══════════════════════════════════════════════════ */
const KPI_TIPS = {
  'Índice de Oportunidad': { title: 'Índice de Oportunidad', desc: 'Puntuación 0–100 que resume el atractivo del sector combinando crecimiento, actividad mercantil, contratación pública y concentración.', method: 'Modelo propietario arroba.com' },
  'Empresas activas': { title: 'Empresas activas', desc: 'Número de sociedades mercantiles activas clasificadas en este CNAE.', method: 'INE + Registro Mercantil' },
  'Growth Score': { title: 'Growth Score', desc: 'Mide la velocidad y sostenibilidad del crecimiento del sector frente a la media nacional.' },
  'Activity Score': { title: 'Activity Score', desc: 'Intensidad de actividad mercantil: altas, modificaciones y eventos registrales.', method: 'BORME' },
  'Contratación pública': { title: 'Contratación pública', desc: 'Importe total adjudicado a empresas del sector en los últimos 12 meses.', method: 'Plataforma de Contratación del Sector Público (CPV→CNAE)' },
  'Eventos BORME (12m)': { title: 'Eventos BORME', desc: 'Número de actos registrales publicados en el Boletín Oficial del Registro Mercantil.', method: 'BORME' },
};
function SectorKpis() {
  const { kpis } = window.SECTOR_DATA;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 16 }}>
      {kpis.map(k => (
        <SCard key={k.label} pad={16} style={k.hero ? { border: '1.5px solid rgba(232,0,29,.3)', background: 'rgba(232,0,29,.03)' } : {}}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <SecIcon name={k.icon} size={18} color={k.hero ? '#E8001D' : 'var(--text-subtle)'} sw={1.7}/>
            {KPI_TIPS[k.label] && <SecTooltip content={KPI_TIPS[k.label]} position="left" size={13}/>}
          </div>
          <div style={{ fontSize: k.hero ? 30 : 22, fontWeight: 800, color: k.hero ? '#E8001D' : 'var(--text)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em', marginTop: 10, lineHeight: 1, fontFamily: 'var(--font-display)' }}>{k.value}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.3 }}>{k.label}</div>
          <div style={{ fontSize: 10, marginTop: 5, color: '#1A8A4A', fontWeight: 600 }}>↑ {k.delta}</div>
        </SCard>
      ))}
    </div>
  );
}

/* ══ Evolution ═════════════════════════════════════════════ */
function SectorEvolutionCard() {
  const { evolution } = window.SECTOR_DATA;
  const [period, setPeriod] = React.useState('12m');
  const series = [
    { key: 'creacion', color: '#E8001D', label: 'Creación de empresas' },
    { key: 'cierres',  color: '#0C0C0E', label: 'Cierres' },
    { key: 'saldo',    color: '#ADADAA', label: 'Saldo neto' },
    { key: 'borme',    color: '#2164E3', label: 'Actividad BORME', dash: '5,3' },
  ];
  return (
    <SCard>
      <STitle sub="Series mensuales · últimos 12 meses" tip={{ title: 'Evolución sectorial', desc: 'Series mensuales de creación de empresas, cierres, saldo neto y actividad registral del sector.', method: 'INE + BORME' }}>Evolución sectorial</STitle>
      <div style={{ display: 'flex', gap: 14, marginBottom: 8, flexWrap: 'wrap' }}>
        {series.map(s => (
          <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-muted)' }}>
            <span style={{ width: 12, height: 3, borderRadius: 2, background: s.color, ...(s.dash ? { backgroundImage: `repeating-linear-gradient(90deg, ${s.color} 0 4px, transparent 4px 6px)`, background: 'none' } : {}) }}></span>{s.label}
          </span>
        ))}
      </div>
      <SectorEvolution data={evolution} series={series}/>
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        {['12m','24m','36m'].map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{ padding: '5px 14px', borderRadius: 7, border: `1px solid ${period === p ? 'rgba(232,0,29,.3)' : 'var(--border)'}`, cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-body)', background: period === p ? 'rgba(232,0,29,.08)' : 'var(--surface)', color: period === p ? '#E8001D' : 'var(--text-muted)' }}>{p}</button>
        ))}
      </div>
    </SCard>
  );
}

/* ══ Geo: where it's growing ═══════════════════════════════ */
function SectorGeoCard() {
  const { geo } = window.SECTOR_DATA;
  const [hovered, setHovered] = React.useState(null);
  const region = window.SEC_REGIONS.find(r => r.id === hovered);
  const ex = geo.hoverExample;
  return (
    <SCard>
      <STitle sub="Intensidad del sector por territorio" tip={{ title: 'Distribución geográfica', desc: 'Concentración del sector por comunidad autónoma. Cuanto más intenso el color, mayor concentración relativa a la media nacional.' }}>Dónde está creciendo</STitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px', gap: 14, alignItems: 'start' }}>
        <div>
          <SectorGeoMap hovered={hovered} onHover={setHovered}/>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 9, color: 'var(--text-subtle)' }}>Baja</span>
            <div style={{ width: 100, height: 5, borderRadius: 3, background: 'linear-gradient(90deg, rgba(232,0,29,.14), #E8001D)' }}></div>
            <span style={{ fontSize: 9, color: 'var(--text-subtle)' }}>Alta concentración</span>
          </div>
        </div>
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', marginBottom: 12 }}>{region ? region.name : ex.name}</div>
          {[['Índice de Oportunidad', region ? region.score : ex.index, true],['Empresas activas', ex.activas],['Actividad BORME', ex.borme],['Concentración', ex.concentration]].map(([l, v, hero]) => (
            <div key={l} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--text-subtle)', marginBottom: 2 }}>{l}</div>
              <div style={{ fontSize: hero ? 22 : 14, fontWeight: hero ? 800 : 600, color: hero ? '#E8001D' : 'var(--text)', fontVariantNumeric: 'tabular-nums', fontFamily: hero ? 'var(--font-display)' : 'inherit', lineHeight: 1 }}>{v}</div>
            </div>
          ))}
          <div style={{ fontSize: 9.5, color: 'var(--text-subtle)', marginTop: 8, lineHeight: 1.4 }}>Pasa el ratón sobre el mapa para explorar</div>
        </div>
      </div>
    </SCard>
  );
}

/* ══ Territory leaders ═════════════════════════════════════ */
function SectorLeadersCard() {
  const { geo } = window.SECTOR_DATA;
  return (
    <SCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <STitle tip={{ title: 'Territorios líderes', desc: 'Territorios ordenados por Índice de Oportunidad del sector, con su factor de concentración frente a la media nacional.' }}>Territorios líderes</STitle><SSeeAll/>
      </div>
      <div style={{ display: 'flex', fontSize: 10, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.04em', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
        <span style={{ width: 18 }}></span><span style={{ flex: 1 }}>Territorio</span><span style={{ width: 64 }}>Concentr.</span><span style={{ width: 108, textAlign: 'right' }}>Oportunidad</span>
      </div>
      {geo.leaders.map(t => (
        <div key={t.rank} style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ width: 18, fontSize: 12, fontWeight: 700, color: 'var(--text-subtle)' }}>{t.rank}</span>
          <span style={{ flex: 1, fontSize: 13, fontWeight: t.rank <= 2 ? 600 : 400, color: 'var(--text)' }}>{t.name}</span>
          <span style={{ width: 64, fontSize: 12, fontWeight: 600, color: '#E8001D', fontVariantNumeric: 'tabular-nums' }}>{t.concentration}</span>
          <span style={{ width: 108, display: 'flex', justifyContent: 'flex-end' }}><SecScoreMini value={t.index} w={76}/></span>
        </div>
      ))}
    </SCard>
  );
}

/* ══ Subsectors ════════════════════════════════════════════ */
function SubsectorsCard() {
  const { subsectors } = window.SECTOR_DATA;
  return (
    <SCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <STitle tip={{ title: 'Subsectores', desc: 'Desglose del sector por código CNAE de detalle, con número de empresas, crecimiento e Índice de Oportunidad.' }}>Subsectores</STitle><SSeeAll label="Drill down →"/>
      </div>
      {subsectors.map(s => (
        <div key={s.code} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
          onMouseLeave={e => e.currentTarget.style.background = ''}>
          <span style={{ width: 30, height: 30, borderRadius: 7, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>{s.code}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{s.empresas} empresas</div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#1A8A4A', width: 52, textAlign: 'right' }}>↑ {s.growth}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', background: 'var(--surface-2)', padding: '3px 9px', borderRadius: 5, border: '1px solid var(--border)', fontVariantNumeric: 'tabular-nums' }}>{s.index}</span>
          <SecIcon name="arrowRight" size={14} color="var(--text-subtle)" sw={2}/>
        </div>
      ))}
    </SCard>
  );
}

/* ══ Featured companies ════════════════════════════════════ */
function FeaturedCard() {
  const { featured } = window.SECTOR_DATA;
  return (
    <SCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <STitle tip={{ title: 'Empresas destacadas', desc: 'Empresas de referencia del sector por tamaño, relevancia o actividad reciente.' }}>Empresas destacadas</STitle><SSeeAll/>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {featured.map(c => (
          <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 9, border: '1px solid var(--border)', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#E8001D'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#0C0C0E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0, fontFamily: 'var(--font-display)' }}>{c.logo}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{c.sub}</div>
            </div>
            <SecIcon name="arrowRight" size={14} color="var(--text-subtle)" sw={2}/>
          </div>
        ))}
      </div>
    </SCard>
  );
}

/* ══ M&A operations ════════════════════════════════════════ */
function MARadarCard() {
  const { ma } = window.SECTOR_DATA;
  const kindStyle = { acq: { c: '#E8001D', bg: 'rgba(232,0,29,.08)', l: 'Adquisición' }, raise: { c: '#1A8A4A', bg: '#E8F5EE', l: 'Capital' }, merge: { c: '#2164E3', bg: 'rgba(33,100,227,.08)', l: 'Fusión' } };
  return (
    <SCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <STitle tip={{ title: 'M&A Radar', desc: 'Operaciones corporativas recientes detectadas en el sector: adquisiciones, fusiones y rondas de financiación.', method: 'BORME + fuentes públicas' }}>Operaciones corporativas</STitle>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#E8001D', background: 'rgba(232,0,29,.08)', padding: '3px 9px', borderRadius: 5, border: '1px solid rgba(232,0,29,.2)' }}>M&A Radar</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 12 }}>Operaciones recientes en el sector</div>
      {ma.map((op, i) => {
        const ks = kindStyle[op.kind];
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < ma.length-1 ? '1px solid var(--border)' : 'none' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: ks.c, background: ks.bg, padding: '3px 8px', borderRadius: 5, width: 78, textAlign: 'center', flexShrink: 0 }}>{ks.l}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{op.target}</div>
              <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{op.buyer !== '—' ? op.buyer : 'Fusión entre iguales'} · {op.date}</div>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{op.value}</span>
          </div>
        );
      })}
    </SCard>
  );
}

/* ══ Public procurement ════════════════════════════════════ */
function ProcurementCard() {
  const { procurement: p } = window.SECTOR_DATA;
  return (
    <SCard>
      <STitle sub="Mapeo CPV → CNAE · últimos 12 meses" tip={{ title: 'Contratación pública', desc: 'Adjudicaciones públicas a empresas del sector, mapeadas desde códigos CPV de licitación a CNAE.', method: 'Plataforma de Contratación del Sector Público' }}>Contratación pública</STitle>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 10, padding: '14px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#E8001D', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{p.total}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>Importe total adjudicado</div>
        </div>
        <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 10, padding: '14px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{p.contracts}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>Nº de contratos</div>
        </div>
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Organismos más activos</div>
      {p.organisms.map(o => (
        <div key={o.name} style={{ marginBottom: 9 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text)' }}>{o.name}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{o.value}</span>
          </div>
          <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${o.share}%`, background: '#E8001D', borderRadius: 2 }}/>
          </div>
        </div>
      ))}
    </SCard>
  );
}

/* ══ Signals radar ═════════════════════════════════════════ */
function SignalsCard() {
  const { signals } = window.SECTOR_DATA;
  return (
    <SCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <STitle tip={{ title: 'Radar de señales', desc: 'Señales relevantes del sector detectadas automáticamente por el sistema de inteligencia, con su intensidad estimada.' }}>Radar de señales</STitle>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#E8001D' }}>✦ Detección automática</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 14 }}>Señales generadas por el sistema de inteligencia</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {signals.map((s, i) => {
          const up = s.type === 'up';
          const c = up ? { col: '#1A6A38', bg: '#E8F5EE', bd: '#C2E8D0', dot: '#1A8A4A' } : { col: '#92540A', bg: '#FEF3E2', bd: '#FCD9A3', dot: '#D97708' };
          return (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '11px 14px', borderRadius: 10, background: c.bg, border: `1px solid ${c.bd}` }}>
              <span style={{ fontSize: 15, color: c.dot, fontWeight: 800, flexShrink: 0 }}>{up ? '↑' : '↓'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.col }}>{s.text}</div>
                <div style={{ fontSize: 11, color: c.col, opacity: .8, marginTop: 2 }}>{s.detail}</div>
                <div style={{ marginTop: 7, height: 3, background: `${c.dot}33`, borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${s.strength * 100}%`, background: c.dot, borderRadius: 2 }}/>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SCard>
  );
}

/* ══ AI Sector Analyst (the differential piece) ════════════ */
function SectorAnalyst() {
  const { meta, agentPresets } = window.SECTOR_DATA;
  const [query, setQuery] = React.useState('');
  const [msgs, setMsgs] = React.useState([
    { role: 'agent', text: `Soy el analista del sector ${meta.name} (CNAE ${meta.cnae}). Combino inteligencia macro, sectorial, geográfica, BORME, contratación pública y M&A Radar para responder cualquier pregunta sobre este sector.` }
  ]);
  const [loading, setLoading] = React.useState(false);
  const bottomRef = React.useRef(null);
  React.useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async (text) => {
    const q = text || query.trim();
    if (!q || loading) return;
    setQuery(''); setMsgs(m => [...m, { role: 'user', text: q }]); setLoading(true);
    try {
      const ctx = `Sector: ${meta.name} (CNAE J). Índice de Oportunidad 88/100. 142.380 empresas activas (+4,2%). Growth Score 76, Activity Score 81. Contratación pública €2,4 Bn (+18%, liderada por Defensa y SEPE). 8.412 eventos BORME (+11%). Territorios líderes: Madrid (índice 96, concentración 4,9x), Cataluña (91), Canarias (84), Valencia (82), País Vasco (80). Subsectores: 62 Programación y consultoría (94.210 empresas, +12,4%), 63 Servicios de información (+9,7%), 61 Telecomunicaciones (+3,1%). Empresas destacadas: Indra, Telefónica, Amadeus, Minsait, GMV. Operaciones M&A recientes: Minsait compró Nexus Digital (€45M), Cloud Iberia levantó €28M Serie B, GMV compró SecureNet (€19M). Señales: crecimiento acelerado en consultoría IT, +18% contratación pública, concentración creciente en Madrid, menor actividad en Andalucía.`;
      const resp = await window.claude.complete({ messages: [{ role: 'user', content: `Eres el Analista Sectorial IA de arroba.com. Combinas Macro, Sector, Geo, Cross Intelligence, BORME, Contratación Pública y M&A Radar. Responde de forma ejecutiva y concisa (3-5 frases), citando datos concretos. Contexto del sector: ${ctx}. Pregunta: ${q}` }] });
      setMsgs(m => [...m, { role: 'agent', text: resp }]);
    } catch { setMsgs(m => [...m, { role: 'agent', text: 'No pude procesar la consulta. Inténtalo de nuevo.' }]); }
    setLoading(false);
  };

  return (
    <div id="sector-agent" style={{ background: '#0C0C0E', borderRadius: 16, overflow: 'hidden', border: '1px solid #2E2E2C' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 20, color: '#fff', fontWeight: 800 }}>✦</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>arroba copilot</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)' }}>Macro · Sector · Geo · Cross · BORME · Contratación · M&A Radar</div>
        </div>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1A8A4A', flexShrink: 0 }}></div>
      </div>

      <div style={{ maxHeight: 340, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.role === 'agent' && <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#E8001D', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 800, marginTop: 2 }}>✦</div>}
            <div style={{ maxWidth: '78%', padding: '11px 15px', borderRadius: m.role === 'user' ? '13px 13px 4px 13px' : '13px 13px 13px 4px', background: m.role === 'user' ? '#E8001D' : 'rgba(255,255,255,.06)', color: m.role === 'user' ? '#fff' : 'rgba(255,255,255,.92)', fontSize: 13, lineHeight: 1.6, border: m.role === 'agent' ? '1px solid rgba(255,255,255,.08)' : 'none' }}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#E8001D', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 800 }}>✦</div>
            <div style={{ padding: '12px 16px', borderRadius: '13px 13px 13px 4px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', gap: 5 }}>
              {[0,1,2].map(j => <div key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,.5)', animation: `secbounce .8s ${j*0.15}s infinite` }}/>)}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {msgs.length <= 1 && (
        <div style={{ padding: '0 24px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {agentPresets.map(p => (
            <button key={p} onClick={() => send(p)} style={{ padding: '8px 13px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: 'rgba(255,255,255,.7)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{p}</button>
          ))}
        </div>
      )}

      <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', gap: 10 }}>
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Pregunta al analista sectorial..."
          style={{ flex: 1, padding: '11px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.05)', color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)' }}/>
        <button onClick={() => send()} disabled={loading || !query.trim()} style={{ padding: '11px 20px', borderRadius: 10, border: 'none', background: query.trim() && !loading ? '#E8001D' : 'rgba(255,255,255,.1)', color: query.trim() && !loading ? '#fff' : 'rgba(255,255,255,.4)', fontSize: 15, cursor: 'pointer', fontWeight: 600 }}>→</button>
      </div>
    </div>
  );
}

Object.assign(window, { SectorHeader, SectorAISummary, SectorKpis, SectorEvolutionCard, SectorGeoCard, SectorLeadersCard, SubsectorsCard, FeaturedCard, MARadarCard, ProcurementCard, SignalsCard, SectorAnalyst });

/* ══ arroba copilot — dock transversal (flotante, presente en todas las secciones) ══ */
function CopilotDock() {
  const [open, setOpen] = React.useState(false);
  return (
    <React.Fragment>
      {/* Botón flotante */}
      {!open && (
        <button onClick={() => setOpen(true)} style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 400, display: 'inline-flex', alignItems: 'center', gap: 9, padding: '13px 18px', borderRadius: 999, border: 'none', background: '#0C0C0E', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: '0 10px 32px rgba(12,12,14,.32)' }}>
          <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#E8001D', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>✦</span>
          arroba copilot
        </button>
      )}
      {/* Panel */}
      {open && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 400, width: 'min(420px, calc(100vw - 32px))', boxShadow: '0 18px 56px rgba(12,12,14,.4)', borderRadius: 16 }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setOpen(false)} title="Cerrar" style={{ position: 'absolute', top: 16, right: 16, zIndex: 2, width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.08)', color: '#fff', cursor: 'pointer', fontSize: 15, lineHeight: 1 }}>✕</button>
            <SectorAnalyst/>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

Object.assign(window, { CopilotDock });
