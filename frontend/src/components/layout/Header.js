import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, ChevronDown, LogOut, Settings, LayoutDashboard, Bell } from 'lucide-react';
import NotificationBell from './NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const ArrobaLogo = ({ color = '#FF5757', size = 28, showTagline = true }) => {
  return (
    <div className="flex flex-col">
      <svg width={size * 2.5} height={size * 1.2} viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="3" cy="20" r="1.5" fill={color}/><circle cx="3" cy="24" r="1.5" fill={color}/><circle cx="3" cy="28" r="1.5" fill={color}/>
        <circle cx="6" cy="16" r="1.5" fill={color}/><circle cx="6" cy="32" r="1.5" fill={color}/>
        <circle cx="9" cy="16" r="1.5" fill={color}/><circle cx="9" cy="20" r="1.5" fill={color}/><circle cx="9" cy="24" r="1.5" fill={color}/><circle cx="9" cy="28" r="1.5" fill={color}/><circle cx="9" cy="32" r="1.5" fill={color}/>
        <circle cx="15" cy="20" r="1.5" fill={color}/><circle cx="15" cy="24" r="1.5" fill={color}/><circle cx="15" cy="28" r="1.5" fill={color}/><circle cx="15" cy="32" r="1.5" fill={color}/>
        <circle cx="18" cy="16" r="1.5" fill={color}/><circle cx="21" cy="16" r="1.5" fill={color}/>
        <circle cx="27" cy="20" r="1.5" fill={color}/><circle cx="27" cy="24" r="1.5" fill={color}/><circle cx="27" cy="28" r="1.5" fill={color}/><circle cx="27" cy="32" r="1.5" fill={color}/>
        <circle cx="30" cy="16" r="1.5" fill={color}/><circle cx="33" cy="16" r="1.5" fill={color}/>
        <circle cx="39" cy="20" r="1.5" fill={color}/><circle cx="39" cy="24" r="1.5" fill={color}/><circle cx="39" cy="28" r="1.5" fill={color}/>
        <circle cx="42" cy="16" r="1.5" fill={color}/><circle cx="42" cy="32" r="1.5" fill={color}/>
        <circle cx="45" cy="20" r="1.5" fill={color}/><circle cx="45" cy="24" r="1.5" fill={color}/><circle cx="45" cy="28" r="1.5" fill={color}/>
        <circle cx="51" cy="8" r="1.5" fill={color}/><circle cx="51" cy="12" r="1.5" fill={color}/><circle cx="51" cy="16" r="1.5" fill={color}/><circle cx="51" cy="20" r="1.5" fill={color}/><circle cx="51" cy="24" r="1.5" fill={color}/><circle cx="51" cy="28" r="1.5" fill={color}/><circle cx="51" cy="32" r="1.5" fill={color}/>
        <circle cx="54" cy="16" r="1.5" fill={color}/><circle cx="54" cy="32" r="1.5" fill={color}/>
        <circle cx="57" cy="20" r="1.5" fill={color}/><circle cx="57" cy="24" r="1.5" fill={color}/><circle cx="57" cy="28" r="1.5" fill={color}/>
        <circle cx="63" cy="20" r="1.5" fill={color}/><circle cx="63" cy="24" r="1.5" fill={color}/><circle cx="63" cy="28" r="1.5" fill={color}/>
        <circle cx="66" cy="16" r="1.5" fill={color}/><circle cx="66" cy="32" r="1.5" fill={color}/>
        <circle cx="69" cy="16" r="1.5" fill={color}/><circle cx="69" cy="20" r="1.5" fill={color}/><circle cx="69" cy="24" r="1.5" fill={color}/><circle cx="69" cy="28" r="1.5" fill={color}/><circle cx="69" cy="32" r="1.5" fill={color}/>
      </svg>
      {showTagline && (
        <span className="text-[10px] text-slate-500 tracking-wide mt-0.5">Compra y vende agencias</span>
      )}
    </div>
  );
};

const NavLink = ({ to, children, active }) => (
  <Link
    to={to}
    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      active ? 'text-slate-900 bg-slate-100' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`}
    data-testid={`nav-${to.replace(/\//g, '-').replace(/^-/, '')}`}
  >
    {children}
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
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200" data-testid="main-header">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0" data-testid="logo-link">
            <ArrobaLogo color="#FF5757" size={24} showTagline={false} />
          </Link>

          {/* Center Navigation — Role-based */}
          <nav className="hidden md:flex items-center gap-1" data-testid="main-nav">
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
          <div className="flex items-center gap-2">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                  data-testid="login-btn"
                >
                  Acceder
                </Link>
                <Link
                  to="/register?role=seller"
                  className="px-4 py-2 text-sm font-semibold text-white bg-arroba-coral hover:bg-arroba-coral/90 rounded-lg transition-colors"
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
                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors" data-testid="user-menu-trigger">
                      <div className="w-7 h-7 rounded-full bg-arroba-coral/10 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-arroba-coral" />
                      </div>
                      <span className="hidden sm:inline">{user?.first_name}</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white border border-slate-200">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                      <p className="text-xs text-slate-400 capitalize mt-0.5">{role}</p>
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
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer flex items-center gap-2" data-testid="menu-logout">
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
