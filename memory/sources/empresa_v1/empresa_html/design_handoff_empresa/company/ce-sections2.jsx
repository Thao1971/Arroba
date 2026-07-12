// Arroba — Company Entity: section components (batch 2)

const STAKE_COLORS = ['#E8001D', '#0C0C0E', '#ADADAA', '#E8E8E2'];
const SIG_C = {
  positive: { dot: '#1A8A4A', bg: '#E8F5EE', bd: '#C2E8D0', tx: '#1A6A38' },
  neutral:  { dot: '#ADADAA', bg: 'var(--surface-2)', bd: 'var(--border)', tx: 'var(--text-muted)' },
  warning:  { dot: '#D97708', bg: '#FEF3E2', bd: '#FCD9A3', tx: '#92540A' },
};

/* Radar metric tooltip — definition, formula, source, percentile */
function RadarTip({ dim }) {
  const [open, setOpen] = React.useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <span style={{ width: 13, height: 13, borderRadius: '50%', border: '1px solid var(--border-strong)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, fontStyle: 'italic', color: 'var(--text-subtle)', cursor: 'help' }}>i</span>
      {open && (
        <span style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', width: 230, background: '#0C0C0E', color: '#F4F4F0', borderRadius: 10, padding: '12px 14px', boxShadow: '0 8px 32px rgba(0,0,0,.35)', border: '1px solid rgba(255,255,255,.1)', zIndex: 9999, textAlign: 'left' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{dim.l}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#E8001D' }}>{dim.p}</span>
          </span>
          <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,.7)', lineHeight: 1.5, marginBottom: 8 }}>{dim.def}</span>
          {dim.formula && <span style={{ display: 'block', fontSize: 10.5, color: '#fff', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 6, padding: '5px 8px', marginBottom: 8, fontFamily: 'var(--font-display)' }}>{dim.formula}</span>}
          <span style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,.45)', borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 7 }}>Fuente: {dim.src}</span>
        </span>
      )}
    </span>
  );
}

/* Competitive radar — pentagon, empresa vs sector median */
function CompetitiveRadar() {
  const dims = [
    { e: 0.86, s: 0.58 }, { e: 0.64, s: 0.54 }, { e: 0.91, s: 0.60 }, { e: 0.72, s: 0.61 }, { e: 0.89, s: 0.57 },
  ];
  const cx = 90, cy = 90, R = 72, n = dims.length;
  const pt = (i, r) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(a) * R * r, cy + Math.sin(a) * R * r];
  };
  const poly = arr => arr.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z';
  const ePath = poly(dims.map((d, i) => pt(i, d.e)));
  const sPath = poly(dims.map((d, i) => pt(i, d.s)));
  return (
    <svg width={180} height={180} viewBox="0 0 180 180" style={{ flexShrink: 0 }}>
      {[0.25, 0.5, 0.75, 1].map(r => (
        <polygon key={r} points={dims.map((_, i) => pt(i, r).join(',')).join(' ')} fill="none" stroke="var(--border)" strokeWidth={1}/>
      ))}
      {dims.map((_, i) => { const p = pt(i, 1); return <line key={i} x1={cx} y1={cy} x2={p[0]} y2={p[1]} stroke="var(--border)" strokeWidth={1}/>; })}
      <path d={sPath} fill="rgba(74,74,71,.18)" stroke="var(--border-strong)" strokeWidth={1.5}/>
      <path d={ePath} fill="rgba(232,0,29,.14)" stroke="#E8001D" strokeWidth={2}/>
      {dims.map((d, i) => { const p = pt(i, d.e); return <circle key={i} cx={p[0]} cy={p[1]} r={3} fill="#E8001D"/>; })}
    </svg>
  );
}

/* ══ PROPIEDAD ══ */
const OWN_COLORS = ['#E8001D', '#0C0C0E', '#4A4A47', '#7A7A75', '#A5A5A0', '#C9C9C2', '#E2E2DB'];

function OwnerNode({ name, sub, pct, color, kind, highlight }) {
  const linkable = kind !== 'persona';
  const Tag = linkable ? 'a' : 'div';
  const extraProps = linkable ? { href: 'Empresa.html', title: 'Ver ficha de ' + name } : {};
  const [hover, setHover] = React.useState(false);
  return (
    <Tag {...extraProps} onMouseEnter={() => linkable && setHover(true)} onMouseLeave={() => linkable && setHover(false)}
      style={{ position: 'relative', display: 'block', background: 'var(--surface)', border: `1.5px solid ${hover ? '#E8001D' : highlight ? '#E8001D' : 'var(--border)'}`, borderRadius: 11, padding: '12px 14px', minWidth: 0, textDecoration: 'none', color: 'inherit', cursor: linkable ? 'pointer' : 'default', boxShadow: hover ? '0 0 0 1px rgba(232,0,29,.15)' : 'none', transition: 'border-color .12s, box-shadow .12s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 9, height: 9, borderRadius: kind === 'persona' ? '50%' : 2, background: color, flexShrink: 0 }}></span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{name}</span>
        {linkable && <CPIcon name="link" size={11} color={hover ? '#E8001D' : 'var(--text-subtle)'} sw={2}/>}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ fontSize: 10.5, color: 'var(--text-subtle)', lineHeight: 1.3 }}>{sub}</span>
        {pct != null && <span style={{ fontSize: 16, fontWeight: 800, color: highlight ? '#E8001D' : 'var(--text)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-display)', flexShrink: 0 }}>{pct}</span>}
      </div>
    </Tag>
  );
}

function Stem({ h = 22 }) {
  return <div style={{ display: 'flex', justifyContent: 'center' }}><div style={{ width: 2, height: h, background: 'var(--border-strong)' }}></div></div>;
}

function SecPropiedad({ C, E, go }) {
  const sh = C.ownership.shareholders;
  const pa = C.ownership.participadas;
  const fmtPct = n => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <CETitle sub="Estructura accionarial y empresas participadas. La sociedad opera como holding del grupo Castilla Termal.">Propiedad</CETitle>

      <CECard pad={24}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
          <Eyebrow>Estructura societaria</Eyebrow>
          <AskAdvisor q="¿Qué significa que tenga varias participadas?" label="Preguntar sobre la estructura"/>
        </div>
        {/* ── TIER 1 · Accionistas ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>Accionistas</span>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-subtle)', background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '1px 7px', borderRadius: 10 }}>{sh.length}</span>
          <span style={{ fontSize: 10.5, color: 'var(--text-subtle)' }}>· participan en</span>
        </div>
        {/* proportional ownership bar */}
        <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 14 }}>
          {sh.map((s, i) => <div key={i} style={{ width: `${s.stake}%`, background: OWN_COLORS[i] }} title={`${s.name} · ${fmtPct(s.stake)}`}></div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {sh.map((s, i) => (
            <OwnerNode key={i} name={s.name} sub={s.role} pct={fmtPct(s.stake)} color={OWN_COLORS[i]} kind={s.kind} highlight={i === 0}/>
          ))}
        </div>

        <Stem h={26}/>

        {/* ── CENTER · Entidad ── */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'linear-gradient(135deg,#0C0C0E,#1A1A18)', borderRadius: 14, padding: '16px 24px', minWidth: 340 }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: 'rgba(232,0,29,.12)', border: '1px solid rgba(232,0,29,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#E8001D', fontFamily: 'var(--font-display)', flexShrink: 0 }}>CT</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>{C.company.legal}</div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.6)' }}>Holding · CIF {C.company.cif} · {C.company.location.city} ({C.company.location.province})</div>
            </div>
          </div>
        </div>

        <Stem h={26}/>

        {/* ── TIER 2 · Participadas ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 10.5, color: 'var(--text-subtle)' }}>controla a ·</span>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>Empresas participadas</span>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-subtle)', background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '1px 7px', borderRadius: 10 }}>{pa.length}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {pa.map((p, i) => {
            const control = p.stake >= 50;
            return (
              <a key={i} href="Empresa.html" style={{ display: 'block', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 11, padding: '12px 14px', textDecoration: 'none', color: 'inherit', transition: 'border-color .12s, box-shadow .12s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#E8001D'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(232,0,29,.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CPIcon name="layers" size={14} color="#E8001D"/></div>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, flex: 1 }}>{p.name}</span>
                  <CPIcon name="link" size={12} color="var(--text-subtle)" sw={2}/>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <span style={{ fontSize: 10.5, color: 'var(--text-subtle)' }}>{p.activity}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: control ? '#E8001D' : '#D97708', background: control ? 'rgba(232,0,29,.08)' : '#FEF3E2', padding: '2px 8px', borderRadius: 5, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{fmtPct(p.stake)}</span>
                </div>
              </a>
            );
          })}
        </div>
        <Implies text="Holding con 7 participadas y control mayoritario en todas: una plataforma ya consolidada, idónea para seguir integrando activos termales." cta="Explorar oportunidad" onAction={() => go && go('oportunidades')} />
      </CECard>
    </div>
  );
}

/* ══ GOBIERNO ══ */
function GovPerson({ name, role, kind }) {
  const isEntity = kind === 'entidad';
  const initials = name.split(' ').filter(w => w.length > 2).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const linkedinUrl = 'https://www.linkedin.com/search/results/all/?keywords=' + encodeURIComponent(name);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ width: 36, height: 36, borderRadius: isEntity ? 9 : '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {isEntity ? <CPIcon name="team" size={16} color="#E8001D"/> : <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{initials}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{name}</div>
        {role && <div style={{ fontSize: 11.5, color: 'var(--text-subtle)' }}>{role}</div>}
      </div>
      {!isEntity && (
        <a href={linkedinUrl} target="_blank" rel="noreferrer" title={'Buscar a ' + name + ' en LinkedIn'} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-subtle)', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#0A66C2'; e.currentTarget.style.color = '#0A66C2'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-subtle)'; }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>
        </a>
      )}
    </div>
  );
}

function SecGobierno({ C, E }) {
  const g = C.ownership;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <CETitle sub="Consejo de administración, dirección ejecutiva, apoderados y auditor. Fuente: órganos sociales del Registro Mercantil.">Gobierno</CETitle>

      {/* CONSEJO */}
      <CECard>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <Eyebrow>Consejo de administración</Eyebrow>
          <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Secretario (no consejero): <strong style={{ color: 'var(--text-muted)' }}>{g.consejo.secretario}</strong></span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px' }}>
          {g.consejo.miembros.map((m, i) => <GovPerson key={i} name={m.name} role={m.role} kind={m.kind}/>)}
        </div>
      </CECard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* DIRECCIÓN */}
        <CECard>
          <Eyebrow>Dirección</Eyebrow>
          {g.direccion.map((d, i) => <GovPerson key={i} name={d.name} role={d.role} kind="persona"/>)}
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 11.5, color: 'var(--text-subtle)', lineHeight: 1.5 }}>
            Estructura de dirección adicional: No disponible en la fuente oficial.
          </div>
        </CECard>

        {/* APODERADOS */}
        <CECard>
          <Eyebrow>Apoderados</Eyebrow>
          {g.apoderados.map((a, i) => <GovPerson key={i} name={a.name} role="Apoderado/a" kind="persona"/>)}
        </CECard>
      </div>

      {/* AUDITOR */}
      <CECard pad={18} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: '#E8F5EE', border: '1px solid #C2E8D0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CPIcon name="verified" size={22} color="#1A8A4A"/></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 3 }}>Auditor</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{g.auditor.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{g.auditor.desc} · Ejercicio {g.auditor.since}</div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: '#1A8A4A', background: '#E8F5EE', border: '1px solid #C2E8D0', padding: '5px 11px', borderRadius: 6 }}>Cuentas auditadas</span>
      </CECard>
    </div>
  );
}

/* ══ RANKING ══ */
function RankCard({ title, big, sub, pct, def, color, top10 }) {
  const [open, setOpen] = React.useState(false);
  return (
    <CECard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <Eyebrow style={{ margin: 0 }}>{title}</Eyebrow>
        <span title={def} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--border-strong)', fontSize: 9, fontWeight: 700, color: 'var(--text-subtle)', cursor: 'help' }}>i</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
        <svg width={64} height={64} viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
          <circle cx="32" cy="32" r="26" fill="none" stroke="var(--border)" strokeWidth="6"/>
          <circle cx="32" cy="32" r="26" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={(2 * Math.PI * 26).toFixed(1)} strokeDashoffset={(2 * Math.PI * 26 * (1 - pct / 100)).toFixed(1)}
            transform="rotate(-90 32 32)"/>
        </svg>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{big}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginTop: 6, lineHeight: 1.4 }}>{sub}</div>
        </div>
      </div>
      {top10 && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <button onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', border: 'none', background: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)' }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#E8001D' }}>{open ? 'Ocultar' : 'Ver'} top 10</span>
            <span style={{ fontSize: 10, color: '#E8001D', marginLeft: 'auto' }}>{open ? '▲' : '▼'}</span>
          </button>
          {open && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {top10.map((t, i) => (
                <a key={i} href="Empresa.html" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 7, background: t.self ? 'rgba(232,0,29,.06)' : 'transparent', textDecoration: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => { if (!t.self) e.currentTarget.style.background = 'var(--surface-2)'; }}
                  onMouseLeave={e => { if (!t.self) e.currentTarget.style.background = 'transparent'; }}>
                  <span style={{ width: 16, fontSize: 11, fontWeight: 700, color: t.self ? '#E8001D' : 'var(--text-subtle)', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 12.5, fontWeight: t.self ? 700 : 500, color: t.self ? '#E8001D' : 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}{t.self && ' (tú)'}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: t.self ? '#E8001D' : 'var(--text-muted)', fontFamily: 'var(--font-mono, ui-monospace, monospace)', flexShrink: 0 }}>{t.v}</span>
                  <CPIcon name="link" size={11} color={t.self ? '#E8001D' : 'var(--text-subtle)'} sw={2}/>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </CECard>
  );
}

function SecRanking({ E, go }) {
  const r = E.ranking;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <CETitle sub="Posición de la compañía frente a su mercado, sector, localidad y nivel de innovación.">Rankings</CETitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        <RankCard title="Mercado" color="#E8001D" pct={r.mercado.pct} def={r.mercado.def} big={`#${r.mercado.pos} de ${r.mercado.total}`} sub={r.mercado.label} top10={r.mercado.top10}/>
        <RankCard title="Sector" color="#2164E3" pct={r.sector.pct} def={r.sector.def} big={`P${r.sector.pct}`} sub={r.sector.label + ` · ${r.sector.total.toLocaleString('es-ES')} comparables`} top10={r.sector.top10}/>
        <RankCard title="Localidad" color="#1A8A4A" pct={r.localidad.pct} def={r.localidad.def} big={`#${r.localidad.pos} de ${r.localidad.total}`} sub={r.localidad.label} top10={r.localidad.top10}/>
        <RankCard title="Nivel de innovación" color="#D97708" pct={r.innovacion.pct} def={r.innovacion.def} big={r.innovacion.label} sub={r.innovacion.detail} top10={r.innovacion.top10}/>
      </div>
      <Implies text="Es la compañía líder de su localidad y se sitúa en el cuartil superior del sector por rentabilidad, aunque a una escala menor que los líderes nacionales del segmento." cta="Ver comparativa completa" onAction={() => go && go('comparativa')} />
    </div>
  );
}

/* ══ MERCADO ══ */
function SecMercado({ C, E }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <CETitle sub="Posición competitiva frente al sector hotelero termal, con scores y percentiles.">Mercado</CETitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[['Sector (CNAE 5510)', C.company.sector, 'rec'], ['Subsector', C.company.subsector, 'rec'], ['Posición sectorial', 'P88 · cuartil superior', 'inf']].map(([l, v, k]) => (
          <CECard key={l} pad={18}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{l}</div>
              <Prov kind={k}/>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{v}</div>
          </CECard>
        ))}
      </div>

      {/* Radar + minigráficos empresa vs sector */}
      <CECard>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <Eyebrow>Radar competitivo · empresa vs. mediana del sector</Eyebrow>
          <AskAdvisor q="¿Cómo se compara con su sector?" label="Preguntar sobre el mercado"/>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
          <CompetitiveRadar/>
          <div style={{ flex: 1, minWidth: 320 }}>
            {E.radar.map(r => (
              <div key={r.l} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderTop: '1px solid var(--border)' }}>
                <span style={{ width: 150, fontSize: 12.5, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {r.l}
                  <RadarTip dim={r}/>
                </span>
                {/* minigráfico: barra empresa + marca mediana sector */}
                <div style={{ flex: 1, height: 9, background: 'var(--surface-2)', borderRadius: 5, position: 'relative' }}>
                  <div style={{ position: 'absolute', height: '100%', width: `${r.e}%`, background: '#E8001D', borderRadius: 5 }}></div>
                  <div style={{ position: 'absolute', left: `${r.s}%`, top: -3, width: 2, height: 15, background: 'var(--text)', borderRadius: 1 }} title={`Mediana sector: ${r.s}`}></div>
                </div>
                <span style={{ width: 120, display: 'inline-flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 11.5, color: 'var(--text-subtle)', fontVariantNumeric: 'tabular-nums' }}>Sec {r.s}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>Emp {r.e}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#1A8A4A', background: '#E8F5EE', padding: '1px 5px', borderRadius: 3, border: '1px solid #C2E8D0' }}>{r.p}</span>
                </span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: 'var(--text-subtle)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 5, borderRadius: 2, background: '#E8001D' }}></span> Empresa</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 2, height: 11, background: 'var(--text)' }}></span> Mediana del sector</span>
            </div>
          </div>
        </div>
        <Implies text="La compañía supera la mediana sectorial en las cinco dimensiones y destaca en margen EBITDA (P92) y salud financiera (P90)." />
      </CECard>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        <CPIcon name="chartBar" size={16} color="var(--text-subtle)" sw={2}/>
        Comparables financieros nominales por subsector: <strong style={{ color: 'var(--text)' }}>No disponibles</strong> todavía. Se activarán al conectar la base de empresas del segmento termal.
      </div>
    </div>
  );
}

/* ══ TRANSACCIONES ══ */
function SecTransacciones({ E }) {
  const t = E.transacciones;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <CETitle sub="Distingue lo que ha hecho la empresa de lo que está ocurriendo en su mercado.">Transacciones</CETitle>

      {/* BLOQUE 1 — actividad propia */}
      <div>
        <Eyebrow>Actividad corporativa propia</Eyebrow>
        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: -8, marginBottom: 14 }}>Operaciones realizadas por la compañía</div>
        {t.propias.map((o, i) => (
          <CECard key={i} pad={16} style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CPIcon name="deal" size={18} color="#E8001D"/></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{o.type} · {o.date}</div><div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{o.detail}</div></div>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{o.amount}</span>
          </CECard>
        ))}
      </div>

      {/* BLOQUE 2 — mercado transaccional */}
      <div>
        <Eyebrow>Mercado transaccional</Eyebrow>
        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: -8, marginBottom: 14 }}>Lo que está ocurriendo en el sector, no en la empresa</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 14 }}>
          {[['Múltiplo medio sector', t.multiples.evEbitda + ' EV/EBITDA'], ['Rango observado', t.multiples.mercado], ['Actividad compradora', t.activity]].map(([l, v]) => (
            <CECard key={l} pad={18}><div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>{l}</div><div style={{ fontSize: l === 'Múltiplo medio sector' ? 16 : 18, fontWeight: 800, color: l === 'Actividad compradora' ? '#E8001D' : 'var(--text)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>{v}</div></CECard>
          ))}
        </div>
        <CECard pad={0}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>Operaciones comparables del sector</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: 'var(--surface-2)' }}>{['Compañía', 'Comprador', 'Fecha', 'Múltiplo', 'Valor'].map((h, i) => <th key={h} style={{ padding: '10px 16px', textAlign: i > 2 ? 'right' : 'left', fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>{h}</th>)}</tr></thead>
            <tbody>
              {t.sector.map((o, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '11px 16px', fontWeight: 600, color: 'var(--text)' }}>{o.target}</td>
                  <td style={{ padding: '11px 16px', color: 'var(--text-muted)' }}>{o.buyer}</td>
                  <td style={{ padding: '11px 16px', color: 'var(--text-subtle)' }}>{o.date}</td>
                  <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{o.multiple}</td>
                  <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 700, color: '#E8001D', fontVariantNumeric: 'tabular-nums' }}>{o.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CECard>
        <Implies text="Actividad compradora elevada en el sector: existen compradores compatibles activos para una operación." />
      </div>
    </div>
  );
}

Object.assign(window, { SecPropiedad, SecGobierno, SecMercado, SecRanking, SecTransacciones, SIG_C });
