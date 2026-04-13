import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import { fmtES, fmtMillions } from '../utils/formatES';
import {
  Shield, Users, FileText, BarChart3, Check, X, AlertTriangle, Flag,
  Loader2, ChevronRight, Lock, Unlock, Star, Eye, Search, Settings,
  MessageSquare, FolderOpen, Activity, Layers, Mail, HelpCircle,
  Database, Key, Scale, Clock, TrendingUp, Edit3, Save, ChevronDown
} from 'lucide-react';

const NAV = [
  { id: 'overview', path: '/admin/overview', label: 'Salud plataforma', icon: Activity, section: null },
  { id: 'deals', path: '/admin/deals', label: 'Moderacion Deals', icon: FileText, section: null },
  { id: 'users', path: '/admin/users', label: 'Gestion Usuarios', icon: Users, section: null },
  { id: 'sep1', type: 'separator', label: 'PRODUCTO' },
  { id: 'taxonomy', path: '/admin/product/taxonomy', label: 'Taxonomia y multiplos', icon: Layers, section: 'product' },
  { id: 'pricing', path: '/admin/product/pricing', label: 'Planes y pricing', icon: TrendingUp, section: 'product' },
  { id: 'integrations', path: '/admin/product/integrations', label: 'Integraciones', icon: Database, section: 'product' },
  { id: 'sep2', type: 'separator', label: 'COMUNICACIONES' },
  { id: 'comms', path: '/admin/comms/communications', label: 'Emails y logs', icon: Mail, section: 'comms' },
  { id: 'tickets', path: '/admin/comms/tickets', label: 'Soporte', icon: HelpCircle, section: 'comms' },
  { id: 'sep3', type: 'separator', label: 'CONTROL' },
  { id: 'data-audit', path: '/admin/control/data-audit', label: 'Integridad datos', icon: Database, section: 'control' },
  { id: 'sep4', type: 'separator', label: 'CONFIANZA' },
  { id: 'permissions', path: '/admin/trust/permissions', label: 'Permisos', icon: Key, section: 'trust' },
  { id: 'legal', path: '/admin/trust/legal-dataroom', label: 'NDAs y Data Room', icon: Scale, section: 'trust' },
];

/* ═══════════════════════════════════════════════════════════════
   OVERVIEW — Platform Health
   ═══════════════════════════════════════════════════════════════ */
const OverviewSection = () => {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/admin/health')])
      .then(([s, h]) => { setStats(s.data); setHealth(h.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader2 size={16} className="animate-spin mx-auto mt-12" />;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'DEALS', value: stats?.deals?.total, sub: `${stats?.deals?.published} pub · ${stats?.deals?.draft} draft` },
          { label: 'USUARIOS', value: stats?.users?.total, sub: `${stats?.users?.buyers} buyers · ${stats?.users?.sellers} sellers` },
          { label: 'NDAs FIRMADOS', value: stats?.activity?.ndas, sub: `${stats?.activity?.contacts} contactos` },
          { label: 'ENGAGEMENTS', value: stats?.activity?.engagements },
        ].map((kpi, i) => (
          <div key={i} className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
            <p className="text-[9px] font-bold mb-1" style={{ color: 'var(--outline)' }}>{kpi.label}</p>
            <p className="text-2xl font-black" style={{ color: 'var(--on-surface)' }}>{kpi.value || 0}</p>
            {kpi.sub && <p className="text-[10px] mt-1" style={{ color: 'var(--outline)' }}>{kpi.sub}</p>}
          </div>
        ))}
      </div>

      {/* Funnel */}
      {health?.funnel && (
        <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
          <p className="label-arroba mb-4" style={{ color: 'var(--outline)' }}>FUNNEL DE CONVERSION</p>
          <div className="flex items-end gap-3">
            {[
              { label: 'Registrados', value: health.funnel.registered, color: 'var(--surface-2)' },
              { label: 'Contactaron', value: health.funnel.contacted, color: 'var(--outline)' },
              { label: 'NDA firmado', value: health.funnel.nda_signed, color: 'var(--arroba-primary)' },
              { label: 'LOI enviada', value: health.funnel.loi_sent, color: '#16a34a' },
            ].map((step, i) => {
              const maxH = 120;
              const h = health.funnel.registered > 0 ? Math.max(20, (step.value / health.funnel.registered) * maxH) : 20;
              return (
                <div key={i} className="flex-1 text-center">
                  <div className="mx-auto mb-2" style={{ height: h, background: step.color, width: '100%' }} />
                  <p className="text-lg font-black" style={{ color: 'var(--on-surface)' }}>{step.value}</p>
                  <p className="text-[9px] font-bold" style={{ color: 'var(--outline)' }}>{step.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Alerts grid */}
      <div className="grid grid-cols-2 gap-4">
        <AlertCard icon={Clock} color="#d97706" title="Deals estancados" count={health?.stale_deals_count} description={`Deals publicados sin actividad >7 dias`} items={health?.stale_deals?.slice(0, 3)?.map(d => d.title)} />
        <AlertCard icon={AlertTriangle} color="#dc2626" title="Contactos sin responder" count={health?.unanswered_count} description="Solicitudes pendientes >48h" items={health?.unanswered_contacts?.slice(0, 3)?.map(c => c.deal_id)} />
        <AlertCard icon={Shield} color="var(--arroba-primary)" title="NDAs pendientes" count={health?.pending_nda_count} description="Contacto aceptado sin NDA >7 dias" items={health?.pending_nda?.slice(0, 3)?.map(n => n.deal_id)} />
        <AlertCard icon={Users} color="var(--outline)" title="Buyers Free estancados" count={health?.free_stuck?.count} description={`${health?.free_stuck?.pct || 0}% de buyers no avanzan de Free`} />
      </div>

      {/* Incomplete sellers */}
      {health?.incomplete_sellers?.length > 0 && (
        <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
          <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>SELLERS CON WORKSPACE INCOMPLETO</p>
          {health.incomplete_sellers.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--surface-2)' }}>
              <span className="text-xs" style={{ color: 'var(--on-surface)' }}>{s.seller}</span>
              <span className="text-[10px] font-bold" style={{ color: s.readiness >= 60 ? '#d97706' : '#dc2626' }}>{s.readiness}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AlertCard = ({ icon: Icon, color, title, count, description, items }) => (
  <div className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
    <div className="flex items-center gap-2 mb-2">
      <Icon size={14} style={{ color }} />
      <span className="text-[10px] font-bold" style={{ color }}>{count || 0}</span>
      <span className="text-[10px] font-bold" style={{ color: 'var(--on-surface)' }}>{title}</span>
    </div>
    <p className="text-[10px] mb-2" style={{ color: 'var(--outline)' }}>{description}</p>
    {items?.length > 0 && <div className="space-y-1">{items.map((t, i) => <p key={i} className="text-[9px] truncate" style={{ color: 'var(--outline)' }}>{t}</p>)}</div>}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   DEALS MODERATION (existing, refactored)
   ═══════════════════════════════════════════════════════════════ */
const DealsSection = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { api.get('/admin/deals' + (filter ? `?status=${filter}` : '')).then(r => setDeals(r.data)).finally(() => setLoading(false)); }, [filter]);

  const approve = async (id) => { setActionLoading(id); await api.post(`/admin/deals/${id}/approve`); setDeals(d => d.map(x => x.deal_id === id ? { ...x, status: 'published' } : x)); setActionLoading(null); };
  const reject = async () => { if (!rejectId) return; setActionLoading(rejectId); await api.post(`/admin/deals/${rejectId}/reject`, { reason: rejectReason }); setDeals(d => d.map(x => x.deal_id === rejectId ? { ...x, status: 'draft' } : x)); setRejectId(null); setRejectReason(''); setActionLoading(null); };

  if (loading) return <Loader2 size={16} className="animate-spin mx-auto mt-12" />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {['', 'draft', 'published', 'exclusivity'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className="px-3 py-1.5 text-[10px] font-bold" style={{ background: filter === s ? 'var(--on-surface)' : 'var(--surface-2)', color: filter === s ? '#fff' : 'var(--on-surface)' }}>{s || 'TODOS'}</button>
        ))}
      </div>
      {deals.map(d => (
        <div key={d.deal_id} className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-bold px-2 py-0.5" style={{ background: d.status === 'published' ? 'rgba(22,163,74,0.06)' : 'rgba(217,119,6,0.06)', color: d.status === 'published' ? '#16a34a' : '#d97706' }}>{d.status?.toUpperCase()}</span>
                <span className="text-[9px] font-bold" style={{ color: d.quality_score >= 80 ? '#16a34a' : '#d97706' }}>{d.quality_score}%</span>
              </div>
              <p className="text-sm font-bold">{d.title}</p>
              <p className="text-[10px]" style={{ color: 'var(--outline)' }}>{d.seller_name} · {d.company_name}</p>
            </div>
            <div className="text-right">
              {d.asking_price && <p className="text-sm font-black" style={{ color: 'var(--arroba-primary)' }}>{fmtMillions(d.asking_price)}</p>}
              <p className="text-[9px]" style={{ color: 'var(--outline)' }}>{d.engagement_count} LOIs · {d.nda_count} NDAs</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mb-2">{Object.entries(d.quality_checklist).map(([k, v]) => <span key={k} className="text-[8px] font-bold px-1.5 py-0.5" style={{ background: v ? 'rgba(22,163,74,0.06)' : 'rgba(220,38,38,0.06)', color: v ? '#16a34a' : '#dc2626' }}>{v ? '✓' : '✗'} {k.replace('has_', '').replace(/_/g, ' ').toUpperCase()}</span>)}</div>
          {d.flags?.map((f, i) => <p key={i} className="text-[10px] flex items-center gap-1 mb-1" style={{ color: '#dc2626' }}><AlertTriangle size={10} />{f.message}</p>)}
          <div className="flex gap-2 mt-2">
            {d.status === 'draft' && <button onClick={() => approve(d.deal_id)} disabled={actionLoading === d.deal_id} className="px-3 py-1.5 text-[10px] font-bold disabled:opacity-50" style={{ background: '#16a34a', color: '#fff' }}>{actionLoading === d.deal_id ? '...' : '✓ APROBAR'}</button>}
            <button onClick={() => setRejectId(d.deal_id)} className="px-3 py-1.5 text-[10px] font-bold" style={{ background: 'var(--surface-2)' }}>✗ RECHAZAR</button>
            <a href={`/explorar/${d.deal_id}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 text-[10px] font-bold" style={{ background: 'var(--surface-2)' }}>PREVIEW</a>
          </div>
          {rejectId === d.deal_id && (
            <div className="mt-2 p-3" style={{ background: 'var(--surface-1)' }}>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Motivo..." rows={2} className="input-arroba w-full resize-none mb-2" />
              <div className="flex gap-2"><button onClick={reject} className="px-3 py-1.5 text-[10px] font-bold" style={{ background: '#dc2626', color: '#fff' }}>CONFIRMAR</button><button onClick={() => setRejectId(null)} className="px-3 py-1.5 text-[10px] font-bold" style={{ background: 'var(--surface-2)' }}>CANCELAR</button></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   USERS MANAGEMENT (existing, refactored)
   ═══════════════════════════════════════════════════════════════ */
const UsersSection = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [planModal, setPlanModal] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('');

  useEffect(() => { api.get('/admin/users' + (roleFilter ? `?role=${roleFilter}` : '')).then(r => setUsers(r.data)).finally(() => setLoading(false)); }, [roleFilter]);

  const changePlan = async () => { if (!planModal || !selectedPlan) return; await api.put(`/admin/users/${planModal}/plan`, { plan_type: selectedPlan }); setUsers(u => u.map(x => x.user_id === planModal ? { ...x, plan: selectedPlan } : x)); setPlanModal(null); };
  const toggleActive = async (uid, current) => { await api.put(`/admin/users/${uid}/status`, { is_active: !current }); setUsers(u => u.map(x => x.user_id === uid ? { ...x, is_active: !current } : x)); };

  const filtered = users.filter(u => !search || u.email?.includes(search) || u.first_name?.toLowerCase().includes(search.toLowerCase()));
  if (loading) return <Loader2 size={16} className="animate-spin mx-auto mt-12" />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-2">{['', 'buyer', 'seller', 'advisor', 'admin'].map(r => <button key={r} onClick={() => setRoleFilter(r)} className="px-3 py-1.5 text-[10px] font-bold" style={{ background: roleFilter === r ? 'var(--on-surface)' : 'var(--surface-2)', color: roleFilter === r ? '#fff' : 'var(--on-surface)' }}>{r || 'TODOS'}</button>)}</div>
      <div className="flex items-center gap-2 px-3 py-2" style={{ background: 'var(--surface-1)' }}><Search size={12} style={{ color: 'var(--outline)' }} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="bg-transparent text-xs outline-none flex-1" /></div>
      <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr style={{ borderBottom: '2px solid var(--surface-2)' }}><th className="text-left py-2 font-bold" style={{ color: 'var(--outline)' }}>USUARIO</th><th className="text-left py-2 font-bold" style={{ color: 'var(--outline)' }}>ROL</th><th className="text-left py-2 font-bold" style={{ color: 'var(--outline)' }}>PLAN</th><th className="text-center py-2 font-bold" style={{ color: 'var(--outline)' }}>NDAS</th><th className="text-center py-2 font-bold" style={{ color: 'var(--outline)' }}>ACTIVIDAD</th><th className="text-right py-2 font-bold" style={{ color: 'var(--outline)' }}>ACCIONES</th></tr></thead><tbody>
        {filtered.map(u => (
          <tr key={u.user_id} style={{ borderBottom: '1px solid var(--surface-2)', opacity: u.is_active ? 1 : 0.5 }}>
            <td className="py-2"><p className="font-bold">{u.first_name} {u.last_name}</p><p className="text-[10px]" style={{ color: 'var(--outline)' }}>{u.email}</p></td>
            <td><span className="text-[9px] font-bold px-2 py-0.5" style={{ background: 'var(--surface-2)' }}>{u.role?.toUpperCase()}</span></td>
            <td><span className="text-[9px] font-bold px-2 py-0.5" style={{ background: u.plan?.includes('pro') ? 'rgba(182,33,42,0.06)' : 'var(--surface-2)', color: u.plan?.includes('pro') ? 'var(--arroba-primary)' : 'var(--outline)' }}>{u.plan?.toUpperCase() || 'FREE'}</span></td>
            <td className="text-center">{u.stats?.ndas || 0}</td>
            <td className="text-center">{(u.stats?.engagements || 0) + (u.stats?.contacts || 0)}</td>
            <td className="text-right"><div className="flex gap-1 justify-end"><button onClick={() => { setPlanModal(u.user_id); setSelectedPlan(u.plan || 'free'); }} className="px-2 py-1 text-[9px] font-bold" style={{ background: 'var(--surface-2)' }}>PLAN</button><button onClick={() => toggleActive(u.user_id, u.is_active)} className="px-2 py-1 text-[9px] font-bold" style={{ background: u.is_active ? 'rgba(220,38,38,0.06)' : 'rgba(22,163,74,0.06)', color: u.is_active ? '#dc2626' : '#16a34a' }}>{u.is_active ? 'DESACTIVAR' : 'ACTIVAR'}</button></div></td>
          </tr>
        ))}
      </tbody></table></div>
      {planModal && <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }}><div className="p-5 w-80" style={{ background: 'var(--surface-lowest)' }}><p className="label-arroba mb-3">CAMBIAR PLAN</p><select value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)} className="input-arroba w-full mb-3"><option value="free">Free</option><option value="buyer_pro">Buyer Pro</option><option value="buyer_proplus">Buyer Pro+</option><option value="seller_plus">Seller Plus</option><option value="seller_premium">Seller Premium</option></select><div className="flex gap-2"><button onClick={changePlan} className="px-4 py-2 text-[10px] font-bold" style={{ background: 'var(--on-surface)', color: '#fff' }}>GUARDAR</button><button onClick={() => setPlanModal(null)} className="px-4 py-2 text-[10px] font-bold" style={{ background: 'var(--surface-2)' }}>CANCELAR</button></div></div></div>}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   TAXONOMY & MULTIPLES
   ═══════════════════════════════════════════════════════════════ */
const TaxonomySection = () => {
  const [multiples, setMultiples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { api.get('/admin/taxonomy/multiples').then(r => setMultiples(r.data)).finally(() => setLoading(false)); }, []);

  const startEdit = (m) => { setEditing(m.scope_id); setEditValues({ multiple_min: m.multiple_min, multiple_mid: m.multiple_mid, multiple_max: m.multiple_max }); };
  const saveEdit = async (scopeId) => {
    await api.put(`/admin/taxonomy/multiples/${scopeId}`, editValues);
    setMultiples(prev => prev.map(m => m.scope_id === scopeId ? { ...m, ...editValues } : m));
    setEditing(null);
  };
  const loadHistory = async () => { const r = await api.get('/admin/taxonomy/multiples/history'); setHistory(r.data); setShowHistory(true); };

  if (loading) return <Loader2 size={16} className="animate-spin mx-auto mt-12" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>10 categorias MadTech con multiplos de valoracion</p>
        <button onClick={loadHistory} className="text-[10px] font-bold" style={{ color: 'var(--arroba-primary)' }}>VER HISTORIAL</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr style={{ borderBottom: '2px solid var(--surface-2)' }}>
            <th className="text-left py-2 font-bold" style={{ color: 'var(--outline)' }}>CATEGORIA</th>
            <th className="text-center py-2 font-bold" style={{ color: 'var(--outline)' }}>MIN</th>
            <th className="text-center py-2 font-bold" style={{ color: 'var(--outline)' }}>MID</th>
            <th className="text-center py-2 font-bold" style={{ color: 'var(--outline)' }}>MAX</th>
            <th className="text-center py-2 font-bold" style={{ color: 'var(--outline)' }}>FUENTE</th>
            <th className="text-right py-2 font-bold" style={{ color: 'var(--outline)' }}>ACCIONES</th>
          </tr></thead>
          <tbody>
            {multiples.map(m => (
              <tr key={m.scope_id} style={{ borderBottom: '1px solid var(--surface-2)' }}>
                <td className="py-3"><p className="font-bold" style={{ color: 'var(--on-surface)' }}>{m.scope_name}</p><p className="text-[9px]" style={{ color: 'var(--outline)' }}>{m.scope_id}</p></td>
                {editing === m.scope_id ? (
                  <>
                    <td className="text-center"><input type="number" step="0.1" value={editValues.multiple_min} onChange={e => setEditValues(p => ({ ...p, multiple_min: parseFloat(e.target.value) }))} className="input-arroba w-16 text-center" /></td>
                    <td className="text-center"><input type="number" step="0.1" value={editValues.multiple_mid} onChange={e => setEditValues(p => ({ ...p, multiple_mid: parseFloat(e.target.value) }))} className="input-arroba w-16 text-center" /></td>
                    <td className="text-center"><input type="number" step="0.1" value={editValues.multiple_max} onChange={e => setEditValues(p => ({ ...p, multiple_max: parseFloat(e.target.value) }))} className="input-arroba w-16 text-center" /></td>
                  </>
                ) : (
                  <>
                    <td className="text-center font-bold">{m.multiple_min}x</td>
                    <td className="text-center font-black" style={{ color: 'var(--arroba-primary)' }}>{m.multiple_mid}x</td>
                    <td className="text-center font-bold">{m.multiple_max}x</td>
                  </>
                )}
                <td className="text-center text-[9px]" style={{ color: 'var(--outline)' }}>{m.source}</td>
                <td className="text-right">
                  {editing === m.scope_id ? (
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => saveEdit(m.scope_id)} className="px-2 py-1 text-[9px] font-bold" style={{ background: '#16a34a', color: '#fff' }}><Save size={9} /> GUARDAR</button>
                      <button onClick={() => setEditing(null)} className="px-2 py-1 text-[9px] font-bold" style={{ background: 'var(--surface-2)' }}>CANCELAR</button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(m)} className="px-2 py-1 text-[9px] font-bold" style={{ background: 'var(--surface-2)' }}><Edit3 size={9} /> EDITAR</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showHistory && history.length > 0 && (
        <div className="p-4" style={{ background: 'var(--surface-1)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="label-arroba" style={{ color: 'var(--outline)' }}>HISTORIAL DE CAMBIOS</p>
            <button onClick={() => setShowHistory(false)} className="text-[10px] font-bold" style={{ color: 'var(--outline)' }}>CERRAR</button>
          </div>
          {history.map((h, i) => (
            <div key={i} className="py-2 text-[10px]" style={{ borderBottom: '1px solid var(--surface-2)' }}>
              <span className="font-bold">{h.scope_id}</span> · {h.changed_by} · {new Date(h.changed_at).toLocaleDateString('es-ES')}
              <span className="ml-2" style={{ color: 'var(--outline)' }}>
                {Object.entries(h.old_values || {}).map(([k,v]) => `${k}: ${v}`).join(', ')} → {Object.entries(h.new_values || {}).map(([k,v]) => `${k}: ${v}`).join(', ')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   NDA & LEGAL
   ═══════════════════════════════════════════════════════════════ */
const LegalSection = () => {
  const [ndas, setNdas] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/admin/ndas').then(r => setNdas(r.data)).finally(() => setLoading(false)); }, []);
  if (loading) return <Loader2 size={16} className="animate-spin mx-auto mt-12" />;
  return (
    <div>
      <p className="text-sm font-bold mb-4" style={{ color: 'var(--on-surface)' }}>{ndas.length} NDAs firmados</p>
      <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr style={{ borderBottom: '2px solid var(--surface-2)' }}><th className="text-left py-2 font-bold" style={{ color: 'var(--outline)' }}>FIRMANTE</th><th className="text-left py-2 font-bold" style={{ color: 'var(--outline)' }}>DEAL</th><th className="text-left py-2 font-bold" style={{ color: 'var(--outline)' }}>FECHA</th><th className="text-left py-2 font-bold" style={{ color: 'var(--outline)' }}>ESTADO</th></tr></thead><tbody>
        {ndas.map(n => (
          <tr key={n.signature_id} style={{ borderBottom: '1px solid var(--surface-2)' }}>
            <td className="py-2"><p className="font-bold">{n.signer_name}</p><p className="text-[10px]" style={{ color: 'var(--outline)' }}>{n.signer_email} · {n.signer_company}</p></td>
            <td>{n.deal_id}</td>
            <td>{n.signed_at ? new Date(n.signed_at).toLocaleDateString('es-ES') : '—'}</td>
            <td><span className="text-[9px] font-bold px-2 py-0.5" style={{ background: 'rgba(22,163,74,0.06)', color: '#16a34a' }}>{n.status?.toUpperCase()}</span></td>
          </tr>
        ))}
      </tbody></table></div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   COMMS LOG
   ═══════════════════════════════════════════════════════════════ */
const CommsSection = () => {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/admin/notifications/log').then(r => setNotifs(r.data)).finally(() => setLoading(false)); }, []);
  if (loading) return <Loader2 size={16} className="animate-spin mx-auto mt-12" />;
  return (
    <div>
      <p className="text-sm font-bold mb-4" style={{ color: 'var(--on-surface)' }}>Ultimas {notifs.length} notificaciones</p>
      {notifs.map((n, i) => (
        <div key={i} className="py-2 flex items-center gap-3" style={{ borderBottom: '1px solid var(--surface-2)' }}>
          <span className="text-[9px] font-bold px-2 py-0.5" style={{ background: 'var(--surface-2)' }}>{n.type}</span>
          <span className="text-xs flex-1" style={{ color: 'var(--on-surface)' }}>{n.title}</span>
          <span className="text-[9px]" style={{ color: 'var(--outline)' }}>{n.user_id}</span>
          <span className="text-[9px]" style={{ color: 'var(--outline)' }}>{n.created_at ? new Date(n.created_at).toLocaleDateString('es-ES') : ''}</span>
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PLANS & PRICING
   ═══════════════════════════════════════════════════════════════ */
const PricingSection = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editVals, setEditVals] = useState({});

  useEffect(() => { api.get('/admin/plans').then(r => setData(r.data)).finally(() => setLoading(false)); }, []);

  const startEdit = (p) => { setEditing(p.plan_id); setEditVals({ monthly_price: p.monthly_price, annual_price: p.annual_price, monthly_interaction_limit: p.monthly_interaction_limit, is_active: p.is_active }); };
  const saveEdit = async (planId) => {
    await api.put(`/admin/plans/${planId}`, editVals);
    setData(prev => ({ ...prev, plans: prev.plans.map(p => p.plan_id === planId ? { ...p, ...editVals } : p) }));
    setEditing(null);
  };

  if (loading) return <Loader2 size={16} className="animate-spin mx-auto mt-12" />;

  const plans = data?.plans || [];
  const fees = data?.fee_rules || [];
  const byRole = { seller: plans.filter(p => p.role_type === 'seller'), buyer: plans.filter(p => p.role_type === 'buyer'), advisor: plans.filter(p => p.role_type === 'advisor') };

  return (
    <div className="space-y-6">
      {Object.entries(byRole).map(([role, rolePlans]) => (
        <div key={role}>
          <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>{role.toUpperCase()}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs"><thead><tr style={{ borderBottom: '2px solid var(--surface-2)' }}>
              <th className="text-left py-2 font-bold" style={{ color: 'var(--outline)' }}>PLAN</th>
              <th className="text-center py-2 font-bold" style={{ color: 'var(--outline)' }}>PRECIO/MES</th>
              <th className="text-center py-2 font-bold" style={{ color: 'var(--outline)' }}>PRECIO/AÑO</th>
              <th className="text-center py-2 font-bold" style={{ color: 'var(--outline)' }}>INTERACCIONES</th>
              <th className="text-center py-2 font-bold" style={{ color: 'var(--outline)' }}>COMISION</th>
              <th className="text-center py-2 font-bold" style={{ color: 'var(--outline)' }}>ACTIVO</th>
              <th className="text-right py-2 font-bold" style={{ color: 'var(--outline)' }}>ACCIONES</th>
            </tr></thead><tbody>
              {rolePlans.map(p => (
                <tr key={p.plan_id} style={{ borderBottom: '1px solid var(--surface-2)', opacity: p.is_active ? 1 : 0.5 }}>
                  <td className="py-3"><p className="font-bold" style={{ color: 'var(--on-surface)' }}>{p.plan_name}</p><p className="text-[9px]" style={{ color: 'var(--outline)' }}>{p.plan_id}</p></td>
                  {editing === p.plan_id ? (
                    <>
                      <td className="text-center"><input type="number" value={editVals.monthly_price || ''} onChange={e => setEditVals(v => ({ ...v, monthly_price: parseFloat(e.target.value) || 0 }))} className="input-arroba w-20 text-center" /></td>
                      <td className="text-center"><input type="number" value={editVals.annual_price || ''} onChange={e => setEditVals(v => ({ ...v, annual_price: parseFloat(e.target.value) || 0 }))} className="input-arroba w-20 text-center" /></td>
                      <td className="text-center"><input type="number" value={editVals.monthly_interaction_limit ?? ''} onChange={e => setEditVals(v => ({ ...v, monthly_interaction_limit: parseInt(e.target.value) || 0 }))} className="input-arroba w-16 text-center" /></td>
                    </>
                  ) : (
                    <>
                      <td className="text-center font-bold">{p.monthly_price ? `${p.monthly_price}€` : 'Gratis'}</td>
                      <td className="text-center">{p.annual_price ? `${p.annual_price}€` : '—'}</td>
                      <td className="text-center">{p.monthly_interaction_limit === -1 ? 'Ilimitadas' : p.monthly_interaction_limit || '0'}</td>
                    </>
                  )}
                  <td className="text-center" style={{ color: 'var(--outline)' }}>{p.success_fee_pct ? `${p.success_fee_pct}%` : p.revenue_share_pct ? `${p.revenue_share_pct}%` : '—'}</td>
                  <td className="text-center">{p.is_active ? <span style={{ color: '#16a34a' }}>SI</span> : <span style={{ color: '#dc2626' }}>NO</span>}</td>
                  <td className="text-right">
                    {editing === p.plan_id ? (
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => saveEdit(p.plan_id)} className="px-2 py-1 text-[9px] font-bold" style={{ background: '#16a34a', color: '#fff' }}>GUARDAR</button>
                        <button onClick={() => setEditing(null)} className="px-2 py-1 text-[9px] font-bold" style={{ background: 'var(--surface-2)' }}>CANCELAR</button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(p)} className="px-2 py-1 text-[9px] font-bold" style={{ background: 'var(--surface-2)' }}>EDITAR</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody></table>
          </div>
        </div>
      ))}

      {fees.length > 0 && (
        <div>
          <p className="label-arroba mb-3" style={{ color: 'var(--outline)' }}>COMISIONES DE EXITO</p>
          {fees.map((f, i) => (
            <div key={f.rule_id || i} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--surface-2)' }}>
              <span className="text-xs">{f.role_type || f.role || '?'}: {f.description}</span>
              <span className="text-xs font-bold" style={{ color: 'var(--arroba-primary)' }}>{f.fee_percentage || f.success_fee_pct || '?'}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   INTEGRATIONS STATUS
   ═══════════════════════════════════════════════════════════════ */
const IntegrationsSection = () => {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/admin/integrations/status').then(r => setIntegrations(r.data)).finally(() => setLoading(false)); }, []);

  if (loading) return <Loader2 size={16} className="animate-spin mx-auto mt-12" />;

  const statusColors = { healthy: '#16a34a', configured: '#16a34a', mocked: '#d97706', not_configured: '#dc2626', unreachable: '#dc2626', error: '#dc2626' };
  const statusLabels = { healthy: 'Activo', configured: 'Configurado', mocked: 'Mockeado', not_configured: 'Sin configurar', unreachable: 'Inalcanzable', error: 'Error' };

  return (
    <div className="space-y-4">
      {integrations.map(int_ => (
        <div key={int_.id} className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ background: statusColors[int_.status] || 'var(--outline)' }} />
              <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{int_.name}</p>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5" style={{ background: (statusColors[int_.status] || 'var(--outline)') + '15', color: statusColors[int_.status] || 'var(--outline)' }}>
              {statusLabels[int_.status] || int_.status}
            </span>
          </div>
          {int_.url && <p className="text-[10px] mb-1" style={{ color: 'var(--outline)' }}>{int_.url}</p>}
          {int_.note && <p className="text-[10px]" style={{ color: 'var(--outline)' }}>{int_.note}</p>}
          {int_.stats && (
            <div className="flex gap-4 mt-2">
              {Object.entries(int_.stats).map(([k, v]) => (
                <div key={k}><span className="text-[9px]" style={{ color: 'var(--outline)' }}>{k.replace(/_/g, ' ')}: </span><span className="text-[9px] font-bold">{v}</span></div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PLACEHOLDER
   ═══════════════════════════════════════════════════════════════ */
const PlaceholderSection = ({ title }) => (
  <div className="text-center py-16">
    <Settings size={32} className="mx-auto mb-4" style={{ color: 'var(--outline-variant)' }} />
    <p className="text-sm font-bold mb-1" style={{ color: 'var(--on-surface)' }}>{title}</p>
    <p className="text-xs" style={{ color: 'var(--outline)' }}>Esta seccion esta en desarrollo.</p>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN CONSOLE WITH SIDEBAR
   ═══════════════════════════════════════════════════════════════ */
const SECTION_MAP = {
  'overview': { title: 'Salud de la plataforma', component: OverviewSection },
  'deals': { title: 'Moderacion de Deals', component: DealsSection },
  'users': { title: 'Gestion de Usuarios', component: UsersSection },
  'taxonomy': { title: 'Taxonomia y multiplos', component: TaxonomySection },
  'pricing': { title: 'Planes y pricing', component: PricingSection },
  'integrations': { title: 'Integraciones', component: IntegrationsSection },
  'comms': { title: 'Emails y logs', component: CommsSection },
  'tickets': { title: 'Soporte', component: () => <PlaceholderSection title="Soporte e incidencias" /> },
  'data-audit': { title: 'Integridad de datos', component: () => <PlaceholderSection title="Auditoria de datos" /> },
  'permissions': { title: 'Permisos y accesos', component: () => <PlaceholderSection title="Permisos" /> },
  'legal': { title: 'NDAs y Data Room', component: LegalSection },
};

const AdminConsole = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');

  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  const section = SECTION_MAP[activeSection] || SECTION_MAP['overview'];
  const SectionComponent = section.component;

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--surface-0)' }} data-testid="admin-console">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 flex flex-col" style={{ background: 'var(--surface-1)', minHeight: '100vh' }}>
        <div className="px-5 pt-6 pb-4">
          <span className="text-xl font-black" style={{ color: 'var(--arroba-primary)', letterSpacing: '-0.03em' }}>arroba</span>
          <p className="text-[9px] font-bold mt-1" style={{ color: 'var(--outline)' }}>ADMIN CONSOLE</p>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map(item => {
            if (item.type === 'separator') return <p key={item.id} className="text-[8px] font-bold pt-4 pb-1 px-3" style={{ color: 'var(--outline)', letterSpacing: '0.08em' }}>{item.label}</p>;
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button key={item.id} onClick={() => setActiveSection(item.id)} className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all" style={{ background: active ? 'var(--surface-lowest)' : 'transparent', color: active ? 'var(--on-surface)' : 'var(--outline)', boxShadow: active ? '0 2px 8px rgba(25,28,30,0.04)' : 'none' }} data-testid={`admin-nav-${item.id}`}>
                <Icon size={13} />
                <span className="text-[11px] font-semibold">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="px-5 py-4 text-[9px]" style={{ color: 'var(--outline)' }}>
          <p>{user?.email}</p>
          <p className="font-bold mt-1">ADMIN</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-extrabold" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>{section.title}</h1>
            <span className="text-[9px] font-bold px-2 py-1" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>ADMIN</span>
          </div>
          <SectionComponent />
        </div>
      </main>
    </div>
  );
};

export default AdminConsole;
