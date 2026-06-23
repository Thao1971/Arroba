// Arroba DS — Foundations Tab
// Sections: Colors · Typography · Spacing · Elevation

function SectionHeader({ title, desc }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', marginBottom: 6 }}>{title}</h2>
      {desc && <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 560 }}>{desc}</p>}
    </div>
  );
}

function SubHead({ title }) {
  return (
    <h3 style={{
      fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
      color: 'var(--text-subtle)', marginBottom: 14, marginTop: 36,
      fontFamily: 'var(--font-body)',
    }}>{title}</h3>
  );
}

function Swatch({ hex, label, step, small }) {
  const [copied, setCopied] = React.useState(false);
  const isDark = hex === '#0C0C0E' || hex === '#1A1A18' || hex === '#2E2E2C' || hex === '#4A4A47' || hex === '#0A0A08';
  const copy = () => {
    navigator.clipboard?.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div onClick={copy} title={`Copy ${hex}`} style={{
      cursor: 'pointer',
      borderRadius: 8,
      overflow: 'hidden',
      border: '1px solid var(--border)',
      transition: 'transform .15s, box-shadow .15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{
        height: small ? 48 : 72,
        background: hex,
        display: 'flex', alignItems: 'flex-end', padding: '6px 8px',
      }}>
        {copied && (
          <span style={{ fontSize: 10, fontWeight: 600, color: isDark ? '#fff' : '#0C0C0E', opacity: .9 }}>Copied!</span>
        )}
      </div>
      <div style={{ background: 'var(--surface)', padding: '8px 10px' }}>
        {step && <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{step}</div>}
        {label && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>}
        <div style={{ fontSize: 10, color: 'var(--text-subtle)', fontFamily: 'monospace' }}>{hex}</div>
      </div>
    </div>
  );
}

function ColorsSection() {
  const T = window.ARROBA;
  const [activePalette, setActivePalette] = React.useState(0);
  const palette = T.colors.palettes[activePalette];

  return (
    <div>
      <SectionHeader
        title="Colors"
        desc="Sistema de color basado en el rojo de marca. Alta legibilidad y contraste WCAG AA en todos los pares funcionales."
      />

      {/* Palette selector */}
      <SubHead title="Paletas de color" />
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {T.colors.palettes.map((p, i) => (
          <div key={p.id} onClick={() => setActivePalette(i)} style={{
            cursor: 'pointer', borderRadius: 10, border: `2px solid ${activePalette === i ? 'var(--primary)' : 'var(--border)'}`,
            overflow: 'hidden', width: 200, transition: 'border-color .15s',
          }}>
            <div style={{ background: p.bg, padding: '16px', display: 'flex', gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 6, background: p.surface, border: '1px solid rgba(0,0,0,.08)' }}></div>
              <div style={{ width: 36, height: 36, borderRadius: 6, background: p.accent }}></div>
              <div style={{ width: 36, height: 36, borderRadius: 6, background: p.text }}></div>
            </div>
            <div style={{ background: 'var(--surface)', padding: '10px 14px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Palette preview */}
      <div style={{
        borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 40,
        background: palette.bg,
      }}>
        <div style={{ padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: palette.text, marginBottom: 6 }}>
              Del dato a la decisión. Del análisis al deal.
            </div>
            <div style={{ fontSize: 14, color: palette.text, opacity: .6 }}>
              Plataforma de inteligencia económica y decisión empresarial
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{
              padding: '10px 20px', borderRadius: 8, background: palette.accent,
              color: '#fff', fontSize: 14, fontWeight: 600,
            }}>Analizar empresa</div>
            <div style={{
              padding: '10px 20px', borderRadius: 8, border: `1.5px solid ${palette.text}`,
              color: palette.text, fontSize: 14, fontWeight: 600, opacity: .85,
            }}>Ver oportunidades</div>
          </div>
        </div>
      </div>

      {/* Brand */}
      <SubHead title="Brand" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12, marginBottom: 8 }}>
        <Swatch hex={T.colors.brand.red}      step="Brand Red"   label="Primary CTA" />
        <Swatch hex={T.colors.brand.redLight} step="Red Light"   label="Hover state" />
        <Swatch hex={T.colors.brand.redDark}  step="Red Dark"    label="Active state" />
        <Swatch hex={T.colors.brand.black}    step="Brand Black" label="Text, UI" />
        <Swatch hex={T.colors.brand.white}    step="White"       label="Background" />
      </div>

      {/* Neutral */}
      <SubHead title="Neutral Scale" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10, marginBottom: 8 }}>
        {T.colors.neutral.map(n => (
          <Swatch key={n.step} hex={n.hex} step={n.step} label={n.label} small />
        ))}
      </div>

      {/* Semantic */}
      <SubHead title="Semantic" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {T.colors.semantic.map(s => (
          <div key={s.key} style={{ borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', height: 56 }}>
              <div style={{ flex: 1, background: s.base }}></div>
              <div style={{ flex: 1, background: s.light }}></div>
            </div>
            <div style={{ background: 'var(--surface)', padding: '8px 10px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{s.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text-subtle)', fontFamily: 'monospace', marginTop: 2 }}>
                {s.base} / {s.light}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypographySection({ fontPairIdx, setFontPairIdx }) {
  const T = window.ARROBA;
  const pair = T.typography.pairs[fontPairIdx];

  React.useEffect(() => {
    document.documentElement.style.setProperty('--font-display', pair.display);
    document.documentElement.style.setProperty('--font-body', pair.body);
  }, [fontPairIdx]);

  return (
    <div>
      <SectionHeader
        title="Typography"
        desc="Space Grotesk es la familia adoptada en todo el producto (display + cuerpo), con figuras tabulares para datos. Las otras son exploraciones archivadas."
      />

      {/* Font pair selector */}
      <SubHead title="Pares tipográficos" />
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        {T.typography.pairs.map((p, i) => (
          <div key={p.id} onClick={() => setFontPairIdx(i)} style={{
            cursor: 'pointer', borderRadius: 10, padding: '16px 20px', width: 200,
            border: `2px solid ${fontPairIdx === i ? 'var(--primary)' : 'var(--border)'}`,
            background: 'var(--surface)', transition: 'border-color .15s',
          }}>
            <div style={{ fontFamily: p.display, fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Aa</div>
            <div style={{ fontFamily: p.body, fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Arroba Platform</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{p.desc}</div>
          </div>
        ))}
      </div>

      {/* Active specimen */}
      <div style={{
        borderRadius: 12, border: '1px solid var(--border)', padding: '32px',
        background: 'var(--surface)', marginBottom: 32,
      }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Display: {pair.name.split(' ')[0]}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>·</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {pair.display.split("'")[1] || pair.display.split(',')[0]}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>+</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {pair.body.split("'")[1] || pair.body.split(',')[0]}
          </span>
        </div>
        <div style={{ fontFamily: pair.display, fontSize: 48, fontWeight: 700, lineHeight: 1.1, color: 'var(--text)', marginBottom: 16 }}>
          Del dato a la decisión
        </div>
        <div style={{ fontFamily: pair.body, fontSize: 18, fontWeight: 400, lineHeight: 1.6, color: 'var(--text-muted)', marginBottom: 24, maxWidth: 520 }}>
          Arroba convierte la información del tejido empresarial español en decisiones de inversión y operaciones de compraventa. Casi 5.000 métricas económicas, verificadas y conectadas.
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span style={{ fontFamily: pair.body, fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>Explorar →</span>
          <span style={{ fontFamily: pair.body, fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>Ver oportunidades</span>
        </div>
      </div>

      {/* Type scale */}
      <SubHead title="Escala tipográfica" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        {T.typography.scale.map((step, i) => (
          <div key={step.name} style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px',
            borderBottom: i < T.typography.scale.length - 1 ? '1px solid var(--border)' : 'none',
            background: 'var(--surface)',
          }}>
            <div style={{ width: 80, fontSize: 11, color: 'var(--text-subtle)', fontFamily: 'monospace', flexShrink: 0 }}>
              <div>{step.size}</div>
              <div>{step.weight}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: ['Display','H1','H2','H3','H4','H5'].includes(step.name) ? pair.display : pair.body,
                fontSize: Math.min(parseInt(step.size), 36) + 'px',
                fontWeight: step.weight,
                lineHeight: step.lh,
                color: 'var(--text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {step.name === 'Caption' ? 'CAPTION LABEL · ALL CAPS' : 'Inteligencia económica'}
              </div>
            </div>
            <div style={{ width: 90, fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>
              {step.name}
            </div>
            <div style={{ width: 140, fontSize: 11, color: 'var(--text-subtle)', textAlign: 'right', flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
              {step.usage}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpacingSection() {
  const T = window.ARROBA;
  return (
    <div>
      <SectionHeader
        title="Spacing"
        desc="Base de 4px. Escala multiplicativa que crea ritmo visual consistente en toda la plataforma."
      />

      <SubHead title="Escala de espaciado" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        {T.spacing.map((s, i) => (
          <div key={s.name} style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: '10px 20px',
            borderBottom: i < T.spacing.length - 1 ? '1px solid var(--border)' : 'none',
            background: 'var(--surface)',
          }}>
            <div style={{ width: 80, fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)', flexShrink: 0 }}>
              <div style={{ color: 'var(--text)', fontWeight: 600 }}>{s.px}px</div>
              <div style={{ fontSize: 10 }}>--{s.name}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 16, display: 'flex', alignItems: 'center' }}>
                <div style={{
                  height: 12, width: s.px + 'px', background: 'var(--primary)',
                  borderRadius: 2, maxWidth: '100%',
                  opacity: 0.75 + (i * 0.02),
                }}></div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', width: 180, textAlign: 'right', flexShrink: 0 }}>
              {s.usage}
            </div>
          </div>
        ))}
      </div>

      <SubHead title="Border radius" />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {T.radius.map(r => (
          <div key={r.name} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px', width: 140 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <div style={{
                width: 56, height: 56, background: 'var(--surface-2)',
                border: '1.5px solid var(--border-strong)',
                borderRadius: r.value,
              }}></div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', textAlign: 'center' }}>{r.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-subtle)', textAlign: 'center', marginTop: 2, fontFamily: 'monospace' }}>--{r.name}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>{r.usage}</div>
          </div>
        ))}
      </div>

      <SubHead title="Elevación / Shadows" />
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {T.shadows.map(sh => (
          <div key={sh.name} style={{
            background: 'var(--surface)', borderRadius: 12,
            padding: '24px 20px', width: 160, textAlign: 'center',
            boxShadow: sh.value,
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4, fontFamily: 'monospace' }}>--{sh.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sh.usage}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Export all
Object.assign(window, { ColorsSection, TypographySection, SpacingSection });
