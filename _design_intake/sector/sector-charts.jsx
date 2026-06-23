// arroba.com — Ficha sectorial charts & shared visuals

window.SEC_ICONS = {
  search:'<circle cx="11" cy="11" r="7.5"/><line x1="16.5" y1="16.5" x2="21.5" y2="21.5"/>',
  euro:'<path d="M18 6.5a7 7 0 100 11"/><line x1="4" y1="9.5" x2="14" y2="9.5"/><line x1="4" y1="14.5" x2="14" y2="14.5"/>',
  deal:'<circle cx="8" cy="12" r="5"/><circle cx="16" cy="12" r="5"/>',
  team:'<path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.74"/>',
  trending:'<polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/>',
  trendingDown:'<polyline points="23,18 13.5,8.5 8.5,13.5 1,6"/><polyline points="17,18 23,18 23,12"/>',
  chartBar:'<line x1="2" y1="20" x2="22" y2="20"/><rect x="4" y="12" width="4" height="8"/><rect x="10" y="7" width="4" height="13"/><rect x="16" y="4" width="4" height="16"/>',
  target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2.5"/>',
  document:'<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/>',
  location:'<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>',
  arrowRight:'<line x1="4" y1="12" x2="20" y2="12"/><polyline points="14,6 20,12 14,18"/>',
  layers:'<polygon points="12,2 2,7 12,12 22,7"/><polyline points="2,17 12,22 22,17"/><polyline points="2,12 12,17 22,12"/>',
  info:'<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="11"/><line x1="12" y1="7.5" x2="12.01" y2="7.5"/>',
  share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
  calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  bolt:'<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  building:'<path d="M4 21h16M6 21V5l6-3 6 3v16"/><line x1="10" y1="9" x2="10" y2="9.01"/><line x1="14" y1="9" x2="14" y2="9.01"/><line x1="10" y1="13" x2="10" y2="13.01"/><line x1="14" y1="13" x2="14" y2="13.01"/>',
  bookmark:'<path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>',
};
function SecIcon({ name, size = 16, color = 'currentColor', sw = 1.75 }) {
  const p = window.SEC_ICONS[name]; if (!p) return null;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: p }}/>;
}

function secHeat(score) {
  const t = Math.max(0, Math.min(1, (score - 55) / 45));
  return `rgba(232,0,29,${(0.14 + t * 0.82).toFixed(3)})`;
}

const SEC_REGIONS = [
  { id: 'galicia', name: 'Galicia', score: 64, d: 'M40,58 Q26,52 30,40 Q44,36 54,46 Q52,62 40,64 Z' },
  { id: 'asturias', name: 'Asturias', score: 60, d: 'M58,44 Q72,40 86,44 Q84,54 66,54 Q58,50 58,44 Z' },
  { id: 'cantabria', name: 'Cantabria', score: 62, d: 'M88,44 Q98,41 106,46 Q104,54 90,53 Z' },
  { id: 'paisvasco', name: 'País Vasco', score: 80, d: 'M108,46 Q120,42 128,50 Q124,60 112,58 Q106,52 108,46 Z' },
  { id: 'navarra', name: 'Navarra', score: 70, d: 'M130,52 Q140,50 144,62 Q138,72 128,68 Q126,58 130,52 Z' },
  { id: 'aragon', name: 'Aragón', score: 68, d: 'M132,70 Q148,68 152,90 Q148,114 134,110 Q126,90 132,70 Z' },
  { id: 'cataluna', name: 'Cataluña', score: 91, d: 'M154,64 Q176,60 184,80 Q180,102 162,98 Q150,84 154,64 Z' },
  { id: 'castillaln', name: 'Castilla y León', score: 63, d: 'M56,58 Q104,52 126,72 Q124,104 80,108 Q52,96 50,72 Z' },
  { id: 'madrid', name: 'Madrid', score: 96, d: 'M92,108 Q110,104 118,116 Q112,130 96,128 Q86,118 92,108 Z' },
  { id: 'rioja', name: 'La Rioja', score: 65, d: 'M116,62 Q126,60 128,70 Q120,74 114,70 Z' },
  { id: 'extremadura', name: 'Extremadura', score: 58, d: 'M52,110 Q78,106 84,128 Q78,152 56,148 Q46,128 52,110 Z' },
  { id: 'castillalm', name: 'Castilla-La Mancha', score: 66, d: 'M88,116 Q128,110 140,128 Q134,154 96,156 Q82,138 88,116 Z' },
  { id: 'valencia', name: 'C. Valenciana', score: 82, d: 'M142,96 Q160,94 162,124 Q154,148 138,142 Q134,116 142,96 Z' },
  { id: 'murcia', name: 'Murcia', score: 70, d: 'M132,144 Q148,142 150,160 Q142,172 128,166 Q126,152 132,144 Z' },
  { id: 'andalucia', name: 'Andalucía', score: 72, d: 'M56,150 Q108,142 130,158 Q126,184 80,190 Q50,176 48,160 Z' },
  { id: 'canarias', name: 'Canarias', score: 84, d: 'M44,196 Q56,192 60,200 Q54,208 44,204 Z' },
];

function SectorGeoMap({ hovered, onHover }) {
  return (
    <svg width="100%" viewBox="20 30 180 185" style={{ display: 'block', overflow: 'visible' }}>
      {SEC_REGIONS.map(r => {
        const isHov = hovered === r.id;
        const dim = hovered && !isHov;
        return (
          <path key={r.id} d={r.d} fill={secHeat(r.score)}
            stroke={isHov ? '#0C0C0E' : 'var(--surface)'} strokeWidth={isHov ? 2 : 1.3}
            style={{ cursor: 'pointer', transition: 'opacity .15s', opacity: dim ? 0.42 : 1 }}
            onMouseEnter={() => onHover(r.id)} onMouseLeave={() => onHover(null)}/>
        );
      })}
    </svg>
  );
}
window.SEC_REGIONS = SEC_REGIONS;

/* ── 4-line evolution chart ────────────────────────────────── */
function SectorEvolution({ data, series }) {
  const W = 560, H = 230, padL = 36, padR = 14, padT = 16, padB = 28;
  const cW = W - padL - padR, cH = H - padT - padB;
  const keys = series.map(s => s.key);
  const all = keys.flatMap(k => data[k]);
  const max = Math.max(...all) * 1.12, min = 0;
  const n = data.months.length;
  const xFor = i => padL + (i / (n - 1)) * cW;
  const yFor = v => padT + cH - ((v - min) / (max - min)) * cH;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
      {[0, 8, 16, 24].map(v => (
        <g key={v}>
          <line x1={padL} x2={W-padR} y1={yFor(v)} y2={yFor(v)} stroke="var(--border)" strokeWidth={1} strokeDasharray="3,4"/>
          <text x={padL-7} y={yFor(v)+4} fontSize={9} textAnchor="end" fill="var(--text-subtle)">{v}K</text>
        </g>
      ))}
      {data.months.map((m, i) => <text key={m} x={xFor(i)} y={H-8} fontSize={9} textAnchor="middle" fill="var(--text-subtle)">{m}</text>)}
      {series.map(s => {
        const d = data[s.key].map((v, i) => `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(1)},${yFor(v).toFixed(1)}`).join(' ');
        return (
          <g key={s.key}>
            <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeDasharray={s.dash || '0'} strokeLinecap="round" strokeLinejoin="round"/>
            {data[s.key].map((v, i) => <circle key={i} cx={xFor(i)} cy={yFor(v)} r={2.3} fill="var(--surface)" stroke={s.color} strokeWidth={1.5}/>)}
          </g>
        );
      })}
    </svg>
  );
}

function SecScoreMini({ value, w = 80, color = '#E8001D' }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, width: w + 28 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', width: 20, textAlign: 'right' }}>{value}</span>
      <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 3 }}/>
      </div>
    </div>
  );
}

Object.assign(window, { SecIcon, secHeat, SectorGeoMap, SectorEvolution, SecScoreMini });

/* ── Tooltip (info on hover) ───────────────────────────────── */
function SecTooltip({ content, position = 'left', size = 14 }) {
  const [visible, setVisible] = React.useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'help', verticalAlign: 'middle' }}
      onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      <span style={{ fontSize: size <= 12 ? 8 : 9, color: 'var(--text-subtle)', border: '1px solid var(--border-strong)', borderRadius: '50%', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, lineHeight: 1, flexShrink: 0 }}>?</span>
      {visible && (
        <div style={{ position: 'absolute', ...(position === 'left' ? { right: -4 } : position === 'center' ? { left: '50%', transform: 'translateX(-50%)' } : { left: -4 }), top: 'calc(100% + 8px)', zIndex: 9999, width: 250, background: '#0C0C0E', color: '#F4F4F0', borderRadius: 10, padding: '12px 14px', boxShadow: '0 8px 32px rgba(0,0,0,.35)', border: '1px solid rgba(255,255,255,.08)', pointerEvents: 'none', textAlign: 'left' }}>
          <div style={{ position: 'absolute', top: -5, ...(position === 'left' ? { right: 8 } : position === 'center' ? { left: '50%', marginLeft: -5 } : { left: 8 }), width: 10, height: 10, background: '#0C0C0E', border: '1px solid rgba(255,255,255,.08)', borderBottom: 'none', borderRight: 'none', transform: 'rotate(45deg)' }}/>
          {content.title && <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 5 }}>{content.title}</div>}
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', lineHeight: 1.55 }}>{content.desc}</div>
          {content.method && <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 7, marginTop: 7, lineHeight: 1.5 }}><span style={{ color: '#E8001D', fontWeight: 600 }}>Fuente:</span> {content.method}</div>}
        </div>
      )}
    </span>
  );
}

Object.assign(window, { SecTooltip });
