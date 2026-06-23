// arroba.com — Home charts & visual components

/* ── Icon set (from Arroba design system) ─────────────────── */
window.HOME_ICONS = {
  search:    '<circle cx="11" cy="11" r="7.5"/><line x1="16.5" y1="16.5" x2="21.5" y2="21.5"/>',
  agency:    '<path d="M4 21h16M6 21V9l6-5 6 5v12"/><rect x="9" y="14" width="2.5" height="7"/><rect x="12.5" y="14" width="2.5" height="7"/><rect x="9.5" y="9" width="1.5" height="1.5"/><rect x="13" y="9" width="1.5" height="1.5"/>',
  trending:  '<polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/>',
  close:     '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
  euro:      '<path d="M18 6.5a7 7 0 100 11"/><line x1="4" y1="9.5" x2="14" y2="9.5"/><line x1="4" y1="14.5" x2="14" y2="14.5"/>',
  warning:   '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  chartBar:  '<line x1="2" y1="20" x2="22" y2="20"/><rect x="4" y="12" width="4" height="8"/><rect x="10" y="7" width="4" height="13"/><rect x="16" y="4" width="4" height="16"/>',
  chartLine: '<polyline points="3,17 8,12 12,14.5 17,9 21,11"/><line x1="2" y1="20" x2="22" y2="20"/>',
  team:      '<path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.74"/>',
  verified:  '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9,12 11,14 15,10"/>',
  deal:      '<circle cx="8" cy="12" r="5"/><circle cx="16" cy="12" r="5"/>',
  target:    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  layers:    '<polygon points="12,2 2,7 12,12 22,7"/><polyline points="2,17 12,22 22,17"/><polyline points="2,12 12,17 22,12"/>',
  tag:       '<path d="M3 7v5l9 9 7-7-9-9H5a2 2 0 00-2 2z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
  handshake: '<path d="M11 17l2 2a1.5 1.5 0 002.2-2L13 15"/><path d="M14 13.5l2.5 2.5a1.5 1.5 0 002.2-2L14 9.5l1.5-1.5a2 2 0 012.8 0L21 10.5"/><path d="M3 10.5L5.7 8a2 2 0 012.8 0L12 11.5"/><path d="M3 10.5l3 3"/>',
  arrowRight:'<line x1="4" y1="12" x2="20" y2="12"/><polyline points="14,6 20,12 14,18"/>',
  document:  '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/>',
  health:    '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="14"/><line x1="9" y1="11" x2="15" y2="11"/>',
  user:      '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
};

function HIcon({ name, size = 16, color = 'currentColor', sw = 1.75 }) {
  const paths = window.HOME_ICONS[name];
  if (!paths) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline-block', flexShrink: 0 }}
      dangerouslySetInnerHTML={{ __html: paths }}/>
  );
}

/* ── Sparkline ─────────────────────────────────────────────── */
function Sparkline({ data, color = '#E8001D', w = 80, h = 28, fill = false }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / range) * (h - 4) - 2;
    return [x, y];
  });
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gid = 'spark' + Math.random().toString(36).slice(2, 8);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
      {fill && (
        <>
          <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient></defs>
          <path d={area} fill={`url(#${gid})`}/>
        </>
      )}
      <path d={line} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r={2.5} fill={color}/>
    </svg>
  );
}

/* ── Evolution multi-line chart ────────────────────────────── */
function EvolutionChart({ data }) {
  const W = 560, H = 230, padL = 36, padR = 16, padT = 16, padB = 30;
  const cW = W - padL - padR, cH = H - padT - padB;
  const all = [...data.activas, ...data.nuevas, ...data.cerradas];
  const max = Math.max(...all) * 1.1, min = 0;
  const n = data.months.length;
  const xFor = i => padL + (i / (n - 1)) * cW;
  const yFor = v => padT + cH - ((v - min) / (max - min)) * cH;
  const series = [
    { key: 'activas',  label: 'Empresas activas',  color: '#E8001D' },
    { key: 'nuevas',   label: 'Nuevas empresas',   color: '#0C0C0E' },
    { key: 'cerradas', label: 'Empresas cerradas', color: '#ADADAA' },
  ];
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
      {[0, 10, 20, 30].map(v => (
        <g key={v}>
          <line x1={padL} x2={W-padR} y1={yFor(v)} y2={yFor(v)} stroke="var(--border)" strokeWidth={1} strokeDasharray="3,4"/>
          <text x={padL-8} y={yFor(v)+4} fontSize={10} textAnchor="end" fill="var(--text-subtle)">{v}k</text>
        </g>
      ))}
      {data.months.map((m, i) => (
        <text key={m} x={xFor(i)} y={H-10} fontSize={10} textAnchor="middle" fill="var(--text-subtle)">{m}</text>
      ))}
      {series.map(s => {
        const d = data[s.key].map((v, i) => `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(1)},${yFor(v).toFixed(1)}`).join(' ');
        return (
          <g key={s.key}>
            <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
            {data[s.key].map((v, i) => (
              <circle key={i} cx={xFor(i)} cy={yFor(v)} r={2.5} fill="var(--surface)" stroke={s.color} strokeWidth={1.5}/>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

/* ── Spain map (stylized provinces heat) ───────────────────── */
function SpainMap({ provinces }) {
  // Stylized province blobs approximating Spain
  const blobs = [
    { id: 'galicia',   d: 'M30,70 Q20,60 28,52 Q40,50 46,60 Q44,74 34,76 Z', heat: 0.45 },
    { id: 'asturias',  d: 'M50,52 Q62,48 76,52 Q74,60 60,60 Q52,58 50,52 Z', heat: 0.38 },
    { id: 'paisvasco', d: 'M80,52 Q92,48 100,54 Q98,62 86,62 Q80,58 80,52 Z', heat: 0.62 },
    { id: 'castillaln',d: 'M40,62 Q70,58 88,64 Q90,84 64,90 Q44,86 38,72 Z', heat: 0.30 },
    { id: 'cataluna',  d: 'M100,58 Q118,54 126,66 Q122,82 108,80 Q98,72 100,58 Z', heat: 0.88 },
    { id: 'madrid',    d: 'M64,90 Q78,86 86,94 Q82,104 70,102 Q62,98 64,90 Z', heat: 1.0 },
    { id: 'aragon',    d: 'M90,66 Q104,64 108,80 Q104,96 92,94 Q86,82 90,66 Z', heat: 0.5 },
    { id: 'valencia',  d: 'M108,82 Q120,80 122,96 Q116,110 104,106 Q102,92 108,82 Z', heat: 0.78 },
    { id: 'extremadura',d: 'M44,90 Q62,88 66,104 Q60,120 46,116 Q40,102 44,90 Z', heat: 0.34 },
    { id: 'castillalm',d: 'M68,100 Q92,96 100,108 Q96,124 74,124 Q64,114 68,100 Z', heat: 0.42 },
    { id: 'andalucia', d: 'M46,118 Q82,112 100,122 Q96,140 64,144 Q44,138 42,126 Z', heat: 0.7 },
    { id: 'murcia',    d: 'M100,110 Q112,108 114,120 Q108,130 98,126 Q96,116 100,110 Z', heat: 0.66 },
  ];
  const [hover, setHover] = React.useState(null);
  const heatColor = h => {
    // interpolate warm-neutral -> red
    const r = Math.round(232 * h + 232 * (1 - h) * 0 + (1 - h) * 232);
    return `rgba(232,0,29,${0.12 + h * 0.78})`;
  };
  return (
    <svg width="100%" viewBox="0 10 150 145" style={{ display: 'block' }}>
      {blobs.map(b => (
        <path key={b.id} d={b.d} fill={heatColor(b.heat)}
          stroke="var(--surface)" strokeWidth={1.5}
          style={{ cursor: 'pointer', transition: 'opacity .15s', opacity: hover && hover !== b.id ? 0.45 : 1 }}
          onMouseEnter={() => setHover(b.id)} onMouseLeave={() => setHover(null)}/>
      ))}
    </svg>
  );
}

/* ── Network graph ─────────────────────────────────────────── */
function NetworkGraph({ network }) {
  const { nodes, edges } = network;
  const find = id => nodes.find(n => n.id === id);
  const typeColor = { group: '#E8001D', company: '#0C0C0E', person: '#ADADAA' };
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      {edges.map(([a, b], i) => {
        const na = find(a), nb = find(b);
        return <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} stroke="var(--border-strong)" strokeWidth={0.5} opacity={0.6}/>;
      })}
      {nodes.map(n => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r={n.r/2.2} fill={typeColor[n.type]}
            opacity={n.type === 'company' ? 0.85 : 1}
            style={{ animation: n.type === 'group' ? 'pulse 3s ease-in-out infinite' : 'none' }}/>
          {n.type === 'group' && (
            <circle cx={n.x} cy={n.y} r={n.r/2.2 + 2} fill="none" stroke="#E8001D" strokeWidth={0.4} opacity={0.4}/>
          )}
        </g>
      ))}
    </svg>
  );
}

/* ── Animated counter ──────────────────────────────────────── */
function useCountUp(target, duration = 1400) {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    let start = null, raf;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(eased * target));
      if (p < 1) raf = requestAnimationFrame(step);
      else setVal(target);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return val;
}

Object.assign(window, { HIcon, Sparkline, EvolutionChart, SpainMap, NetworkGraph, useCountUp });
