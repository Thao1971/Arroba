import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { engagementsAPI } from '../services/api';
import { fmtMillions } from '../utils/formatES';
import {
  Loader2, Shield, Zap, Target,
  FolderOpen, Eye, Download, MessageSquare, Award, ArrowLeft,
  AlertTriangle, CheckCircle2, TrendingUp, FileSignature, Clock
} from 'lucide-react';

/* ─── Configuración ─── */
const nivelCert = {
  certified: { texto: 'Certificado', color: '#16a34a' },
  verified: { texto: 'Verificado', color: '#d97706' },
  basic: { texto: 'Básico', color: 'var(--outline)' },
};
const colorIntencion = { alta: '#16a34a', media: '#d97706', baja: 'var(--outline)' };
const iconoHito = {
  interest: { icon: TrendingUp, color: 'var(--arroba-secondary)' },
  viewed: { icon: Eye, color: '#d97706' },
  loi: { icon: FileSignature, color: 'var(--arroba-primary)' },
  shortlist: { icon: Shield, color: '#16a34a' },
  nda: { icon: Shield, color: '#4f46e5' },
};
const etiquetaSeccion = { deal_page: 'Ficha del deal', infomemo: 'Infomemo', data_room: 'Data Room' };
const fmtEur = (v) => fmtMillions(v);
const fmtFecha = (d) => d ? new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' }) : '—';
const fmtMin = (m) => { if (!m || m < 1) return '< 1 min'; if (m < 60) return `${Math.round(m)} min`; return `${Math.floor(m / 60)}h ${Math.round(m % 60)}m`; };

/* ═══════════════════════════════════════════
   PANEL DE ACTIVIDAD DEL BUYER
   Replica la arquitectura visual del Buyer Dashboard:
   - Header (eyebrow + h1 + subtítulo)
   - flex gap-8 (contenido flex-1 + rail w-[260px])
   ═══════════════════════════════════════════ */
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
    return <div className="flex items-center justify-center py-16"><Loader2 size={18} className="animate-spin" style={{ color: 'var(--outline)' }} /></div>;
  }
  if (!data) {
    return <div className="p-8 text-center" style={{ background: 'var(--surface-lowest)' }}><p className="text-sm" style={{ color: 'var(--outline)' }}>No se pudo cargar la actividad.</p></div>;
  }

  const { buyer, engagement, intent, time, dataroom, nda, qa, milestones, risks } = data;
  const cert = nivelCert[buyer.certification_level] || nivelCert.basic;
  const hitosVisibles = milestones.filter(m => m.type !== 'accepted');

  return (
    <div data-testid="buyer-activity-panel">

      {/* ── HEADER (misma estructura que BuyerDashboard) ── */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          {onClose && (
            <button onClick={onClose} className="flex items-center gap-1.5 mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--outline)' }} data-testid="activity-back-btn">
              <ArrowLeft size={12} /> VOLVER AL COMPARADOR
            </button>
          )}
          <p className="label-arroba mb-2" style={{ color: 'var(--arroba-primary)' }}>ACTIVIDAD DEL COMPRADOR</p>
          <h1 className="text-3xl font-extrabold" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>
            {buyer.name}
          </h1>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold" style={{ background: `${cert.color}12`, color: cert.color }}>
              <Award size={9} /> {cert.texto}
            </span>
            {buyer.buyer_type && <span className="text-sm" style={{ color: 'var(--outline)' }}>{buyer.buyer_type}</span>}
            {buyer.company && <span className="text-sm" style={{ color: 'var(--outline)' }}>· {buyer.company}</span>}
            {engagement?.stage && (
              <span className="px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--surface-1)', color: 'var(--on-surface)' }}>
                {engagement.stage}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── ALERTAS ── */}
      {risks.length > 0 && (
        <div className="space-y-2 mb-6">
          {risks.map((r, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4"
              style={{ background: r.severity === 'warning' ? 'rgba(217,119,6,0.04)' : 'var(--surface-1)', borderLeft: `3px solid ${r.severity === 'warning' ? '#d97706' : 'var(--outline)'}` }}>
              <div className="flex items-center gap-3">
                <AlertTriangle size={14} style={{ color: r.severity === 'warning' ? '#d97706' : 'var(--outline)' }} />
                <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{r.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── KPIs (misma grid 3 cols que BuyerDashboard) ── */}
      <div className="grid grid-cols-3 gap-3 mb-8" data-testid="activity-kpis">
        {[
          { label: 'OFERTA', valor: fmtEur(engagement?.valuation_offer), color: 'var(--arroba-primary)' },
          { label: 'ESTRUCTURA', valor: engagement?.structure === 'cash' ? '100% cash' : engagement?.structure === 'mixed' ? 'Mixta' : engagement?.structure || '—' },
          { label: 'INTENCIÓN', valor: intent.score, sub: intent.label, color: colorIntencion[intent.level] },
          { label: 'TIEMPO TOTAL', valor: fmtMin(time.total_minutes), sub: `${time.sessions_count} sesiones` },
          { label: 'DATA ROOM', valor: `${dataroom.total_downloads} descargas`, sub: `${dataroom.total_views} vistas` },
          { label: 'Q&A', valor: `${qa.messages_count} mensajes` },
        ].map((kpi, i) => (
          <div key={i} className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 1px 4px rgba(25,28,30,0.03)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--outline)' }}>{kpi.label}</p>
            </div>
            <p className="text-lg font-black" style={{ color: kpi.color || 'var(--on-surface)', letterSpacing: '-0.02em' }}>{kpi.valor}</p>
            {kpi.sub && <p className="text-[10px]" style={{ color: kpi.color || 'var(--outline)' }}>{kpi.sub}</p>}
          </div>
        ))}
      </div>

      {/* ── CONTENT + RAIL (misma estructura flex gap-8) ── */}
      <div className="flex gap-8">

        {/* CENTRO: contenido principal (flex-1 min-w-0) */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Actividad por sección */}
          <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }} data-testid="actividad-secciones">
            <p className="label-arroba mb-4" style={{ color: 'var(--outline)' }}>ACTIVIDAD POR SECCIÓN</p>
            <div className="space-y-3">
              {Object.entries(time.by_section).map(([seccion, minutos]) => {
                const pct = time.total_minutes > 0 ? Math.round((minutos / time.total_minutes) * 100) : 0;
                return (
                  <div key={seccion}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold" style={{ color: 'var(--on-surface)' }}>{etiquetaSeccion[seccion] || seccion}</span>
                      <span className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{fmtMin(minutos)}</span>
                    </div>
                    <div className="w-full h-1.5" style={{ background: 'var(--surface-2)' }}>
                      <div className="h-full" style={{ background: 'var(--arroba-primary)', width: `${pct}%`, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Data Room en profundidad */}
          {(dataroom.total_views > 0 || dataroom.total_downloads > 0) && (
            <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }} data-testid="dataroom-depth">
              <p className="label-arroba mb-4" style={{ color: 'var(--outline)' }}>DATA ROOM EN PROFUNDIDAD</p>
              {Object.keys(dataroom.by_folder).length > 0 && (
                <div className="space-y-1.5 mb-4">
                  {Object.entries(dataroom.by_folder).map(([carpeta, accesos]) => (
                    <div key={carpeta} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid var(--surface-1)' }}>
                      <span className="text-xs font-semibold" style={{ color: 'var(--on-surface)' }}>
                        {carpeta && carpeta !== 'null' ? carpeta.charAt(0).toUpperCase() + carpeta.slice(1) : 'General'}
                      </span>
                      <span className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{accesos}</span>
                    </div>
                  ))}
                </div>
              )}
              {dataroom.recent_activity.length > 0 && (
                <div>
                  <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>ACTIVIDAD RECIENTE</p>
                  {dataroom.recent_activity.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 text-xs" style={{ color: 'var(--outline)' }}>
                      {a.action === 'DOWNLOAD' ? <Download size={10} style={{ color: 'var(--arroba-primary)' }} /> : <Eye size={10} />}
                      <span className="font-semibold" style={{ color: 'var(--on-surface)' }}>
                        {a.folder && a.folder !== 'null' ? a.folder.charAt(0).toUpperCase() + a.folder.slice(1) : 'General'}
                      </span>
                      <span className="ml-auto">{fmtFecha(a.date)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Condiciones de la oferta */}
          {engagement?.conditions && (
            <div className="p-5" style={{ background: 'var(--surface-1)' }}>
              <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>CONDICIONES DE LA OFERTA</p>
              <p className="text-xs" style={{ color: 'var(--on-surface)', lineHeight: 1.6 }}>{engagement.conditions}</p>
            </div>
          )}
        </div>

        {/* RAIL DERECHO (w-[260px] shrink-0 — misma anchura que BuyerDashboard) */}
        <div className="w-[260px] shrink-0 space-y-5">

          {/* Hitos del proceso */}
          {hitosVisibles.length > 0 && (
            <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }} data-testid="hitos-proceso">
              <p className="label-arroba mb-4" style={{ color: 'var(--outline)' }}>HITOS DEL PROCESO</p>
              <div className="space-y-3">
                {hitosVisibles.map((h, i) => {
                  const ic = iconoHito[h.type] || { icon: Clock, color: 'var(--outline)' };
                  const Icon = ic.icon;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${ic.color}12` }}>
                        <Icon size={11} style={{ color: ic.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{h.event}</p>
                        <p className="text-[10px]" style={{ color: 'var(--outline)' }}>{fmtFecha(h.date)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Estado */}
          <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }} data-testid="estado-buyer">
            <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>ESTADO</p>
            <div className="space-y-3">
              <div className="flex items-center gap-2 py-2" style={{ borderBottom: '1px solid var(--surface-1)' }}>
                <Shield size={12} style={{ color: nda.signed ? '#16a34a' : 'var(--outline)' }} />
                <div>
                  <p className="text-xs font-bold" style={{ color: nda.signed ? '#16a34a' : 'var(--outline)' }}>
                    {nda.signed ? 'NDA firmado' : 'NDA pendiente'}
                  </p>
                  {nda.signed && <p className="text-[10px]" style={{ color: 'var(--outline)' }}>{fmtFecha(nda.signed_at)}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 py-2" style={{ borderBottom: '1px solid var(--surface-1)' }}>
                <MessageSquare size={12} style={{ color: qa.conversation_id ? 'var(--arroba-secondary)' : 'var(--outline)' }} />
                <div className="flex-1">
                  <p className="text-xs font-bold" style={{ color: qa.conversation_id ? 'var(--on-surface)' : 'var(--outline)' }}>
                    {qa.conversation_id ? `${qa.messages_count} mensajes en Q&A` : 'Sin conversación'}
                  </p>
                </div>
                {qa.conversation_id && (
                  <Link to={`/qa/${qa.conversation_id}`} className="text-[10px] font-bold" style={{ color: 'var(--arroba-secondary)' }}>Abrir</Link>
                )}
              </div>
            </div>
          </div>

          {/* Soporte */}
          <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
            <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>ACCIONES</p>
            <Link to={`/explorar/${dealId}`} className="text-xs font-semibold flex items-center gap-1 mb-2" style={{ color: 'var(--arroba-primary)' }}>
              Ver ficha del deal <TrendingUp size={10} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerActivityPanel;
