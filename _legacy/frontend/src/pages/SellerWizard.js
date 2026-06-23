import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { companiesAPI, dealsAPI, infomemoAPI, cifAPI, teaserAPI } from '../services/api';
import FinancialStatementsStep from '../components/FinancialStatementsStep';
import { FinancialVisualsGallery } from '../components/FinancialVisualCard';
import { fmtMillions } from '../utils/formatES';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowRight, ArrowLeft, Check, Building2, TrendingUp, FileText,
  Loader2, AlertCircle, Plus, Trash2, Search, Database, Edit3, Eye,
  DollarSign, Handshake, Lock, Lightbulb, Info, X
} from 'lucide-react';

/* ─── Sidebar steps ─── */
const sidebarSteps = [
  { icon: Info, label: 'Datos Basicos', id: 'basics' },
  { icon: DollarSign, label: 'Financieros', id: 'financials' },
  { icon: TrendingUp, label: 'Valoracion', id: 'valuation' },
  { icon: Handshake, label: 'Acuerdo', id: 'deal' },
  { icon: FileText, label: 'Teaser & Infomemo', id: 'teaser' },
];

/* ─── Reusable ghost components ─── */
const GhostInput = ({ label, value, onChange, placeholder, disabled, type = 'text', testId, className = '' }) => (
  <div className={className}>
    <label className="label-arroba block mb-2 ml-0.5">{label}</label>
    <input
      type={type}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full border-0 border-b-2 border-slate-200/40 px-4 py-3 text-sm outline-none transition-colors focus:border-arroba-coral ${
        disabled ? 'cursor-not-allowed text-slate-400' : 'text-slate-900'
      }`}
      style={{ background: disabled ? 'var(--surface-1, #f3f3f3)' : 'var(--surface-2, #e2e2e2)', borderRadius: 0 }}
      data-testid={testId}
    />
  </div>
);

const GhostSelect = ({ label, value, onChange, options, testId, className = '' }) => (
  <div className={className}>
    <label className="label-arroba block mb-2 ml-0.5">{label}</label>
    <select
      value={value || ''}
      onChange={onChange}
      className="w-full border-0 border-b-2 border-slate-200/40 px-4 py-3 text-sm outline-none appearance-none cursor-pointer text-slate-900"
      style={{ background: 'var(--surface-2, #e2e2e2)', borderRadius: 0 }}
      data-testid={testId}
    >
      {options.map(o => (
        <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
          {typeof o === 'string' ? o : o.label}
        </option>
      ))}
    </select>
  </div>
);

const GhostTextarea = ({ label, value, onChange, placeholder, rows = 3, testId, className = '' }) => (
  <div className={className}>
    <label className="label-arroba block mb-2 ml-0.5">{label}</label>
    <textarea
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full border-0 border-b-2 border-slate-200/40 px-4 py-3 text-sm outline-none transition-colors focus:border-arroba-coral text-slate-900 resize-none"
      style={{ background: 'var(--surface-2, #e2e2e2)', borderRadius: 0 }}
      data-testid={testId}
    />
  </div>
);

const SectionLabel = ({ label, badge }) => (
  <div className="flex items-center justify-between mb-6">
    <h3 className="label-arroba" style={{ color: 'var(--outline, #76777d)' }}>{label}</h3>
    {badge === 'private' && (
      <span className="inline-flex items-center gap-1 px-3 py-1 text-[10px] font-bold" style={{ background: 'var(--secondary-container, #d5e0f8)', color: 'var(--on-secondary-container, #586377)' }}>
        <Lock size={10} /> PRIVADO
      </span>
    )}
    {badge === 'public' && (
      <span className="inline-flex items-center gap-1 px-3 py-1 text-[10px] font-bold" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
        <Eye size={10} /> PUBLICO
      </span>
    )}
  </div>
);

const DataSourceBadge = ({ source }) => {
  const config = {
    CIS: { label: 'CIS', bg: 'bg-blue-100 text-blue-700' },
    IBERINFORM: { label: 'Iberinform', bg: 'bg-green-100 text-green-700' },
    MANUAL: { label: 'Manual', bg: 'bg-slate-100 text-slate-600' },
    MIXED: { label: 'Mixto', bg: 'bg-yellow-100 text-yellow-700' },
  };
  const c = config[source] || config.MANUAL;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold ${c.bg}`} data-testid={`source-badge-${source}`}>
      <Database size={10} /> {c.label}
    </span>
  );
};

/* ─── Live Preview ─── */
const LivePreview = ({ companyData, financials, valuation, teaser }) => {
  const displayName = teaser?.title || companyData.trade_name || companyData.legal_name || 'Tu agencia';
  const desc = teaser?.short_description || companyData.description || 'Descripcion de tu agencia...';
  const location = companyData.city || companyData.region || 'Espana';
  const sector = companyData.company_type === 'digital_agency' ? 'Digital' : companyData.company_type === 'creative_agency' ? 'Creativa' : 'Agencia';
  const rev = financials[0]?.revenue;
  const revStr = rev ? `${(rev / 1e6).toFixed(1)}M` : '-';
  const ebitda = financials[0]?.ebitda;
  const ebitdaStr = ebitda ? `${(ebitda / 1e6).toFixed(1)}M` : '-';
  const empCount = companyData.employees_count || '?';
  const valStr = valuation
    ? `${(valuation.valuation_min / 1e6).toFixed(1)}M - ${(valuation.valuation_max / 1e6).toFixed(1)}M`
    : '-';

  return (
    <div style={{ background: 'var(--surface-lowest, #fff)', boxShadow: '0px 24px 64px rgba(26,28,28,0.05)' }} className="p-8">
      {/* Preview header */}
      <div className="flex items-center justify-between mb-8">
        <p className="label-arroba" style={{ color: 'var(--on-surface, #191c1e)' }}>LIVE PREVIEW</p>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <div className="w-2 h-2 rounded-full bg-green-400" />
        </div>
      </div>

      {/* Card preview */}
      <div className="w-full aspect-video mb-4 relative overflow-hidden" style={{ background: 'var(--surface-1, #f3f3f3)' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="label-arroba text-slate-400">IMAGEN DE PORTADA</span>
        </div>
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2 py-1 text-[10px] font-bold uppercase" style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}>
            {location.toUpperCase()}
          </span>
          <span className="px-2 py-1 text-[10px] font-bold uppercase" style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}>
            {sector.toUpperCase()}
          </span>
        </div>
      </div>

      <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">{displayName}</h3>
      <p className="text-sm text-slate-500 mt-2 line-clamp-2">{desc}</p>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-3 mt-5">
        <div className="py-2">
          <p className="label-arroba text-slate-400 mb-0.5">FACTURACION</p>
          <p className="text-sm font-bold text-slate-900">{revStr}</p>
        </div>
        <div className="py-2">
          <p className="label-arroba text-slate-400 mb-0.5">EBITDA</p>
          <p className="text-sm font-bold text-slate-900">{ebitdaStr}</p>
        </div>
        <div className="py-2">
          <p className="label-arroba text-slate-400 mb-0.5">EQUIPO</p>
          <p className="text-sm font-bold text-slate-900">{empCount}</p>
        </div>
      </div>

      {/* Valuation */}
      <div className="flex items-center justify-between mt-5 pt-5 border-t border-slate-100">
        <div className="flex -space-x-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-7 h-7 rounded-full border-2 border-white" style={{ background: 'var(--surface-2, #e2e2e2)' }} />
          ))}
          {companyData.employees_count > 3 && (
            <div className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500" style={{ background: 'var(--surface-2, #e2e2e2)' }}>
              +{companyData.employees_count - 3}
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="label-arroba text-slate-400">VALORACION EST.</p>
          <p className="text-lg font-black text-arroba-coral tracking-tight">{valStr}</p>
        </div>
      </div>

      {/* Trust signals */}
      <div className="mt-6 space-y-3">
        <div className="flex gap-3">
          <Lock size={14} className="text-slate-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-slate-700">Vendedor Verificado</p>
            <p className="text-[11px] text-slate-400">Documentacion legal validada</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Eye size={14} className="text-slate-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-slate-700">Identidad Protegida</p>
            <p className="text-[11px] text-slate-400">Solo visible tras NDA firmado</p>
          </div>
        </div>
      </div>

      {/* Coaching tip */}
      <div className="mt-6 p-4 -mx-8 -mb-8" style={{ background: 'var(--surface-1, #f3f3f3)' }}>
        <div className="flex gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: '#001d32', color: '#fff' }}>
            <Lightbulb size={12} />
          </div>
          <p className="text-[11px] italic leading-relaxed" style={{ color: '#004b74' }}>
            "Un perfil bien detallado atrae un 45% mas de ofertas cualificadas. Completa todos los campos para maximizar visibilidad."
          </p>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Wizard ─── */
const SellerWizard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { companyId: urlCompanyId } = useParams();
  const { user } = useAuth();

  const [step, setStep] = useState(parseInt(searchParams.get('step') || '0'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companyId, setCompanyId] = useState(urlCompanyId || searchParams.get('company') || null);
  const [dealId, setDealId] = useState(null);
  const [cifLookupLoading, setCifLookupLoading] = useState(false);
  const [cifLookupResult, setCifLookupResult] = useState(null);
  const [financialDataSource, setFinancialDataSource] = useState('MANUAL');

  const [companyData, setCompanyData] = useState({
    legal_name: '', trade_name: '', cif: '', country: 'España', region: '', city: '', province: '',
    street: '', postal_code: '', legal_form: '', company_status: '', cnae_code: '', cnae_label: '',
    company_type: 'digital_agency', sectors: [], specializations: [], founded_year: '',
    employees_count: '', description: '', highlights: ['', '', ''], website: '', linkedin: '',
    iberinform_synced: false, iberinform_synced_at: null,
  });

  const [financials, setFinancials] = useState([
    { year: new Date().getFullYear() - 1, revenue: '', ebitda: '', recurring_revenue_pct: '', client_concentration_top5: '', growth_rate: '', data_source: 'MANUAL' }
  ]);

  const [valuationInputs, setValuationInputs] = useState({
    founder_dependency: 'medium', recurring_revenue_type: 'mixed',
    main_clients: '', client_retention_rate: '', tech_assets: false, proprietary_ip: false
  });

  const [dealData, setDealData] = useState({
    operation_types_allowed: ['full_sale'], asking_price: '', price_negotiable: true
  });

  const [infomemo, setInfomemo] = useState(null);
  const [infomemoContent, setInfomemoContent] = useState('');
  const [generatingInfomemo, setGeneratingInfomemo] = useState(false);
  const [infomemoPreviewMode, setInfomemoPreviewMode] = useState(false);
  const [teaser, setTeaser] = useState(null);
  const [financialVisuals, setFinancialVisuals] = useState(null);
  const [visualsLoading, setVisualsLoading] = useState(false);
  const [generatingTeaser, setGeneratingTeaser] = useState(false);
  const [valuation, setValuation] = useState(null);
  const [taxonomyCategories, setTaxonomyCategories] = useState([]);

  /* ─── Data loading ─── */
  useEffect(() => {
    const loadTaxonomy = async () => {
      try {
        const { taxonomyAPI } = await import('../services/api');
        const response = await taxonomyAPI.getCategories();
        setTaxonomyCategories(response.data);
      } catch { /* fallback */ }
    };
    loadTaxonomy();
  }, []);

  useEffect(() => {
    if (companyId) loadCompany();
  }, [companyId]);

  const loadCompany = async () => {
    try {
      setLoading(true);
      const response = await companiesAPI.get(companyId);
      const company = response.data;
      setCompanyData({
        legal_name: company.legal_name || '', trade_name: company.trade_name || '',
        cif: company.cif || '', country: company.country || 'España',
        region: company.region || '', city: company.city || '',
        company_type: company.company_type || 'digital_agency',
        sectors: company.sectors || [], specializations: company.specializations || [],
        founded_year: company.founded_year || '', employees_count: company.employees_count || '',
        description: company.description || '',
        highlights: company.highlights?.length ? company.highlights : ['', '', ''],
        website: company.website || '', linkedin: company.linkedin || ''
      });
      if (company.financials?.length) {
        setFinancials(company.financials.map(f => ({
          year: f.year, revenue: f.revenue || '', ebitda: f.ebitda || '',
          recurring_revenue_pct: f.recurring_revenue_pct || '',
          client_concentration_top5: f.client_concentration_top5 || '',
          growth_rate: f.growth_rate || '', data_source: f.data_source || 'MANUAL'
        })));
      }
      if (company.valuation_inputs) {
        setValuationInputs({
          founder_dependency: company.valuation_inputs.founder_dependency || 'medium',
          recurring_revenue_type: company.valuation_inputs.recurring_revenue_type || 'mixed',
          main_clients: company.valuation_inputs.main_clients ?? '',
          client_retention_rate: company.valuation_inputs.client_retention_rate ?? '',
          tech_assets: company.valuation_inputs.tech_assets || false,
          proprietary_ip: company.valuation_inputs.proprietary_ip || false
        });
      }
      if (company.valuation) setValuation(company.valuation);
    } catch {
      setError('Error al cargar la compania');
    } finally { setLoading(false); }
  };

  /* ─── CIF Lookup ─── */
  const handleCifLookup = useCallback(async () => {
    const cif = companyData.cif?.trim();
    if (!cif || cif.length < 5) { setError('Introduce un CIF válido (mínimo 5 caracteres)'); return; }
    setCifLookupLoading(true); setError(''); setCifLookupResult(null);
    try {
      const response = await cifAPI.lookup(cif);
      const result = response.data;
      setCifLookupResult(result);
      if (result.found) {
        const info = result.company_info || {};
        // Autofill all verified fields (only if empty or user hasn't edited)
        setCompanyData(prev => ({
          ...prev,
          legal_name: info.legal_name || prev.legal_name,
          trade_name: info.trade_name || prev.trade_name,
          website: info.website || prev.website,
          city: info.city || prev.city,
          province: info.province || prev.province,
          region: info.province || prev.region,
          street: info.street || prev.street,
          postal_code: info.postal_code || prev.postal_code,
          legal_form: info.legal_form || info.acronym || prev.legal_form,
          company_status: info.company_status || prev.company_status,
          cnae_code: info.cnae_code || prev.cnae_code,
          cnae_label: info.cnae_description || prev.cnae_label,
          iberinform_synced: true,
          iberinform_synced_at: new Date().toISOString(),
        }));
        // Autofill financials with calculated EBITDA
        if (result.financials?.length) {
          setFinancials(result.financials.map(f => ({
            year: f.year, revenue: f.revenue || '', ebitda: f.ebitda || '',
            ebitda_margin: f.ebitda_margin || '',
            net_income: f.net_income || '',
            operating_result: f.operating_result || '',
            staff_costs: f.staff_costs || '',
            recurring_revenue_pct: f.recurring_revenue_pct || '', client_concentration_top5: f.client_concentration_top5 || '',
            growth_rate: f.growth_rate || '', data_source: f.data_source || result.source
          })));
          setFinancialDataSource(result.source);
        }
      }
    } catch { setCifLookupResult({ found: false, source: 'MANUAL' }); }
    finally { setCifLookupLoading(false); }
  }, [companyData.cif]);

  const handleCompanyChange = (field, value) => { setCompanyData(prev => ({ ...prev, [field]: value })); setError(''); };
  const handleHighlightChange = (index, value) => { const h = [...companyData.highlights]; h[index] = value; setCompanyData(prev => ({ ...prev, highlights: h })); };
  const handleFinancialChange = (index, field, value) => {
    const f = [...financials]; f[index] = { ...f[index], [field]: value };
    if (f[index].data_source !== 'MANUAL') f[index].data_source = 'MIXED';
    setFinancials(f);
  };
  const addFinancialYear = () => {
    const lastYear = financials[financials.length - 1]?.year || new Date().getFullYear();
    setFinancials([...financials, { year: lastYear - 1, revenue: '', ebitda: '', recurring_revenue_pct: '', client_concentration_top5: '', growth_rate: '', data_source: 'MANUAL' }]);
  };
  const removeFinancialYear = (index) => { if (financials.length > 1) setFinancials(financials.filter((_, i) => i !== index)); };

  /* ─── Save actions ─── */
  const saveCompanyBasics = async () => {
    if (!companyData.legal_name) { setError('El nombre legal es obligatorio'); return false; }
    setLoading(true); setError('');
    try {
      const payload = { ...companyData, founded_year: companyData.founded_year ? parseInt(companyData.founded_year) : null, employees_count: companyData.employees_count ? parseInt(companyData.employees_count) : null, highlights: companyData.highlights.filter(h => h.trim() !== '') };
      if (companyId) { await companiesAPI.update(companyId, payload); } else { const r = await companiesAPI.create(payload); setCompanyId(r.data.company_id); }
      return true;
    } catch (err) { setError(err.response?.data?.detail || 'Error al guardar'); return false; }
    finally { setLoading(false); }
  };

  const saveFinancials = async () => {
    if (!companyId) { setError('Primero debes crear la compania'); return false; }
    if (!financials.some(f => f.revenue)) { setError('Indica la facturacion de al menos un ano'); return false; }
    setLoading(true); setError('');
    try {
      const payload = {
        financials: financials.map(f => ({
          year: parseInt(f.year), revenue: parseFloat(f.revenue) || 0, ebitda: parseFloat(f.ebitda) || 0,
          ebitda_margin: f.revenue && f.ebitda ? (parseFloat(f.ebitda) / parseFloat(f.revenue)) * 100 : 0,
          recurring_revenue_pct: parseFloat(f.recurring_revenue_pct) || 0,
          client_concentration_top5: parseFloat(f.client_concentration_top5) || 0,
          growth_rate: parseFloat(f.growth_rate) || 0, data_source: f.data_source || 'MANUAL'
        })),
        valuation_inputs: { ...valuationInputs, main_clients: parseInt(valuationInputs.main_clients) || null, client_retention_rate: parseFloat(valuationInputs.client_retention_rate) || null }
      };
      await companiesAPI.updateFinancials(companyId, payload);
      return true;
    } catch (err) { setError(err.response?.data?.detail || 'Error al guardar financieros'); return false; }
    finally { setLoading(false); }
  };

  const calculateValuation = async () => {
    if (!companyId) return false;
    setLoading(true); setError('');
    try { const r = await companiesAPI.calculateValuation(companyId); setValuation(r.data.valuation); return true; }
    catch (err) { setError(err.response?.data?.detail || 'Error al calcular valoracion'); return false; }
    finally { setLoading(false); }
  };

  const createDeal = async () => {
    if (!companyId) { setError('Primero debes crear la compania'); return false; }
    setLoading(true); setError('');
    try {
      const payload = { company_id: companyId, operation_types_allowed: dealData.operation_types_allowed, asking_price: dealData.asking_price ? parseFloat(dealData.asking_price) : null, price_negotiable: dealData.price_negotiable };
      const r = await dealsAPI.create(payload); setDealId(r.data.deal_id); return true;
    } catch (err) {
      if (err.response?.data?.detail?.includes('already has an active deal')) {
        const dr = await dealsAPI.list(); const ed = dr.data.find(d => d.company_id === companyId);
        if (ed) { setDealId(ed.deal_id); return true; }
      }
      setError(err.response?.data?.detail || 'Error al crear el deal'); return false;
    } finally { setLoading(false); }
  };

  const generateTeaser = async () => {
    if (!companyId) return;
    setGeneratingTeaser(true); setError('');
    try { const r = await teaserAPI.generate(companyId); setTeaser(r.data.teaser); }
    catch (err) { setError(err.response?.data?.detail || 'Error al generar teaser'); }
    finally { setGeneratingTeaser(false); }
  };

  const generateInfomemo = async () => {
    if (!companyId) return;
    setGeneratingInfomemo(true); setError('');
    try { const r = await infomemoAPI.generate(companyId); setInfomemo(r.data.infomemo); setInfomemoContent(r.data.infomemo.content); }
    catch (err) { setError(err.response?.data?.detail || 'Error al generar infomemo'); }
    finally { setGeneratingInfomemo(false); }
  };

  const saveInfomemo = async () => {
    if (!dealId || !infomemoContent) return false;
    setLoading(true);
    try { await infomemoAPI.update(dealId, infomemoContent); return true; }
    catch (err) { setError(err.response?.data?.detail || 'Error al guardar infomemo'); return false; }
    finally { setLoading(false); }
  };

  const handleGenerateVisuals = async () => {
    if (!companyId) return;
    setVisualsLoading(true);
    try {
      const res = await companiesAPI.generateVisuals(companyId);
      setFinancialVisuals(res.data.visuals);
    } catch (err) { /* visual gen error */; }
    finally { setVisualsLoading(false); }
  };

  const handleVisualToggle = async (chartId, key, value) => {
    if (!companyId || !financialVisuals) return;
    const updated = { ...financialVisuals, [chartId]: { ...financialVisuals[chartId], [key]: value } };
    setFinancialVisuals(updated);
    try { await companiesAPI.updateVisualSettings(companyId, { [chartId]: { [key]: value } }); }
    catch { /* revert silently if needed */ }
  };

  // Load existing visuals when company is loaded
  useEffect(() => {
    if (companyId) {
      companiesAPI.getVisuals(companyId).then(res => {
        if (res.data?.financial_visuals) setFinancialVisuals(res.data.financial_visuals);
      }).catch(() => {});
    }
  }, [companyId]);

  const nextStep = async () => {
    let success = true;
    switch (step) {
      case 0: success = await saveCompanyBasics(); break;
      case 1: success = await saveFinancials(); if (success && companyId) { handleGenerateVisuals(); } break;
      case 2: success = await calculateValuation(); break;
      case 3: success = await createDeal(); break;
      case 4:
        if (infomemoContent) success = await saveInfomemo();
        if (success) { navigate(`/seller/deal/${dealId}`); return; }
        break;
      default: break;
    }
    if (success && step < 4) { setStep(step + 1); setError(''); }
  };

  const prevStep = () => { if (step > 0) { setStep(step - 1); setError(''); } };

  /* ─── Render ─── */
  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-0, #f9f9f9)' }} data-testid="seller-wizard">
      {/* ─── SIDEBAR ─── */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 flex flex-col z-40" style={{ background: 'var(--surface-1, #f3f3f3)', paddingTop: 80 }}>
        <div className="px-6 mb-8">
          <button onClick={() => navigate('/seller')} className="text-2xl font-black tracking-tight text-arroba-coral mb-2 block">arroba</button>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Venta de Agencia</h2>
          <p className="label-arroba text-slate-400 mt-1">PROGRESO DEL LISTADO</p>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-3">
          {sidebarSteps.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <button
                key={s.id}
                onClick={() => { if (i <= step) setStep(i); }}
                className={`flex items-center gap-3 px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'text-arroba-coral'
                    : isDone
                    ? 'text-slate-600 cursor-pointer'
                    : 'text-slate-400 cursor-not-allowed'
                }`}
                style={{
                  background: isActive ? 'var(--surface-lowest, #fff)' : 'transparent',
                  boxShadow: isActive ? '0px 4px 12px rgba(26,28,28,0.06)' : 'none',
                }}
                data-testid={`sidebar-step-${s.id}`}
              >
                {isDone ? <Check size={16} className="text-green-500" /> : <Icon size={16} />}
                <span>{s.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-4 pb-8">
          <button
            onClick={() => navigate('/seller')}
            className="w-full py-3 px-4 text-sm font-bold tracking-tight flex items-center justify-center gap-2"
            style={{ background: 'var(--on-surface, #191c1e)', color: '#fff' }}
          >
            <ArrowLeft size={14} /> GUARDAR Y SALIR
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="ml-64 min-h-screen" style={{ paddingTop: 32 }}>
        <div className="max-w-[1200px] mx-auto px-8 pb-16">
          {/* Top step indicator */}
          <div className="flex items-center justify-between mb-12">
            {['Compañía', 'Financieros', 'Valoración', 'Operación', 'Contenido'].map((label, i) => (
              <React.Fragment key={i}>
                <div className={`flex items-center ${i <= step ? 'opacity-100' : 'opacity-35'}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                    i < step ? 'bg-green-500 text-white' : i === step ? 'bg-arroba-coral text-white' : 'text-slate-400'
                  }`} style={{ background: i >= step && i !== step ? 'var(--surface-2, #e2e2e2)' : undefined }}>
                    {i < step ? <Check size={14} /> : i + 1}
                  </div>
                  <div className="ml-3">
                    <p className="label-arroba" style={{ color: i === step ? 'var(--arroba-primary)' : 'var(--outline)' }}>PASO {i + 1}</p>
                    <p className="text-sm font-bold text-slate-900 tracking-tight">{label}</p>
                  </div>
                </div>
                {i < 4 && (
                  <div className="flex-1 h-0.5 mx-4" style={{ background: 'var(--surface-2, #e2e2e2)' }}>
                    {i < step && <div className="h-full bg-green-500 w-full" />}
                    {i === step && <div className="h-full bg-arroba-coral" style={{ width: '25%' }} />}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 flex items-center gap-2 text-sm" style={{ background: 'rgba(220,38,38,0.05)', color: '#dc2626' }} data-testid="wizard-error">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Layout: full-width for Financieros (step 1), 60/40 for others */}
          <div className={step === 1 ? '' : 'flex gap-10 items-start'}>
            {/* LEFT: Form */}
            <div className={step === 1 ? 'w-full' : 'w-[60%]'}>
              {/* STEP 0: Datos basicos */}
              {step === 0 && (
                <div data-testid="step-basics">
                  <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>Datos de la compañía</h1>
                  <p className="text-sm max-w-md mb-10" style={{ color: 'var(--outline)' }}>
                    Introduce el CIF para autocompletar datos registrales y financieros. Después completa la información cualitativa de tu agencia.
                  </p>

                  {/* ── BLOQUE 1: Buscar por CIF ── */}
                  <div className="mb-8">
                    <SectionLabel label="BUSCAR COMPAÑÍA POR CIF" badge="private" />
                    <div className="grid grid-cols-2 gap-6 mb-4">
                      <GhostInput label="CIF / NIF" value={companyData.cif} onChange={(e) => handleCompanyChange('cif', e.target.value.toUpperCase())} placeholder="B12345678" testId="input-cif" />
                      <div>
                        <label className="label-arroba block mb-2 ml-0.5">BUSCAR DATOS</label>
                        <button onClick={handleCifLookup} disabled={cifLookupLoading || !companyData.cif}
                          className="w-full px-5 py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: 'var(--on-surface)', color: '#fff' }} data-testid="cif-lookup-btn">
                          {cifLookupLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} BUSCAR EN REGISTRO
                        </button>
                      </div>
                    </div>
                    {cifLookupResult && (
                      <div className={`p-3 text-xs font-semibold ${cifLookupResult.found ? 'text-green-700' : 'text-amber-600'}`} style={{ background: cifLookupResult.found ? 'rgba(22,163,74,0.06)' : 'rgba(217,119,6,0.06)' }} data-testid="cif-lookup-result">
                        {cifLookupResult.found ? (<span className="flex items-center gap-1"><Check size={12} /> Datos registrales y financieros encontrados — <DataSourceBadge source={cifLookupResult.source} /></span>) : 'CIF no encontrado — introduce los datos manualmente'}
                      </div>
                    )}
                  </div>

                  {/* ── BLOQUE 2: Datos verificados (Iberinform) ── */}
                  {companyData.iberinform_synced && (
                    <div className="mb-8 p-5" style={{ background: 'rgba(22,163,74,0.03)', borderLeft: '3px solid #16a34a' }}>
                      <div className="flex items-center gap-2 mb-4">
                        <DataSourceBadge source="IBERINFORM" />
                        <span className="text-[10px]" style={{ color: 'var(--outline)' }}>Datos del registro · Revisables y editables</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <GhostInput label="DENOMINACIÓN SOCIAL" value={companyData.legal_name} onChange={(e) => handleCompanyChange('legal_name', e.target.value)} placeholder="Razón social" testId="input-legal-name" />
                        <GhostInput label="FORMA JURÍDICA" value={companyData.legal_form} onChange={(e) => handleCompanyChange('legal_form', e.target.value)} placeholder="SL" testId="input-legal-form" />
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <GhostInput label="CIUDAD" value={companyData.city} onChange={(e) => handleCompanyChange('city', e.target.value)} placeholder="Madrid" testId="input-city" />
                        <GhostInput label="PROVINCIA" value={companyData.province} onChange={(e) => handleCompanyChange('province', e.target.value)} placeholder="Madrid" testId="input-province" />
                        <GhostInput label="CP" value={companyData.postal_code} onChange={(e) => handleCompanyChange('postal_code', e.target.value)} placeholder="28001" testId="input-postal" />
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <GhostInput label="CNAE" value={companyData.cnae_code ? `${companyData.cnae_code} — ${companyData.cnae_label}` : ''} onChange={() => {}} placeholder="—" testId="input-cnae" className="opacity-70 pointer-events-none" />
                        <GhostInput label="SITIO WEB" value={companyData.website} onChange={(e) => handleCompanyChange('website', e.target.value)} placeholder="https://miagencia.com" testId="input-website" />
                      </div>
                      {financialDataSource === 'IBERINFORM' && financials.length > 0 && (
                        <div>
                          <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>FINANCIEROS ENCONTRADOS</p>
                          <div className="grid grid-cols-3 gap-3">
                            {financials.slice(0, 3).map(f => (
                              <div key={f.year} className="p-3" style={{ background: 'var(--surface-lowest)' }}>
                                <p className="text-[10px] font-bold" style={{ color: 'var(--outline)' }}>{f.year}</p>
                                <p className="text-sm font-black" style={{ color: 'var(--on-surface)' }}>{f.revenue ? `${(f.revenue / 1e6).toFixed(1).replace('.', ',')}M€` : '—'}</p>
                                <p className="text-[10px]" style={{ color: 'var(--outline)' }}>EBITDA: {f.ebitda ? `${(f.ebitda / 1e3).toFixed(0)}K€ (${f.ebitda_margin || '—'}%)` : '—'}</p>
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] mt-2" style={{ color: 'var(--outline)' }}>Estos datos financieros se cargarán automáticamente en el siguiente paso. Podrás revisarlos y editarlos.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── BLOQUE 2b: Info legal manual (si no hay Iberinform) ── */}
                  {!companyData.iberinform_synced && (
                    <div className="mb-8">
                      <SectionLabel label="INFORMACIÓN LEGAL" badge="private" />
                      <GhostInput label="DENOMINACIÓN SOCIAL *" value={companyData.legal_name} onChange={(e) => handleCompanyChange('legal_name', e.target.value)} placeholder="Mi Agencia S.L." testId="input-legal-name" className="mb-6" />
                    </div>
                  )}

                  {/* ── BLOQUE 3: Datos del seller (cualitativos) ── */}
                  <div className="mb-8">
                    <SectionLabel label={companyData.iberinform_synced ? "COMPLETA LA INFORMACIÓN DE TU AGENCIA" : "PERFIL PÚBLICO"} badge="public" />
                    {companyData.iberinform_synced && (
                      <p className="text-xs mb-4" style={{ color: 'var(--outline)' }}>Estos datos no pueden obtenerse del registro. Completa la información cualitativa de tu agencia.</p>
                    )}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      {!companyData.iberinform_synced && (
                        <>
                          <GhostSelect label="PAÍS" value={companyData.country} onChange={(e) => handleCompanyChange('country', e.target.value)} options={[{value: 'España', label: 'España'}]} testId="select-country" />
                          <GhostInput label="CIUDAD" value={companyData.city} onChange={(e) => handleCompanyChange('city', e.target.value)} placeholder="Madrid" testId="input-city" />
                        </>
                      )}
                      <GhostInput label="NOMBRE COMERCIAL" value={companyData.trade_name} onChange={(e) => handleCompanyChange('trade_name', e.target.value)} placeholder="Nombre de marca" testId="input-trade-name" />
                      <GhostInput label="AÑO DE FUNDACIÓN" value={companyData.founded_year} onChange={(e) => handleCompanyChange('founded_year', e.target.value)} type="number" placeholder="2015" testId="input-founded-year" />
                    </div>
                    {!companyData.iberinform_synced && (
                      <GhostInput label="SITIO WEB (URL)" value={companyData.website} onChange={(e) => handleCompanyChange('website', e.target.value)} placeholder="https://miagencia.com" testId="input-website" className="mb-6" />
                    )}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <GhostInput label="EMPLEADOS" value={companyData.employees_count} onChange={(e) => handleCompanyChange('employees_count', e.target.value)} type="number" placeholder="25" testId="input-employees" />
                      <GhostSelect label="TIPO DE AGENCIA" value={companyData.company_type} onChange={(e) => handleCompanyChange('company_type', e.target.value)} options={[{value:'digital_agency',label:'Agencia Digital'},{value:'creative_agency',label:'Agencia Creativa'},{value:'media_agency',label:'Agencia de Medios'},{value:'tech_studio',label:'Estudio Tecnológico'},{value:'consultancy',label:'Consultoría'}]} testId="select-type" />
                    </div>

                    {/* Taxonomy categories */}
                    {taxonomyCategories.length > 0 && (
                      <div className="mb-6">
                        <label className="label-arroba block mb-2">CATEGORIA PRINCIPAL (MAX. 3)</label>
                        <div className="flex flex-wrap gap-2">
                          {taxonomyCategories.map(cat => (
                            <button key={cat.id} type="button" onClick={() => {
                              if (companyData.sectors.includes(cat.id)) handleCompanyChange('sectors', companyData.sectors.filter(s => s !== cat.id));
                              else if (companyData.sectors.length < 3) handleCompanyChange('sectors', [...companyData.sectors, cat.id]);
                            }}
                              className={`px-3 py-1.5 text-xs font-bold transition-colors ${companyData.sectors.includes(cat.id) ? 'text-white' : 'text-slate-600'}`}
                              style={{ background: companyData.sectors.includes(cat.id) ? 'var(--on-surface, #191c1e)' : 'var(--surface-2, #e2e2e2)' }}
                              data-testid={`category-${cat.id}`}>
                              {cat.name} {companyData.sectors.includes(cat.id) && <X size={10} className="inline ml-1" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <GhostTextarea label="DESCRIPCION DEL NEGOCIO" value={companyData.description} onChange={(e) => handleCompanyChange('description', e.target.value)} placeholder="Describe brevemente que hace tu agencia..." testId="input-description" className="mb-6" />

                    <div>
                      <label className="label-arroba block mb-2">HIGHLIGHTS (PUNTOS FUERTES)</label>
                      <div className="space-y-2">
                        {companyData.highlights.map((h, i) => (
                          <GhostInput key={i} label="" value={h} onChange={(e) => handleHighlightChange(i, e.target.value)} placeholder={`Highlight ${i + 1}`} testId={`input-highlight-${i}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 1: Financieros — full-width financial statements */}
              {step === 1 && (
                <div data-testid="step-financials" style={{ width: '100%', maxWidth: 'none' }}>
                  <FinancialStatementsStep
                    financials={financials}
                    setFinancials={setFinancials}
                    financialDataSource={financialDataSource}
                    valuationInputs={valuationInputs}
                    setValuationInputs={setValuationInputs}
                    onRecalculate={null}
                  />
                </div>
              )}

              {/* STEP 2: Valoracion */}
              {step === 2 && (
                <div data-testid="step-valuation">
                  <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>Valoración y visuales</h1>
                  <p className="text-sm mb-8" style={{ color: 'var(--outline)', maxWidth: 500 }}>Valoración estimada a partir de los datos financieros validados, junto con los gráficos reutilizables para teaser e infomemo.</p>

                  {/* Valuation */}
                  {valuation ? (
                    <div className="mb-10">
                      <div className="text-center p-8 mb-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 12px rgba(25,28,30,0.04)' }}>
                        <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>RANGO DE VALORACIÓN ESTIMADO</p>
                        <p className="text-4xl font-black tracking-tight" style={{ color: 'var(--arroba-primary)', letterSpacing: '-0.03em' }}>
                          {fmtMillions(valuation.valuation_min)} — {fmtMillions(valuation.valuation_max)}
                        </p>
                        <p className="text-sm mt-2" style={{ color: 'var(--outline)' }}>
                          Múltiplo EBITDA: {valuation.multiple_min?.toFixed(1)}x — {valuation.multiple_max?.toFixed(1)}x
                        </p>
                      </div>
                      {valuation.drivers?.length > 0 && (
                        <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 1px 4px rgba(25,28,30,0.03)' }}>
                          <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>FACTORES CONSIDERADOS</p>
                          <div className="space-y-1.5">
                            {valuation.drivers.map((d, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--outline)' }}>
                                <Check size={12} className="mt-0.5 shrink-0" style={{ color: '#16a34a' }} /> {d}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 mb-8" style={{ background: 'var(--surface-1)' }}>
                      <TrendingUp size={32} className="mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} />
                      <p className="text-sm" style={{ color: 'var(--outline)' }}>Pulsa "Siguiente" para calcular la valoración</p>
                    </div>
                  )}

                  {/* Financial Visuals */}
                  <div className="mt-8">
                    <FinancialVisualsGallery
                      visuals={financialVisuals}
                      loading={visualsLoading}
                      onToggle={handleVisualToggle}
                      onRegenerate={handleGenerateVisuals}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Deal */}
              {step === 3 && (
                <div data-testid="step-deal">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Configuracion del deal</h1>
                  <p className="text-sm text-slate-500 mb-10">Define las condiciones de la operacion.</p>

                  <div className="mb-8">
                    <SectionLabel label="TIPO DE OPERACION" />
                    <div className="space-y-3">
                      {[{ id: 'full_sale', label: 'Venta total (100%)' }, { id: 'partial_sale', label: 'Venta parcial (minoritaria)' }, { id: 'merger', label: 'Fusion' }].map(op => (
                        <label key={op.id} className="flex items-center gap-3 p-3 cursor-pointer transition-colors hover:opacity-80"
                          style={{ background: dealData.operation_types_allowed.includes(op.id) ? 'rgba(182,33,42,0.04)' : 'var(--surface-2, #e2e2e2)' }}>
                          <input type="checkbox" checked={dealData.operation_types_allowed.includes(op.id)}
                            onChange={(e) => {
                              if (e.target.checked) setDealData({...dealData, operation_types_allowed: [...dealData.operation_types_allowed, op.id]});
                              else setDealData({...dealData, operation_types_allowed: dealData.operation_types_allowed.filter(o => o !== op.id)});
                            }}
                            data-testid={`checkbox-op-${op.id}`} />
                          <span className="text-sm font-semibold text-slate-700">{op.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <GhostInput label="PRECIO SOLICITADO (EUR)" value={dealData.asking_price} onChange={(e) => setDealData({...dealData, asking_price: e.target.value})}
                      type="number" placeholder={valuation ? `Sugerido: ${(valuation.valuation_min/1e6).toFixed(1)}M - ${(valuation.valuation_max/1e6).toFixed(1)}M` : 'Ej: 2000000'} testId="input-asking-price" />
                    {valuation && (
                      <p className="text-xs text-slate-400 mt-2">Valoracion calculada: {(valuation.valuation_min/1e6).toFixed(1)}M - {(valuation.valuation_max/1e6).toFixed(1)}M EUR</p>
                    )}
                  </div>

                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={dealData.price_negotiable} onChange={(e) => setDealData({...dealData, price_negotiable: e.target.checked})} data-testid="checkbox-negotiable" />
                    Precio negociable
                  </label>
                </div>
              )}

              {/* STEP 4: Teaser & Infomemo */}
              {step === 4 && (
                <div className="space-y-8" data-testid="step-teaser-infomemo">
                  {/* Teaser */}
                  <div className="p-6" style={{ background: 'var(--surface-lowest, #fff)', boxShadow: '0 2px 8px rgba(25,28,30,0.03)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <Eye size={16} className="text-arroba-blue" />
                      <h2 className="font-bold text-lg text-slate-900">Teaser (Publico)</h2>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">Resumen anonimizado visible en el listado de agencias.</p>
                    {!teaser && !generatingTeaser ? (
                      <div className="text-center py-8" style={{ background: 'var(--surface-1, #f3f3f3)' }}>
                        <Eye size={32} className="mx-auto mb-3 text-slate-300" />
                        <p className="text-sm text-slate-500 mb-4">Genera el teaser anonimizado</p>
                        <button onClick={generateTeaser} className="btn-primary px-6 py-2 text-sm" data-testid="generate-teaser-btn">GENERAR TEASER</button>
                      </div>
                    ) : generatingTeaser ? (
                      <div className="text-center py-10"><Loader2 size={24} className="animate-spin text-arroba-blue mx-auto mb-3" /><p className="text-sm text-slate-500">Generando teaser...</p></div>
                    ) : (
                      <div className="p-4" style={{ background: 'var(--surface-1, #f3f3f3)' }} data-testid="teaser-preview">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-[11px] text-slate-400">{teaser.sector_display}</span>
                            <h3 className="font-bold text-lg text-slate-900">{teaser.title}</h3>
                          </div>
                          <button onClick={generateTeaser} className="text-xs font-bold text-slate-500 px-2 py-1" style={{ background: 'var(--surface-2)' }} data-testid="regenerate-teaser-btn">REGENERAR</button>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{teaser.short_description}</p>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          {teaser.revenue_range && <div className="p-2" style={{ background: 'var(--surface-lowest)' }}><p className="label-arroba text-slate-400">FACTURACION</p><p className="font-bold text-slate-900">{teaser.revenue_range}</p></div>}
                          {teaser.ebitda_range && <div className="p-2" style={{ background: 'var(--surface-lowest)' }}><p className="label-arroba text-slate-400">EBITDA</p><p className="font-bold text-slate-900">{teaser.ebitda_range}</p></div>}
                          {teaser.location && <div className="p-2" style={{ background: 'var(--surface-lowest)' }}><p className="label-arroba text-slate-400">UBICACION</p><p className="font-bold text-slate-900">{teaser.location}</p></div>}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Infomemo */}
                  <div className="p-6" style={{ background: 'var(--surface-lowest, #fff)', boxShadow: '0 2px 8px rgba(25,28,30,0.03)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={16} className="text-arroba-coral" />
                      <h2 className="font-bold text-lg text-slate-900">Information Memorandum (Post-NDA)</h2>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">Documento detallado visible solo tras NDA.</p>
                    {!infomemo && !generatingInfomemo ? (
                      <div className="text-center py-8" style={{ background: 'var(--surface-1, #f3f3f3)' }}>
                        <FileText size={32} className="mx-auto mb-3 text-slate-300" />
                        <p className="text-sm text-slate-500 mb-4">Genera el infomemo con IA</p>
                        <button onClick={generateInfomemo} className="btn-primary px-6 py-2 text-sm" data-testid="generate-infomemo-btn">GENERAR INFOMEMO</button>
                      </div>
                    ) : generatingInfomemo ? (
                      <div className="text-center py-10"><Loader2 size={24} className="animate-spin text-arroba-coral mx-auto mb-3" /><p className="text-sm text-slate-500">Generando infomemo con IA...</p><p className="text-xs text-slate-400 mt-1">Esto puede tardar hasta 30 segundos</p></div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs text-slate-400">Version {infomemo.version} · Generado el {new Date(infomemo.generated_at).toLocaleDateString('es-ES')}</p>
                          <div className="flex gap-2">
                            <button onClick={() => setInfomemoPreviewMode(!infomemoPreviewMode)} className="text-xs font-bold text-slate-500 px-2 py-1 flex items-center gap-1" style={{ background: 'var(--surface-2)' }} data-testid="toggle-preview-btn">
                              {infomemoPreviewMode ? <><Edit3 size={10} /> EDITAR</> : <><Eye size={10} /> PREVIEW</>}
                            </button>
                            <button onClick={generateInfomemo} className="text-xs font-bold text-slate-500 px-2 py-1" style={{ background: 'var(--surface-2)' }} data-testid="regenerate-infomemo-btn">REGENERAR</button>
                          </div>
                        </div>
                        {infomemoPreviewMode ? (
                          <div className="prose prose-sm max-w-none p-6" style={{ background: 'var(--surface-1)' }} data-testid="infomemo-preview">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{infomemoContent}</ReactMarkdown>
                          </div>
                        ) : (
                          <textarea value={infomemoContent} onChange={(e) => setInfomemoContent(e.target.value)}
                            className="w-full min-h-[350px] border-0 px-4 py-3 text-sm font-mono outline-none resize-none" style={{ background: 'var(--surface-2, #e2e2e2)', borderRadius: 0 }} data-testid="infomemo-editor" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-10">
                <button onClick={prevStep} disabled={step === 0 || loading}
                  className="flex items-center gap-2 text-sm font-bold text-slate-500 disabled:opacity-30">
                  <ArrowLeft size={14} /> GUARDAR Y VOLVER
                </button>
                <button onClick={nextStep} disabled={loading || (step === 4 && !teaser && !infomemo)}
                  className="btn-primary px-10 py-4 text-sm flex items-center gap-3 disabled:opacity-50"
                  data-testid="next-step-btn">
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {step === 4 ? 'FINALIZAR' : 'SIGUIENTE PASO'}
                  {!loading && step < 4 && <ArrowRight size={14} />}
                </button>
              </div>
            </div>

            {/* RIGHT: Live Preview (40%) — hidden in step 1 (Financieros) */}
            {step !== 1 && (
            <div className="w-[40%] sticky top-8">
              <LivePreview companyData={companyData} financials={financials} valuation={valuation} teaser={teaser} />
            </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SellerWizard;
