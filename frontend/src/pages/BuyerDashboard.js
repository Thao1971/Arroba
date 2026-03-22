import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { marketplaceAPI, dealsAPI } from '../services/api';
import { 
  TrendingUp, 
  Search, 
  FileText, 
  Clock, 
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2
} from 'lucide-react';

const BuyerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [featuredDeals, setFeaturedDeals] = useState([]);
  const [loading, setLoading] = useState(true);

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
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const quickActions = [
    {
      icon: Search,
      title: 'Explorar Deals',
      description: 'Busca oportunidades de inversión',
      href: '/marketplace',
      color: 'arroba-coral'
    },
    {
      icon: FileText,
      title: 'Mis Procesos',
      description: 'Deals en los que participas',
      href: '/buyer/processes',
      color: 'arroba-blue'
    },
    {
      icon: Bell,
      title: 'Alertas',
      description: 'Configura tus notificaciones',
      href: '/buyer/alerts',
      color: 'arroba-yellow'
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8" data-testid="buyer-dashboard">
        {/* Header */}
        <div className="mb-8">
          <p className="label-arroba text-arroba-coral mb-2">Dashboard</p>
          <h1 className="text-3xl font-bold text-slate-900">
            Hola, {user?.first_name || 'Inversor'}
          </h1>
          <p className="text-slate-500 mt-1">
            Bienvenido a tu panel de comprador
          </p>
        </div>

        {/* Profile Completion Alert */}
        {!user?.buyer_profile?.type && (
          <div className="card-arroba bg-arroba-blue/5 border-arroba-blue mb-8" data-testid="profile-alert">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-arroba-blue/10 rounded-sm flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-arroba-blue" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Completa tu perfil de comprador</h3>
                  <p className="text-sm text-slate-500">
                    Define tus criterios de inversión para recibir mejores recomendaciones
                  </p>
                </div>
              </div>
              <Link to="/buyer/profile">
                <Button className="btn-secondary">
                  COMPLETAR PERFIL
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                to={action.href}
                className="card-arroba hover:border-slate-300 transition-colors group"
                data-testid={`quick-action-${action.title.toLowerCase().replace(' ', '-')}`}
              >
                <div className={`w-10 h-10 bg-${action.color}/10 rounded-sm flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 text-${action.color}`} />
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-arroba-coral transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-slate-500">{action.description}</p>
              </Link>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Recommended Deals */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Deals Recomendados</h2>
              <Link to="/marketplace" className="text-sm text-arroba-coral hover:underline flex items-center gap-1">
                Ver todos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card-arroba animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-1/4 mb-3"></div>
                    <div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : featuredDeals.length === 0 ? (
              <div className="card-arroba text-center py-8">
                <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900 mb-1">No hay deals disponibles</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Completa tu perfil para recibir recomendaciones personalizadas
                </p>
                <Link to="/marketplace">
                  <Button className="btn-outline">EXPLORAR MARKETPLACE</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {featuredDeals.slice(0, 5).map((deal) => (
                  <Link
                    key={deal.deal_id}
                    to={`/marketplace/${deal.deal_id}`}
                    className="card-arroba hover:border-slate-300 transition-colors block"
                    data-testid={`deal-${deal.deal_id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="badge-coral">{deal.teaser?.sector_display || 'Digital'}</span>
                          <span className="badge-green">Alta afinidad</span>
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1">
                          {deal.teaser?.headline || 'Agencia Digital'}
                        </h3>
                        <p className="text-sm text-slate-500 line-clamp-1">
                          {deal.teaser?.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="label-arroba">Facturación</p>
                        <p className="font-bold text-slate-900">{deal.teaser?.revenue_display}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Stats & Activity */}
          <div className="space-y-6">
            {/* My Stats */}
            <div className="card-arroba">
              <h3 className="font-bold text-slate-900 mb-4">Mi Actividad</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Deals vistos</span>
                  <span className="font-bold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">NDAs firmados</span>
                  <span className="font-bold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">LOIs enviadas</span>
                  <span className="font-bold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Procesos activos</span>
                  <span className="font-bold">0</span>
                </div>
              </div>
            </div>

            {/* Market Stats */}
            <div className="card-arroba">
              <h3 className="font-bold text-slate-900 mb-4">Mercado</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Deals activos</span>
                  <span className="font-bold text-arroba-coral">{stats?.published_deals || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Nuevos esta semana</span>
                  <span className="font-bold text-arroba-green">+3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Operaciones cerradas</span>
                  <span className="font-bold">{stats?.closed_deals || 0}</span>
                </div>
              </div>
            </div>

            {/* Subscription Status */}
            <div className="card-arroba bg-slate-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900">Tu Suscripción</h3>
                <span className="badge-arroba">Sin plan</span>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Activa tu suscripción para solicitar acceso a deals y firmar NDAs
              </p>
              <Link to="/pricing">
                <Button className="w-full btn-primary">
                  VER PLANES
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BuyerDashboard;
