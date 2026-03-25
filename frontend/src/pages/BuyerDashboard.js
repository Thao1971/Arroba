import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { marketplaceAPI, matchingAPI, engagementsAPI } from '../services/api';
import { 
  TrendingUp, Search, FileText, Clock, ArrowRight, Bell, Building2,
  Sparkles, MapPin, Zap, ChevronRight, Send, FileSignature, Shield,
  Star, Lock, AlertCircle, FolderOpen, MessageSquare, CheckCircle2
} from 'lucide-react';

const affinityConfig = {
  high: { label: 'Alta afinidad', class: 'bg-green-100 text-green-700', icon: Zap },
  medium: { label: 'Afinidad media', class: 'bg-yellow-100 text-yellow-700', icon: Sparkles },
  low: { label: 'Baja afinidad', class: 'bg-slate-100 text-slate-500', icon: null },
};

const stageConfig = {
  SUBMITTED: { label: 'Enviado', color: 'bg-blue-100 text-blue-700', icon: Send },
  VIEWED: { label: 'Visto por seller', color: 'bg-amber-100 text-amber-700', icon: FileText },
  ACCEPTED: { label: 'Aceptado', color: 'bg-teal-100 text-teal-700', icon: CheckCircle2 },
  SHORTLISTED: { label: 'En Shortlist', color: 'bg-green-100 text-green-700', icon: Star },
  REJECTED: { label: 'No seleccionado', color: 'bg-red-100 text-red-600', icon: AlertCircle },
  EXCLUSIVITY: { label: 'En Exclusividad', color: 'bg-indigo-100 text-indigo-700', icon: Lock },
};

const BuyerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recommendedDeals, setRecommendedDeals] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, processRes] = await Promise.all([
          marketplaceAPI.getStats(),
          engagementsAPI.getMyProcesses().catch(() => ({ data: { processes: [] } })),
        ]);
        setStats(statsRes.data);
        setProcesses(processRes.data.processes || []);

        try {
          const matchRes = await matchingAPI.getRecommendedDeals();
          setRecommendedDeals(matchRes.data.deals || []);
          setProfileComplete(matchRes.data.profile_complete || false);
        } catch {
          setProfileComplete(false);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const quickActions = [
    { icon: Search, title: 'Explorar Deals', description: 'Busca oportunidades', href: '/marketplace', color: 'text-arroba-coral' },
    { icon: FolderOpen, title: 'Mis Procesos', description: `${processes.length} procesos activos`, href: '#processes', color: 'text-arroba-blue' },
    { icon: Bell, title: 'Alertas', description: 'Notificaciones', href: '/buyer/alerts', color: 'text-amber-500' },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8" data-testid="buyer-dashboard">
        {/* Header */}
        <div className="mb-8">
          <p className="label-arroba text-arroba-coral mb-2">Dashboard</p>
          <h1 className="text-3xl font-bold text-slate-900">Hola, {user?.first_name || 'Inversor'}</h1>
          <p className="text-slate-500 mt-1">Bienvenido a tu panel de comprador</p>
        </div>

        {/* Profile Completion Alert */}
        {!profileComplete && (
          <div className="card-arroba bg-arroba-coral/5 border-arroba-coral/30 mb-8" data-testid="profile-alert">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-arroba-coral/10 rounded-sm flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-arroba-coral" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Completa tu perfil de comprador</h3>
                  <p className="text-sm text-slate-500">Sin perfil completo no podrás enviar interés, LOI ni ver recomendaciones</p>
                </div>
              </div>
              <Link to="/buyer/onboarding">
                <Button className="bg-arroba-coral hover:bg-arroba-coral/90 text-white" data-testid="complete-profile-btn">COMPLETAR PERFIL</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} to={action.href}
                className="card-arroba hover:border-slate-300 transition-colors group"
                data-testid={`quick-action-${action.title.toLowerCase().replace(/\s/g, '-')}`}>
                <div className="w-10 h-10 bg-slate-100 rounded-sm flex items-center justify-center mb-3">
                  <Icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-arroba-coral transition-colors">{action.title}</h3>
                <p className="text-sm text-slate-500">{action.description}</p>
              </Link>
            );
          })}
        </div>

        {/* Mis Procesos */}
        {processes.length > 0 && (
          <div className="mb-8" id="processes" data-testid="my-processes">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-arroba-coral" /> Mis Procesos
              </h2>
              <span className="text-sm text-slate-400">{processes.length} activo{processes.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-3">
              {processes.map((proc) => {
                const stage = stageConfig[proc.stage] || { label: proc.stage, color: 'bg-slate-100 text-slate-600', icon: FileText };
                const StageIcon = stage.icon;
                return (
                  <Link key={proc.engagement_id} to={`/marketplace/${proc.deal_id}`}
                    className="card-arroba hover:border-slate-300 transition-all block group"
                    data-testid={`process-${proc.engagement_id}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${stage.color.replace('text-', 'bg-').split(' ')[0]}/20`}>
                          <StageIcon className={`w-5 h-5 ${stage.color.split(' ')[1]}`} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-slate-900 group-hover:text-arroba-coral transition-colors truncate">
                            {proc.deal_title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-slate-400">{proc.deal_sector}</span>
                            {proc.deal_location && <span className="text-xs text-slate-400 flex items-center gap-0.5"><MapPin className="w-3 h-3" />{proc.deal_location}</span>}
                            <span className="text-xs text-slate-400">· {proc.type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${stage.color}`}>
                            {stage.label}
                          </span>
                          {proc.valuation_offer && (
                            <p className="text-xs text-arroba-coral font-bold mt-1">{(proc.valuation_offer / 1e6).toFixed(1)}M€</p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-arroba-coral transition-colors" />
                      </div>
                    </div>
                    {/* Next step + Q&A link */}
                    {proc.stage !== 'REJECTED' && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                        {proc.next_step && (
                          <span className="text-xs text-arroba-coral font-medium flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" /> Proximo paso: {proc.next_step.action}
                          </span>
                        )}
                        {proc.conversation_id && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.location.href = `/qa/${proc.conversation_id}`;
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider hover:opacity-80 transition-opacity"
                            style={{ background: 'rgba(0,100,147,0.08)', color: '#004b74' }}
                            data-testid={`qa-link-${proc.engagement_id}`}
                          >
                            <MessageSquare size={10} /> ABRIR Q&A
                          </button>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Recommended Deals */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-arroba-coral" /> Deals Recomendados
              </h2>
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
            ) : !profileComplete ? (
              <div className="card-arroba text-center py-8" data-testid="no-recommendations">
                <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900 mb-1">Recomendaciones no disponibles</h3>
                <p className="text-sm text-slate-500 mb-4">Completa tu perfil para activar matching</p>
                <Link to="/buyer/onboarding">
                  <Button className="bg-arroba-coral hover:bg-arroba-coral/90 text-white" data-testid="go-onboarding-btn">COMPLETAR PERFIL</Button>
                </Link>
              </div>
            ) : recommendedDeals.length === 0 ? (
              <div className="card-arroba text-center py-8" data-testid="no-deals-found">
                <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900 mb-1">No hay deals compatibles ahora</h3>
                <p className="text-sm text-slate-500 mb-4">Te avisaremos cuando haya nuevas oportunidades.</p>
                <Link to="/marketplace"><Button className="btn-outline">EXPLORAR MARKETPLACE</Button></Link>
              </div>
            ) : (
              <div className="space-y-4" data-testid="recommended-deals-list">
                {recommendedDeals.slice(0, 6).map((deal) => {
                  const teaser = deal.teaser || {};
                  const aff = affinityConfig[deal.affinity] || affinityConfig.low;
                  const AffIcon = aff.icon;
                  return (
                    <Link key={deal.deal_id} to={`/marketplace/${deal.deal_id}`}
                      className="card-arroba hover:border-slate-300 transition-colors block group"
                      data-testid={`recommended-deal-${deal.deal_id}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="badge-coral text-xs">{teaser.sector_display || 'Digital'}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${aff.class}`} data-testid={`affinity-badge-${deal.deal_id}`}>
                              {AffIcon && <AffIcon className="w-3 h-3" />}{aff.label}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-900 mb-1 group-hover:text-arroba-coral transition-colors truncate">
                            {teaser.title || teaser.headline || 'Oportunidad de inversión'}
                          </h3>
                          <p className="text-sm text-slate-500 line-clamp-1">{teaser.short_description || teaser.description || ''}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                            {(teaser.location || teaser.geography_display) && (
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {teaser.location || teaser.geography_display}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="label-arroba">Facturación</p>
                          <p className="font-bold text-slate-900 text-sm">{teaser.revenue_range || teaser.revenue_display || 'N/D'}</p>
                          <p className="label-arroba mt-2">EBITDA</p>
                          <p className="font-bold text-slate-900 text-sm">{teaser.ebitda_range || teaser.ebitda_display || 'N/D'}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="card-arroba">
              <h3 className="font-bold text-slate-900 mb-4">Mercado</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Deals activos</span>
                  <span className="font-bold text-arroba-coral">{stats?.published_deals || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Nuevos esta semana</span>
                  <span className="font-bold text-arroba-green">+{stats?.new_this_week || 0}</span>
                </div>
              </div>
            </div>

            <div className="card-arroba bg-slate-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900">Tu Suscripción</h3>
                <span className="badge-arroba">Sin plan</span>
              </div>
              <p className="text-sm text-slate-500 mb-4">Activa tu suscripción para solicitar acceso a deals y firmar NDAs</p>
              <Link to="/pricing"><Button className="w-full btn-primary">VER PLANES</Button></Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BuyerDashboard;
