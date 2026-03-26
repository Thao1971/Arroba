import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { coachingAPI } from '../services/api';
import {
  Loader2, Users, ArrowRight, AlertTriangle, TrendingUp,
  FileText, Clock, ChevronRight, Zap, Eye, MessageSquare
} from 'lucide-react';

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now - d;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days}d`;
  const weeks = Math.floor(days / 7);
  return `hace ${weeks}sem`;
};

const urgencyDot = (urgency) => {
  if (urgency === 'alta') return 'bg-red-500';
  if (urgency === 'media') return 'bg-amber-400';
  return 'bg-slate-300';
};

const intentBar = (score) => {
  const width = Math.max(score, 4);
  let color = 'bg-slate-300';
  if (score >= 55) color = 'bg-green-500';
  else if (score >= 25) color = 'bg-amber-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
      <span className={`text-xs font-bold tabular-nums ${
        score >= 55 ? 'text-green-600' : score >= 25 ? 'text-amber-600' : 'text-slate-400'
      }`}>{score}</span>
    </div>
  );
};

const stageLabel = (stage) => ({
  SUBMITTED: 'Nuevo',
  VIEWED: 'Visto',
  ACCEPTED: 'Aceptado',
  SHORTLISTED: 'Shortlist',
  EXCLUSIVITY: 'Exclusividad',
  REJECTED: 'Descartado',
}[stage] || stage);

const stageStyle = (stage) => ({
  SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-200',
  VIEWED: 'bg-slate-50 text-slate-600 border-slate-200',
  ACCEPTED: 'bg-teal-50 text-teal-700 border-teal-200',
  SHORTLISTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  EXCLUSIVITY: 'bg-purple-50 text-purple-700 border-purple-200',
  REJECTED: 'bg-red-50 text-red-500 border-red-200',
}[stage] || 'bg-slate-50 text-slate-600 border-slate-200');

const NudgeCard = ({ nudge, index }) => {
  const borderColor = nudge.priority === 'ALTA' ? 'border-l-red-500' :
    nudge.priority === 'MEDIA' ? 'border-l-amber-400' : 'border-l-slate-300';
  return (
    <Link
      to={nudge.deal_id ? `/seller/deal/${nudge.deal_id}` : '#'}
      className={`block p-3 bg-white border border-slate-200 border-l-4 ${borderColor} rounded-lg hover:shadow-sm transition-all`}
      data-testid={`nudge-${index}`}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
          nudge.priority === 'ALTA' ? 'text-red-500' : 'text-amber-500'
        }`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 leading-tight">{nudge.title}</p>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{nudge.message}</p>
          {nudge.actions && nudge.actions.length > 0 && (
            <div className="flex gap-1.5 mt-2">
              {nudge.actions.map((a, i) => (
                <span key={i} className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700 rounded-full">
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
      </div>
    </Link>
  );
};

const BuyerRow = ({ buyer, index }) => {
  const action = buyer.action || {};
  return (
    <div
      className="grid grid-cols-12 gap-2 items-center px-4 py-3 border-b border-slate-100 hover:bg-slate-50/70 transition-colors group"
      data-testid={`buyer-row-${index}`}
    >
      {/* Urgency dot + Buyer */}
      <div className="col-span-2 flex items-center gap-2.5 min-w-0">
        <div className={`w-2 h-2 rounded-full shrink-0 ${urgencyDot(action.urgency)}`}
          title={`Urgencia: ${action.urgency}`} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{buyer.buyer_name}</p>
          <p className="text-[11px] text-slate-400 capitalize truncate">{buyer.buyer_type}</p>
        </div>
      </div>

      {/* Deal */}
      <div className="col-span-2 min-w-0">
        <Link to={`/seller/deal/${buyer.deal_id}`} className="text-xs text-slate-600 truncate hover:text-arroba-coral transition-colors">
          {buyer.deal_title}
        </Link>
      </div>

      {/* Type + Stage */}
      <div className="col-span-2 flex items-center gap-1.5">
        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold ${
          buyer.type === 'LOI' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'
        }`}>
          {buyer.type === 'LOI' ? <FileText className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5" />}
          {buyer.type}
        </span>
        <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium border ${stageStyle(buyer.stage)}`}>
          {stageLabel(buyer.stage)}
        </span>
      </div>

      {/* Intent */}
      <div className="col-span-1">
        {intentBar(buyer.intent_score)}
      </div>

      {/* LOI amount */}
      <div className="col-span-1 text-right">
        {buyer.valuation_offer ? (
          <span className="text-sm font-bold text-slate-900">{(buyer.valuation_offer / 1e6).toFixed(1)}M</span>
        ) : (
          <span className="text-xs text-slate-300">-</span>
        )}
      </div>

      {/* Suggested Action + Q&A link */}
      <div className="col-span-3 min-w-0 flex items-center gap-2">
        <p className={`text-xs leading-snug flex-1 ${
          action.urgency === 'alta' ? 'text-red-600 font-semibold' :
          action.urgency === 'media' ? 'text-amber-700 font-medium' :
          'text-slate-500'
        }`}>{action.text}</p>
        {buyer.pending_questions > 0 && (
          <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold ${
            buyer.pending_urgency === 'alta' ? 'bg-red-100 text-red-700' :
            buyer.pending_urgency === 'media' ? 'bg-amber-100 text-amber-700' :
            'bg-slate-100 text-slate-600'
          }`} data-testid={`pending-badge-${index}`}>
            <Clock size={9} />
            {buyer.pending_questions} pendiente{buyer.pending_questions !== 1 ? 's' : ''}{buyer.pending_urgency === 'alta' ? ' · urgente' : ''}
          </span>
        )}
        {buyer.conversation_id && (
          <Link
            to={`/qa/${buyer.conversation_id}`}
            className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider hover:opacity-80 transition-opacity"
            style={{ background: 'rgba(0,100,147,0.08)', color: '#004b74' }}
            onClick={(e) => e.stopPropagation()}
            data-testid={`qa-link-${index}`}
          >
            <MessageSquare size={10} /> Q&A
          </Link>
        )}
      </div>

      {/* Time + Arrow */}
      <div className="col-span-1 flex items-center justify-end gap-2">
        <span className="text-[11px] text-slate-400 whitespace-nowrap">{timeAgo(buyer.last_activity)}</span>
        <Link to={`/seller/deal/${buyer.deal_id}`}>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-arroba-coral transition-colors shrink-0" />
        </Link>
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, icon: Icon, accent }) => (
  <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.03)' }} data-testid={`summary-${label}`}>
    <div className={`w-8 h-8 flex items-center justify-center ${accent}`}>
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="text-lg font-bold leading-none" style={{ color: 'var(--on-surface)' }}>{value}</p>
      <p className="text-[11px] mt-0.5" style={{ color: 'var(--outline)' }}>{label}</p>
    </div>
  </div>
);

const SellerInteresados = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await coachingAPI.getSellerInteresados();
        setData(res.data);
      } catch (e) {
        console.error('Error loading interesados:', e);
        setError('Error cargando datos');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-slate-500">{error}</p>
        </div>
      </Layout>
    );
  }

  const { buyers = [], nudges = [], summary = {}, deals_count = 0 } = data || {};

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-6xl" data-testid="seller-interesados-page">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Interesados</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Centro de decision — todos los buyers de {deals_count} deal{deals_count !== 1 ? 's' : ''} activo{deals_count !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Summary cards */}
        {buyers.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5" data-testid="summary-cards">
            <SummaryCard label="Total buyers" value={summary.total} icon={Users} accent="bg-slate-100 text-slate-600" />
            <SummaryCard label={summary.lois === 1 ? 'LOI recibida' : 'LOIs recibidas'} value={summary.lois} icon={FileText} accent="bg-green-100 text-green-600" />
            <SummaryCard label="Alta intencion" value={summary.high_intent} icon={TrendingUp} accent="bg-blue-100 text-blue-600" />
            <SummaryCard label="Requieren accion" value={summary.needs_action} icon={Zap} accent="bg-red-100 text-red-600" />
          </div>
        )}

        {/* Nudges */}
        {nudges.length > 0 && (
          <div className="space-y-2 mb-5" data-testid="interesados-nudges">
            {nudges.slice(0, 3).map((n, i) => (
              <NudgeCard key={n.id + i} nudge={n} index={i} />
            ))}
          </div>
        )}

        {/* Buyers table */}
        {buyers.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-300 rounded-xl" data-testid="interesados-empty">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Aun no tienes interesados</p>
            <p className="text-sm text-slate-400 mt-1">Publica un deal para empezar a recibir interes</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" data-testid="interesados-table">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <div className="col-span-2 pl-4">Buyer</div>
              <div className="col-span-2">Deal</div>
              <div className="col-span-2">Tipo / Estado</div>
              <div className="col-span-1">Intencion</div>
              <div className="col-span-1 text-right">LOI</div>
              <div className="col-span-3">Que hacer</div>
              <div className="col-span-1 text-right">Actividad</div>
            </div>

            {/* Rows */}
            {buyers.map((b, i) => (
              <BuyerRow key={b.engagement_id || i} buyer={b} index={i} />
            ))}

            {/* Footer */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {buyers.length} interesado{buyers.length !== 1 ? 's' : ''} en {deals_count} deal{deals_count !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Accion urgente</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Seguimiento</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300"></span> Monitorizar</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SellerInteresados;
