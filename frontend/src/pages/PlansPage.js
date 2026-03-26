import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { plansAPI } from '../services/api';
import {
  ArrowRight, Check, ChevronDown, ChevronUp,
  Building2, TrendingUp, Users, Shield, Handshake, FileText
} from 'lucide-react';

/* ─── Format price EU ─── */
const fmtPrice = (v) => {
  if (v === null || v === undefined || v === 0) return '0';
  return v.toLocaleString('es-ES');
};

/* ─── Plan Card ─── */
const PlanCard = ({ plan, isHighlighted }) => {
  const isFree = plan.billing_type === 'free';
  const isRevenueShare = plan.billing_type === 'revenue_share';

  return (
    <div
      className="flex flex-col h-full p-6 lg:p-8 relative"
      style={{
        background: 'var(--surface-lowest)',
        boxShadow: isHighlighted ? '0 8px 40px rgba(25,28,30,0.08)' : '0 2px 8px rgba(25,28,30,0.03)',
        borderTop: isHighlighted ? '3px solid var(--arroba-primary)' : '3px solid transparent',
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

      <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>
        {plan.plan_name.toUpperCase()}
      </p>

      {/* Price */}
      <div className="mb-6">
        {isFree && (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>Gratis</span>
          </div>
        )}
        {!isFree && !isRevenueShare && (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>
              {fmtPrice(plan.monthly_price)} €
            </span>
            <span className="text-sm" style={{ color: 'var(--outline)' }}>/mes</span>
          </div>
        )}
        {isRevenueShare && (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>
              {plan.revenue_share_pct}%
            </span>
            <span className="text-sm" style={{ color: 'var(--outline)' }}>revenue share</span>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="flex-1 space-y-3 mb-8">
        {plan.features.map((f, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <Check size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--arroba-primary)' }} />
            <span className="text-sm" style={{ color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{f}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link to="/register">
        <button
          className="w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2"
          style={{
            background: isHighlighted ? 'var(--arroba-primary)' : 'var(--on-surface)',
            color: '#fff',
          }}
          data-testid={`plan-cta-${plan.plan_id}`}
        >
          {isFree ? 'Empezar gratis' : isRevenueShare ? 'Solicitar acceso' : 'Activar plan'}
          <ArrowRight size={14} />
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
    buyer: { label: 'COMISIÓN DE ÉXITO — BUYERS', pct: '1%', icon: Building2 },
    advisor: { label: 'REVENUE SHARE — ADVISORS', pct: '15%', icon: Handshake },
  };
  const c = configs[role] || configs.seller;
  const Icon = c.icon;

  return (
    <div className="p-6 lg:p-8" style={{ background: 'var(--surface-1)' }} data-testid={`fee-block-${role}`}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ background: 'var(--on-surface)', color: '#fff' }}>
          <Icon size={18} />
        </div>
        <div>
          <p className="label-arroba mb-1" style={{ color: 'var(--outline)' }}>{c.label}</p>
          <p className="text-lg font-black mb-2" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
            {c.pct} {feeRule.fee_type === 'success_fee' ? 'sobre el valor de la transacción cerrada' : 'sobre los honorarios pactados'}
          </p>
          <p className="text-sm" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>
            {feeRule.description}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ─── FAQ Item ─── */
const FaqItem = ({ item, isOpen, onToggle }) => (
  <div style={{ borderBottom: '1px solid var(--surface-2)' }} data-testid={`faq-item`}>
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-5 text-left"
    >
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

/* ═══════════════════════════════════════════
   PLANS PAGE
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

  useEffect(() => {
    const load = async () => {
      try {
        const res = await plansAPI.getPublic();
        setData(res.data);
      } catch {}
    };
    load();
  }, []);

  const plans = data?.plans?.[activeTab] || [];
  const feeRule = data?.fee_rules?.[activeTab];
  const faq = data?.faq || [];

  return (
    <Layout>
      {/* ─── HERO ─── */}
      <section className="py-16 lg:py-20" style={{ background: 'var(--surface-lowest)' }} data-testid="plans-hero">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <p className="label-arroba mb-4" style={{ color: 'var(--arroba-primary)', fontSize: 11 }}>
            PLANES Y PRECIOS
          </p>
          <h1
            className="text-3xl lg:text-4xl font-extrabold mb-5"
            style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em', lineHeight: 1.15 }}
          >
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

      {/* ─── TAB SELECTOR ─── */}
      <section style={{ background: 'var(--surface-0)', borderTop: '1px solid var(--surface-2)' }}>
        <div className="container mx-auto px-6">
          <div className="flex justify-center">
            {TABS.map(t => {
              const isActive = t.key === activeTab;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className="px-8 py-4 text-sm font-bold uppercase tracking-wider relative transition-colors"
                  style={{ color: isActive ? 'var(--arroba-primary)' : 'var(--outline)' }}
                  data-testid={`plans-tab-${t.key}`}
                >
                  {t.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'var(--arroba-primary)' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── PLANS GRID ─── */}
      <section className="py-16" style={{ background: 'var(--surface-0)' }} data-testid="plans-grid">
        <div className="container mx-auto px-6">
          {activeTab !== 'advisor' ? (
            <>
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
                {plans.map(p => (
                  <PlanCard key={p.plan_id} plan={p} isHighlighted={p.is_highlighted} />
                ))}
              </div>
              {/* Fee block */}
              <div className="max-w-5xl mx-auto">
                <FeeBlock role={activeTab} feeRule={feeRule} />
              </div>
            </>
          ) : (
            /* Advisor: single premium card + fee explanation */
            <div className="max-w-2xl mx-auto">
              {plans.map(p => (
                <PlanCard key={p.plan_id} plan={p} isHighlighted={p.is_highlighted} />
              ))}
              <div className="mt-8">
                <FeeBlock role="advisor" feeRule={feeRule} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── FEATURE COMPARISON ─── */}
      {activeTab !== 'advisor' && (
        <section className="py-16" style={{ background: 'var(--surface-lowest)' }} data-testid="plans-comparison">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <p className="label-arroba mb-3" style={{ color: 'var(--arroba-primary)' }}>COMPARATIVA</p>
              <h2 className="text-2xl font-extrabold mb-8" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
                ¿Qué incluye cada plan?
              </h2>
              <ComparisonTable plans={plans} />
            </div>
          </div>
        </section>
      )}

      {/* ─── HOW FEES WORK ─── */}
      <section className="py-16" style={{ background: activeTab === 'advisor' ? 'var(--surface-lowest)' : 'var(--surface-0)' }} data-testid="fees-explanation">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <p className="label-arroba mb-3" style={{ color: 'var(--arroba-primary)' }}>MODELO DE PRECIOS</p>
            <h2 className="text-2xl font-extrabold mb-6" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
              Cómo funciona la estructura de costes
            </h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{ background: 'var(--surface-2)' }}>
                  <Shield size={14} style={{ color: 'var(--on-surface)' }} />
                </div>
                <div>
                  <p className="text-sm font-bold mb-1" style={{ color: 'var(--on-surface)' }}>Suscripción mensual</p>
                  <p className="text-sm" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>
                    Da acceso a herramientas, funcionalidades y niveles de servicio de la plataforma. Cada plan desbloquea capacidades adicionales.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{ background: 'var(--surface-2)' }}>
                  <TrendingUp size={14} style={{ color: 'var(--on-surface)' }} />
                </div>
                <div>
                  <p className="text-sm font-bold mb-1" style={{ color: 'var(--on-surface)' }}>Comisión de éxito</p>
                  <p className="text-sm" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>
                    Solo aplica si la operación se cierra. El 2,9% para sellers y el 1% para buyers se calcula sobre el valor de la transacción. Sin cierre, sin coste adicional.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{ background: 'var(--surface-2)' }}>
                  <Handshake size={14} style={{ color: 'var(--on-surface)' }} />
                </div>
                <div>
                  <p className="text-sm font-bold mb-1" style={{ color: 'var(--on-surface)' }}>Programa Advisor Partner</p>
                  <p className="text-sm" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>
                    Los advisors operan bajo revenue share. ARROBA participa con el 15% de los honorarios pactados por el advisor con su cliente, siempre con mandato visible y contrato transparente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-16" style={{ background: 'var(--surface-lowest)' }} data-testid="plans-faq">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <p className="label-arroba mb-3" style={{ color: 'var(--arroba-primary)' }}>PREGUNTAS FRECUENTES</p>
            <h2 className="text-2xl font-extrabold mb-8" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
              Resolvemos tus dudas
            </h2>
            <div>
              {faq.map((item, i) => (
                <FaqItem
                  key={i}
                  item={item}
                  isOpen={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── LEGAL PLACEHOLDERS ─── */}
      <section className="py-8" style={{ background: 'var(--surface-0)', borderTop: '1px solid var(--surface-2)' }}>
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto flex flex-wrap gap-6 justify-center">
            {[
              { label: 'Términos y condiciones', href: '#terminos' },
              { label: 'Política de privacidad', href: '#privacidad' },
              { label: 'Condiciones de comisión de éxito', href: '#comision-exito' },
              { label: 'Programa Advisor Partner', href: '#advisor-partner' },
            ].map((link, i) => (
              <a key={i} href={link.href} className="text-xs font-semibold underline" style={{ color: 'var(--outline)' }}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-20" style={{ background: 'var(--on-surface)' }} data-testid="plans-cta">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-3" style={{ letterSpacing: '-0.02em' }}>
            ¿Preparado para dar el siguiente paso?
          </h2>
          <p className="text-sm text-white/60 mb-8 max-w-md mx-auto">
            Regístrate gratis y accede a la plataforma. Activa un plan cuando lo necesites.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register">
              <button className="px-8 py-3.5 text-sm font-bold" style={{ background: 'var(--arroba-primary)', color: '#fff' }} data-testid="plans-cta-register">
                Crear cuenta gratis
              </button>
            </Link>
            <a href="mailto:equipo@arroba.es">
              <button className="px-8 py-3.5 text-sm font-bold" style={{ background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,0.25)' }}>
                Hablar con el equipo
              </button>
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
};

/* ─── Comparison Table ─── */
const ComparisonTable = ({ plans }) => {
  if (!plans.length) return null;

  // Collect all unique features across plans
  const allFeatures = [];
  const featureMap = {};

  plans.forEach((p, pi) => {
    p.features.forEach(f => {
      if (!featureMap[f]) {
        featureMap[f] = new Array(plans.length).fill(false);
        allFeatures.push(f);
      }
      featureMap[f][pi] = true;
    });
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="comparison-table">
        <thead>
          <tr style={{ borderBottom: '2px solid var(--surface-2)' }}>
            <th className="text-left py-3 pr-4 font-bold" style={{ color: 'var(--on-surface)', width: '50%' }}>
              Funcionalidad
            </th>
            {plans.map(p => (
              <th key={p.plan_id} className="text-center py-3 px-2 font-bold" style={{ color: 'var(--on-surface)' }}>
                {p.plan_name.split(' ').pop()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allFeatures.map((f, fi) => {
            // Skip "Todo lo incluido en..." rows
            if (f.startsWith('Todo lo incluido')) return null;
            return (
              <tr key={fi} style={{ borderBottom: '1px solid var(--surface-1)' }}>
                <td className="py-3 pr-4" style={{ color: 'var(--on-surface-variant)' }}>{f}</td>
                {featureMap[f].map((has, pi) => (
                  <td key={pi} className="text-center py-3">
                    {has ? (
                      <Check size={14} className="mx-auto" style={{ color: 'var(--arroba-primary)' }} />
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--outline-variant)' }}>—</span>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PlansPage;
