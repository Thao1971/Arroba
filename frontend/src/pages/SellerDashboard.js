import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { companiesAPI, dealsAPI } from '../services/api';
import { 
  Plus, 
  Building2, 
  FileText, 
  Users, 
  TrendingUp,
  ArrowRight,
  Eye,
  MessageSquare,
  FileSignature,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const SellerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesRes, dealsRes] = await Promise.all([
          companiesAPI.list(),
          dealsAPI.list()
        ]);
        setCompanies(companiesRes.data);
        setDeals(dealsRes.data);
      } catch (error) {
        console.error('Error fetching seller data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusLabel = (status) => {
    const statusMap = {
      draft: { label: 'Borrador', class: 'status-draft' },
      published: { label: 'Publicado', class: 'status-published' },
      nda: { label: 'En NDA', class: 'status-nda' },
      evaluation: { label: 'Evaluación', class: 'status-evaluation' },
      intent: { label: 'Intent', class: 'status-intent' },
      shortlist: { label: 'Shortlist', class: 'status-shortlist' },
      exclusivity: { label: 'Exclusividad', class: 'status-exclusivity' },
      due_diligence: { label: 'Due Diligence', class: 'status-due_diligence' },
      closed: { label: 'Cerrado', class: 'status-closed' },
      dropped: { label: 'Cancelado', class: 'status-dropped' },
    };
    return statusMap[status] || { label: status, class: 'status-draft' };
  };

  const hasCompany = companies.length > 0;
  const hasDeal = deals.length > 0;
  const activeDeal = deals.find(d => !['closed', 'dropped'].includes(d.status));

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8" data-testid="seller-dashboard">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="label-arroba text-arroba-coral mb-2">Dashboard Vendedor</p>
            <h1 className="text-3xl font-bold text-slate-900">
              Hola, {user?.first_name || 'Vendedor'}
            </h1>
            <p className="text-slate-500 mt-1">
              Gestiona tu compañía y proceso de venta
            </p>
          </div>
          {!hasCompany && (
            <Link to="/seller/company/new">
              <Button className="btn-primary" data-testid="create-company-btn">
                <Plus className="w-4 h-4 mr-2" />
                CREAR COMPAÑÍA
              </Button>
            </Link>
          )}
        </div>

        {/* Onboarding Steps */}
        {!hasCompany && (
          <div className="card-arroba mb-8" data-testid="onboarding-steps">
            <h2 className="font-bold text-lg mb-4">Pasos para publicar tu agencia</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-arroba-coral/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-arroba-coral">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Crea tu compañía</h3>
                  <p className="text-sm text-slate-500">Añade los datos básicos de tu agencia</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-slate-400">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-400">Añade datos financieros</h3>
                  <p className="text-sm text-slate-400">Facturación, EBITDA, crecimiento...</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-slate-400">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-400">Genera el infomemo con IA</h3>
                  <p className="text-sm text-slate-400">Documento profesional automático</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-slate-400">4</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-400">Activa y publica tu deal</h3>
                  <p className="text-sm text-slate-400">Recibe interés de compradores cualificados</p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Link to="/seller/company/new">
                <Button className="btn-primary" data-testid="start-onboarding-btn">
                  EMPEZAR AHORA
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Main Content */}
        {hasCompany && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Company & Deal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Company Card */}
              <div className="card-arroba" data-testid="company-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-arroba-coral/10 rounded-sm flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-arroba-coral" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {companies[0]?.trade_name || companies[0]?.legal_name}
                      </h3>
                      <p className="text-sm text-slate-500">{companies[0]?.acronym}</p>
                    </div>
                  </div>
                  <Link to={`/seller/company/${companies[0]?.company_id}`}>
                    <Button className="btn-outline text-sm" data-testid="edit-company-btn">
                      Editar
                    </Button>
                  </Link>
                </div>

                {/* Company Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <p className="label-arroba">Facturación</p>
                    <p className="font-bold text-slate-900">
                      {companies[0]?.financials?.[0]?.revenue 
                        ? `${(companies[0].financials[0].revenue / 1000000).toFixed(1)}M €`
                        : 'Sin datos'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="label-arroba">EBITDA</p>
                    <p className="font-bold text-slate-900">
                      {companies[0]?.financials?.[0]?.ebitda
                        ? `${(companies[0].financials[0].ebitda / 1000).toFixed(0)}k €`
                        : 'Sin datos'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="label-arroba">Valoración</p>
                    <p className="font-bold text-arroba-coral">
                      {companies[0]?.valuation?.valuation_min
                        ? `${(companies[0].valuation.valuation_min / 1000000).toFixed(1)}-${(companies[0].valuation.valuation_max / 1000000).toFixed(1)}M €`
                        : 'Calcular'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Deal Card */}
              {activeDeal ? (
                <div className="card-arroba" data-testid="deal-card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-slate-900">Tu Deal</h3>
                        {(() => {
                          const status = getStatusLabel(activeDeal.status);
                          return <span className={`badge-arroba ${status.class}`}>{status.label}</span>;
                        })()}
                      </div>
                      <p className="text-sm text-slate-500">
                        Readiness: {activeDeal.readiness_score?.toFixed(0) || 0}%
                      </p>
                    </div>
                    <Link to={`/seller/deal/${activeDeal.deal_id}`}>
                      <Button className="btn-primary" data-testid="manage-deal-btn">
                        GESTIONAR DEAL
                      </Button>
                    </Link>
                  </div>

                  {/* Deal Metrics */}
                  <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                    <div className="text-center">
                      <div className="w-10 h-10 bg-slate-100 rounded-sm flex items-center justify-center mx-auto mb-2">
                        <Eye className="w-5 h-5 text-slate-500" />
                      </div>
                      <p className="text-lg font-bold">{activeDeal.metrics?.teaser_views || 0}</p>
                      <p className="text-xs text-slate-500">Vistas</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 bg-arroba-blue/10 rounded-sm flex items-center justify-center mx-auto mb-2">
                        <Users className="w-5 h-5 text-arroba-blue" />
                      </div>
                      <p className="text-lg font-bold">{activeDeal.metrics?.access_requests_count || 0}</p>
                      <p className="text-xs text-slate-500">Solicitudes</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 bg-arroba-yellow/10 rounded-sm flex items-center justify-center mx-auto mb-2">
                        <FileSignature className="w-5 h-5 text-arroba-yellow" />
                      </div>
                      <p className="text-lg font-bold">{activeDeal.metrics?.ndas_signed_count || 0}</p>
                      <p className="text-xs text-slate-500">NDAs</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 bg-arroba-green/10 rounded-sm flex items-center justify-center mx-auto mb-2">
                        <FileText className="w-5 h-5 text-arroba-green" />
                      </div>
                      <p className="text-lg font-bold">{activeDeal.metrics?.lois_received_count || 0}</p>
                      <p className="text-xs text-slate-500">LOIs</p>
                    </div>
                  </div>

                  {/* Readiness Checklist */}
                  {activeDeal.status === 'draft' && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="label-arroba mb-2">Checklist para publicar</p>
                      <div className="space-y-2">
                        {activeDeal.readiness_checklist?.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            {item.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-arroba-green" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-slate-300" />
                            )}
                            <span className={item.completed ? 'text-slate-700' : 'text-slate-400'}>
                              {item.item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : hasCompany && (
                <div className="card-arroba text-center py-8" data-testid="no-deal">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="font-bold text-slate-900 mb-2">Crea tu deal</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Define los términos de venta y genera el infomemo para publicar en el marketplace
                  </p>
                  <Link to={`/seller/deal/new?company=${companies[0]?.company_id}`}>
                    <Button className="btn-primary" data-testid="create-deal-btn">
                      CREAR DEAL
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Right Column - Activity & Help */}
            <div className="space-y-6">
              {/* Deal Manager */}
              <div className="card-arroba">
                <h3 className="font-bold text-slate-900 mb-4">Tu Deal Manager</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-arroba-blue rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">BA</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">BUD Advisors</p>
                    <p className="text-sm text-slate-500">Asignación pendiente</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500">
                  Tu Deal Manager será asignado cuando actives tu suscripción de vendedor.
                </p>
              </div>

              {/* Quick Links */}
              <div className="card-arroba">
                <h3 className="font-bold text-slate-900 mb-4">Recursos</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="text-sm text-arroba-coral hover:underline flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Guía de valoración
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-arroba-coral hover:underline flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      FAQ vendedores
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-arroba-coral hover:underline flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Casos de éxito
                    </a>
                  </li>
                </ul>
              </div>

              {/* Subscription */}
              <div className="card-arroba bg-slate-50">
                <h3 className="font-bold text-slate-900 mb-2">Suscripción Vendedor</h3>
                <p className="text-sm text-slate-500 mb-4">
                  999€/mes para publicar tu deal y recibir interés de compradores cualificados.
                </p>
                <Link to="/pricing">
                  <Button className="w-full btn-primary">
                    ACTIVAR PLAN
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SellerDashboard;
