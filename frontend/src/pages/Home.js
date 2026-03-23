import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrobaLogo } from '../components/layout/Header';
import { marketplaceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowRight, 
  Check,
  ChevronLeft,
  ChevronRight,
  Users,
  Building2,
  Shield
} from 'lucide-react';

// Sample verified buyers logos (these would be real logos in production)
const verifiedBuyers = [
  { name: 'HAVAS', logo: 'HAVAS' },
  { name: 'Grupo Publicis', logo: '🦁' },
  { name: 'IPG', logo: 'IPG' },
  { name: 'Deloitte', logo: 'Deloitte.' },
  { name: 'dentsu', logo: 'dentsu' },
];

// Sample deal card for hero
const SampleDealCard = () => (
  <div className="bg-white rounded-2xl shadow-lg p-6 max-w-xs">
    <div className="flex items-center justify-center mb-4">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 via-yellow-400 to-pink-400 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
          <span className="text-2xl">@</span>
        </div>
      </div>
    </div>
    <p className="text-center text-2xl font-bold text-slate-900 mb-4">€ 40.000</p>
    <Link to="/explorar">
      <Button className="w-full bg-arroba-coral hover:bg-arroba-coral/90 text-white rounded-full text-sm">
        Comprar
      </Button>
    </Link>
    <div className="mt-4 space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-slate-500">Clientes</span>
        <span className="font-medium">200</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-500">Proyectos</span>
        <span className="font-medium">40</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-500">Inversores</span>
        <span className="font-medium">3</span>
      </div>
    </div>
  </div>
);

// Contact agent card
const ContactAgentCard = () => (
  <div className="bg-white rounded-2xl shadow-lg p-6 max-w-xs">
    <p className="text-arroba-coral font-medium text-sm mb-3">arroba</p>
    <h4 className="font-bold text-slate-900 mb-2">Contacta con el agente</h4>
    <div className="flex items-center gap-2 mb-4">
      <span className="text-arroba-coral">📧</span>
      <span className="text-sm text-slate-500">persona@correo.com</span>
    </div>
    <p className="text-xs text-slate-400 mb-4">
      Est inveles liguiscimos oples debiste non s igrimo loctusper ins, eyour rem ito oig tu.m dien t mointotrem.
    </p>
    <div className="flex -space-x-2 mb-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-white" />
      ))}
    </div>
    <p className="text-xs text-arroba-coral">5 agentes interesados</p>
  </div>
);

const Home = () => {
  const [email, setEmail] = useState('');
  const [stats, setStats] = useState(null);
  const [featuredDeals, setFeaturedDeals] = useState([]);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

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

  const handleQuickRegister = (e) => {
    e.preventDefault();
    if (email) {
      navigate(`/register?email=${encodeURIComponent(email)}`);
    } else {
      navigate('/register');
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-white py-16 lg:py-24" data-testid="hero-section">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div>
              <h1 className="text-4xl lg:text-5xl font-serif italic text-slate-900 mb-6 leading-tight">
                El lugar donde<br />
                <span className="text-arroba-coral">comprar y vender</span><br />
                agencias
              </h1>
              
              <p className="text-slate-600 mb-6 max-w-lg">
                Regístrate gratis y consigue acceso privado a la mayor plataforma de compradores y vendedores del ecosistema Madtech (Marketing, advertising y tecnología)
              </p>

              {/* Trust indicators */}
              <div className="space-y-2 mb-8">
                <div className="flex items-center gap-2 text-arroba-coral">
                  <Check className="w-4 h-4" />
                  <span className="text-sm">+120 compradores verificados</span>
                </div>
                <div className="flex items-center gap-2 text-arroba-coral">
                  <Check className="w-4 h-4" />
                  <span className="text-sm">Confidencialidad garantizada</span>
                </div>
                <div className="flex items-center gap-2 text-arroba-coral">
                  <Check className="w-4 h-4" />
                  <span className="text-sm">Acompanamiento en todo el proceso</span>
                </div>
              </div>

              {/* Quick Register Form */}
              <form onSubmit={handleQuickRegister} className="flex gap-2 max-w-md">
                <Input
                  type="email"
                  placeholder="Tu correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 rounded-lg border-slate-200 px-4 py-3"
                  data-testid="hero-email-input"
                />
                <Button 
                  type="submit" 
                  className="bg-arroba-coral hover:bg-arroba-coral/90 text-white rounded-lg px-6"
                  data-testid="hero-register-btn"
                >
                  Regístrate gratis
                </Button>
              </form>
            </div>

            {/* Right Column - Cards */}
            <div className="hidden lg:flex gap-6 justify-center">
              <SampleDealCard />
              <ContactAgentCard />
            </div>
          </div>
        </div>
      </section>

      {/* Verified Buyers Section */}
      <section className="py-12 bg-white border-t border-slate-100" data-testid="buyers-section">
        <div className="container mx-auto px-4">
          <h3 className="text-xl font-medium text-slate-900 mb-8">Compradores verificados</h3>
          
          <div className="flex items-center gap-8">
            <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50">
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
            
            <div className="flex-1 flex items-center justify-between">
              {verifiedBuyers.map((buyer, idx) => (
                <div key={idx} className="text-xl font-bold text-slate-400 hover:text-slate-600 transition-colors">
                  {buyer.logo}
                </div>
              ))}
            </div>
            
            <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50">
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
      </section>

      {/* Featured Agencies Section */}
      <section className="py-16 bg-slate-50" data-testid="featured-section">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Agencias destacadas</h2>
            <Link to="/explorar" className="text-arroba-coral hover:underline flex items-center gap-1">
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {featuredDeals.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredDeals.slice(0, 6).map((deal) => (
                <Link 
                  key={deal.deal_id} 
                  to={`/marketplace/${deal.deal_id}`}
                  className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow"
                  data-testid={`deal-card-${deal.deal_id}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="px-3 py-1 bg-slate-900 text-white text-xs rounded-full">
                      {deal.status === 'published' ? 'DISPONIBLE' : 'EN NEGOCIACIÓN'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {deal.teaser?.geography_display}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-lg text-slate-900 mb-2">
                    {deal.teaser?.headline || 'Agencia Digital'}
                  </h3>
                  
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                    {deal.teaser?.description || 'Oportunidad de inversión en agencia digital'}
                  </p>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Facturación</p>
                      <p className="font-bold text-slate-900">{deal.teaser?.revenue_display || 'N/D'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase">EBITDA</p>
                      <p className="font-bold text-slate-900">{deal.teaser?.ebitda_display || 'N/D'}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Próximamente nuevas agencias</p>
              <Link to="/register?role=seller">
                <Button className="mt-4 bg-arroba-coral hover:bg-arroba-coral/90 text-white">
                  Publica tu agencia
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white" data-testid="how-it-works-section">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">¿Cómo funciona?</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Un proceso estructurado y seguro para conectar compradores y vendedores de agencias digitales
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-arroba-coral/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-arroba-coral">1</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Regístrate gratis</h3>
              <p className="text-sm text-slate-500">
                Crea tu cuenta y define si quieres comprar, vender o fusionarte
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-arroba-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-arroba-blue">2</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Explora oportunidades</h3>
              <p className="text-sm text-slate-500">
                Accede al marketplace con todas las agencias verificadas
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-arroba-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-arroba-green">3</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Cierra tu operación</h3>
              <p className="text-sm text-slate-500">
                Te acompañamos en todo el proceso hasta el cierre
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-900 text-white" data-testid="stats-section">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-arroba-coral">{stats?.published_deals || '20'}+</p>
              <p className="text-sm text-slate-400 mt-2">Agencias activas</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-arroba-blue">{stats?.closed_deals || '15'}+</p>
              <p className="text-sm text-slate-400 mt-2">Operaciones cerradas</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-arroba-yellow">{stats?.total_value_transacted || '50M+ €'}</p>
              <p className="text-sm text-slate-400 mt-2">Valor transaccionado</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-arroba-green">120+</p>
              <p className="text-sm text-slate-400 mt-2">Compradores verificados</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-arroba-coral" data-testid="cta-section">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            ¿Listo para empezar?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Únete a la mayor plataforma de M&A de agencias digitales
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button className="bg-white text-arroba-coral hover:bg-slate-100 font-semibold px-8 py-3 rounded-lg" data-testid="cta-register">
                Crear cuenta gratis
              </Button>
            </Link>
            <Link to="/explorar">
              <Button className="border-2 border-white text-white hover:bg-white hover:text-arroba-coral font-semibold px-8 py-3 rounded-lg bg-transparent" data-testid="cta-explore">
                Ver agencias
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
