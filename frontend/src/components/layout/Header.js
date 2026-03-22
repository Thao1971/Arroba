import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  User, 
  LogOut, 
  Building2, 
  LayoutDashboard, 
  Menu, 
  X,
  Search
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';

// Arroba Logo Component (Pixel/Dot style)
const ArrobaLogo = ({ color = '#FF5757', size = 32 }) => {
  return (
    <svg width={size * 3} height={size} viewBox="0 0 96 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Letter 'a' - first */}
      <circle cx="4" cy="16" r="2" fill={color}/>
      <circle cx="4" cy="20" r="2" fill={color}/>
      <circle cx="4" cy="24" r="2" fill={color}/>
      <circle cx="8" cy="12" r="2" fill={color}/>
      <circle cx="8" cy="28" r="2" fill={color}/>
      <circle cx="12" cy="12" r="2" fill={color}/>
      <circle cx="12" cy="16" r="2" fill={color}/>
      <circle cx="12" cy="20" r="2" fill={color}/>
      <circle cx="12" cy="24" r="2" fill={color}/>
      <circle cx="12" cy="28" r="2" fill={color}/>
      
      {/* Letter 'r' */}
      <circle cx="20" cy="16" r="2" fill={color}/>
      <circle cx="20" cy="20" r="2" fill={color}/>
      <circle cx="20" cy="24" r="2" fill={color}/>
      <circle cx="20" cy="28" r="2" fill={color}/>
      <circle cx="24" cy="12" r="2" fill={color}/>
      <circle cx="28" cy="12" r="2" fill={color}/>
      
      {/* Letter 'r' second */}
      <circle cx="36" cy="16" r="2" fill={color}/>
      <circle cx="36" cy="20" r="2" fill={color}/>
      <circle cx="36" cy="24" r="2" fill={color}/>
      <circle cx="36" cy="28" r="2" fill={color}/>
      <circle cx="40" cy="12" r="2" fill={color}/>
      <circle cx="44" cy="12" r="2" fill={color}/>
      
      {/* Letter 'o' */}
      <circle cx="52" cy="16" r="2" fill={color}/>
      <circle cx="52" cy="20" r="2" fill={color}/>
      <circle cx="52" cy="24" r="2" fill={color}/>
      <circle cx="56" cy="12" r="2" fill={color}/>
      <circle cx="56" cy="28" r="2" fill={color}/>
      <circle cx="60" cy="16" r="2" fill={color}/>
      <circle cx="60" cy="20" r="2" fill={color}/>
      <circle cx="60" cy="24" r="2" fill={color}/>
      
      {/* Letter 'b' */}
      <circle cx="68" cy="4" r="2" fill={color}/>
      <circle cx="68" cy="8" r="2" fill={color}/>
      <circle cx="68" cy="12" r="2" fill={color}/>
      <circle cx="68" cy="16" r="2" fill={color}/>
      <circle cx="68" cy="20" r="2" fill={color}/>
      <circle cx="68" cy="24" r="2" fill={color}/>
      <circle cx="68" cy="28" r="2" fill={color}/>
      <circle cx="72" cy="12" r="2" fill={color}/>
      <circle cx="72" cy="28" r="2" fill={color}/>
      <circle cx="76" cy="16" r="2" fill={color}/>
      <circle cx="76" cy="20" r="2" fill={color}/>
      <circle cx="76" cy="24" r="2" fill={color}/>
      
      {/* Letter 'a' - last */}
      <circle cx="84" cy="16" r="2" fill={color}/>
      <circle cx="84" cy="20" r="2" fill={color}/>
      <circle cx="84" cy="24" r="2" fill={color}/>
      <circle cx="88" cy="12" r="2" fill={color}/>
      <circle cx="88" cy="28" r="2" fill={color}/>
      <circle cx="92" cy="12" r="2" fill={color}/>
      <circle cx="92" cy="16" r="2" fill={color}/>
      <circle cx="92" cy="20" r="2" fill={color}/>
      <circle cx="92" cy="24" r="2" fill={color}/>
      <circle cx="92" cy="28" r="2" fill={color}/>
    </svg>
  );
};

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getRoleDashboard = () => {
    if (!user) return '/dashboard';
    switch (user.role) {
      case 'seller':
        return '/seller/dashboard';
      case 'advisor':
        return '/advisor/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/buyer/dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white" data-testid="main-header">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
            <ArrobaLogo color="#FF5757" size={28} />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8" data-testid="desktop-nav">
            <Link 
              to="/marketplace" 
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              data-testid="nav-marketplace"
            >
              Marketplace
            </Link>
            <Link 
              to="/pricing" 
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              data-testid="nav-pricing"
            >
              Planes
            </Link>
            <Link 
              to="/about" 
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              data-testid="nav-about"
            >
              Sobre Nosotros
            </Link>
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2" data-testid="user-menu-trigger">
                    <div className="w-8 h-8 rounded-full bg-arroba-coral/10 flex items-center justify-center">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <User className="w-4 h-4 text-arroba-coral" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{user?.first_name || user?.email?.split('@')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border border-slate-200">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                    <span className="inline-block mt-1 badge-arroba">{user?.role}</span>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={getRoleDashboard()} className="flex items-center gap-2 cursor-pointer" data-testid="menu-dashboard">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {(user?.role === 'seller' || user?.role === 'advisor') && (
                    <DropdownMenuItem asChild>
                      <Link to="/companies" className="flex items-center gap-2 cursor-pointer" data-testid="menu-companies">
                        <Building2 className="w-4 h-4" />
                        Mis Compañías
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer" data-testid="menu-logout">
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-sm font-medium" data-testid="login-btn">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="btn-primary text-sm" data-testid="register-btn">
                    REGISTRARSE
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200" data-testid="mobile-menu">
            <nav className="flex flex-col gap-4">
              <Link to="/marketplace" className="text-sm font-medium text-slate-600" onClick={() => setMobileMenuOpen(false)}>
                Marketplace
              </Link>
              <Link to="/pricing" className="text-sm font-medium text-slate-600" onClick={() => setMobileMenuOpen(false)}>
                Planes
              </Link>
              <Link to="/about" className="text-sm font-medium text-slate-600" onClick={() => setMobileMenuOpen(false)}>
                Sobre Nosotros
              </Link>
              {!isAuthenticated && (
                <>
                  <Link to="/login" className="text-sm font-medium text-slate-600" onClick={() => setMobileMenuOpen(false)}>
                    Iniciar Sesión
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="btn-primary w-full">REGISTRARSE</Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export { Header, ArrobaLogo };
