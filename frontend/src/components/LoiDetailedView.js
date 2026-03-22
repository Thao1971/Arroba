import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../components/ui/button';
import { engagementsAPI, dataroomAPI, trackingAPI } from '../services/api';
import {
  FileSignature, TrendingUp, Download, Eye, Clock, User,
  Loader2, FolderOpen, Star, Shield, Send, Filter, Zap, Target, Info
} from 'lucide-react';

const intentConfig = {
  alta: { label: 'Alta intención', color: 'bg-green-100 text-green-700 border-green-200', icon: Zap },
  media: { label: 'Media intención', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Target },
  baja: { label: 'Baja intención', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: null },
};

const stageLabels = {
  SUBMITTED: { text: 'Enviada', color: 'bg-blue-100 text-blue-700' },
  VIEWED: { text: 'Vista', color: 'bg-slate-100 text-slate-700' },
  SHORTLISTED: { text: 'Shortlist', color: 'bg-green-100 text-green-700' },
  EXCLUSIVITY: { text: 'Exclusividad', color: 'bg-indigo-100 text-indigo-700' },
  REJECTED: { text: 'Rechazada', color: 'bg-red-100 text-red-700' },
};

const formatTime = (seconds) => {
  if (!seconds || seconds < 60) return seconds ? `${seconds}s` : '—';
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

const LoiDetailedView = ({ deal, onRefresh }) => {
  const [engagements, setEngagements] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [intentData, setIntentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, loi, alta
  const [showTooltip, setShowTooltip] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [engRes, logRes, intentRes] = await Promise.all([
          engagementsAPI.listDealEngagements(deal.deal_id),
          dataroomAPI.getAccessLog(deal.deal_id).catch(() => ({ data: { logs: [] } })),
          trackingAPI.getDealIntent(deal.deal_id).catch(() => ({ data: { buyers: [] } })),
        ]);
        setEngagements(engRes.data.engagements || []);
        setAccessLogs(logRes.data.logs || []);
        setIntentData(intentRes.data.buyers || []);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, [deal.deal_id]);

  // Build activity map from access logs
  const activityByBuyer = useMemo(() => {
    const map = {};
    accessLogs.forEach(log => {
      const bid = log.buyer_id;
      if (!map[bid]) map[bid] = { views: 0, downloads: 0, accesses: 0, last_action: null, folders: new Set() };
      if (log.action === 'VIEW') map[bid].views++;
      if (log.action === 'DOWNLOAD') map[bid].downloads++;
      if (log.action === 'DATA_ROOM_ACCESSED') map[bid].accesses++;
      if (log.folder) map[bid].folders.add(log.folder);
      if (!map[bid].last_action || log.timestamp > map[bid].last_action) map[bid].last_action = log.timestamp;
    });
    return map;
  }, [accessLogs]);

  // Intent lookup
  const intentByBuyer = useMemo(() => {
    const map = {};
    intentData.forEach(i => { map[i.buyer_id] = i; });
    return map;
  }, [intentData]);

  // All engagements + filter
  const lois = engagements.filter(e => e.type === 'LOI');
  const interests = engagements.filter(e => e.type === 'INTEREST');

  const filteredLois = useMemo(() => {
    let items = lois;
    if (filter === 'alta') {
      items = items.filter(e => intentByBuyer[e.buyer_id]?.level === 'alta');
    }
    // Sort by intent score (highest first)
    return items.sort((a, b) => (intentByBuyer[b.buyer_id]?.score || 0) - (intentByBuyer[a.buyer_id]?.score || 0));
  }, [lois, filter, intentByBuyer]);

  const filteredInterests = useMemo(() => {
    let items = interests;
    if (filter === 'loi') return [];
    if (filter === 'alta') {
      items = items.filter(e => intentByBuyer[e.buyer_id]?.level === 'alta');
    }
    return items.sort((a, b) => (intentByBuyer[b.buyer_id]?.score || 0) - (intentByBuyer[a.buyer_id]?.score || 0));
  }, [interests, filter, intentByBuyer]);

  // Actions
  const handleAction = async (action, buyerId) => {
    try {
      if (action === 'shortlist') await engagementsAPI.shortlist(deal.deal_id, buyerId);
      if (action === 'reject') await engagementsAPI.reject(deal.deal_id, buyerId);
      if (action === 'exclusivity') await engagementsAPI.grantExclusivity(deal.deal_id, buyerId);
      if (onRefresh) onRefresh();
      // Reload
      const engRes = await engagementsAPI.listDealEngagements(deal.deal_id);
      setEngagements(engRes.data.engagements || []);
    } catch {}
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div data-testid="loi-detailed-view">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-arroba-coral">{lois.length}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">LOIs</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-slate-900">{interests.length}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Intereses</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{intentData.filter(i => i.level === 'alta').length}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Alta intención</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-slate-600">
            {Object.values(activityByBuyer).reduce((s, a) => s + a.downloads, 0)}
          </p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Descargas</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-slate-400" />
        {[
          { id: 'all', label: 'Todos' },
          { id: 'loi', label: 'Con LOI' },
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

      {/* LOI Cards */}
      {filteredLois.length === 0 && filter !== 'all' ? (
        <div className="text-center py-6 bg-slate-50 rounded-lg text-sm text-slate-400 mb-6">
          No hay resultados con este filtro
        </div>
      ) : filteredLois.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-lg mb-6" data-testid="no-lois">
          <FileSignature className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900 mb-1">No hay LOIs todavía</h3>
          <p className="text-sm text-slate-500">Los compradores que escalen de interés a LOI aparecerán aquí.</p>
        </div>
      ) : (
        <div className="space-y-4 mb-6" data-testid="loi-cards">
          {filteredLois.map(loi => {
            const intent = intentByBuyer[loi.buyer_id] || { level: 'baja', label: 'Baja intención', score: 0, factors: [], time_summary: {} };
            const ic = intentConfig[intent.level] || intentConfig.baja;
            const IntentIcon = ic.icon;
            const activity = activityByBuyer[loi.buyer_id] || { views: 0, downloads: 0, folders: new Set() };
            const stage = stageLabels[loi.stage] || { text: loi.stage, color: 'bg-slate-100' };
            const timeSummary = intent.time_summary || {};

            return (
              <div key={loi.engagement_id} className="border border-slate-200 rounded-lg overflow-hidden"
                data-testid={`loi-card-${loi.engagement_id}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-arroba-coral/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-arroba-coral" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{loi.buyer_name || 'Comprador'}</p>
                      <p className="text-xs text-slate-400">{loi.buyer_type || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Intent badge with tooltip */}
                    <div className="relative">
                      <button onClick={() => setShowTooltip(showTooltip === loi.engagement_id ? null : loi.engagement_id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 border ${ic.color}`}
                        data-testid={`intent-badge-${loi.engagement_id}`}>
                        {IntentIcon && <IntentIcon className="w-3 h-3" />}{intent.label}
                        <Info className="w-3 h-3 opacity-50" />
                      </button>
                      {showTooltip === loi.engagement_id && intent.factors?.length > 0 && (
                        <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-50"
                          data-testid="intent-tooltip">
                          <p className="text-xs font-bold mb-2 text-slate-700">Factores de intención:</p>
                          {intent.factors.map((f, i) => (
                            <div key={i} className="flex justify-between text-xs py-0.5">
                              <span className="text-slate-600">{f.factor}</span>
                              <span className="font-bold text-slate-900">+{f.points}</span>
                            </div>
                          ))}
                          <div className="border-t border-slate-100 mt-1.5 pt-1.5 flex justify-between text-xs font-bold">
                            <span>Total</span><span>{intent.score}/100</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${stage.color}`}>{stage.text}</span>
                  </div>
                </div>

                {/* Body — 3 columns */}
                <div className="px-5 py-4 grid sm:grid-cols-3 gap-5">
                  {/* Col 1: Financial */}
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> Oferta
                    </h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Valoración</span>
                        <span className="font-bold text-slate-900">{loi.valuation_offer ? `${Number(loi.valuation_offer).toLocaleString('es-ES')}€` : 'N/D'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Estructura</span>
                        <span className="font-medium">{loi.structure || 'N/D'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">% Adquisición</span>
                        <span className="font-medium">{loi.acquisition_percentage ? `${loi.acquisition_percentage}%` : 'N/D'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Vinculante</span>
                        <span className={`font-medium ${loi.is_binding ? 'text-green-600' : 'text-slate-400'}`}>{loi.is_binding ? 'Sí' : 'No'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Col 2: Data Room Activity */}
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1">
                      <FolderOpen className="w-3.5 h-3.5" /> Data Room
                    </h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 flex items-center gap-1"><Download className="w-3 h-3" /> Descargas</span>
                        <span className="font-bold text-green-600">{activity.downloads}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 flex items-center gap-1"><Eye className="w-3 h-3" /> Vistas</span>
                        <span className="font-bold">{activity.views}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Carpetas</span>
                        <span className="font-bold">{activity.folders.size}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Último</span>
                        <span className="text-xs">{activity.last_action ? new Date(activity.last_action).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'Nunca'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Col 3: Time Invested */}
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Tiempo invertido
                    </h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Deal Page</span>
                        <span className="font-medium">{formatTime(timeSummary.deal_page)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Infomemo</span>
                        <span className="font-medium">{formatTime(timeSummary.infomemo)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Data Room</span>
                        <span className="font-bold text-arroba-coral">{formatTime(timeSummary.data_room)}</span>
                      </div>
                      <div className="flex justify-between text-sm pt-1 border-t border-slate-100">
                        <span className="text-slate-700 font-medium">Total</span>
                        <span className="font-bold text-slate-900">{formatTime(timeSummary.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer: Actions */}
                <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50 border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    LOI: {loi.upgraded_to_loi_at ? new Date(loi.upgraded_to_loi_at).toLocaleDateString('es-ES') : loi.created_at ? new Date(loi.created_at).toLocaleDateString('es-ES') : ''}
                  </span>
                  {loi.stage !== 'REJECTED' && loi.stage !== 'EXCLUSIVITY' && (
                    <div className="flex gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => handleAction('shortlist', loi.buyer_id)}
                        className="text-xs h-7" data-testid={`action-shortlist-${loi.engagement_id}`}>
                        <Star className="w-3 h-3 mr-1" /> Shortlist
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleAction('reject', loi.buyer_id)}
                        className="text-xs h-7 text-red-500 hover:text-red-600" data-testid={`action-reject-${loi.engagement_id}`}>
                        Rechazar
                      </Button>
                      {loi.stage === 'SHORTLISTED' && (
                        <Button variant="outline" size="sm" onClick={() => handleAction('exclusivity', loi.buyer_id)}
                          className="text-xs h-7 text-indigo-600" data-testid={`action-exclusivity-${loi.engagement_id}`}>
                          Exclusividad
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

      {/* Interests pending LOI */}
      {filteredInterests.length > 0 && (
        <div data-testid="pending-interests">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Send className="w-4 h-4 text-slate-400" /> Intereses pendientes de LOI ({filteredInterests.length})
          </h3>
          <div className="space-y-2">
            {filteredInterests.map(int_ => {
              const intent = intentByBuyer[int_.buyer_id] || { level: 'baja', label: 'Baja intención' };
              const ic = intentConfig[intent.level] || intentConfig.baja;
              const activity = activityByBuyer[int_.buyer_id] || { downloads: 0, views: 0 };
              const timeSummary = intent.time_summary || {};
              return (
                <div key={int_.engagement_id} className="flex items-center justify-between px-4 py-3 border border-slate-200 rounded-lg"
                  data-testid={`interest-row-${int_.engagement_id}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{int_.buyer_name || 'Comprador'}</p>
                      <p className="text-xs text-slate-400">
                        {activity.downloads > 0 ? `${activity.downloads} desc. · ` : ''}
                        {timeSummary.total > 0 ? formatTime(timeSummary.total) : 'Sin actividad'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${ic.color}`}>
                      {intent.label}
                    </span>
                    {int_.stage !== 'REJECTED' && (
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="text-xs h-7"
                          onClick={() => handleAction('shortlist', int_.buyer_id)}
                          data-testid={`action-shortlist-int-${int_.engagement_id}`}>
                          <Star className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs h-7 text-red-500"
                          onClick={() => handleAction('reject', int_.buyer_id)}
                          data-testid={`action-reject-int-${int_.engagement_id}`}>
                          Rechazar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoiDetailedView;
