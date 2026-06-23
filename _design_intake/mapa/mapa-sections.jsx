// arroba.com — Mapa empresarial sections

function MCard({ children, style, pad = 20 }) {
  return <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: pad, ...style }}>{children}</div>;
}
function MSeeAll({ label = 'Ver todas' }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#E8001D', cursor: 'pointer', whiteSpace: 'nowrap' }}>{label} <MIcon name="arrowRight" size={12} color="#E8001D" sw={2}/></span>;
}

/* ══ Page header ═══════════════════════════════════════════ */
function MapaHeader() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em' }}>Mapa empresarial de España</h1>
          <MIcon name="info" size={17} color="var(--text-subtle)" sw={1.75}/>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Inteligencia territorial para tomar mejores decisiones</p>
      </div>
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 9, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          <MIcon name="calendar" size={14} color="var(--text-muted)" sw={1.75}/> Últimos 12 meses <span style={{ fontSize: 8 }}>▼</span>
        </button>
        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 9, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          <MIcon name="share" size={14} color="var(--text-muted)" sw={1.75}/> Compartir
        </button>
      </div>
    </div>
  );
}

/* ══ 5 national KPI cards ══════════════════════════════════ */
function NationalKpis() {
  const { national } = window.MAPA_DATA;
  const cards = [
    { icon: 'team',     value: national.activas,   label: 'Empresas activas',   delta: national.activasDelta, sub: 'vs. 12M anteriores', trend: 'up' },
    { icon: 'trending', value: national.nuevas,     label: 'Nuevas empresas',    delta: national.nuevasDelta,  sub: 'vs. 12M anteriores', trend: 'up' },
    { icon: 'chartBar', value: national.saldoNeto,  label: 'Saldo neto',         delta: national.saldoDelta,   sub: 'vs. 12M anteriores', trend: 'up' },
    { icon: 'location', value: national.provincias, label: 'Provincias',         delta: null },
    { icon: 'flag',     value: national.ccaa,       label: 'Comunidades autónomas', delta: null },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 16 }}>
      {cards.map(c => (
        <MCard key={c.label} pad={18}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(232,0,29,.08)', border: '1px solid rgba(232,0,29,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MIcon name={c.icon} size={20} color="#E8001D" sw={1.75}/>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em', lineHeight: 1, fontFamily: 'var(--font-display)' }}>{c.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>{c.label}</div>
              {c.delta && (
                <div style={{ fontSize: 10, marginTop: 4 }}>
                  <span style={{ color: '#1A8A4A', fontWeight: 600 }}>↑ {c.delta}</span>
                  <span style={{ color: 'var(--text-subtle)' }}> {c.sub}</span>
                </div>
              )}
            </div>
          </div>
        </MCard>
      ))}
    </div>
  );
}

/* ══ AI summary bar ════════════════════════════════════════ */
function AIBar() {
  const { aiSummary } = window.MAPA_DATA;
  return (
    <div style={{ background: 'rgba(232,0,29,.05)', border: '1px solid rgba(232,0,29,.18)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 18, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 18, color: '#fff', fontWeight: 800 }}>✦</span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>Análisis inteligente</span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, flex: 1 }}>{aiSummary}</p>
      <button style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: '1.5px solid #E8001D', background: 'transparent', color: '#E8001D', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
        Ver análisis completo <MIcon name="arrowRight" size={13} color="#E8001D" sw={2}/>
      </button>
    </div>
  );
}

/* ══ Left filters panel ════════════════════════════════════ */
function FilterSelect({ label, value, info }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>{label}</span>
        {info && <MIcon name="info" size={11} color="var(--text-subtle)" sw={1.75}/>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 9, border: '1px solid var(--border-strong)', background: 'var(--surface)', cursor: 'pointer', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
        {value} <span style={{ fontSize: 8, color: 'var(--text-subtle)' }}>▼</span>
      </div>
    </div>
  );
}
function FiltersPanel() {
  return (
    <MCard pad={20} style={{ alignSelf: 'start' }}>
      <FilterSelect label="Indicador" value="Índice de Oportunidad de Mercado" info/>
      <FilterSelect label="Ámbito geográfico" value="Provincias"/>
      <FilterSelect label="Sector" value="Todos los sectores"/>
      <FilterSelect label="Periodo" value="Últimos 12 meses"/>
      <button style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 9, border: '1px solid var(--border-strong)', background: 'var(--surface-2)', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', marginTop: 4 }}>
        <MIcon name="refresh" size={13} color="var(--text-muted)" sw={1.75}/> Restablecer filtros
      </button>
    </MCard>
  );
}

/* ══ Center: Map + territory ficha ═════════════════════════ */
function MapPanel() {
  const [selected, setSelected] = React.useState('madrid');
  const [hovered, setHovered] = React.useState(null);
  const region = window.SPAIN_REGIONS.find(r => r.id === (hovered || selected));
  const { territory } = window.MAPA_DATA;

  return (
    <MCard pad={20} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 16 }}>
        {/* Zoom controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          {['plus','minus','expand'].map(z => (
            <button key={z} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MIcon name={z} size={15} color="var(--text-muted)" sw={2}/>
            </button>
          ))}
        </div>

        {/* Map */}
        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          <SpainMapDetailed selected={selected} onSelect={setSelected} hovered={hovered} onHover={setHovered}/>
          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>Bajo</span>
            <div style={{ width: 140, height: 6, borderRadius: 3, background: 'linear-gradient(90deg, rgba(232,0,29,.14), #E8001D)' }}></div>
            <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>Alto</span>
          </div>
          <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-subtle)', marginTop: 4 }}>Índice de Oportunidad de Mercado</div>
        </div>

        {/* Territory ficha (floating right) */}
        <div style={{ width: 210, flexShrink: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, boxShadow: '0 8px 30px rgba(12,12,14,.08)', alignSelf: 'flex-start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{region ? region.name : territory.name}</span>
            <MIcon name="close" size={14} color="var(--text-subtle)" sw={2}/>
          </div>
          {[['536.000','Empresas activas'],['+14.200','Nuevas empresas'],['2.100','Empresas cerradas']].map(([v,l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', minWidth: 64 }}>{v}</span>
              <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{l}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', margin: '12px 0', paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.3 }}>Índice de Oportunidad de Mercado</span>
              <span style={{ fontSize: 28, fontWeight: 800, color: '#E8001D', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{region ? region.score : territory.score}</span>
            </div>
            {territory.dims.map(d => (
              <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', flex: 1 }}>{d.label}</span>
                <div style={{ width: 50, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${d.value}%`, background: '#E8001D' }}/>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text)', width: 18, textAlign: 'right' }}>{d.value}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--text-subtle)', marginBottom: 4 }}>Sector líder</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#E8001D' }}>✦</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#E8001D' }}>{territory.leadSector}</span>
            </div>
          </div>
        </div>
      </div>
    </MCard>
  );
}

/* ══ Right: ranking tabs ═══════════════════════════════════ */
function RankingPanel() {
  const [tab, setTab] = React.useState('provincias');
  const { provinces, ccaa, sectorsRank } = window.MAPA_DATA;
  const data = tab === 'provincias' ? provinces : tab === 'ccaa' ? ccaa : sectorsRank;
  const tabs = [['provincias','Provincias'],['ccaa','CCAA'],['sectores','Sectores']];
  return (
    <MCard pad={20} style={{ alignSelf: 'start' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '8px 14px', border: 'none', background: 'transparent', cursor: 'pointer',
            fontSize: 13, fontWeight: tab === id ? 700 : 500,
            color: tab === id ? '#E8001D' : 'var(--text-muted)',
            borderBottom: `2px solid ${tab === id ? '#E8001D' : 'transparent'}`,
            marginBottom: -1, fontFamily: 'var(--font-body)',
          }}>{label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
        <span>Ranking &nbsp; {tab === 'sectores' ? 'Sector' : 'Territorio'}</span>
        <span>Índice de Oportunidad</span>
      </div>
      {data.map(d => (
        <div key={d.rank} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
          onMouseLeave={e => e.currentTarget.style.background = ''}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-subtle)', width: 18 }}>{d.rank}</span>
          <span style={{ fontSize: 13, color: 'var(--text)', flex: 1, fontWeight: d.rank <= 3 ? 600 : 400 }}>{d.name}</span>
          <ScoreMini value={d.score}/>
        </div>
      ))}
      <div style={{ marginTop: 12, textAlign: 'center' }}>
        <MSeeAll label={`Ver ${tab === 'sectores' ? 'todos los sectores' : tab === 'ccaa' ? 'todas las CCAA' : 'todas las provincias'} →`}/>
      </div>
    </MCard>
  );
}

/* ══ Bottom row 1 ══════════════════════════════════════════ */
function EvolutionCard() {
  const { evolution } = window.MAPA_DATA;
  const [period, setPeriod] = React.useState('12 meses');
  return (
    <MCard>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', marginBottom: 2 }}>Evolución empresarial en España</h3>
      <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 10 }}>Últimos 12 meses</div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 6 }}>
        {[['Nuevas empresas','#E8001D'],['Empresas cerradas','#0C0C0E'],['Saldo neto','#ADADAA']].map(([l,c]) => (
          <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-muted)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: c }}></span>{l}
          </span>
        ))}
      </div>
      <MapaEvolution data={evolution}/>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['12 meses','24 meses','36 meses'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', cursor: 'pointer',
              fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-body)',
              background: period === p ? 'rgba(232,0,29,.08)' : 'var(--surface)',
              color: period === p ? '#E8001D' : 'var(--text-muted)',
              borderColor: period === p ? 'rgba(232,0,29,.3)' : 'var(--border)',
            }}>{p}</button>
          ))}
        </div>
        <MSeeAll label="Ver detalle →"/>
      </div>
    </MCard>
  );
}

function DriveSectorsCard() {
  const { driveSectors } = window.MAPA_DATA;
  return (
    <MCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Sectores que impulsan Madrid</h3>
        <MSeeAll label="Ver todos →"/>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 12 }}>Por crecimiento (12m)</div>
      {driveSectors.map(s => (
        <div key={s.rank} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>{s.rank}</span>
          <span style={{ fontSize: 12.5, color: 'var(--text)', flex: 1, lineHeight: 1.3 }}>{s.name}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#1A8A4A' }}>↑ {s.delta}</span>
        </div>
      ))}
    </MCard>
  );
}

function EmergingSectorsCard() {
  const { emergingSectors } = window.MAPA_DATA;
  return (
    <MCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Sectores emergentes en España</h3>
        <MSeeAll label="Ver todos →"/>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 12 }}>Por crecimiento (12m)</div>
      {emergingSectors.map(s => (
        <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MIcon name={s.icon} size={14} color="var(--text-muted)" sw={1.75}/>
          </span>
          <span style={{ fontSize: 12.5, color: 'var(--text)', flex: 1, lineHeight: 1.3 }}>{s.name}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#1A8A4A' }}>↑ {s.delta}</span>
        </div>
      ))}
    </MCard>
  );
}

function OppSectorTerritoryCard() {
  const { sectorTerritory: st } = window.MAPA_DATA;
  return (
    <MCard>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', marginBottom: 2 }}>
        Oportunidades por sector <span style={{ color: 'var(--text-subtle)' }}>×</span> territorio
      </h3>
      <div style={{ display: 'flex', gap: 8, margin: '12px 0 16px' }}>
        {[['Territorio', st.territory],['Sector', st.sector]].map(([l, v]) => (
          <div key={l} style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--text-subtle)', marginBottom: 4 }}>{l}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border-strong)', fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
              {v} <span style={{ fontSize: 7, color: 'var(--text-subtle)' }}>▼</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: 14, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#E8001D', marginBottom: 10 }}>{st.sector} en {st.territory}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Índice de Oportunidad', st.index, true],
              ['Concentración vs. media nacional', st.concentration, false],
              ['Actividad BORME (12m)', st.borme, false],
              ['Contratación pública (12m)', st.contratacion, false, st.contratacionTrend],
            ].map(([l, v, big, trend]) => (
              <div key={l}>
                <div style={{ fontSize: 9.5, color: 'var(--text-subtle)', marginBottom: 3, lineHeight: 1.3 }}>{l}</div>
                <div style={{ fontSize: big ? 26 : 17, fontWeight: 800, color: big ? '#E8001D' : 'var(--text)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{v}</div>
                {trend && <div style={{ fontSize: 10, color: '#1A8A4A', marginTop: 2 }}>{trend}</div>}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
            <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>Tendencia</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#1A8A4A' }}>↗ {st.tendencia}</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9.5, color: 'var(--text-subtle)', marginBottom: 6, textAlign: 'center' }}>Mapa de intensidad · {st.sector}</div>
          <SectorIntensityMap/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, justifyContent: 'center' }}>
            <span style={{ fontSize: 8, color: 'var(--text-subtle)' }}>Baja</span>
            <div style={{ width: 60, height: 4, borderRadius: 2, background: 'linear-gradient(90deg, rgba(232,0,29,.12), #E8001D)' }}></div>
            <span style={{ fontSize: 8, color: 'var(--text-subtle)' }}>Alta</span>
          </div>
        </div>
      </div>
    </MCard>
  );
}

/* ══ Comparator ════════════════════════════════════════════ */
function ComparatorCard() {
  const { comparator } = window.MAPA_DATA;
  return (
    <MCard>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', marginBottom: 2 }}>Comparador territorial</h3>
      <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 14 }}>Selecciona hasta 4 territorios para comparar</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {comparator.map(c => (
          <span key={c.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#fff', background: '#E8001D', padding: '5px 10px', borderRadius: 7 }}>
            {c.name} <span style={{ opacity: .7, cursor: 'pointer' }}>✕</span>
          </span>
        ))}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface)', border: '1px dashed var(--border-strong)', padding: '5px 10px', borderRadius: 7, cursor: 'pointer' }}>
          <MIcon name="plus" size={12} color="var(--text-muted)" sw={2}/> Añadir territorio
        </span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            {['Territorio','Índice de Oportunidad','Crecimiento (12m)','Actividad económica','Sectores líderes','Sectores emergentes'].map(h => (
              <th key={h} style={{ textAlign: h === 'Territorio' ? 'left' : 'left', fontSize: 10, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.04em', paddingBottom: 10, fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparator.map(c => (
            <tr key={c.name} style={{ borderTop: '1px solid var(--border)' }}>
              <td style={{ padding: '11px 0', fontWeight: 700, color: 'var(--text)' }}>{c.name}</td>
              <td style={{ padding: '11px 8px 11px 0' }}><ScoreMini value={c.score} w={80}/></td>
              <td style={{ padding: '11px 0', fontWeight: 700, color: '#1A8A4A' }}>{c.growth}</td>
              <td style={{ padding: '11px 8px 11px 0' }}><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontWeight: 700, color: 'var(--text)', width: 22 }}>{c.activity}</span><MSparkline data={c.spark} color="#1A8A4A" w={48} h={18}/></div></td>
              <td style={{ padding: '11px 0', color: 'var(--text-muted)' }}>{c.lead}</td>
              <td style={{ padding: '11px 0', color: 'var(--text-muted)' }}>{c.emerging}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </MCard>
  );
}

/* ══ Sources ═══════════════════════════════════════════════ */
function SourcesCard() {
  const { sources } = window.MAPA_DATA;
  return (
    <MCard>
      <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>Fuentes de datos</h3>
      {sources.map(s => (
        <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{s.name}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: s.status === 'real' ? '#1A8A4A' : 'var(--text-subtle)' }}>
            {s.status === 'real' ? '✓ Datos reales' : '◷ Próximamente'}
          </span>
        </div>
      ))}
      <div style={{ marginTop: 12 }}><MSeeAll label="Ver calidad de los datos →"/></div>
    </MCard>
  );
}

/* ══ Methodology footer ════════════════════════════════════ */
function MethodologyBar() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 4px', marginTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <MIcon name="info" size={15} color="var(--text-subtle)" sw={1.75}/>
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text)', fontWeight: 600 }}>¿Cómo calculamos el Índice de Oportunidad de Mercado?</strong> &nbsp;Combinamos 6 dimensiones: tamaño empresarial, crecimiento, actividad mercantil, creación de empresas, contratación pública y concentración sectorial.
        </span>
      </div>
      <button style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
        Metodología <MIcon name="arrowRight" size={12} color="var(--text)" sw={2}/>
      </button>
    </div>
  );
}

Object.assign(window, { MapaHeader, NationalKpis, AIBar, FiltersPanel, MapPanel, RankingPanel, EvolutionCard, DriveSectorsCard, EmergingSectorsCard, OppSectorTerritoryCard, ComparatorCard, SourcesCard, MethodologyBar });
