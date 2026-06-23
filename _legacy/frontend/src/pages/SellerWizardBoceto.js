import React, { useState } from 'react';
import { Info, DollarSign, TrendingUp, Handshake, FileText, Search, Lock, Eye, ArrowLeft, ArrowRight, Lightbulb, ChevronRight, X } from 'lucide-react';

/* ───────────────────────────────────────────
   DESIGN SYSTEM TOKENS (from DESIGN-2.md)
   "The Digital Artifact" — Retro-Modern Professionalism
   ─────────────────────────────────────────── */
const T = {
  bg: '#f9f9f9',
  s1: '#f3f3f3',
  s2: '#e2e2e2',
  sLowest: '#ffffff',
  primary: '#B6212A',
  primaryLight: '#FF5757',
  secondary: '#006493',
  secondaryLight: '#38B6FF',
  tertiary: '#6F5D00',
  tertiaryLight: '#DBB900',
  onSurface: '#191c1e',
  onSurfaceVariant: '#45464d',
  outline: '#76777d',
  outlineVariant: '#c6c6cd',
  secondaryContainer: '#d5e0f8',
  onSecondaryContainer: '#586377',
};

const sidebarSteps = [
  { icon: Info, label: 'Datos Basicos', id: 'basics' },
  { icon: DollarSign, label: 'Financieros', id: 'financials' },
  { icon: TrendingUp, label: 'Valoracion', id: 'valuation' },
  { icon: Handshake, label: 'Acuerdo', id: 'deal' },
  { icon: FileText, label: 'Teaser & Infomemo', id: 'teaser' },
];

const topSteps = [
  { num: 1, label: 'Compania' },
  { num: 2, label: 'Metricas' },
  { num: 3, label: 'Equipo' },
];

/* ─── Reusable Components ─── */

const GhostInput = ({ label, value, placeholder, disabled, type = 'text', className = '' }) => (
  <div className={className}>
    <label style={{ fontFamily: "'IBM Plex Sans', 'Inter', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.onSurfaceVariant, display: 'block', marginBottom: 8, marginLeft: 2 }}>
      {label}
    </label>
    <input
      type={type}
      defaultValue={value}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: '100%',
        background: disabled ? T.s1 : T.s2,
        border: 'none',
        borderBottom: `2px solid ${T.outlineVariant}26`,
        borderRadius: 0,
        padding: '12px 16px',
        fontSize: 14,
        fontFamily: "'IBM Plex Sans', 'Inter', sans-serif",
        color: disabled ? T.outline : T.onSurface,
        outline: 'none',
        cursor: disabled ? 'not-allowed' : 'text',
        transition: 'border-color 0.2s',
      }}
      onFocus={(e) => { e.target.style.borderBottomColor = T.primary; }}
      onBlur={(e) => { e.target.style.borderBottomColor = `${T.outlineVariant}26`; }}
    />
  </div>
);

const GhostSelect = ({ label, options, className = '' }) => (
  <div className={className}>
    <label style={{ fontFamily: "'IBM Plex Sans', 'Inter', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.onSurfaceVariant, display: 'block', marginBottom: 8, marginLeft: 2 }}>
      {label}
    </label>
    <select
      style={{
        width: '100%',
        background: T.s2,
        border: 'none',
        borderBottom: `2px solid ${T.outlineVariant}26`,
        borderRadius: 0,
        padding: '12px 16px',
        fontSize: 14,
        fontFamily: "'IBM Plex Sans', 'Inter', sans-serif",
        color: T.onSurface,
        outline: 'none',
        appearance: 'none',
        cursor: 'pointer',
      }}
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const SectionLabel = ({ label, badge }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
    <h3 style={{ fontFamily: "'IBM Plex Sans', 'Inter', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.outline, margin: 0 }}>
      {label}
    </h3>
    {badge === 'private' && (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: T.secondaryContainer, color: T.onSecondaryContainer, padding: '4px 12px', fontSize: 10, fontWeight: 700, borderRadius: 0 }}>
        <Lock size={12} /> PRIVADO
      </span>
    )}
    {badge === 'public' && (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dbeafe', color: '#1d4ed8', padding: '4px 12px', fontSize: 10, fontWeight: 700, borderRadius: 0 }}>
        <Eye size={12} /> PUBLICO
      </span>
    )}
  </div>
);

const Chip = ({ text, onRemove }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: T.onSurface, color: '#fff', padding: '4px 8px', fontSize: 10, fontWeight: 700, borderRadius: 0 }}>
    {text} {onRemove && <X size={10} style={{ cursor: 'pointer' }} />}
  </span>
);

/* ─── Main Page Component ─── */
const SellerWizardBoceto = () => {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "'IBM Plex Sans', 'Inter', sans-serif" }}>
        {/* ─── HEADER ─── */}
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          background: `${T.sLowest}cc`,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          padding: '16px 32px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0px 12px 32px rgba(26,28,28,0.04)',
        }}>
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 800, fontSize: 22, color: T.primary, letterSpacing: '-0.03em' }}>
            arroba
          </div>
          <nav style={{ display: 'flex', gap: 32 }}>
            {['Dashboard', 'Mis Agencias', 'Mensajes'].map((item, i) => (
              <a key={item} href="#" style={{
                fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: '-0.02em',
                color: i === 1 ? T.onSurface : T.outline,
                textDecoration: 'none',
                borderBottom: i === 1 ? `2px solid ${T.onSurface}` : 'none',
                paddingBottom: 4,
              }}>
                {item}
              </a>
            ))}
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.s2 }} />
          </div>
        </header>

        {/* ─── SIDEBAR ─── */}
        <aside style={{
          position: 'fixed', left: 0, top: 0, bottom: 0, width: 256,
          background: T.s1, paddingTop: 80, padding: '80px 16px 16px',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ marginBottom: 32, padding: '0 8px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: T.onSurface, margin: 0, letterSpacing: '-0.02em' }}>
              Venta de Agencia
            </h2>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.outline, marginTop: 4 }}>
              Progreso del listado
            </p>
          </div>

          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sidebarSteps.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === activeStep;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStep(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                    background: isActive ? T.sLowest : 'transparent',
                    color: isActive ? T.primary : T.onSurfaceVariant,
                    border: 'none', borderRadius: 0, cursor: 'pointer',
                    fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, fontWeight: 600,
                    letterSpacing: '0.04em', textTransform: 'uppercase', textAlign: 'left',
                    boxShadow: isActive ? '0px 4px 12px rgba(26,28,28,0.06)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <Icon size={18} />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </nav>

          <button style={{
            marginTop: 'auto', marginBottom: 80,
            background: T.onSurface, color: '#fff',
            padding: '14px 16px', border: 'none', borderRadius: 0,
            fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, fontWeight: 700,
            letterSpacing: '-0.01em', cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}>
            Vista previa del listado
          </button>
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <main style={{ marginLeft: 256, paddingTop: 80, padding: '96px 32px 48px 32px', minHeight: '100vh' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Step Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
              {topSteps.map((s, i) => (
                <React.Fragment key={s.num}>
                  <div style={{ display: 'flex', alignItems: 'center', opacity: i === 0 ? 1 : 0.35 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: i === 0 ? T.primary : T.s2,
                      color: i === 0 ? '#fff' : T.onSurfaceVariant,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 14,
                    }}>
                      {s.num}
                    </div>
                    <div style={{ marginLeft: 12 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: i === 0 ? T.primary : T.outline, margin: 0 }}>
                        Paso {s.num}
                      </p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: T.onSurface, margin: 0, letterSpacing: '-0.01em' }}>
                        {s.label}
                      </p>
                    </div>
                  </div>
                  {i < topSteps.length - 1 && (
                    <div style={{ flex: 2, height: 2, background: T.s2, margin: '0 16px', position: 'relative' }}>
                      {i === 0 && <div style={{ width: '25%', height: '100%', background: T.primary }} />}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* 60/40 Split */}
            <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
              {/* ─── LEFT: Form Fields (60%) ─── */}
              <div style={{ width: '60%' }}>
                {/* Page header */}
                <div style={{ marginBottom: 48 }}>
                  <h1 style={{ fontSize: 30, fontWeight: 800, color: T.onSurface, margin: 0, letterSpacing: '-0.03em' }}>
                    Datos de la compania
                  </h1>
                  <p style={{ color: T.onSurfaceVariant, fontSize: 14, maxWidth: 480, lineHeight: 1.6, marginTop: 8 }}>
                    Proporcione los detalles fundamentales de su agencia. Algunos datos permaneceran privados hasta que se firme un acuerdo de confidencialidad.
                  </p>
                </div>

                {/* ─── Legal Info Group ─── */}
                <div style={{ marginBottom: 48 }}>
                  <SectionLabel label="Informacion Legal" badge="private" />
                  <GhostInput label="Denominacion Social" value="Creative Peak Studio S.L." />
                  <div style={{ height: 24 }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <GhostInput label="CIF / NIF" placeholder="B12345678" />
                    <div>
                      <label style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.onSurfaceVariant, display: 'block', marginBottom: 8, marginLeft: 2 }}>
                        Buscar por CIF
                      </label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          placeholder="B12345678"
                          style={{
                            flex: 1, background: T.s2, border: 'none', borderBottom: `2px solid ${T.outlineVariant}26`,
                            borderRadius: 0, padding: '12px 16px', fontSize: 14, fontFamily: "'IBM Plex Sans', sans-serif",
                            color: T.onSurface, outline: 'none',
                          }}
                        />
                        <button style={{
                          background: T.onSurface, color: '#fff', border: 'none', borderRadius: 0,
                          padding: '12px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6,
                          fontFamily: "'IBM Plex Sans', sans-serif",
                        }}>
                          <Search size={14} /> BUSCAR
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── Public Info Group ─── */}
                <div style={{ marginBottom: 48 }}>
                  <SectionLabel label="Perfil Publico" badge="public" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <GhostInput label="Pais" value="Espana" disabled />
                    <GhostSelect label="Provincia" options={['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Malaga']} />
                  </div>
                  <div style={{ height: 24 }} />
                  <GhostInput label="Sitio Web (URL)" placeholder="https://peakstudio.com" />

                  {/* Web scraping simulation */}
                  <div style={{
                    marginTop: 24, background: T.s1, padding: 24,
                    borderLeft: `4px solid ${T.secondary}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <TrendingUp size={16} style={{ color: T.secondary }} />
                      <p style={{ fontSize: 10, fontWeight: 700, color: T.secondary, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                        DATOS EXTRAIDOS DE LA WEB
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 24 }}>
                      <div style={{ width: 80, height: 80, background: T.sLowest, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 32, color: T.outline }}>?</span>
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ height: 12, background: T.s2, width: '75%' }} />
                        <div style={{ height: 10, background: T.s2, width: '100%' }} />
                        <div style={{ height: 10, background: T.s2, width: '85%' }} />
                        <div style={{ height: 10, background: T.s2, width: '60%' }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ height: 24 }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <GhostSelect label="Tipo de Agencia" options={['Agencia de Marketing Digital', 'Estudio de Diseno UX/UI', 'Agencia de Desarrollo Software', 'Consultora de Comunicacion']} />
                    <div>
                      <label style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.onSurfaceVariant, display: 'block', marginBottom: 8, marginLeft: 2 }}>
                        Subcategoria
                      </label>
                      <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: 8,
                        padding: 8, background: T.s2,
                        borderBottom: `2px solid ${T.outlineVariant}26`,
                        minHeight: 44,
                      }}>
                        <Chip text="SEO" onRemove />
                        <Chip text="SEM" onRemove />
                        <span style={{ fontSize: 10, fontWeight: 700, color: T.outline, padding: '4px 8px', fontStyle: 'italic', cursor: 'pointer' }}>
                          + Anadir...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── Navigation ─── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 32 }}>
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, fontWeight: 700,
                    color: T.onSurfaceVariant,
                  }}>
                    <ArrowLeft size={16} /> Guardar y salir
                  </button>
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: T.primary, color: '#fff', border: 'none', borderRadius: 0,
                    padding: '16px 40px', fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em',
                    cursor: 'pointer',
                    boxShadow: '0px 12px 32px rgba(182, 33, 42, 0.15)',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    transition: 'transform 0.1s',
                  }}
                    onMouseDown={(e) => { e.target.style.transform = 'scale(0.97)'; }}
                    onMouseUp={(e) => { e.target.style.transform = 'scale(1)'; }}
                  >
                    SIGUIENTE PASO <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* ─── RIGHT: Live Preview (40%) ─── */}
              <div style={{ width: '40%', position: 'sticky', top: 96 }}>
                <div style={{
                  background: T.sLowest, padding: 32,
                  boxShadow: '0px 24px 64px rgba(26,28,28,0.05)',
                  border: `1px solid ${T.outlineVariant}18`,
                }}>
                  {/* Preview header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                    <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.onSurface, margin: 0 }}>
                      LIVE PREVIEW
                    </h2>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                    </div>
                  </div>

                  {/* Card preview */}
                  <div>
                    {/* Image placeholder */}
                    <div style={{ width: '100%', aspectRatio: '16/9', background: T.s1, marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: T.outline, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          Imagen de portada
                        </span>
                      </div>
                      <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8 }}>
                        <span style={{ background: `${T.sLowest}ee`, backdropFilter: 'blur(8px)', padding: '4px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                          MADRID
                        </span>
                        <span style={{ background: `${T.sLowest}ee`, backdropFilter: 'blur(8px)', padding: '4px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                          MARKETING
                        </span>
                      </div>
                    </div>

                    <h3 style={{ fontSize: 20, fontWeight: 800, color: T.onSurface, margin: 0, letterSpacing: '-0.02em' }}>
                      Agencia de Marketing Digital Premium
                    </h3>
                    <p style={{ color: T.onSurfaceVariant, fontSize: 13, lineHeight: 1.6, marginTop: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      Especialistas en escalado de e-commerce con facturacion recurrente y cartera de clientes en el sector lujo...
                    </p>

                    {/* Team + Valuation */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
                      <div style={{ display: 'flex' }}>
                        {[1, 2, 3].map(i => (
                          <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: T.s2, border: `2px solid ${T.sLowest}`, marginLeft: i > 1 ? -8 : 0 }} />
                        ))}
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.s2, border: `2px solid ${T.sLowest}`, marginLeft: -8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: T.onSurfaceVariant }}>
                          +12
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.outline, margin: 0 }}>
                          Valoracion est.
                        </p>
                        <p style={{ fontSize: 18, fontWeight: 900, color: T.primary, margin: 0, letterSpacing: '-0.02em' }}>
                          1.2M - 1.5M
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Trust signals */}
                  <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <Lock size={18} style={{ color: T.outline, marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: T.onSurface, margin: 0 }}>Vendedor Verificado</p>
                        <p style={{ fontSize: 11, color: T.onSurfaceVariant, lineHeight: 1.4, margin: '2px 0 0' }}>
                          Documentacion legal y fiscal ya validada por nuestro equipo de curadores.
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <Eye size={18} style={{ color: T.outline, marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: T.onSurface, margin: 0 }}>Identidad Protegida</p>
                        <p style={{ fontSize: 11, color: T.onSurfaceVariant, lineHeight: 1.4, margin: '2px 0 0' }}>
                          El nombre legal solo sera revelado a compradores con fondos certificados.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Coaching tip */}
                  <div style={{
                    marginTop: 32, paddingTop: 32,
                    borderTop: 'none',
                    background: T.s1, padding: 20, marginLeft: -32, marginRight: -32, marginBottom: -32,
                  }}>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: '#001d32', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Lightbulb size={14} />
                      </div>
                      <p style={{ fontSize: 11, fontWeight: 500, color: '#004b74', lineHeight: 1.5, fontStyle: 'italic', margin: 0 }}>
                        "Un perfil bien detallado atrae un 45% mas de ofertas cualificadas. No olvides completar la subcategoria para ser mas visible en las busquedas."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default SellerWizardBoceto;
