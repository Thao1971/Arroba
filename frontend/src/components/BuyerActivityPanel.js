import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { engagementsAPI } from '../services/api';
import {
  User, Clock, Loader2, FileSignature, Shield, Zap, Target,
  FolderOpen, Eye, Download, MessageSquare, Award, ArrowLeft,
  AlertTriangle, CheckCircle2, TrendingUp, Calendar, X, Info
} from 'lucide-react';

const certLabels = {
  certified: { label: 'Certificado', color: '#16a34a', bg: 'rgba(22,163,74,0.06)' },
  verified: { label: 'Verificado', color: '#d97706', bg: 'rgba(217,119,6,0.06)' },
  basic: { label: 'Básico', color: 'var(--outline)', bg: 'var(--surface-2)' },
};

const intentColors = { alta: '#16a34a', media: '#d97706', baja: 'var(--outline)' };

const fmtEur = (v) => v ? `${(v / 1e6).toFixed(1).replace('.', ',')}M€` : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' }) : '—';
const fmtMin = (m) => {
  if (!m || m < 1) return '< 1 min';
  if (m < 60) return `${Math.round(m)} min`;
  return `${Math.floor(m / 60)}h ${Math.round(m % 60)}m`;
};

const milestoneIcons = {
  interest: { icon: TrendingUp, color: '#006493' },
  viewed: { icon: Eye, color: '#d97706' },
  accepted: { icon: CheckCircle2, color: '#14b8a6' },
  loi: { icon: FileSignature, color: 'var(--arroba-primary)' },
  shortlist: { icon: Shield, color: '#16a34a' },
  nda: { icon: Shield, color: '#4f46e5' },
};

/**
 * BuyerActivityPanel — Detailed buyer activity for a deal.
 * Can be used as inline panel or drawer/modal.
 */
const BuyerActivityPanel = ({ dealId, buyerId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dealId || !buyerId) return;
    setLoading(true);
    engagementsAPI.getBuyerActivity(dealId, buyerId)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dealId, buyerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--outline)' }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm" style={{ color: 'var(--outline)' }}>No se pudo cargar la actividad del buyer.</p>
      </div>
    );
  }

  const { buyer, engagement, intent, time, dataroom, nda, qa, milestones, risks } = data;
  const cert = certLabels[buyer.certification_level] || certLabels.basic;

  return (
    <div data-testid="buyer-activity-panel">
      {/* Header */}
      {onClose && (
        <button onClick={onClose} className="flex items-center gap-1 text-xs font-semibold mb-5" style={{ color: 'var(--outline)' }}>
          <ArrowLeft size={12} /> Volver
        </button>
      )}

      <div className="p-5 mb-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-lg font-extrabold" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>{buyer.name}</p>
              <span className="px-2 py-0.5 text-[10px] font-bold flex items-center gap-1" style={{ background: cert.bg, color: cert.color }}>
                <Award size={9} /> {cert.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--outline)' }}>
              {buyer.buyer_type && <span>{buyer.buyer_type}</span>}
              {buyer.company && <span>· {buyer.company}</span>}
              {buyer.job_title && <span>· {buyer.job_title}</span>}
            </div>
          </div>
          {engagement?.stage && (
            <span className="px-3 py-1 text-[10px] font-bold" style={{ background: 'var(--surface-1)', color: 'var(--on-surface)' }}>
              {engagement.stage}
            </span>
          )}
        </div>
        {engagement?.valuation_offer && (
          <div className="flex items-center gap-6 mt-3 pt-3" style={{ borderTop: '1px solid var(--surface-1)' }}>
            <div>
              <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>OFERTA</p>
              <p className="text-xl font-black" style={{ color: 'var(--arroba-primary)', letterSpacing: '-0.02em' }}>{fmtEur(engagement.valuation_offer)}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>ESTRUCTURA</p>
              <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{engagement.structure || '—'}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>TIPO</p>
              <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{engagement.type}</p>
            </div>
          </div>
        )}
      </div>

      {/* Risks */}
      {risks.length > 0 && (
        <div className="mb-5 space-y-2">
          {risks.map((r, i) => (
            <div key={i} className="p-3 flex items-center gap-3"
              style={{ background: r.severity === 'warning' ? 'rgba(217,119,6,0.06)' : 'var(--surface-1)', borderLeft: `3px solid ${r.severity === 'warning' ? '#d97706' : 'var(--outline)'}` }}
              data-testid={`risk-${r.type}`}>
              <AlertTriangle size={13} style={{ color: r.severity === 'warning' ? '#d97706' : 'var(--outline)' }} />
              <p className="text-xs font-semibold" style={{ color: 'var(--on-surface)' }}>{r.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-3 mb-5" data-testid="activity-kpis">
        <div className="p-3" style={{ background: 'var(--surface-lowest)', boxShadow: '0 1px 4px rgba(25,28,30,0.03)' }}>
          <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>INTENCIÓN</p>
          <p className="text-lg font-black" style={{ color: intentColors[intent.level] || 'var(--on-surface)', letterSpacing: '-0.02em' }}>{intent.score}</p>
          <p className="text-[10px] font-semibold" style={{ color: intentColors[intent.level] }}>{intent.label}</p>
        </div>
        <div className="p-3" style={{ background: 'var(--surface-lowest)', boxShadow: '0 1px 4px rgba(25,28,30,0.03)' }}>
          <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>TIEMPO TOTAL</p>
          <p className="text-lg font-black" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>{fmtMin(time.total_minutes)}</p>
          <p className="text-[10px]" style={{ color: 'var(--outline)' }}>{time.sessions_count} sesiones</p>
        </div>
        <div className="p-3" style={{ background: 'var(--surface-lowest)', boxShadow: '0 1px 4px rgba(25,28,30,0.03)' }}>
          <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>DATA ROOM</p>
          <p className="text-lg font-black" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>{dataroom.total_downloads}</p>
          <p className="text-[10px]" style={{ color: 'var(--outline)' }}>{dataroom.total_views} vistas</p>
        </div>
        <div className="p-3" style={{ background: 'var(--surface-lowest)', boxShadow: '0 1px 4px rgba(25,28,30,0.03)' }}>
          <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>Q&A</p>
          <p className="text-lg font-black" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>{qa.messages_count}</p>
          <p className="text-[10px]" style={{ color: 'var(--outline)' }}>mensajes</p>
        </div>
      </div>

      {/* Time by section */}
      <div className="p-5 mb-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
        <p className="text-[9px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--outline)' }}>ACTIVIDAD POR SECCIÓN</p>
        <div className="space-y-2">
          {Object.entries(time.by_section).map(([section, minutes]) => {
            const pct = time.total_minutes > 0 ? Math.round((minutes / time.total_minutes) * 100) : 0;
            const labels = { deal_page: 'Ficha del deal', infomemo: 'Infomemo', data_room: 'Data Room' };
            return (
              <div key={section}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: 'var(--on-surface)' }}>{labels[section] || section}</span>
                  <span className="font-bold" style={{ color: 'var(--on-surface)' }}>{fmtMin(minutes)}</span>
                </div>
                <div className="w-full h-1.5" style={{ background: 'var(--surface-2)' }}>
                  <div className="h-full transition-all" style={{ background: 'var(--arroba-primary)', width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Room by folder */}
      {Object.keys(dataroom.by_folder).length > 0 && (
        <div className="p-5 mb-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
          <p className="text-[9px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--outline)' }}>DATA ROOM POR CARPETA</p>
          <div className="space-y-1.5">
            {Object.entries(dataroom.by_folder).map(([folder, count]) => (
              <div key={folder} className="flex items-center justify-between py-1">
                <span className="text-xs" style={{ color: 'var(--on-surface)' }}>{folder || 'General'}</span>
                <span className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{count} accesos</span>
              </div>
            ))}
          </div>
          {dataroom.recent_activity.length > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--surface-1)' }}>
              <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--outline)' }}>ACTIVIDAD RECIENTE</p>
              {dataroom.recent_activity.map((a, i) => (
                <div key={i} className="flex items-center gap-2 py-1 text-[10px]" style={{ color: 'var(--outline)' }}>
                  {a.action === 'DOWNLOAD' ? <Download size={9} /> : <Eye size={9} />}
                  <span>{a.folder || 'General'}</span>
                  <span className="ml-auto">{fmtDate(a.date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline / Milestones */}
      {milestones.length > 0 && (
        <div className="p-5 mb-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
          <p className="text-[9px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--outline)' }}>HITOS DEL PROCESO</p>
          <div className="space-y-3">
            {milestones.map((m, i) => {
              const mc = milestoneIcons[m.type] || { icon: Clock, color: 'var(--outline)' };
              const Icon = mc.icon;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 flex items-center justify-center shrink-0" style={{ background: `${mc.color}12` }}>
                    <Icon size={12} style={{ color: mc.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{m.event}</p>
                  </div>
                  <span className="text-[10px] shrink-0" style={{ color: 'var(--outline)' }}>{fmtDate(m.date)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NDA + Q&A status */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 1px 4px rgba(25,28,30,0.03)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={12} style={{ color: nda.signed ? '#16a34a' : 'var(--outline)' }} />
            <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>NDA</p>
          </div>
          <p className="text-xs font-bold" style={{ color: nda.signed ? '#16a34a' : 'var(--outline)' }}>
            {nda.signed ? `Firmado el ${fmtDate(nda.signed_at)}` : 'No firmado'}
          </p>
        </div>
        <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 1px 4px rgba(25,28,30,0.03)' }}>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare size={12} style={{ color: qa.conversation_id ? '#006493' : 'var(--outline)' }} />
            <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--outline)' }}>Q&A</p>
          </div>
          {qa.conversation_id ? (
            <Link to={`/qa/${qa.conversation_id}`} className="text-xs font-bold" style={{ color: '#006493' }}>
              {qa.messages_count} mensajes · Abrir
            </Link>
          ) : (
            <p className="text-xs" style={{ color: 'var(--outline)' }}>Sin conversación activa</p>
          )}
        </div>
      </div>

      {/* Conditions */}
      {engagement?.conditions && (
        <div className="p-4 mb-5" style={{ background: 'var(--surface-1)' }}>
          <p className="text-[9px] font-bold uppercase mb-1" style={{ color: 'var(--outline)' }}>CONDICIONES DE LA OFERTA</p>
          <p className="text-xs" style={{ color: 'var(--on-surface)', lineHeight: 1.5 }}>{engagement.conditions}</p>
        </div>
      )}
    </div>
  );
};

export default BuyerActivityPanel;
