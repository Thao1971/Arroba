import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, ChevronDown, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import NotificationBell from './NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const ArrobaLogo = ({ size = 33 }) => (
  <span style={{
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontWeight: 800,
    fontSize: size,
    color: 'var(--arroba-primary)',
    letterSpacing: '-0.03em',
    lineHeight: 1,
  }}>
    arroba
  </span>
);

const NavLink = ({ to, children, active }) => (
  <Link
    to={to}
    className="relative px-1 py-1 transition-colors"
    style={{
      fontFamily: "'IBM Plex Sans', sans-serif",
      fontWeight: 700,
      fontSize: 13,
      letterSpacing: '-0.01em',
      color: active ? 'var(--on-surface)' : 'var(--outline)',
      textDecoration: 'none',
    }}
    data-testid={`nav-${to.replace(/\//g, '-').replace(/^-/, '')}`}
  >
    {children}
    {active && (
      <span className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'var(--on-surface)' }} />
    )}
  </Link>
);

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const role = user?.role;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (p) => path === p || path.startsWith(p + '/');

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 1px 0 var(--surface-2)',
      }}
      data-testid="main-header"
    >
      <div className="container mx-auto px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0" data-testid="logo-link">
            <ArrobaLogo size={22} />
          </Link>

          {/* Center Navigation — Role-based */}
          <nav className="hidden md:flex items-center gap-8" data-testid="main-nav">
            {!isAuthenticated && (
              <>
                <NavLink to="/explorar" active={isActive('/explorar') || isActive('/marketplace')}>Explorar</NavLink>
                <NavLink to="/vender" active={isActive('/vender')}>Vender mi empresa</NavLink>
                <NavLink to="/como-funciona" active={isActive('/como-funciona')}>Como funciona</NavLink>
              </>
            )}

            {isAuthenticated && role === 'buyer' && (
              <>
                <NavLink to="/explorar" active={isActive('/explorar') || isActive('/marketplace')}>Explorar</NavLink>
                <NavLink to="/buyer/procesos" active={isActive('/buyer/procesos')}>Mis procesos</NavLink>
                <NavLink to="/buyer/guardados" active={isActive('/buyer/guardados')}>Guardados</NavLink>
              </>
            )}

            {isAuthenticated && role === 'seller' && (
              <>
                <NavLink to="/seller/deals" active={isActive('/seller/d')}>Mis deals</NavLink>
                <NavLink to="/seller/interesados" active={isActive('/seller/interesados')}>Interesados</NavLink>
                <NavLink to="/explorar" active={isActive('/explorar') || isActive('/marketplace')}>Explorar</NavLink>
              </>
            )}

            {isAuthenticated && role === 'advisor' && (
              <>
                <NavLink to="/advisor/mandatos" active={isActive('/advisor/mandatos')}>Mandatos</NavLink>
                <NavLink to="/advisor/interesados" active={isActive('/advisor/interesados')}>Interesados</NavLink>
                <NavLink to="/explorar" active={isActive('/explorar') || isActive('/marketplace')}>Explorar</NavLink>
              </>
            )}

            {isAuthenticated && role === 'admin' && (
              <>
                <NavLink to="/admin/dashboard" active={isActive('/admin')}>Admin</NavLink>
                <NavLink to="/explorar" active={isActive('/explorar')}>Explorar</NavLink>
              </>
            )}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--on-surface-variant)' }}
                  data-testid="login-btn"
                >
                  Acceder
                </Link>
                <Link
                  to="/register?role=seller"
                  className="btn-primary text-xs px-5 py-2"
                  data-testid="cta-publish"
                >
                  Publicar mi empresa
                </Link>
              </>
            ) : (
              <>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium hover:opacity-70 transition-opacity"
                      style={{ color: 'var(--on-surface)' }}
                      data-testid="user-menu-trigger"
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(182, 33, 42, 0.08)' }}>
                        <User className="w-3.5 h-3.5" style={{ color: 'var(--arroba-primary)' }} />
                      </div>
                      <span className="hidden sm:inline text-sm font-semibold">{user?.first_name}</span>
                      <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--outline)' }} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56" style={{ background: 'var(--surface-lowest)', boxShadow: '0 12px 32px rgba(25,28,30,0.08)' }}>
                    <div className="px-3 py-2">
                      <p className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>{user?.first_name} {user?.last_name}</p>
                      <p className="text-xs" style={{ color: 'var(--outline)' }}>{user?.email}</p>
                      <p className="text-xs capitalize mt-0.5" style={{ color: 'var(--outline-variant)' }}>{role}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={`/${role === 'buyer' ? 'buyer/procesos' : role === 'seller' ? 'seller/deals' : role === 'advisor' ? 'advisor/mandatos' : 'admin/dashboard'}`} className="cursor-pointer flex items-center gap-2" data-testid="menu-dashboard">
                        <LayoutDashboard className="w-4 h-4" /> Mi panel
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/perfil" className="cursor-pointer flex items-center gap-2">
                        <Settings className="w-4 h-4" /> Configuracion
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer flex items-center gap-2" style={{ color: 'var(--arroba-primary)' }} data-testid="menu-logout">
                      <LogOut className="w-4 h-4" /> Cerrar sesion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export { Header, ArrobaLogo };
