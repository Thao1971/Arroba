import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { ArrobaLogo } from '../components/layout/Header';
import { marketplaceAPI } from '../services/api';
import { 
  ArrowRight, 
  Shield, 
  TrendingUp, 
  Users, 
  FileCheck, 
  Building2,
  CheckCircle2
} from 'lucide-react';

const Home = () => {
  const [stats, setStats] = useState(null);
  const [featuredDeals, setFeaturedDeals] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, dealsRes] = await Promise.all([
          marketplaceAPI.getStats(),
          marketplaceAPI.getFeaturedDeals()
        ]);
        setStats(statsRes.data);
        setFeaturedDeals(dealsRes.data);
      } catch (error) {
        console.error('Error fetching home data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-slate-900 overflow-hidden" data-testid="hero-section">
        {/* Dot pattern background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, #FF5757 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />
        </div>
        
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-3xl">
            <div className="mb-6">
              <ArrobaLogo color="#FF5757" size={40} />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Compra, vende o fusiona 
              <span className="text-arroba-coral"> agencias digitales</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl">
              La primera plataforma especializada en M&A de agencias digitales. 
              Conectamos compradores estratégicos con las mejores oportunidades del mercado.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/marketplace">
                <Button className="btn-primary text-base px-8 py-3" data-testid="cta-explore">
                  EXPLORAR OPORTUNIDADES
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/register">
                <Button className="btn-outline text-white border-white hover:bg-white hover:text-slate-900 text-base px-8 py-3" data-testid="cta-sell">
                  VENDER MI AGENCIA
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-b border-slate-200" data-testid="stats-section">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-arroba-coral">{stats?.published_deals || '20'}+</p>
              <p className="text-sm text-slate-500 mt-2 font-mono uppercase tracking-wider">Deals Activos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-arroba-blue">{stats?.closed_deals || '15'}+</p>
              <p className="text-sm text-slate-500 mt-2 font-mono uppercase tracking-wider">Operaciones Cerradas</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-arroba-yellow">{stats?.total_value_transacted || '50M+ €'}</p>
              <p className="text-sm text-slate-500 mt-2 font-mono uppercase tracking-wider">Valor Transaccionado</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-arroba-green">{stats?.average_deal_time || '4-6'}</p>
              <p className="text-sm text-slate-500 mt-2 font-mono uppercase tracking-wider">Meses Promedio</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-slate-50" data-testid="how-it-works-section">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="label-arroba text-arroba-coral mb-2">Proceso estructurado</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Cómo Funciona</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* For Buyers */}
            <div className="card-arroba" data-testid="how-buyers">
              <div className="w-12 h-12 bg-arroba-blue/10 rounded-sm flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-arroba-blue" />
              </div>
              <h3 className="text-xl font-bold mb-3">Para Compradores</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-arroba-green mt-0.5 flex-shrink-0" />
                  Explora oportunidades verificadas
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-arroba-green mt-0.5 flex-shrink-0" />
                  Firma NDA digital y accede al infomemo
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-arroba-green mt-0.5 flex-shrink-0" />
                  Envía LOI y negocia exclusividad
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-arroba-green mt-0.5 flex-shrink-0" />
                  Due diligence asistido
                </li>
              </ul>
            </div>

            {/* For Sellers */}
            <div className="card-arroba" data-testid="how-sellers">
              <div className="w-12 h-12 bg-arroba-coral/10 rounded-sm flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-arroba-coral" />
              </div>
              <h3 className="text-xl font-bold mb-3">Para Vendedores</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-arroba-green mt-0.5 flex-shrink-0" />
                  Crea tu perfil y carga datos
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-arroba-green mt-0.5 flex-shrink-0" />
                  Valoración automática del negocio
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-arroba-green mt-0.5 flex-shrink-0" />
                  Infomemo generado con IA
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-arroba-green mt-0.5 flex-shrink-0" />
                  Matching con compradores ideales
                </li>
              </ul>
            </div>

            {/* Process */}
            <div className="card-arroba" data-testid="how-process">
              <div className="w-12 h-12 bg-arroba-green/10 rounded-sm flex items-center justify-center mb-4">
                <FileCheck className="w-6 h-6 text-arroba-green" />
              </div>
              <h3 className="text-xl font-bold mb-3">Proceso Seguro</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-arroba-green mt-0.5 flex-shrink-0" />
                  Información progresiva y controlada
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-arroba-green mt-0.5 flex-shrink-0" />
                  NDA obligatorio antes de identidad
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-arroba-green mt-0.5 flex-shrink-0" />
                  Data room con acceso por fases
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-arroba-green mt-0.5 flex-shrink-0" />
                  Deal Manager asignado
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Deals */}
      {featuredDeals.length > 0 && (
        <section className="py-20 bg-white" data-testid="featured-deals-section">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-12">
              <div>
                <p className="label-arroba text-arroba-coral mb-2">Oportunidades destacadas</p>
                <h2 className="text-3xl font-bold text-slate-900">Deals Activos</h2>
              </div>
              <Link to="/marketplace">
                <Button className="btn-outline" data-testid="view-all-deals">
                  VER TODOS
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredDeals.slice(0, 3).map((deal) => (
                <Link 
                  key={deal.deal_id} 
                  to={`/marketplace/${deal.deal_id}`}
                  className="card-arroba hover:border-slate-300 transition-colors group"
                  data-testid={`deal-card-${deal.deal_id}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="badge-coral">{deal.teaser?.sector_display || 'Digital'}</span>
                    <span className="text-xs text-slate-400 font-mono">
                      {deal.operation_types_allowed?.includes('full_sale') ? 'Venta' : 'Fusión'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-arroba-coral transition-colors">
                    {deal.teaser?.headline || 'Agencia Digital'}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                    {deal.teaser?.description || 'Oportunidad de inversión en agencia digital'}
                  </p>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <p className="label-arroba">Facturación</p>
                      <p className="font-bold text-slate-900">{deal.teaser?.revenue_display || 'N/D'}</p>
                    </div>
                    <div>
                      <p className="label-arroba">EBITDA</p>
                      <p className="font-bold text-slate-900">{deal.teaser?.ebitda_display || 'N/D'}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Arroba */}
      <section className="py-20 bg-slate-900 text-white" data-testid="why-arroba-section">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="label-arroba text-arroba-coral mb-2">¿Por qué Arroba?</p>
            <h2 className="text-3xl md:text-4xl font-bold">La diferencia está en el proceso</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-arroba-coral/20 rounded-sm flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-arroba-coral" />
              </div>
              <h3 className="text-xl font-bold mb-2">Confidencialidad Garantizada</h3>
              <p className="text-slate-400">
                NDA digital obligatorio. Tu información sensible solo se revela a compradores verificados.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-arroba-blue/20 rounded-sm flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-arroba-blue" />
              </div>
              <h3 className="text-xl font-bold mb-2">Valoración Inteligente</h3>
              <p className="text-slate-400">
                Algoritmo de valoración específico para agencias digitales basado en múltiplos reales del mercado.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-arroba-green/20 rounded-sm flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-arroba-green" />
              </div>
              <h3 className="text-xl font-bold mb-2">Acompañamiento Experto</h3>
              <p className="text-slate-400">
                Deal Manager asignado desde el primer día. Soporte en todas las fases del proceso.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-arroba-coral" data-testid="cta-section">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            ¿Listo para dar el siguiente paso?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Ya sea que busques comprar, vender o fusionarte, estamos aquí para ayudarte en cada etapa del proceso.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button className="bg-white text-arroba-coral hover:bg-slate-100 font-semibold uppercase tracking-wider px-8 py-3" data-testid="cta-register">
                CREAR CUENTA GRATIS
              </Button>
            </Link>
            <Link to="/contact">
              <Button className="border-2 border-white text-white hover:bg-white hover:text-arroba-coral font-semibold uppercase tracking-wider px-8 py-3 bg-transparent" data-testid="cta-contact">
                HABLAR CON UN EXPERTO
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
