import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { companiesAPI, dealsAPI, sellerProfilesAPI, taxonomyAPI } from '../services/api';
import { FinancialVisualsGallery } from '../components/FinancialVisualCard';
import FinancialStatementsStep from '../components/FinancialStatementsStep';
import { fmtES, fmtMillions } from '../utils/formatES';
import { NumericInputES } from '../components/NumericInputES';
import {
  Building2, FileText, TrendingUp, BarChart3, Briefcase,
  Check, Loader2, Search, ArrowLeft, ArrowRight, AlertCircle,
  Shield, CheckCircle2, Info, RefreshCw, Eye, XCircle
} from 'lucide-react';

const STATUS = { empty: { label: 'Sin completar', color: 'var(--outline-variant)' }, partial: { label: 'Parcial', color: '#d97706' }, complete: { label: 'Completo', color: '#16a34a' }, needs_review: { label: 'Revisar', color: 'var(--arroba-primary)' } };
const PANELS = [
  { id: 'compania', label: 'Compañía', icon: Building2 },
  { id: 'ficha', label: 'Ficha', icon: FileText },
  { id: 'financieros', label: 'Financieros', icon: BarChart3 },
  { id: 'valoracion', label: 'Valoración', icon: TrendingUp },
  { id: 'operacion', label: 'Operación', icon: Briefcase },
];
const PanelNav = ({ onSave, onSaveNext, onBack, saving, canBack }) => (
  <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: '1px solid var(--surface-2)' }}>
    {canBack ? <button onClick={onBack} className="flex items-center gap-1 text-xs font-bold" style={{ color: 'var(--outline)' }}><ArrowLeft size={12} /> ANTERIOR</button> : <div />}
    <div className="flex gap-3">
      <button onClick={onSave} disabled={saving} className="px-5 py-2.5 text-[11px] font-bold flex items-center gap-2 disabled:opacity-50" style={{ background: 'var(--surface-2)', color: 'var(--on-surface)' }}>{saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} GUARDAR</button>
      {onSaveNext && <button onClick={onSaveNext} disabled={saving} className="px-5 py-2.5 text-[11px] font-bold flex items-center gap-2 disabled:opacity-50" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>GUARDAR Y SIGUIENTE <ArrowRight size={11} /></button>}
    </div>
  </div>
);
const Tip = ({ text }) => (<div className="flex items-start gap-1.5 mt-1"><Info size={10} className="shrink-0 mt-0.5" style={{ color: 'var(--outline)' }} /><p className="text-[10px]" style={{ color: 'var(--outline)', lineHeight: 1.4 }}>{text}</p></div>);

const QUAL = [
  { id: 'founder_dependency', label: 'Dependencia del fundador', type: 'select', options: [{v:'low',l:'Baja'},{v:'medium',l:'Media'},{v:'high',l:'Alta'}] },
  { id: 'recurring_revenue_pct', label: '% Ingresos recurrentes', type: 'number', placeholder: '70' },
  { id: 'client_concentration_top5', label: '% Concentración top 5', type: 'number', placeholder: '40' },
  { id: 'revenue_visibility', label: 'Visibilidad de ingresos', type: 'select', options: [{v:'high',l:'Alta'},{v:'medium',l:'Media'},{v:'low',l:'Baja'}] },
  { id: 'client_diversification', label: 'Diversificación', type: 'select', options: [{v:'high',l:'Alta'},{v:'medium',l:'Media'},{v:'low',l:'Baja'}] },
  { id: 'margin_stability', label: 'Estabilidad márgenes', type: 'select', options: [{v:'stable',l:'Estables'},{v:'improving',l:'Mejorando'},{v:'declining',l:'Empeorando'}] },
];

const OP_TYPES = [
  { id: 'full_sale', label: 'Venta total' },
  { id: 'partial_sale', label: 'Venta parcial' },
  { id: 'investment', label: 'Búsqueda de socio / inversión' },
  { id: 'merger', label: 'Fusión / integración' },
];

const SellerCompanyWorkspace = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [panel, setPanel] = useState('compania');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [company, setCompany] = useState({});
  const [profileId, setProfileId] = useState(null);
  const [deal, setDeal] = useState(null);
  const [financials, setFinancials] = useState([]);
  const [finSource, setFinSource] = useState('MANUAL');
  const [valuation, setValuation] = useState(null);
  const [visuals, setVisuals] = useState(null);
  const [visualsLoading, setVisualsLoading] = useState(false);
  const [cifLoading, setCifLoading] = useState(false);
  const [cifError, setCifError] = useState('');
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [coverage, setCoverage] = useState({});
  const [source, setSource] = useState('');
  const [overrides, setOverrides] = useState({ trade_name:'', description:'', employees_count:'', founded_year:'', taxonomy_category:'', taxonomy_subcategory:'', founder_dependency:'medium', recurring_revenue_pct:'', client_concentration_top5:'', revenue_visibility:'medium', client_diversification:'medium', margin_stability:'stable', sale_motivation:'', ebitda_explanation:'', operation_types: [] });
  const [pricing, setPricing] = useState({ price_strategy:'not_set', asking_price:'', comfort_margin_pct:'', offers_mode:'formal', internal_price_reference:'', minimum_interest_price:'' });
  const [ps, setPs] = useState({ compania:'empty', ficha:'empty', financieros:'empty', valoracion:'empty', operacion:'empty' });
  const [valInputs, setValInputs] = useState({ founder_dependency:'medium', recurring_revenue_type:'mixed' });

  // Load taxonomy
  useEffect(() => { taxonomyAPI.getCategories().then(r => setCategories(r.data)).catch(() => {}); }, []);

  // Load subcategories when category changes + fix CIS/local taxonomy name mismatch
  useEffect(() => {
    if (overrides.taxonomy_category) {
      const cat = categories.find(c => c.name === overrides.taxonomy_category || c.id === overrides.taxonomy_category);
      const subs = cat?.subcategories || [];
      setSubcategories(subs);
      if (overrides.taxonomy_subcategory && subs.length > 0) {
        const exact = subs.find(s => s.name === overrides.taxonomy_subcategory);
        if (!exact) {
          const partial = subs.find(s => s.name.startsWith(overrides.taxonomy_subcategory) || s.name.includes(overrides.taxonomy_subcategory));
          if (partial) setOverrides(p => ({...p, taxonomy_subcategory: partial.name}));
        }
      }
    }
  }, [overrides.taxonomy_category, categories]);

  // Hydrate on mount
  useEffect(() => {
    const load = async () => {
      try {
        if (companyId) {
          // 1. Try seller_company_profile by company_id
          let prof = null;
          try { const r = await sellerProfilesAPI.getByCompany(companyId); prof = r.data; } catch { /* fallback */ }
          // 2. Load ARROBA company
          let comp = null;
          try { const r = await companiesAPI.get(companyId); comp = r.data; } catch { /* fallback */ }
          // 3. If no profile but company has CIF, try by CIF
          if (!prof && comp?.cif) {
            try { const r = await sellerProfilesAPI.getByCif(comp.cif); prof = r.data; } catch { /* fallback */ }
          }
          // Hydrate from profile
          if (prof) {
            setProfileId(prof.profile_id);
            const ap = prof.auto_prefilled || {};
            const id = ap.identity || {};
            setCompany({ ...id, company_master_id: prof.company_master_id, iberinform_synced: true, ...(comp || {}) });
            if (ap.financials?.length) { setFinancials(ap.financials); setFinSource(ap.source || 'CIS'); }
            if (ap.taxonomy) setOverrides(p => ({ ...p, taxonomy_category: ap.taxonomy.category||p.taxonomy_category, taxonomy_subcategory: ap.taxonomy.subcategory||p.taxonomy_subcategory }));
            if (ap.enrichment?.description) setOverrides(p => ({ ...p, description: p.description || ap.enrichment.description }));
            setCoverage(ap.coverage || {});
            setSource(ap.source || '');
            // Merge saved overrides
            if (prof.seller_overrides) setOverrides(p => ({ ...p, ...prof.seller_overrides }));
            if (prof.pricing) setPricing(p => ({ ...p, ...prof.pricing }));
            if (prof.panel_status) setPs(prof.panel_status);
          } else if (comp) {
            // Hydrate from company only
            setCompany(comp);
            if (comp.financials?.length) { setFinancials(comp.financials); setFinSource(comp.financials[0]?.data_source || 'MANUAL'); }
            setOverrides(p => ({ ...p, trade_name: comp.trade_name||'', employees_count: comp.employees_count||'', founded_year: comp.founded_year||'', description: comp.description||'' }));
          }
          if (comp?.valuation) setValuation(comp.valuation);
          try { const v = await companiesAPI.getVisuals(companyId); setVisuals(v.data?.financial_visuals); } catch { /* fallback */ }
          try { const d = await dealsAPI.list(); const dd = d.data?.find(x => x.company_id === companyId); if (dd) setDeal(dd); } catch { /* fallback */ }
        }
      } catch (e) { /* error logged */; }
      finally { setLoading(false); }
    };
    load();
  }, [companyId]);

  // Panel status recalculation — pure function, no closure state
  const recalcPs = (comp, ovr, fins, val, currentPs) => {
    const s = { ...(currentPs || ps) };
    s.compania = comp?.legal_name && comp?.cif ? 'complete' : comp?.legal_name ? 'partial' : 'empty';
    s.ficha = (ovr.description || ovr.trade_name) && (ovr.recurring_revenue_pct || ovr.founder_dependency) ? 'complete' : (ovr.description || ovr.trade_name) ? 'partial' : 'empty';
    const hasYear = fins.some(f => (f.pnl?.revenue || f.revenue) > 0);
    s.financieros = hasYear ? 'complete' : fins.length > 0 ? 'partial' : 'empty';
    s.valoracion = val ? 'complete' : 'empty';
    s.operacion = ovr.operation_types?.length > 0 ? 'complete' : 'empty';
    setPs(s);
    return s;
  };

  const readiness = Math.round((Object.values(ps).filter(v => v === 'complete').length / PANELS.length) * 100);
  const pi = PANELS.findIndex(p => p.id === panel);
  const goNext = () => { if (pi < PANELS.length - 1) setPanel(PANELS[pi + 1].id); };
  const goPrev = () => { if (pi > 0) setPanel(PANELS[pi - 1].id); };

  // CIF Resolve
  const handleResolve = async (cif) => {
    if (!cif || cif.length < 5) { setCifError('Introduce un CIF válido (mínimo 5 caracteres)'); return; }
    setCifLoading(true); setCifError('');
    try {
      const res = await sellerProfilesAPI.resolveAndSave({ cif });
      const p = res.data;
      setProfileId(p.profile_id);
      const ap = p.auto_prefilled || {};
      setCompany(prev => ({ ...prev, ...ap.identity, company_master_id: p.company_master_id, iberinform_synced: true }));
      if (ap.financials?.length) { setFinancials(ap.financials); setFinSource(ap.source || 'CIS'); }
      if (ap.taxonomy) setOverrides(prev => ({ ...prev, taxonomy_category: ap.taxonomy.category||'', taxonomy_subcategory: ap.taxonomy.subcategory||'' }));
      if (ap.enrichment?.description) setOverrides(prev => ({ ...prev, description: prev.description || ap.enrichment.description }));
      const latestFin = ap.financials?.find(f => f.employees);
      if (latestFin?.employees) setOverrides(prev => ({ ...prev, employees_count: prev.employees_count || String(latestFin.employees) }));
      if (ap.identity?.founded_date) { const m = ap.identity.founded_date.match(/(\d{4})/); if (m) setOverrides(prev => ({ ...prev, founded_year: prev.founded_year || m[1] })); }
      // Merge saved overrides and pricing from profile (rehidrate on re-resolve)
      if (p.seller_overrides && Object.keys(p.seller_overrides).length) setOverrides(prev => ({ ...prev, ...p.seller_overrides }));
      if (p.pricing) setPricing(prev => ({ ...prev, ...p.pricing }));
      if (p.panel_status) setPs(p.panel_status);
      setCoverage(ap.coverage || {});
      setSource(ap.source || '');
      // Compute panel status with the NEW data
      const newOverrides = { ...overrides, taxonomy_category: ap.taxonomy?.category||'', taxonomy_subcategory: ap.taxonomy?.subcategory||'', description: overrides.description || ap.enrichment?.description || '' };
      recalcPs({ ...ap.identity, cif }, newOverrides, ap.financials || [], null, ps);
      // If profile already linked to a company, redirect to that workspace
      if (p.company_id && !companyId) {
        navigate(`/seller/company/${p.company_id}`, { replace: true });
      }
    } catch (err) {
      const detail = err.response?.data?.detail || '';
      if (detail.includes('no se encontraron') || err.response?.status === 404) {
        setCifError('Empresa no encontrada para este CIF. Puedes editar el CIF o continuar manualmente.');
      } else {
        setCifError(`Error al verificar: ${detail || 'Inténtalo de nuevo'}`);
      }
    }
    finally { setCifLoading(false); }
  };

  // Flatten CIS financials to company API format
  const flattenFinancials = (fins) => fins.map(f => {
    if (f.pnl) {
      return {
        year: f.year,
        revenue: f.pnl.revenue || 0,
        ebitda: f.pnl.ebitda || f.pnl.adjusted_ebitda || 0,
        ebitda_margin: f.pnl.ebitda_margin || null,
        net_income: f.pnl.net_result || null,
        recurring_revenue_pct: null,
        client_concentration_top5: null,
        growth_rate: null,
        data_source: f.data_source || 'CIS',
      };
    }
    return f;
  });

  // Save — persists to BOTH companies AND seller_company_profiles
  const handleSave = async () => {
    setSaving(true); setSaveMsg('');
    try {
      let id = companyId;
      // Create or update ARROBA company
      if (!id && company?.legal_name) {
        const res = await companiesAPI.create({ legal_name: company.legal_name, cif: company.cif, country: 'España', city: company.city, trade_name: overrides.trade_name, website: company.website, founded_year: overrides.founded_year, employees_count: overrides.employees_count, company_master_id: company.company_master_id, description: overrides.description });
        id = res.data.company_id;
      } else if (id) {
        await companiesAPI.update(id, { trade_name: overrides.trade_name, description: overrides.description, city: company?.city, website: company?.website, founded_year: overrides.founded_year, employees_count: overrides.employees_count });
      }
      // Save financials (flatten CIS format to company API format)
      if (id && financials.length) await companiesAPI.updateFinancials(id, { financials: flattenFinancials(financials) }).catch(() => {});
      // Save to seller_company_profile
      if (profileId) {
        // Link company_id if not yet linked
        await sellerProfilesAPI.updateOverrides(profileId, { ...overrides, company_id: id }).catch(() => {});
        await sellerProfilesAPI.updatePricing(profileId, { ...pricing, asking_price: parseFloat(pricing.asking_price) || null, comfort_margin_pct: parseFloat(pricing.comfort_margin_pct) || null }).catch(() => {});
        // Update panel status
        const newPs = recalcPs(company, overrides, financials, valuation, ps);
        await sellerProfilesAPI.updatePanelStatus(profileId, newPs).catch(() => {});
      }
      setSaveMsg('Guardado correctamente');
      setTimeout(() => setSaveMsg(''), 3000);
      if (!companyId && id) navigate(`/seller/company/${id}`, { replace: true });
    } catch (e) { /* error logged */; setSaveMsg('Error al guardar'); }
    finally { setSaving(false); }
  };
  const saveAndNext = async () => { await handleSave(); goNext(); };

  // Valuation
  const handleCalcValuation = async () => {
    if (!companyId) return;
    try {
      await companiesAPI.updateFinancials(companyId, { financials: flattenFinancials(financials) }).catch(() => {});
      const res = await companiesAPI.calculateValuation(companyId);
      setValuation(res.data);
      const newPs = recalcPs(company, overrides, financials, res.data, ps);
      setPs(newPs);
      if (profileId) await sellerProfilesAPI.updatePanelStatus(profileId, newPs).catch(() => {});
    } catch (e) { /* valuation error */; }
  };

  const handleGenVisuals = async () => { if (!companyId) return; setVisualsLoading(true); try { const r = await companiesAPI.generateVisuals(companyId); setVisuals(r.data.visuals); } catch { /* fallback */ } finally { setVisualsLoading(false); } };
  const handleVisualToggle = (cId, key, val) => { if (!visuals) return; setVisuals(p => ({ ...p, [cId]: { ...p[cId], [key]: val } })); if (companyId) companiesAPI.updateVisualSettings(companyId, { [cId]: { [key]: val } }).catch(() => {}); };

  const sourceLabel = source === 'CIS' ? 'Centro de Inteligencia Sectorial' : source === 'IBERINFORM_DIRECT' ? 'Iberinform (fallback)' : 'Manual';
  const comfortFloor = pricing.asking_price && pricing.comfort_margin_pct ? Math.round(parseFloat(pricing.asking_price) * (1 - parseFloat(pricing.comfort_margin_pct) / 100)) : null;
  const planLabel = (user?.subscription?.plan_type || '').includes('premium') ? 'Seller Premium' : (user?.subscription?.plan_type || '').includes('plus') ? 'Seller Plus' : 'Seller Free';

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-0)' }}><Loader2 size={18} className="animate-spin" style={{ color: 'var(--outline)' }} /></div>;

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-0)' }} data-testid="seller-company-workspace">
      <aside className="fixed left-0 top-0 bottom-0 w-60 flex flex-col z-40 overflow-y-auto" style={{ background: 'var(--surface-1)', paddingTop: 24 }}>
        <div className="px-6 mb-3">
          <Link to="/" className="text-2xl font-black tracking-tight block mb-2" style={{ color: 'var(--arroba-primary)', letterSpacing: '-0.03em' }}>arroba</Link>
          <p className="label-arroba" style={{ color: 'var(--outline)', fontSize: 9 }}>PREPARACIÓN DEL ACTIVO</p>
          <p className="text-xs font-bold mt-1 truncate" style={{ color: 'var(--on-surface)' }}>{company?.trade_name || company?.legal_name || 'Nueva compañía'}</p>
        </div>
        <div className="px-4 mb-3 space-y-1.5">
          <div className="px-3 py-2" style={{ background: 'var(--surface-2)' }}>
            <div className="flex items-center justify-between mb-1"><span className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>PERFIL</span><span className="text-[10px] font-bold" style={{ color: readiness >= 80 ? '#16a34a' : '#d97706' }}>{readiness}%</span></div>
            <div className="w-full h-1" style={{ background: 'var(--surface-1)' }}><div className="h-full" style={{ background: readiness >= 80 ? '#16a34a' : '#d97706', width: `${readiness}%`, transition: 'width 0.3s' }} /></div>
          </div>
          <div className="px-3 py-1.5 flex items-center justify-between" style={{ background: 'var(--surface-2)' }}>
            <span className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>{planLabel.toUpperCase()}</span>
            <Link to="/planes?role=seller" className="text-[9px] font-bold" style={{ color: 'var(--arroba-primary)' }}>VER PLANES</Link>
          </div>
        </div>
        <nav className="flex-1 flex flex-col gap-0.5 px-3">
          {PANELS.map(p => { const Icon = p.icon; const a = p.id === panel; const s = STATUS[ps[p.id]] || STATUS.empty; return (
            <button key={p.id} onClick={() => setPanel(p.id)} className="flex items-center gap-2.5 px-4 py-2.5 text-left transition-all" style={{ color: a ? 'var(--arroba-primary)' : 'var(--on-surface-variant)', background: a ? 'var(--surface-lowest)' : 'transparent', boxShadow: a ? '0 4px 12px rgba(26,28,28,0.06)' : 'none' }} data-testid={`panel-${p.id}`}>
              <Icon size={14} /><span className="text-xs font-semibold uppercase tracking-wider flex-1">{p.label}</span><span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
            </button>); })}
        </nav>
        <div className="px-4 pb-6 mt-auto"><Link to="/seller"><button className="w-full py-2.5 text-[11px] font-bold flex items-center justify-center gap-2" style={{ background: 'var(--on-surface)', color: '#fff' }}><ArrowLeft size={11} /> VOLVER AL DASHBOARD</button></Link></div>
      </aside>

      <main className="ml-60 min-h-screen" style={{ paddingTop: 32 }}>
        <div className="max-w-[1100px] mx-auto px-8 pb-16">
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="label-arroba mb-2" style={{ color: 'var(--arroba-primary)' }}>{PANELS.find(p => p.id === panel)?.label.toUpperCase()}</p>
              <h1 className="text-3xl font-extrabold" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>{company?.trade_name || company?.legal_name || 'Nueva compañía'}</h1>
            </div>
            {saveMsg && <span className="text-xs font-bold px-3 py-1" style={{ background: saveMsg.includes('Error') ? 'rgba(220,38,38,0.06)' : 'rgba(22,163,74,0.06)', color: saveMsg.includes('Error') ? '#dc2626' : '#16a34a' }}>{saveMsg}</span>}
          </div>

          {/* ═══ COMPAÑÍA ═══ */}
          {panel === 'compania' && (<div className="space-y-5" data-testid="panel-compania">
            <p className="text-sm" style={{ color: 'var(--outline)' }}>Verifica tu empresa por CIF.</p>
            <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>VERIFICAR EMPRESA</p>
              <div className="flex gap-3">
                <input type="text" value={company?.cif||''} onChange={e => { setCompany(p=>({...p, cif: e.target.value.toUpperCase()})); setCifError(''); }} placeholder="CIF / NIF" className="input-arroba flex-1" data-testid="input-cif" />
                <button onClick={() => handleResolve(company?.cif)} disabled={cifLoading} className="px-6 py-2 text-xs font-bold flex items-center gap-2 disabled:opacity-50" style={{ background: 'var(--on-surface)', color: '#fff' }}>{cifLoading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />} VERIFICAR</button>
              </div>
              {cifError && <div className="mt-3 p-3 flex items-center gap-2" style={{ background: 'rgba(220,38,38,0.05)' }}><XCircle size={14} style={{ color: '#dc2626' }} /><p className="text-xs" style={{ color: '#dc2626' }}>{cifError}</p></div>}
              {company?.iberinform_synced && !cifError && <div className="mt-3 p-3" style={{ background: 'rgba(22,163,74,0.04)' }}><p className="text-xs font-semibold flex items-center gap-1" style={{ color: '#16a34a' }}><CheckCircle2 size={12} /> {company.legal_name} — {sourceLabel}</p></div>}
            </div>
            {company?.legal_name && (<div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <div className="flex items-center justify-between mb-4">
                <p className="label-arroba" style={{ color: 'var(--outline)' }}>DATOS REGISTRALES</p>
                {company.iberinform_synced && <button onClick={() => handleResolve(company.cif)} className="text-[10px] font-bold flex items-center gap-1" style={{ color: 'var(--arroba-primary)' }}><RefreshCw size={10} /> REFRESCAR</button>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-arroba block mb-1">DENOMINACIÓN SOCIAL</label><input value={company.legal_name||''} onChange={e=>setCompany(p=>({...p,legal_name:e.target.value}))} className="input-arroba w-full" data-testid="input-legal-name" /></div>
                <div><label className="label-arroba block mb-1">FORMA JURÍDICA</label><input value={company.legal_form||''} readOnly className="input-arroba w-full opacity-60" /></div>
                <div><label className="label-arroba block mb-1">CIUDAD</label><input value={company.city||''} onChange={e=>setCompany(p=>({...p,city:e.target.value}))} className="input-arroba w-full" /></div>
                <div><label className="label-arroba block mb-1">PROVINCIA</label><input value={company.province||''} readOnly className="input-arroba w-full opacity-60" /></div>
                <div><label className="label-arroba block mb-1">SITIO WEB</label><input value={company.website||''} onChange={e=>setCompany(p=>({...p,website:e.target.value}))} className="input-arroba w-full" /></div>
                <div><label className="label-arroba block mb-1">CNAE</label><input value={company.cnae_code ? `${company.cnae_code} — ${company.cnae_label||''}` : ''} readOnly className="input-arroba w-full opacity-60" /></div>
              </div>
            </div>)}
            {Object.keys(coverage).length > 0 && (<div className="flex gap-1 flex-wrap">{Object.entries(coverage).map(([k,v])=>(<span key={k} className="px-1.5 py-0.5 text-[8px] font-bold" style={{background:v?'rgba(22,163,74,0.06)':'var(--surface-2)',color:v?'#16a34a':'var(--outline)'}}>{v&&<Check size={8} className="inline mr-0.5"/>}{k.toUpperCase()}</span>))}</div>)}
            <PanelNav onSave={handleSave} onSaveNext={saveAndNext} saving={saving} canBack={false} />
          </div>)}

          {/* ═══ FICHA ═══ */}
          {panel === 'ficha' && (<div className="space-y-5" data-testid="panel-ficha">
            <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>INFORMACIÓN DE LA AGENCIA</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="label-arroba block mb-1">NOMBRE COMERCIAL</label><input value={overrides.trade_name} onChange={e=>setOverrides(p=>({...p,trade_name:e.target.value}))} className="input-arroba w-full" /></div>
                <div><label className="label-arroba block mb-1">AÑO FUNDACIÓN</label><input type="number" value={overrides.founded_year} onChange={e=>setOverrides(p=>({...p,founded_year:e.target.value}))} className="input-arroba w-full" /></div>
                <div><label className="label-arroba block mb-1">EMPLEADOS</label><input type="number" value={overrides.employees_count} onChange={e=>setOverrides(p=>({...p,employees_count:e.target.value}))} className="input-arroba w-full" /></div>
                <div>
                  <label className="label-arroba block mb-1">CATEGORÍA</label>
                  <select value={overrides.taxonomy_category} onChange={e => setOverrides(p=>({...p, taxonomy_category: e.target.value, taxonomy_subcategory: ''}))} className="input-arroba w-full" data-testid="select-category">
                    <option value="">Seleccionar categoría</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                {subcategories.length > 0 && (<div>
                  <label className="label-arroba block mb-1">SUBCATEGORÍA</label>
                  <select value={overrides.taxonomy_subcategory} onChange={e => setOverrides(p=>({...p, taxonomy_subcategory: e.target.value}))} className="input-arroba w-full">
                    <option value="">Seleccionar subcategoría</option>
                    {subcategories.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>)}
              </div>
              <div><label className="label-arroba block mb-1">DESCRIPCIÓN</label><textarea value={overrides.description} onChange={e=>setOverrides(p=>({...p,description:e.target.value}))} rows={4} className="input-arroba w-full resize-none" placeholder="Describe tu agencia..." /></div>
            </div>
            <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>SEÑALES CUALITATIVAS DEL ACTIVO</p>
              <Tip text="Estas señales mejoran la valoración y el matching con compradores." />
              <div className="grid grid-cols-2 gap-4 mt-3">
                {QUAL.map(s => (<div key={s.id}>
                  <label className="label-arroba block mb-1">{s.label.toUpperCase()}</label>
                  {s.type==='select' ? <select value={overrides[s.id]||''} onChange={e=>setOverrides(p=>({...p,[s.id]:e.target.value}))} className="input-arroba w-full">{s.options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select>
                  : <NumericInputES value={overrides[s.id]} onChange={v=>setOverrides(p=>({...p,[s.id]:v}))} placeholder={s.placeholder} className="input-arroba w-full" />}
                </div>))}
              </div>
            </div>
            <PanelNav onSave={handleSave} onSaveNext={saveAndNext} onBack={goPrev} saving={saving} canBack={true} />
          </div>)}

          {/* ═══ FINANCIEROS ═══ */}
          {panel === 'financieros' && (<div data-testid="panel-financieros" style={{width:'100%'}}>
            {finSource!=='MANUAL' && <div className="mb-4 p-3 flex items-center gap-2" style={{background:'var(--surface-1)'}}><CheckCircle2 size={12} style={{color:'#16a34a'}}/><p className="text-[10px]" style={{color:'var(--outline)'}}>Fuente: <b>{sourceLabel}</b></p></div>}
            <FinancialStatementsStep financials={financials} setFinancials={setFinancials} financialDataSource={finSource} valuationInputs={valInputs} setValuationInputs={setValInputs} onRecalculate={null} />
            <div className="mt-6 p-5" style={{background:'var(--surface-lowest)',boxShadow:'0 2px 8px rgba(25,28,30,0.04)'}}>
              <p className="label-arroba mb-2" style={{color:'var(--outline)'}}>EXPLICACIÓN DEL EBITDA AJUSTADO</p>
              <Tip text="Describe qué ajustes no recurrentes, extraordinarios o no operativos has aplicado." />
              <textarea value={overrides.ebitda_explanation} onChange={e=>setOverrides(p=>({...p,ebitda_explanation:e.target.value}))} rows={3} className="input-arroba w-full resize-none mt-2" placeholder="Ej: Se eliminaron gastos extraordinarios de mudanza (120K)..." />
            </div>
            <PanelNav onSave={handleSave} onSaveNext={saveAndNext} onBack={goPrev} saving={saving} canBack={true} />
          </div>)}

          {/* ═══ VALORACIÓN ═══ */}
          {panel === 'valoracion' && (<div className="space-y-6" data-testid="panel-valoracion">
            {valuation ? (<>
              <div className="text-center p-8" style={{background:'var(--surface-lowest)',boxShadow:'0 2px 12px rgba(25,28,30,0.04)'}}>
                <p className="label-arroba mb-2" style={{color:'var(--outline)'}}>RANGO DE VALORACIÓN ESTIMADO</p>
                <p className="text-4xl font-black" style={{color:'var(--arroba-primary)',letterSpacing:'-0.03em'}}>{fmtMillions(valuation.valuation_min)} — {fmtMillions(valuation.valuation_max)}</p>
                <p className="text-sm mt-2" style={{color:'var(--outline)'}}>Múltiplo: {valuation.multiple_min?.toFixed(1)}x — {valuation.multiple_max?.toFixed(1)}x</p>
              </div>
              <div className="p-5" style={{background:'var(--surface-1)'}}>
                <p className="text-xs font-bold mb-1" style={{color:'var(--on-surface)'}}>Cómo hemos estimado esta valoración</p>
                <p className="text-xs" style={{color:'var(--outline)',lineHeight:1.6}}>Este rango se ha calculado a partir de la información financiera disponible, los factores cualitativos del negocio y múltiplos orientativos del mercado. Debe interpretarse como una referencia inicial y no como una valoración formal o vinculante.</p>
              </div>
            </>) : (
              <div className="text-center py-12" style={{background:'var(--surface-1)'}}>
                <TrendingUp size={32} className="mx-auto mb-3" style={{color:'var(--outline-variant)'}} />
                <p className="text-sm mb-4" style={{color:'var(--outline)'}}>
                  {financials.some(f => (f.pnl?.revenue || f.revenue) > 0)
                    ? 'Los datos financieros están listos. Calcula la valoración.'
                    : 'Necesitas al menos un ejercicio con facturación para calcular la valoración.'}
                </p>
                <button onClick={handleCalcValuation} disabled={!companyId || !financials.some(f => (f.pnl?.revenue || f.revenue) > 0)} className="px-6 py-2 text-xs font-bold disabled:opacity-40" style={{background:'var(--arroba-primary)',color:'#fff'}} data-testid="calc-valuation-btn">CALCULAR VALORACIÓN</button>
              </div>
            )}
            <div className="p-4 mb-4" style={{background:'var(--surface-1)'}}>
              <p className="text-xs font-bold mb-1" style={{color:'var(--on-surface)'}}>Dónde se mostrará cada visual</p>
              <p className="text-[10px]" style={{color:'var(--outline)',lineHeight:1.5}}>Marca en qué superficies quieres usar cada gráfico: <b>Teaser</b> (vista pública), <b>Infomemo</b> (documento ampliado), <b>Buyer avanzado</b> (ficha post-NDA).</p>
            </div>
            <FinancialVisualsGallery visuals={visuals} loading={visualsLoading} onToggle={handleVisualToggle} onRegenerate={handleGenVisuals} />
            <PanelNav onSave={handleSave} onSaveNext={saveAndNext} onBack={goPrev} saving={saving} canBack={true} />
          </div>)}

          {/* ═══ OPERACIÓN ═══ */}
          {panel === 'operacion' && (<div className="space-y-5" data-testid="panel-operacion">
            <div className="p-5" style={{background:'var(--surface-lowest)',borderLeft:'3px solid var(--arroba-primary)',boxShadow:'0 2px 8px rgba(25,28,30,0.04)'}}>
              <p className="label-arroba mb-3" style={{color:'var(--arroba-primary)'}}>VISTA PREVIA DE LA FICHA</p>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div><span style={{color:'var(--outline)'}}>Empresa</span><p className="font-bold" style={{color:'var(--on-surface)'}}>{company?.trade_name||company?.legal_name||'—'}</p></div>
                <div><span style={{color:'var(--outline)'}}>Ubicación</span><p className="font-bold" style={{color:'var(--on-surface)'}}>{company?.city||'—'}</p></div>
                <div><span style={{color:'var(--outline)'}}>Sector</span><p className="font-bold" style={{color:'var(--on-surface)'}}>{overrides.taxonomy_category||'—'}</p></div>
                <div><span style={{color:'var(--outline)'}}>Facturación</span><p className="font-bold" style={{color:'var(--on-surface)'}}>{financials[0]?.pnl?.revenue||financials[0]?.revenue?fmtMillions(financials[0]?.pnl?.revenue||financials[0]?.revenue):'—'}</p></div>
                <div><span style={{color:'var(--outline)'}}>EBITDA</span><p className="font-bold" style={{color:'var(--on-surface)'}}>{financials[0]?.pnl?.ebitda||financials[0]?.ebitda?fmtMillions(financials[0]?.pnl?.ebitda||financials[0]?.ebitda):'—'}</p></div>
                <div><span style={{color:'var(--outline)'}}>Empleados</span><p className="font-bold" style={{color:'var(--on-surface)'}}>{overrides.employees_count||'—'}</p></div>
              </div>
            </div>
            <div className="p-5" style={{background:'var(--surface-lowest)',boxShadow:'0 2px 8px rgba(25,28,30,0.04)'}}>
              <p className="label-arroba mb-2" style={{color:'var(--outline)'}}>PRECIO Y EXPECTATIVAS</p>
              <Tip text="Define cómo posicionar el precio y qué flexibilidad consideras." />
              <div className="flex gap-3 mt-3">
                <button onClick={()=>setPricing(p=>({...p,price_strategy:'define_price'}))} className="flex-1 p-3 text-left text-xs font-semibold" style={{background:pricing.price_strategy==='define_price'?'rgba(182,33,42,0.06)':'var(--surface-2)',borderLeft:pricing.price_strategy==='define_price'?'3px solid var(--arroba-primary)':'3px solid transparent',color:pricing.price_strategy==='define_price'?'var(--arroba-primary)':'var(--on-surface)'}}>Definir precio objetivo</button>
                <button onClick={()=>setPricing(p=>({...p,price_strategy:'receive_offers'}))} className="flex-1 p-3 text-left text-xs font-semibold" style={{background:pricing.price_strategy==='receive_offers'?'rgba(182,33,42,0.06)':'var(--surface-2)',borderLeft:pricing.price_strategy==='receive_offers'?'3px solid var(--arroba-primary)':'3px solid transparent',color:pricing.price_strategy==='receive_offers'?'var(--arroba-primary)':'var(--on-surface)'}}>Recibir ofertas</button>
              </div>
              {pricing.price_strategy==='define_price' && (<div className="grid grid-cols-2 gap-4 mt-3">
                <div><label className="label-arroba block mb-1">PRECIO OBJETIVO (EUR)</label><NumericInputES value={pricing.asking_price} onChange={v=>setPricing(p=>({...p,asking_price:v}))} placeholder="4.000.000" className="input-arroba w-full" /></div>
                <div><label className="label-arroba block mb-1">MARGEN DE CONFORT (%)</label><input type="number" value={pricing.comfort_margin_pct} onChange={e=>setPricing(p=>({...p,comfort_margin_pct:e.target.value}))} placeholder="15" className="input-arroba w-full" /></div>
                {comfortFloor && <p className="text-xs col-span-2" style={{color:'var(--outline)'}}>Revisarías ofertas desde <b style={{color:'var(--on-surface)'}}>{fmtES(comfortFloor,0)} €</b></p>}
              </div>)}
            </div>
            <div className="p-5" style={{background:'var(--surface-lowest)',boxShadow:'0 2px 8px rgba(25,28,30,0.04)'}}>
              <p className="label-arroba mb-3" style={{color:'var(--outline)'}}>TIPO DE OPERACIÓN</p>
              <div className="flex flex-wrap gap-2">
                {OP_TYPES.map(o => {
                  const sel = overrides.operation_types?.includes(o.id);
                  return <button key={o.id} onClick={() => setOverrides(p => ({...p, operation_types: sel ? p.operation_types.filter(x=>x!==o.id) : [...(p.operation_types||[]), o.id]}))} className="px-4 py-2 text-xs font-bold transition-all" style={{background:sel?'var(--on-surface)':'var(--surface-2)',color:sel?'#fff':'var(--on-surface)'}} data-testid={`op-${o.id}`}>{o.label}</button>;
                })}
              </div>
            </div>
            <div className="p-5" style={{background:'var(--surface-lowest)',boxShadow:'0 2px 8px rgba(25,28,30,0.04)'}}>
              <p className="label-arroba mb-2" style={{color:'var(--outline)'}}>MOTIVACIÓN</p>
              <textarea value={overrides.sale_motivation} onChange={e=>setOverrides(p=>({...p,sale_motivation:e.target.value}))} rows={3} className="input-arroba w-full resize-none" placeholder="¿Por qué vendes? Esto no se comparte públicamente." />
            </div>
            <PanelNav onSave={handleSave} onBack={goPrev} saving={saving} canBack={true} />
          </div>)}
        </div>
      </main>
    </div>
  );
};

export default SellerCompanyWorkspace;
