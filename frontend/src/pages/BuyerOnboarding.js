import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../context/AuthContext';
import { usersAPI, taxonomyAPI } from '../services/api';
import { 
  User, TrendingUp, MapPin, Target, Check, Loader2, ArrowRight, Building2
} from 'lucide-react';

const buyerTypes = [
  { id: 'strategic', label: 'Estratégico (Agencia / Grupo)' },
  { id: 'financial_pe', label: 'Private Equity' },
  { id: 'financial_fo', label: 'Family Office' },
  { id: 'financial_vc', label: 'Venture Capital' },
  { id: 'financial_holding', label: 'Holding' },
  { id: 'other', label: 'Otro' },
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

  const [form, setForm] = useState({
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
      // Load existing profile if any
      if (user?.buyer_profile) {
        const bp = user.buyer_profile;
        setForm({
          type: bp.type || '',
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

  const handleSubmit = async () => {
    if (!form.type) { setError('Selecciona tu tipo de comprador'); return; }
    if (form.operation_types.length === 0) { setError('Selecciona al menos un tipo de operación'); return; }
    if (form.taxonomy_categories.length === 0) { setError('Selecciona al menos una categoría de interés'); return; }
    if (!form.ticket_min) { setError('Indica tu ticket mínimo de inversión'); return; }

    setLoading(true); setError('');
    try {
      await usersAPI.updateBuyerProfile({
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl" data-testid="buyer-onboarding">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Completa tu perfil de comprador</h1>
          <p className="text-slate-500">Necesitamos esta información para recomendarte las mejores oportunidades</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" data-testid="profile-error">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {/* Buyer Type */}
          <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="section-type">
            <h2 className="font-bold mb-4 flex items-center gap-2"><User className="w-5 h-5 text-arroba-coral" /> Tipo de comprador</h2>
            <div className="grid grid-cols-2 gap-2">
              {buyerTypes.map(bt => (
                <button key={bt.id} onClick={() => setForm({...form, type: bt.id})}
                  className={`p-3 text-sm rounded-lg border text-left transition-colors ${
                    form.type === bt.id ? 'bg-arroba-coral text-white border-arroba-coral' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`} data-testid={`buyer-type-${bt.id}`}>
                  {bt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Operation types */}
          <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="section-operations">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-arroba-coral" /> Tipo de operación</h2>
            <div className="flex gap-2">
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

          {/* Taxonomy categories */}
          <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="section-taxonomy">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Building2 className="w-5 h-5 text-arroba-coral" /> Sectores de interés</h2>
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
            </div>
          </div>

          {/* Financial criteria */}
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
                <Label className="text-xs uppercase tracking-wider text-slate-500">Facturación mín objetivo (€)</Label>
                <Input type="number" value={form.revenue_range_min} onChange={e => setForm({...form, revenue_range_min: e.target.value})}
                  placeholder="1000000" className="mt-1" data-testid="revenue-min" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Facturación máx objetivo (€)</Label>
                <Input type="number" value={form.revenue_range_max} onChange={e => setForm({...form, revenue_range_max: e.target.value})}
                  placeholder="10000000" className="mt-1" data-testid="revenue-max" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">EBITDA mínimo objetivo (€)</Label>
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

          {/* Geography */}
          <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="section-geography">
            <h2 className="font-bold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-arroba-coral" /> Geografía preferida</h2>
            <div className="flex flex-wrap gap-2">
              {geoOptions.map(geo => (
                <button key={geo} onClick={() => toggleItem('geographies', geo)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
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
