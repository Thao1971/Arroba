// arroba.com — Mapa empresarial charts & visuals

window.MAPA_ICONS = {
  team:      '<path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.74"/>',
  trending:  '<polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/>',
  chartBar:  '<line x1="2" y1="20" x2="22" y2="20"/><rect x="4" y="12" width="4" height="8"/><rect x="10" y="7" width="4" height="13"/><rect x="16" y="4" width="4" height="16"/>',
  location:  '<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>',
  flag:      '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
  search:    '<circle cx="11" cy="11" r="7.5"/><line x1="16.5" y1="16.5" x2="21.5" y2="21.5"/>',
  euro:      '<path d="M18 6.5a7 7 0 100 11"/><line x1="4" y1="9.5" x2="14" y2="9.5"/><line x1="4" y1="14.5" x2="14" y2="14.5"/>',
  deal:      '<circle cx="8" cy="12" r="5"/><circle cx="16" cy="12" r="5"/>',
  layers:    '<polygon points="12,2 2,7 12,12 22,7"/><polyline points="2,17 12,22 22,17"/><polyline points="2,12 12,17 22,12"/>',
  cpu:       '<rect x="6" y="6" width="12" height="12" rx="2"/><line x1="9" y1="2" x2="9" y2="6"/><line x1="15" y1="2" x2="15" y2="6"/><line x1="9" y1="18" x2="9" y2="22"/><line x1="15" y1="18" x2="15" y2="22"/><line x1="2" y1="9" x2="6" y2="9"/><line x1="2" y1="15" x2="6" y2="15"/><line x1="18" y1="9" x2="22" y2="9"/><line x1="18" y1="15" x2="22" y2="15"/>',
  shield:    '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  health:    '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="14"/><line x1="9" y1="11" x2="15" y2="11"/>',
  cloud:     '<path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/>',
  info:      '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="11"/><line x1="12" y1="7.5" x2="12.01" y2="7.5"/>',
  share:     '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
  calendar:  '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  refresh:   '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>',
  plus:      '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  minus:     '<line x1="5" y1="12" x2="19" y2="12"/>',
  expand:    '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>',
  arrowRight:'<line x1="4" y1="12" x2="20" y2="12"/><polyline points="14,6 20,12 14,18"/>',
  close:     '<line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/>',
};

function MIcon({ name, size = 16, color = 'currentColor', sw = 1.75 }) {
  const paths = window.MAPA_ICONS[name];
  if (!paths) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline-block', flexShrink: 0 }}
      dangerouslySetInnerHTML={{ __html: paths }}/>
  );
}

/* ── Heat color helper ─────────────────────────────────────── */
function heatColor(score) {
  // 60 → light warm, 100 → deep red
  const t = Math.max(0, Math.min(1, (score - 55) / 45));
  return `rgba(232,0,29,${(0.14 + t * 0.82).toFixed(3)})`;
}

/* ── Spain Map (stylized regions, hover + click) ──────────── */
const SPAIN_REGIONS = [
  { id: 'galicia',     name: 'Galicia',          score: 70, d: 'M40,58 Q26,52 30,40 Q44,36 54,46 Q52,62 40,64 Z' },
  { id: 'asturias',    name: 'Asturias',         score: 64, d: 'M58,44 Q72,40 86,44 Q84,54 66,54 Q58,50 58,44 Z' },
  { id: 'cantabria',   name: 'Cantabria',        score: 66, d: 'M88,44 Q98,41 106,46 Q104,54 90,53 Z' },
  { id: 'paisvasco',   name: 'País Vasco',       score: 78, d: 'M108,46 Q120,42 128,50 Q124,60 112,58 Q106,52 108,46 Z' },
  { id: 'navarra',     name: 'Navarra',          score: 72, d: 'M130,52 Q140,50 144,62 Q138,72 128,68 Q126,58 130,52 Z' },
  { id: 'aragon',      name: 'Aragón',           score: 74, d: 'M132,70 Q148,68 152,90 Q148,114 134,110 Q126,90 132,70 Z' },
  { id: 'cataluna',    name: 'Cataluña',         score: 90, d: 'M154,64 Q176,60 184,80 Q180,102 162,98 Q150,84 154,64 Z' },
  { id: 'castillaln',  name: 'Castilla y León',  score: 68, d: 'M56,58 Q104,52 126,72 Q124,104 80,108 Q52,96 50,72 Z' },
  { id: 'madrid',      name: 'Madrid',           score: 93, d: 'M92,108 Q110,104 118,116 Q112,130 96,128 Q86,118 92,108 Z' },
  { id: 'rioja',       name: 'La Rioja',         score: 69, d: 'M116,62 Q126,60 128,70 Q120,74 114,70 Z' },
  { id: 'extremadura', name: 'Extremadura',      score: 63, d: 'M52,110 Q78,106 84,128 Q78,152 56,148 Q46,128 52,110 Z' },
  { id: 'castillalm',  name: 'Castilla-La Mancha', score: 71, d: 'M88,116 Q128,110 140,128 Q134,154 96,156 Q82,138 88,116 Z' },
  { id: 'valencia',    name: 'C. Valenciana',    score: 84, d: 'M142,96 Q160,94 162,124 Q154,148 138,142 Q134,116 142,96 Z' },
  { id: 'murcia',      name: 'Murcia',           score: 76, d: 'M132,144 Q148,142 150,160 Q142,172 128,166 Q126,152 132,144 Z' },
  { id: 'andalucia',   name: 'Andalucía',        score: 81, d: 'M56,150 Q108,142 130,158 Q126,184 80,190 Q50,176 48,160 Z' },
];

function SpainMapDetailed({ selected, onSelect, onHover, hovered }) {
  return (
    <svg width="100%" viewBox="20 30 180 170" style={{ display: 'block', overflow: 'visible' }}>
      {SPAIN_REGIONS.map(r => {
        const isSel = selected === r.id;
        const isHov = hovered === r.id;
        const dim = (hovered && !isHov) || (selected && !isSel && !isHov);
        return (
          <path key={r.id} d={r.d}
            fill={heatColor(r.score)}
            stroke={isSel ? '#0C0C0E' : 'var(--surface)'}
            strokeWidth={isSel ? 2 : 1.4}
            style={{ cursor: 'pointer', transition: 'opacity .15s, stroke-width .12s', opacity: dim ? 0.4 : 1 }}
            onMouseEnter={() => onHover(r.id)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onSelect(r.id)}
          />
        );
      })}
      {/* Baleares dots */}
      <g>
        <circle cx="186" cy="128" r="4" fill={heatColor(73)} stroke="var(--surface)" strokeWidth={1.2}/>
        <circle cx="195" cy="124" r="3" fill={heatColor(73)} stroke="var(--surface)" strokeWidth={1.2}/>
      </g>
    </svg>
  );
}

window.SPAIN_REGIONS = SPAIN_REGIONS;

/* ── Mini sector-intensity map ─────────────────────────────── */
function SectorIntensityMap() {
  return (
    <svg width="100%" viewBox="20 30 180 170" style={{ display: 'block' }}>
      {SPAIN_REGIONS.map(r => (
        <path key={r.id} d={r.d}
          fill={r.id === 'madrid' ? 'rgba(232,0,29,.95)' : heatColor(r.score - 18)}
          stroke="var(--surface)" strokeWidth={1.2}/>
      ))}
    </svg>
  );
}

/* ── Evolution chart (3 lines) ─────────────────────────────── */
function MapaEvolution({ data }) {
  const W = 560, H = 220, padL = 38, padR = 14, padT = 16, padB = 28;
  const cW = W - padL - padR, cH = H - padT - padB;
  const all = [...data.nuevas, ...data.cerradas, ...data.saldo];
  const max = Math.max(...all) * 1.15, min = -2;
  const n = data.months.length;
  const xFor = i => padL + (i / (n - 1)) * cW;
  const yFor = v => padT + cH - ((v - min) / (max - min)) * cH;
  const series = [
    { key: 'nuevas',   color: '#E8001D' },
    { key: 'cerradas', color: '#0C0C0E' },
    { key: 'saldo',    color: '#ADADAA' },
  ];
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
      {[-10, 0, 10, 20, 30].map(v => v >= min && (
        <g key={v}>
          <line x1={padL} x2={W-padR} y1={yFor(v)} y2={yFor(v)} stroke="var(--border)" strokeWidth={1} strokeDasharray={v === 0 ? '0' : '3,4'}/>
          <text x={padL-7} y={yFor(v)+4} fontSize={9} textAnchor="end" fill="var(--text-subtle)">{v}K</text>
        </g>
      ))}
      {data.months.map((m, i) => (
        <text key={m} x={xFor(i)} y={H-8} fontSize={9} textAnchor="middle" fill="var(--text-subtle)">{m}</text>
      ))}
      {series.map(s => {
        const d = data[s.key].map((v, i) => `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(1)},${yFor(v).toFixed(1)}`).join(' ');
        return (
          <g key={s.key}>
            <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
            {data[s.key].map((v, i) => (
              <circle key={i} cx={xFor(i)} cy={yFor(v)} r={2.4} fill="var(--surface)" stroke={s.color} strokeWidth={1.5}/>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

/* ── Score bar (inline ranking) ────────────────────────────── */
function ScoreMini({ value, color = '#E8001D', w = 90 }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, width: w + 30 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', width: 22, textAlign: 'right' }}>{value}</span>
      <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 3 }}/>
      </div>
    </div>
  );
}

/* ── Sparkline ─────────────────────────────────────────────── */
function MSparkline({ data, color = '#1A8A4A', w = 64, h = 22 }) {
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const pts = data.map((d, i) => [(i / (data.length-1)) * w, h - ((d-min)/range)*(h-4) - 2]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <path d={line} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r={2.2} fill={color}/>
    </svg>
  );
}

Object.assign(window, { MIcon, heatColor, SpainMapDetailed, SectorIntensityMap, MapaEvolution, ScoreMini, MSparkline });
