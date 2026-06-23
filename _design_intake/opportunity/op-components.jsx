// arroba.com — Oportunidad: icons, activation, section components

/* ── Icon set ──────────────────────────────────────────────── */
window.OP_ICONS = {
  summary:   '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  agency:    '<path d="M4 21h16M6 21V9l6-5 6 5v12"/><rect x="9" y="14" width="2.5" height="7"/><rect x="12.5" y="14" width="2.5" height="7"/>',
  team:      '<path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.74"/>',
  euro:      '<path d="M18 6.5a7 7 0 100 11"/><line x1="4" y1="9.5" x2="14" y2="9.5"/><line x1="4" y1="14.5" x2="14" y2="14.5"/>',
  signal:    '<polyline points="3,17 8,12 12,14.5 17,9 21,11"/><circle cx="17" cy="9" r="1.6"/>',
  plan:      '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>',
  activity:  '<polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>',
  deal:      '<circle cx="8" cy="12" r="5"/><circle cx="16" cy="12" r="5"/>',
  trending:  '<polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/>',
  document:  '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/>',
  layers:    '<polygon points="12,2 2,7 12,12 22,7"/><polyline points="2,17 12,22 22,17"/><polyline points="2,12 12,17 22,12"/>',
  location:  '<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>',
  back:      '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/>',
  bookmark:  '<path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>',
  bookmarkFill: '<path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" fill="currentColor"/>',
  check:     '<polyline points="20,6 9,17 4,12"/>',
  bell:      '<path d="M6 10a6 6 0 0112 0v5l2 2H4l2-2v-5z"/><path d="M10 20a2 2 0 004 0"/>',
  share:     '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/>',
};

function OPIcon({ name, size = 18, color = 'currentColor', sw = 1.75 }) {
  const p = window.OP_ICONS[name];
  if (!p) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: p }}/>
  );
}

/* ── Shared bits ───────────────────────────────────────────── */
function Eyebrow({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 14 }}>{children}</div>;
}
function Card({ children, style, pad = 22 }) {
  return <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: pad, ...style }}>{children}</div>;
}
function ScoreChip({ v, label }) {
  const c = v >= 80 ? '#E8001D' : v >= 65 ? 'var(--text)' : 'var(--text-muted)';
  return (
    <div style={{ textAlign: 'center', minWidth: 46 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: c, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{v}</div>
      <div style={{ fontSize: 9, color: 'var(--text-subtle)', marginTop: 3 }}>{label}</div>
    </div>
  );
}
function FitBadge({ fit }) {
  return (
    <div style={{ textAlign: 'right', minWidth: 52 }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: fit >= 85 ? '#E8001D' : 'var(--text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{fit}%</div>
      <div style={{ fontSize: 9, color: 'var(--text-subtle)', marginTop: 2 }}>encaje</div>
    </div>
  );
}

const SIGNAL_C = {
  positive: { dot: '#1A8A4A', bg: '#E8F5EE', bd: '#C2E8D0', tx: '#1A6A38' },
  neutral:  { dot: '#ADADAA', bg: 'var(--surface-2)', bd: 'var(--border)', tx: 'var(--text-muted)' },
  warning:  { dot: '#D97708', bg: '#FEF3E2', bd: '#FCD9A3', tx: '#92540A' },
};

Object.assign(window, { OPIcon, Eyebrow, Card, ScoreChip, FitBadge, SIGNAL_C });
