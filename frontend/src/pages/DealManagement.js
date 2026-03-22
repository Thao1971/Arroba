import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { dealsAPI, companiesAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  ArrowLeft, Eye, Users, FileSignature, FileText, CheckCircle2,
  AlertCircle, Shield, TrendingUp, Loader2, ChevronRight, Download
} from 'lucide-react';

// Status flow visualization
const statusFlow = [
  { id: 'draft', label: 'Borrador', color: 'slate' },
  { id: 'published', label: 'Publicado', color: 'blue' },
  { id: 'nda', label: 'En NDA', color: 'yellow' },
  { id: 'evaluation', label: 'Evaluación', color: 'purple' },
  { id: 'intent', label: 'Intent', color: 'orange' },
  { id: 'shortlist', label: 'Shortlist', color: 'pink' },
  { id: 'exclusivity', label: 'Exclusividad', color: 'indigo' },
  { id: 'due_diligence', label: 'Due Diligence', color: 'cyan' },
  { id: 'closed', label: 'Cerrado', color: 'green' },
];

const getStatusIndex = (status) => statusFlow.findIndex(s => s.id === status);

const DealManagement = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [deal, setDeal] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDeal();
  }, [dealId]);

  const loadDeal = async () => {
    try {
      setLoading(true);
      const dealResponse = await dealsAPI.get(dealId);
      setDeal(dealResponse.data);
      
      // Load company data
      const companyResponse = await companiesAPI.get(dealResponse.data.company_id);
      setCompany(companyResponse.data);
    } catch (err) {
      setError('Error al cargar el deal');
    } finally {
      setLoading(false);
    }
  };

  const activateDeal = async () => {
    setActionLoading(true);
    setError('');
    try {
      await dealsAPI.activate(dealId);
      await loadDeal();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al activar el deal');
    } finally {
      setActionLoading(false);
    }
  };

  const approveAccess = async (buyerId) => {
    setActionLoading(true);
    try {
      await dealsAPI.approveAccess(dealId, buyerId);
      await loadDeal();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al aprobar acceso');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusConfig = {
      draft: 'bg-slate-100 text-slate-700',
      published: 'bg-blue-100 text-blue-700',
      nda: 'bg-yellow-100 text-yellow-700',
      evaluation: 'bg-purple-100 text-purple-700',
      intent: 'bg-orange-100 text-orange-700',
      shortlist: 'bg-pink-100 text-pink-700',
      exclusivity: 'bg-indigo-100 text-indigo-700',
      due_diligence: 'bg-cyan-100 text-cyan-700',
      closed: 'bg-green-100 text-green-700',
      dropped: 'bg-red-100 text-red-700',
    };
    return statusConfig[status] || 'bg-slate-100 text-slate-700';
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Borrador',
      published: 'Publicado',
      nda: 'En proceso NDA',
      evaluation: 'En evaluación',
      intent: 'Recibiendo intents',
      shortlist: 'Shortlist',
      exclusivity: 'Exclusividad',
      due_diligence: 'Due Diligence',
      closed: 'Cerrado',
      dropped: 'Cancelado',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-arroba-coral" />
        </div>
      </Layout>
    );
  }

  if (!deal) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-500">Deal no encontrado</p>
          <Link to="/seller/dashboard">
            <Button className="mt-4">Volver al dashboard</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const currentStatusIndex = getStatusIndex(deal.status);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8" data-testid="deal-management">
        {/* Header */}
        <div className="mb-6">
          <Link to="/seller/dashboard" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2">
            <ArrowLeft className="w-4 h-4" />
            Volver al dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {company?.trade_name || company?.legal_name}
              </h1>
              <p className="text-slate-500">{company?.acronym} · {deal.deal_id}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(deal.status)}`}>
                {getStatusLabel(deal.status)}
              </span>
              {deal.status === 'draft' && (
                <Button
                  onClick={activateDeal}
                  disabled={actionLoading}
                  className="bg-arroba-coral hover:bg-arroba-coral/90 text-white"
                  data-testid="activate-deal-btn"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  PUBLICAR DEAL
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Status Flow */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6" data-testid="status-flow">
          <h3 className="text-sm font-semibold text-slate-500 mb-4">PROGRESO DEL DEAL</h3>
          <div className="flex items-center overflow-x-auto pb-2">
            {statusFlow.map((status, idx) => (
              <React.Fragment key={status.id}>
                <div className={`flex flex-col items-center min-w-[80px] ${idx <= currentStatusIndex ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    idx < currentStatusIndex ? 'bg-arroba-green text-white' :
                    idx === currentStatusIndex ? 'bg-arroba-coral text-white' :
                    'bg-slate-200 text-slate-400'
                  }`}>
                    {idx < currentStatusIndex ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                  </div>
                  <span className="text-xs mt-1 text-center">{status.label}</span>
                </div>
                {idx < statusFlow.length - 1 && (
                  <div className={`flex-1 h-0.5 min-w-[20px] ${
                    idx < currentStatusIndex ? 'bg-arroba-green' : 'bg-slate-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 mb-6">
          <div className="flex gap-6">
            {[
              { id: 'overview', label: 'Resumen' },
              { id: 'buyers', label: `Compradores (${deal.metrics?.access_requests_count || 0})` },
              { id: 'ndas', label: `NDAs (${deal.metrics?.ndas_signed_count || 0})` },
              { id: 'lois', label: `LOIs (${deal.metrics?.lois_received_count || 0})` },
              { id: 'infomemo', label: 'Infomemo' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-arroba-coral text-arroba-coral'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6" data-testid="tab-content-overview">
                {/* Metrics */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
                    <Eye className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{deal.metrics?.teaser_views || 0}</p>
                    <p className="text-xs text-slate-500">Vistas</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
                    <Users className="w-6 h-6 text-arroba-blue mx-auto mb-2" />
                    <p className="text-2xl font-bold">{deal.metrics?.access_requests_count || 0}</p>
                    <p className="text-xs text-slate-500">Solicitudes</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
                    <FileSignature className="w-6 h-6 text-arroba-yellow mx-auto mb-2" />
                    <p className="text-2xl font-bold">{deal.metrics?.ndas_signed_count || 0}</p>
                    <p className="text-xs text-slate-500">NDAs</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
                    <FileText className="w-6 h-6 text-arroba-green mx-auto mb-2" />
                    <p className="text-2xl font-bold">{deal.metrics?.lois_received_count || 0}</p>
                    <p className="text-xs text-slate-500">LOIs</p>
                  </div>
                </div>

                {/* Teaser Preview */}
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <h3 className="font-semibold mb-4">Vista previa del Teaser</h3>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500 mb-1">{deal.teaser?.sector_display}</p>
                    <h4 className="font-bold text-lg mb-2">{deal.teaser?.headline}</h4>
                    <p className="text-sm text-slate-600 mb-4">{deal.teaser?.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Facturación:</span>
                        <span className="font-semibold ml-2">{deal.teaser?.revenue_display}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">EBITDA:</span>
                        <span className="font-semibold ml-2">{deal.teaser?.ebitda_display}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Ubicación:</span>
                        <span className="font-semibold ml-2">{deal.teaser?.geography_display}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Fundación:</span>
                        <span className="font-semibold ml-2">{deal.teaser?.year_founded}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Readiness Checklist */}
                {deal.status === 'draft' && deal.readiness_checklist?.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <h3 className="font-semibold mb-4">
                      Checklist de publicación ({deal.readiness_score?.toFixed(0)}%)
                    </h3>
                    <div className="space-y-3">
                      {deal.readiness_checklist.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          {item.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-arroba-green" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
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
            )}

            {activeTab === 'buyers' && (
              <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="tab-content-buyers">
                <h3 className="font-semibold mb-4">Solicitudes de acceso</h3>
                {deal.access_requests?.length > 0 ? (
                  <div className="space-y-4">
                    {deal.access_requests.map((request, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium">Comprador #{idx + 1}</p>
                          <p className="text-sm text-slate-500">
                            Solicitado: {new Date(request.requested_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            request.status === 'approved' ? 'bg-green-100 text-green-700' :
                            request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {request.status === 'approved' ? 'Aprobado' :
                             request.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                          </span>
                          {request.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => approveAccess(request.buyer_id)}
                              disabled={actionLoading}
                              className="bg-arroba-green hover:bg-arroba-green/90 text-white"
                            >
                              Aprobar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p>Aún no hay solicitudes de acceso</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ndas' && (
              <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="tab-content-ndas">
                <h3 className="font-semibold mb-4">NDAs firmados</h3>
                {deal.ndas_signed?.length > 0 ? (
                  <div className="space-y-4">
                    {deal.ndas_signed.map((nda, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-arroba-green" />
                          <div>
                            <p className="font-medium">Comprador verificado</p>
                            <p className="text-sm text-slate-500">
                              Firmado: {new Date(nda.signed_at).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Ver perfil
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <FileSignature className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p>Aún no hay NDAs firmados</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'lois' && (
              <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="tab-content-lois">
                <h3 className="font-semibold mb-4">Letters of Intent recibidas</h3>
                {deal.lois?.length > 0 ? (
                  <div className="space-y-4">
                    {deal.lois.map((loi, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">LOI #{idx + 1}</span>
                          <span className="text-arroba-coral font-bold">
                            Oferta pendiente
                          </span>
                        </div>
                        <Button variant="outline" size="sm">
                          Ver detalle
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p>Aún no hay LOIs recibidas</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'infomemo' && (
              <div className="bg-white border border-slate-200 rounded-lg p-6" data-testid="tab-content-infomemo">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Information Memorandum</h3>
                  {deal.infomemo && (
                    <div className="flex gap-2">
                      <Link to={`/seller/company/${company?.company_id}?step=4`}>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
                
                {deal.infomemo?.content ? (
                  <div className="prose prose-sm max-w-none bg-slate-50 rounded-lg p-6" data-testid="infomemo-rendered">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{deal.infomemo.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 mb-4">Infomemo no generado</p>
                    <Link to={`/seller/company/${company?.company_id}?step=4`}>
                      <Button className="bg-arroba-coral hover:bg-arroba-coral/90 text-white">
                        Generar Infomemo
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Teaser Preview in Deal Management */}
                {deal.teaser_full && (
                  <div className="mt-6 border-t pt-6">
                    <h3 className="font-semibold mb-4">Teaser (Público)</h3>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-bold">{deal.teaser_full.title}</h4>
                      <p className="text-sm text-slate-600 mt-1">{deal.teaser_full.short_description}</p>
                      <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                        <div><span className="text-slate-400">Facturación:</span> <strong>{deal.teaser_full.revenue_range}</strong></div>
                        <div><span className="text-slate-400">EBITDA:</span> <strong>{deal.teaser_full.ebitda_range}</strong></div>
                        <div><span className="text-slate-400">Ubicación:</span> <strong>{deal.teaser_full.location}</strong></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Deal Info */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="font-semibold mb-4">Información del Deal</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Precio solicitado</span>
                  <span className="font-semibold">
                    {deal.asking_price ? `${(deal.asking_price / 1000000).toFixed(1)}M €` : 'Negociable'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tipo operación</span>
                  <span className="font-semibold">
                    {deal.operation_types_allowed?.includes('full_sale') ? 'Venta total' : 'Parcial/Fusión'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Creado</span>
                  <span>{new Date(deal.created_at).toLocaleDateString('es-ES')}</span>
                </div>
                {deal.published_at && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Publicado</span>
                    <span>{new Date(deal.published_at).toLocaleDateString('es-ES')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Valuation */}
            {company?.valuation && (
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Valoración</h3>
                <div className="text-center p-4 bg-arroba-coral/5 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-arroba-coral mx-auto mb-2" />
                  <p className="text-xl font-bold text-arroba-coral">
                    {(company.valuation.valuation_min / 1000000).toFixed(1)}M - {(company.valuation.valuation_max / 1000000).toFixed(1)}M €
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Múltiplo: {company.valuation.multiple_min?.toFixed(1)}x - {company.valuation.multiple_max?.toFixed(1)}x
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="font-semibold mb-4">Acciones</h3>
              <div className="space-y-2">
                <Link to={`/seller/company/${company?.company_id}`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <ChevronRight className="w-4 h-4 mr-2" />
                    Editar compañía
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Cancelar deal
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DealManagement;
