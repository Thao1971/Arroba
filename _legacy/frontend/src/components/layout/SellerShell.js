import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart3, Users, FileSignature, MessageSquare, FolderOpen, FileText,
  ArrowLeft, Search, Plus
} from 'lucide-react';

const SECTIONS = [
  { id: 'dashboard', path: '/seller/deals', label: 'Dashboard', icon: BarChart3 },
  { id: 'interesados', path: '/seller/interesados', label: 'Interesados', icon: Users },
];

const SellerShell = ({ children, title, subtitle, actions }) => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-0)' }}>
      {/* ─── LEFT SIDEBAR ─── */}
      <aside className="fixed left-0 top-0 bottom-0 w-60 flex flex-col z-40" style={{ background: 'var(--surface-1)', paddingTop: 80 }}>
        <div className="px-6 mb-5">
          <Link to="/" className="text-2xl font-black tracking-tight block mb-3" style={{ color: 'var(--arroba-primary)', letterSpacing: '-0.03em' }}>arroba</Link>
          <h2 className="text-base font-extrabold" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>Panel de Vendedor</h2>
          <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--outline)' }}>
            {user?.first_name} {user?.last_name}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 px-3">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            const active = isActive(s.path);
            return (
              <Link key={s.id} to={s.path}
                className="flex items-center gap-3 px-4 py-3 text-sm font-semibold uppercase tracking-wider transition-all"
                style={{
                  color: active ? 'var(--arroba-primary)' : 'var(--on-surface-variant)',
                  background: active ? 'var(--surface-lowest)' : 'transparent',
                  boxShadow: active ? '0px 4px 12px rgba(26,28,28,0.06)' : 'none',
                  textDecoration: 'none',
                }}
                data-testid={`seller-nav-${s.id}`}>
                <Icon size={16} />
                <span>{s.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-4 pb-6 space-y-3">
          <Link to="/seller/onboarding">
            <button className="w-full py-3 text-[11px] font-bold flex items-center justify-center gap-2"
              style={{ background: 'var(--arroba-primary)', color: '#fff' }}>
              <Plus size={12} /> NUEVA COMPAÑÍA
            </button>
          </Link>
          <Link to="/explorar">
            <button className="w-full py-3 text-[11px] font-bold flex items-center justify-center gap-2"
              style={{ background: 'var(--on-surface)', color: '#fff' }}>
              <Search size={12} /> EXPLORAR MARKETPLACE
            </button>
          </Link>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="ml-60 min-h-screen" style={{ paddingTop: 32 }}>
        <div className="max-w-[1100px] mx-auto px-8 pb-16">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              {subtitle && <p className="label-arroba mb-2" style={{ color: 'var(--arroba-primary)' }}>{subtitle}</p>}
              <h1 className="text-3xl font-extrabold" style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>
                {title}
              </h1>
            </div>
            {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
          </div>

          {children}
        </div>
      </main>
    </div>
  );
};

export default SellerShell;
