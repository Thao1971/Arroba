import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { companiesAPI, dealsAPI, sellerProfilesAPI } from '../services/api';
import { FinancialVisualsGallery } from '../components/FinancialVisualCard';
import FinancialStatementsStep from '../components/FinancialStatementsStep';
import { fmtES, fmtMillions, fmtPct } from '../utils/formatES';
import { NumericInputES } from '../components/NumericInputES';
import {
  Building2, FileText, TrendingUp, BarChart3, Briefcase,
  Check, Loader2, Search, ArrowLeft, ArrowRight, AlertCircle,
  Shield, ChevronRight, CheckCircle2, Info, RefreshCw, Eye, Star
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

const QUALITATIVE_SIGNALS = [
  { id: 'founder_dependency', label: 'Dependencia del fundador', type: 'select', options: [{v:'low',l:'Baja — equipo autónomo'},{v:'medium',l:'Media — fundador operativo'},{v:'high',l:'Alta — fundador imprescindible'}] },
  { id: 'recurring_revenue_pct', label: '% Ingresos recurrentes', type: 'number', placeholder: '70' },
  { id: 'client_concentration_top5', label: '% Concentración top 5 clientes', type: 'number', placeholder: '40' },
  { id: 'revenue_visibility', label: 'Visibilidad de ingresos', type: 'select', options: [{v:'high',l:'Alta — contratos a largo plazo'},{v:'medium',l:'Media — retainers renovables'},{v:'low',l:'Baja — proyectos puntuales'}] },
  { id: 'client_diversification', label: 'Diversificación de clientes', type: 'select', options: [{v:'high',l:'Alta — cartera amplia'},{v:'medium',l:'Media'},{v:'low',l:'Baja — pocos clientes grandes'}] },
  { id: 'margin_stability', label: 'Estabilidad de márgenes', type: 'select', options: [{v:'stable',l:'Estables'},{v:'improving',l:'Mejorando'},{v:'declining',l:'Deteriorándose'}] },
  { id: 'internationalization', label: 'Internacionalización', type: 'select', options: [{v:'none',l:'Solo mercado nacional'},{v:'partial',l:'Exportación parcial'},{v:'significant',l:'Internacional relevante'}] },
];

const SellerCompanyWorkspace = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [panel, setPanel] = useState('compania');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState(null);
  const [profile, setProfile] = useState(null);
  const [deal, setDeal] = useState(null);
  const [financials, setFinancials] = useState([]);
  const [finSource, setFinSource] = useState('MANUAL');
  const [valuation, setValuation] = useState(null);
  const [visuals, setVisuals] = useState(null);
  const [visualsLoading, setVisualsLoading] = useState(false);
  const [cifLoading, setCifLoading] = useState(false);
  const [overrides, setOverrides] = useState({ trade_name:'', description:'', employees_count:'', founded_year:'', taxonomy_category:'', taxonomy_subcategory:'', founder_dependency:'medium', recurring_revenue_pct:'', client_concentration_top5:'', revenue_visibility:'medium', client_diversification:'medium', margin_stability:'stable', internationalization:'none', sale_motivation:'', ebitda_explanation:'' });
  const [pricing, setPricing] = useState({ price_strategy:'not_set', asking_price:'', comfort_margin_pct:'', offers_mode:'formal', internal_price_reference:'', minimum_interest_price:'' });
  const [panelStatus, setPanelStatus] = useState({ compania:'empty', ficha:'empty', financieros:'empty', valoracion:'empty', operacion:'empty' });
  const [valInputs, setValInputs] = useState({ founder_dependency:'medium', recurring_revenue_type:'mixed' });

  // Load
  useEffect(() => {
    const load = async () => {
      try {
        if (companyId) {
          // Try to hydrate from seller_company_profile
          const profRes = await sellerProfilesAPI.getByCompany(companyId).catch(() => null);
          if (profRes?.data) {
            setProfile(profRes.data);
            const ap = profRes.data.auto_prefilled || {};
            setCompany({ ...ap.identity, company_master_id: profRes.data.company_master_id, iberinform_synced: true });
            if (ap.financials?.length) { setFinancials(ap.financials); setFinSource(ap.source || 'CIS'); }
            if (ap.taxonomy) setOverrides(p => ({ ...p, taxonomy_category: ap.taxonomy.category||'', taxonomy_subcategory: ap.taxonomy.subcategory||'' }));
            if (ap.enrichment?.description) setOverrides(p => ({ ...p, description: ap.enrichment.description }));
            if (profRes.data.seller_overrides) setOverrides(p => ({ ...p, ...profRes.data.seller_overrides }));
            if (profRes.data.pricing) setPricing(p => ({ ...p, ...profRes.data.pricing }));
            if (profRes.data.panel_status) setPanelStatus(profRes.data.panel_status);
          }
          // Also load ARROBA company
          const cRes = await companiesAPI.get(companyId).catch(() => null);
          if (cRes?.data) {
            const c = cRes.data;
            if (!company?.legal_name) setCompany(prev => ({ ...prev, ...c }));
            if (!financials.length && c.financials?.length) { setFinancials(c.financials); setFinSource(c.financials[0]?.data_source || 'MANUAL'); }
            if (c.valuation) setValuation(c.valuation);
            setOverrides(p => ({ ...p, trade_name: p.trade_name||c.trade_name||'', employees_count: p.employees_count||c.employees_count||'', founded_year: p.founded_year||c.founded_year||'' }));
          }
          try { const vRes = await companiesAPI.getVisuals(companyId); setVisuals(vRes.data?.financial_visuals); } catch {}
          try { const dRes = await dealsAPI.list(); const d = dRes.data?.find(x => x.company_id === companyId); if (d) setDeal(d); } catch {}
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [companyId]);

  const readiness = Math.round((Object.values(panelStatus).filter(v => v === 'complete').length / PANELS.length) * 100);
  const pi = PANELS.findIndex(p => p.id === panel);
  const goNext = () => { if (pi < PANELS.length - 1) setPanel(PANELS[pi + 1].id); };
  const goPrev = () => { if (pi > 0) setPanel(PANELS[pi - 1].id); };

  // CIF resolve via seller_profiles
  const handleResolve = async (cif) => {
    if (!cif || cif.length < 5) return;
    setCifLoading(true);
    try {
      const res = await sellerProfilesAPI.resolveAndSave({ cif });
      const p = res.data;
      setProfile(p);
      const ap = p.auto_prefilled || {};
      setCompany({ ...ap.identity, company_master_id: p.company_master_id, iberinform_synced: true });
      if (ap.financials?.length) { setFinancials(ap.financials); setFinSource(ap.source || 'CIS'); }
      if (ap.taxonomy) setOverrides(prev => ({ ...prev, taxonomy_category: ap.taxonomy.category||'', taxonomy_subcategory: ap.taxonomy.subcategory||'' }));
      if (ap.enrichment?.description) setOverrides(prev => ({ ...prev, description: ap.enrichment.description }));
      const latestFin = ap.financials?.find(f => f.employees);
      if (latestFin?.employees) setOverrides(prev => ({ ...prev, employees_count: prev.employees_count || String(latestFin.employees) }));
      if (ap.identity?.founded_date) { const m = ap.identity.founded_date.match(/(\d{4})/); if (m) setOverrides(prev => ({ ...prev, founded_year: prev.founded_year || m[1] })); }
      setPanelStatus(prev => ({ ...prev, compania: 'complete', ficha: ap.enrichment?.description || ap.taxonomy?.category ? 'partial' : 'empty', financieros: ap.financials?.length ? 'needs_review' : 'empty' }));
    } catch (e) { console.error(e); }
    finally { setCifLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let id = companyId;
      if (!id && company?.legal_name) {
        const res = await companiesAPI.create({ legal_name: company.legal_name, cif: company.cif, country: 'España', city: company.city, trade_name: overrides.trade_name, website: company.website, founded_year: overrides.founded_year, employees_count: overrides.employees_count, company_master_id: company.company_master_id });
        id = res.data.company_id;
        navigate(`/seller/company/${id}`, { replace: true });
      } else if (id) {
        await companiesAPI.update(id, { trade_name: overrides.trade_name, description: overrides.description, city: company?.city, website: company?.website, founded_year: overrides.founded_year, employees_count: overrides.employees_count });
      }
      if (id && financials.length) await companiesAPI.updateFinancials(id, { financials }).catch(() => {});
      if (profile?.profile_id) {
        await sellerProfilesAPI.updateOverrides(profile.profile_id, overrides).catch(() => {});
        await sellerProfilesAPI.updatePricing(profile.profile_id, { ...pricing, asking_price: parseFloat(pricing.asking_price) || null, comfort_margin_pct: parseFloat(pricing.comfort_margin_pct) || null }).catch(() => {});
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };
  const saveAndNext = async () => { await handleSave(); goNext(); };

  const handleGenVisuals = async () => { if (!companyId) return; setVisualsLoading(true); try { const r = await companiesAPI.generateVisuals(companyId); setVisuals(r.data.visuals); } catch {} finally { setVisualsLoading(false); } };
  const handleVisualToggle = (chartId, key, value) => { if (!visuals) return; setVisuals(p => ({ ...p, [chartId]: { ...p[chartId], [key]: value } })); if (companyId) companiesAPI.updateVisualSettings(companyId, { [chartId]: { [key]: value } }).catch(() => {}); };

  const coverage = profile?.auto_prefilled?.coverage || {};
  const source = profile?.auto_prefilled?.source || finSource;
  const sourceLabel = source === 'CIS' ? 'Centro de Inteligencia Sectorial de BUD Advisors' : source === 'IBERINFORM_DIRECT' ? 'Iberinform (fallback transitorio)' : 'Manual';
  const fv = profile?.financial_validation || {};
  const comfortFloor = pricing.asking_price && pricing.comfort_margin_pct ? Math.round(parseFloat(pricing.asking_price) * (1 - parseFloat(pricing.comfort_margin_pct) / 100)) : null;

  // Plan
  const planType = user?.subscription?.plan_type || 'seller_free';
  const planLabel = planType.includes('premium') ? 'Seller Premium' : planType.includes('plus') ? 'Seller Plus' : 'Seller Free';

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-0)' }}><Loader2 size={18} className="animate-spin" style={{ color: 'var(--outline)' }} /></div>;

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-0)' }} data-testid="seller-company-workspace">
      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 bottom-0 w-60 flex flex-col z-40 overflow-y-auto" style={{ background: 'var(--surface-1)', paddingTop: 24 }}>
        <div className="px-6 mb-3">
          <Link to="/" className="text-2xl font-black tracking-tight block mb-2" style={{ color: 'var(--arroba-primary)', letterSpacing: '-0.03em' }}>arroba</Link>
          <p className="label-arroba" style={{ color: 'var(--outline)', fontSize: 9 }}>PREPARACIÓN DEL ACTIVO</p>
          <p className="text-xs font-bold mt-1 truncate" style={{ color: 'var(--on-surface)' }}>{company?.trade_name || company?.legal_name || 'Nueva compañía'}</p>
        </div>
        <div className="px-4 mb-3">
          <div className="px-3 py-2" style={{ background: 'var(--surface-2)' }}>
            <div className="flex items-center justify-between mb-1"><span className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>PERFIL</span><span className="text-[10px] font-bold" style={{ color: readiness >= 80 ? '#16a34a' : '#d97706' }}>{readiness}%</span></div>
            <div className="w-full h-1" style={{ background: 'var(--surface-1)' }}><div className="h-full" style={{ background: readiness >= 80 ? '#16a34a' : '#d97706', width: `${readiness}%`, transition: 'width 0.3s' }} /></div>
          </div>
          {/* Plan */}
          <div className="px-3 py-1.5 mt-1.5 flex items-center justify-between" style={{ background: 'var(--surface-2)' }}>
            <span className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>{planLabel.toUpperCase()}</span>
            <Link to="/planes?role=seller" className="text-[9px] font-bold" style={{ color: 'var(--arroba-primary)' }}>VER PLANES</Link>
          </div>
        </div>
        <nav className="flex-1 flex flex-col gap-0.5 px-3">
          {PANELS.map(p => { const Icon = p.icon; const a = p.id === panel; const s = STATUS[panelStatus[p.id]] || STATUS.empty; return (
            <button key={p.id} onClick={() => setPanel(p.id)} className="flex items-center gap-2.5 px-4 py-2.5 text-left transition-all" style={{ color: a ? 'var(--arroba-primary)' : 'var(--on-surface-variant)', background: a ? 'var(--surface-lowest)' : 'transparent', boxShadow: a ? '0 4px 12px rgba(26,28,28,0.06)' : 'none' }} data-testid={`panel-${p.id}`}>
              <Icon size={14} /><span className="text-xs font-semibold uppercase tracking-wider flex-1">{p.label}</span><span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
            </button>
          ); })}
        </nav>
        <div className="px-4 pb-6 mt-auto"><Link to="/seller"><button className="w-full py-2.5 text-[11px] font-bold flex items-center justify-center gap-2" style={{ background: 'var(--on-surface)', color: '#fff' }}><ArrowLeft size={11} /> VOLVER AL DASHBOARD</button></Link></div>
      </aside>

      {/* MAIN */}
      <main className="ml-60 min-h-screen" style={{ paddingTop: 32 }}>
        <div className="max-w-[1100px] mx-auto px-8 pb-16">
          <div className="mb-8">
            <p className="label-arroba mb-2" style={{ color: 'var(--arroba-primary)' }}>{PANELS.find(p => p.id === panel)?.label.toUpperCase()}</p>
            <h1 className="text-3xl font-extrabold" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>{company?.trade_name || company?.legal_name || 'Nueva compañía'}</h1>
          </div>

          {/* ═══ COMPAÑÍA ═══ */}
          {panel === 'compania' && (
            <div className="space-y-5" data-testid="panel-compania">
              <p className="text-sm" style={{ color: 'var(--outline)' }}>Verifica tu empresa por CIF. Los datos se precargan automáticamente desde el Centro de Inteligencia Sectorial.</p>
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>VERIFICAR EMPRESA</p>
                <div className="flex gap-3">
                  <input type="text" value={company?.cif || ''} onChange={e => setCompany(p => ({...(p||{}), cif: e.target.value.toUpperCase()}))} placeholder="CIF / NIF" className="input-arroba flex-1" data-testid="input-cif" />
                  <button onClick={() => handleResolve(company?.cif)} disabled={cifLoading} className="px-6 py-2 text-xs font-bold flex items-center gap-2 disabled:opacity-50" style={{ background: 'var(--on-surface)', color: '#fff' }}>{cifLoading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />} VERIFICAR</button>
                </div>
                {company?.iberinform_synced && <div className="mt-3 p-3" style={{ background: 'rgba(22,163,74,0.04)' }}><p className="text-xs font-semibold flex items-center gap-1" style={{ color: '#16a34a' }}><CheckCircle2 size={12} /> {company.legal_name}</p></div>}
              </div>
              {company?.legal_name && (
                <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="label-arroba" style={{ color: 'var(--outline)' }}>DATOS REGISTRALES</p>
                    {company.iberinform_synced && <button onClick={() => handleResolve(company.cif)} className="text-[10px] font-bold flex items-center gap-1" style={{ color: 'var(--arroba-primary)' }}><RefreshCw size={10} /> REFRESCAR DESDE CIS</button>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="label-arroba block mb-1">DENOMINACIÓN SOCIAL</label><input value={company.legal_name||''} onChange={e => setCompany(p => ({...p, legal_name: e.target.value}))} className="input-arroba w-full" data-testid="input-legal-name" /></div>
                    <div><label className="label-arroba block mb-1">FORMA JURÍDICA</label><input value={company.legal_form||''} readOnly className="input-arroba w-full opacity-60" /></div>
                    <div><label className="label-arroba block mb-1">CIUDAD</label><input value={company.city||''} onChange={e => setCompany(p => ({...p, city: e.target.value}))} className="input-arroba w-full" /></div>
                    <div><label className="label-arroba block mb-1">PROVINCIA</label><input value={company.province||''} readOnly className="input-arroba w-full opacity-60" /></div>
                    <div><label className="label-arroba block mb-1">SITIO WEB</label><input value={company.website||''} onChange={e => setCompany(p => ({...p, website: e.target.value}))} className="input-arroba w-full" /></div>
                    <div><label className="label-arroba block mb-1">CNAE</label><input value={company.cnae_code ? `${company.cnae_code} — ${company.cnae_label||''}` : ''} readOnly className="input-arroba w-full opacity-60" /></div>
                  </div>
                </div>
              )}
              {/* Source + coverage */}
              {profile && (
                <div className="p-3 flex items-center justify-between" style={{ background: 'var(--surface-1)' }}>
                  <div><p className="text-[10px]" style={{ color: 'var(--outline)' }}>Fuente: <b>{sourceLabel}</b></p>
                    {profile.updated_at && <p className="text-[9px]" style={{ color: 'var(--outline-variant)' }}>Última actualización: {new Date(profile.updated_at).toLocaleDateString('es-ES')}</p>}
                  </div>
                  <div className="flex gap-1">{Object.entries(coverage).map(([k, v]) => (<span key={k} className="px-1.5 py-0.5 text-[8px] font-bold" style={{ background: v ? 'rgba(22,163,74,0.06)' : 'var(--surface-2)', color: v ? '#16a34a' : 'var(--outline)' }}>{v && <Check size={8} className="inline mr-0.5" />}{k.toUpperCase()}</span>))}</div>
                </div>
              )}
              <PanelNav onSave={handleSave} onSaveNext={saveAndNext} saving={saving} canBack={false} />
            </div>
          )}

          {/* ═══ FICHA ═══ */}
          {panel === 'ficha' && (
            <div className="space-y-5" data-testid="panel-ficha">
              <p className="text-sm" style={{ color: 'var(--outline)' }}>Información cualitativa de la agencia. Solo completa lo que el registro no cubre.</p>
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>INFORMACIÓN DE LA AGENCIA</p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><label className="label-arroba block mb-1">NOMBRE COMERCIAL</label><input value={overrides.trade_name} onChange={e => setOverrides(p => ({...p, trade_name: e.target.value}))} className="input-arroba w-full" /></div>
                  <div><label className="label-arroba block mb-1">AÑO FUNDACIÓN</label><input type="number" value={overrides.founded_year} onChange={e => setOverrides(p => ({...p, founded_year: e.target.value}))} className="input-arroba w-full" /></div>
                  <div><label className="label-arroba block mb-1">EMPLEADOS</label><input type="number" value={overrides.employees_count} onChange={e => setOverrides(p => ({...p, employees_count: e.target.value}))} className="input-arroba w-full" /></div>
                  <div><label className="label-arroba block mb-1">CATEGORÍA</label><input value={overrides.taxonomy_category || ''} readOnly className="input-arroba w-full opacity-60" />{overrides.taxonomy_subcategory && <p className="text-[10px] mt-0.5" style={{ color: 'var(--outline)' }}>Subcategoría: {overrides.taxonomy_subcategory}</p>}</div>
                </div>
                <div><label className="label-arroba block mb-1">DESCRIPCIÓN</label><textarea value={overrides.description} onChange={e => setOverrides(p => ({...p, description: e.target.value}))} rows={4} className="input-arroba w-full resize-none" placeholder="Describe tu agencia, servicios principales, posicionamiento..." /></div>
              </div>
              {/* Señales cualitativas */}
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>SEÑALES CUALITATIVAS DEL ACTIVO</p>
                <Tip text="Estas señales complementan los financieros y mejoran la calidad de la valoración y el matching con compradores." />
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {QUALITATIVE_SIGNALS.map(s => (
                    <div key={s.id}>
                      <label className="label-arroba block mb-1">{s.label.toUpperCase()}</label>
                      {s.type === 'select' ? (
                        <select value={overrides[s.id]||''} onChange={e => setOverrides(p => ({...p, [s.id]: e.target.value}))} className="input-arroba w-full">
                          {s.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                        </select>
                      ) : (
                        <NumericInputES value={overrides[s.id]} onChange={v => setOverrides(p => ({...p, [s.id]: v}))} placeholder={s.placeholder} className="input-arroba w-full" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <PanelNav onSave={handleSave} onSaveNext={saveAndNext} onBack={goPrev} saving={saving} canBack={true} />
            </div>
          )}

          {/* ═══ FINANCIEROS ═══ */}
          {panel === 'financieros' && (
            <div data-testid="panel-financieros" style={{ width: '100%' }}>
              {/* Source header */}
              {finSource !== 'MANUAL' && (
                <div className="mb-4 p-3 flex items-center gap-2" style={{ background: 'var(--surface-1)' }}>
                  <CheckCircle2 size={12} style={{ color: '#16a34a' }} />
                  <p className="text-[10px]" style={{ color: 'var(--outline)' }}>Fuente de datos: <b>{sourceLabel}</b></p>
                </div>
              )}
              {/* Financial validation */}
              {fv.years_available?.length > 0 && (
                <div className="mb-4 flex items-center gap-3 text-[10px]" style={{ color: 'var(--outline)' }}>
                  <span>{fv.years_available.length} ejercicio{fv.years_available.length !== 1 ? 's' : ''} disponible{fv.years_available.length !== 1 ? 's' : ''}</span>
                  {Object.entries(fv.balance_deltas || {}).map(([y, d]) => d !== 0 && (
                    <span key={y} className="px-2 py-0.5 font-bold" style={{ background: 'rgba(220,38,38,0.05)', color: '#dc2626' }}>Balance {y}: descuadre {fmtES(d, 0)} €</span>
                  ))}
                </div>
              )}
              <FinancialStatementsStep financials={financials} setFinancials={setFinancials} financialDataSource={finSource} valuationInputs={valInputs} setValuationInputs={setValInputs} onRecalculate={null} />
              <div className="mt-6 p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>EXPLICACIÓN DEL EBITDA AJUSTADO</p>
                <Tip text="Describe qué ajustes no recurrentes, extraordinarios o no operativos has aplicado para obtener un EBITDA más representativo." />
                <textarea value={overrides.ebitda_explanation} onChange={e => setOverrides(p => ({...p, ebitda_explanation: e.target.value}))} rows={3} className="input-arroba w-full resize-none mt-2" placeholder="Ej: Se han eliminado gastos extraordinarios de mudanza (120K), bonus one-off (80K)..." />
              </div>
              <PanelNav onSave={handleSave} onSaveNext={saveAndNext} onBack={goPrev} saving={saving} canBack={true} />
            </div>
          )}

          {/* ═══ VALORACIÓN ═══ */}
          {panel === 'valoracion' && (
            <div className="space-y-6" data-testid="panel-valoracion">
              {valuation ? (
                <>
                  <div className="text-center p-8" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 12px rgba(25,28,30,0.04)' }}>
                    <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>RANGO DE VALORACIÓN ESTIMADO</p>
                    <p className="text-4xl font-black" style={{ color: 'var(--arroba-primary)', letterSpacing: '-0.03em' }}>{fmtMillions(valuation.valuation_min)} — {fmtMillions(valuation.valuation_max)}</p>
                    <p className="text-sm mt-2" style={{ color: 'var(--outline)' }}>Múltiplo: {valuation.multiple_min?.toFixed(1)}x — {valuation.multiple_max?.toFixed(1)}x</p>
                    <Link to="/valoracion-avanzada" className="inline-flex items-center gap-1 mt-4 text-xs font-bold" style={{ color: 'var(--arroba-primary)' }}>SOLICITAR VALORACIÓN AVANZADA <ArrowRight size={10} /></Link>
                  </div>
                  {/* Explanation */}
                  <div className="p-5" style={{ background: 'var(--surface-1)' }}>
                    <p className="text-xs font-bold mb-1" style={{ color: 'var(--on-surface)' }}>Cómo hemos estimado esta valoración</p>
                    <p className="text-xs" style={{ color: 'var(--outline)', lineHeight: 1.6 }}>Este rango se ha calculado a partir de la información financiera disponible, los factores cualitativos del negocio y múltiplos orientativos del mercado. Debe interpretarse como una referencia inicial y no como una valoración formal o vinculante.</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-12" style={{ background: 'var(--surface-1)' }}><TrendingUp size={32} className="mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} /><p className="text-sm" style={{ color: 'var(--outline)' }}>Guarda los financieros para calcular la valoración.</p></div>
              )}
              {/* Visuals */}
              <div>
                <div className="p-4 mb-4" style={{ background: 'var(--surface-1)' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: 'var(--on-surface)' }}>Dónde se mostrará cada visual</p>
                  <p className="text-[10px]" style={{ color: 'var(--outline)', lineHeight: 1.5 }}>Marca en qué superficies quieres utilizar cada gráfico: <b>Teaser</b> (vista pública), <b>Infomemo</b> (documento ampliado), <b>Buyer avanzado</b> (ficha post-NDA).</p>
                </div>
                <FinancialVisualsGallery visuals={visuals} loading={visualsLoading} onToggle={handleVisualToggle} onRegenerate={handleGenVisuals} />
              </div>
              <PanelNav onSave={handleSave} onSaveNext={saveAndNext} onBack={goPrev} saving={saving} canBack={true} />
            </div>
          )}

          {/* ═══ OPERACIÓN ═══ */}
          {panel === 'operacion' && (
            <div className="space-y-5" data-testid="panel-operacion">
              <p className="text-sm" style={{ color: 'var(--outline)' }}>Configura los términos de la operación y revisa la ficha antes de publicar.</p>
              {/* Preview */}
              <div className="p-5" style={{ background: 'var(--surface-lowest)', borderLeft: '3px solid var(--arroba-primary)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--arroba-primary)' }}>VISTA PREVIA DE LA FICHA</p>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div><span style={{ color: 'var(--outline)' }}>Empresa</span><p className="font-bold" style={{ color: 'var(--on-surface)' }}>{company?.trade_name || company?.legal_name || '—'}</p></div>
                  <div><span style={{ color: 'var(--outline)' }}>Ubicación</span><p className="font-bold" style={{ color: 'var(--on-surface)' }}>{company?.city || '—'}</p></div>
                  <div><span style={{ color: 'var(--outline)' }}>Sector</span><p className="font-bold" style={{ color: 'var(--on-surface)' }}>{overrides.taxonomy_category || company?.cnae_label || '—'}</p></div>
                  <div><span style={{ color: 'var(--outline)' }}>Facturación</span><p className="font-bold" style={{ color: 'var(--on-surface)' }}>{financials[0]?.pnl?.revenue || financials[0]?.revenue ? fmtMillions(financials[0]?.pnl?.revenue || financials[0]?.revenue) : '—'}</p></div>
                  <div><span style={{ color: 'var(--outline)' }}>EBITDA</span><p className="font-bold" style={{ color: 'var(--on-surface)' }}>{financials[0]?.pnl?.ebitda || financials[0]?.ebitda ? fmtMillions(financials[0]?.pnl?.ebitda || financials[0]?.ebitda) : '—'}</p></div>
                  <div><span style={{ color: 'var(--outline)' }}>Empleados</span><p className="font-bold" style={{ color: 'var(--on-surface)' }}>{overrides.employees_count || '—'}</p></div>
                </div>
                <div className="flex gap-1 mt-3">{Object.values(panelStatus).map((s, i) => <span key={i} className="w-2 h-2 rounded-full" style={{ background: STATUS[s]?.color }} />)}<span className="text-[9px] font-bold ml-1" style={{ color: 'var(--outline)' }}>Perfil {readiness}%</span></div>
              </div>
              {/* Pricing */}
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>PRECIO Y EXPECTATIVAS DE OFERTA</p>
                <Tip text="Define cómo quieres posicionar el precio de la operación y qué nivel de flexibilidad estás dispuesto a considerar." />
                <div className="space-y-3 mt-4">
                  <div className="flex gap-3">
                    <button onClick={() => setPricing(p => ({...p, price_strategy: 'define_price'}))} className="flex-1 p-3 text-left text-xs font-semibold" style={{ background: pricing.price_strategy === 'define_price' ? 'rgba(182,33,42,0.06)' : 'var(--surface-2)', borderLeft: pricing.price_strategy === 'define_price' ? '3px solid var(--arroba-primary)' : '3px solid transparent', color: pricing.price_strategy === 'define_price' ? 'var(--arroba-primary)' : 'var(--on-surface)' }}>Quiero definir un precio objetivo</button>
                    <button onClick={() => setPricing(p => ({...p, price_strategy: 'receive_offers'}))} className="flex-1 p-3 text-left text-xs font-semibold" style={{ background: pricing.price_strategy === 'receive_offers' ? 'rgba(182,33,42,0.06)' : 'var(--surface-2)', borderLeft: pricing.price_strategy === 'receive_offers' ? '3px solid var(--arroba-primary)' : '3px solid transparent', color: pricing.price_strategy === 'receive_offers' ? 'var(--arroba-primary)' : 'var(--on-surface)' }}>Prefiero recibir ofertas sin publicar precio</button>
                  </div>
                  {pricing.price_strategy === 'define_price' && (
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div><label className="label-arroba block mb-1">PRECIO OBJETIVO (EUR)</label><NumericInputES value={pricing.asking_price} onChange={v => setPricing(p => ({...p, asking_price: v}))} placeholder="4.000.000" className="input-arroba w-full" /></div>
                      <div><label className="label-arroba block mb-1">MARGEN DE CONFORT (%)</label><input type="number" value={pricing.comfort_margin_pct} onChange={e => setPricing(p => ({...p, comfort_margin_pct: e.target.value}))} placeholder="15" min="0" max="50" className="input-arroba w-full" /><Tip text="Porcentaje máximo por debajo del precio objetivo a partir del cual seguirías considerando revisar una oferta." /></div>
                      {comfortFloor && <p className="text-xs col-span-2" style={{ color: 'var(--outline)' }}>Con un precio objetivo de {fmtES(pricing.asking_price, 0)} € y un margen de confort de {pricing.comfort_margin_pct}%, revisarías ofertas a partir de <b style={{ color: 'var(--on-surface)' }}>{fmtES(comfortFloor, 0)} €</b></p>}
                    </div>
                  )}
                  {pricing.price_strategy === 'receive_offers' && (
                    <div className="mt-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="label-arroba block mb-1">REFERENCIA INTERNA DE VALOR (EUR)</label><NumericInputES value={pricing.internal_price_reference} onChange={v => setPricing(p => ({...p, internal_price_reference: v}))} placeholder="Opcional" className="input-arroba w-full" /><Tip text="No se publicará. Solo para uso interno." /></div>
                        <div><label className="label-arroba block mb-1">UMBRAL MÍNIMO DE INTERÉS (EUR)</label><NumericInputES value={pricing.minimum_interest_price} onChange={v => setPricing(p => ({...p, minimum_interest_price: v}))} placeholder="Opcional" className="input-arroba w-full" /></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Operation type */}
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>TIPO DE OPERACIÓN</p>
                <div className="flex gap-2">{[{id:'full_sale',l:'Venta total'},{id:'partial_sale',l:'Venta parcial'},{id:'merger',l:'Fusión'}].map(o => <button key={o.id} onClick={() => { const dc = deal || {}; const ops = dc.operation_types_allowed || []; }} className="px-4 py-2 text-xs font-bold" style={{ background: 'var(--surface-2)', color: 'var(--on-surface)' }}>{o.l}</button>)}</div>
              </div>
              {/* Motivation */}
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>MOTIVACIÓN</p>
                <textarea value={overrides.sale_motivation} onChange={e => setOverrides(p => ({...p, sale_motivation: e.target.value}))} rows={3} className="input-arroba w-full resize-none" placeholder="¿Por qué quieres vender o fusionarte? Esto no se comparte públicamente." />
              </div>
              <PanelNav onSave={handleSave} onBack={goPrev} saving={saving} canBack={true} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SellerCompanyWorkspace;
