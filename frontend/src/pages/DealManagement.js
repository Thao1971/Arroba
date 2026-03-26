import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { dealsAPI, companiesAPI, engagementsAPI, coachingAPI, conversationsAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DataRoomSellerTab from '../components/DataRoomSellerTab';
import LoiDetailedView from '../components/LoiDetailedView';
import { 
  ArrowLeft, Eye, Users, FileSignature, FileText, CheckCircle2,
  AlertCircle, Shield, TrendingUp, Loader2, ChevronRight, Star, X, Lock, FolderOpen,
  AlertTriangle, Info, MessageSquare
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
  ACCEPTED: 'bg-teal-100 text-teal-700',
  SHORTLISTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  EXCLUSIVITY: 'bg-indigo-100 text-indigo-700',
};
const stageLabels = {
  SUBMITTED: 'Enviado', VIEWED: 'Visto', ACCEPTED: 'Aceptado', SHORTLISTED: 'Shortlist',
  REJECTED: 'Rechazado', EXCLUSIVITY: 'Exclusividad',
};
const opLabels = { full_sale: 'Compra total', partial_sale: 'Parcial', merger: 'Fusión' };
const structLabels = { cash: 'Cash', earn_out: 'Earn-out', mixed: 'Mixto' };

const ComparatorTab = ({ deal, onRefresh }) => {
  const [engData, setEngData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [exclWarning, setExclWarning] = useState(null);
  const [exclConfirmText, setExclConfirmText] = useState('');
  const [nudges, setNudges] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [engRes, nudgeRes] = await Promise.all([
          engagementsAPI.listDealEngagements(deal.deal_id),
          coachingAPI.getDealNudges(deal.deal_id),
        ]);
        setEngData(engRes.data);
        setNudges(nudgeRes.data?.nudges || []);
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

  const handleAccept = async (buyerId) => {
    setActionLoading(buyerId);
    try {
      await engagementsAPI.acceptInterest(deal.deal_id, buyerId);
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
    // Coaching check — fetch warning data before confirming
    setActionLoading(buyerId);
    try {
      const checkRes = await coachingAPI.exclusivityCheck(deal.deal_id, buyerId);
      const data = checkRes.data;
      if (!data.ready) {
        // Show detailed warning
        setExclWarning({ ...data, buyerId });
        setActionLoading('');
        return;
      }
      // Ready — still confirm
      setExclWarning({ ...data, buyerId, confirmDirect: true });
      setActionLoading('');
    } catch {
      // Fallback to simple confirm
      if (!window.confirm('¿Otorgar exclusividad a este comprador?')) { setActionLoading(''); return; }
      await doExclusivity(buyerId);
    }
  };

  const doExclusivity = async (buyerId) => {
    setActionLoading(buyerId);
    try {
      await engagementsAPI.grantExclusivity(deal.deal_id, buyerId);
      const res = await engagementsAPI.listDealEngagements(deal.deal_id);
      setEngData(res.data);
      setExclWarning(null);
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
      {/* Exclusivity Warning Dialog */}
      {exclWarning && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" data-testid="exclusivity-warning-dialog">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
            <div className={`px-6 py-4 ${exclWarning.ready ? 'bg-green-50 border-b border-green-200' : 'bg-red-50 border-b border-red-200'}`}>
              <div className="flex items-center gap-3">
                {exclWarning.ready
                  ? <CheckCircle2 className="w-6 h-6 text-green-600" />
                  : <AlertTriangle className="w-6 h-6 text-red-600" />
                }
                <h3 className="font-bold text-lg">
                  {exclWarning.ready ? 'Confirmar exclusividad' : 'Exclusividad prematura — riesgo alto'}
                </h3>
              </div>
            </div>
            <div className="px-6 py-4 space-y-4">
              <p className="text-slate-700 font-medium">{exclWarning.message}</p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className={`p-3 rounded-lg border ${exclWarning.criteria?.has_loi ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <p className="font-medium">{exclWarning.criteria?.has_loi ? 'LOI enviada' : 'Sin LOI'}</p>
                  {exclWarning.metrics?.valuation_offer && <p className="text-xs text-slate-500">{(exclWarning.metrics.valuation_offer / 1e6).toFixed(1)}M EUR</p>}
                </div>
                <div className={`p-3 rounded-lg border ${exclWarning.criteria?.score_ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <p className="font-medium">Intent: {exclWarning.metrics?.intent_score}/100</p>
                  <p className="text-xs text-slate-500">{exclWarning.criteria?.score_ok ? 'Intencion alta' : 'Intencion insuficiente'}</p>
                </div>
                <div className={`p-3 rounded-lg border ${exclWarning.criteria?.downloads_ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <p className="font-medium">{exclWarning.metrics?.dr_downloads} descargas DR</p>
                  <p className="text-xs text-slate-500">{exclWarning.criteria?.downloads_ok ? 'Ha revisado docs' : 'No ha hecho DD'}</p>
                </div>
                <div className={`p-3 rounded-lg border ${exclWarning.criteria?.time_ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <p className="font-medium">{exclWarning.metrics?.total_minutes} min invertidos</p>
                  <p className="text-xs text-slate-500">{exclWarning.criteria?.time_ok ? 'Dedicacion suficiente' : 'Menos de 10 min'}</p>
                </div>
              </div>

              {/* Recommendation */}
              {exclWarning.recommendation && (
                <div className={`rounded-lg p-4 border ${exclWarning.ready ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <p className={`text-sm font-medium ${exclWarning.ready ? 'text-green-800' : 'text-red-800'}`}>{exclWarning.recommendation}</p>
                </div>
              )}

              {/* Friction: type CONFIRMO to proceed when not ready */}
              {exclWarning.requires_confirmation && (
                <div className="bg-slate-100 rounded-lg p-4 border border-slate-300">
                  <p className="text-sm font-bold text-slate-800 mb-2">Para continuar, escribe CONFIRMO:</p>
                  <input
                    type="text"
                    value={exclConfirmText}
                    onChange={(e) => setExclConfirmText(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-300 focus:border-red-400"
                    placeholder="Escribe CONFIRMO"
                    data-testid="excl-confirm-input"
                  />
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { setExclWarning(null); setExclConfirmText(''); }} data-testid="excl-warning-cancel">
                Cancelar
              </Button>
              <Button
                onClick={() => doExclusivity(exclWarning.buyerId)}
                disabled={exclWarning.requires_confirmation && exclConfirmText !== 'CONFIRMO'}
                className={!exclWarning.ready ? 'bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:text-slate-500' : ''}
                data-testid="excl-warning-confirm"
              >
                {!exclWarning.ready ? 'Otorgar bajo mi responsabilidad' : 'Confirmar exclusividad'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Prescriptive Nudges */}
      {nudges.length > 0 && (
        <div className="space-y-3" data-testid="deal-nudges">
          {nudges.map((nudge, i) => (
            <div key={nudge.id + i} className={`rounded-lg border overflow-hidden ${
              nudge.priority === 'ALTA' ? 'bg-red-50 border-red-200' :
              nudge.priority === 'MEDIA' ? 'bg-amber-50 border-amber-200' :
              'bg-blue-50 border-blue-200'
            }`} data-testid={`nudge-${nudge.id}`}>
              <div className="flex items-start gap-3 p-4">
                {nudge.priority === 'ALTA'
                  ? <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                  : nudge.priority === 'MEDIA'
                    ? <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                    : <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-slate-900">{nudge.title}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      nudge.priority === 'ALTA' ? 'bg-red-200 text-red-800' :
                      nudge.priority === 'MEDIA' ? 'bg-amber-200 text-amber-800' :
                      'bg-blue-200 text-blue-800'
                    }`}>{nudge.priority}</span>
                  </div>
                  <p className="text-sm text-slate-700">{nudge.message}</p>
                  {nudge.prescription && (
                    <p className="text-sm text-slate-900 font-medium mt-2 bg-white/60 rounded p-2 border border-slate-200">{nudge.prescription}</p>
                  )}
                </div>
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

      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-sm">
          <span className="bg-blue-50 px-3 py-1 rounded-full text-blue-700 font-medium">
            {engData?.total_interests || 0} Intereses
          </span>
          <span className="bg-arroba-coral/10 px-3 py-1 rounded-full text-arroba-coral font-medium">
            {(engData?.total_lois || 0) === 1 ? 'LOI recibida' : 'LOIs recibidas'}
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
                          <div className="flex gap-1 items-center">
                            {/* Accept button — for SUBMITTED/VIEWED */}
                            {(eng.stage === 'SUBMITTED' || eng.stage === 'VIEWED') && (
                              <Button variant="outline" size="sm" onClick={() => handleAccept(eng.buyer_id)}
                                disabled={actionLoading === eng.buyer_id}
                                className="text-teal-600 border-teal-200 hover:bg-teal-50"
                                data-testid={`accept-btn-${eng.engagement_id}`}>
                                {actionLoading === eng.buyer_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                <span className="ml-1 text-[11px]">Aceptar</span>
                              </Button>
                            )}
                            {/* Shortlist button — for ACCEPTED */}
                            {eng.stage === 'ACCEPTED' && !isShortlisted && (
                              <Button variant="outline" size="sm" onClick={() => handleShortlist(eng.buyer_id)}
                                disabled={actionLoading === eng.buyer_id || shortlistedIds.length >= 3}
                                data-testid={`shortlist-btn-${eng.engagement_id}`}>
                                {actionLoading === eng.buyer_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3" />}
                              </Button>
                            )}
                            {/* Shortlisted actions */}
                            {isShortlisted && (
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
                            {/* Q&A link — for ACCEPTED+ with conversation */}
                            {eng.conversation_id && (
                              <Link to={`/qa/${eng.conversation_id}`}
                                className="inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-semibold hover:opacity-80"
                                style={{ background: eng.pending_questions > 0 ? (eng.pending_urgency === 'alta' ? 'rgba(220,38,38,0.08)' : 'rgba(217,119,6,0.08)') : 'rgba(0,100,147,0.08)', color: eng.pending_questions > 0 ? (eng.pending_urgency === 'alta' ? '#dc2626' : '#d97706') : '#004b74' }}
                                data-testid={`qa-link-${eng.engagement_id}`}>
                                <MessageSquare size={10} />
                                {eng.pending_questions > 0 ? `${eng.pending_questions} pendiente${eng.pending_questions !== 1 ? 's' : ''}` : 'Q&A'}
                              </Link>
                            )}
                            {/* Reject */}
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

const QaTab = ({ dealId }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await conversationsAPI.getForDeal(dealId);
        setConversations(res.data.conversations || []);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, [dealId]);

  if (loading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  if (conversations.length === 0) {
    return (
      <div className="text-center py-16" style={{ background: 'var(--surface-1, #f3f3f3)' }} data-testid="qa-tab-empty">
        <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-300" />
        <p className="font-semibold text-slate-500">No hay conversaciones Q&A</p>
        <p className="text-sm text-slate-400 mt-1">Las conversaciones se crean al aceptar un interes</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="qa-tab">
      <p className="text-sm text-slate-500 mb-4">{conversations.length} conversacion{conversations.length !== 1 ? 'es' : ''} activa{conversations.length !== 1 ? 's' : ''}</p>
      {conversations.map((conv) => (
        <Link key={conv.conversation_id} to={`/qa/${conv.conversation_id}`}
          className="block p-4 hover:opacity-90 transition-opacity group"
          style={{ background: 'var(--surface-lowest, #fff)', boxShadow: '0 2px 8px rgba(25,28,30,0.03)' }}
          data-testid={`qa-conv-${conv.conversation_id}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 flex items-center justify-center" style={{ background: 'rgba(0,100,147,0.08)' }}>
                <MessageSquare size={14} style={{ color: '#004b74' }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-arroba-coral transition-colors">
                  {conv.buyer_name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-slate-400">
                    {conv.stats?.questions || 0} preguntas
                  </span>
                  {(conv.stats?.pending || 0) > 0 && (
                    <span className="text-[11px] font-semibold text-amber-600">
                      {conv.stats.pending} pendiente{conv.stats.pending !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] px-2 py-0.5 font-semibold uppercase"
                style={{
                  background: conv.status === 'OPEN' ? 'rgba(130,195,89,0.1)' : 'var(--surface-2, #e2e2e2)',
                  color: conv.status === 'OPEN' ? '#4d7a2e' : '#666'
                }}>
                {conv.status === 'OPEN' ? 'ACTIVA' : 'CERRADA'}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-arroba-coral transition-colors" />
            </div>
          </div>
        </Link>
      ))}
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
  const [totalPendingQA, setTotalPendingQA] = useState(0);
  const [readiness, setReadiness] = useState(null);
  const [showPublishWarning, setShowPublishWarning] = useState(false);
  const [health, setHealth] = useState(null);

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
      
      // Load pending Q&A count for badge
      try {
        const engRes = await engagementsAPI.listDealEngagements(dealId);
        const pending = (engRes.data?.engagements || []).reduce((acc, e) => acc + (e.pending_questions || 0), 0);
        setTotalPendingQA(pending);
      } catch {}

      // Load readiness + health
      try {
        const [readinessRes, healthRes] = await Promise.all([
          dealsAPI.readiness(dealId),
          dealsAPI.health(dealId),
        ]);
        setReadiness(readinessRes.data);
        setHealth(healthRes.data);
      } catch {}
    } catch (err) {
      setError('Error al cargar el deal');
    } finally {
      setLoading(false);
    }
  };

  const activateDeal = async (force = false) => {
    setActionLoading(true);
    setError('');
    try {
      const res = await dealsAPI.activate(dealId, force);
      // Check if backend returned a warning (confirm_required)
      if (res.data?.action === 'confirm_required') {
        setReadiness(res.data.readiness);
        setShowPublishWarning(true);
        setActionLoading(false);
        return;
      }
      setShowPublishWarning(false);
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
              {health && health.health !== 'INACTIVO' && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase ${
                  health.health === 'VERDE' ? 'bg-green-100 text-green-700' :
                  health.health === 'AMARILLO' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`} data-testid="health-indicator">
                  <span className={`w-2 h-2 rounded-full ${
                    health.health === 'VERDE' ? 'bg-green-500' :
                    health.health === 'AMARILLO' ? 'bg-amber-500' :
                    'bg-red-500'
                  }`} />
                  {health.health === 'VERDE' ? 'SANO' : health.health}
                  {health.counts?.total > 0 && ` · ${health.counts.total}`}
                </span>
              )}
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
              { id: 'qa', label: 'Q&A', badge: totalPendingQA },
              { id: 'dataroom', label: 'Data Room' },
              { id: 'infomemo', label: 'Infomemo' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'border-arroba-coral text-arroba-coral'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                {tab.label}
                {tab.badge > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-red-500 text-white" data-testid="qa-tab-badge">
                    {tab.badge}
                  </span>
                )}
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
                      <p className="text-2xl font-bold">{(deal.metrics?.lois_received_count || 0) === 1 ? 'LOI recibida' : 'LOIs recibidas'}</p>
                    <p className="text-xs text-slate-500"></p>
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

                {/* Readiness Widget */}
                {readiness && (
                  <div style={{ background: 'var(--surface-lowest, #fff)', boxShadow: '0 2px 8px rgba(25,28,30,0.03)' }}
                    className="p-6" data-testid="readiness-widget">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="label-arroba mb-1" style={{ color: 'var(--arroba-primary)' }}>READINESS</p>
                        <div className="flex items-center gap-3">
                          <span className="text-3xl font-extrabold" style={{ color: 'var(--on-surface)' }}>{readiness.score}%</span>
                          <span className={`px-2 py-0.5 text-[11px] font-bold uppercase ${
                            readiness.status === 'LISTO' ? 'bg-green-100 text-green-700' :
                            readiness.status === 'MEJORABLE' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`} data-testid="readiness-status">{readiness.status}</span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="w-32">
                        <div className="h-2 w-full" style={{ background: 'var(--surface-2, #e2e2e2)' }}>
                          <div className={`h-full transition-all ${
                            readiness.score >= 90 ? 'bg-green-500' :
                            readiness.score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                          }`} style={{ width: `${readiness.score}%` }} />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-slate-400">Obligatorio: {readiness.obligatory?.pct}%</span>
                          <span className="text-[10px] text-slate-400">Recomendado: {readiness.recommended?.pct}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Obligatory checklist */}
                    <div className="mb-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        OBLIGATORIOS ({readiness.obligatory?.completed}/{readiness.obligatory?.total})
                      </p>
                      <div className="space-y-1.5">
                        {readiness.obligatory?.items?.map((item) => (
                          <div key={item.id} className="flex items-center justify-between py-1.5 px-2"
                            style={{ background: item.completed ? 'transparent' : 'rgba(220,38,38,0.03)' }}
                            data-testid={`readiness-item-${item.id}`}>
                            <div className="flex items-center gap-2">
                              {item.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                              )}
                              <span className={`text-sm ${item.completed ? 'text-slate-600' : 'text-slate-900 font-medium'}`}>
                                {item.label}
                              </span>
                            </div>
                            {!item.completed && (
                              <button
                                onClick={() => {
                                  if (item.href === 'company') navigate(`/seller/company/${deal.company_id}`);
                                  else if (item.href === 'dataroom') setActiveTab('dataroom');
                                  else if (item.href === 'infomemo') setActiveTab('infomemo');
                                  else if (item.href === 'teaser') setActiveTab('overview');
                                  else if (item.href === 'deal_edit') setActiveTab('overview');
                                }}
                                className="text-[11px] font-semibold uppercase px-2 py-0.5"
                                style={{ color: 'var(--arroba-primary)', background: 'rgba(182,33,42,0.06)' }}
                                data-testid={`cta-${item.id}`}
                              >
                                {item.cta}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommended checklist */}
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        RECOMENDADOS ({readiness.recommended?.completed}/{readiness.recommended?.total})
                      </p>
                      <div className="space-y-1.5">
                        {readiness.recommended?.items?.map((item) => (
                          <div key={item.id} className="flex items-center justify-between py-1.5 px-2"
                            data-testid={`readiness-item-${item.id}`}>
                            <div className="flex items-center gap-2">
                              {item.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0" />
                              )}
                              <span className={`text-sm ${item.completed ? 'text-slate-500' : 'text-slate-600'}`}>
                                {item.label}
                              </span>
                              {item.detail && (
                                <span className="text-[11px] text-slate-400 ml-1">({item.detail})</span>
                              )}
                            </div>
                            {!item.completed && (
                              <button
                                onClick={() => {
                                  if (item.href === 'company') navigate(`/seller/company/${deal.company_id}`);
                                  else if (item.href === 'dataroom') setActiveTab('dataroom');
                                  else setActiveTab('overview');
                                }}
                                className="text-[11px] font-semibold uppercase px-2 py-0.5 text-slate-500"
                                style={{ background: 'var(--surface-1, #f3f3f3)' }}
                              >
                                {item.cta}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Deal Health Alerts */}
                {health && health.alerts && health.alerts.length > 0 && (
                  <div data-testid="health-alerts">
                    <div className="flex items-center justify-between mb-3">
                      <p className="label-arroba" style={{ color: health.color === 'red' ? '#dc2626' : health.color === 'amber' ? '#d97706' : '#16a34a' }}>
                        SALUD DEL DEAL
                      </p>
                      <span className="text-sm text-slate-500">{health.summary}</span>
                    </div>
                    <div className="space-y-3">
                      {health.alerts.map((alert, i) => (
                        <div key={alert.id || i} className="p-4"
                          style={{
                            background: 'var(--surface-lowest, #fff)',
                            boxShadow: '0 1px 4px rgba(25,28,30,0.03)',
                            borderLeft: `3px solid ${alert.severity === 'ALTA' ? '#dc2626' : alert.severity === 'MEDIA' ? '#d97706' : '#94a3b8'}`,
                          }}
                          data-testid={`health-alert-${i}`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-6 h-6 flex items-center justify-center shrink-0 mt-0.5 ${
                              alert.severity === 'ALTA' ? 'text-red-500' :
                              alert.severity === 'MEDIA' ? 'text-amber-500' : 'text-slate-400'
                            }`}>
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 ${
                                  alert.severity === 'ALTA' ? 'bg-red-100 text-red-600' :
                                  alert.severity === 'MEDIA' ? 'bg-amber-100 text-amber-600' :
                                  'bg-slate-100 text-slate-500'
                                }`}>{alert.category}</span>
                                <span className="text-[10px] text-slate-400 uppercase">{alert.severity}</span>
                              </div>
                              <p className="text-sm font-semibold text-slate-900 mb-1">{alert.problem}</p>
                              {alert.cause && (
                                <p className="text-xs text-slate-500 mb-2">{alert.cause}</p>
                              )}
                              <p className="text-xs text-slate-700 leading-relaxed">{alert.action}</p>
                              {alert.actions && alert.actions.length > 0 && (
                                <div className="flex gap-2 mt-3">
                                  {alert.actions.map((a, j) => (
                                    <button key={j}
                                      className="text-[11px] font-semibold uppercase px-2.5 py-1"
                                      style={{ background: 'rgba(182,33,42,0.06)', color: 'var(--arroba-primary)' }}
                                      onClick={() => {
                                        if (a.includes('teaser') || a.includes('Editar')) setActiveTab('overview');
                                        else if (a.includes('infomemo')) setActiveTab('infomemo');
                                        else if (a.includes('Responder')) {
                                          const convId = alert.metadata?.metadata?.conv_id || alert.metadata?.conv_id;
                                          if (convId) navigate(`/qa/${convId}`);
                                        }
                                      }}
                                      data-testid={`alert-action-${i}-${j}`}
                                    >
                                      {a}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Publish Warning Modal Overlay */}
            {showPublishWarning && readiness && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" data-testid="publish-warning-modal">
                <div className="max-w-lg w-full mx-4 p-6" style={{ background: 'var(--surface-lowest, #fff)', boxShadow: '0 8px 32px rgba(25,28,30,0.15)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                    <h3 className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>Publicar con carencias</h3>
                  </div>
                  <p className="text-sm mb-4" style={{ color: 'var(--on-surface-variant)' }}>
                    Tu deal se puede publicar, pero esta saliendo con carencias que pueden reducir el interes de compradores.
                  </p>
                  <div className="space-y-2 mb-6">
                    {readiness.missing_obligatory?.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm py-1.5 px-3"
                        style={{ background: 'rgba(220,38,38,0.04)' }}>
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span className="text-slate-700">{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <Button className="flex-1 btn-outline" onClick={() => setShowPublishWarning(false)}
                      data-testid="btn-complete-now">
                      COMPLETAR AHORA
                    </Button>
                    <Button className="flex-1 btn-primary" onClick={() => { setShowPublishWarning(false); activateDeal(true); }}
                      disabled={actionLoading}
                      data-testid="btn-publish-anyway">
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'PUBLICAR DE TODOS MODOS'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'comparator' && (
              <ComparatorTab deal={deal} onRefresh={loadDeal} />
            )}

            {activeTab === 'qa' && (
              <QaTab dealId={deal.deal_id} />
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
