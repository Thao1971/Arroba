import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { engagementsAPI, dataroomAPI } from '../services/api';
import {
  FileSignature, TrendingUp, Download, Eye, Clock, User,
  ArrowUpRight, Loader2, FolderOpen, Star, Shield, Send
} from 'lucide-react';

const LoiDetailedView = ({ deal }) => {
  const [engagements, setEngagements] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [engRes, logRes] = await Promise.all([
          engagementsAPI.listDealEngagements(deal.deal_id),
          dataroomAPI.getAccessLog(deal.deal_id).catch(() => ({ data: { logs: [] } })),
        ]);
        setEngagements(engRes.data.engagements || []);
        setAccessLogs(logRes.data.logs || []);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, [deal.deal_id]);

  // Only show LOIs
  const lois = engagements.filter(e => e.type === 'LOI');
  const interests = engagements.filter(e => e.type === 'INTEREST');

  // Compute activity per buyer from access logs
  const activityByBuyer = {};
  accessLogs.forEach(log => {
    const bid = log.buyer_id;
    if (!activityByBuyer[bid]) {
      activityByBuyer[bid] = { views: 0, downloads: 0, accesses: 0, last_action: null, folders_accessed: new Set() };
    }
    if (log.action === 'VIEW') activityByBuyer[bid].views++;
    if (log.action === 'DOWNLOAD') activityByBuyer[bid].downloads++;
    if (log.action === 'DATA_ROOM_ACCESSED') activityByBuyer[bid].accesses++;
    if (log.folder) activityByBuyer[bid].folders_accessed.add(log.folder);
    if (!activityByBuyer[bid].last_action || log.timestamp > activityByBuyer[bid].last_action) {
      activityByBuyer[bid].last_action = log.timestamp;
    }
  });

  // Compute engagement signal strength
  const getSignalStrength = (buyerId) => {
    const a = activityByBuyer[buyerId];
    if (!a) return { level: 'low', label: 'Sin actividad', color: 'text-slate-400 bg-slate-100' };
    const score = a.downloads * 3 + a.views * 1 + a.accesses * 2;
    if (score >= 10) return { level: 'high', label: 'Señal alta', color: 'text-green-700 bg-green-100' };
    if (score >= 4) return { level: 'medium', label: 'Señal media', color: 'text-amber-700 bg-amber-100' };
    return { level: 'low', label: 'Señal baja', color: 'text-slate-500 bg-slate-100' };
  };

  const stageLabels = {
    SUBMITTED: { text: 'Enviada', color: 'bg-blue-100 text-blue-700' },
    VIEWED: { text: 'Vista', color: 'bg-slate-100 text-slate-700' },
    SHORTLISTED: { text: 'Shortlist', color: 'bg-green-100 text-green-700' },
    EXCLUSIVITY: { text: 'Exclusividad', color: 'bg-arroba-coral/10 text-arroba-coral' },
    REJECTED: { text: 'Rechazada', color: 'bg-red-100 text-red-700' },
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  return (
    <div data-testid="loi-detailed-view">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-arroba-coral">{lois.length}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wider">LOIs recibidas</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{interests.length}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Intereses</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {Object.values(activityByBuyer).reduce((sum, a) => sum + a.downloads, 0)}
          </p>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Descargas totales</p>
        </div>
      </div>

      {/* LOI Comparison Table */}
      {lois.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-lg" data-testid="no-lois">
          <FileSignature className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900 mb-1">No hay LOIs todavía</h3>
          <p className="text-sm text-slate-500">Los compradores que escalen de interés a LOI aparecerán aquí con su actividad detallada.</p>
        </div>
      ) : (
        <div className="space-y-4" data-testid="loi-cards">
          {lois
            .sort((a, b) => {
              // Sort by signal strength (high first)
              const sa = getSignalStrength(a.buyer_id);
              const sb = getSignalStrength(b.buyer_id);
              const order = { high: 3, medium: 2, low: 1 };
              return (order[sb.level] || 0) - (order[sa.level] || 0);
            })
            .map(loi => {
              const signal = getSignalStrength(loi.buyer_id);
              const activity = activityByBuyer[loi.buyer_id] || { views: 0, downloads: 0, accesses: 0, folders_accessed: new Set() };
              const stage = stageLabels[loi.stage] || { text: loi.stage, color: 'bg-slate-100 text-slate-700' };

              return (
                <div key={loi.engagement_id}
                  className="border border-slate-200 rounded-lg overflow-hidden"
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
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${signal.color}`}>
                        {signal.label}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${stage.color}`}>
                        {stage.text}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-5 py-4 grid sm:grid-cols-2 gap-6">
                    {/* Left: LOI Financial Details */}
                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" /> Oferta
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Valoración</span>
                          <span className="font-bold text-slate-900">
                            {loi.valuation_offer ? `${Number(loi.valuation_offer).toLocaleString('es-ES')}€` : 'N/D'}
                          </span>
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
                          <span className="text-slate-500">Operación</span>
                          <span className="font-medium">
                            {{ full_sale: 'Compra total', partial_sale: 'Compra parcial', merger: 'Fusión' }[loi.operation_type] || loi.operation_type || 'N/D'}
                          </span>
                        </div>
                        {loi.conditions && (
                          <div className="pt-2 border-t border-slate-100">
                            <p className="text-xs text-slate-400 mb-1">Condiciones</p>
                            <p className="text-sm text-slate-700">{loi.conditions}</p>
                          </div>
                        )}
                        <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
                          <span className="text-slate-500">Vinculante</span>
                          <span className={`font-medium ${loi.is_binding ? 'text-green-600' : 'text-slate-400'}`}>
                            {loi.is_binding ? 'Sí' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Data Room Activity */}
                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1">
                        <FolderOpen className="w-3.5 h-3.5" /> Actividad en Data Room
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500 flex items-center gap-1"><Download className="w-3 h-3" /> Descargas</span>
                          <span className="font-bold text-green-600">{activity.downloads}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500 flex items-center gap-1"><Eye className="w-3 h-3" /> Visualizaciones</span>
                          <span className="font-bold">{activity.views}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Carpetas accedidas</span>
                          <span className="font-bold">{activity.folders_accessed.size}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Último acceso</span>
                          <span className="text-xs text-slate-600">
                            {activity.last_action
                              ? new Date(activity.last_action).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                              : 'Nunca'}
                          </span>
                        </div>
                      </div>

                      {/* Activity insight */}
                      {activity.downloads > 3 && (
                        <div className="mt-3 p-2 bg-green-50 rounded text-xs text-green-700 flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Este buyer ha descargado {activity.downloads} documentos. Alto nivel de interés.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer with date */}
                  <div className="flex items-center justify-between px-5 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
                    <span>LOI enviada: {loi.upgraded_to_loi_at ? new Date(loi.upgraded_to_loi_at).toLocaleDateString('es-ES') : loi.created_at ? new Date(loi.created_at).toLocaleDateString('es-ES') : ''}</span>
                    <span>ID: {loi.engagement_id}</span>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Interests that haven't upgraded to LOI */}
      {interests.length > 0 && (
        <div className="mt-8" data-testid="pending-interests">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Send className="w-4 h-4 text-slate-400" /> Intereses pendientes de LOI ({interests.length})
          </h3>
          <div className="space-y-2">
            {interests.map(int_ => {
              const signal = getSignalStrength(int_.buyer_id);
              const activity = activityByBuyer[int_.buyer_id] || { downloads: 0, views: 0 };
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
                        {activity.downloads > 0 ? `${activity.downloads} descargas · ` : ''}
                        {activity.views > 0 ? `${activity.views} vistas` : 'Sin actividad en Data Room'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${signal.color}`}>
                    {signal.label}
                  </span>
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
