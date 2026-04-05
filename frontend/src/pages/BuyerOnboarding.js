import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, TrendingUp, MapPin, Check, Loader2, Building2, Briefcase,
  Info, Search, ArrowRight, ArrowLeft, Shield, Lock, Eye, AlertCircle, CheckCircle2
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { usersAPI, taxonomyAPI, cifAPI } from '../services/api';
import { fmtES, fmtEUR, fmtPct } from '../utils/formatES';
import { NumericInputES } from '../components/NumericInputES';

/* ═══ SHARED PROVINCES (single source of truth) ═══ */
export const SPAIN_PROVINCES = [
  'A Coruña','Álava','Albacete','Alicante','Almería','Asturias','Ávila','Badajoz','Barcelona','Bizkaia',
  'Burgos','Cáceres','Cádiz','Cantabria','Castellón','Ceuta','Ciudad Real','Córdoba','Cuenca','Gipuzkoa',
  'Girona','Granada','Guadalajara','Huelva','Huesca','Illes Balears','Jaén','La Rioja','Las Palmas',
  'León','Lleida','Lugo','Madrid','Málaga','Melilla','Murcia','Navarra','Ourense','Palencia','Pontevedra',
  'Salamanca','Santa Cruz de Tenerife','Segovia','Sevilla','Soria','Tarragona','Teruel','Toledo',
  'Valencia','Valladolid','Zamora','Zaragoza'
];

const QUALITATIVE_OPTIONS = [
  { id: 'low_founder_dependency', label: 'Poca dependencia del fundador' },
  { id: 'small_team', label: 'Equipo pequeño' },
  { id: 'senior_team', label: 'Equipo senior' },
  { id: 'own_product', label: 'Producto propio' },
  { id: 'low_client_concentration', label: 'Poca concentración de clientes' },
  { id: 'recurring_revenue', label: 'Ingresos recurrentes' },
  { id: 'high_margin', label: 'Margen alto' },
  { id: 'integration_potential', label: 'Potencial de integración' },
  { id: 'niche_positioning', label: 'Posicionamiento nicho' },
  { id: 'low_client_churn', label: 'Baja rotación de clientes' },
];
const qualLabel = (id) => QUALITATIVE_OPTIONS.find(q => q.id === id)?.label || id;

const OP_TYPES = [
  { id: 'full_sale', label: 'Venta total' },
  { id: 'partial_sale', label: 'Venta parcial' },
  { id: 'merger', label: 'Fusión' },
];

const FIN_SUBTYPES = [
  { id: 'private_equity', label: 'Private Equity' },
  { id: 'venture_capital', label: 'Venture Capital' },
  { id: 'family_office', label: 'Family Office' },
  { id: 'independiente', label: 'Inversor independiente' },
];

const Tip = ({ text }) => (
  <div className="flex items-start gap-1.5 mt-1.5">
    <Info size={11} className="shrink-0 mt-0.5" style={{ color: 'var(--outline)' }} />
    <p className="text-[10px]" style={{ color: 'var(--outline)', lineHeight: 1.4 }}>{text}</p>
  </div>
);

const SelectBtn = ({ selected, onClick, children, testId }) => (
  <button onClick={onClick} className="w-full text-left px-4 py-3 text-sm font-semibold transition-all flex items-center justify-between"
    style={{ background: selected ? 'rgba(182,33,42,0.06)' : 'var(--surface-2)', borderLeft: selected ? '3px solid var(--arroba-primary)' : '3px solid transparent', color: selected ? 'var(--arroba-primary)' : 'var(--on-surface)' }}
    data-testid={testId}>
    {children} {selected && <Check size={14} />}
  </button>
);

const ChipBtn = ({ selected, onClick, children, testId }) => (
  <button onClick={onClick} className="px-4 py-2 text-xs font-bold transition-all"
    style={{ background: selected ? 'var(--on-surface)' : 'var(--surface-2)', color: selected ? '#fff' : 'var(--on-surface)' }}
    data-testid={testId}>
    {children}
  </button>
);

/* ═══ MAIN ═══ */
const BuyerOnboarding = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [provinceSearch, setProvinceSearch] = useState('');
  const [cifStatus, setCifStatus] = useState('');
  const [cifChecking, setCifChecking] = useState(false);
  const [responsibleDeclaration, setResponsibleDeclaration] = useState(false);
  const [finalConfirm, setFinalConfirm] = useState(false);
  const [verifiedStatus, setVerifiedStatus] = useState('not_started');
  const [reinforcedStatus, setReinforcedStatus] = useState('not_started');
  const [uploadingLevel, setUploadingLevel] = useState('');

  const [form, setForm] = useState({
    company_name: '', company_tax_id: '', job_title: '', acquisition_thesis: '',
    buyer_category: '', buyer_financial_subtype: '', type: '',
    operation_types: [], taxonomy_categories: [],
    ticket_min: '', ticket_max: '', revenue_range_min: '', revenue_range_max: '',
    ebitda_margin_min_pct: '',
    qualitative_criteria: [],
    geography_provinces: [],
    profile_privacy_mode: 'public',
  });

  useEffect(() => {
    taxonomyAPI.getCategories().then(r => setCategories(r.data)).catch(() => {});
    if (user?.buyer_profile) {
      const bp = user.buyer_profile;
      const cat = bp.buyer_category || (bp.type === 'strategic' ? 'strategic' : bp.type ? 'financial' : '');
      setForm(prev => ({
        ...prev, company_name: bp.company_name || '', company_tax_id: bp.company_tax_id || '',
        job_title: bp.job_title || '', acquisition_thesis: bp.acquisition_thesis || '',
        buyer_category: cat, buyer_financial_subtype: bp.buyer_financial_subtype || '',
        type: bp.type || '', operation_types: bp.operation_types || [],
        taxonomy_categories: bp.taxonomy_categories || [],
        ticket_min: bp.ticket_min || '', ticket_max: bp.ticket_max || '',
        revenue_range_min: bp.revenue_range_min || '', revenue_range_max: bp.revenue_range_max || '',
        ebitda_margin_min_pct: bp.ebitda_margin_min_pct || '',
        qualitative_criteria: bp.qualitative_criteria || [],
        geography_provinces: bp.geography_provinces || [],
        profile_privacy_mode: bp.profile_privacy_mode || 'public',
      }));
    }
  }, [user]);

  const toggle = (field, value) => setForm(p => {
    const arr = p[field]; return { ...p, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
  });

  const STEPS = ['Empresa', 'Perfil', 'Sectores', 'Financieros', 'Cualitativo', 'Geografía', 'Verificación', 'Revisión'];

  const computeType = () => {
    if (form.buyer_category === 'strategic') return 'strategic';
    if (form.buyer_category === 'financial' && form.buyer_financial_subtype) return form.buyer_financial_subtype;
    return form.buyer_category || '';
  };

  const canNext = () => {
    if (step === 0) return form.company_name && form.job_title;
    if (step === 1) return form.buyer_category && (form.buyer_category === 'strategic' || form.buyer_financial_subtype) && form.operation_types.length > 0;
    if (step === 2) return form.taxonomy_categories.length > 0;
    if (step === 3) return form.ticket_min && form.revenue_range_min;
    if (step === 6) return responsibleDeclaration;
    return true;
  };

  const validateCif = async () => {
    if (!form.company_tax_id || form.company_tax_id.length < 9) return;
    setCifChecking(true); setCifStatus('');
    try {
      const res = await cifAPI.lookup(form.company_tax_id);
      if (res.data?.found) {
        setCifStatus('valid');
        if (res.data.company_name && !form.company_name) {
          setForm(p => ({ ...p, company_name: res.data.company_name }));
        }
      } else { setCifStatus('not_found'); }
    } catch { setCifStatus('service_error'); }
    finally { setCifChecking(false); }
  };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      await usersAPI.updateBuyerProfile({
        company_name: form.company_name.trim() || null,
        company_tax_id: form.company_tax_id.trim() || null,
        job_title: form.job_title.trim() || null,
        acquisition_thesis: form.acquisition_thesis.trim() || null,
        type: computeType(),
        buyer_category: form.buyer_category,
        buyer_financial_subtype: form.buyer_financial_subtype || null,
        operation_types: form.operation_types,
        taxonomy_categories: form.taxonomy_categories,
        ticket_min: parseFloat(form.ticket_min) || null,
        ticket_max: parseFloat(form.ticket_max) || null,
        revenue_range_min: parseFloat(form.revenue_range_min) || null,
        revenue_range_max: parseFloat(form.revenue_range_max) || null,
        ebitda_margin_min_pct: parseFloat(form.ebitda_margin_min_pct) || null,
        qualitative_criteria: form.qualitative_criteria,
        geography_provinces: form.geography_provinces,
        geography_country: 'España',
        profile_privacy_mode: form.profile_privacy_mode,
        company_verification_level: (form.company_name && form.company_tax_id && form.job_title && responsibleDeclaration) ? 'declared' : 'not_started',
        company_tax_id_validation_status: cifStatus === 'valid' ? 'validated' : cifStatus === 'not_found' ? 'invalid' : cifStatus === 'service_error' ? 'service_unavailable' : 'not_started',
        company_tax_id_validation_source: cifStatus ? 'iberinform' : null,
      });
      if (refreshUser) await refreshUser();
      navigate('/buyer/procesos');
    } catch (err) { setError(err.response?.data?.detail || 'Error al guardar'); }
    finally { setLoading(false); }
  };

  const isFree = !user?.subscription?.plan_type || user?.subscription?.plan_type === 'buyer_free';

  const handleDocUpload = async (file, level) => {
    if (!file) return;
    setUploadingLevel(level);
    try {
      // Upload document via a general endpoint (prepared for future implementation)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('level', level);
      formData.append('type', 'company_verification');
      // For now, mark as pending since admin review is needed
      if (level === 'verified') setVerifiedStatus('pending');
      if (level === 'reinforced') setReinforcedStatus('pending');
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploadingLevel('');
    }
  };
  const filteredProv = provinceSearch ? SPAIN_PROVINCES.filter(p => p.toLowerCase().includes(provinceSearch.toLowerCase())) : SPAIN_PROVINCES;
  const catNames = form.taxonomy_categories.map(id => categories.find(c => c.id === id)?.name || id);
  const qualNames = form.qualitative_criteria.map(qualLabel);
  const geoLabel = form.geography_provinces.length === SPAIN_PROVINCES.length ? 'Todas' : form.geography_provinces.length > 5 ? `${form.geography_provinces.slice(0, 5).join(', ')} y ${form.geography_provinces.length - 5} más` : form.geography_provinces.join(', ') || '—';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl" data-testid="buyer-onboarding">
        <div className="mb-6 text-center">
          <p className="label-arroba mb-2" style={{ color: 'var(--arroba-primary)' }}>PERFIL DE COMPRADOR</p>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>Completa tu perfil</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--outline)' }}>Paso {step + 1} de {STEPS.length}</p>
        </div>
        <div className="flex gap-1 mb-8">{STEPS.map((_, i) => (<div key={i} className="flex-1 h-1.5" style={{ background: i <= step ? 'var(--arroba-primary)' : 'var(--surface-2)', transition: 'background 0.2s' }} />))}</div>
        {error && <div className="mb-4 p-3 text-sm" style={{ background: 'rgba(220,38,38,0.05)', color: '#dc2626', borderLeft: '3px solid #dc2626' }}>{error}</div>}

        {/* ═══ STEP 0: Empresa ═══ */}
        {step === 0 && (
          <div className="space-y-5" data-testid="step-empresa">
            <h2 className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>Datos de la empresa</h2>
            <Tip text="Estos datos se usan para la verificación de tu perfil y aparecen al firmar documentos legales." />
            <div><label className="label-arroba block mb-1">NOMBRE DE LA EMPRESA *</label><input type="text" value={form.company_name} onChange={e => setForm(p => ({...p, company_name: e.target.value}))} placeholder="Nombre de tu empresa o vehículo inversor" className="input-arroba w-full" data-testid="input-company" /></div>
            <div>
              <label className="label-arroba block mb-1">CIF</label>
              <div className="flex gap-2">
                <input type="text" value={form.company_tax_id} onChange={e => setForm(p => ({...p, company_tax_id: e.target.value.toUpperCase()}))} onBlur={validateCif} placeholder="B12345678" className="input-arroba flex-1" data-testid="input-cif" />
                {cifChecking && <Loader2 size={16} className="animate-spin mt-3" style={{ color: 'var(--outline)' }} />}
              </div>
              {cifStatus === 'valid' && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#16a34a' }}><CheckCircle2 size={12} /> CIF validado</p>}
              {cifStatus === 'not_found' && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#dc2626' }}><AlertCircle size={12} /> CIF no encontrado en el registro</p>}
              {cifStatus === 'service_error' && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#d97706' }}><AlertCircle size={12} /> No hemos podido validar este CIF ahora mismo</p>}
              <Tip text="El CIF se valida automáticamente para reforzar la verificación de tu empresa." />
            </div>
            <div><label className="label-arroba block mb-1">CARGO *</label><input type="text" value={form.job_title} onChange={e => setForm(p => ({...p, job_title: e.target.value}))} placeholder="CEO, Managing Partner, Director M&A..." className="input-arroba w-full" data-testid="input-job" /></div>
            <div><label className="label-arroba block mb-1">TESIS DE INVERSIÓN</label><textarea value={form.acquisition_thesis} onChange={e => setForm(p => ({...p, acquisition_thesis: e.target.value}))} placeholder="Describe qué tipo de agencias buscas y qué factores valoras" rows={3} className="input-arroba w-full resize-none" data-testid="input-thesis" /><Tip text="Describe qué tipo de agencias buscas y qué factores valoras más al evaluar una operación." /></div>
          </div>
        )}

        {/* ═══ STEP 1: Tipo comprador (2 niveles) + Operación ═══ */}
        {step === 1 && (
          <div className="space-y-5" data-testid="step-perfil">
            <h2 className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>Tipo de comprador</h2>
            <Tip text="Nos ayuda a personalizar tu experiencia y recomendarte las oportunidades más relevantes." />
            <div className="space-y-2">
              <SelectBtn selected={form.buyer_category === 'strategic'} onClick={() => setForm(p => ({...p, buyer_category: 'strategic', buyer_financial_subtype: '', type: 'strategic'}))} testId="cat-strategic">
                <div><p className="font-semibold">Comprador estratégico</p><p className="text-xs" style={{ color: 'var(--outline)' }}>Agencia o grupo que busca crecer o complementar capacidades</p></div>
              </SelectBtn>
              <SelectBtn selected={form.buyer_category === 'financial'} onClick={() => setForm(p => ({...p, buyer_category: 'financial'}))} testId="cat-financial">
                <div><p className="font-semibold">Comprador financiero</p><p className="text-xs" style={{ color: 'var(--outline)' }}>Private Equity, VC, Family Office o inversor independiente</p></div>
              </SelectBtn>
            </div>
            {form.buyer_category === 'financial' && (
              <div className="mt-4">
                <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>SUBTIPO *</p>
                <div className="space-y-2">
                  {FIN_SUBTYPES.map(st => (
                    <SelectBtn key={st.id} selected={form.buyer_financial_subtype === st.id} onClick={() => setForm(p => ({...p, buyer_financial_subtype: st.id, type: st.id}))} testId={`sub-${st.id}`}>
                      {st.label}
                    </SelectBtn>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-6">
              <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>TIPO DE OPERACIÓN *</p>
              <div className="flex flex-wrap gap-2">
                {OP_TYPES.map(op => <ChipBtn key={op.id} selected={form.operation_types.includes(op.id)} onClick={() => toggle('operation_types', op.id)} testId={`op-${op.id}`}>{op.label}</ChipBtn>)}
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: Sectores ═══ */}
        {step === 2 && (
          <div className="space-y-5" data-testid="step-sectores">
            <h2 className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>Sectores de interés</h2>
            <Tip text="Selecciona los sectores donde te interesa recibir oportunidades de inversión." />
            <div className="space-y-2">{categories.map(cat => <SelectBtn key={cat.id} selected={form.taxonomy_categories.includes(cat.id)} onClick={() => toggle('taxonomy_categories', cat.id)} testId={`cat-${cat.id}`}>{cat.name}</SelectBtn>)}</div>
          </div>
        )}

        {/* ═══ STEP 3: Financieros ═══ */}
        {step === 3 && (
          <div className="space-y-5" data-testid="step-financieros">
            <h2 className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>Criterios financieros de inversión</h2>
            <Tip text="Usamos estos datos para proponerte oportunidades compatibles con tu capacidad real de inversión." />
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label-arroba block mb-1">TICKET MÍNIMO (EUR) *</label><NumericInputES value={form.ticket_min} onChange={v => setForm(p => ({...p, ticket_min: v}))} placeholder="500.000" testId="input-ticket-min" /></div>
              <div><label className="label-arroba block mb-1">TICKET MÁXIMO (EUR)</label><NumericInputES value={form.ticket_max} onChange={v => setForm(p => ({...p, ticket_max: v}))} placeholder="5.000.000" testId="input-ticket-max" /></div>
              <div><label className="label-arroba block mb-1">FACTURACIÓN MÍNIMA (EUR) *</label><NumericInputES value={form.revenue_range_min} onChange={v => setForm(p => ({...p, revenue_range_min: v}))} placeholder="1.000.000" testId="input-rev-min" /></div>
              <div><label className="label-arroba block mb-1">FACTURACIÓN MÁXIMA (EUR)</label><NumericInputES value={form.revenue_range_max} onChange={v => setForm(p => ({...p, revenue_range_max: v}))} placeholder="10.000.000" testId="input-rev-max" /></div>
            </div>
            <div><label className="label-arroba block mb-1">MARGEN EBITDA MÍNIMO (%)</label><input type="number" value={form.ebitda_margin_min_pct} onChange={e => setForm(p => ({...p, ebitda_margin_min_pct: e.target.value}))} placeholder="15" min="0" max="100" className="input-arroba w-full" data-testid="input-ebitda-pct" /><Tip text="Porcentaje mínimo de margen EBITDA sobre facturación que consideras aceptable." /></div>
          </div>
        )}

        {/* ═══ STEP 4: Cualitativos ═══ */}
        {step === 4 && (
          <div className="space-y-5" data-testid="step-cualitativos">
            <h2 className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>Criterios cualitativos</h2>
            <Tip text="Selecciona las características que más valoras en una agencia. Esto mejora la calidad de las recomendaciones." />
            <div className="grid grid-cols-2 gap-2">
              {QUALITATIVE_OPTIONS.map(q => (
                <button key={q.id} onClick={() => toggle('qualitative_criteria', q.id)} className="p-3 text-left text-xs font-semibold transition-all flex items-center gap-2"
                  style={{ background: form.qualitative_criteria.includes(q.id) ? 'rgba(182,33,42,0.06)' : 'var(--surface-2)', color: form.qualitative_criteria.includes(q.id) ? 'var(--arroba-primary)' : 'var(--on-surface)' }} data-testid={`qual-${q.id}`}>
                  <div className="w-4 h-4 flex items-center justify-center shrink-0" style={{ background: form.qualitative_criteria.includes(q.id) ? 'var(--arroba-primary)' : 'var(--surface-1)' }}>
                    {form.qualitative_criteria.includes(q.id) && <Check size={10} className="text-white" />}
                  </div>{q.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ STEP 5: Geografía ═══ */}
        {step === 5 && (
          <div className="space-y-5" data-testid="step-geografia">
            <h2 className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>Geografía de interés</h2>
            <Tip text="Selecciona las provincias donde te interesa recibir oportunidades." />
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 relative"><Search size={14} className="absolute left-3 top-3" style={{ color: 'var(--outline)' }} /><input type="text" value={provinceSearch} onChange={e => setProvinceSearch(e.target.value)} placeholder="Buscar provincia..." className="input-arroba w-full pl-9" /></div>
              <button onClick={() => setForm(p => ({...p, geography_provinces: p.geography_provinces.length === SPAIN_PROVINCES.length ? [] : [...SPAIN_PROVINCES]}))}
                className="px-4 py-2 text-xs font-bold whitespace-nowrap" style={{ background: form.geography_provinces.length === SPAIN_PROVINCES.length ? 'var(--arroba-primary)' : 'var(--surface-2)', color: form.geography_provinces.length === SPAIN_PROVINCES.length ? '#fff' : 'var(--on-surface)' }}>
                {form.geography_provinces.length === SPAIN_PROVINCES.length ? 'Quitar todas' : 'Marcar todas'}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5 max-h-64 overflow-y-auto">
              {filteredProv.map(p => (
                <button key={p} onClick={() => toggle('geography_provinces', p)} className="px-3 py-2 text-xs font-semibold text-left transition-all"
                  style={{ background: form.geography_provinces.includes(p) ? 'rgba(182,33,42,0.06)' : 'var(--surface-2)', color: form.geography_provinces.includes(p) ? 'var(--arroba-primary)' : 'var(--on-surface)' }}>
                  {form.geography_provinces.includes(p) && <Check size={10} className="inline mr-1" />}{p}
                </button>
              ))}
            </div>
            <p className="text-xs" style={{ color: 'var(--outline)' }}>{form.geography_provinces.length === SPAIN_PROVINCES.length ? 'Todas las provincias seleccionadas' : `${form.geography_provinces.length} de ${SPAIN_PROVINCES.length}`}</p>
          </div>
        )}

        {/* ═══ STEP 6: Verificación empresa (funcional) ═══ */}
        {step === 6 && (
          <div className="space-y-5" data-testid="step-verificacion">
            <h2 className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>Verificación de empresa</h2>
            <Tip text="Este paso confirma la veracidad de los datos declarados. Los niveles superiores son opcionales y se completan después." />

            {/* A) Editable company data */}
            <div className="p-5 space-y-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
              <p className="label-arroba" style={{ color: 'var(--outline)', fontSize: 9 }}>DATOS DECLARADOS</p>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-arroba block mb-1">EMPRESA</label><input type="text" value={form.company_name} onChange={e => setForm(p => ({...p, company_name: e.target.value}))} className="input-arroba w-full" data-testid="ver-company" /></div>
                <div>
                  <label className="label-arroba block mb-1">CIF</label>
                  <div className="flex gap-2">
                    <input type="text" value={form.company_tax_id} onChange={e => setForm(p => ({...p, company_tax_id: e.target.value.toUpperCase()}))} onBlur={validateCif} className="input-arroba flex-1" data-testid="ver-cif" />
                    {cifChecking && <Loader2 size={14} className="animate-spin mt-3" style={{ color: 'var(--outline)' }} />}
                  </div>
                  {cifStatus === 'valid' && <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: '#16a34a' }}><CheckCircle2 size={10} /> Validado</p>}
                  {cifStatus === 'not_found' && <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: '#dc2626' }}><AlertCircle size={10} /> No encontrado</p>}
                  {cifStatus === 'service_error' && <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: '#d97706' }}><AlertCircle size={10} /> No verificable ahora</p>}
                </div>
                <div><label className="label-arroba block mb-1">CARGO</label><input type="text" value={form.job_title} onChange={e => setForm(p => ({...p, job_title: e.target.value}))} className="input-arroba w-full" data-testid="ver-job" /></div>
                <div><label className="label-arroba block mb-1">EMAIL CORPORATIVO</label><input type="text" value={user?.email || ''} readOnly className="input-arroba w-full opacity-60" /></div>
              </div>
            </div>

            {/* B) Responsible declaration */}
            <label className="flex items-start gap-2 cursor-pointer p-4" style={{ background: 'rgba(182,33,42,0.03)' }} data-testid="responsible-declaration">
              <input type="checkbox" checked={responsibleDeclaration} onChange={e => setResponsibleDeclaration(e.target.checked)} className="mt-0.5 shrink-0" style={{ accentColor: 'var(--arroba-primary)' }} />
              <span className="text-xs" style={{ color: 'var(--on-surface)', lineHeight: 1.5 }}>Declaro que los datos de empresa, cargo e identidad facilitados son veraces y que opero dentro de ARROBA en el ejercicio de mi actividad profesional.</span>
            </label>

            {/* Levels */}
            <div className="space-y-3 mt-4">
              <p className="label-arroba" style={{ color: 'var(--outline)', fontSize: 9 }}>NIVELES DE VERIFICACIÓN</p>
              <VLevel icon={<CheckCircle2 size={14} style={{ color: form.company_name && form.job_title && responsibleDeclaration ? '#16a34a' : 'var(--outline-variant)' }} />} title="Empresa declarada" desc="Has declarado tu empresa y tu cargo profesional." done={!!(form.company_name && form.job_title && responsibleDeclaration)} />

              {/* C) Empresa verificada — with upload */}
              <VLevelWithUpload
                title="Empresa verificada"
                desc="Comprobación básica de empresa e identificación."
                details={[
                  'Sube un documento donde aparezcan razón social y CIF de tu empresa.',
                  'Documentos aceptados: tarjeta acreditativa del NIF, documento censal, nota simple o documento equivalente.',
                  'Se realiza una validación semiautomática o revisión básica del documento.',
                ]}
                level="verified"
                status={verifiedStatus}
                onUpload={(file) => handleDocUpload(file, 'verified')}
                uploading={uploadingLevel === 'verified'}
              />

              {/* D) Empresa verificada reforzada — with upload */}
              <VLevelWithUpload
                title="Empresa verificada reforzada"
                desc="Validación de vinculación o representación. Nivel alto de confianza."
                details={[
                  'Aporta una prueba reforzada de relación o representación respecto a la empresa.',
                  'Documentos aceptados: nota simple o certificación mercantil donde conste administrador o apoderado, poder de representación, certificado de representante o documento equivalente.',
                  'Se realiza una revisión manual interna para validar la documentación.',
                ]}
                level="reinforced"
                status={reinforcedStatus}
                onUpload={(file) => handleDocUpload(file, 'reinforced')}
                uploading={uploadingLevel === 'reinforced'}
              />
            </div>
          </div>
        )}

        {/* ═══ STEP 7: Revisión final ═══ */}
        {step === 7 && (
          <div className="space-y-4" data-testid="step-revision">
            <h2 className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>Revisión final</h2>
            <Tip text="Revisa todos los datos antes de confirmar. Podrás editarlos después desde tu perfil." />
            <RB label="EMPRESA" items={[{k:'Empresa',v:form.company_name||'—'},{k:'CIF',v:form.company_tax_id||'—'},{k:'Cargo',v:form.job_title||'—'},{k:'Tesis',v:form.acquisition_thesis||'—'}]} onEdit={() => setStep(0)} />
            <RB label="PERFIL" items={[{k:'Categoría',v:form.buyer_category === 'strategic' ? 'Estratégico' : form.buyer_category === 'financial' ? `Financiero — ${FIN_SUBTYPES.find(s => s.id === form.buyer_financial_subtype)?.label || ''}` : '—'},{k:'Operaciones',v:form.operation_types.map(o => OP_TYPES.find(t => t.id === o)?.label || o).join(', ')||'—'}]} onEdit={() => setStep(1)} />
            <RB label="SECTORES" items={[{k:'Categorías',v:catNames.join(', ')||'—'}]} onEdit={() => setStep(2)} />
            <RB label="FINANCIEROS" items={[{k:'Ticket',v:form.ticket_min ? `${fmtEUR(form.ticket_min)} — ${form.ticket_max ? fmtEUR(form.ticket_max) : '∞'}` : '—'},{k:'Facturación',v:form.revenue_range_min ? `${fmtEUR(form.revenue_range_min)}+` : '—'},{k:'Margen EBITDA mín.',v:form.ebitda_margin_min_pct ? fmtPct(form.ebitda_margin_min_pct) : '—'}]} onEdit={() => setStep(3)} />
            <RB label="CUALITATIVOS" items={[{k:'Criterios',v:qualNames.join(', ')||'—'}]} onEdit={() => setStep(4)} />
            <RB label="GEOGRAFÍA" items={[{k:'Provincias',v:geoLabel}]} onEdit={() => setStep(5)} />
            <RB label="VERIFICACIÓN" items={[{k:'Nivel',v:form.company_name && form.job_title && responsibleDeclaration ? 'Empresa declarada' : 'Pendiente'}]} onEdit={() => setStep(6)} />
            {/* Privacidad */}
            <div className="p-4" style={{ background: 'var(--surface-2)' }}>
              <p className="label-arroba mb-2" style={{ color: 'var(--outline)', fontSize: 9 }}>PRIVACIDAD DEL PERFIL</p>
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Prefiero que mi perfil sea anónimo</p><p className="text-[10px]" style={{ color: 'var(--outline)' }}>Tu perfil podrá mantenerse anónimo frente a terceros mientras operas en la plataforma.</p></div>
                <button disabled={isFree} onClick={() => setForm(p => ({...p, profile_privacy_mode: p.profile_privacy_mode === 'anonymous' ? 'public' : 'anonymous'}))}
                  className="relative w-10 h-5 shrink-0" style={{ background: form.profile_privacy_mode === 'anonymous' ? 'var(--arroba-primary)' : 'var(--surface-1)', opacity: isFree ? 0.4 : 1 }}>
                  <span className="absolute top-0.5 w-4 h-4 transition-all" style={{ background: '#fff', left: form.profile_privacy_mode === 'anonymous' ? 22 : 2 }} />
                </button>
              </div>
              {isFree && <p className="text-[10px] mt-1 font-bold" style={{ color: 'var(--arroba-primary)' }}>Disponible en Buyer Pro+</p>}
            </div>
            <label className="flex items-start gap-2 mt-2 cursor-pointer" data-testid="final-confirm">
              <input type="checkbox" checked={finalConfirm} onChange={e => setFinalConfirm(e.target.checked)} className="mt-0.5" style={{ accentColor: 'var(--arroba-primary)' }} />
              <span className="text-xs" style={{ color: 'var(--on-surface)' }}>Confirmo que estos datos son correctos y válidos para mi actividad dentro de ARROBA.</span>
            </label>
          </div>
        )}

        {/* Nav */}
        <div className="flex items-center justify-between mt-8">
          {step > 0 ? <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1 text-sm font-bold" style={{ color: 'var(--outline)' }}><ArrowLeft size={14} /> ANTERIOR</button> : <div />}
          {step < 7 ? (
            <button onClick={() => { if (canNext()) setStep(s => s + 1); }} disabled={!canNext()} className="px-8 py-3 text-sm font-bold flex items-center gap-2 disabled:opacity-40" style={{ background: 'var(--arroba-primary)', color: '#fff' }} data-testid="next-btn">SIGUIENTE <ArrowRight size={14} /></button>
          ) : (
            <button onClick={handleSubmit} disabled={loading || !finalConfirm} className="px-8 py-3 text-sm font-bold flex items-center gap-2 disabled:opacity-50" style={{ background: 'var(--arroba-primary)', color: '#fff' }} data-testid="submit-btn">{loading ? <Loader2 size={14} className="animate-spin" /> : null} CONFIRMAR Y ENTRAR AL PANEL</button>
          )}
        </div>
      </div>
    </Layout>
  );
};

const RB = ({ label, items, onEdit }) => (
  <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 1px 4px rgba(25,28,30,0.03)' }}>
    <div className="flex items-center justify-between mb-2"><p className="label-arroba" style={{ color: 'var(--outline)', fontSize: 9 }}>{label}</p><button onClick={onEdit} className="text-[10px] font-bold" style={{ color: 'var(--arroba-primary)' }}>EDITAR</button></div>
    {items.map((item, i) => (<div key={i} className="flex justify-between text-xs py-0.5"><span style={{ color: 'var(--outline)' }}>{item.k}</span><span className="font-semibold text-right max-w-[65%]" style={{ color: 'var(--on-surface)', lineHeight: 1.4 }}>{item.v}</span></div>))}
  </div>
);

const VLevel = ({ icon, title, desc, done, optional }) => (
  <div className="flex items-start gap-3 p-3" style={{ background: done ? 'rgba(22,163,74,0.04)' : 'var(--surface-lowest)' }}>
    <div className="mt-0.5 shrink-0">{icon}</div>
    <div><p className="text-xs font-bold" style={{ color: done ? '#16a34a' : 'var(--on-surface)' }}>{title} {optional && <span className="font-normal" style={{ color: 'var(--outline)' }}>(opcional)</span>}</p><p className="text-[10px]" style={{ color: 'var(--outline)', lineHeight: 1.4 }}>{desc}</p></div>
  </div>
);

const VLevelExpandable = ({ title, desc, details }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="p-3" style={{ background: 'var(--surface-lowest)' }}>
      <button onClick={() => setOpen(!open)} className="flex items-start gap-3 w-full text-left">
        <Shield size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--outline)' }} />
        <div className="flex-1">
          <p className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--on-surface)' }}>
            {title} <span className="font-normal" style={{ color: 'var(--outline)' }}>(opcional)</span>
            <span className="ml-auto text-[10px]" style={{ color: 'var(--arroba-primary)' }}>{open ? 'Cerrar' : 'Ver requisitos'}</span>
          </p>
          <p className="text-[10px]" style={{ color: 'var(--outline)', lineHeight: 1.4 }}>{desc}</p>
        </div>
      </button>
      {open && (
        <div className="mt-3 pl-7 space-y-2" style={{ borderTop: '1px solid var(--surface-1)', paddingTop: 12 }}>
          {details.map((d, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--outline)' }} />
              <p className="text-[10px]" style={{ color: i === details.length - 1 ? 'var(--arroba-primary)' : 'var(--outline)', lineHeight: 1.4, fontWeight: i === details.length - 1 ? 600 : 400 }}>{d}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const VLevelWithUpload = ({ title, desc, details, level, status, onUpload, uploading }) => {
  const [open, setOpen] = React.useState(false);
  const fileRef = React.useRef(null);
  const statusConfig = {
    not_started: { label: 'No iniciada', color: 'var(--outline)' },
    pending: { label: 'Pendiente de revisión', color: '#d97706' },
    approved: { label: 'Aprobada', color: '#16a34a' },
    rejected: { label: 'Rechazada', color: '#dc2626' },
  };
  const st = statusConfig[status] || statusConfig.not_started;

  return (
    <div className="p-3" style={{ background: 'var(--surface-lowest)' }}>
      <button onClick={() => setOpen(!open)} className="flex items-start gap-3 w-full text-left">
        <Shield size={14} className="mt-0.5 shrink-0" style={{ color: status === 'approved' ? '#16a34a' : 'var(--outline)' }} />
        <div className="flex-1">
          <p className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--on-surface)' }}>
            {title} <span className="font-normal" style={{ color: 'var(--outline)' }}>(opcional)</span>
            <span className="ml-auto text-[10px]" style={{ color: st.color }}>{st.label}</span>
          </p>
          <p className="text-[10px]" style={{ color: 'var(--outline)', lineHeight: 1.4 }}>{desc}</p>
        </div>
      </button>
      {open && (
        <div className="mt-3 pl-7 space-y-2" style={{ borderTop: '1px solid var(--surface-1)', paddingTop: 12 }}>
          {details.map((d, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--outline)' }} />
              <p className="text-[10px]" style={{ color: 'var(--outline)', lineHeight: 1.4 }}>{d}</p>
            </div>
          ))}
          {/* Upload area */}
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--surface-1)' }}>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => { if (e.target.files[0]) onUpload(e.target.files[0]); }} />
            {status === 'not_started' && (
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="px-4 py-2 text-[10px] font-bold flex items-center gap-2 disabled:opacity-50"
                style={{ background: 'var(--surface-2)', color: 'var(--on-surface)' }}
                data-testid={`upload-${level}`}>
                {uploading ? <Loader2 size={10} className="animate-spin" /> : null} SUBIR DOCUMENTO
              </button>
            )}
            {status === 'pending' && (
              <p className="text-[10px] font-semibold" style={{ color: '#d97706' }}>Documento subido. Pendiente de revisión.</p>
            )}
            {status === 'approved' && (
              <p className="text-[10px] font-semibold flex items-center gap-1" style={{ color: '#16a34a' }}><CheckCircle2 size={10} /> Verificación aprobada</p>
            )}
            {status === 'rejected' && (
              <div>
                <p className="text-[10px] font-semibold mb-1" style={{ color: '#dc2626' }}>Documento rechazado. Sube un nuevo documento.</p>
                <button onClick={() => fileRef.current?.click()} className="px-4 py-2 text-[10px] font-bold" style={{ background: 'var(--surface-2)', color: 'var(--on-surface)' }}>SUBIR NUEVO DOCUMENTO</button>
              </div>
            )}
          </div>
          <p className="text-[10px] font-semibold" style={{ color: 'var(--arroba-primary)', lineHeight: 1.4 }}>Puedes completar este paso más adelante. No es necesario para terminar el onboarding.</p>
        </div>
      )}
    </div>
  );
};

export default BuyerOnboarding;
