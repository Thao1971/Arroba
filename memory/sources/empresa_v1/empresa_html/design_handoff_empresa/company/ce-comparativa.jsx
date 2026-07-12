// Arroba — Company Entity: Comparativa (visión competitiva unificada)
// Hilo conductor: ¿con quién te comparo? → ¿dónde estás? → ¿en qué eres mejor o peor? → ¿qué oportunidades tienes? → ¿qué deberías hacer?

const CMP_MONO = { fontFamily: 'var(--font-mono, ui-monospace, monospace)', fontVariantNumeric: 'tabular-nums' };

/* 1 — Universo de comparación: por defecto construido por IA, editable */
function CmpUniverso({ grupos, sel, setSel, comparables, editing, setEditing }) {
  const activo = grupos.find(g => g.id === sel);
  if (!editing) {
    return (
      <CECard style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(232,0,29,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: 16 }}>✦</span></div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>Universo de comparación: {comparables.length} empresas</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-subtle)', marginTop: 2 }}>{activo.desc} · Construido automáticamente por Arroba Intelligence</div>
        </div>
        <button onClick={() => setEditing(true)} style={{ padding: '9px 15px', borderRadius: 9, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>Modificar universo</button>
      </CECard>
    );
  }
  const ICONS = { ia: '✨', directos: '🎯', aspiracional: '🚀', seguidas: '★', manual: '➕' };
  return (
    <CECard>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <Eyebrow style={{ margin: 0 }}>Construir universo · ¿con quién quieres compararte?</Eyebrow>
        <button onClick={() => setEditing(false)} style={{ fontSize: 12, fontWeight: 700, color: '#E8001D', background: 'none', border: 'none', cursor: 'pointer' }}>Listo</button>
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '4px 0 14px' }}>Todo lo que verás en Comparativa se basa en este conjunto. Elige cómo quieres construirlo.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {grupos.map(g => (
          <button key={g.id} onClick={() => setSel(g.id)} style={{ textAlign: 'left', padding: '13px 14px', borderRadius: 11, border: sel === g.id ? '1.5px solid #E8001D' : '1px solid var(--border)', background: sel === g.id ? 'rgba(232,0,29,.05)' : 'var(--surface)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            <div style={{ fontSize: 16, marginBottom: 6 }}>{ICONS[g.id]}</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: sel === g.id ? '#E8001D' : 'var(--text)', marginBottom: 4 }}>{g.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', lineHeight: 1.4 }}>{g.desc}</div>
          </button>
        ))}
      </div>
      {sel === 'manual' && (
        <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input placeholder="Buscar empresa por nombre o CIF…" style={{ flex: 1, padding: '10px 13px', borderRadius: 9, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font-body)' }}/>
          <button style={{ padding: '10px 16px', borderRadius: 9, border: 'none', background: 'var(--text)', color: 'var(--bg)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Añadir</button>
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
        {comparables.map((c, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '6px 10px 6px 12px', borderRadius: 20 }}>
            {c.name} · {c.ventas.toLocaleString('es-ES')}M€
            <span style={{ cursor: 'pointer', color: 'var(--text-subtle)', fontWeight: 700 }}>✕</span>
          </span>
        ))}
      </div>
      <button style={{ marginTop: 14, padding: '9px 15px', borderRadius: 9, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Guardar universo</button>
    </CECard>
  );
}

/* 2 — Resumen ejecutivo: percentiles + FODA */
function CmpResumen({ data }) {
  return (
    <CECard>
      <Eyebrow>Resumen ejecutivo · ¿cómo está esta empresa respecto a su mercado?</Eyebrow>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.resumenPercentiles.length}, 1fr)`, gap: 12, marginBottom: 18 }}>
        {data.resumenPercentiles.map(p => (
          <div key={p.l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: p.p >= 70 ? '#1A8A4A' : p.p >= 45 ? '#D97708' : '#E8001D', fontFamily: 'var(--font-display)' }}>P{p.p}</div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 4, lineHeight: 1.3 }}>{p.l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#1A8A4A', marginBottom: 8 }}>Fortalezas</div>
          {data.foda.fortalezas.map((f, i) => <div key={i} style={{ display: 'flex', gap: 7, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 6 }}><span style={{ color: '#1A8A4A', flexShrink: 0 }}>✓</span>{f}</div>)}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#D97708', marginBottom: 8 }}>Debilidades</div>
          {data.foda.debilidades.map((f, i) => <div key={i} style={{ display: 'flex', gap: 7, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 6 }}><span style={{ color: '#D97708', flexShrink: 0 }}>⚠</span>{f}</div>)}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#E8001D', marginBottom: 8 }}>Oportunidades</div>
          {data.foda.oportunidades.map((f, i) => <div key={i} style={{ display: 'flex', gap: 7, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 6 }}><span style={{ color: '#E8001D', flexShrink: 0 }}>✦</span>{f}</div>)}
        </div>
      </div>
    </CECard>
  );
}

/* 3 — Posicionamiento competitivo: reutiliza radar + comparables */
function CmpPosicionamiento({ E, comparables }) {
  return (
    <CECard>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <Eyebrow style={{ margin: 0 }}>Posicionamiento competitivo frente al universo seleccionado</Eyebrow>
        <AskAdvisor q="¿Cómo se posiciona frente a sus comparables?" label="Preguntar al Advisor"/>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32, flexWrap: 'wrap', marginBottom: 18 }}>
        <CompetitiveRadar/>
        <div style={{ flex: 1, minWidth: 280 }}>
          {E.radar.map(r => (
            <div key={r.l} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid var(--border)' }}>
              <span style={{ width: 130, fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{r.l}</span>
              <div style={{ flex: 1, height: 8, background: 'var(--surface-2)', borderRadius: 4, position: 'relative' }}>
                <div style={{ position: 'absolute', height: '100%', width: `${r.e}%`, background: '#E8001D', borderRadius: 4 }}></div>
                <div style={{ position: 'absolute', left: `${r.s}%`, top: -2, width: 2, height: 12, background: 'var(--text)' }}></div>
              </div>
              <span style={{ width: 40, fontSize: 11, fontWeight: 700, color: '#1A8A4A', textAlign: 'right', flexShrink: 0 }}>{r.p}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {comparables.map((c, i) => (
          <span key={i} style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 8 }}>{c.name} · {c.ventas.toLocaleString('es-ES')}M€</span>
        ))}
      </div>
    </CECard>
  );
}

/* 4 — Comparativa financiera vs mediana/top25/top10/líder */
function CmpFinanciera({ rows }) {
  const cols = [['empresa', 'Empresa', '#E8001D'], ['mediana', 'Mediana', 'var(--text-muted)'], ['top25', 'Top25', '#2164E3'], ['top10', 'Top10', '#7C3AED'], ['lider', 'Líder', '#1A8A4A']];
  return (
    <CECard pad={0}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}><Eyebrow style={{ margin: 0 }}>Comparativa financiera</Eyebrow></div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '9px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle)', background: 'var(--surface-2)' }}>Métrica</th>
            {cols.map(c => <th key={c[0]} style={{ textAlign: 'right', padding: '9px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: c[2], background: 'var(--surface-2)' }}>{c[1]}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', fontWeight: 600 }}>{r.l}</td>
              {cols.map(c => <td key={c[0]} style={{ padding: '10px 20px', textAlign: 'right', borderTop: '1px solid var(--border)', fontWeight: c[0] === 'empresa' ? 700 : 500, color: c[2], ...CMP_MONO }}>{r[c[0]].toLocaleString('es-ES', { maximumFractionDigits: 1 })}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </CECard>
  );
}

/* Hidden Gems */
function CmpHiddenGems({ items, total }) {
  return (
    <CECard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 15 }}>💎</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Hidden Gems</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-subtle)', margin: '2px 0 12px' }}>Compañías pequeñas con márgenes altos y gran potencial.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '2px 14px', fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle)', paddingBottom: 7, borderBottom: '1px solid var(--border)' }}>
        <span>Empresa</span><span style={{ textAlign: 'right' }}>Revenue</span><span style={{ textAlign: 'right' }}>Margen</span>
      </div>
      {items.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '2px 14px', padding: '9px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{r.name}</span>
          <span style={{ fontSize: 12.5, ...CMP_MONO, color: 'var(--text)', textAlign: 'right' }}>{r.revenue.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M€</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, ...CMP_MONO, color: '#1A8A4A', textAlign: 'right' }}>{r.margen.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</span>
        </div>
      ))}
      <div style={{ fontSize: 12, fontWeight: 700, color: '#D97708', marginTop: 10, cursor: 'pointer' }}>Ver todas las hidden gems ({total})</div>
    </CECard>
  );
}

/* Targets interesantes */
function CmpTargets({ items, total }) {
  return (
    <CECard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 15 }}>🎯</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Targets interesantes</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-subtle)', margin: '2px 0 12px' }}>Compañías con buen equilibrio entre tamaño, rentabilidad y cercanía.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '2px 12px', fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle)', paddingBottom: 7, borderBottom: '1px solid var(--border)' }}>
        <span>Empresa</span><span style={{ textAlign: 'right' }}>Revenue</span><span style={{ textAlign: 'right' }}>Margen</span><span style={{ textAlign: 'right' }}>Cercanía</span>
      </div>
      {items.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '2px 12px', padding: '9px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{r.name}</span>
          <span style={{ fontSize: 12.5, ...CMP_MONO, color: 'var(--text)', textAlign: 'right' }}>{r.revenue.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M€</span>
          <span style={{ fontSize: 12.5, ...CMP_MONO, color: 'var(--text)', textAlign: 'right' }}>{r.margen.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</span>
          <span style={{ fontSize: 12.5, ...CMP_MONO, color: 'var(--text-subtle)', textAlign: 'right' }}>{r.cercania.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      ))}
      <div style={{ fontSize: 12, fontWeight: 700, color: '#D97708', marginTop: 10, cursor: 'pointer' }}>Ver todos los targets ({total})</div>
    </CECard>
  );
}

/* White Space */
function CmpWhiteSpace({ items }) {
  return (
    <CECard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid var(--text-subtle)', display: 'inline-block' }}></span>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>White Space</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-subtle)', margin: '2px 0 12px' }}>Espacios poco atendidos en el mercado con alta oportunidad.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2px 12px', fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle)', paddingBottom: 7, borderBottom: '1px solid var(--border)' }}>
        <span>Área de oportunidad</span><span style={{ textAlign: 'right' }}>Oportunidad</span>
      </div>
      {items.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2px 12px', padding: '11px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{r.area}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: r.oportunidad === 'Alta' ? '#1A8A4A' : '#D97708', textAlign: 'right' }}>{r.oportunidad}</span>
        </div>
      ))}
    </CECard>
  );
}

/* Mapa de oportunidades — scatter Revenue vs Margen EBITDA por cuadrantes */
const ZONE_COLORS = { alta: '#1A8A4A', competido: '#D9B300', pocoAtractivo: '#E8001D', saturado: 'var(--text-subtle)' };
const ZONE_LABELS = { alta: 'Oportunidad alta', competido: 'Competido', pocoAtractivo: 'Poco atractivo', saturado: 'Saturado' };
function CmpMapa({ points }) {
  const [hover, setHover] = React.useState(null);
  const W = 560, H = 320, padL = 46, padR = 16, padT = 16, padB = 30;
  const cW = W - padL - padR, cH = H - padT - padB;
  const maxRev = Math.max(...points.map(p => p.revenue)) * 1.08;
  const maxMar = Math.max(...points.map(p => p.margen)) * 1.15;
  const medRev = maxRev * 0.42, medMar = maxMar * 0.5;
  const x = v => padL + (v / maxRev) * cW;
  const y = v => padT + cH - (v / maxMar) * cH;
  return (
    <CECard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <Eyebrow style={{ margin: 0 }}>Mapa de oportunidades</Eyebrow>
        <span title="Revenue vs Margen EBITDA. Las zonas representan el nivel de oportunidad del mercado." style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--border-strong)', fontSize: 9, fontWeight: 700, color: 'var(--text-subtle)', cursor: 'help' }}>i</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-subtle)', margin: '2px 0 14px' }}>Revenue vs Margen EBITDA. Las zonas representan el nivel de oportunidad del mercado.</p>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', display: 'block' }}>
        <rect x={padL} y={padT} width={x(medRev) - padL} height={y(medMar) - padT} fill="rgba(26,138,74,.08)"/>
        <rect x={x(medRev)} y={padT} width={W - padR - x(medRev)} height={y(medMar) - padT} fill="rgba(217,179,0,.09)"/>
        <rect x={padL} y={y(medMar)} width={x(medRev) - padL} height={padT + cH - y(medMar)} fill="rgba(232,0,29,.06)"/>
        <rect x={x(medRev)} y={y(medMar)} width={W - padR - x(medRev)} height={padT + cH - y(medMar)} fill="rgba(100,100,100,.05)"/>
        <line x1={x(medRev)} x2={x(medRev)} y1={padT} y2={padT + cH} stroke="var(--border-strong)" strokeDasharray="4,3"/>
        <line x1={padL} x2={W - padR} y1={y(medMar)} y2={y(medMar)} stroke="var(--border-strong)" strokeDasharray="4,3"/>
        <text x={padL + 6} y={padT + 13} fontSize={10.5} fontWeight={700} fill="#1A8A4A">Oportunidad alta</text>
        <text x={W - padR - 6} y={padT + 13} fontSize={10.5} fontWeight={700} fill="#B8930A" textAnchor="end">Competido</text>
        <text x={padL + 6} y={padT + cH - 6} fontSize={10.5} fontWeight={700} fill="#E8001D">Poco atractivo</text>
        <text x={W - padR - 6} y={padT + cH - 6} fontSize={10.5} fontWeight={700} fill="var(--text-subtle)" textAnchor="end">Saturado</text>
        {[0, 0.25, 0.5, 0.75, 1].map(f => <text key={f} x={padL - 8} y={y(maxMar * f) + 4} fontSize={9} textAnchor="end" fill="var(--text-subtle)">{Math.round(maxMar * f)}%</text>)}
        {[0, 0.5, 1].map(f => <text key={f} x={x(maxRev * f)} y={H - 8} fontSize={9} textAnchor="middle" fill="var(--text-subtle)">{(maxRev * f).toLocaleString('es-ES', { maximumFractionDigits: 1 })} M€</text>)}
        {points.map((p, i) => (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer' }}>
            <circle cx={x(p.revenue)} cy={y(p.margen)} r={p.self ? 7 : 5.5} fill={ZONE_COLORS[p.zona]} stroke={p.self ? '#0C0C0E' : 'var(--surface)'} strokeWidth={p.self ? 2 : 1.5}/>
          </g>
        ))}
        {hover != null && (() => {
          const p = points[hover];
          const px = x(p.revenue), py = y(p.margen);
          const left = px > W - 150;
          return (
            <g>
              <rect x={left ? px - 148 : px + 10} y={py - 30} width={140} height={40} rx={7} fill="var(--text)" opacity={0.95}/>
              <text x={left ? px - 138 : px + 20} y={py - 15} fontSize={10.5} fontWeight={700} fill="var(--bg)">{p.name}</text>
              <text x={left ? px - 138 : px + 20} y={py - 2} fontSize={9.5} fill="var(--bg)">{p.revenue}M€ · {p.margen}% · {ZONE_LABELS[p.zona]}</text>
            </g>
          );
        })()}
      </svg>
    </CECard>
  );
}

function CmpMapaLegend() {
  const rows = [
    ['alta', 'Margen alto + escala baja. Espacio para crecer sin gran competencia.'],
    ['competido', 'Margen alto + escala alta. Atractivo pero más disputado.'],
    ['pocoAtractivo', 'Margen bajo + escala baja. Baja atractividad relativa.'],
    ['saturado', 'Escala alta + margen bajo. Mercado maduro con poco margen de mejora.'],
  ];
  return (
    <CECard>
      <Eyebrow>Cómo leer las zonas</Eyebrow>
      <p style={{ fontSize: 12, color: 'var(--text-subtle)', margin: '2px 0 14px', lineHeight: 1.5 }}>Las líneas discontinuas dividen el plano por la mediana de Revenue y Margen EBITDA del mercado. Cada cuadrante indica un perfil competitivo distinto.</p>
      {rows.map(([k, d]) => (
        <div key={k} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: ZONE_COLORS[k], flexShrink: 0, marginTop: 2 }}></span>
          <div><div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>{ZONE_LABELS[k]}</div><div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>{d}</div></div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 11.5, color: 'var(--text-subtle)', paddingTop: 6, borderTop: '1px solid var(--border)' }}>
        <span style={{ flexShrink: 0 }}>ⓘ</span> Pasa el cursor sobre cada punto para ver por qué esa compañía cae en su zona.
      </div>
    </CECard>
  );
}

/* Brechas de posicionamiento */
function CmpBrechas({ items }) {
  const badgeColor = b => b === 'Alta' ? { c: '#1A8A4A', bd: '#1A8A4A' } : b === 'Media' ? { c: '#D97708', bd: '#D97708' } : { c: 'var(--text-subtle)', bd: 'var(--border-strong)' };
  return (
    <CECard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <Eyebrow style={{ margin: 0 }}>Brechas de posicionamiento</Eyebrow>
        <span title="Percentil de la empresa en cada dimensión frente al universo de comparación. La etiqueta indica el potencial de mejora." style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--border-strong)', fontSize: 9, fontWeight: 700, color: 'var(--text-subtle)', cursor: 'help' }}>i</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-subtle)', margin: '2px 0 16px' }}>Áreas donde puedes mejorar y ganar ventaja competitiva.</p>
      {items.map((it, i) => {
        const bc = badgeColor(it.badge);
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <span style={{ width: 150, fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>{it.l}</span>
            <div style={{ flex: 1, height: 9, background: 'var(--surface-2)', borderRadius: 5, overflow: 'hidden' }}><div style={{ height: '100%', width: it.p + '%', background: it.p >= 80 ? '#1A8A4A' : it.p >= 60 ? '#D9B300' : '#E8001D', borderRadius: 5 }}></div></div>
            <span style={{ width: 34, fontSize: 12.5, fontWeight: 700, ...CMP_MONO, color: 'var(--text)', textAlign: 'right', flexShrink: 0 }}>P{it.p}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: bc.c, border: `1px solid ${bc.bd}`, padding: '3px 10px', borderRadius: 6, flexShrink: 0 }}>{it.badge}</span>
          </div>
        );
      })}
    </CECard>
  );
}

/* Matriz de diferencias vs esta empresa */
function CmpMatriz({ rows }) {
  const cellColor = { up: { c: '#1A8A4A', bg: 'rgba(26,138,74,.08)' }, down: { c: '#E8001D', bg: 'rgba(232,0,29,.06)' }, similar: { c: 'var(--text-subtle)', bg: 'var(--surface-2)' } };
  const cols = ['revenue', 'ebitda', 'margen', 'revEmp', 'qs'];
  const heads = ['Revenue', 'EBITDA', 'Margen', 'Rev/Emp', 'Quality Score'];
  return (
    <CECard pad={0}>
      <div style={{ padding: '16px 20px 10px' }}>
        <Eyebrow style={{ margin: 0 }}>Matriz de diferencias vs tu empresa</Eyebrow>
        <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11.5, color: 'var(--text-muted)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(26,138,74,.25)' }}></span> Mejor que tú</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(232,0,29,.2)' }}></span> Por debajo</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--surface-2)', border: '1px solid var(--border)' }}></span> Similar</span>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 }}>
          <thead><tr>
            <th style={{ textAlign: 'left', padding: '9px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle)', background: 'var(--surface-2)' }}>Empresa</th>
            {heads.map(h => <th key={h} style={{ textAlign: 'right', padding: '9px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle)', background: 'var(--surface-2)' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ padding: '11px 20px', borderTop: '1px solid var(--border)', fontWeight: 700, color: 'var(--text)' }}>{r.name}</td>
                {cols.map(c => { const cell = r[c]; const cc = cellColor[cell.k]; return (
                  <td key={c} style={{ padding: '11px 20px', textAlign: 'right', borderTop: '1px solid var(--border)', background: cc.bg, fontWeight: 700, color: cc.c, ...CMP_MONO }}>{cell.v}</td>
                ); })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CECard>
  );
}

/* 5 — Gaps competitivos: visual, no tabla */function CmpGaps({ gaps }) {
  const M = { ventaja: { dot: '🟢', c: '#1A8A4A', bg: '#E8F5EE', bd: '#C2E8D0', l: 'Ventaja' }, desventaja: { dot: '🔴', c: '#E8001D', bg: 'rgba(232,0,29,.05)', bd: 'rgba(232,0,29,.2)', l: 'Desventaja' }, similar: { dot: '🟡', c: '#D97708', bg: '#FEF3E2', bd: '#F5DDB0', l: 'Similar' } };
  return (
    <CECard>
      <Eyebrow>Gaps competitivos</Eyebrow>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {gaps.map((g, i) => {
          const m = M[g.estado];
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: m.bg, border: `1px solid ${m.bd}`, borderRadius: 10, padding: '11px 14px' }}>
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{m.dot}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{g.l} <span style={{ fontSize: 10.5, fontWeight: 700, color: m.c }}>· {m.l}</span></div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{g.detalle}</div>
              </div>
            </div>
          );
        })}
      </div>
    </CECard>
  );
}

/* 6 — Oportunidades: en términos de valor, no de carencia */
function CmpOportunidades({ items }) {
  return (
    <CECard style={{ background: 'linear-gradient(135deg,#0C0C0E,#1A1A18)', border: 'none', position: 'relative', overflow: 'hidden' }}>
      <span style={{ position: 'absolute', right: -16, top: -28, fontSize: 140, color: 'rgba(232,0,29,.07)', fontWeight: 800, lineHeight: 1, pointerEvents: 'none' }}>✦</span>
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: '#E8001D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 800 }}>✦</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Oportunidades</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((o, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '13px 15px' }}>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.75)', lineHeight: 1.5, marginBottom: 6 }}>{o.texto}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: o.tipo === 'positivo' ? '#3EBE7E' : '#fff', ...CMP_MONO }}>{o.impacto}</div>
            </div>
          ))}
        </div>
      </div>
    </CECard>
  );
}

/* 7 — Conclusiones del Copilot */
function CmpConclusiones({ c, go }) {
  return (
    <CECard>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <Eyebrow style={{ margin: 0 }}>Conclusiones · Arroba Copilot</Eyebrow>
        <AskAdvisor q="¿Qué debería hacer esta empresa a partir de esta comparativa?" label="Preguntar qué hacer"/>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ fontSize: 12, fontWeight: 700, color: '#1A8A4A', flexShrink: 0, width: 190 }}>Lo que mejor hace</span><span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{c.mejor}</span></div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ fontSize: 12, fontWeight: 700, color: '#D97708', flexShrink: 0, width: 190 }}>Lo que más preocuparía a un comprador</span><span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{c.preocupa}</span></div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ fontSize: 12, fontWeight: 700, color: '#E8001D', flexShrink: 0, width: 190 }}>Dónde existe mayor potencial</span><span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{c.potencial}</span></div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0, width: 190 }}>Empresas de las que aprender</span><span style={{ fontSize: 13, color: 'var(--text)' }}>{c.aprender.join(', ')}</span></div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0, width: 190 }}>Compañías que podrían adquirirse</span><span style={{ fontSize: 13, color: 'var(--text)' }}>{c.adquirir.join(', ')}</span></div>
      </div>
      <button onClick={() => go && go('oportunidades')} style={{ marginTop: 16, padding: '10px 16px', borderRadius: 9, border: 'none', background: '#E8001D', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Activar oportunidad</button>
    </CECard>
  );
}

function SecComparativa({ C, E, go }) {
  const d = window.CE_DATA.comparativa;
  const [grupo, setGrupo] = React.useState(d.grupos.find(g => g.active).id);
  const [editing, setEditing] = React.useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <CETitle sub="¿Con quién te comparo? ¿Dónde estás? ¿En qué eres mejor o peor? ¿Qué oportunidades tienes? ¿Qué deberías hacer?">Comparativa</CETitle>
      <CmpUniverso grupos={d.grupos} sel={grupo} setSel={setGrupo} comparables={d.comparables} editing={editing} setEditing={setEditing}/>
      <CmpResumen data={d}/>
      <CmpPosicionamiento E={E} comparables={d.comparables}/>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <CmpHiddenGems items={d.hiddenGems} total={d.hiddenGemsTotal}/>
        <CmpTargets items={d.targets} total={d.targetsTotal}/>
        <CmpWhiteSpace items={d.whiteSpace}/>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, alignItems: 'start' }}>
        <CmpMapa points={d.scatter}/>
        <CmpMapaLegend/>
      </div>
      <CmpBrechas items={d.brechas}/>
      <CmpMatriz rows={d.matrizDiferencias}/>
      <CmpFinanciera rows={d.financiera}/>
      <CmpGaps gaps={d.gaps}/>
      <CmpOportunidades items={d.oportunidadesValor}/>
      <CmpConclusiones c={d.conclusiones} go={go}/>
    </div>
  );
}

Object.assign(window, { SecComparativa });
