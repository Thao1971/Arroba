import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';
import { usersAPI, taxonomyAPI } from '../services/api';
import { 
  User, TrendingUp, MapPin, Target, Check, Loader2, Building2, Briefcase
} from 'lucide-react';

const financialSubtypes = [
  { id: 'financial_fo', label: 'Family Office' },
  { id: 'financial_pe', label: 'Private Equity' },
  { id: 'financial_vc', label: 'Venture Capital' },
  { id: 'financial_holding', label: 'Holding' },
];

const opTypes = [
  { id: 'full_sale', label: 'Compra total' },
  { id: 'partial_sale', label: 'Compra parcial' },
  { id: 'merger', label: 'Fusión' },
];

const geoOptions = ['España', 'México', 'Argentina', 'Colombia', 'Chile', 'Portugal', 'Europa', 'Latam'];

const BuyerOnboarding = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [buyerCategory, setBuyerCategory] = useState(''); // 'strategic' or 'financial'

  const [form, setForm] = useState({
    company_name: '', job_title: '', acquisition_thesis: '',
    type: '', operation_types: [], taxonomy_categories: [],
    ticket_min: '', ticket_max: '',
    revenue_range_min: '', revenue_range_max: '',
    ebitda_range_min: '', ebitda_range_max: '',
    geographies: [],
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await taxonomyAPI.getCategories();
        setCategories(res.data);
      } catch {}
      if (user?.buyer_profile) {
        const bp = user.buyer_profile;
        const t = bp.type || '';
        setBuyerCategory(t === 'strategic' ? 'strategic' : t ? 'financial' : '');
        setForm({
          company_name: bp.company_name || '',
          job_title: bp.job_title || '',
          acquisition_thesis: bp.acquisition_thesis || '',
          type: t,
          operation_types: bp.operation_types || [],
          taxonomy_categories: bp.taxonomy_categories || [],
          ticket_min: bp.ticket_min || '',
          ticket_max: bp.ticket_max || '',
          revenue_range_min: bp.revenue_range_min || '',
          revenue_range_max: bp.revenue_range_max || '',
          ebitda_range_min: bp.ebitda_range_min || '',
          ebitda_range_max: bp.ebitda_range_max || '',
          geographies: bp.geographies || [],
        });
      }
    };
    load();
  }, [user]);

  const toggleItem = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const selectBuyerCategory = (cat) => {
    setBuyerCategory(cat);
    if (cat === 'strategic') {
      setForm(prev => ({ ...prev, type: 'strategic' }));
    } else {
      setForm(prev => ({ ...prev, type: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!form.type) { setError('Selecciona tu tipo de comprador'); return; }
    if (form.operation_types.length === 0) { setError('Selecciona al menos un tipo de operación'); return; }
    if (form.taxonomy_categories.length === 0) { setError('Selecciona al menos una categoría de interés'); return; }
    if (!form.ticket_min) { setError('Indica tu ticket mínimo de inversión'); return; }
    if (!form.revenue_range_min) { setError('Indica la facturación mínima objetivo'); return; }
    if (!form.ebitda_range_min) { setError('Indica el EBITDA mínimo objetivo'); return; }

    setLoading(true); setError('');
    try {
      await usersAPI.updateBuyerProfile({
        company_name: form.company_name.trim() || null,
        job_title: form.job_title.trim() || null,
        acquisition_thesis: form.acquisition_thesis.trim() || null,
        type: form.type,
        operation_types: form.operation_types,
        taxonomy_categories: form.taxonomy_categories,
        ticket_min: parseFloat(form.ticket_min) || null,
        ticket_max: parseFloat(form.ticket_max) || null,
        revenue_range_min: parseFloat(form.revenue_range_min) || null,
        revenue_range_max: parseFloat(form.revenue_range_max) || null,
        ebitda_range_min: parseFloat(form.ebitda_range_min) || null,
        ebitda_range_max: parseFloat(form.ebitda_range_max) || null,
        geographies: form.geographies,
      });
      if (refreshUser) await refreshUser();
      navigate('/buyer/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar el perfil');
    } finally { setLoading(false); }
  };

  // Progress indicator
  const steps = [
    { done: !!form.company_name && !!form.job_title, label: 'Identidad' },
    { done: !!form.type, label: 'Tipo' },
    { done: form.operation_types.length > 0, label: 'Operación' },
    { done: form.taxonomy_categories.length > 0, label: 'Sectores' },
    { done: !!form.ticket_min && !!form.revenue_range_min && !!form.ebitda_range_min, label: 'Financieros' },
  ];
  const progress = steps.filter(s => s.done).length;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl" data-testid="buyer-onboarding">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Completa tu perfil de comprador</h1>
          <p className="text-slate-500">Necesitamos esta información para recomendarte las mejores oportunidades</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-1 text-xs">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${s.done ? 'bg-arroba-coral text-white' : 'bg-slate-200 text-slate-400'}`}>
                  {s.done ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span className={s.done ? 'text-arroba-coral font-medium' : 'text-slate-400'}>{s.label}</span>
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-arroba-coral rounded-full transition-all duration-300" style={{ width: `${(progress / steps.length) * 100}%` }} />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" data-testid="profile-error">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {/* Step 0: Identity — for certification */}
          <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="section-identity">
            <h2 className="font-bold mb-1 flex items-center gap-2"><Building2 className="w-5 h-5 text-arroba-coral" /> Datos del comprador</h2>
            <p className="text-xs text-slate-400 mb-4">Estos datos se usan para la verificación de tu perfil y son visibles para sellers.</p>
            <div className="space-y-4">
              <div>
                <label className="label-arroba block mb-1">EMPRESA *</label>
                <input type="text" value={form.company_name} onChange={e => setForm(prev => ({ ...prev, company_name: e.target.value }))}
                  placeholder="Nombre de tu empresa o vehículo inversor" className="input-arroba w-full" data-testid="input-company-name" />
              </div>
              <div>
                <label className="label-arroba block mb-1">CARGO *</label>
                <input type="text" value={form.job_title} onChange={e => setForm(prev => ({ ...prev, job_title: e.target.value }))}
                  placeholder="CEO, Managing Partner, Director de M&A..." className="input-arroba w-full" data-testid="input-job-title" />
              </div>
              <div>
                <label className="label-arroba block mb-1">TESIS DE INVERSIÓN</label>
                <textarea value={form.acquisition_thesis} onChange={e => setForm(prev => ({ ...prev, acquisition_thesis: e.target.value }))}
                  placeholder="Describe brevemente qué tipo de agencias o compañías buscas y por qué" rows={3} className="input-arroba w-full resize-none" data-testid="input-thesis" />
                <p className="text-[10px] text-slate-400 mt-1">Esto mejora la calidad de las recomendaciones y tu nivel de verificación.</p>
              </div>
            </div>
          </div>

          {/* Step 1: Buyer Type — Two-step: Strategic vs Financial */}
          <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="section-type">
            <h2 className="font-bold mb-4 flex items-center gap-2"><User className="w-5 h-5 text-arroba-coral" /> Tipo de comprador *</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button onClick={() => selectBuyerCategory('strategic')}
                className={`p-4 rounded-lg border text-left transition-all ${
                  buyerCategory === 'strategic' ? 'bg-arroba-coral text-white border-arroba-coral shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'
                }`} data-testid="buyer-cat-strategic">
                <Briefcase className={`w-5 h-5 mb-2 ${buyerCategory === 'strategic' ? 'text-white' : 'text-slate-400'}`} />
                <p className="font-semibold text-sm">Estratégico</p>
                <p className={`text-xs mt-1 ${buyerCategory === 'strategic' ? 'text-white/80' : 'text-slate-400'}`}>Agencia o Grupo</p>
              </button>
              <button onClick={() => selectBuyerCategory('financial')}
                className={`p-4 rounded-lg border text-left transition-all ${
                  buyerCategory === 'financial' ? 'bg-arroba-coral text-white border-arroba-coral shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'
                }`} data-testid="buyer-cat-financial">
                <TrendingUp className={`w-5 h-5 mb-2 ${buyerCategory === 'financial' ? 'text-white' : 'text-slate-400'}`} />
                <p className="font-semibold text-sm">Financiero</p>
                <p className={`text-xs mt-1 ${buyerCategory === 'financial' ? 'text-white/80' : 'text-slate-400'}`}>PE, VC, Family Office, Holding</p>
              </button>
            </div>
            {/* Financial subtypes */}
            {buyerCategory === 'financial' && (
              <div className="mt-3 pt-3 border-t border-slate-100" data-testid="financial-subtypes">
                <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Subtipo financiero *</p>
                <div className="grid grid-cols-2 gap-2">
                  {financialSubtypes.map(st => (
                    <button key={st.id} onClick={() => setForm({...form, type: st.id})}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        form.type === st.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:border-slate-300'
                      }`} data-testid={`buyer-type-${st.id}`}>
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Operation types */}
          <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="section-operations">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-arroba-coral" /> Tipo de operación *</h2>
            <div className="flex gap-2 flex-wrap">
              {opTypes.map(op => (
                <button key={op.id} onClick={() => toggleItem('operation_types', op.id)}
                  className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                    form.operation_types.includes(op.id) ? 'bg-arroba-coral text-white border-arroba-coral' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`} data-testid={`op-type-${op.id}`}>
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Taxonomy categories */}
          <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="section-taxonomy">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Building2 className="w-5 h-5 text-arroba-coral" /> Sectores de interés (Taxonomía BUD/CIS) *</h2>
            <p className="text-xs text-slate-400 mb-3">Selecciona todos los sectores en los que buscas invertir</p>
            <div className="space-y-2">
              {categories.map(cat => (
                <button key={cat.id} onClick={() => toggleItem('taxonomy_categories', cat.id)}
                  className={`w-full text-left px-4 py-2 text-sm rounded-lg border transition-colors ${
                    form.taxonomy_categories.includes(cat.id)
                      ? 'bg-arroba-coral text-white border-arroba-coral'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`} data-testid={`taxonomy-cat-${cat.id}`}>
                  {cat.name}
                </button>
              ))}
              {categories.length === 0 && (
                <p className="text-sm text-slate-400 italic">Cargando taxonomía...</p>
              )}
            </div>
          </div>

          {/* Step 4: Financial criteria */}
          <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="section-financials">
            <h2 className="font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-arroba-coral" /> Criterios financieros</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Ticket mínimo (€) *</Label>
                <Input type="number" value={form.ticket_min} onChange={e => setForm({...form, ticket_min: e.target.value})}
                  placeholder="500000" className="mt-1" data-testid="ticket-min" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Ticket máximo (€)</Label>
                <Input type="number" value={form.ticket_max} onChange={e => setForm({...form, ticket_max: e.target.value})}
                  placeholder="5000000" className="mt-1" data-testid="ticket-max" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Facturación mín objetivo (€) *</Label>
                <Input type="number" value={form.revenue_range_min} onChange={e => setForm({...form, revenue_range_min: e.target.value})}
                  placeholder="1000000" className="mt-1" data-testid="revenue-min" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Facturación máx objetivo (€)</Label>
                <Input type="number" value={form.revenue_range_max} onChange={e => setForm({...form, revenue_range_max: e.target.value})}
                  placeholder="10000000" className="mt-1" data-testid="revenue-max" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">EBITDA mínimo objetivo (€) *</Label>
                <Input type="number" value={form.ebitda_range_min} onChange={e => setForm({...form, ebitda_range_min: e.target.value})}
                  placeholder="200000" className="mt-1" data-testid="ebitda-min" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">EBITDA máximo objetivo (€)</Label>
                <Input type="number" value={form.ebitda_range_max} onChange={e => setForm({...form, ebitda_range_max: e.target.value})}
                  placeholder="2000000" className="mt-1" data-testid="ebitda-max" />
              </div>
            </div>
          </div>

          {/* Step 5: Geography */}
          <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="section-geography">
            <h2 className="font-bold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-arroba-coral" /> Geografía preferida</h2>
            <div className="flex flex-wrap gap-2">
              {geoOptions.map(geo => (
                <button key={geo} onClick={() => toggleItem('geographies', geo)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    form.geographies.includes(geo) ? 'bg-arroba-coral text-white border-arroba-coral' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`} data-testid={`geo-${geo}`}>
                  {geo}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="mt-8">
          <Button onClick={handleSubmit} disabled={loading}
            className="w-full bg-arroba-coral hover:bg-arroba-coral/90 text-white h-12 text-base" data-testid="save-profile-btn">
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-5 h-5 mr-2" />}
            Guardar perfil y ver oportunidades
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default BuyerOnboarding;
