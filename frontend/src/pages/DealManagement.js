import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { dealsAPI, companiesAPI, engagementsAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DataRoomSellerTab from '../components/DataRoomSellerTab';
import LoiDetailedView from '../components/LoiDetailedView';
import { 
  ArrowLeft, Eye, Users, FileSignature, FileText, CheckCircle2,
  AlertCircle, Shield, TrendingUp, Loader2, ChevronRight, Star, X, Lock, FolderOpen
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

const stageColors = {
  SUBMITTED: 'bg-blue-100 text-blue-700',
  VIEWED: 'bg-yellow-100 text-yellow-700',
  SHORTLISTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  EXCLUSIVITY: 'bg-indigo-100 text-indigo-700',
};
const stageLabels = {
  SUBMITTED: 'Enviado', VIEWED: 'Visto', SHORTLISTED: 'Shortlist',
  REJECTED: 'Rechazado', EXCLUSIVITY: 'Exclusividad',
};
const opLabels = { full_sale: 'Compra total', partial_sale: 'Parcial', merger: 'Fusión' };
const structLabels = { cash: 'Cash', earn_out: 'Earn-out', mixed: 'Mixto' };

const ComparatorTab = ({ deal, onRefresh }) => {
  const [engData, setEngData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [sortField, setSortField] = useState('created_at');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await engagementsAPI.listDealEngagements(deal.deal_id);
        setEngData(res.data);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, [deal.deal_id]);

  const handleShortlist = async (buyerId) => {
    setActionLoading(buyerId);
    try {
      await engagementsAPI.shortlistBuyer(deal.deal_id, buyerId);
      const res = await engagementsAPI.listDealEngagements(deal.deal_id);
      setEngData(res.data);
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
    finally { setActionLoading(''); }
  };

  const handleRemoveShortlist = async (buyerId) => {
    setActionLoading(buyerId);
    try {
      await engagementsAPI.removeFromShortlist(deal.deal_id, buyerId);
      const res = await engagementsAPI.listDealEngagements(deal.deal_id);
      setEngData(res.data);
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
    finally { setActionLoading(''); }
  };

  const handleReject = async (buyerId) => {
    if (!window.confirm('¿Rechazar este comprador?')) return;
    setActionLoading(buyerId);
    try {
      await engagementsAPI.rejectBuyer(deal.deal_id, buyerId);
      const res = await engagementsAPI.listDealEngagements(deal.deal_id);
      setEngData(res.data);
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
    finally { setActionLoading(''); }
  };

  const handleExclusivity = async (buyerId) => {
    if (!window.confirm('¿Otorgar exclusividad a este comprador? Esto bloqueará nuevos intereses y LOIs.')) return;
    setActionLoading(buyerId);
    try {
      await engagementsAPI.grantExclusivity(deal.deal_id, buyerId);
      const res = await engagementsAPI.listDealEngagements(deal.deal_id);
      setEngData(res.data);
      if (onRefresh) onRefresh();
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
    finally { setActionLoading(''); }
  };

  if (loading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  const engagements = engData?.engagements || [];
  const shortlistedIds = engData?.shortlisted_buyer_ids || [];
  const exclusiveBuyer = engData?.exclusive_buyer_id;

  const sorted = [...engagements].sort((a, b) => {
    if (sortField === 'valuation') {
      const aVal = a.valuation_offer || a.valuation_range_max || 0;
      const bVal = b.valuation_offer || b.valuation_range_max || 0;
      return bVal - aVal;
    }
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <div className="space-y-4" data-testid="comparator-tab">
      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-sm">
          <span className="bg-blue-50 px-3 py-1 rounded-full text-blue-700 font-medium">
            {engData?.total_interests || 0} Intereses
          </span>
          <span className="bg-arroba-coral/10 px-3 py-1 rounded-full text-arroba-coral font-medium">
            {engData?.total_lois || 0} LOIs
          </span>
          <span className="bg-green-50 px-3 py-1 rounded-full text-green-700 font-medium">
            {shortlistedIds.length}/3 Shortlist
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setSortField('created_at')}
            className={sortField === 'created_at' ? 'bg-slate-100' : ''}>Fecha</Button>
          <Button variant="outline" size="sm" onClick={() => setSortField('valuation')}
            className={sortField === 'valuation' ? 'bg-slate-100' : ''}>Valoración</Button>
        </div>
      </div>

      {exclusiveBuyer && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-2 text-indigo-700 text-sm">
          <Lock className="w-4 h-4" /> Deal en exclusividad — No se admiten nuevos intereses
        </div>
      )}

      {engagements.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Aún no hay intereses ni LOIs</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="comparator-table">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Buyer</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Rango / Oferta</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Operación</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Fecha</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(eng => {
                  const isShortlisted = shortlistedIds.includes(eng.buyer_id);
                  const isExclusive = exclusiveBuyer === eng.buyer_id;
                  return (
                    <tr key={eng.engagement_id} className={`border-b last:border-0 hover:bg-slate-50 ${isExclusive ? 'bg-indigo-50/50' : isShortlisted ? 'bg-green-50/50' : ''}`}
                      data-testid={`comparator-row-${eng.engagement_id}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isShortlisted && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                          <div>
                            <p className="font-medium">{eng.buyer_name || 'Comprador'}</p>
                            <p className="text-xs text-slate-400 capitalize">{eng.buyer_type || 'other'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${stageColors[eng.stage] || 'bg-slate-100'}`}>
                            {stageLabels[eng.stage] || eng.stage}
                          </span>
                          <span className="text-xs text-slate-400">{eng.type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {eng.type === 'LOI' && eng.valuation_offer ? (
                          <div>
                            <p className="font-bold text-arroba-coral">{(eng.valuation_offer / 1e6).toFixed(1)}M €</p>
                            <p className="text-xs text-slate-400">{structLabels[eng.structure] || eng.structure} · {eng.acquisition_percentage}%</p>
                            {eng.is_binding && <span className="text-xs font-bold text-red-600">Vinculante</span>}
                          </div>
                        ) : (
                          <div>
                            {eng.valuation_range_min ? (
                              <p className="font-medium">{(eng.valuation_range_min / 1e6).toFixed(1)}M - {(eng.valuation_range_max / 1e6).toFixed(1)}M €</p>
                            ) : (
                              <p className="text-slate-400">Sin rango</p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{opLabels[eng.operation_type] || eng.operation_type}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{new Date(eng.created_at).toLocaleDateString('es-ES')}</td>
                      <td className="px-4 py-3">
                        {eng.stage !== 'REJECTED' && eng.stage !== 'EXCLUSIVITY' && (
                          <div className="flex gap-1">
                            {!isShortlisted ? (
                              <Button variant="outline" size="sm" onClick={() => handleShortlist(eng.buyer_id)}
                                disabled={actionLoading === eng.buyer_id || shortlistedIds.length >= 3}
                                data-testid={`shortlist-btn-${eng.engagement_id}`}>
                                {actionLoading === eng.buyer_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3" />}
                              </Button>
                            ) : (
                              <>
                                <Button variant="outline" size="sm" onClick={() => handleRemoveShortlist(eng.buyer_id)}
                                  disabled={actionLoading === eng.buyer_id} className="text-yellow-600"
                                  data-testid={`unshortlist-btn-${eng.engagement_id}`}>
                                  <Star className="w-3 h-3 fill-yellow-500" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleExclusivity(eng.buyer_id)}
                                  disabled={actionLoading === eng.buyer_id} className="text-indigo-600"
                                  data-testid={`exclusivity-btn-${eng.engagement_id}`}>
                                  <Lock className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                            <Button variant="outline" size="sm" onClick={() => handleReject(eng.buyer_id)}
                              disabled={actionLoading === eng.buyer_id} className="text-red-500"
                              data-testid={`reject-btn-${eng.engagement_id}`}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        {eng.stage === 'EXCLUSIVITY' && (
                          <span className="text-xs text-indigo-600 font-bold flex items-center gap-1"><Lock className="w-3 h-3" /> Exclusivo</span>
                        )}
                        {eng.stage === 'REJECTED' && (
                          <span className="text-xs text-red-500">Rechazado</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

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
              { id: 'comparator', label: 'Interesados' },
              { id: 'loi-detail', label: 'LOIs' },
              { id: 'dataroom', label: 'Data Room' },
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

            {activeTab === 'comparator' && (
              <ComparatorTab deal={deal} onRefresh={loadDeal} />
            )}

            {activeTab === 'dataroom' && (
              <DataRoomSellerTab deal={deal} />
            )}

            {activeTab === 'loi-detail' && (
              <LoiDetailedView deal={deal} />
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
