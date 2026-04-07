import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { companiesAPI, cifAPI, dealsAPI } from '../services/api';
import { FinancialVisualsGallery } from '../components/FinancialVisualCard';
import FinancialStatementsStep from '../components/FinancialStatementsStep';
import { fmtES, fmtMillions } from '../utils/formatES';
import { NumericInputES } from '../components/NumericInputES';
import {
  Building2, FileText, TrendingUp, BarChart3, Briefcase,
  Check, Loader2, Search, ArrowLeft, ArrowRight, AlertCircle,
  Shield, Star, ChevronRight, Eye, CheckCircle2, Info
} from 'lucide-react';

/* ─── Panel status ─── */
const STATUS_CONFIG = {
  empty: { label: 'Sin completar', color: 'var(--outline-variant)', bg: 'var(--surface-2)' },
  partial: { label: 'Parcial', color: '#d97706', bg: 'rgba(217,119,6,0.06)' },
  complete: { label: 'Completo', color: '#16a34a', bg: 'rgba(22,163,74,0.06)' },
  needs_review: { label: 'Revisar', color: 'var(--arroba-primary)', bg: 'rgba(182,33,42,0.06)' },
};

const PANELS = [
  { id: 'compania', label: 'Compañía', icon: Building2 },
  { id: 'ficha', label: 'Ficha', icon: FileText },
  { id: 'financieros', label: 'Financieros', icon: BarChart3 },
  { id: 'valoracion', label: 'Valoración', icon: TrendingUp },
  { id: 'operacion', label: 'Operación y contenido', icon: Briefcase },
];

/* ─── Per-panel navigation ─── */
const PanelNav = ({ onSave, onSaveNext, onBack, saving, canBack }) => (
  <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: '1px solid var(--surface-2)' }}>
    {canBack ? (
      <button onClick={onBack} className="flex items-center gap-1 text-xs font-bold" style={{ color: 'var(--outline)' }}><ArrowLeft size={12} /> ANTERIOR</button>
    ) : <div />}
    <div className="flex gap-3">
      <button onClick={onSave} disabled={saving} className="px-5 py-2.5 text-[11px] font-bold flex items-center gap-2 disabled:opacity-50" style={{ background: 'var(--surface-2)', color: 'var(--on-surface)' }}>
        {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} GUARDAR
      </button>
      {onSaveNext && (
        <button onClick={onSaveNext} disabled={saving} className="px-5 py-2.5 text-[11px] font-bold flex items-center gap-2 disabled:opacity-50" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>
          GUARDAR Y SIGUIENTE <ArrowRight size={11} />
        </button>
      )}
    </div>
  </div>
);

/* ═══════════════════════════════════════════
   SELLER COMPANY WORKSPACE
   ═══════════════════════════════════════════ */
const SellerCompanyWorkspace = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activePanel, setActivePanel] = useState('compania');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState(null);
  const [profile, setProfile] = useState(null);
  const [deal, setDeal] = useState(null);
  const [financials, setFinancials] = useState([]);
  const [financialDataSource, setFinancialDataSource] = useState('MANUAL');
  const [valuation, setValuation] = useState(null);
  const [visuals, setVisuals] = useState(null);
  const [visualsLoading, setVisualsLoading] = useState(false);
  const [cifResult, setCifResult] = useState(null);
  const [cifLoading, setCifLoading] = useState(false);

  // Seller-only overrides
  const [overrides, setOverrides] = useState({
    trade_name: '', description: '', employees_count: '', founded_year: '',
    taxonomy_category: '', taxonomy_subcategory: '',
    recurring_revenue_pct: '', client_concentration_top5: '',
    founder_dependency: 'medium', sale_motivation: '',
    adjusted_ebitda_by_year: {},
    ebitda_explanation: '',
  });

  // Deal config
  const [dealConfig, setDealConfig] = useState({
    operation_types: [], asking_price: '', negotiable: true,
  });

  // Valuation inputs
  const [valuationInputs, setValuationInputs] = useState({
    founder_dependency: 'medium', recurring_revenue_type: 'mixed',
  });

  // Panel status
  const [panelStatus, setPanelStatus] = useState({
    compania: 'empty', ficha: 'empty', financieros: 'empty',
    valoracion: 'empty', operacion: 'empty',
  });

  // Load data
  useEffect(() => {
    const load = async () => {
      try {
        if (companyId) {
          const res = await companiesAPI.get(companyId);
          setCompany(res.data);
          // Hydrate from existing data
          const c = res.data;
          setOverrides(prev => ({
            ...prev,
            trade_name: c.trade_name || '',
            description: c.description || '',
            employees_count: c.employees_count || '',
            founded_year: c.founded_year || '',
            taxonomy_category: c.taxonomy_category || c.sectors?.[0] || '',
            recurring_revenue_pct: c.financials?.[0]?.recurring_revenue_pct || '',
            client_concentration_top5: c.financials?.[0]?.client_concentration_top5 || '',
          }));
          if (c.financials?.length) {
            setFinancials(c.financials);
            setFinancialDataSource(c.financials[0]?.data_source || 'MANUAL');
          }
          if (c.valuation) setValuation(c.valuation);
          // Load visuals
          try { const vRes = await companiesAPI.getVisuals(companyId); setVisuals(vRes.data?.financial_visuals); } catch {}
          // Load deal
          try {
            const dRes = await dealsAPI.list();
            const d = dRes.data?.find(x => x.company_id === companyId);
            if (d) {
              setDeal(d);
              setDealConfig({ operation_types: d.operation_types_allowed || [], asking_price: d.asking_price || '', negotiable: d.negotiable !== false });
            }
          } catch {}
          // Compute panel status
          computePanelStatus(c);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [companyId]);

  const computePanelStatus = (c) => {
    const s = { ...panelStatus };
    s.compania = c?.legal_name && c?.cif ? 'complete' : c?.legal_name ? 'partial' : 'empty';
    s.ficha = c?.description || c?.trade_name ? (c.description && c.sectors?.length ? 'complete' : 'partial') : 'empty';
    s.financieros = c?.financials?.length ? (c.financials[0]?.revenue ? 'complete' : 'partial') : 'empty';
    s.valoracion = c?.valuation ? 'complete' : 'empty';
    s.operacion = deal ? 'complete' : 'empty';
    setPanelStatus(s);
  };

  const profileReadiness = Math.round((Object.values(panelStatus).filter(v => v === 'complete').length / PANELS.length) * 100);
  const dealReadiness = deal?.status === 'published' ? 100 : deal ? 50 : 0;

  const panelIdx = PANELS.findIndex(p => p.id === activePanel);
  const goNext = () => { if (panelIdx < PANELS.length - 1) setActivePanel(PANELS[panelIdx + 1].id); };
  const goPrev = () => { if (panelIdx > 0) setActivePanel(PANELS[panelIdx - 1].id); };
  const saveAndNext = async () => { await handleSave(); goNext(); };

  // CIF lookup
  const handleCifLookup = async (cif) => {
    if (!cif || cif.length < 5) return;
    setCifLoading(true);
    try {
      const res = await cifAPI.resolve(cif);
      setCifResult(res.data);
      if (res.data?.identity?.legal_name) {
        setCompany(prev => ({
          ...(prev || {}),
          legal_name: res.data.identity.legal_name,
          cif: res.data.identity.cif,
          city: res.data.identity.city,
          province: res.data.identity.province,
          website: res.data.identity.website,
          cnae_code: res.data.identity.cnae_code,
          cnae_label: res.data.identity.cnae_label,
          legal_form: res.data.identity.legal_form,
          street: res.data.identity.street,
          postal_code: res.data.identity.postal_code,
          phone: res.data.identity.phone,
          founded_date: res.data.identity.founded_date,
          company_master_id: res.data.company_master_id,
          iberinform_synced: true,
        }));
        // Taxonomy from CIS
        if (res.data.taxonomy) {
          setOverrides(prev => ({
            ...prev,
            taxonomy_category: res.data.taxonomy.category || prev.taxonomy_category,
            taxonomy_subcategory: res.data.taxonomy.subcategory || prev.taxonomy_subcategory,
          }));
        }
        // Enrichment from CIS
        if (res.data.enrichment?.description) {
          setOverrides(prev => ({ ...prev, description: res.data.enrichment.description }));
        }
        // Financials — ALL years from CIS
        if (res.data.financials?.length) {
          setFinancials(res.data.financials);
          setFinancialDataSource(res.data.source || 'CIS');
        }
        // Employees from latest financial year
        const latestFin = res.data.financials?.find(f => f.employees);
        if (latestFin?.employees) {
          setOverrides(prev => ({ ...prev, employees_count: prev.employees_count || String(latestFin.employees) }));
        }
        // Founded year from identity
        if (res.data.identity.founded_date) {
          const yearMatch = res.data.identity.founded_date.match(/(\d{4})/);
          if (yearMatch) setOverrides(prev => ({ ...prev, founded_year: prev.founded_year || yearMatch[1] }));
        }
        setPanelStatus(prev => ({
          ...prev,
          compania: 'complete',
          ficha: res.data.enrichment?.description || res.data.taxonomy?.category ? 'partial' : 'empty',
          financieros: res.data.financials?.length ? 'needs_review' : 'empty',
        }));
      }
    } catch {}
    finally { setCifLoading(false); }
  };

  // Save
  const handleSave = async () => {
    if (!companyId && !company?.legal_name) return;
    setSaving(true);
    try {
      let id = companyId;
      if (!id) {
        const res = await companiesAPI.create({
          legal_name: company.legal_name, cif: company.cif, country: 'España',
          city: company.city, trade_name: overrides.trade_name,
          website: company.website, founded_year: overrides.founded_year,
          employees_count: overrides.employees_count,
          company_master_id: company.company_master_id,
        });
        id = res.data.company_id;
      } else {
        await companiesAPI.update(id, {
          trade_name: overrides.trade_name, description: overrides.description,
          city: company.city, website: company.website,
          founded_year: overrides.founded_year, employees_count: overrides.employees_count,
        });
      }
      if (financials.length) {
        await companiesAPI.updateFinancials(id, { financials });
      }
      navigate(`/seller/company/${id}`);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  // Generate visuals
  const handleGenerateVisuals = async () => {
    if (!companyId) return;
    setVisualsLoading(true);
    try { const r = await companiesAPI.generateVisuals(companyId); setVisuals(r.data.visuals); } catch {}
    finally { setVisualsLoading(false); }
  };

  const handleVisualToggle = (chartId, key, value) => {
    if (!visuals) return;
    setVisuals(prev => ({ ...prev, [chartId]: { ...prev[chartId], [key]: value } }));
    if (companyId) companiesAPI.updateVisualSettings(companyId, { [chartId]: { [key]: value } }).catch(() => {});
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-0)' }}><Loader2 size={18} className="animate-spin" style={{ color: 'var(--outline)' }} /></div>;

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-0)' }} data-testid="seller-company-workspace">

      {/* ─── SIDEBAR ─── */}
      <aside className="fixed left-0 top-0 bottom-0 w-60 flex flex-col z-40 overflow-y-auto" style={{ background: 'var(--surface-1)', paddingTop: 24 }}>
        <div className="px-6 mb-4">
          <Link to="/" className="text-2xl font-black tracking-tight block mb-2" style={{ color: 'var(--arroba-primary)', letterSpacing: '-0.03em' }}>arroba</Link>
          <p className="label-arroba" style={{ color: 'var(--outline)', fontSize: 9 }}>PREPARACIÓN DEL ACTIVO</p>
          <p className="text-xs font-bold mt-1 truncate" style={{ color: 'var(--on-surface)' }}>{company?.trade_name || company?.legal_name || 'Nueva compañía'}</p>
        </div>

        {/* Readiness */}
        <div className="px-4 mb-4">
          <div className="px-3 py-2" style={{ background: 'var(--surface-2)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>PERFIL</span>
              <span className="text-[10px] font-bold" style={{ color: profileReadiness >= 80 ? '#16a34a' : profileReadiness >= 40 ? '#d97706' : 'var(--outline)' }}>{profileReadiness}%</span>
            </div>
            <div className="w-full h-1" style={{ background: 'var(--surface-1)' }}><div className="h-full transition-all" style={{ background: profileReadiness >= 80 ? '#16a34a' : '#d97706', width: `${profileReadiness}%` }} /></div>
          </div>
        </div>

        {/* Panel navigation */}
        <nav className="flex-1 flex flex-col gap-0.5 px-3">
          {PANELS.map(p => {
            const Icon = p.icon;
            const isActive = p.id === activePanel;
            const status = STATUS_CONFIG[panelStatus[p.id]] || STATUS_CONFIG.empty;
            return (
              <button key={p.id} onClick={() => setActivePanel(p.id)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-left transition-all"
                style={{
                  color: isActive ? 'var(--arroba-primary)' : 'var(--on-surface-variant)',
                  background: isActive ? 'var(--surface-lowest)' : 'transparent',
                  boxShadow: isActive ? '0px 4px 12px rgba(26,28,28,0.06)' : 'none',
                }}
                data-testid={`panel-${p.id}`}>
                <Icon size={14} />
                <span className="text-xs font-semibold uppercase tracking-wider flex-1">{p.label}</span>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: status.color }} />
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-4 pb-6 mt-auto">
          <Link to="/seller"><button className="w-full py-2.5 text-[11px] font-bold flex items-center justify-center gap-2" style={{ background: 'var(--on-surface)', color: '#fff' }}><ArrowLeft size={11} /> VOLVER AL DASHBOARD</button></Link>
        </div>
      </aside>

      {/* ─── MAIN ─── */}
      <main className="ml-60 min-h-screen" style={{ paddingTop: 32 }}>
        <div className="max-w-[1100px] mx-auto px-8 pb-16">

          {/* Header */}
          <div className="mb-8">
            <p className="label-arroba mb-2" style={{ color: 'var(--arroba-primary)' }}>{PANELS.find(p => p.id === activePanel)?.label.toUpperCase()}</p>
            <h1 className="text-3xl font-extrabold" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>{company?.trade_name || company?.legal_name || 'Nueva compañía'}</h1>
          </div>

          {/* ═══ PANEL: COMPAÑÍA ═══ */}
          {activePanel === 'compania' && (
            <div className="space-y-5" data-testid="panel-compania">
              <p className="text-sm" style={{ color: 'var(--outline)' }}>Verifica tu empresa por CIF para precargar datos desde el registro.</p>
              {/* CIF Search */}
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>VERIFICAR EMPRESA</p>
                <div className="flex gap-3">
                  <input type="text" value={company?.cif || ''} onChange={e => setCompany(prev => ({...(prev||{}), cif: e.target.value.toUpperCase()}))} placeholder="CIF / NIF" className="input-arroba flex-1" data-testid="input-cif" />
                  <button onClick={() => handleCifLookup(company?.cif)} disabled={cifLoading} className="px-6 py-2 text-xs font-bold flex items-center gap-2 disabled:opacity-50" style={{ background: 'var(--on-surface)', color: '#fff' }}>
                    {cifLoading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />} VERIFICAR
                  </button>
                </div>
                {cifResult && (
                  <div className={`mt-3 p-3 text-xs font-semibold ${cifResult.identity?.legal_name ? 'text-green-700' : 'text-amber-600'}`} style={{ background: cifResult.identity?.legal_name ? 'rgba(22,163,74,0.06)' : 'rgba(217,119,6,0.06)' }}>
                    {cifResult.identity?.legal_name ? (
                      <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Empresa encontrada: {cifResult.identity.legal_name} — Fuente: {cifResult.source}</span>
                    ) : 'No encontrada. Puedes completar los datos manualmente.'}
                  </div>
                )}
              </div>
              {/* Identity fields */}
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>DATOS REGISTRALES {company?.iberinform_synced && <span className="text-[8px] font-bold px-1.5 py-0.5 ml-1" style={{ background: 'rgba(22,163,74,0.06)', color: '#16a34a' }}>PRECARGADOS</span>}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label-arroba block mb-1">DENOMINACIÓN SOCIAL</label><input value={company?.legal_name || ''} onChange={e => setCompany(prev => ({...(prev||{}), legal_name: e.target.value}))} className="input-arroba w-full" data-testid="input-legal-name" /></div>
                  <div><label className="label-arroba block mb-1">FORMA JURÍDICA</label><input value={company?.legal_form || ''} onChange={e => setCompany(prev => ({...(prev||{}), legal_form: e.target.value}))} className="input-arroba w-full" /></div>
                  <div><label className="label-arroba block mb-1">CIUDAD</label><input value={company?.city || ''} onChange={e => setCompany(prev => ({...(prev||{}), city: e.target.value}))} className="input-arroba w-full" /></div>
                  <div><label className="label-arroba block mb-1">PROVINCIA</label><input value={company?.province || ''} onChange={e => setCompany(prev => ({...(prev||{}), province: e.target.value}))} className="input-arroba w-full" /></div>
                  <div><label className="label-arroba block mb-1">SITIO WEB</label><input value={company?.website || ''} onChange={e => setCompany(prev => ({...(prev||{}), website: e.target.value}))} className="input-arroba w-full" /></div>
                  <div><label className="label-arroba block mb-1">CNAE</label><input value={company?.cnae_code ? `${company.cnae_code} — ${company.cnae_label || ''}` : ''} readOnly className="input-arroba w-full opacity-60" /></div>
                </div>
              </div>
              {/* Coverage badges */}
              {cifResult?.coverage && (
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(cifResult.coverage).map(([k, v]) => (
                    <span key={k} className="px-2 py-1 text-[9px] font-bold" style={{ background: v ? 'rgba(22,163,74,0.06)' : 'var(--surface-2)', color: v ? '#16a34a' : 'var(--outline)' }}>
                      {v ? <Check size={9} className="inline mr-0.5" /> : null} {k.toUpperCase()}
                    </span>
                  ))}
                </div>
              )}
              {/* Source + last update */}
              {company?.iberinform_synced && (
                <div className="p-3 flex items-center justify-between" style={{ background: 'var(--surface-1)' }}>
                  <div>
                    <p className="text-[10px]" style={{ color: 'var(--outline)' }}>Fuente: <b>{cifResult?.source === 'CIS' ? 'CIS' : 'Iberinform (fallback transitorio)'}</b></p>
                    {cifResult?.resolution_meta?.resolved_at && <p className="text-[9px]" style={{ color: 'var(--outline-variant)' }}>Última actualización: {new Date(cifResult.resolution_meta.resolved_at).toLocaleDateString('es-ES')}</p>}
                  </div>
                  <button onClick={() => handleCifLookup(company.cif)} className="text-[10px] font-bold" style={{ color: 'var(--arroba-primary)' }}>REFRESCAR DESDE CIS</button>
                </div>
              )}
              <PanelNav onSave={handleSave} onSaveNext={saveAndNext} saving={saving} canBack={false} />
            </div>
          )}

          {/* ═══ PANEL: FICHA ═══ */}
          {activePanel === 'ficha' && (
            <div className="space-y-5" data-testid="panel-ficha">
              <p className="text-sm" style={{ color: 'var(--outline)' }}>Completa la información cualitativa de tu agencia. Solo necesitas añadir lo que el registro no cubre.</p>
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>INFORMACIÓN SELLER</p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><label className="label-arroba block mb-1">NOMBRE COMERCIAL</label><input value={overrides.trade_name} onChange={e => setOverrides(p => ({...p, trade_name: e.target.value}))} className="input-arroba w-full" /></div>
                  <div><label className="label-arroba block mb-1">AÑO FUNDACIÓN</label><input type="number" value={overrides.founded_year} onChange={e => setOverrides(p => ({...p, founded_year: e.target.value}))} className="input-arroba w-full" /></div>
                  <div><label className="label-arroba block mb-1">EMPLEADOS</label><input type="number" value={overrides.employees_count} onChange={e => setOverrides(p => ({...p, employees_count: e.target.value}))} className="input-arroba w-full" /></div>
                  <div><label className="label-arroba block mb-1">DEPENDENCIA DEL FUNDADOR</label>
                    <select value={overrides.founder_dependency} onChange={e => setOverrides(p => ({...p, founder_dependency: e.target.value}))} className="input-arroba w-full">
                      <option value="low">Baja — equipo autónomo</option><option value="medium">Media — fundador operativo</option><option value="high">Alta — fundador imprescindible</option>
                    </select>
                  </div>
                </div>
                <div><label className="label-arroba block mb-1">DESCRIPCIÓN</label><textarea value={overrides.description} onChange={e => setOverrides(p => ({...p, description: e.target.value}))} rows={4} className="input-arroba w-full resize-none" placeholder="Describe tu agencia, servicios principales, posicionamiento..." /></div>
              </div>
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>MÉTRICAS CUALITATIVAS</p>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label-arroba block mb-1">% INGRESOS RECURRENTES</label><NumericInputES value={overrides.recurring_revenue_pct} onChange={v => setOverrides(p => ({...p, recurring_revenue_pct: v}))} placeholder="70" className="input-arroba w-full" /></div>
                  <div><label className="label-arroba block mb-1">% CONCENTRACIÓN TOP 5 CLIENTES</label><NumericInputES value={overrides.client_concentration_top5} onChange={v => setOverrides(p => ({...p, client_concentration_top5: v}))} placeholder="40" className="input-arroba w-full" /></div>
                </div>
              </div>
              <PanelNav onSave={handleSave} onSaveNext={saveAndNext} onBack={goPrev} saving={saving} canBack={true} />
            </div>
          )}

          {/* ═══ PANEL: FINANCIEROS ═══ */}
          {activePanel === 'financieros' && (
            <div data-testid="panel-financieros" style={{ width: '100%' }}>
              <FinancialStatementsStep financials={financials} setFinancials={setFinancials} financialDataSource={financialDataSource} valuationInputs={valuationInputs} setValuationInputs={setValuationInputs} onRecalculate={null} />
              {/* EBITDA bridge / explanation */}
              <div className="mt-6 p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>EXPLICACIÓN DEL EBITDA AJUSTADO</p>
                <p className="text-[10px] mb-3" style={{ color: 'var(--outline)' }}>Describe qué ajustes no recurrentes, extraordinarios o no operativos has aplicado para obtener un EBITDA más representativo.</p>
                <textarea value={overrides.ebitda_explanation} onChange={e => setOverrides(p => ({...p, ebitda_explanation: e.target.value}))} rows={3} className="input-arroba w-full resize-none" placeholder="Ej: Se han eliminado gastos extraordinarios de mudanza (120K), bonus one-off al fundador (80K) y un litigio ya resuelto (50K)." data-testid="ebitda-explanation" />
              </div>
              <PanelNav onSave={handleSave} onSaveNext={saveAndNext} onBack={goPrev} saving={saving} canBack={true} />
            </div>
          )}

          {/* ═══ PANEL: VALORACIÓN ═══ */}
          {activePanel === 'valoracion' && (
            <div className="space-y-6" data-testid="panel-valoracion">
              <p className="text-sm" style={{ color: 'var(--outline)' }}>Valoración estimada y gráficos financieros reutilizables para teaser, infomemo y ficha buyer.</p>
              {valuation ? (
                <div className="text-center p-8" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 12px rgba(25,28,30,0.04)' }}>
                  <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>RANGO DE VALORACIÓN</p>
                  <p className="text-4xl font-black" style={{ color: 'var(--arroba-primary)', letterSpacing: '-0.03em' }}>{fmtMillions(valuation.valuation_min)} — {fmtMillions(valuation.valuation_max)}</p>
                  <p className="text-sm mt-2" style={{ color: 'var(--outline)' }}>Múltiplo: {valuation.multiple_min?.toFixed(1)}x — {valuation.multiple_max?.toFixed(1)}x</p>
                </div>
              ) : (
                <div className="text-center py-12" style={{ background: 'var(--surface-1)' }}>
                  <TrendingUp size={32} className="mx-auto mb-3" style={{ color: 'var(--outline-variant)' }} />
                  <p className="text-sm" style={{ color: 'var(--outline)' }}>Guarda los financieros primero para calcular la valoración.</p>
                </div>
              )}
              {/* Visuals gallery */}
              <FinancialVisualsGallery visuals={visuals} loading={visualsLoading} onToggle={handleVisualToggle} onRegenerate={handleGenerateVisuals} />
              <PanelNav onSave={handleSave} onSaveNext={saveAndNext} onBack={goPrev} saving={saving} canBack={true} />
            </div>
          )}

          {/* ═══ PANEL: OPERACIÓN ═══ */}
          {activePanel === 'operacion' && (
            <div className="space-y-5" data-testid="panel-operacion">
              <p className="text-sm" style={{ color: 'var(--outline)' }}>Configura los términos de la operación y revisa la ficha antes de publicar.</p>

              {/* Company preview card */}
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)', borderLeft: '3px solid var(--arroba-primary)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--arroba-primary)' }}>VISTA PREVIA DE LA FICHA</p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div><span style={{ color: 'var(--outline)' }}>Empresa</span><p className="font-bold" style={{ color: 'var(--on-surface)' }}>{company?.trade_name || company?.legal_name || '—'}</p></div>
                  <div><span style={{ color: 'var(--outline)' }}>Ubicación</span><p className="font-bold" style={{ color: 'var(--on-surface)' }}>{company?.city || '—'}, {company?.province || ''}</p></div>
                  <div><span style={{ color: 'var(--outline)' }}>Sector</span><p className="font-bold" style={{ color: 'var(--on-surface)' }}>{company?.cnae_label || overrides.taxonomy_category || '—'}</p></div>
                  <div><span style={{ color: 'var(--outline)' }}>Empleados</span><p className="font-bold" style={{ color: 'var(--on-surface)' }}>{overrides.employees_count || '—'}</p></div>
                  <div><span style={{ color: 'var(--outline)' }}>Facturación</span><p className="font-bold" style={{ color: 'var(--on-surface)' }}>{financials[0]?.pnl?.revenue || financials[0]?.revenue ? fmtMillions(financials[0]?.pnl?.revenue || financials[0]?.revenue) : '—'}</p></div>
                  <div><span style={{ color: 'var(--outline)' }}>EBITDA</span><p className="font-bold" style={{ color: 'var(--on-surface)' }}>{financials[0]?.pnl?.ebitda || financials[0]?.ebitda ? fmtMillions(financials[0]?.pnl?.ebitda || financials[0]?.ebitda) : '—'}</p></div>
                </div>
                {overrides.description && <p className="text-xs mt-3" style={{ color: 'var(--outline)', lineHeight: 1.5 }}>{overrides.description.substring(0, 200)}...</p>}
                <div className="flex gap-2 mt-3">
                  {Object.values(panelStatus).map((s, i) => {
                    const st = STATUS_CONFIG[s];
                    return <span key={i} className="w-2 h-2 rounded-full" style={{ background: st.color }} />;
                  })}
                  <span className="text-[9px] font-bold ml-1" style={{ color: 'var(--outline)' }}>Perfil {profileReadiness}% completo</span>
                </div>
              </div>
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>CONFIGURACIÓN</p>
                <div className="mb-4">
                  <label className="label-arroba block mb-2">TIPO DE OPERACIÓN</label>
                  <div className="flex gap-2">
                    {[{id:'full_sale',label:'Venta total'},{id:'partial_sale',label:'Venta parcial'},{id:'merger',label:'Fusión'}].map(op => (
                      <button key={op.id} onClick={() => setDealConfig(p => ({...p, operation_types: p.operation_types.includes(op.id) ? p.operation_types.filter(x=>x!==op.id) : [...p.operation_types, op.id]}))}
                        className="px-4 py-2 text-xs font-bold" style={{ background: dealConfig.operation_types.includes(op.id) ? 'var(--on-surface)' : 'var(--surface-2)', color: dealConfig.operation_types.includes(op.id) ? '#fff' : 'var(--on-surface)' }}>{op.label}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label-arroba block mb-1">PRECIO SOLICITADO (EUR)</label><NumericInputES value={dealConfig.asking_price} onChange={v => setDealConfig(p => ({...p, asking_price: v}))} placeholder="3.500.000" className="input-arroba w-full" /></div>
                  <div><label className="label-arroba block mb-1">NEGOCIABLE</label>
                    <select value={dealConfig.negotiable ? 'yes' : 'no'} onChange={e => setDealConfig(p => ({...p, negotiable: e.target.value === 'yes'}))} className="input-arroba w-full">
                      <option value="yes">Sí, negociable</option><option value="no">No negociable</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>MOTIVACIÓN</p>
                <textarea value={overrides.sale_motivation} onChange={e => setOverrides(p => ({...p, sale_motivation: e.target.value}))} rows={3} className="input-arroba w-full resize-none" placeholder="¿Por qué quieres vender o fusionarte? Esto no se comparte públicamente." />
              </div>
              {/* Deal readiness */}
              <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
                <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>ESTADO DE PUBLICACIÓN</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{deal ? (deal.status === 'published' ? 'Publicado' : 'Borrador') : 'Sin deal creado'}</p>
                    <p className="text-xs" style={{ color: 'var(--outline)' }}>Perfil {profileReadiness}% completo · Deal {dealReadiness}% listo</p>
                  </div>
                  {!deal && (
                    <button onClick={async () => { try { const r = await dealsAPI.create({ company_id: companyId, operation_types_allowed: dealConfig.operation_types, asking_price: dealConfig.asking_price }); setDeal(r.data); } catch {} }}
                      className="px-5 py-2 text-xs font-bold" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>CREAR DEAL</button>
                  )}
                </div>
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
