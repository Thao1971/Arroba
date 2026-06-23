import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { valuationAPI } from '../services/api';
import Layout from '../components/layout/Layout';
import {
  ArrowRight, ArrowLeft, Check, Loader2, AlertCircle,
  User, Building2, BarChart3, Clock, TrendingUp,
  Shield, FileText, ChevronRight, Info, Lock
} from 'lucide-react';

import { fmtMillions } from '../utils/formatES';

/* ─── Step config ─── */
const STEPS = [
  { id: 'identity', label: 'Identificacion', icon: User },
  { id: 'company', label: 'Compania', icon: Building2 },
  { id: 'taxonomy', label: 'Categoria', icon: BarChart3 },
  { id: 'intent', label: 'Momento', icon: Clock },
];

const SALE_INTENTS = [
  { id: 'si_12_meses', label: 'Si, en menos de 12 meses', desc: 'Estoy listo para iniciar el proceso' },
  { id: 'si_12_24_meses', label: 'Si, en 12-24 meses', desc: 'Estoy preparando la operacion' },
  { id: 'no_corto_plazo', label: 'No a corto plazo', desc: 'Quiero conocer mi posicion' },
  { id: 'solo_orientacion', label: 'Solo quiero orientarme', desc: 'Curiosidad profesional' },
];

/* ─── Reusable ghost components (matching Wizard V2) ─── */
const GhostInput = ({ label, value, onChange, placeholder, type = 'text', testId, className = '', helpText, required }) => (
  <div className={className}>
    <label className="label-arroba block mb-2 ml-0.5">{label}{required && ' *'}</label>
    <input
      type={type}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full border-0 border-b-2 border-slate-200/40 px-4 py-3 text-sm outline-none transition-colors focus:border-arroba-coral text-slate-900"
      style={{ background: 'var(--surface-2, #e2e2e2)', borderRadius: 0 }}
      data-testid={testId}
    />
    {helpText && <p className="text-xs mt-1.5 ml-0.5" style={{ color: 'var(--outline)' }}>{helpText}</p>}
  </div>
);

/* ─── Confidence badge ─── */
const ConfidenceBadge = ({ level }) => {
  const config = {
    alta: { label: 'ALTA', bg: 'rgba(22,163,74,0.08)', color: '#16a34a', dot: '#16a34a' },
    media: { label: 'MEDIA', bg: 'rgba(217,119,6,0.08)', color: '#d97706', dot: '#d97706' },
    baja: { label: 'BAJA', bg: 'rgba(220,38,38,0.08)', color: '#dc2626', dot: '#dc2626' },
  };
  const c = config[level] || config.media;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold" style={{ background: c.bg, color: c.color }} data-testid="confidence-badge">
      <span className="w-2 h-2 rounded-full" style={{ background: c.dot }} />
      {c.label}
    </span>
  );
};

/* ─── Result Screen ─── */
const ValuationResult = ({ result, config, onRegisterCompany, onRequestPremium, onSendEmail, emailSent }) => {
  const fmtEur = (v) => fmtMillions(v).replace('€', '');

  return (
    <div className="max-w-3xl mx-auto" data-testid="valuation-result">
      {/* Main card */}
      <div className="p-8 mb-6" style={{ background: 'var(--surface-lowest)', boxShadow: '0 4px 24px rgba(25,28,30,0.06)' }}>
        <div className="flex items-center justify-between mb-6">
          <p className="label-arroba" style={{ color: 'var(--outline)' }}>ESTIMACION INICIAL DE VALOR</p>
          <span className="px-3 py-1 text-[10px] font-bold" style={{ background: 'var(--surface-1)', color: 'var(--outline)' }}>ESTIMACION INICIAL</span>
        </div>
        <div className="text-center py-6">
          <p className="text-4xl font-black tracking-tight" style={{ color: 'var(--arroba-primary)', letterSpacing: '-0.03em' }} data-testid="valuation-range">
            {fmtEur(result.valuation_low)} - {fmtEur(result.valuation_high)}
          </p>
          <p className="text-lg font-bold mt-2" style={{ color: 'var(--on-surface)' }} data-testid="valuation-mid">
            Valor orientativo: {fmtEur(result.valuation_mid)}
          </p>
          <div className="mt-4">
            <ConfidenceBadge level={result.confidence_level} />
          </div>
        </div>
      </div>

      {/* Drivers card */}
      <div className="p-6 mb-6" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 12px rgba(25,28,30,0.04)' }}>
        <p className="label-arroba mb-4" style={{ color: 'var(--outline)' }}>QUE HA INFLUIDO EN EL RESULTADO</p>
        <div className="space-y-3">
          {result.drivers.map((d, i) => (
            <div key={i} className="flex items-start gap-3 py-2" style={{ borderBottom: i < result.drivers.length - 1 ? '1px solid var(--surface-1)' : 'none' }}>
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${d.impact === 'positivo' ? 'bg-green-500' : d.impact === 'negativo' ? 'bg-red-500' : 'bg-amber-400'}`} />
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{d.factor}</p>
                <p className="text-xs" style={{ color: 'var(--outline)' }}>{d.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: '1px solid var(--surface-1)' }}>
          <p className="text-xs" style={{ color: 'var(--outline)' }}>
            Multiplo aplicado: {result.multiple_min}x - {result.multiple_max}x
            <span className="ml-2 px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--surface-1)' }}>{result.multiple_source}</span>
          </p>
        </div>
      </div>

      {/* Confidence card */}
      <div className="p-6 mb-6" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 12px rgba(25,28,30,0.04)' }}>
        <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>NIVEL DE CONFIANZA</p>
        <div className="flex items-center gap-3">
          <ConfidenceBadge level={result.confidence_level} />
          <p className="text-xs" style={{ color: 'var(--outline)' }}>
            {result.confidence_level === 'alta' && 'Datos suficientes para una estimacion fiable.'}
            {result.confidence_level === 'media' && 'Estimacion razonable. Algunos datos podrian mejorar la precision.'}
            {result.confidence_level === 'baja' && 'Estimacion orientativa. Recomendamos una valoracion experta.'}
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="p-4 mb-8" style={{ background: 'var(--surface-1)' }}>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--outline)' }} data-testid="disclaimer-text">
          {result.disclaimer || config?.disclaimer_full || 'Esta es una estimacion inicial basada en criterios automaticos. No sustituye una valoracion experta ni una opinion independiente.'}
        </p>
      </div>

      {/* CTAs */}
      <div className="space-y-3">
        <button onClick={onRegisterCompany}
          className="w-full py-4 text-sm font-bold flex items-center justify-center gap-3"
          style={{ background: 'var(--arroba-primary)', color: '#fff' }}
          data-testid="cta-register-company">
          DAR DE ALTA MI AGENCIA EN ARROBA <ArrowRight size={16} />
        </button>
        <button onClick={onRequestPremium}
          className="w-full py-4 text-sm font-bold flex items-center justify-center gap-3"
          style={{ background: 'var(--on-surface)', color: '#fff' }}
          data-testid="cta-premium-valuation">
          SOLICITAR VALORACION EXPERTA — {config?.premium_price || '1.950'} EUR
        </button>
        {!emailSent && (
          <button onClick={onSendEmail}
            className="w-full py-3 text-xs font-bold flex items-center justify-center gap-2"
            style={{ background: 'var(--surface-2)', color: 'var(--on-surface)' }}
            data-testid="cta-send-email">
            <FileText size={12} /> ENVIAR RESULTADO POR EMAIL
          </button>
        )}
        {emailSent && (
          <p className="text-center text-xs font-semibold py-2" style={{ color: 'var(--outline)' }}>
            <Check size={12} className="inline mr-1" /> Resultado enviado a tu email
          </p>
        )}
      </div>
    </div>
  );
};

/* ─── Premium modal ─── */
const PremiumModal = ({ onClose, onSubmit, loading, config }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
    <div className="w-full max-w-lg p-8 mx-4" style={{ background: 'var(--surface-lowest)' }} data-testid="premium-modal">
      <p className="label-arroba mb-2" style={{ color: 'var(--arroba-primary)' }}>VALORACION EXPERTA</p>
      <h3 className="text-xl font-black mb-3" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
        Solicitar valoracion experta — {config?.premium_price || '1.950'} EUR
      </h3>
      <p className="text-sm mb-6" style={{ color: 'var(--outline)', lineHeight: 1.7 }}>
        {config?.premium_description || 'Valoracion experta que amplia la estimacion automatica mediante analisis de comparables, multiples de mercado, revision sectorial del CIS y descuento de flujos de caja.'}
      </p>
      <div className="flex gap-3">
        <button onClick={onSubmit} disabled={loading}
          className="flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: 'var(--arroba-primary)', color: '#fff' }}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : null} SOLICITAR
        </button>
        <button onClick={onClose} className="px-6 py-3 text-sm font-bold" style={{ background: 'var(--surface-2)', color: 'var(--on-surface)' }}>CANCELAR</button>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════
   MAIN WIZARD COMPONENT
   ═══════════════════════════════════════════ */
const ValuationWizard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [config, setConfig] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumLoading, setPremiumLoading] = useState(false);

  // Form state
  const [identity, setIdentity] = useState({ name: '', job_title: '', email: '' });
  const [company, setCompany] = useState({ company_name: '', revenue: '', ebitda: '', growth_12m_pct: '', employee_count: '', recurring_revenue_pct: '' });
  const [taxonomy, setTaxonomy] = useState({ category_id: '', subcategory_id: '' });
  const [saleIntent, setSaleIntent] = useState('');
  const [legalConfirm, setLegalConfirm] = useState(false);
  const [legalComms, setLegalComms] = useState(false);

  // Taxonomy data
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  // Pre-fill identity from user
  useEffect(() => {
    if (user) {
      setIdentity(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  // Load config + categories
  useEffect(() => {
    const load = async () => {
      try {
        const [configRes, catRes] = await Promise.all([
          valuationAPI.getPublicConfig(),
          valuationAPI.getCategories(),
        ]);
        setConfig(configRes.data);
        setCategories(catRes.data);
      } catch { /* fallback */ }
    };
    load();
  }, []);

  // Load subcategories when category changes
  const loadSubcategories = useCallback(async (catId) => {
    if (!catId) { setSubcategories([]); return; }
    try {
      const res = await valuationAPI.getSubcategories(catId);
      setSubcategories(res.data);
    } catch { setSubcategories([]); }
  }, []);

  useEffect(() => {
    loadSubcategories(taxonomy.category_id);
    setTaxonomy(prev => ({ ...prev, subcategory_id: '' }));
  }, [taxonomy.category_id, loadSubcategories]);

  /* ─── Validation per step ─── */
  const validateStep = () => {
    switch (step) {
      case 0:
        if (!identity.name.trim()) return 'El nombre es obligatorio';
        if (!identity.job_title.trim()) return 'El cargo es obligatorio';
        return null;
      case 1:
        if (!company.company_name.trim()) return 'El nombre de la compania es obligatorio';
        if (!company.revenue || parseFloat(company.revenue) <= 0) return 'La facturacion es obligatoria';
        if (company.ebitda === '') return 'El EBITDA es obligatorio (puede ser 0 o negativo)';
        return null;
      case 2:
        if (!taxonomy.category_id) return 'Selecciona una categoria';
        return null;
      case 3:
        if (!saleIntent) return 'Selecciona una opcion';
        if (!legalConfirm) return 'Debes confirmar la veracidad de los datos';
        return null;
      default:
        return null;
    }
  };

  /* ─── Submit ─── */
  const handleSubmit = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setLoading(true); setError('');
    try {
      const payload = {
        name: identity.name,
        job_title: identity.job_title,
        company_name: company.company_name,
        revenue: parseFloat(company.revenue),
        ebitda: parseFloat(company.ebitda),
        growth_12m_pct: company.growth_12m_pct ? parseFloat(company.growth_12m_pct) : null,
        employee_count: company.employee_count ? parseInt(company.employee_count) : null,
        recurring_revenue_pct: company.recurring_revenue_pct ? parseFloat(company.recurring_revenue_pct) : null,
        category_id: taxonomy.category_id,
        subcategory_id: taxonomy.subcategory_id || null,
        sale_intent: saleIntent,
        legal_confirm_accuracy: legalConfirm,
        legal_accept_communications: legalComms,
      };
      const res = await valuationAPI.estimate(payload);
      setResult(res.data);
      // Auto-send email
      try { await valuationAPI.sendResultEmail(res.data.lead_id); setEmailSent(true); } catch { /* fallback */ }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al calcular la valoracion');
    } finally { setLoading(false); }
  };

  const nextStep = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    if (step === 3) { handleSubmit(); return; }
    setStep(step + 1);
  };

  const prevStep = () => { if (step > 0) { setStep(step - 1); setError(''); } };

  const handlePremiumRequest = async () => {
    if (!result?.lead_id) return;
    setPremiumLoading(true);
    try {
      await valuationAPI.requestPremium({ lead_id: result.lead_id });
      setShowPremiumModal(false);
      setError('');
      alert('Solicitud registrada. Nos pondremos en contacto contigo en 24-48 horas.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al enviar la solicitud');
    } finally { setPremiumLoading(false); }
  };

  /* ─── If showing result ─── */
  if (result) {
    return (
      <Layout>
        <div className="py-16" style={{ background: 'var(--surface-0)' }}>
          <div className="container mx-auto px-6">
            <ValuationResult
              result={result}
              config={config}
              emailSent={emailSent}
              onRegisterCompany={() => navigate('/seller/onboarding')}
              onRequestPremium={() => setShowPremiumModal(true)}
              onSendEmail={async () => {
                try { await valuationAPI.sendResultEmail(result.lead_id); setEmailSent(true); } catch { /* fallback */ }
              }}
            />
          </div>
        </div>
        {showPremiumModal && (
          <PremiumModal
            config={config}
            loading={premiumLoading}
            onClose={() => setShowPremiumModal(false)}
            onSubmit={handlePremiumRequest}
          />
        )}
      </Layout>
    );
  }

  /* ─── Wizard UI ─── */
  return (
    <Layout>
      <div className="py-12 lg:py-16" style={{ background: 'var(--surface-0)', minHeight: '80vh' }} data-testid="valuation-wizard">
        <div className="container mx-auto px-6">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-1 mb-12 max-w-2xl mx-auto">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.id}>
                <div className={`flex items-center gap-2 ${i <= step ? 'opacity-100' : 'opacity-35'}`}>
                  <div className={`w-8 h-8 flex items-center justify-center text-xs font-bold ${
                    i < step ? 'bg-green-500 text-white' : i === step ? 'text-white' : 'text-slate-400'
                  }`} style={{ background: i === step ? 'var(--arroba-primary)' : i < step ? undefined : 'var(--surface-2)', borderRadius: 0 }}>
                    {i < step ? <Check size={12} /> : i + 1}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline" style={{ color: i === step ? 'var(--arroba-primary)' : 'var(--outline)' }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && <div className="flex-1 h-0.5 mx-2" style={{ background: 'var(--surface-2)' }}>{i < step && <div className="h-full bg-green-500 w-full" />}</div>}
              </React.Fragment>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="max-w-3xl mx-auto mb-6 p-4 flex items-center gap-2 text-sm" style={{ background: 'rgba(220,38,38,0.05)', color: '#dc2626' }} data-testid="wizard-error">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* 60/40 layout */}
          <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
            {/* LEFT: Form (60%) */}
            <div className="w-full lg:w-[60%]">
              {/* STEP 0: Identity */}
              {step === 0 && (
                <div data-testid="step-identity">
                  <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>
                    Sobre ti
                  </h1>
                  <p className="text-sm mb-10" style={{ color: 'var(--outline)', maxWidth: 480 }}>
                    Necesitamos unos datos basicos para guardar tu estimacion y enviartela por correo.
                  </p>
                  <div className="space-y-6">
                    <GhostInput label="NOMBRE COMPLETO" value={identity.name} onChange={e => setIdentity({ ...identity, name: e.target.value })} placeholder="Tu nombre" testId="input-name" required />
                    <GhostInput label="CARGO" value={identity.job_title} onChange={e => setIdentity({ ...identity, job_title: e.target.value })} placeholder="CEO, Director General, Fundador..." testId="input-job-title" required />
                    <GhostInput label="EMAIL" value={identity.email} onChange={() => {}} placeholder="" testId="input-email" className="opacity-60 pointer-events-none" helpText="Precargado desde tu cuenta" />
                  </div>
                </div>
              )}

              {/* STEP 1: Company data */}
              {step === 1 && (
                <div data-testid="step-company">
                  <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>
                    Datos de la compania
                  </h1>
                  <p className="text-sm mb-10" style={{ color: 'var(--outline)', maxWidth: 480 }}>
                    Introduce las metricas clave de tu agencia. Cuanto mas preciso, mejor sera la estimacion.
                  </p>
                  <div className="space-y-6">
                    <GhostInput label="NOMBRE DE LA COMPANIA" value={company.company_name} onChange={e => setCompany({ ...company, company_name: e.target.value })} placeholder="Mi Agencia S.L." testId="input-company-name" required />
                    <div className="grid grid-cols-2 gap-6">
                      <GhostInput label="FACTURACION ANUAL (EUR)" value={company.revenue} onChange={e => setCompany({ ...company, revenue: e.target.value })} type="number" placeholder="3000000" testId="input-revenue" required helpText="Ultimo ejercicio fiscal completo" />
                      <GhostInput label="EBITDA ANUAL (EUR)" value={company.ebitda} onChange={e => setCompany({ ...company, ebitda: e.target.value })} type="number" placeholder="600000" testId="input-ebitda" required helpText="Resultado operativo antes de amortizaciones" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <GhostInput label="CRECIMIENTO 12M (%)" value={company.growth_12m_pct} onChange={e => setCompany({ ...company, growth_12m_pct: e.target.value })} type="number" placeholder="15" testId="input-growth" helpText="Variacion interanual de facturacion" />
                      <GhostInput label="NUMERO DE EMPLEADOS" value={company.employee_count} onChange={e => setCompany({ ...company, employee_count: e.target.value })} type="number" placeholder="25" testId="input-employees" />
                    </div>
                    <GhostInput label="% INGRESOS RECURRENTES" value={company.recurring_revenue_pct} onChange={e => setCompany({ ...company, recurring_revenue_pct: e.target.value })} type="number" placeholder="60" testId="input-recurring" helpText="Retainers, fees mensuales, contratos recurrentes" />
                  </div>
                </div>
              )}

              {/* STEP 2: Taxonomy */}
              {step === 2 && (
                <div data-testid="step-taxonomy">
                  <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>
                    Categoria de tu agencia
                  </h1>
                  <p className="text-sm mb-10" style={{ color: 'var(--outline)', maxWidth: 480 }}>
                    Selecciona la categoria y subcategoria que mejor describa tu negocio. Los multiplos de valoracion se ajustan segun el sector.
                  </p>
                  <div className="mb-8">
                    <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>CATEGORIA *</p>
                    <div className="space-y-2">
                      {categories.map(cat => (
                        <button key={cat.id}
                          onClick={() => setTaxonomy({ category_id: cat.id, subcategory_id: '' })}
                          className="w-full text-left px-4 py-3 text-sm font-semibold transition-all flex items-center justify-between"
                          style={{
                            background: taxonomy.category_id === cat.id ? 'rgba(182,33,42,0.06)' : 'var(--surface-2)',
                            color: taxonomy.category_id === cat.id ? 'var(--arroba-primary)' : 'var(--on-surface)',
                            borderLeft: taxonomy.category_id === cat.id ? '3px solid var(--arroba-primary)' : '3px solid transparent',
                          }}
                          data-testid={`category-${cat.id}`}>
                          {cat.name}
                          {taxonomy.category_id === cat.id && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>
                  {subcategories.length > 0 && (
                    <div>
                      <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>SUBCATEGORIA</p>
                      <div className="flex flex-wrap gap-2">
                        {subcategories.map(sub => (
                          <button key={sub.id}
                            onClick={() => setTaxonomy(prev => ({ ...prev, subcategory_id: prev.subcategory_id === sub.id ? '' : sub.id }))}
                            className="px-4 py-2 text-xs font-bold transition-all"
                            style={{
                              background: taxonomy.subcategory_id === sub.id ? 'var(--on-surface)' : 'var(--surface-2)',
                              color: taxonomy.subcategory_id === sub.id ? '#fff' : 'var(--on-surface)',
                            }}
                            data-testid={`subcategory-${sub.id}`}>
                            {sub.name} {taxonomy.subcategory_id === sub.id && <span className="ml-1">x</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Sale intent + legal */}
              {step === 3 && (
                <div data-testid="step-intent">
                  <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>
                    Momento del proceso
                  </h1>
                  <p className="text-sm mb-10" style={{ color: 'var(--outline)', maxWidth: 480 }}>
                    Estas pensando vender tu compania?
                  </p>
                  <div className="space-y-3 mb-10">
                    {SALE_INTENTS.map(intent => (
                      <button key={intent.id}
                        onClick={() => setSaleIntent(intent.id)}
                        className="w-full text-left px-5 py-4 transition-all flex items-center gap-4"
                        style={{
                          background: saleIntent === intent.id ? 'rgba(182,33,42,0.06)' : 'var(--surface-2)',
                          borderLeft: saleIntent === intent.id ? '3px solid var(--arroba-primary)' : '3px solid transparent',
                        }}
                        data-testid={`intent-${intent.id}`}>
                        <div className={`w-5 h-5 flex items-center justify-center shrink-0 ${saleIntent === intent.id ? '' : ''}`}
                          style={{ background: saleIntent === intent.id ? 'var(--arroba-primary)' : 'var(--surface-1)', border: saleIntent === intent.id ? 'none' : '2px solid var(--outline-variant)' }}>
                          {saleIntent === intent.id && <Check size={12} className="text-white" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{intent.label}</p>
                          <p className="text-xs" style={{ color: 'var(--outline)' }}>{intent.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs italic mb-8" style={{ color: 'var(--outline)' }}>
                    Esta respuesta no modifica tu estimacion. Nos ayuda a entender en que momento estas.
                  </p>

                  {/* Legal checkboxes */}
                  <div className="pt-6" style={{ borderTop: '1px solid var(--surface-2)' }}>
                    <p className="label-arroba mb-4" style={{ color: 'var(--outline)' }}>ANTES DE CALCULAR</p>
                    <label className="flex items-start gap-3 mb-4 cursor-pointer" data-testid="legal-confirm">
                      <input type="checkbox" checked={legalConfirm} onChange={e => setLegalConfirm(e.target.checked)}
                        className="mt-0.5 shrink-0" style={{ accentColor: 'var(--arroba-primary)' }} />
                      <span className="text-xs leading-relaxed" style={{ color: 'var(--on-surface)' }}>
                        Confirmo que la informacion introducida es correcta y que entiendo que el resultado es una estimacion automatica orientativa. *
                      </span>
                    </label>
                    <label className="flex items-start gap-3 mb-4 cursor-pointer" data-testid="legal-comms">
                      <input type="checkbox" checked={legalComms} onChange={e => setLegalComms(e.target.checked)}
                        className="mt-0.5 shrink-0" style={{ accentColor: 'var(--arroba-primary)' }} />
                      <span className="text-xs leading-relaxed" style={{ color: 'var(--outline)' }}>
                        Acepto que ARROBA / BUD Advisors pueda utilizar mis datos para enviarme el resultado y ponerse en contacto conmigo en relacion con este servicio.
                      </span>
                    </label>
                    <p className="text-[10px] leading-relaxed mt-4" style={{ color: 'var(--outline)' }}>
                      {config?.disclaimer_full || 'Esta estimacion ha sido generada de forma automatica a partir de los datos facilitados y criterios sectoriales orientativos. No constituye asesoramiento financiero, fiscal ni legal, ni una valoracion formal independiente. BUD Advisors, S.L., como entidad titular de ARROBA, no asume responsabilidad por decisiones adoptadas exclusivamente sobre la base de esta estimacion automatica.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-10">
                <button onClick={step === 0 ? () => navigate('/') : prevStep} disabled={loading}
                  className="flex items-center gap-2 text-sm font-bold disabled:opacity-30"
                  style={{ color: 'var(--outline)' }}>
                  <ArrowLeft size={14} /> {step === 0 ? 'VOLVER A INICIO' : 'ANTERIOR'}
                </button>
                <button onClick={nextStep} disabled={loading}
                  className="btn-primary px-10 py-4 text-sm flex items-center gap-3 disabled:opacity-50"
                  data-testid="next-step-btn">
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {step === 3 ? 'CALCULAR VALORACION' : 'SIGUIENTE'}
                  {!loading && step < 3 && <ArrowRight size={14} />}
                </button>
              </div>
            </div>

            {/* RIGHT: Context/Help (40%) */}
            <div className="w-full lg:w-[40%] lg:sticky lg:top-8 space-y-6">
              {/* Help card - changes per step */}
              <div className="p-6" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 12px rgba(25,28,30,0.04)' }}>
                {step === 0 && (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <Shield size={16} style={{ color: 'var(--on-surface)' }} />
                      <p className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>Privacidad garantizada</p>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--outline)' }}>
                      Tus datos son confidenciales y no se comparten con terceros. Solo se utilizan para generar tu estimacion y mejorar el servicio.
                    </p>
                  </>
                )}
                {step === 1 && (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp size={16} style={{ color: 'var(--on-surface)' }} />
                      <p className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>Metricas clave</p>
                    </div>
                    <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--outline)' }}>
                      La facturacion y el EBITDA son los datos mas relevantes para la estimacion. El resto de metricas permiten ajustar el resultado.
                    </p>
                    <div className="space-y-2">
                      {['Facturacion del ultimo ejercicio completo', 'EBITDA normalizado preferiblemente', 'Crecimiento y recurrencia mejoran la precision'].map((t, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Check size={10} style={{ color: 'var(--arroba-primary)' }} />
                          <span className="text-[11px]" style={{ color: 'var(--outline)' }}>{t}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {step === 2 && (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 size={16} style={{ color: 'var(--on-surface)' }} />
                      <p className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>Multiplos sectoriales</p>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--outline)' }}>
                      Los multiplos de valoracion varian segun el sector. Un SaaS/MarTech tiene multiplos superiores a una agencia de eventos, por ejemplo.
                    </p>
                    <p className="text-xs leading-relaxed mt-3" style={{ color: 'var(--outline)' }}>
                      La subcategoria permite un ajuste mas fino si existe referencia sectorial disponible.
                    </p>
                  </>
                )}
                {step === 3 && (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <Info size={16} style={{ color: 'var(--on-surface)' }} />
                      <p className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>Sobre la estimacion</p>
                    </div>
                    <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--outline)' }}>
                      Esta herramienta genera una estimacion inicial automatica basada en multiplos sectoriales y la calidad de tus metricas.
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--outline)' }}>
                      Para una valoracion mas completa, defendible y util para la toma de decisiones, puedes solicitar una valoracion experta.
                    </p>
                  </>
                )}
              </div>

              {/* Trust signals */}
              <div className="p-6" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 12px rgba(25,28,30,0.04)' }}>
                <div className="space-y-4">
                  {[
                    { icon: Shield, title: 'Estimacion inmediata', desc: 'Resultado en menos de 5 segundos' },
                    { icon: BarChart3, title: 'Criterios sectoriales', desc: 'Multiplos basados en datos del CIS' },
                    { icon: Lock, title: 'Sin compromiso', desc: 'Herramienta gratuita y confidencial' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <item.icon size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--outline)' }} />
                      <div>
                        <p className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{item.title}</p>
                        <p className="text-[11px]" style={{ color: 'var(--outline)' }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ValuationWizard;
