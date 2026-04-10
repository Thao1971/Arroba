import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import { fmtES, fmtMillions } from '../utils/formatES';
import {
  Shield, Users, FileText, BarChart3, Check, X, AlertTriangle, Flag,
  Loader2, ChevronRight, Lock, Unlock, Star, Eye, Search
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Panel', icon: BarChart3 },
  { id: 'deals', label: 'Moderacion Deals', icon: FileText },
  { id: 'users', label: 'Gestion Usuarios', icon: Users },
];

/* ═══ Overview Tab ═══ */
const OverviewTab = ({ stats }) => {
  if (!stats) return <Loader2 size={16} className="animate-spin mx-auto" />;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
          <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>DEALS</p>
          <p className="text-3xl font-black" style={{ color: 'var(--on-surface)' }}>{stats.deals.total}</p>
          <div className="flex gap-3 mt-2 text-[10px]">
            <span style={{ color: '#16a34a' }}>{stats.deals.published} publicados</span>
            <span style={{ color: '#d97706' }}>{stats.deals.draft} borrador</span>
          </div>
        </div>
        <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
          <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>USUARIOS</p>
          <p className="text-3xl font-black" style={{ color: 'var(--on-surface)' }}>{stats.users.total}</p>
          <div className="flex gap-3 mt-2 text-[10px]">
            <span>{stats.users.buyers} buyers</span>
            <span>{stats.users.sellers} sellers</span>
          </div>
        </div>
        <div className="p-5" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}>
          <p className="label-arroba mb-2" style={{ color: 'var(--outline)' }}>ACTIVIDAD</p>
          <p className="text-3xl font-black" style={{ color: 'var(--on-surface)' }}>{stats.activity.ndas}</p>
          <div className="flex gap-3 mt-2 text-[10px]">
            <span>NDAs firmados</span>
            <span>{stats.activity.contacts} contactos</span>
            <span>{stats.activity.engagements} engagements</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══ Deal Moderation Tab ═══ */
const DealsTab = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectDeal, setRejectDeal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    api.get('/admin/deals' + (filter ? `?status=${filter}` : '')).then(r => setDeals(r.data)).finally(() => setLoading(false));
  }, [filter]);

  const approve = async (dealId) => {
    setActionLoading(dealId);
    await api.post(`/admin/deals/${dealId}/approve`);
    setDeals(d => d.map(x => x.deal_id === dealId ? { ...x, status: 'published' } : x));
    setActionLoading(null);
  };

  const reject = async () => {
    if (!rejectDeal) return;
    setActionLoading(rejectDeal);
    await api.post(`/admin/deals/${rejectDeal}/reject`, { reason: rejectReason });
    setDeals(d => d.map(x => x.deal_id === rejectDeal ? { ...x, status: 'draft' } : x));
    setRejectDeal(null);
    setRejectReason('');
    setActionLoading(null);
  };

  if (loading) return <Loader2 size={16} className="animate-spin mx-auto" />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {['', 'draft', 'published', 'exclusivity'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className="px-3 py-1.5 text-[10px] font-bold" style={{ background: filter === s ? 'var(--on-surface)' : 'var(--surface-2)', color: filter === s ? '#fff' : 'var(--on-surface)' }}>
            {s || 'TODOS'}
          </button>
        ))}
      </div>

      {deals.map(d => (
        <div key={d.deal_id} className="p-4" style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }} data-testid={`admin-deal-${d.deal_id}`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-bold px-2 py-0.5" style={{ background: d.status === 'published' ? 'rgba(22,163,74,0.06)' : d.status === 'draft' ? 'rgba(217,119,6,0.06)' : 'var(--surface-2)', color: d.status === 'published' ? '#16a34a' : d.status === 'draft' ? '#d97706' : 'var(--outline)' }}>
                  {d.status?.toUpperCase()}
                </span>
                <span className="text-[9px] font-bold" style={{ color: d.quality_score >= 80 ? '#16a34a' : d.quality_score >= 50 ? '#d97706' : '#dc2626' }}>
                  {d.quality_score}% calidad
                </span>
              </div>
              <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{d.title}</p>
              <p className="text-[10px]" style={{ color: 'var(--outline)' }}>{d.seller_name} · {d.seller_email} · {d.company_name}</p>
            </div>
            <div className="text-right">
              {d.asking_price && <p className="text-sm font-black" style={{ color: 'var(--arroba-primary)' }}>{fmtMillions(d.asking_price)}</p>}
              <p className="text-[9px]" style={{ color: 'var(--outline)' }}>{d.engagement_count} LOIs · {d.nda_count} NDAs</p>
            </div>
          </div>

          {/* Quality checklist */}
          <div className="flex flex-wrap gap-1 mb-3">
            {Object.entries(d.quality_checklist).map(([k, v]) => (
              <span key={k} className="text-[8px] font-bold px-1.5 py-0.5 flex items-center gap-0.5" style={{ background: v ? 'rgba(22,163,74,0.06)' : 'rgba(220,38,38,0.06)', color: v ? '#16a34a' : '#dc2626' }}>
                {v ? <Check size={8} /> : <X size={8} />} {k.replace('has_', '').replace(/_/g, ' ').toUpperCase()}
              </span>
            ))}
          </div>

          {/* Flags */}
          {d.flags?.length > 0 && (
            <div className="mb-3">
              {d.flags.map((f, i) => (
                <div key={i} className="flex items-center gap-1 text-[10px]" style={{ color: '#dc2626' }}>
                  <AlertTriangle size={10} /> {f.message}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {d.status === 'draft' && (
              <button onClick={() => approve(d.deal_id)} disabled={actionLoading === d.deal_id} className="px-3 py-1.5 text-[10px] font-bold flex items-center gap-1 disabled:opacity-50" style={{ background: '#16a34a', color: '#fff' }}>
                {actionLoading === d.deal_id ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} APROBAR
              </button>
            )}
            <button onClick={() => setRejectDeal(d.deal_id)} className="px-3 py-1.5 text-[10px] font-bold flex items-center gap-1" style={{ background: 'var(--surface-2)', color: 'var(--on-surface)' }}>
              <X size={10} /> RECHAZAR
            </button>
            <a href={`/explorar/${d.deal_id}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 text-[10px] font-bold flex items-center gap-1" style={{ background: 'var(--surface-2)', color: 'var(--on-surface)' }}>
              <Eye size={10} /> PREVIEW
            </a>
          </div>

          {/* Reject modal inline */}
          {rejectDeal === d.deal_id && (
            <div className="mt-3 p-3" style={{ background: 'var(--surface-1)' }}>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Motivo del rechazo..." rows={2} className="input-arroba w-full resize-none mb-2" />
              <div className="flex gap-2">
                <button onClick={reject} className="px-3 py-1.5 text-[10px] font-bold" style={{ background: '#dc2626', color: '#fff' }}>CONFIRMAR RECHAZO</button>
                <button onClick={() => { setRejectDeal(null); setRejectReason(''); }} className="px-3 py-1.5 text-[10px] font-bold" style={{ background: 'var(--surface-2)' }}>CANCELAR</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/* ═══ Users Tab ═══ */
const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [planModal, setPlanModal] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('');

  useEffect(() => {
    api.get('/admin/users' + (roleFilter ? `?role=${roleFilter}` : '')).then(r => setUsers(r.data)).finally(() => setLoading(false));
  }, [roleFilter]);

  const changePlan = async () => {
    if (!planModal || !selectedPlan) return;
    await api.put(`/admin/users/${planModal}/plan`, { plan_type: selectedPlan });
    setUsers(u => u.map(x => x.user_id === planModal ? { ...x, plan: selectedPlan } : x));
    setPlanModal(null);
    setSelectedPlan('');
  };

  const toggleActive = async (uid, current) => {
    await api.put(`/admin/users/${uid}/status`, { is_active: !current });
    setUsers(u => u.map(x => x.user_id === uid ? { ...x, is_active: !current } : x));
  };

  const filtered = users.filter(u => !search || u.email?.includes(search) || u.first_name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <Loader2 size={16} className="animate-spin mx-auto" />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-2">
        {['', 'buyer', 'seller', 'advisor', 'admin'].map(r => (
          <button key={r} onClick={() => setRoleFilter(r)} className="px-3 py-1.5 text-[10px] font-bold" style={{ background: roleFilter === r ? 'var(--on-surface)' : 'var(--surface-2)', color: roleFilter === r ? '#fff' : 'var(--on-surface)' }}>
            {r || 'TODOS'}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 px-3 py-2" style={{ background: 'var(--surface-1)' }}>
        <Search size={12} style={{ color: 'var(--outline)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por email o nombre..." className="bg-transparent text-xs outline-none flex-1" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '2px solid var(--surface-2)' }}>
              <th className="text-left py-2 font-bold" style={{ color: 'var(--outline)' }}>USUARIO</th>
              <th className="text-left py-2 font-bold" style={{ color: 'var(--outline)' }}>ROL</th>
              <th className="text-left py-2 font-bold" style={{ color: 'var(--outline)' }}>PLAN</th>
              <th className="text-center py-2 font-bold" style={{ color: 'var(--outline)' }}>NDAS</th>
              <th className="text-center py-2 font-bold" style={{ color: 'var(--outline)' }}>ACTIVIDAD</th>
              <th className="text-right py-2 font-bold" style={{ color: 'var(--outline)' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.user_id} style={{ borderBottom: '1px solid var(--surface-2)', opacity: u.is_active ? 1 : 0.5 }} data-testid={`admin-user-${u.user_id}`}>
                <td className="py-2">
                  <p className="font-bold" style={{ color: 'var(--on-surface)' }}>{u.first_name} {u.last_name}</p>
                  <p className="text-[10px]" style={{ color: 'var(--outline)' }}>{u.email}</p>
                </td>
                <td><span className="text-[9px] font-bold px-2 py-0.5" style={{ background: 'var(--surface-2)' }}>{u.role?.toUpperCase()}</span></td>
                <td><span className="text-[9px] font-bold px-2 py-0.5" style={{ background: u.plan?.includes('pro') ? 'rgba(182,33,42,0.06)' : 'var(--surface-2)', color: u.plan?.includes('pro') ? 'var(--arroba-primary)' : 'var(--outline)' }}>{u.plan?.toUpperCase() || 'FREE'}</span></td>
                <td className="text-center">{u.stats?.ndas || 0}</td>
                <td className="text-center">{(u.stats?.engagements || 0) + (u.stats?.contacts || 0)}</td>
                <td className="text-right">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => { setPlanModal(u.user_id); setSelectedPlan(u.plan || 'free'); }} className="px-2 py-1 text-[9px] font-bold" style={{ background: 'var(--surface-2)' }}>PLAN</button>
                    <button onClick={() => toggleActive(u.user_id, u.is_active)} className="px-2 py-1 text-[9px] font-bold" style={{ background: u.is_active ? 'rgba(220,38,38,0.06)' : 'rgba(22,163,74,0.06)', color: u.is_active ? '#dc2626' : '#16a34a' }}>
                      {u.is_active ? 'DESACTIVAR' : 'ACTIVAR'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Plan change modal */}
      {planModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="p-5 w-80" style={{ background: 'var(--surface-lowest)' }}>
            <p className="label-arroba mb-3">CAMBIAR PLAN</p>
            <select value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)} className="input-arroba w-full mb-3">
              <option value="free">Free</option>
              <option value="buyer_pro">Buyer Pro</option>
              <option value="buyer_proplus">Buyer Pro+</option>
              <option value="seller_plus">Seller Plus</option>
              <option value="seller_premium">Seller Premium</option>
            </select>
            <div className="flex gap-2">
              <button onClick={changePlan} className="px-4 py-2 text-[10px] font-bold" style={{ background: 'var(--on-surface)', color: '#fff' }}>GUARDAR</button>
              <button onClick={() => setPlanModal(null)} className="px-4 py-2 text-[10px] font-bold" style={{ background: 'var(--surface-2)' }}>CANCELAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══ MAIN CONSOLE ═══ */
const AdminConsole = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  return (
    <Layout showFooter={false}>
      <div className="min-h-screen" style={{ background: 'var(--surface-0)' }} data-testid="admin-console">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="label-arroba mb-1" style={{ color: 'var(--arroba-primary)' }}>ADMIN CONSOLE</p>
              <h1 className="text-2xl font-extrabold" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>Panel de administracion</h1>
            </div>
            <span className="text-[9px] font-bold px-2 py-1" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>ADMIN</span>
          </div>

          {/* Tab nav */}
          <div className="flex gap-1 mb-6" style={{ borderBottom: '1px solid var(--surface-2)' }}>
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-3 text-[11px] font-bold flex items-center gap-2 relative" style={{ color: tab === t.id ? 'var(--on-surface)' : 'var(--outline)' }}>
                  <Icon size={13} /> {t.label}
                  {tab === t.id && <span className="absolute bottom-0 left-2 right-2 h-[2px]" style={{ background: 'var(--on-surface)' }} />}
                </button>
              );
            })}
          </div>

          {tab === 'overview' && <OverviewTab stats={stats} />}
          {tab === 'deals' && <DealsTab />}
          {tab === 'users' && <UsersTab />}
        </div>
      </div>
    </Layout>
  );
};

export default AdminConsole;
