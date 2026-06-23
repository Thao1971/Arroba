// arroba.com — Ficha sectorial · Empresas + Análisis tabs

/* ══ EMPRESAS TAB ══════════════════════════════════════════ */
function EmpresasTab() {
  const { total, activeFilters, rows, selected } = window.SECTOR_COMPANIES;
  const [sel, setSel] = React.useState(0);
  const company = rows[sel] || rows[0];

  const colTip = {
    revenue: { title: 'Facturación', desc: 'Cifra de negocio del último ejercicio depositado.', method: 'Cuentas anuales · Registro Mercantil' },
    ebitda:  { title: 'EBITDA', desc: 'Beneficio antes de intereses, impuestos, depreciaciones y amortizaciones.', method: 'Cuentas anuales' },
    margin:  { title: 'Margen EBITDA', desc: 'EBITDA sobre facturación. Indicador de eficiencia operativa.' },
    cagr:    { title: 'CAGR 3 años', desc: 'Tasa de crecimiento anual compuesto de ingresos en los últimos 3 ejercicios.' },
    opp:     { title: 'Índice de Oportunidad', desc: 'Puntuación 0–100 que combina crecimiento, calidad financiera y encaje con compradores activos.', method: 'Modelo propietario arroba.com' },
    ma:      { title: 'M&A Score', desc: 'Nivel de preparación de la empresa para una operación corporativa.', method: 'Checklist documental + estructura societaria' },
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>
      {/* Table card */}
      <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Empresas del sector</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{total} empresas encontradas</span>
          <SecTooltip content={{ desc: 'Empresas activas clasificadas en el CNAE J (Información y Comunicaciones) según el último depósito de cuentas.' }} position="right" size={13}/>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 9 }}>
            <SecIcon name="search" size={14} color="var(--text-subtle)" sw={1.75}/>
            <span style={{ fontSize: 13, color: 'var(--text-subtle)' }}>Buscar empresa...</span>
          </div>
          {[['layers','Filtros'],['chartBar','Columnas']].map(([ic, l]) => (
            <button key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 9, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              <SecIcon name={ic} size={14} color="var(--text-muted)" sw={1.75}/> {l}
            </button>
          ))}
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 9, border: '1px solid rgba(232,0,29,.3)', background: 'rgba(232,0,29,.05)', color: '#E8001D', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            <span style={{ fontSize: 13 }}>✦</span> Analista IA
          </button>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 9, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            <SecIcon name="document" size={14} color="var(--text-muted)" sw={1.75}/> Exportar
          </button>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 9, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            <SecIcon name="bookmark" size={14} color="var(--text-muted)" sw={1.75}/> Guardar búsqueda
          </button>
        </div>

        {/* Active filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          {activeFilters.map(f => (
            <span key={f} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 500, color: 'var(--text)', background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '5px 10px', borderRadius: 7 }}>
              {f} <span style={{ color: 'var(--text-subtle)', cursor: 'pointer' }}>✕</span>
            </span>
          ))}
          <span style={{ fontSize: 12, fontWeight: 600, color: '#E8001D', cursor: 'pointer' }}>Limpiar filtros</span>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ width: 28 }}><div style={{ width: 15, height: 15, border: '1.5px solid var(--border-strong)', borderRadius: 4 }}/></th>
                <th style={{ textAlign: 'left', padding: '0 8px 10px 0', fontSize: 11, fontWeight: 600, color: 'var(--text-subtle)' }}>Empresa</th>
                <th style={{ textAlign: 'left', padding: '0 8px 10px', fontSize: 11, fontWeight: 600, color: 'var(--text-subtle)' }}>Provincia</th>
                {[['Facturación','revenue','Último año'],['EBITDA','ebitda','Último año'],['Margen','margin','EBITDA'],['Empleados',null],['CAGR 3 años','cagr','Ingresos'],['Índice\u00A0Oport.','opp'],['M&A Score','ma']].map(([h, key, subh]) => (
                  <th key={h} style={{ textAlign: 'right', padding: '0 8px 10px', fontSize: 11, fontWeight: 600, color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                      {h} {key && colTip[key] && <SecTooltip content={colTip[key]} position="left" size={12}/>}
                    </div>
                    {subh && <div style={{ fontSize: 9, fontWeight: 400, color: 'var(--text-subtle)', opacity: .7 }}>{subh}</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const active = i === sel;
                return (
                  <tr key={r.rank} onClick={() => setSel(i)} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: active ? 'rgba(232,0,29,.04)' : 'transparent' }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface-2)'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                    <td style={{ padding: '11px 0' }}><div style={{ width: 15, height: 15, border: `1.5px solid ${active ? '#E8001D' : 'var(--border-strong)'}`, borderRadius: 4, background: active ? '#E8001D' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10 }}>{active ? '✓' : ''}</div></td>
                    <td style={{ padding: '11px 8px 11px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)', width: 12 }}>{r.rank}</span>
                        <span style={{ width: 24, height: 24, borderRadius: 6, background: '#0C0C0E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{r.logo}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>{r.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 8px', color: 'var(--text-muted)' }}>{r.province}</td>
                    <td style={{ padding: '11px 8px', textAlign: 'right', fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{r.revenue}</td>
                    <td style={{ padding: '11px 8px', textAlign: 'right', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{r.ebitda}</td>
                    <td style={{ padding: '11px 8px', textAlign: 'right', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{r.margin}</td>
                    <td style={{ padding: '11px 8px', textAlign: 'right', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{r.emp}</td>
                    <td style={{ padding: '11px 8px', textAlign: 'right', color: '#1A8A4A', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{r.cagr}</td>
                    <td style={{ padding: '11px 8px', textAlign: 'right' }}><span style={{ fontSize: 12, fontWeight: 700, color: '#1A8A4A', fontVariantNumeric: 'tabular-nums' }}>{r.opp}</span></td>
                    <td style={{ padding: '11px 8px', textAlign: 'right' }}><span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{r.ma}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>Mostrando 1 a 10 de {total} empresas</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer' }}>‹</button>
            {['1','2','3','4','5','…','5.696'].map((p, i) => (
              <button key={i} style={{ minWidth: 28, height: 28, padding: '0 6px', borderRadius: 7, border: p === '1' ? 'none' : '1px solid var(--border)', background: p === '1' ? '#E8001D' : 'var(--surface)', color: p === '1' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)' }}>{p}</button>
            ))}
            <button style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer' }}>›</button>
          </div>
        </div>
      </div>

      {/* Selected company panel */}
      <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: 20, position: 'sticky', top: 80 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Empresa seleccionada</span>
          <SecIcon name="info" size={14} color="var(--text-subtle)" sw={1.75}/>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <span style={{ width: 40, height: 40, borderRadius: 9, background: '#0C0C0E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>{company.logo}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{company.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{company.province}</div>
          </div>
        </div>

        {[['Facturación', company.revenue],['EBITDA', company.ebitda],['Margen EBITDA', company.margin],['Empleados', company.emp],['Índice Oportunidad', company.opp]].map(([l, v]) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{v}</span>
          </div>
        ))}

        <div style={{ marginTop: 16, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#E8001D' }}>✦</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Resumen IA</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 14 }}>{selected.aiSummary}</p>
        <button style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px', borderRadius: 9, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          <span style={{ fontSize: 12, color: '#E8001D' }}>✦</span> Ver análisis completo
        </button>

        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.06em', margin: '18px 0 10px' }}>Acciones rápidas</div>
        {[['layers','Ver ficha completa','Company Profile.html'],['target','Analizar con IA'],['euro','Valorar empresa'],['team','Buscar compradores'],['bookmark','Añadir a lista']].map(([ic, l, href]) => (
          <a key={l} href={href || '#'} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
              <SecIcon name={ic} size={14} color="var(--text-muted)" sw={1.75}/>
              <span style={{ fontSize: 12.5, color: l === 'Añadir a lista' ? '#E8001D' : 'var(--text)', flex: 1, fontWeight: l === 'Añadir a lista' ? 600 : 400 }}>{l}</span>
              <SecIcon name="arrowRight" size={13} color="var(--text-subtle)" sw={2}/>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ══ ANÁLISIS TAB ══════════════════════════════════════════ */
function AnalisisTab() {
  // Opportunity matrix (growth vs concentration) — sectors plotted
  const points = [
    { name: 'Programación IT', x: 88, y: 91, r: 22, hot: true },
    { name: 'Servicios info.', x: 72, y: 85, r: 16 },
    { name: 'Telecom', x: 40, y: 79, r: 14 },
    { name: 'Cine/TV', x: 58, y: 72, r: 11 },
    { name: 'Edición', x: 22, y: 64, r: 9 },
  ];
  const drivers = [
    { label: 'Creación de empresas', value: 38, dir: 'up' },
    { label: 'Contratación pública', value: 28, dir: 'up' },
    { label: 'Actividad M&A', value: 19, dir: 'up' },
    { label: 'Concentración territorial', value: 15, dir: 'up' },
  ];
  const risks = [
    { label: 'Concentración geográfica en Madrid', level: 'Medio', pct: 58 },
    { label: 'Dependencia de contratación pública', level: 'Medio', pct: 48 },
    { label: 'Presión regulatoria (telecom)', level: 'Bajo', pct: 32 },
    { label: 'Rotación de talento técnico', level: 'Alto', pct: 71 },
  ];
  const lvlColor = l => l === 'Alto' ? '#E8001D' : l === 'Medio' ? '#D97708' : '#1A8A4A';
  const gems = window.SECTOR_DATA.gems;
  const rankings = window.SECTOR_DATA.rankings;
  const conc = window.SECTOR_DATA.concentration;
  const ma = window.SECTOR_DATA.ma;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Banner */}
      <div style={{ background: 'rgba(232,0,29,.04)', border: '1px solid rgba(232,0,29,.16)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 18, color: '#E8001D' }}>✦</span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}><strong style={{ color: 'var(--text)', fontWeight: 600 }}>Análisis profundo del sector.</strong> Matriz de oportunidad, descomposición de drivers de crecimiento y mapa de riesgos, calculados sobre los datos verificados del sector.</span>
      </div>

      {/* Scatter Revenue vs EBITDA (mismo estilo que Gráficos) — ancho completo */}
      <ScatterChart/>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }} className="sec-an-2col">
        {/* Growth drivers */}
        <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Drivers de crecimiento</h3>
            <SecTooltip content={{ title: 'Descomposición de drivers', desc: 'Contribución relativa de cada factor al crecimiento del Índice de Oportunidad del sector en los últimos 12 meses.' }} position="left"/>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 16 }}>Contribución al crecimiento (12m)</div>
          {drivers.map(d => (
            <div key={d.label} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: 'var(--text)' }}>{d.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1A8A4A' }}>+{d.value}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${d.value*2.4}%`, background: '#E8001D', borderRadius: 3 }}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk map */}
      <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Mapa de riesgos del sector</h3>
          <SecTooltip content={{ title: 'Mapa de riesgos', desc: 'Factores de riesgo estructurales identificados por el sistema, con su nivel de intensidad estimado.' }} position="right"/>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 16 }}>Factores estructurales detectados</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {risks.map(r => (
            <div key={r.label} style={{ padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{r.label}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: lvlColor(r.level), background: `${lvlColor(r.level)}18`, padding: '2px 8px', borderRadius: 4 }}>{r.level}</span>
              </div>
              <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${r.pct}%`, background: lvlColor(r.level), borderRadius: 3 }}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Joyas ocultas */}
      <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 14, color: '#E8001D' }}>✦</span>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Joyas ocultas</h3>
          <SecTooltip content={{ title: 'Joyas ocultas', desc: 'Empresas con métricas superiores a la media del sector que aún no han registrado actividad corporativa. Candidatas a oportunidad de compra temprana.', method: 'Modelo propietario arroba.com' }} position="right"/>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 16 }}>Empresas infravaloradas con alto potencial</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {gems.map(g => (
            <div key={g.name} style={{ padding: '15px 16px', border: '1px solid var(--border)', borderRadius: 11 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{g.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-subtle)' }}>{g.province}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1A8A4A', background: 'rgba(26,138,74,.1)', padding: '3px 9px', borderRadius: 5, fontVariantNumeric: 'tabular-nums' }}>Opp {g.opp}</span>
              </div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
                {[['Facturación', g.revenue], ['Margen', g.margin], ['CAGR', g.cagr]].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: 10, color: 'var(--text-subtle)' }}>{l}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: l === 'CAGR' ? '#1A8A4A' : 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{v}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{g.why}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rankings */}
      <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Rankings del sector</h3>
          <SecTooltip content={{ title: 'Rankings', desc: 'Empresas líderes del sector según facturación, crecimiento y margen EBITDA.' }} position="right"/>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 16 }}>Top 5 por métrica</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          {[['Por facturación', rankings.facturacion], ['Por crecimiento', rankings.crecimiento], ['Por margen EBITDA', rankings.margen]].map(([title, rows]) => (
            <div key={title}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>{title}</div>
              {rows.map((r, i) => (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? '#E8001D' : 'var(--text-subtle)', width: 14 }}>{i + 1}</span>
                  <span style={{ fontSize: 12.5, color: 'var(--text)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{r.value}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Concentración + M&A */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }} className="sec-an-2col">
        {/* Concentración */}
        <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Concentración de mercado</h3>
            <SecTooltip content={{ title: 'Concentración', desc: 'Cuota de facturación de las mayores compañías y nivel de concentración del sector (índice HHI).' }} position="right"/>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 14 }}>Índice HHI: <strong style={{ color: 'var(--text)' }}>{conc.hhi}</strong> · {conc.hhiLabel}</div>
          {/* barra apilada */}
          <div style={{ display: 'flex', height: 16, borderRadius: 5, overflow: 'hidden', marginBottom: 14 }}>
            {conc.top.map((c, i) => (
              <div key={c.name} title={`${c.name} · ${c.share}%`} style={{ width: `${c.share}%`, background: `rgba(232,0,29,${(0.9 - i * 0.13).toFixed(2)})` }}/>
            ))}
            <div style={{ width: `${conc.restShare}%`, background: 'var(--border-strong)' }} title={`Resto · ${conc.restShare}%`}/>
          </div>
          {conc.top.map(c => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12.5, color: 'var(--text)', flex: 1 }}>{c.name}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{c.share}%</span>
            </div>
          ))}
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.55, marginTop: 12 }}>{conc.note}</p>
        </div>

        {/* M&A */}
        <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Operaciones corporativas</h3>
            <SecTooltip content={{ title: 'Actividad M&A', desc: 'Adquisiciones, fusiones y levantamientos de capital recientes en el sector.', method: 'Registros públicos + prensa especializada' }} position="left"/>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 14 }}>Últimas operaciones detectadas</div>
          {ma.map((m, i) => {
            const kc = m.kind === 'acq' ? '#2164E3' : m.kind === 'raise' ? '#1A8A4A' : '#D97708';
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0', borderBottom: i < ma.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: kc, background: `${kc}18`, padding: '3px 8px', borderRadius: 5, whiteSpace: 'nowrap' }}>{m.type}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.target}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{m.buyer !== '—' ? m.buyer + ' · ' : ''}{m.date}</div>
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{m.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { EmpresasTab, AnalisisTab });
