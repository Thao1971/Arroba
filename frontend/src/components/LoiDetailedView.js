import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../components/ui/button';
import { engagementsAPI, trackingAPI } from '../services/api';
import {
  FileSignature, TrendingUp, Download, Eye, Clock, User,
  Loader2, FolderOpen, Star, Send, Filter, Zap, Target, Info,
  CheckCircle2, XCircle, Lock, ArrowRight, AlertTriangle
} from 'lucide-react';

const classConfig = {
  RECOMMENDED_SHORTLIST: { label: 'Recomendado', color: 'bg-green-100 text-green-700 border-green-300', icon: Star, iconColor: 'text-green-600' },
  CONSIDER: { label: 'Considerar', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: Target, iconColor: 'text-amber-600' },
  LOW_PRIORITY: { label: 'Baja prioridad', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: null, iconColor: '' },
  ALREADY_SHORTLISTED: { label: 'En Shortlist', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle2, iconColor: 'text-green-600' },
  EXCLUSIVITY: { label: 'Exclusividad', color: 'bg-indigo-100 text-indigo-700 border-indigo-300', icon: Lock, iconColor: 'text-indigo-600' },
  REJECTED: { label: 'Descartado', color: 'bg-red-100 text-red-500 border-red-200', icon: XCircle, iconColor: 'text-red-500' },
};

const intentConfig = {
  alta: { label: 'Alta intención', color: 'bg-green-50 text-green-700', icon: Zap },
  media: { label: 'Media intención', color: 'bg-amber-50 text-amber-700', icon: Target },
  baja: { label: 'Baja intención', color: 'bg-slate-50 text-slate-500', icon: null },
};

const formatTime = (seconds) => {
  if (!seconds || seconds < 60) return seconds ? `${seconds}s` : '—';
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

const LoiDetailedView = ({ deal, onRefresh }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [tooltipId, setTooltipId] = useState(null);
  const [applyingShortlist, setApplyingShortlist] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  const loadData = async () => {
    try {
      const res = await trackingAPI.getSuggestions(deal.deal_id);
      setData(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [deal.deal_id]);

  const buyers = data?.buyers || [];
  const recommendation = data?.recommendation;
  const exclusivityCandidate = data?.exclusivity_candidate;
  const shortlistStatus = data?.shortlist_status || { current_count: 0, max: 3, available_slots: 3 };

  // Filter
  const filtered = useMemo(() => {
    if (filter === 'loi') return buyers.filter(b => b.engagement_type === 'LOI');
    if (filter === 'alta') return buyers.filter(b => b.intent_level === 'alta');
    if (filter === 'recommended') return buyers.filter(b => b.classification === 'RECOMMENDED_SHORTLIST');
    return buyers;
  }, [buyers, filter]);

  // Summary counts
  const counts = useMemo(() => ({
    lois: buyers.filter(b => b.engagement_type === 'LOI').length,
    interests: buyers.filter(b => b.engagement_type === 'INTEREST').length,
    recommended: buyers.filter(b => b.classification === 'RECOMMENDED_SHORTLIST').length,
    alta: buyers.filter(b => b.intent_level === 'alta').length,
  }), [buyers]);

  // Apply suggested shortlist
  const handleApplySuggested = async () => {
    if (!recommendation?.buyer_ids?.length) return;
    const confirmed = window.confirm(
      shortlistStatus.current_count > 0
        ? `Ya tienes ${shortlistStatus.current_count} buyer(s) en shortlist. ¿Añadir ${recommendation.buyer_ids.length} más?`
        : `¿Shortlistar ${recommendation.buyer_ids.length} buyer(s) recomendado(s)?`
    );
    if (!confirmed) return;

    setApplyingShortlist(true);
    try {
      for (const buyerId of recommendation.buyer_ids) {
        await engagementsAPI.shortlistBuyer(deal.deal_id, buyerId);
      }
      await loadData();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al aplicar shortlist');
    } finally { setApplyingShortlist(false); }
  };

  // Individual actions
  const handleAction = async (action, buyerId) => {
    setActionLoading(buyerId);
    try {
      if (action === 'shortlist') await engagementsAPI.shortlistBuyer(deal.deal_id, buyerId);
      if (action === 'reject') await engagementsAPI.rejectBuyer(deal.deal_id, buyerId);
      if (action === 'exclusivity') await engagementsAPI.grantExclusivity(deal.deal_id, buyerId);
      if (action === 'remove-shortlist') await engagementsAPI.removeFromShortlist(deal.deal_id, buyerId);
      await loadData();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error');
    } finally { setActionLoading(''); }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div data-testid="loi-detailed-view">
      {/* System Recommendation Banner */}
      {recommendation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6" data-testid="suggestion-banner">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-green-900 text-sm">Sugerencia del sistema</h3>
                <p className="text-sm text-green-700">{recommendation.message}</p>
                <p className="text-xs text-green-600 mt-0.5">{recommendation.detail}</p>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {recommendation.buyer_names?.map((name, i) => (
                    <span key={i} className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">{name}</span>
                  ))}
                </div>
              </div>
            </div>
            <Button onClick={handleApplySuggested} disabled={applyingShortlist}
              className="bg-green-600 hover:bg-green-700 text-white text-sm flex-shrink-0"
              data-testid="apply-shortlist-btn">
              {applyingShortlist ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
              Aplicar shortlist sugerida
            </Button>
          </div>
        </div>
      )}

      {/* Exclusivity Suggestion */}
      {exclusivityCandidate && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6" data-testid="exclusivity-banner">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-indigo-900 text-sm">Candidato para exclusividad</h3>
                <p className="text-sm text-indigo-700">{exclusivityCandidate.message}</p>
                <p className="text-xs text-indigo-600 mt-0.5">{exclusivityCandidate.detail}</p>
              </div>
            </div>
            <Button onClick={() => handleAction('exclusivity', exclusivityCandidate.buyer_id)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm flex-shrink-0"
              data-testid="apply-exclusivity-btn">
              <Lock className="w-4 h-4 mr-1" /> Conceder exclusividad
            </Button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-arroba-coral">{counts.lois}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">LOIs</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-slate-900">{counts.interests}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Intereses</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{counts.recommended}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Recomendados</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-slate-600">{shortlistStatus.current_count}/3</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Shortlist</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-slate-400" />
        {[
          { id: 'all', label: 'Todos' },
          { id: 'loi', label: 'Con LOI' },
          { id: 'recommended', label: 'Recomendados' },
          { id: 'alta', label: 'Alta intención' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              filter === f.id ? 'bg-arroba-coral text-white border-arroba-coral' : 'bg-white border-slate-200 hover:border-slate-300'
            }`} data-testid={`filter-${f.id}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Buyer Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-lg" data-testid="no-results">
          <FileSignature className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900 mb-1">
            {buyers.length === 0 ? 'No hay compradores todavía' : 'Sin resultados con este filtro'}
          </h3>
        </div>
      ) : (
        <div className="space-y-3" data-testid="buyer-cards">
          {filtered.map(buyer => {
            const cls = classConfig[buyer.classification] || classConfig.LOW_PRIORITY;
            const ClsIcon = cls.icon;
            const intent = intentConfig[buyer.intent_level] || intentConfig.baja;
            const ts = buyer.time_summary || {};
            const isLoading = actionLoading === buyer.buyer_id;

            return (
              <div key={buyer.buyer_id} className={`border rounded-lg overflow-hidden ${buyer.classification === 'RECOMMENDED_SHORTLIST' ? 'border-green-300 bg-green-50/30' : 'border-slate-200'}`}
                data-testid={`buyer-card-${buyer.buyer_id}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-arroba-coral/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-arroba-coral" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{buyer.buyer_name}</p>
                      <p className="text-xs text-slate-400">{buyer.engagement_type}{buyer.signals?.has_loi ? ' · LOI' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* Classification badge with reason tooltip */}
                    <div className="relative">
                      <button onClick={() => setTooltipId(tooltipId === buyer.buyer_id ? null : buyer.buyer_id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 border ${cls.color}`}
                        data-testid={`class-badge-${buyer.buyer_id}`}>
                        {ClsIcon && <ClsIcon className="w-3 h-3" />}
                        {cls.label}
                        <Info className="w-3 h-3 opacity-40" />
                      </button>
                      {tooltipId === buyer.buyer_id && (
                        <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-50"
                          data-testid={`tooltip-${buyer.buyer_id}`}>
                          <p className="text-xs font-bold text-slate-700 mb-1.5">{buyer.reason}</p>
                          {buyer.intent_factors?.length > 0 && (
                            <>
                              <p className="text-[10px] text-slate-400 uppercase mb-1">Factores de intención:</p>
                              {buyer.intent_factors.map((f, i) => (
                                <div key={i} className="flex justify-between text-xs py-0.5">
                                  <span className="text-slate-600">{f.factor}</span>
                                  <span className="font-bold">+{f.points}</span>
                                </div>
                              ))}
                              <div className="border-t border-slate-100 mt-1 pt-1 flex justify-between text-xs font-bold">
                                <span>Score</span><span>{buyer.intent_score}/100</span>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Intent label */}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${intent.color}`}>
                      {buyer.intent_label}
                    </span>
                  </div>
                </div>

                {/* Body — 3 columns */}
                <div className="px-4 py-3 grid sm:grid-cols-3 gap-4 border-t border-slate-100 bg-white/50 text-sm">
                  {/* Signals */}
                  <div>
                    <p className="text-[10px] uppercase text-slate-400 mb-1.5 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Señales</p>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span className="text-slate-500">LOI</span><span className={buyer.signals?.has_loi ? 'text-green-600 font-bold' : 'text-slate-400'}>{buyer.signals?.has_loi ? 'Sí' : 'No'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Descargas DR</span><span className="font-bold">{buyer.signals?.dr_downloads || 0}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Intención</span><span className="font-bold">{buyer.intent_label}</span></div>
                    </div>
                  </div>
                  {/* Data Room */}
                  <div>
                    <p className="text-[10px] uppercase text-slate-400 mb-1.5 flex items-center gap-1"><FolderOpen className="w-3 h-3" /> Actividad DR</p>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span className="text-slate-500"><Download className="w-3 h-3 inline mr-1" />Descargas</span><span className="font-bold text-green-600">{buyer.signals?.dr_downloads || 0}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500"><Clock className="w-3 h-3 inline mr-1" />Tiempo DR</span><span className="font-bold">{buyer.signals?.dr_time_min > 0 ? `${buyer.signals.dr_time_min} min` : '—'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Total</span><span>{buyer.signals?.total_time_min > 0 ? `${buyer.signals.total_time_min} min` : '—'}</span></div>
                    </div>
                  </div>
                  {/* Time */}
                  <div>
                    <p className="text-[10px] uppercase text-slate-400 mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> Tiempo invertido</p>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span className="text-slate-500">Deal Page</span><span>{formatTime(ts.deal_page)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Infomemo</span><span>{formatTime(ts.infomemo)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Data Room</span><span className="font-bold text-arroba-coral">{formatTime(ts.data_room)}</span></div>
                    </div>
                  </div>
                </div>

                {/* Footer: Suggested action + buttons */}
                <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs">
                    {buyer.action && (
                      <span className="text-slate-500 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" /> {buyer.action_label}
                      </span>
                    )}
                  </div>
                  {buyer.classification !== 'REJECTED' && buyer.classification !== 'EXCLUSIVITY' && (
                    <div className="flex gap-1.5">
                      {buyer.stage !== 'SHORTLISTED' && shortlistStatus.available_slots > 0 && (
                        <Button variant="outline" size="sm" disabled={isLoading}
                          onClick={() => handleAction('shortlist', buyer.buyer_id)}
                          className="text-xs h-7 text-green-600 border-green-200 hover:bg-green-50"
                          data-testid={`action-shortlist-${buyer.buyer_id}`}>
                          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3 mr-1" />} Shortlist
                        </Button>
                      )}
                      {buyer.stage === 'SHORTLISTED' && (
                        <>
                          <Button variant="outline" size="sm" disabled={isLoading}
                            onClick={() => handleAction('exclusivity', buyer.buyer_id)}
                            className="text-xs h-7 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                            data-testid={`action-exclusivity-${buyer.buyer_id}`}>
                            <Lock className="w-3 h-3 mr-1" /> Exclusividad
                          </Button>
                          <Button variant="outline" size="sm" disabled={isLoading}
                            onClick={() => handleAction('remove-shortlist', buyer.buyer_id)}
                            className="text-xs h-7 text-slate-400"
                            data-testid={`action-remove-${buyer.buyer_id}`}>
                            Quitar
                          </Button>
                        </>
                      )}
                      {buyer.stage !== 'SHORTLISTED' && (
                        <Button variant="outline" size="sm" disabled={isLoading}
                          onClick={() => handleAction('reject', buyer.buyer_id)}
                          className="text-xs h-7 text-red-500 border-red-200 hover:bg-red-50"
                          data-testid={`action-reject-${buyer.buyer_id}`}>
                          Descartar
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LoiDetailedView;
