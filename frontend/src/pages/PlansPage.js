import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { plansAPI } from '../services/api';
import {
  ArrowRight, Check, ChevronDown, ChevronUp,
  TrendingUp, Handshake, Shield, Info, Zap
} from 'lucide-react';

/* ─── Format price EU ─── */
const fmtPrice = (v) => {
  if (v === null || v === undefined || v === 0) return '0';
  return v.toLocaleString('es-ES');
};

/* ─── Interaction limit label ─── */
const interactionLabel = (limit) => {
  if (limit === -1) return 'Ilimitadas';
  if (limit === 0) return 'Sin interacciones';
  return `Hasta ${limit}/mes`;
};

/* ─── Plan Card ─── */
const PlanCard = ({ plan, showAnnual }) => {
  const isFree = plan.billing_type === 'free';
  const isRevenueShare = plan.billing_type === 'revenue_share';
  const isAdvisor = plan.role_type === 'advisor';

  const monthlyDisplay = showAnnual && plan.annual_price
    ? Math.round(plan.annual_price / 12)
    : plan.monthly_price;

  return (
    <div
      className="flex flex-col h-full p-6 lg:p-8 relative transition-all duration-200 hover:-translate-y-1"
      style={{
        background: 'var(--surface-lowest)',
        boxShadow: plan.is_highlighted
          ? '0 8px 40px rgba(25,28,30,0.08)'
          : '0 2px 8px rgba(25,28,30,0.03)',
        borderTop: plan.is_highlighted
          ? '3px solid var(--arroba-primary)'
          : '3px solid transparent',
      }}
      data-testid={`plan-card-${plan.plan_id}`}
    >
      {plan.badge && (
        <span
          className="absolute -top-0 right-6 px-3 py-1 text-[10px] font-bold"
          style={{ background: 'var(--arroba-primary)', color: '#fff', transform: 'translateY(-50%)' }}
        >
          {plan.badge}
        </span>
      )}

      <p className="label-arroba mb-1" style={{ color: 'var(--outline)' }}>
        {plan.plan_name.toUpperCase()}
      </p>

      {/* Tagline */}
      {plan.plan_tagline && (
        <p className="text-xs mb-4" style={{ color: 'var(--outline)', lineHeight: 1.5 }}>
          {plan.plan_tagline}
        </p>
      )}

      {/* Price */}
      <div className="mb-6">
        {isFree && !isAdvisor && (
          <span className="text-3xl font-black" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>Gratis</span>
        )}
        {!isFree && !isRevenueShare && !isAdvisor && (
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>
                {fmtPrice(monthlyDisplay)} €
              </span>
              <span className="text-sm" style={{ color: 'var(--outline)' }}>/mes</span>
            </div>
            {showAnnual && plan.annual_discount_pct > 0 && (
              <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--arroba-primary)' }}>
                {plan.annual_discount_pct}% dto. facturación anual
              </p>
            )}
          </div>
        )}
        {isAdvisor && isFree && (
          <div>
            <span className="text-3xl font-black" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>Gratis</span>
            <p className="text-xs mt-1" style={{ color: 'var(--outline)' }}>+ 15% sobre honorarios pactados</p>
          </div>
        )}
        {isAdvisor && !isFree && (
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>
                {fmtPrice(plan.monthly_price)} €
              </span>
              <span className="text-sm" style={{ color: 'var(--outline)' }}>/mes</span>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--outline)' }}>+ 15% sobre honorarios pactados</p>
          </div>
        )}
      </div>

      {/* Interaction badge */}
      {!isAdvisor && plan.monthly_interaction_limit !== undefined && (
        <div className="mb-5 flex items-center gap-2">
          <Zap size={12} style={{ color: plan.monthly_interaction_limit === -1 ? 'var(--arroba-primary)' : 'var(--outline)' }} />
          <span className="text-xs font-bold" style={{ color: plan.monthly_interaction_limit === -1 ? 'var(--arroba-primary)' : 'var(--outline)' }}>
            {interactionLabel(plan.monthly_interaction_limit)}
          </span>
        </div>
      )}

      {/* Features */}
      <div className="flex-1 space-y-2.5 mb-6">
        {plan.features.map((f, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <Check size={13} className="mt-0.5 shrink-0" style={{ color: 'var(--arroba-primary)' }} />
            <span className="text-sm" style={{ color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{f}</span>
          </div>
        ))}
      </div>

      {/* Conditions (advisor) */}
      {plan.conditions?.length > 0 && (
        <div className="mb-6 pt-4" style={{ borderTop: '1px solid var(--surface-1)' }}>
          <p className="label-arroba mb-2" style={{ color: 'var(--outline)', fontSize: 9 }}>CONDICIONES</p>
          {plan.conditions.map((c, i) => (
            <p key={i} className="text-xs mb-1" style={{ color: 'var(--outline)', lineHeight: 1.5 }}>{c}</p>
          ))}
        </div>
      )}

      {/* CTA */}
      <Link to="/register">
        <button
          className="group/btn w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150"
          style={{
            background: plan.is_highlighted ? 'var(--arroba-primary)' : 'var(--on-surface)',
            color: '#fff',
          }}
          data-testid={`plan-cta-${plan.plan_id}`}
        >
          {isFree ? 'Empezar gratis' : (isAdvisor && !isFree) ? 'Hablar con el equipo' : 'Activar plan'}
          <ArrowRight size={14} className="transition-transform duration-150 group-hover/btn:translate-x-0.5" />
        </button>
      </Link>
    </div>
  );
};

/* ─── Fee Block ─── */
const FeeBlock = ({ role, feeRule }) => {
  if (!feeRule) return null;
  const configs = {
    seller: { label: 'COMISIÓN DE ÉXITO — SELLERS', pct: '2,9%', icon: TrendingUp },
    buyer: { label: 'COMISIÓN DE ÉXITO — BUYERS', pct: '1%', icon: TrendingUp },
    advisor: { label: 'REVENUE SHARE — ADVISORS', pct: '15%', icon: Handshake },
  };
  const c = configs[role] || configs.seller;
  const Icon = c.icon;

  return (
    <div className="p-6 lg:p-8 flex items-start gap-4" style={{ background: 'var(--surface-1)' }} data-testid={`fee-block-${role}`}>
      <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ background: 'var(--on-surface)', color: '#fff' }}>
        <Icon size={18} />
      </div>
      <div>
        <p className="label-arroba mb-1" style={{ color: 'var(--outline)' }}>{c.label}</p>
        <p className="text-lg font-black mb-1" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
          {c.pct} {feeRule.fee_type === 'success_fee' ? 'sobre el valor de la transacción cerrada' : 'sobre los honorarios pactados y validados'}
        </p>
        <p className="text-sm" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>{feeRule.description}</p>
      </div>
    </div>
  );
};

/* ─── FAQ Item ─── */
const FaqItem = ({ item, isOpen, onToggle }) => (
  <div style={{ borderBottom: '1px solid var(--surface-2)' }} data-testid="faq-item">
    <button onClick={onToggle} className="w-full flex items-center justify-between py-5 text-left">
      <span className="text-sm font-bold pr-4" style={{ color: 'var(--on-surface)' }}>{item.question}</span>
      {isOpen ? <ChevronUp size={16} style={{ color: 'var(--outline)' }} /> : <ChevronDown size={16} style={{ color: 'var(--outline)' }} />}
    </button>
    {isOpen && (
      <div className="pb-5 -mt-1">
        <p className="text-sm" style={{ color: 'var(--outline)', lineHeight: 1.7 }}>{item.answer}</p>
      </div>
    )}
  </div>
);

/* ─── Comparison Table ─── */
const ComparisonTable = ({ plans }) => {
  if (!plans.length) return null;
  const allFeatures = [];
  const featureMap = {};
  plans.forEach((p, pi) => {
    p.features.forEach(f => {
      if (f.startsWith('Todo lo incluido')) return;
      if (!featureMap[f]) { featureMap[f] = new Array(plans.length).fill(false); allFeatures.push(f); }
      featureMap[f][pi] = true;
    });
  });
  // Propagate: if plan 2 inherits plan 1, mark plan 2 features
  plans.forEach((p, pi) => {
    if (pi > 0) {
      allFeatures.forEach(f => { if (featureMap[f][pi - 1]) featureMap[f][pi] = true; });
    }
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="comparison-table">
        <thead>
          <tr style={{ borderBottom: '2px solid var(--surface-2)' }}>
            <th className="text-left py-3 pr-4 font-bold" style={{ color: 'var(--on-surface)', width: '50%' }}>Funcionalidad</th>
            {plans.map(p => (
              <th key={p.plan_id} className="text-center py-3 px-2 font-bold" style={{ color: 'var(--on-surface)' }}>
                {p.plan_name.split(' ').slice(1).join(' ') || p.plan_name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allFeatures.map((f, fi) => (
            <tr key={fi} style={{ borderBottom: '1px solid var(--surface-1)' }}>
              <td className="py-3 pr-4" style={{ color: 'var(--on-surface-variant)' }}>{f}</td>
              {featureMap[f].map((has, pi) => (
                <td key={pi} className="text-center py-3">
                  {has ? <Check size={14} className="mx-auto" style={{ color: 'var(--arroba-primary)' }} /> : <span style={{ color: 'var(--outline-variant)' }}>—</span>}
                </td>
              ))}
            </tr>
          ))}
          {/* Interaction row */}
          <tr style={{ borderBottom: '1px solid var(--surface-1)' }}>
            <td className="py-3 pr-4 font-bold" style={{ color: 'var(--on-surface)' }}>Interacciones mensuales</td>
            {plans.map(p => (
              <td key={p.plan_id} className="text-center py-3 text-xs font-bold" style={{ color: p.monthly_interaction_limit === -1 ? 'var(--arroba-primary)' : 'var(--on-surface)' }}>
                {interactionLabel(p.monthly_interaction_limit)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
const TABS = [
  { key: 'seller', label: 'Sellers' },
  { key: 'buyer', label: 'Buyers' },
  { key: 'advisor', label: 'Advisors' },
];

const PlansPage = () => {
  const [activeTab, setActiveTab] = useState('seller');
  const [data, setData] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [showAnnual, setShowAnnual] = useState(false);

  useEffect(() => {
    plansAPI.getPublic().then(res => setData(res.data)).catch(() => {});
  }, []);

  const plans = data?.plans?.[activeTab] || [];
  const feeRule = data?.fee_rules?.[activeTab];
  const faq = data?.faq || [];

  return (
    <Layout>
      {/* ─── HERO ─── */}
      <section className="py-16 lg:py-20" style={{ background: 'var(--surface-lowest)' }} data-testid="plans-hero">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <p className="label-arroba mb-4" style={{ color: 'var(--arroba-primary)', fontSize: 11 }}>PLANES Y PRECIOS</p>
          <h1 className="text-3xl lg:text-4xl font-extrabold mb-5" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            Planes pensados para vender, comprar o explorar una operación con más criterio
          </h1>
          <p className="text-base mb-8" style={{ color: 'var(--on-surface-variant)', lineHeight: 1.7 }}>
            Empieza gratis y activa herramientas más avanzadas según el momento de tu proceso.
          </p>
          <a href="mailto:equipo@arroba.es" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--outline)' }}>
            Hablar con el equipo <ArrowRight size={14} />
          </a>
        </div>
      </section>

      {/* ─── TAB SELECTOR + BILLING TOGGLE ─── */}
      <section style={{ background: 'var(--surface-0)', borderTop: '1px solid var(--surface-2)' }}>
        <div className="container mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-1">
            <div className="flex">
              {TABS.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className="px-8 py-4 text-sm font-bold uppercase tracking-wider relative transition-colors"
                  style={{ color: t.key === activeTab ? 'var(--arroba-primary)' : 'var(--outline)' }}
                  data-testid={`plans-tab-${t.key}`}>
                  {t.label}
                  {t.key === activeTab && <span className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'var(--arroba-primary)' }} />}
                </button>
              ))}
            </div>
            {activeTab !== 'advisor' && (
              <div className="flex items-center gap-3" data-testid="billing-toggle">
                <span className="text-xs font-semibold" style={{ color: !showAnnual ? 'var(--on-surface)' : 'var(--outline)' }}>Mensual</span>
                <button
                  onClick={() => setShowAnnual(!showAnnual)}
                  className="relative w-11 h-6 transition-colors"
                  style={{ background: showAnnual ? 'var(--arroba-primary)' : 'var(--surface-2)' }}
                >
                  <span className="absolute top-1 w-4 h-4 transition-transform" style={{ background: '#fff', left: showAnnual ? 24 : 4 }} />
                </button>
                <span className="text-xs font-semibold" style={{ color: showAnnual ? 'var(--on-surface)' : 'var(--outline)' }}>
                  Anual <span className="font-bold" style={{ color: 'var(--arroba-primary)' }}>-10%</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── PLANS GRID ─── */}
      <section className="py-16" style={{ background: 'var(--surface-0)' }} data-testid="plans-grid">
        <div className="container mx-auto px-6">
          {activeTab !== 'advisor' ? (
            <>
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
                {plans.map(p => <PlanCard key={p.plan_id} plan={p} showAnnual={showAnnual} />)}
              </div>
              <div className="max-w-5xl mx-auto">
                <FeeBlock role={activeTab} feeRule={feeRule} />
              </div>
              {/* Annual discount note */}
              {!showAnnual && (
                <p className="text-center text-xs mt-6" style={{ color: 'var(--outline)' }}>
                  Descuento del 10% disponible con facturación anual.
                </p>
              )}
            </>
          ) : (
            /* Advisor: 2 cards + fee + explainer */
            <>
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
                {plans.map(p => <PlanCard key={p.plan_id} plan={p} showAnnual={false} />)}
              </div>
              <div className="max-w-4xl mx-auto mb-8">
                <FeeBlock role="advisor" feeRule={feeRule} />
              </div>
              <div className="max-w-3xl mx-auto p-6" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 12px rgba(25,28,30,0.04)' }}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ background: 'var(--surface-2)' }}>
                    <Handshake size={16} style={{ color: 'var(--on-surface)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold mb-1" style={{ color: 'var(--on-surface)' }}>Cómo funciona para advisors</p>
                    <p className="text-sm" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>
                      Los advisors pueden empezar con 1 mandato activo gratis. Para gestionar 2 o más mandatos activos dentro de la plataforma, deben activar Advisor Pro. En ambos casos, ARROBA participa con el 15% de los honorarios pactados con el cliente, siempre dentro de un marco transparente y verificable.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ─── INTERACTIONS EXPLAINER ─── */}
      {activeTab !== 'advisor' && (
        <section className="py-12" style={{ background: 'var(--surface-lowest)' }} data-testid="interactions-block">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto flex items-start gap-4 p-6" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 12px rgba(25,28,30,0.04)' }}>
              <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ background: 'var(--surface-2)' }}>
                <Info size={16} style={{ color: 'var(--on-surface)' }} />
              </div>
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: 'var(--on-surface)' }}>Cómo funcionan las interacciones</p>
                <p className="text-sm" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>
                  Las interacciones son acciones activas dentro de la plataforma, como intereses, contactos o reuniones vinculadas a una operación.
                  Los planes Free pueden recibir notificaciones de interés u oportunidad, pero necesitan subir de nivel para ver el detalle completo y gestionar la interacción.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── FEATURE COMPARISON ─── */}
      {activeTab !== 'advisor' && (
        <section className="py-16" style={{ background: 'var(--surface-lowest)' }} data-testid="plans-comparison">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <p className="label-arroba mb-3" style={{ color: 'var(--arroba-primary)' }}>COMPARATIVA</p>
              <h2 className="text-2xl font-extrabold mb-8" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>¿Qué incluye cada plan?</h2>
              <ComparisonTable plans={plans} />
            </div>
          </div>
        </section>
      )}

      {/* ─── HOW FEES WORK ─── */}
      <section className="py-16" style={{ background: 'var(--surface-0)' }} data-testid="fees-explanation">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <p className="label-arroba mb-3" style={{ color: 'var(--arroba-primary)' }}>MODELO DE PRECIOS</p>
            <h2 className="text-2xl font-extrabold mb-6" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
              Cómo funciona la estructura económica
            </h2>
            <p className="text-sm mb-8" style={{ color: 'var(--outline)', lineHeight: 1.7 }}>
              Los planes mensuales dan acceso a las herramientas y funcionalidades de la plataforma. Además, si una operación se cierra, ARROBA aplica una comisión de éxito según el perfil implicado.
            </p>
            <div className="space-y-6">
              {[
                { icon: Shield, title: 'Suscripción mensual', desc: 'Da acceso a herramientas, funcionalidades y niveles de servicio. Cada plan desbloquea capacidades adicionales según las necesidades de tu proceso.' },
                { icon: TrendingUp, title: 'Comisión de éxito', desc: 'Solo aplica si la operación se cierra. Sellers: 2,9%. Buyers: 1%. Sin cierre, sin coste adicional.' },
                { icon: Handshake, title: 'Programa Advisor Partner', desc: 'ARROBA participa con el 15% de los honorarios pactados por el advisor con su cliente, bajo contrato transparente y con visibilidad completa del mandato.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{ background: 'var(--surface-2)' }}>
                    <item.icon size={14} style={{ color: 'var(--on-surface)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold mb-1" style={{ color: 'var(--on-surface)' }}>{item.title}</p>
                    <p className="text-sm" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-16" style={{ background: 'var(--surface-lowest)' }} data-testid="plans-faq">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <p className="label-arroba mb-3" style={{ color: 'var(--arroba-primary)' }}>PREGUNTAS FRECUENTES</p>
            <h2 className="text-2xl font-extrabold mb-8" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>Resolvemos tus dudas</h2>
            {faq.map((item, i) => <FaqItem key={i} item={item} isOpen={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />)}
          </div>
        </div>
      </section>

      {/* ─── LEGAL ─── */}
      <section className="py-8" style={{ background: 'var(--surface-0)', borderTop: '1px solid var(--surface-2)' }}>
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto flex flex-wrap gap-6 justify-center">
            {['Términos y condiciones', 'Política de privacidad', 'Condiciones de comisión de éxito', 'Programa Advisor Partner'].map((label, i) => (
              <a key={i} href={`#${label.toLowerCase().replace(/ /g, '-')}`} className="text-xs font-semibold underline" style={{ color: 'var(--outline)' }}>{label}</a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-20" style={{ background: 'var(--on-surface)' }} data-testid="plans-cta">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-3" style={{ letterSpacing: '-0.02em' }}>¿Preparado para dar el siguiente paso?</h2>
          <p className="text-sm text-white/60 mb-8 max-w-md mx-auto">Regístrate gratis y accede a la plataforma. Activa un plan cuando lo necesites.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register"><button className="px-8 py-3.5 text-sm font-bold" style={{ background: 'var(--arroba-primary)', color: '#fff' }} data-testid="plans-cta-register">Crear cuenta gratis</button></Link>
            <a href="mailto:equipo@arroba.es"><button className="px-8 py-3.5 text-sm font-bold" style={{ background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,0.25)' }}>Hablar con el equipo</button></a>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PlansPage;
