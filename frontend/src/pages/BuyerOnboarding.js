import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { usersAPI, taxonomyAPI } from '../services/api';
import {
  User, TrendingUp, MapPin, Target, Check, Loader2, Building2, Briefcase,
  Info, Search, ArrowRight, ArrowLeft, Shield, Lock, Eye
} from 'lucide-react';

const PROVINCES = [
  'A Coruña','Álava','Albacete','Alicante','Almería','Asturias','Ávila','Badajoz','Barcelona','Bizkaia',
  'Burgos','Cáceres','Cádiz','Cantabria','Castellón','Ciudad Real','Córdoba','Cuenca','Gipuzkoa','Girona',
  'Granada','Guadalajara','Huelva','Huesca','Illes Balears','Jaén','La Rioja','Las Palmas','León','Lleida',
  'Lugo','Madrid','Málaga','Murcia','Navarra','Ourense','Palencia','Pontevedra','Salamanca',
  'Santa Cruz de Tenerife','Segovia','Sevilla','Soria','Tarragona','Teruel','Toledo','Valencia',
  'Valladolid','Zamora','Zaragoza'
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

const OPERATION_TYPES = [
  { id: 'full_sale', label: 'Venta total' },
  { id: 'partial_sale', label: 'Venta parcial' },
  { id: 'merger', label: 'Fusión' },
];

const BUYER_TYPES_STRATEGIC = [
  { id: 'strategic', label: 'Agencia o grupo estratégico' },
];
const BUYER_TYPES_FINANCIAL = [
  { id: 'private_equity', label: 'Private Equity' },
  { id: 'venture_capital', label: 'Venture Capital' },
  { id: 'family_office', label: 'Family Office' },
  { id: 'holding', label: 'Holding' },
  { id: 'independiente', label: 'Inversor independiente' },
];

const Tip = ({ text }) => (
  <div className="flex items-start gap-1.5 mt-1.5">
    <Info size={11} className="shrink-0 mt-0.5" style={{ color: 'var(--outline)' }} />
    <p className="text-[10px]" style={{ color: 'var(--outline)', lineHeight: 1.4 }}>{text}</p>
  </div>
);

const fmtES = (v) => v ? Number(v).toLocaleString('es-ES') : '';

const BuyerOnboarding = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [provinceSearch, setProvinceSearch] = useState('');

  const [form, setForm] = useState({
    company_name: '', company_tax_id: '', job_title: '', acquisition_thesis: '',
    type: '', operation_types: [], taxonomy_categories: [],
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
      setForm(prev => ({
        ...prev,
        company_name: bp.company_name || '',
        company_tax_id: bp.company_tax_id || '',
        job_title: bp.job_title || '',
        acquisition_thesis: bp.acquisition_thesis || '',
        type: bp.type || '',
        operation_types: bp.operation_types || [],
        taxonomy_categories: bp.taxonomy_categories || [],
        ticket_min: bp.ticket_min || '',
        ticket_max: bp.ticket_max || '',
        revenue_range_min: bp.revenue_range_min || '',
        revenue_range_max: bp.revenue_range_max || '',
        ebitda_margin_min_pct: bp.ebitda_margin_min_pct || '',
        qualitative_criteria: bp.qualitative_criteria || [],
        geography_provinces: bp.geography_provinces || [],
        profile_privacy_mode: bp.profile_privacy_mode || 'public',
      }));
    }
  }, [user]);

  const toggleItem = (field, value) => {
    setForm(prev => {
      const arr = prev[field];
      return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const STEPS = [
    { label: 'Empresa', done: !!form.company_name && !!form.job_title },
    { label: 'Perfil', done: !!form.type && form.operation_types.length > 0 },
    { label: 'Sectores', done: form.taxonomy_categories.length > 0 },
    { label: 'Financieros', done: !!form.ticket_min && !!form.revenue_range_min },
    { label: 'Cualitativo', done: form.qualitative_criteria.length > 0 },
    { label: 'Geografía', done: form.geography_provinces.length > 0 },
    { label: 'Revisión', done: false },
  ];

  const canNext = () => {
    if (step === 0) return form.company_name && form.job_title;
    if (step === 1) return form.type && form.operation_types.length > 0;
    if (step === 2) return form.taxonomy_categories.length > 0;
    if (step === 3) return form.ticket_min && form.revenue_range_min;
    if (step === 4) return true;
    if (step === 5) return true;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      await usersAPI.updateBuyerProfile({
        company_name: form.company_name.trim() || null,
        company_tax_id: form.company_tax_id.trim() || null,
        job_title: form.job_title.trim() || null,
        acquisition_thesis: form.acquisition_thesis.trim() || null,
        type: form.type,
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
        company_verification_level: (form.company_name && form.company_tax_id && form.job_title) ? 'declared' : 'not_started',
      });
      if (refreshUser) await refreshUser();
      navigate('/buyer/procesos');
    } catch (err) { setError(err.response?.data?.detail || 'Error al guardar'); }
    finally { setLoading(false); }
  };

  const isFree = !user?.subscription?.plan_type || user?.subscription?.plan_type === 'buyer_free';
  const filteredProvinces = provinceSearch ? PROVINCES.filter(p => p.toLowerCase().includes(provinceSearch.toLowerCase())) : PROVINCES;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl" data-testid="buyer-onboarding">
        <div className="mb-6 text-center">
          <p className="label-arroba mb-2" style={{ color: 'var(--arroba-primary)' }}>PERFIL DE COMPRADOR</p>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>Completa tu perfil</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--outline)' }}>Paso {step + 1} de {STEPS.length}</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1 h-1.5" style={{ background: i <= step ? 'var(--arroba-primary)' : 'var(--surface-2)', transition: 'background 0.2s' }} />
          ))}
        </div>

        {error && <div className="mb-4 p-3 text-sm" style={{ background: 'rgba(220,38,38,0.05)', color: '#dc2626', borderLeft: '3px solid #dc2626' }}>{error}</div>}

        {/* ═══ STEP 0: Empresa ═══ */}
        {step === 0 && (
          <div className="space-y-5" data-testid="step-empresa">
            <h2 className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>Datos de la empresa</h2>
            <Tip text="Estos datos se usan para la verificación de tu perfil y aparecen al firmar documentos legales." />
            <div className="space-y-4">
              <div><label className="label-arroba block mb-1">NOMBRE DE LA EMPRESA *</label><input type="text" value={form.company_name} onChange={e => setForm(p => ({...p, company_name: e.target.value}))} placeholder="Nombre de tu empresa o vehículo inversor" className="input-arroba w-full" data-testid="input-company" /></div>
              <div><label className="label-arroba block mb-1">CIF</label><input type="text" value={form.company_tax_id} onChange={e => setForm(p => ({...p, company_tax_id: e.target.value.toUpperCase()}))} placeholder="B12345678" className="input-arroba w-full" data-testid="input-cif" /><Tip text="El CIF refuerza la verificación de tu empresa dentro de la plataforma." /></div>
              <div><label className="label-arroba block mb-1">CARGO *</label><input type="text" value={form.job_title} onChange={e => setForm(p => ({...p, job_title: e.target.value}))} placeholder="CEO, Managing Partner, Director M&A..." className="input-arroba w-full" data-testid="input-job" /></div>
              <div><label className="label-arroba block mb-1">TESIS DE INVERSIÓN</label><textarea value={form.acquisition_thesis} onChange={e => setForm(p => ({...p, acquisition_thesis: e.target.value}))} placeholder="Describe qué tipo de agencias buscas y qué factores valoras" rows={3} className="input-arroba w-full resize-none" data-testid="input-thesis" /><Tip text="Describe qué tipo de agencias buscas y qué factores valoras más al evaluar una operación." /></div>
            </div>
          </div>
        )}

        {/* ═══ STEP 1: Tipo + Operación ═══ */}
        {step === 1 && (
          <div className="space-y-5" data-testid="step-perfil">
            <h2 className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>Tipo de comprador</h2>
            <Tip text="Nos ayuda a personalizar tu experiencia y recomendarte las oportunidades más relevantes." />
            <div className="grid grid-cols-2 gap-3">
              {[...BUYER_TYPES_STRATEGIC, ...BUYER_TYPES_FINANCIAL].map(bt => (
                <button key={bt.id} onClick={() => setForm(p => ({...p, type: bt.id}))}
                  className="p-4 text-left text-sm font-semibold transition-all" data-testid={`type-${bt.id}`}
                  style={{ background: form.type === bt.id ? 'rgba(182,33,42,0.06)' : 'var(--surface-2)', borderLeft: form.type === bt.id ? '3px solid var(--arroba-primary)' : '3px solid transparent', color: form.type === bt.id ? 'var(--arroba-primary)' : 'var(--on-surface)' }}>
                  {bt.label} {form.type === bt.id && <Check size={12} className="inline ml-1" />}
                </button>
              ))}
            </div>
            <h3 className="text-sm font-bold mt-6" style={{ color: 'var(--on-surface)' }}>Tipo de operación *</h3>
            <div className="flex flex-wrap gap-2">
              {OPERATION_TYPES.map(op => (
                <button key={op.id} onClick={() => toggleItem('operation_types', op.id)}
                  className="px-4 py-2 text-xs font-bold transition-all" data-testid={`op-${op.id}`}
                  style={{ background: form.operation_types.includes(op.id) ? 'var(--on-surface)' : 'var(--surface-2)', color: form.operation_types.includes(op.id) ? '#fff' : 'var(--on-surface)' }}>
                  {op.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ STEP 2: Sectores ═══ */}
        {step === 2 && (
          <div className="space-y-5" data-testid="step-sectores">
            <h2 className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>Sectores de interés</h2>
            <Tip text="Selecciona los sectores donde te interesa recibir oportunidades de inversión." />
            <div className="space-y-2">
              {categories.map(cat => (
                <button key={cat.id} onClick={() => toggleItem('taxonomy_categories', cat.id)}
                  className="w-full text-left px-4 py-3 text-sm font-semibold transition-all flex items-center justify-between"
                  style={{ background: form.taxonomy_categories.includes(cat.id) ? 'rgba(182,33,42,0.06)' : 'var(--surface-2)', borderLeft: form.taxonomy_categories.includes(cat.id) ? '3px solid var(--arroba-primary)' : '3px solid transparent', color: form.taxonomy_categories.includes(cat.id) ? 'var(--arroba-primary)' : 'var(--on-surface)' }}
                  data-testid={`cat-${cat.id}`}>
                  {cat.name} {form.taxonomy_categories.includes(cat.id) && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ STEP 3: Financieros ═══ */}
        {step === 3 && (
          <div className="space-y-5" data-testid="step-financieros">
            <h2 className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>Criterios financieros de inversión</h2>
            <Tip text="Usamos estos datos para proponerte oportunidades compatibles con tu capacidad real de inversión." />
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label-arroba block mb-1">TICKET MÍNIMO (EUR) *</label><input type="number" value={form.ticket_min} onChange={e => setForm(p => ({...p, ticket_min: e.target.value}))} placeholder="500.000" className="input-arroba w-full" data-testid="input-ticket-min" /></div>
              <div><label className="label-arroba block mb-1">TICKET MÁXIMO (EUR)</label><input type="number" value={form.ticket_max} onChange={e => setForm(p => ({...p, ticket_max: e.target.value}))} placeholder="5.000.000" className="input-arroba w-full" data-testid="input-ticket-max" /></div>
              <div><label className="label-arroba block mb-1">FACTURACIÓN MÍNIMA (EUR) *</label><input type="number" value={form.revenue_range_min} onChange={e => setForm(p => ({...p, revenue_range_min: e.target.value}))} placeholder="1.000.000" className="input-arroba w-full" data-testid="input-rev-min" /></div>
              <div><label className="label-arroba block mb-1">FACTURACIÓN MÁXIMA (EUR)</label><input type="number" value={form.revenue_range_max} onChange={e => setForm(p => ({...p, revenue_range_max: e.target.value}))} placeholder="10.000.000" className="input-arroba w-full" data-testid="input-rev-max" /></div>
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
                <button key={q.id} onClick={() => toggleItem('qualitative_criteria', q.id)}
                  className="p-3 text-left text-xs font-semibold transition-all flex items-center gap-2"
                  style={{ background: form.qualitative_criteria.includes(q.id) ? 'rgba(182,33,42,0.06)' : 'var(--surface-2)', color: form.qualitative_criteria.includes(q.id) ? 'var(--arroba-primary)' : 'var(--on-surface)' }}
                  data-testid={`qual-${q.id}`}>
                  <div className="w-4 h-4 flex items-center justify-center shrink-0" style={{ background: form.qualitative_criteria.includes(q.id) ? 'var(--arroba-primary)' : 'var(--surface-1)' }}>
                    {form.qualitative_criteria.includes(q.id) && <Check size={10} className="text-white" />}
                  </div>
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ STEP 5: Geografía ═══ */}
        {step === 5 && (
          <div className="space-y-5" data-testid="step-geografia">
            <h2 className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>Geografía de interés</h2>
            <Tip text="Selecciona las provincias donde te interesa recibir oportunidades. España es el mercado principal de ARROBA." />
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 relative">
                <Search size={14} className="absolute left-3 top-3" style={{ color: 'var(--outline)' }} />
                <input type="text" value={provinceSearch} onChange={e => setProvinceSearch(e.target.value)} placeholder="Buscar provincia..." className="input-arroba w-full pl-9" data-testid="province-search" />
              </div>
              <button onClick={() => setForm(p => ({...p, geography_provinces: form.geography_provinces.length === PROVINCES.length ? [] : [...PROVINCES]}))}
                className="px-4 py-2 text-xs font-bold whitespace-nowrap" style={{ background: form.geography_provinces.length === PROVINCES.length ? 'var(--arroba-primary)' : 'var(--surface-2)', color: form.geography_provinces.length === PROVINCES.length ? '#fff' : 'var(--on-surface)' }}
                data-testid="select-all-provinces">
                {form.geography_provinces.length === PROVINCES.length ? 'Quitar todas' : 'Marcar todas'}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5 max-h-64 overflow-y-auto">
              {filteredProvinces.map(p => (
                <button key={p} onClick={() => toggleItem('geography_provinces', p)}
                  className="px-3 py-2 text-xs font-semibold text-left transition-all"
                  style={{ background: form.geography_provinces.includes(p) ? 'rgba(182,33,42,0.06)' : 'var(--surface-2)', color: form.geography_provinces.includes(p) ? 'var(--arroba-primary)' : 'var(--on-surface)' }}>
                  {form.geography_provinces.includes(p) && <Check size={10} className="inline mr-1" />}{p}
                </button>
              ))}
            </div>
            <p className="text-xs" style={{ color: 'var(--outline)' }}>{form.geography_provinces.length} de {PROVINCES.length} provincias seleccionadas</p>
          </div>
        )}

        {/* ═══ STEP 6: Revisión final ═══ */}
        {step === 6 && (
          <div className="space-y-5" data-testid="step-revision">
            <h2 className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>Revisión final</h2>
            <Tip text="Revisa todos los datos antes de confirmar. Podrás editarlos después desde tu perfil." />

            <ReviewBlock label="EMPRESA" items={[
              { k: 'Empresa', v: form.company_name || '—' },
              { k: 'CIF', v: form.company_tax_id || '—' },
              { k: 'Cargo', v: form.job_title || '—' },
              { k: 'Tesis', v: form.acquisition_thesis || '—' },
            ]} onEdit={() => setStep(0)} />

            <ReviewBlock label="PERFIL" items={[
              { k: 'Tipo', v: form.type || '—' },
              { k: 'Operaciones', v: form.operation_types.join(', ') || '—' },
            ]} onEdit={() => setStep(1)} />

            <ReviewBlock label="SECTORES" items={[
              { k: 'Categorías', v: `${form.taxonomy_categories.length} seleccionada${form.taxonomy_categories.length !== 1 ? 's' : ''}` },
            ]} onEdit={() => setStep(2)} />

            <ReviewBlock label="FINANCIEROS" items={[
              { k: 'Ticket', v: form.ticket_min ? `${fmtES(form.ticket_min)} - ${fmtES(form.ticket_max || '∞')} EUR` : '—' },
              { k: 'Facturación', v: form.revenue_range_min ? `${fmtES(form.revenue_range_min)}+ EUR` : '—' },
              { k: 'Margen EBITDA mín.', v: form.ebitda_margin_min_pct ? `${form.ebitda_margin_min_pct}%` : '—' },
            ]} onEdit={() => setStep(3)} />

            <ReviewBlock label="CUALITATIVOS" items={[
              { k: 'Criterios', v: form.qualitative_criteria.length > 0 ? `${form.qualitative_criteria.length} seleccionado${form.qualitative_criteria.length !== 1 ? 's' : ''}` : '—' },
            ]} onEdit={() => setStep(4)} />

            <ReviewBlock label="GEOGRAFÍA" items={[
              { k: 'Provincias', v: form.geography_provinces.length > 0 ? `${form.geography_provinces.length} provincia${form.geography_provinces.length !== 1 ? 's' : ''}` : '—' },
            ]} onEdit={() => setStep(5)} />

            {/* Verificación empresa */}
            <div className="p-4" style={{ background: 'var(--surface-2)' }}>
              <p className="label-arroba mb-2" style={{ color: 'var(--outline)', fontSize: 9 }}>VERIFICACIÓN DE EMPRESA</p>
              <div className="space-y-2">
                <VerLevel label="Empresa declarada" desc="Has declarado tu empresa y tu cargo profesional." done={!!form.company_name && !!form.job_title} />
                <VerLevel label="Empresa verificada" desc="Comprobación básica de empresa e identificación. Disponible después del onboarding." done={false} optional />
                <VerLevel label="Empresa verificada reforzada" desc="Validación de vinculación o representación. Nivel alto de confianza." done={false} optional />
              </div>
            </div>

            {/* Privacidad */}
            <div className="p-4" style={{ background: 'var(--surface-2)' }}>
              <p className="label-arroba mb-2" style={{ color: 'var(--outline)', fontSize: 9 }}>PRIVACIDAD DEL PERFIL</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Prefiero que mi perfil sea anónimo</p>
                  <p className="text-[10px]" style={{ color: 'var(--outline)' }}>Tu perfil podrá mantenerse anónimo frente a terceros mientras operas en la plataforma.</p>
                </div>
                <button disabled={isFree} onClick={() => setForm(p => ({...p, profile_privacy_mode: p.profile_privacy_mode === 'anonymous' ? 'public' : 'anonymous'}))}
                  className="relative w-10 h-5 shrink-0 transition-colors" style={{ background: form.profile_privacy_mode === 'anonymous' ? 'var(--arroba-primary)' : 'var(--surface-1)', opacity: isFree ? 0.4 : 1 }}
                  data-testid="toggle-privacy">
                  <span className="absolute top-0.5 w-4 h-4 transition-all" style={{ background: '#fff', left: form.profile_privacy_mode === 'anonymous' ? 22 : 2 }} />
                </button>
              </div>
              {isFree && <p className="text-[10px] mt-1 font-bold" style={{ color: 'var(--arroba-primary)' }}>Disponible en Buyer Pro+</p>}
            </div>

            {/* Confirmación */}
            <label className="flex items-start gap-2 mt-4 cursor-pointer" data-testid="confirm-checkbox">
              <input type="checkbox" id="confirm" className="mt-0.5" style={{ accentColor: 'var(--arroba-primary)' }} />
              <span className="text-xs" style={{ color: 'var(--on-surface)' }}>Confirmo que estos datos son correctos y válidos para mi actividad dentro de ARROBA.</span>
            </label>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1 text-sm font-bold" style={{ color: 'var(--outline)' }}>
              <ArrowLeft size={14} /> ANTERIOR
            </button>
          ) : <div />}
          {step < 6 ? (
            <button onClick={() => { if (canNext()) setStep(s => s + 1); }} disabled={!canNext()}
              className="px-8 py-3 text-sm font-bold flex items-center gap-2 disabled:opacity-40"
              style={{ background: 'var(--arroba-primary)', color: '#fff' }} data-testid="next-btn">
              SIGUIENTE <ArrowRight size={14} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="px-8 py-3 text-sm font-bold flex items-center gap-2 disabled:opacity-50"
              style={{ background: 'var(--arroba-primary)', color: '#fff' }} data-testid="submit-btn">
              {loading ? <Loader2 size={14} className="animate-spin" /> : null} CONFIRMAR Y ENTRAR AL PANEL
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
};

const ReviewBlock = ({ label, items, onEdit }) => (
  <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 1px 4px rgba(25,28,30,0.03)' }}>
    <div className="flex items-center justify-between mb-2">
      <p className="label-arroba" style={{ color: 'var(--outline)', fontSize: 9 }}>{label}</p>
      <button onClick={onEdit} className="text-[10px] font-bold" style={{ color: 'var(--arroba-primary)' }}>EDITAR</button>
    </div>
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={i} className="flex justify-between text-xs">
          <span style={{ color: 'var(--outline)' }}>{item.k}</span>
          <span className="font-semibold text-right max-w-[60%] truncate" style={{ color: 'var(--on-surface)' }}>{item.v}</span>
        </div>
      ))}
    </div>
  </div>
);

const VerLevel = ({ label, desc, done, optional }) => (
  <div className="flex items-start gap-2">
    {done ? <Check size={14} style={{ color: '#16a34a' }} className="mt-0.5 shrink-0" /> : <div className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ border: '1.5px solid var(--outline-variant)', borderRadius: '50%' }} />}
    <div>
      <p className="text-xs font-bold" style={{ color: done ? '#16a34a' : 'var(--on-surface)' }}>{label} {optional && <span className="font-normal" style={{ color: 'var(--outline)' }}>(opcional)</span>}</p>
      <p className="text-[10px]" style={{ color: 'var(--outline)' }}>{desc}</p>
    </div>
  </div>
);

export default BuyerOnboarding;
