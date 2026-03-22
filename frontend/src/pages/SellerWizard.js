import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../context/AuthContext';
import { companiesAPI, dealsAPI, infomemoAPI } from '../services/api';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Building2, 
  TrendingUp, 
  FileText,
  Loader2,
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';

// Step indicator component
const StepIndicator = ({ steps, currentStep }) => (
  <div className="flex items-center justify-center mb-8">
    {steps.map((step, idx) => (
      <React.Fragment key={idx}>
        <div className={`flex items-center ${idx <= currentStep ? 'text-arroba-coral' : 'text-slate-300'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            idx < currentStep ? 'bg-arroba-coral text-white' :
            idx === currentStep ? 'border-2 border-arroba-coral text-arroba-coral' :
            'border-2 border-slate-300 text-slate-300'
          }`}>
            {idx < currentStep ? <Check className="w-4 h-4" /> : idx + 1}
          </div>
          <span className={`ml-2 text-sm font-medium hidden sm:inline ${
            idx <= currentStep ? 'text-slate-900' : 'text-slate-400'
          }`}>
            {step}
          </span>
        </div>
        {idx < steps.length - 1 && (
          <div className={`w-12 h-0.5 mx-2 ${idx < currentStep ? 'bg-arroba-coral' : 'bg-slate-200'}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

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
  
  // Company data
  const [companyData, setCompanyData] = useState({
    legal_name: '',
    trade_name: '',
    cif: '',
    country: 'España',
    region: '',
    city: '',
    company_type: 'digital_agency',
    sectors: [],
    specializations: [],
    founded_year: '',
    employees_count: '',
    description: '',
    highlights: ['', '', ''],
    website: '',
    linkedin: ''
  });
  
  // Financial data
  const [financials, setFinancials] = useState([
    { year: new Date().getFullYear() - 1, revenue: '', ebitda: '', recurring_revenue_pct: '', client_concentration_top5: '', growth_rate: '' }
  ]);
  
  const [valuationInputs, setValuationInputs] = useState({
    founder_dependency: 'medium',
    recurring_revenue_type: 'mixed',
    main_clients: '',
    client_retention_rate: '',
    tech_assets: false,
    proprietary_ip: false
  });
  
  // Deal data
  const [dealData, setDealData] = useState({
    operation_types_allowed: ['full_sale'],
    asking_price: '',
    price_negotiable: true
  });
  
  // Infomemo
  const [infomemo, setInfomemo] = useState(null);
  const [infomemoContent, setInfomemoContent] = useState('');
  const [generatingInfomemo, setGeneratingInfomemo] = useState(false);

  // Valuation result
  const [valuation, setValuation] = useState(null);

  const steps = ['Datos básicos', 'Financieros', 'Valoración', 'Deal', 'Infomemo'];
  
  const sectors = [
    { id: 'seo', name: 'SEO' },
    { id: 'sem', name: 'SEM / PPC' },
    { id: 'social', name: 'Social Media' },
    { id: 'content', name: 'Content Marketing' },
    { id: 'programmatic', name: 'Programática' },
    { id: 'creative', name: 'Creatividad' },
    { id: 'development', name: 'Desarrollo Web/App' },
    { id: 'data', name: 'Data & Analytics' },
    { id: 'ecommerce', name: 'E-commerce' },
    { id: 'performance', name: 'Performance' },
    { id: 'branding', name: 'Branding' },
    { id: 'fullservice', name: 'Full Service' }
  ];

  // Load existing company if editing
  useEffect(() => {
    if (companyId) {
      loadCompany();
    }
  }, [companyId]);

  const loadCompany = async () => {
    try {
      setLoading(true);
      const response = await companiesAPI.get(companyId);
      const company = response.data;
      
      setCompanyData({
        legal_name: company.legal_name || '',
        trade_name: company.trade_name || '',
        cif: company.cif || '',
        country: company.country || 'España',
        region: company.region || '',
        city: company.city || '',
        company_type: company.company_type || 'digital_agency',
        sectors: company.sectors || [],
        specializations: company.specializations || [],
        founded_year: company.founded_year || '',
        employees_count: company.employees_count || '',
        description: company.description || '',
        highlights: company.highlights?.length ? company.highlights : ['', '', ''],
        website: company.website || '',
        linkedin: company.linkedin || ''
      });
      
      if (company.financials?.length) {
        setFinancials(company.financials.map(f => ({
          year: f.year,
          revenue: f.revenue || '',
          ebitda: f.ebitda || '',
          recurring_revenue_pct: f.recurring_revenue_pct || '',
          client_concentration_top5: f.client_concentration_top5 || '',
          growth_rate: f.growth_rate || ''
        })));
      }
      
      if (company.valuation_inputs) {
        setValuationInputs(company.valuation_inputs);
      }
      
      if (company.valuation) {
        setValuation(company.valuation);
      }
    } catch (err) {
      setError('Error al cargar la compañía');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (field, value) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSectorToggle = (sectorId) => {
    setCompanyData(prev => ({
      ...prev,
      sectors: prev.sectors.includes(sectorId)
        ? prev.sectors.filter(s => s !== sectorId)
        : [...prev.sectors, sectorId]
    }));
  };

  const handleHighlightChange = (index, value) => {
    const newHighlights = [...companyData.highlights];
    newHighlights[index] = value;
    setCompanyData(prev => ({ ...prev, highlights: newHighlights }));
  };

  const handleFinancialChange = (index, field, value) => {
    const newFinancials = [...financials];
    newFinancials[index] = { ...newFinancials[index], [field]: value };
    setFinancials(newFinancials);
  };

  const addFinancialYear = () => {
    const lastYear = financials[financials.length - 1]?.year || new Date().getFullYear();
    setFinancials([...financials, {
      year: lastYear - 1,
      revenue: '',
      ebitda: '',
      recurring_revenue_pct: '',
      client_concentration_top5: '',
      growth_rate: ''
    }]);
  };

  const removeFinancialYear = (index) => {
    if (financials.length > 1) {
      setFinancials(financials.filter((_, i) => i !== index));
    }
  };

  // Step 1: Save company basic data
  const saveCompanyBasics = async () => {
    if (!companyData.legal_name) {
      setError('El nombre legal es obligatorio');
      return false;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const payload = {
        ...companyData,
        founded_year: companyData.founded_year ? parseInt(companyData.founded_year) : null,
        employees_count: companyData.employees_count ? parseInt(companyData.employees_count) : null,
        highlights: companyData.highlights.filter(h => h.trim() !== '')
      };
      
      let response;
      if (companyId) {
        response = await companiesAPI.update(companyId, payload);
      } else {
        response = await companiesAPI.create(payload);
        setCompanyId(response.data.company_id);
      }
      
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar la compañía');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Save financial data
  const saveFinancials = async () => {
    if (!companyId) {
      setError('Primero debes crear la compañía');
      return false;
    }
    
    // Validate at least one year has revenue
    const hasRevenue = financials.some(f => f.revenue);
    if (!hasRevenue) {
      setError('Debes indicar la facturación de al menos un año');
      return false;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const payload = {
        financials: financials.map(f => ({
          year: parseInt(f.year),
          revenue: parseFloat(f.revenue) || 0,
          ebitda: parseFloat(f.ebitda) || 0,
          ebitda_margin: f.revenue && f.ebitda ? (parseFloat(f.ebitda) / parseFloat(f.revenue)) * 100 : 0,
          recurring_revenue_pct: parseFloat(f.recurring_revenue_pct) || 0,
          client_concentration_top5: parseFloat(f.client_concentration_top5) || 0,
          growth_rate: parseFloat(f.growth_rate) || 0
        })),
        valuation_inputs: {
          ...valuationInputs,
          main_clients: parseInt(valuationInputs.main_clients) || null,
          client_retention_rate: parseFloat(valuationInputs.client_retention_rate) || null
        }
      };
      
      await companiesAPI.updateFinancials(companyId, payload);
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar los datos financieros');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Calculate valuation
  const calculateValuation = async () => {
    if (!companyId) return false;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await companiesAPI.calculateValuation(companyId);
      setValuation(response.data.valuation);
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al calcular la valoración');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Create deal
  const createDeal = async () => {
    if (!companyId) {
      setError('Primero debes crear la compañía');
      return false;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const payload = {
        company_id: companyId,
        operation_types_allowed: dealData.operation_types_allowed,
        asking_price: dealData.asking_price ? parseFloat(dealData.asking_price) : null,
        price_negotiable: dealData.price_negotiable
      };
      
      const response = await dealsAPI.create(payload);
      setDealId(response.data.deal_id);
      return true;
    } catch (err) {
      // If deal already exists, that's fine
      if (err.response?.data?.detail?.includes('already has an active deal')) {
        // Get existing deal
        const dealsResponse = await dealsAPI.list();
        const existingDeal = dealsResponse.data.find(d => d.company_id === companyId);
        if (existingDeal) {
          setDealId(existingDeal.deal_id);
          return true;
        }
      }
      setError(err.response?.data?.detail || 'Error al crear el deal');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Generate infomemo
  const generateInfomemo = async () => {
    if (!companyId) return;
    
    setGeneratingInfomemo(true);
    setError('');
    
    try {
      const response = await infomemoAPI.generate(companyId);
      setInfomemo(response.data.infomemo);
      setInfomemoContent(response.data.infomemo.content);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al generar el infomemo');
    } finally {
      setGeneratingInfomemo(false);
    }
  };

  // Save edited infomemo
  const saveInfomemo = async () => {
    if (!dealId || !infomemoContent) return false;
    
    setLoading(true);
    try {
      await infomemoAPI.update(dealId, infomemoContent);
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar el infomemo');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Navigate steps
  const nextStep = async () => {
    let success = true;
    
    switch (step) {
      case 0:
        success = await saveCompanyBasics();
        break;
      case 1:
        success = await saveFinancials();
        break;
      case 2:
        success = await calculateValuation();
        break;
      case 3:
        success = await createDeal();
        break;
      case 4:
        success = await saveInfomemo();
        if (success) {
          navigate(`/seller/deal/${dealId}`);
          return;
        }
        break;
    }
    
    if (success && step < steps.length - 1) {
      setStep(step + 1);
      setError('');
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
      setError('');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl" data-testid="seller-wizard">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {companyId ? 'Editar Compañía' : 'Nueva Compañía'}
          </h1>
          <p className="text-slate-500">Completa los datos para publicar tu agencia en el marketplace</p>
        </div>

        <StepIndicator steps={steps} currentStep={step} />

        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700" data-testid="wizard-error">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Step 0: Basic company data */}
        {step === 0 && (
          <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="step-basics">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-arroba-coral" />
              Datos de la compañía
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label className="text-xs uppercase tracking-wider text-slate-500">Nombre Legal *</Label>
                <Input
                  value={companyData.legal_name}
                  onChange={(e) => handleCompanyChange('legal_name', e.target.value)}
                  placeholder="Nombre legal de la sociedad"
                  className="mt-1"
                  data-testid="input-legal-name"
                />
              </div>
              
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Nombre Comercial</Label>
                <Input
                  value={companyData.trade_name}
                  onChange={(e) => handleCompanyChange('trade_name', e.target.value)}
                  placeholder="Nombre de marca"
                  className="mt-1"
                  data-testid="input-trade-name"
                />
              </div>
              
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">CIF</Label>
                <Input
                  value={companyData.cif}
                  onChange={(e) => handleCompanyChange('cif', e.target.value)}
                  placeholder="B12345678"
                  className="mt-1"
                  data-testid="input-cif"
                />
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">País</Label>
                <Select value={companyData.country} onValueChange={(v) => handleCompanyChange('country', v)}>
                  <SelectTrigger className="mt-1" data-testid="select-country">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="España">España</SelectItem>
                    <SelectItem value="México">México</SelectItem>
                    <SelectItem value="Argentina">Argentina</SelectItem>
                    <SelectItem value="Colombia">Colombia</SelectItem>
                    <SelectItem value="Chile">Chile</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Ciudad</Label>
                <Input
                  value={companyData.city}
                  onChange={(e) => handleCompanyChange('city', e.target.value)}
                  placeholder="Madrid"
                  className="mt-1"
                  data-testid="input-city"
                />
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Año de Fundación</Label>
                <Input
                  type="number"
                  value={companyData.founded_year}
                  onChange={(e) => handleCompanyChange('founded_year', e.target.value)}
                  placeholder="2015"
                  className="mt-1"
                  data-testid="input-founded-year"
                />
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Empleados</Label>
                <Input
                  type="number"
                  value={companyData.employees_count}
                  onChange={(e) => handleCompanyChange('employees_count', e.target.value)}
                  placeholder="25"
                  className="mt-1"
                  data-testid="input-employees"
                />
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Tipo de Agencia</Label>
                <Select value={companyData.company_type} onValueChange={(v) => handleCompanyChange('company_type', v)}>
                  <SelectTrigger className="mt-1" data-testid="select-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="digital_agency">Agencia Digital</SelectItem>
                    <SelectItem value="creative_agency">Agencia Creativa</SelectItem>
                    <SelectItem value="media_agency">Agencia de Medios</SelectItem>
                    <SelectItem value="tech_studio">Estudio Tecnológico</SelectItem>
                    <SelectItem value="consultancy">Consultoría</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Web</Label>
                <Input
                  value={companyData.website}
                  onChange={(e) => handleCompanyChange('website', e.target.value)}
                  placeholder="https://miagencia.com"
                  className="mt-1"
                  data-testid="input-website"
                />
              </div>
            </div>

            {/* Sectors */}
            <div className="mt-6">
              <Label className="text-xs uppercase tracking-wider text-slate-500">Sectores / Servicios</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {sectors.map(sector => (
                  <button
                    key={sector.id}
                    type="button"
                    onClick={() => handleSectorToggle(sector.id)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      companyData.sectors.includes(sector.id)
                        ? 'bg-arroba-coral text-white border-arroba-coral'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                    data-testid={`sector-${sector.id}`}
                  >
                    {sector.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <Label className="text-xs uppercase tracking-wider text-slate-500">Descripción del negocio</Label>
              <Textarea
                value={companyData.description}
                onChange={(e) => handleCompanyChange('description', e.target.value)}
                placeholder="Describe brevemente qué hace tu agencia, a qué clientes atiende y qué la hace especial..."
                className="mt-1 h-24"
                data-testid="input-description"
              />
            </div>

            {/* Highlights */}
            <div className="mt-6">
              <Label className="text-xs uppercase tracking-wider text-slate-500">Highlights (puntos fuertes)</Label>
              <div className="mt-2 space-y-2">
                {companyData.highlights.map((h, idx) => (
                  <Input
                    key={idx}
                    value={h}
                    onChange={(e) => handleHighlightChange(idx, e.target.value)}
                    placeholder={`Highlight ${idx + 1} (ej: "Cartera de 50+ clientes recurrentes")`}
                    data-testid={`input-highlight-${idx}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Financial data */}
        {step === 1 && (
          <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="step-financials">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-arroba-coral" />
              Datos Financieros
            </h2>

            {financials.map((fin, idx) => (
              <div key={idx} className="mb-6 p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Año {fin.year}</h3>
                  {financials.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFinancialYear(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-slate-500">Año</Label>
                    <Input
                      type="number"
                      value={fin.year}
                      onChange={(e) => handleFinancialChange(idx, 'year', e.target.value)}
                      className="mt-1"
                      data-testid={`input-year-${idx}`}
                    />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-slate-500">Facturación (€) *</Label>
                    <Input
                      type="number"
                      value={fin.revenue}
                      onChange={(e) => handleFinancialChange(idx, 'revenue', e.target.value)}
                      placeholder="1500000"
                      className="mt-1"
                      data-testid={`input-revenue-${idx}`}
                    />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-slate-500">EBITDA (€)</Label>
                    <Input
                      type="number"
                      value={fin.ebitda}
                      onChange={(e) => handleFinancialChange(idx, 'ebitda', e.target.value)}
                      placeholder="300000"
                      className="mt-1"
                      data-testid={`input-ebitda-${idx}`}
                    />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-slate-500">% Ingresos Recurrentes</Label>
                    <Input
                      type="number"
                      value={fin.recurring_revenue_pct}
                      onChange={(e) => handleFinancialChange(idx, 'recurring_revenue_pct', e.target.value)}
                      placeholder="70"
                      className="mt-1"
                      data-testid={`input-recurring-${idx}`}
                    />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-slate-500">% Concentración Top 5</Label>
                    <Input
                      type="number"
                      value={fin.client_concentration_top5}
                      onChange={(e) => handleFinancialChange(idx, 'client_concentration_top5', e.target.value)}
                      placeholder="40"
                      className="mt-1"
                      data-testid={`input-concentration-${idx}`}
                    />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-slate-500">% Crecimiento YoY</Label>
                    <Input
                      type="number"
                      value={fin.growth_rate}
                      onChange={(e) => handleFinancialChange(idx, 'growth_rate', e.target.value)}
                      placeholder="15"
                      className="mt-1"
                      data-testid={`input-growth-${idx}`}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addFinancialYear}
              className="mb-6"
              data-testid="add-year-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Añadir año anterior
            </Button>

            {/* Valuation inputs */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Factores de valoración</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-slate-500">Dependencia del fundador</Label>
                  <Select 
                    value={valuationInputs.founder_dependency} 
                    onValueChange={(v) => setValuationInputs({...valuationInputs, founder_dependency: v})}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-founder-dep">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja - Equipo autónomo</SelectItem>
                      <SelectItem value="medium">Media - Fundador operativo</SelectItem>
                      <SelectItem value="high">Alta - Fundador imprescindible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-wider text-slate-500">Tipo de ingresos</Label>
                  <Select 
                    value={valuationInputs.recurring_revenue_type} 
                    onValueChange={(v) => setValuationInputs({...valuationInputs, recurring_revenue_type: v})}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-revenue-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retainer">Retainer / Fee mensual</SelectItem>
                      <SelectItem value="project">Proyectos puntuales</SelectItem>
                      <SelectItem value="mixed">Mixto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-wider text-slate-500">Nº clientes principales</Label>
                  <Input
                    type="number"
                    value={valuationInputs.main_clients}
                    onChange={(e) => setValuationInputs({...valuationInputs, main_clients: e.target.value})}
                    placeholder="10"
                    className="mt-1"
                    data-testid="input-main-clients"
                  />
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-wider text-slate-500">% Retención clientes</Label>
                  <Input
                    type="number"
                    value={valuationInputs.client_retention_rate}
                    onChange={(e) => setValuationInputs({...valuationInputs, client_retention_rate: e.target.value})}
                    placeholder="85"
                    className="mt-1"
                    data-testid="input-retention"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="tech_assets"
                    checked={valuationInputs.tech_assets}
                    onChange={(e) => setValuationInputs({...valuationInputs, tech_assets: e.target.checked})}
                    className="rounded"
                    data-testid="checkbox-tech-assets"
                  />
                  <Label htmlFor="tech_assets">Activos tecnológicos propios</Label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="proprietary_ip"
                    checked={valuationInputs.proprietary_ip}
                    onChange={(e) => setValuationInputs({...valuationInputs, proprietary_ip: e.target.checked})}
                    className="rounded"
                    data-testid="checkbox-ip"
                  />
                  <Label htmlFor="proprietary_ip">Propiedad intelectual registrada</Label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Valuation */}
        {step === 2 && (
          <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="step-valuation">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-arroba-coral" />
              Valoración Estimada
            </h2>

            {valuation ? (
              <div>
                <div className="text-center p-8 bg-slate-50 rounded-lg mb-6">
                  <p className="text-sm text-slate-500 mb-2">Rango de valoración estimado</p>
                  <p className="text-4xl font-bold text-arroba-coral">
                    {(valuation.valuation_min / 1000000).toFixed(1)}M € - {(valuation.valuation_max / 1000000).toFixed(1)}M €
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Múltiplo EBITDA: {valuation.multiple_min?.toFixed(1)}x - {valuation.multiple_max?.toFixed(1)}x
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Factores considerados</h3>
                  <ul className="space-y-2">
                    {valuation.drivers?.map((driver, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-arroba-green mt-0.5" />
                        {driver}
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="mt-6 text-xs text-slate-400">
                  Esta valoración es orientativa y se basa en múltiplos del mercado para agencias digitales. 
                  La valoración final dependerá del proceso de due diligence y negociación.
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">
                  Haz clic en "Siguiente" para calcular la valoración basada en los datos financieros
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Deal setup */}
        {step === 3 && (
          <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="step-deal">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-arroba-coral" />
              Configuración del Deal
            </h2>

            <div className="space-y-6">
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Tipo de operación permitida</Label>
                <div className="mt-2 space-y-2">
                  {[
                    { id: 'full_sale', label: 'Venta total (100%)' },
                    { id: 'partial_sale', label: 'Venta parcial (minoritaria)' },
                    { id: 'merger', label: 'Fusión' }
                  ].map(op => (
                    <label key={op.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={dealData.operation_types_allowed.includes(op.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDealData({
                              ...dealData,
                              operation_types_allowed: [...dealData.operation_types_allowed, op.id]
                            });
                          } else {
                            setDealData({
                              ...dealData,
                              operation_types_allowed: dealData.operation_types_allowed.filter(o => o !== op.id)
                            });
                          }
                        }}
                        className="rounded"
                        data-testid={`checkbox-op-${op.id}`}
                      />
                      {op.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Precio solicitado (€)</Label>
                <Input
                  type="number"
                  value={dealData.asking_price}
                  onChange={(e) => setDealData({...dealData, asking_price: e.target.value})}
                  placeholder={valuation ? `Sugerido: ${(valuation.valuation_min / 1000000).toFixed(1)}M - ${(valuation.valuation_max / 1000000).toFixed(1)}M` : 'Ej: 2000000'}
                  className="mt-1"
                  data-testid="input-asking-price"
                />
                {valuation && (
                  <p className="text-xs text-slate-500 mt-1">
                    Valoración calculada: {(valuation.valuation_min / 1000000).toFixed(1)}M € - {(valuation.valuation_max / 1000000).toFixed(1)}M €
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="price_negotiable"
                  checked={dealData.price_negotiable}
                  onChange={(e) => setDealData({...dealData, price_negotiable: e.target.checked})}
                  className="rounded"
                  data-testid="checkbox-negotiable"
                />
                <Label htmlFor="price_negotiable">Precio negociable</Label>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Infomemo */}
        {step === 4 && (
          <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="step-infomemo">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-arroba-coral" />
              Information Memorandum
            </h2>

            {!infomemo && !generatingInfomemo ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 mb-4">
                  Genera automáticamente un documento profesional con la información de tu agencia
                </p>
                <Button
                  onClick={generateInfomemo}
                  className="bg-arroba-coral hover:bg-arroba-coral/90 text-white"
                  data-testid="generate-infomemo-btn"
                >
                  Generar Infomemo con IA
                </Button>
              </div>
            ) : generatingInfomemo ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-arroba-coral mx-auto mb-4" />
                <p className="text-slate-500">Generando infomemo con IA...</p>
                <p className="text-xs text-slate-400 mt-2">Esto puede tardar unos segundos</p>
              </div>
            ) : (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    Versión {infomemo.version} · Generado el {new Date(infomemo.generated_at).toLocaleDateString('es-ES')}
                  </p>
                  <Button
                    variant="outline"
                    onClick={generateInfomemo}
                    size="sm"
                    data-testid="regenerate-infomemo-btn"
                  >
                    Regenerar
                  </Button>
                </div>
                
                <Textarea
                  value={infomemoContent}
                  onChange={(e) => setInfomemoContent(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                  data-testid="infomemo-editor"
                />
                
                <p className="mt-2 text-xs text-slate-400">
                  Puedes editar el contenido antes de guardar. El documento usa formato Markdown.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 0 || loading}
            data-testid="prev-step-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          
          <Button
            onClick={nextStep}
            disabled={loading || (step === 4 && !infomemo)}
            className="bg-arroba-coral hover:bg-arroba-coral/90 text-white"
            data-testid="next-step-btn"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {step === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
            {!loading && step < steps.length - 1 && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default SellerWizard;
