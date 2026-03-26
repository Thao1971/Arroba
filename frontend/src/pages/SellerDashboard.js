import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { companiesAPI, dealsAPI, coachingAPI, conversationsAPI } from '../services/api';
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
  AlertCircle,
  AlertTriangle,
  Info,
  Clock
} from 'lucide-react';

const SellerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nudges, setNudges] = useState([]);
  const [pendingData, setPendingData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesRes, dealsRes] = await Promise.all([
          companiesAPI.list(),
          dealsAPI.list()
        ]);
        setCompanies(companiesRes.data);
        setDeals(dealsRes.data);
        // Fetch nudges + pending Q&A in parallel
        try {
          const [nudgesRes, pendingRes] = await Promise.all([
            coachingAPI.getSellerNudges(),
            conversationsAPI.getPending()
          ]);
          setNudges(nudgesRes.data?.nudges || []);
          setPendingData(pendingRes.data);
        } catch {}
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

        {/* Response Acceleration — Acciones pendientes Q&A */}
        {pendingData && pendingData.total_pending > 0 && (
          <div className="mb-8" data-testid="pending-actions-block">
            <div className="p-5" style={{ background: 'var(--surface-lowest, #fff)', boxShadow: '0 2px 12px rgba(25,28,30,0.06)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center" style={{ background: 'rgba(182,33,42,0.08)' }}>
                    <MessageSquare className="w-6 h-6 text-arroba-coral" />
                  </div>
                  <div>
                    <p className="label-arroba text-arroba-coral mb-0.5">ACCIONES PENDIENTES</p>
                    <p className="text-lg font-bold text-slate-900">
                      {pendingData.total_pending} pregunta{pendingData.total_pending !== 1 ? 's' : ''} pendiente{pendingData.total_pending !== 1 ? 's' : ''} de {pendingData.buyers_waiting} buyer{pendingData.buyers_waiting !== 1 ? 's' : ''}
                    </p>
                    {pendingData.most_urgent && (
                      <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Mas urgente: {pendingData.most_urgent.buyer_name} · hace {pendingData.most_urgent.pending_hours < 1 ? 'menos de 1h' : `${Math.round(pendingData.most_urgent.pending_hours)}h`}
                      </p>
                    )}
                  </div>
                </div>
                {pendingData.most_urgent && (
                  <Link to={`/qa/${pendingData.most_urgent.conversation_id}`}>
                    <Button className="btn-primary" data-testid="respond-now-btn">
                      RESPONDER AHORA
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
              {/* Individual pending items preview (max 3) */}
              {pendingData.pending_questions.length > 1 && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  {pendingData.pending_questions.slice(0, 3).map((q, i) => (
                    <Link key={q.qa_item_id} to={`/qa/${q.conversation_id}`}
                      className="flex items-center justify-between py-1.5 px-2 hover:bg-slate-50 transition-colors group"
                      data-testid={`pending-item-${i}`}>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          q.urgency === 'alta' ? 'bg-red-500' : q.urgency === 'media' ? 'bg-amber-500' : 'bg-slate-300'
                        }`} />
                        <span className="text-sm text-slate-700 truncate">{q.content}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-[11px] text-slate-400">{q.buyer_name}</span>
                        <span className={`text-[11px] font-semibold ${
                          q.urgency === 'alta' ? 'text-red-600' : q.urgency === 'media' ? 'text-amber-600' : 'text-slate-400'
                        }`}>
                          {q.pending_hours < 1 ? '<1h' : `${Math.round(q.pending_hours)}h`}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-arroba-coral transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Coaching Nudges */}
        {nudges.length > 0 && (
          <div className="mb-8 space-y-2" data-testid="seller-nudges">
            <h2 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-3">Senales del sistema</h2>
            {nudges.slice(0, 5).map((nudge, i) => (
              <div key={nudge.id + i}
                onClick={() => nudge.deal_id && navigate(`/seller/deal/${nudge.deal_id}`)}
                className={`rounded-lg border cursor-pointer transition-colors hover:shadow-sm overflow-hidden ${
                  nudge.priority === 'ALTA' ? 'bg-red-50 border-red-200 hover:bg-red-100' :
                  nudge.priority === 'MEDIA' ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' :
                  'bg-blue-50 border-blue-200 hover:bg-blue-100'
                }`} data-testid={`seller-nudge-${nudge.id}-${i}`}>
                <div className="flex items-start gap-3 p-4">
                {nudge.priority === 'ALTA'
                  ? <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                  : nudge.priority === 'MEDIA'
                    ? <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                    : <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900">{nudge.title}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      nudge.priority === 'ALTA' ? 'bg-red-200 text-red-800' :
                      nudge.priority === 'MEDIA' ? 'bg-amber-200 text-amber-800' :
                      'bg-blue-200 text-blue-800'
                    }`}>{nudge.priority}</span>
                  </div>
                  <p className="text-sm text-slate-700 mt-0.5">{nudge.message}</p>
                  {nudge.prescription && (
                    <p className="text-sm text-slate-900 font-medium mt-2 bg-white/60 rounded p-2 border border-slate-200">{nudge.prescription}</p>
                  )}
                  {nudge.deal_title && (
                    <p className="text-xs text-slate-400 mt-1 truncate">{nudge.deal_title}</p>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
              </div>
              {nudge.actions?.length > 0 && (
                <div className="px-4 pb-3 flex gap-2">
                  {nudge.actions.map((a, j) => (
                    <span key={j} className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      nudge.priority === 'ALTA' ? 'bg-red-200 text-red-900' :
                      nudge.priority === 'MEDIA' ? 'bg-amber-200 text-amber-900' :
                      'bg-blue-200 text-blue-900'
                    }`}>{a}</span>
                  ))}
                </div>
              )}
              </div>
            ))}
          </div>
        )}

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
                      <p className="text-lg font-bold">{(activeDeal.metrics?.lois_received_count || 0) === 1 ? 'LOI recibida' : 'LOIs recibidas'}</p>
                      <p className="text-xs text-slate-500"></p>
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
