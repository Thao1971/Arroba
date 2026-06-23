// arroba.com — Ficha sectorial · pestaña Gráficos

/* Gráfico de barras + línea de tendencia (una métrica, 6 ejercicios) */
function MetricChart({ title, sub, data, years, unit, color = '#E8001D', pct }) {
  const W = 320, H = 170, padL = 34, padR = 10, padT = 16, padB = 24;
  const cW = W - padL - padR, cH = H - padT - padB;
  const max = Math.max(...data) * 1.15, min = 0;
  const n = data.length;
  const bw = (cW / n) * 0.52;
  const xFor = i => padL + (i + 0.5) * (cW / n);
  const yFor = v => padT + cH - ((v - min) / (max - min)) * cH;
  const last = data[n - 1], first = data[0];
  const change = first ? Math.round(((last - first) / first) * 100) : 0;
  const fmt = v => pct ? v.toLocaleString('es-ES', { maximumFractionDigits: 1 }) + '%' : v.toLocaleString('es-ES', { maximumFractionDigits: 1 });
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 2 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{title}</h3>
        <span style={{ fontSize: 11, fontWeight: 700, color: change >= 0 ? '#1A8A4A' : '#E8001D', background: change >= 0 ? 'rgba(26,138,74,.1)' : 'rgba(232,0,29,.08)', padding: '2px 8px', borderRadius: 5 }}>{change >= 0 ? '+' : ''}{change}%</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 8 }}>{sub}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em' }}>{fmt(last)}</span>
        <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{unit} · {years[n - 1]}</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
        {[0.5, 1].map(t => (
          <line key={t} x1={padL} x2={W - padR} y1={yFor(max * t)} y2={yFor(max * t)} stroke="var(--border)" strokeWidth={1} strokeDasharray="3,4"/>
        ))}
        {data.map((v, i) => {
          const x = xFor(i) - bw / 2;
          const isLast = i === n - 1;
          return (
            <g key={i}>
              <rect x={x} y={yFor(v)} width={bw} height={yFor(0) - yFor(v)} rx={3} fill={isLast ? color : 'var(--border-strong)'} opacity={isLast ? 1 : 0.5}/>
              <text x={xFor(i)} y={H - 8} fontSize={8.5} textAnchor="middle" fill="var(--text-subtle)">{years[i].slice(2)}</text>
            </g>
          );
        })}
        <path d={data.map((v, i) => `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(1)},${yFor(v).toFixed(1)}`).join(' ')} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.9}/>
        {data.map((v, i) => <circle key={i} cx={xFor(i)} cy={yFor(v)} r={2.2} fill="var(--surface)" stroke={color} strokeWidth={1.5}/>)}
      </svg>
    </div>
  );
}

/* Histograma de distribución con toggle Agregado/Mediana + marcadores */
function DistChart({ title, buckets, aggregated, median, n, unit = '%', color = '#E8001D' }) {
  const [mode, setMode] = React.useState('agregado');
  const W = 540, H = 250, padL = 38, padR = 16, padT = 26, padB = 34;
  const cW = W - padL - padR, cH = H - padT - padB;
  const maxC = Math.max(...buckets.map(b => b.count)) * 1.08;
  const nB = buckets.length;
  const slot = cW / nB;
  const bw = slot * 0.62;
  const yMax = Math.ceil(maxC / 60) * 60;
  const yFor = c => padT + cH - (c / yMax) * cH;
  // posición x del marcador según valor (sobre el eje de buckets)
  const markerX = (val) => {
    // localizar el bucket que contiene val y posicionar proporcional
    for (let i = 0; i < nB; i++) {
      if (val <= buckets[i].max) {
        const lo = i === 0 ? buckets[i].max - (buckets[1] ? buckets[1].max - buckets[0].max : buckets[i].max) : buckets[i - 1].max;
        const frac = Math.max(0, Math.min(1, (val - lo) / (buckets[i].max - lo || 1)));
        return padL + i * slot + frac * slot;
      }
    }
    return padL + cW;
  };
  const aggX = markerX(aggregated.val), medX = markerX(median.val);
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{title}</h3>
          <SecTooltip content={{ title, desc: 'Distribución de las empresas del sector por tramo. La línea discontinua marca el valor agregado (suma del mercado) y la línea sólida la mediana (compañía típica).', method: 'Cuentas anuales · Registro Mercantil' }} position="right"/>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'inline-flex', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 2 }}>
            {[['agregado', 'Agregado'], ['mediana', 'Mediana']].map(([id, l]) => (
              <button key={id} onClick={() => setMode(id)} style={{ padding: '5px 11px', borderRadius: 6, border: 'none', background: mode === id ? 'var(--surface)' : 'transparent', color: mode === id ? 'var(--text)' : 'var(--text-subtle)', fontSize: 11.5, fontWeight: mode === id ? 700 : 500, cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: mode === id ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>{l}</button>
            ))}
          </div>
          <button title="Descargar" style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 11l5 4 5-4M5 21h14"/></svg>
          </button>
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
        {[0, 0.25, 0.5, 0.75, 1].map(t => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={padT + cH - t * cH} y2={padT + cH - t * cH} stroke="var(--border)" strokeWidth={1} strokeDasharray="3,4"/>
            <text x={padL - 7} y={padT + cH - t * cH + 4} fontSize={9} textAnchor="end" fill="var(--text-subtle)">{Math.round(yMax * t)}</text>
          </g>
        ))}
        {buckets.map((b, i) => {
          const x = padL + i * slot + (slot - bw) / 2;
          return (
            <g key={b.label}>
              <rect x={x} y={yFor(b.count)} width={bw} height={yFor(0) - yFor(b.count)} rx={2} fill={color}/>
              <text x={padL + i * slot + slot / 2} y={H - 8} fontSize={8.5} textAnchor="middle" fill="var(--text-subtle)">{b.label}</text>
            </g>
          );
        })}
        {/* marcador agregado (discontinuo) */}
        <line x1={aggX} x2={aggX} y1={padT - 4} y2={padT + cH} stroke="#0C0C0E" strokeWidth={1.5} strokeDasharray="4,3"/>
        <text x={aggX} y={padT - 8} fontSize={9.5} textAnchor="middle" fill="var(--text)" fontWeight={700}>Agregado: {aggregated.label}</text>
        {/* marcador mediana (sólido) */}
        <line x1={medX} x2={medX} y1={padT - 4} y2={padT + cH} stroke="#9A9A93" strokeWidth={1.5}/>
        <text x={medX} y={padT - 20} fontSize={9.5} textAnchor="middle" fill="var(--text-muted)" fontWeight={700}>Mediana: {median.label}</text>
      </svg>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginTop: 10, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-muted)' }}><span style={{ width: 16, height: 0, borderTop: '2px dashed #0C0C0E' }}></span>Agregado: <strong style={{ color: 'var(--text)' }}>{aggregated.label}</strong></span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-muted)' }}><span style={{ width: 16, height: 2, background: '#9A9A93' }}></span>Mediana: <strong style={{ color: 'var(--text)' }}>{median.label}</strong> <span style={{ color: 'var(--text-subtle)' }}>(N={n})</span></span>
      </div>
      <div style={{ textAlign: 'center', fontSize: 10.5, color: 'var(--text-subtle)', marginTop: 4 }}>Mediana = compañía típica · Agregado = SUM/SUM del mercado</div>
    </div>
  );
}

/* Scatter denso Revenue vs EBITDA (muchas empresas, pérdidas en rojo) + zoom */
function ScatterChart() {
  const [zoom, setZoom] = React.useState(1);
  const W = 1100, H = 440, padL = 56, padR = 24, padT = 20, padB = 44;
  const cW = W - padL - padR, cH = H - padT - padB;
  // generación determinista de empresas (revenue M€, ebitda M€)
  const pts = React.useMemo(() => {
    let s = 7; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const arr = [];
    for (let i = 0; i < 260; i++) {
      const rev = Math.pow(rnd(), 2.6) * 800;          // sesgo a revenues pequeños
      const margin = 0.06 + rnd() * 0.22 - (rnd() < 0.12 ? 0.22 : 0); // algunos en pérdidas
      const ebitda = rev * margin + (rnd() - 0.5) * 1.2;
      arr.push({ rev, ebitda, loss: ebitda < 0 });
    }
    return arr;
  }, []);
  const maxX = 800 / zoom, minY = -5.5, maxY = 16.5;
  const xFor = v => padL + Math.min(1, v / maxX) * cW;
  const yFor = v => padT + cH - ((v - minY) / (maxY - minY)) * cH;
  const yTicks = [-5.5, 0, 5, 11, 16.5];
  const xTicks = [0, 200, 400, 600, 800].filter(t => t <= maxX + 1);
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Revenue vs EBITDA</h3>
          <SecTooltip content={{ title: 'Revenue vs EBITDA', desc: 'Cada punto es una empresa del sector, posicionada por su facturación (eje X) y su EBITDA (eje Y). Los puntos rojos son empresas con EBITDA negativo (en pérdidas).', method: 'Cuentas anuales · Registro Mercantil' }} position="right"/>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', padding: '5px 10px', border: '1px solid var(--border-strong)', borderRadius: 7 }}>{zoom}x</span>
          <button onClick={() => setZoom(z => Math.min(8, z * 2))} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 7, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4M11 8v6M8 11h6"/></svg> Zoom in
          </button>
          <button onClick={() => setZoom(z => Math.max(1, z / 2))} disabled={zoom <= 1} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 7, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: zoom <= 1 ? 'var(--text-subtle)' : 'var(--text)', fontSize: 12, fontWeight: 600, cursor: zoom <= 1 ? 'default' : 'pointer', fontFamily: 'var(--font-body)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4M8 11h6"/></svg> Zoom out
          </button>
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
        {yTicks.map(t => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={yFor(t)} y2={yFor(t)} stroke="var(--border)" strokeWidth={1} strokeDasharray={t === 0 ? '0' : '3,5'} opacity={t === 0 ? 0.5 : 1}/>
            <text x={padL - 8} y={yFor(t) + 4} fontSize={10} textAnchor="end" fill="var(--text-subtle)">{t.toFixed(1)}M</text>
          </g>
        ))}
        {xTicks.map(t => (
          <g key={t}>
            <line x1={xFor(t)} x2={xFor(t)} y1={padT} y2={padT + cH} stroke="var(--border)" strokeWidth={1} strokeDasharray="3,5"/>
            <text x={xFor(t)} y={H - 16} fontSize={10} textAnchor="middle" fill="var(--text-subtle)">{t}M</text>
          </g>
        ))}
        {pts.map((p, i) => p.rev <= maxX + 20 && (
          <circle key={i} cx={xFor(p.rev)} cy={yFor(Math.max(minY, Math.min(maxY, p.ebitda)))} r={4} fill={p.loss ? '#E8001D' : '#E0B500'} opacity={p.loss ? 0.85 : 0.7}/>
        ))}
        <text x={padL + cW / 2} y={H - 1} fontSize={11} textAnchor="middle" fill="var(--text-muted)">Revenue (M)</text>
        <text x={16} y={padT + cH / 2} fontSize={11} textAnchor="middle" fill="var(--text-muted)" transform={`rotate(-90 16 ${padT + cH / 2})`}>EBITDA (M)</text>
      </svg>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginTop: 8 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-muted)' }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#E0B500' }}></span>EBITDA positivo</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-muted)' }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#E8001D' }}></span>En pérdidas</span>
      </div>
    </div>
  );
}

function GraficosTab() {
  const dists = window.SECTOR_DATA.distributions;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'rgba(232,0,29,.04)', border: '1px solid rgba(232,0,29,.16)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <SecIcon name="chartBar" size={18} color="#E8001D"/>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}><strong style={{ color: 'var(--text)', fontWeight: 600 }}>Magnitudes del sector.</strong> Distribución de las empresas en cada magnitud. La línea discontinua marca el valor agregado del mercado y la sólida la mediana (compañía típica).</span>
      </div>

      {/* todas las magnitudes como histogramas de distribución */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }} className="sec-graf-2col">
        {dists.map(d => (
          <DistChart key={d.key} title={d.title} buckets={d.buckets} aggregated={d.aggregated} median={d.median} n={d.n} unit={d.unit} color={d.color}/>
        ))}
      </div>

      {/* scatter denso */}
      <ScatterChart/>
    </div>
  );
}

Object.assign(window, { GraficosTab, DistChart, ScatterChart });
