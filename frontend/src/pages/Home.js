import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { marketplaceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Check, Shield, Building2, FileText, TrendingUp, ChevronRight, MoreHorizontal, Copy, Share2, X } from 'lucide-react';

/* ─── Hero Insight Card Config ─── */
const HERO_TABS = [
  {
    key: 'seller',
    tabLabel: 'Vender',
    eyebrow: 'VENTA DE AGENCIAS',
    title: 'Vende tu agencia con más criterio, confidencialidad y control',
    description: 'Activa un proceso ordenado para presentar tu compañía, filtrar el interés comprador y avanzar con mayor visibilidad sobre cada paso. En un mercado cada vez más exigente, vender bien no depende solo del momento, sino de llegar a la contraparte adecuada con la información correcta.',
    primaryCtaLabel: 'Recibir una valoración',
    secondaryCtaLabel: 'Más información',
    primaryCtaHref: '/valoracion',
    secondaryCtaHref: '/como-funciona',
  },
  {
    key: 'buyer',
    tabLabel: 'Comprar',
    eyebrow: 'COMPRA DE AGENCIAS',
    title: 'Encuentra oportunidades mejor filtradas en un mercado amplio y fragmentado',
    description: 'Accede a compañías seleccionadas, compara oportunidades con más contexto y detecta encajes estratégicos con mayor rapidez. ARROBA te ayuda a reducir ruido, priorizar mejor y avanzar sobre operaciones con más información desde el inicio.',
    primaryCtaLabel: 'Explorar oportunidades',
    secondaryCtaLabel: 'Cómo funciona',
    primaryCtaHref: '/explorar',
    secondaryCtaHref: '/como-funciona',
  },
  {
    key: 'merge',
    tabLabel: 'Fusionarse',
    eyebrow: 'FUSIÓN ENTRE AGENCIAS',
    title: 'Gana tamaño y nuevas capacidades para competir en el nuevo ciclo del sector',
    description: 'La transformación del mercado, la presión sobre márgenes y la irrupción de nuevas capacidades vinculadas a datos, automatización e inteligencia artificial están empujando a muchas agencias a replantear su escala y su propuesta de valor. ARROBA te ayuda a identificar partners complementarios para crecer con más solidez.',
    primaryCtaLabel: 'Explorar una fusión',
    secondaryCtaLabel: 'Más información',
    primaryCtaHref: '/register?role=seller',
    secondaryCtaHref: '/como-funciona',
  },
];

const HomeHeroInsightCard = () => {
  const [activeTab, setActiveTab] = useState('seller');
  const tab = HERO_TABS.find(t => t.key === activeTab);

  return (
    <div
      className="w-full"
      style={{ background: 'var(--surface-lowest)', boxShadow: '0 8px 40px rgba(25,28,30,0.07)' }}
      data-testid="hero-insight-card"
    >
      {/* Tab header */}
      <div className="flex" style={{ borderBottom: '2px solid var(--surface-1)' }}>
        {HERO_TABS.map(t => {
          const isActive = t.key === activeTab;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="flex-1 py-3.5 text-xs font-bold uppercase tracking-wider text-center transition-colors relative"
              style={{
                color: isActive ? 'var(--arroba-primary)' : 'var(--outline)',
                background: isActive ? 'var(--surface-lowest)' : 'var(--surface-1)',
              }}
              data-testid={`hero-tab-${t.key}`}
            >
              {t.tabLabel}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{ background: 'var(--arroba-primary)' }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab body */}
      <div className="p-6 lg:p-8">
        <p
          className="label-arroba mb-3"
          style={{ color: 'var(--arroba-primary)', fontSize: 10 }}
          data-testid="hero-card-eyebrow"
        >
          {tab.eyebrow}
        </p>

        <h3
          className="text-lg font-extrabold mb-4"
          style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em', lineHeight: 1.25 }}
          data-testid="hero-card-title"
        >
          {tab.title}
        </h3>

        <p
          className="text-sm mb-6"
          style={{ color: 'var(--outline)', lineHeight: 1.7 }}
          data-testid="hero-card-description"
        >
          {tab.description}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Link to={tab.primaryCtaHref}>
            <button
              className="btn-primary px-6 py-3 text-sm flex items-center gap-2 whitespace-nowrap"
              data-testid="hero-card-primary-cta"
            >
              {tab.primaryCtaLabel} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
          <Link
            to={tab.secondaryCtaHref}
            className="flex items-center gap-1 text-sm font-semibold whitespace-nowrap"
            style={{ color: 'var(--on-surface-variant)' }}
            data-testid="hero-card-secondary-cta"
          >
            {tab.secondaryCtaLabel} <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

const signalStyles = {
  loi: { bg: 'rgba(182,33,42,0.06)', color: '#991b1b', dot: '#B6212A' },
  competition: { bg: 'rgba(217,119,6,0.06)', color: '#92400e', dot: '#d97706' },
  process: { bg: 'rgba(217,119,6,0.06)', color: '#92400e', dot: '#d97706' },
  dr_activity: { bg: 'rgba(0,100,147,0.06)', color: '#004b74', dot: '#006493' },
  freshness: { bg: 'rgba(16,185,129,0.06)', color: '#065f46', dot: '#10b981' },
};

const SignalBadge = ({ signal }) => {
  const s = signalStyles[signal.type] || signalStyles.freshness;
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {signal.text}
    </span>
  );
};

const HomeShareMenu = ({ dealId, title }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/explorar/${dealId}`;
  const shareTitle = title ? `${title} — ARROBA` : 'Oportunidad en ARROBA';

  const copyUrl = async (e) => {
    e.preventDefault(); e.stopPropagation();
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };
  const nativeShare = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (navigator.share) { try { await navigator.share({ title: shareTitle, text: shareTitle, url }); } catch {} }
    else { copyUrl(e); }
    setOpen(false);
  };
  const toggle = (e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); };

  if (!open) return (
    <button onClick={toggle} className="p-1 transition-opacity opacity-0 group-hover:opacity-100" style={{ color: 'var(--outline)' }} data-testid={`share-btn-${dealId}`}>
      <MoreHorizontal size={16} />
    </button>
  );
  return (
    <div className="relative" onClick={e => e.preventDefault()}>
      <button onClick={toggle} className="p-1" style={{ color: 'var(--outline)' }}><X size={14} /></button>
      <div className="absolute right-0 top-7 z-20 py-1 min-w-[150px]" style={{ background: 'var(--surface-lowest)', boxShadow: '0 8px 24px rgba(25,28,30,0.12)' }}>
        <button onClick={copyUrl} className="w-full px-4 py-2 text-left text-xs font-semibold flex items-center gap-2 hover:opacity-70" style={{ color: 'var(--on-surface)' }}>
          <Copy size={12} /> {copied ? 'Copiado' : 'Copiar enlace'}
        </button>
        <button onClick={nativeShare} className="w-full px-4 py-2 text-left text-xs font-semibold flex items-center gap-2 hover:opacity-70" style={{ color: 'var(--on-surface)' }}>
          <Share2 size={12} /> Compartir
        </button>
      </div>
    </div>
  );
};

const DealCard = ({ deal }) => {
  const teaser = deal.teaser || {};
  const signals = deal.signals || [];
  return (
    <Link
      to={`/explorar/${deal.deal_id}`}
      className="block p-6 transition-all hover:shadow-lg group"
      style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.03)' }}
      data-testid={`deal-card-${deal.deal_id}`}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="badge-arroba" style={{
          background: deal.status === 'published' ? 'var(--on-surface)' : 'var(--arroba-primary)',
          color: '#fff',
        }}>
          {deal.status === 'published' ? 'DISPONIBLE' : 'EN NEGOCIACIÓN'}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--outline)' }}>{teaser.geography_display}</span>
          <HomeShareMenu dealId={deal.deal_id} title={teaser.headline} />
        </div>
      </div>

      <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
        {teaser.headline || 'Agencia Digital'}
      </h3>

      <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>
        {teaser.description || 'Oportunidad de inversion en agencia digital'}
      </p>

      {signals.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {signals.map((s, i) => <SignalBadge key={i} signal={s} />)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 pt-4" style={{ borderTop: '1px solid var(--surface-1)' }}>
        <div>
          <p className="label-arroba mb-1">Facturacion</p>
          <p className="font-bold text-sm" style={{ color: 'var(--on-surface)' }}>{teaser.revenue_display || 'N/D'}</p>
        </div>
        <div>
          <p className="label-arroba mb-1">EBITDA</p>
          <p className="font-bold text-sm" style={{ color: 'var(--on-surface)' }}>{teaser.ebitda_display || 'N/D'}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: 'var(--arroba-primary)' }}>
        Ver detalle <ArrowRight className="w-3 h-3" />
      </div>
    </Link>
  );
};

const Home = () => {
  const [featuredDeals, setFeaturedDeals] = useState([]);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dealsRes] = await Promise.all([
          marketplaceAPI.getFeaturedDeals()
        ]);
        setFeaturedDeals(dealsRes.data);
      } catch (error) {
        console.error('Error fetching home data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <Layout>
      {/* ─── HERO ─── */}
      <section className="py-16 lg:py-24" style={{ background: 'var(--surface-lowest)' }} data-testid="hero-section">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
            {/* Left: Claim */}
            <div className="flex-1 lg:max-w-xl pt-2">
              <p className="label-arroba mb-4" style={{ color: 'var(--arroba-primary)', fontSize: 11 }}>
                PLATAFORMA M&A PARA AGENCIAS DIGITALES
              </p>
              <h1 className="text-4xl lg:text-5xl font-extrabold mb-6" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                El lugar donde<br />
                <span style={{ color: 'var(--arroba-primary)' }}>comprar y vender</span><br />
                agencias
              </h1>

              <p className="text-base max-w-lg" style={{ color: 'var(--on-surface-variant)', lineHeight: 1.7 }}>
                Acceso privado a la mayor plataforma de compradores y vendedores del ecosistema Madtech. Confidencialidad, proceso estructurado, acompañamiento profesional.
              </p>
            </div>

            {/* Right: Insight Card */}
            <div className="w-full lg:w-[440px] xl:w-[480px] shrink-0">
              <HomeHeroInsightCard />
            </div>
          </div>
        </div>
      </section>

      {/* ─── VALUATION LEAD MAGNET ─── */}
      <section className="py-16 lg:py-20" style={{ background: 'var(--surface-0)', borderTop: '1px solid var(--surface-2)' }} data-testid="valuation-section">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
            <div className="flex-1 lg:max-w-xl">
              <p className="label-arroba mb-3" style={{ color: 'var(--arroba-primary)', fontSize: 11 }}>
                VALORACIÓN INICIAL
              </p>
              <h2 className="text-3xl lg:text-4xl font-extrabold mb-4" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
                Descubre cuánto podría<br />valer tu agencia
              </h2>
              <p className="text-sm mb-8 max-w-md" style={{ color: 'var(--on-surface-variant)', lineHeight: 1.7 }}>
                Obtén una estimación inicial a partir de tu facturación, EBITDA y subcategoría. Resultado inmediato, confidencial y sin compromiso.
              </p>
              <div className="flex flex-col gap-2 mb-8">
                {['Estimación inmediata', 'Basada en criterios sectoriales', 'Sin compromiso'].map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4" style={{ color: 'var(--arroba-primary)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>{t}</span>
                  </div>
                ))}
              </div>
              <Link to={isAuthenticated ? '/valoracion' : '/register?redirect=/valoracion'}>
                <button className="btn-primary px-8 py-3 flex items-center gap-2" data-testid="cta-valuation">
                  Calcular valoración <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
            <div className="w-full lg:w-[440px] xl:w-[480px] shrink-0">
              <div className="p-8" style={{ background: 'var(--surface-lowest)', boxShadow: '0 4px 24px rgba(25,28,30,0.06)' }}>
                <p className="label-arroba mb-6" style={{ color: 'var(--outline)' }}>EJEMPLO DE RESULTADO</p>
                <div className="text-center py-4">
                  <p className="text-3xl font-black" style={{ color: 'var(--arroba-primary)', letterSpacing: '-0.03em' }}>
                    3,2M — 4,1M
                  </p>
                  <p className="text-sm font-bold mt-1" style={{ color: 'var(--on-surface)' }}>
                    Valor orientativo: 3,6M
                  </p>
                  <span className="inline-block mt-3 px-3 py-1 text-[10px] font-bold" style={{ background: 'rgba(22,163,74,0.08)', color: '#16a34a' }}>
                    CONFIANZA ALTA
                  </span>
                </div>
                <div className="mt-6 pt-4 space-y-2" style={{ borderTop: '1px solid var(--surface-1)' }}>
                  {['Margen EBITDA: 20%', 'Recurrencia: 65%', 'Crecimiento: +12%'].map((t, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="text-xs" style={{ color: 'var(--outline)' }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURED DEALS ─── */}
      <section className="py-16" style={{ background: 'var(--surface-0)', borderTop: '1px solid var(--surface-2)' }} data-testid="featured-section">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-extrabold" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
                Agencias destacadas
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--outline)' }}>
                Oportunidades con mayor actividad
              </p>
            </div>
            <Link to="/explorar" className="flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--arroba-primary)' }}>
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {featuredDeals.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredDeals.slice(0, 6).map((deal) => (
                <DealCard key={deal.deal_id} deal={deal} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16" style={{ background: 'var(--surface-1)' }}>
              <Building2 className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} />
              <p style={{ color: 'var(--outline)' }}>Próximamente nuevas agencias</p>
              <Link to="/register?role=seller">
                <button className="btn-primary mt-4">Publica tu agencia</button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20" style={{ background: 'var(--surface-lowest)' }} data-testid="how-it-works-section">
        <div className="container mx-auto px-6">
          <div className="mb-12">
            <p className="label-arroba mb-3" style={{ color: 'var(--arroba-primary)' }}>PROCESO</p>
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
              Cómo funciona
            </h2>
            <p style={{ color: 'var(--outline)', maxWidth: 480 }}>
              Un proceso estructurado y seguro para conectar compradores y vendedores de agencias digitales.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: '01', title: 'Regístrate gratis', desc: 'Crea tu cuenta y define si quieres comprar, vender o fusionarte' },
              { num: '02', title: 'Explora oportunidades', desc: 'Accede al marketplace con todas las agencias verificadas' },
              { num: '03', title: 'Trabaja en un entorno seguro', desc: 'Confidencialidad, NDA digital y Data Room protegido en cada operación' },
              { num: '04', title: 'Cierra tu operación', desc: 'Te acompañamos en todo el proceso hasta el cierre' },
            ].map((step, i) => (
              <div key={i} className="p-8" style={{ background: 'var(--surface-0)' }}>
                <span className="text-3xl font-extrabold" style={{ color: 'var(--surface-2)', letterSpacing: '-0.02em' }}>
                  {step.num}
                </span>
                <h3 className="text-lg font-bold mt-4 mb-2" style={{ color: 'var(--on-surface)' }}>{step.title}</h3>
                <p className="text-sm" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20" style={{ background: 'var(--arroba-primary)' }} data-testid="cta-section">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4" style={{ letterSpacing: '-0.02em' }}>
            ¿Listo para empezar?
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto text-sm">
            Únete a la mayor plataforma de M&A de agencias digitales
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register">
              <button className="px-8 py-3 font-bold text-sm uppercase tracking-wide"
                style={{ background: '#fff', color: 'var(--arroba-primary)' }}
                data-testid="cta-register">
                Crear cuenta gratis
              </button>
            </Link>
            <Link to="/explorar">
              <button className="px-8 py-3 font-bold text-sm uppercase tracking-wide"
                style={{ background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,0.4)' }}
                data-testid="cta-explore">
                Ver agencias
              </button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
