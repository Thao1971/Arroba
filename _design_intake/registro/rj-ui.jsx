// Arroba — Registration Journey · primitivas UI (conversación con Arroba Copilot ✦)

const RJ_ICONS = {
  search:  'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  send:    'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  check:   'M20 6L9 17l-5-5',
  arrow:   'M5 12h14M12 5l7 7-7 7',
  building:'M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01',
  users:   'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  trend:   'M22 7l-8.5 8.5-5-5L2 17M16 7h6v6',
  euro:    'M14 7a5 5 0 1 0 0 10M5 9h7M5 13h6',
  target:  'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  clock:   'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  layers:  'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  edit:    'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  handshake:'M11 17l2 2a2 2 0 0 0 3-3M14 14l2.5 2.5a2 2 0 0 0 3-3l-3.9-3.9a2 2 0 0 1 0-2.8L20 1M3 7l4-4 6 6M3 7l5 5M3 7v6l5 5',
  compass: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM16.2 7.8l-2.9 6.4-6.4 2.9 2.9-6.4 6.4-2.9z',
  x:       'M18 6L6 18M6 6l12 12',
  moon:    'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  sun:     'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  lock:    'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4',
  sparkles:'M12 3l1.6 4.8 4.8 1.6-4.8 1.6L12 16l-1.6-4.8L5.6 9.6l4.8-1.6zM19 14l.8 2.4 2.4.8-2.4.8L19 21l-.8-2.4-2.4-.8 2.4-.8z',
};

function Icon({ name, size = 18, color = 'currentColor', sw = 1.5, style }) {
  const d = RJ_ICONS[name] || RJ_ICONS.search;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
      {d.split('M').filter(Boolean).map((seg, i) => <path key={i} d={'M' + seg}/>)}
    </svg>
  );
}

function Spark({ size = 12, color = '#E8001D', style }) {
  return <span style={{ color, fontSize: size, fontWeight: 700, lineHeight: 1, fontFamily: 'var(--font-display)', ...style }}>✦</span>;
}

function CopilotAvatar({ size = 32 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 10, background: 'linear-gradient(135deg,#0C0C0E,#2E2E2C)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Spark size={size * 0.5} color="#E8001D"/>
    </div>
  );
}

/* Burbuja del Copilot */
function CopilotBubble({ children, fade, name = true }) {
  return (
    <div style={{ display: 'flex', gap: 13, alignItems: 'flex-start', animation: fade ? 'rjIn .4s ease both' : 'none' }}>
      <CopilotAvatar/>
      <div style={{ flex: 1, paddingTop: 2, minWidth: 0 }}>
        {name && <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#E8001D', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}>Arroba Copilot <Spark size={9}/></div>}
        <div style={{ fontSize: 16.5, color: 'var(--text)', lineHeight: 1.6, fontWeight: 400 }}>{children}</div>
      </div>
    </div>
  );
}

function UserBubble({ children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', animation: 'rjIn .3s ease both' }}>
      <div style={{ maxWidth: '82%', background: '#E8001D', color: '#fff', fontSize: 14.5, fontWeight: 500, lineHeight: 1.5, padding: '10px 16px', borderRadius: '15px 15px 5px 15px' }}>{children}</div>
    </div>
  );
}

function Typing() {
  return (
    <div style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
      <CopilotAvatar/>
      <div style={{ display: 'flex', gap: 4, padding: '11px 2px' }}>
        {[0, 1, 2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-subtle)', animation: `rjBounce 1s ${i * 0.15}s infinite ease-in-out` }}></span>)}
      </div>
    </div>
  );
}

/* Card de respuesta (no radio button) */
function AnswerCard({ title, desc, icon, onClick, selected, compact }) {
  const [h, setH] = React.useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 13, width: '100%', textAlign: 'left', padding: compact ? '14px 16px' : '16px 18px', borderRadius: 14, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all .14s',
        border: `1.5px solid ${selected ? '#E8001D' : h ? 'var(--border-strong)' : 'var(--border)'}`,
        background: selected ? 'rgba(232,0,29,.05)' : 'var(--surface)',
        boxShadow: h && !selected ? '0 6px 20px rgba(12,12,14,.07)' : 'none',
        transform: h ? 'translateY(-1px)' : 'none' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: selected ? '#E8001D' : 'var(--surface-2)', border: selected ? 'none' : '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .14s' }}>
        <Icon name={icon} size={18} color={selected ? '#fff' : 'var(--text-muted)'}/>
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', lineHeight: 1.25 }}>{title}</div>
        {desc && <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.45, marginTop: 3 }}>{desc}</div>}
      </div>
      {selected && <Icon name="check" size={17} color="#E8001D" sw={2.4} style={{ marginTop: 9 }}/>}
    </button>
  );
}

/* Chip (sub-respuestas) */
function Chip({ children, active, onClick }) {
  const [h, setH] = React.useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 500, lineHeight: 1.2, minHeight: 40, transition: 'all .13s',
        border: `1.5px solid ${active ? '#E8001D' : h ? 'var(--border-strong)' : 'var(--border)'}`,
        background: active ? 'rgba(232,0,29,.07)' : 'var(--surface)',
        color: active ? '#E8001D' : 'var(--text)' }}>
      {children}
      {active && <Icon name="check" size={14} color="#E8001D" sw={2.2}/>}
    </button>
  );
}

/* Indicador de progreso discreto (dots) */
function ProgressDots({ total, current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)' }}>Paso {Math.min(current + 1, total)} de {total}</span>
      <div style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: i <= current ? '#E8001D' : 'var(--border-strong)', transition: 'background .3s' }}></span>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { Icon, Spark, CopilotAvatar, CopilotBubble, UserBubble, Typing, AnswerCard, Chip, ProgressDots });
