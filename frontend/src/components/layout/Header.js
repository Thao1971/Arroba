import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, ChevronDown } from 'lucide-react';
import NotificationBell from './NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '../ui/navigation-menu';

// Arroba Logo Component (Pixel/Dot style) - Larger version with tagline
const ArrobaLogo = ({ color = '#FF5757', size = 32, showTagline = true }) => {
  return (
    <div className="flex flex-col">
      <svg width={size * 2.5} height={size * 1.2} viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Letter 'a' - first */}
        <circle cx="3" cy="20" r="1.5" fill={color}/>
        <circle cx="3" cy="24" r="1.5" fill={color}/>
        <circle cx="3" cy="28" r="1.5" fill={color}/>
        <circle cx="6" cy="16" r="1.5" fill={color}/>
        <circle cx="6" cy="32" r="1.5" fill={color}/>
        <circle cx="9" cy="16" r="1.5" fill={color}/>
        <circle cx="9" cy="20" r="1.5" fill={color}/>
        <circle cx="9" cy="24" r="1.5" fill={color}/>
        <circle cx="9" cy="28" r="1.5" fill={color}/>
        <circle cx="9" cy="32" r="1.5" fill={color}/>
        
        {/* Letter 'r' */}
        <circle cx="15" cy="20" r="1.5" fill={color}/>
        <circle cx="15" cy="24" r="1.5" fill={color}/>
        <circle cx="15" cy="28" r="1.5" fill={color}/>
        <circle cx="15" cy="32" r="1.5" fill={color}/>
        <circle cx="18" cy="16" r="1.5" fill={color}/>
        <circle cx="21" cy="16" r="1.5" fill={color}/>
        
        {/* Letter 'r' second */}
        <circle cx="27" cy="20" r="1.5" fill={color}/>
        <circle cx="27" cy="24" r="1.5" fill={color}/>
        <circle cx="27" cy="28" r="1.5" fill={color}/>
        <circle cx="27" cy="32" r="1.5" fill={color}/>
        <circle cx="30" cy="16" r="1.5" fill={color}/>
        <circle cx="33" cy="16" r="1.5" fill={color}/>
        
        {/* Letter 'o' */}
        <circle cx="39" cy="20" r="1.5" fill={color}/>
        <circle cx="39" cy="24" r="1.5" fill={color}/>
        <circle cx="39" cy="28" r="1.5" fill={color}/>
        <circle cx="42" cy="16" r="1.5" fill={color}/>
        <circle cx="42" cy="32" r="1.5" fill={color}/>
        <circle cx="45" cy="20" r="1.5" fill={color}/>
        <circle cx="45" cy="24" r="1.5" fill={color}/>
        <circle cx="45" cy="28" r="1.5" fill={color}/>
        
        {/* Letter 'b' */}
        <circle cx="51" cy="8" r="1.5" fill={color}/>
        <circle cx="51" cy="12" r="1.5" fill={color}/>
        <circle cx="51" cy="16" r="1.5" fill={color}/>
        <circle cx="51" cy="20" r="1.5" fill={color}/>
        <circle cx="51" cy="24" r="1.5" fill={color}/>
        <circle cx="51" cy="28" r="1.5" fill={color}/>
        <circle cx="51" cy="32" r="1.5" fill={color}/>
        <circle cx="54" cy="16" r="1.5" fill={color}/>
        <circle cx="54" cy="32" r="1.5" fill={color}/>
        <circle cx="57" cy="20" r="1.5" fill={color}/>
        <circle cx="57" cy="24" r="1.5" fill={color}/>
        <circle cx="57" cy="28" r="1.5" fill={color}/>
        
        {/* Letter 'a' - last */}
        <circle cx="63" cy="20" r="1.5" fill={color}/>
        <circle cx="63" cy="24" r="1.5" fill={color}/>
        <circle cx="63" cy="28" r="1.5" fill={color}/>
        <circle cx="66" cy="16" r="1.5" fill={color}/>
        <circle cx="66" cy="32" r="1.5" fill={color}/>
        <circle cx="69" cy="16" r="1.5" fill={color}/>
        <circle cx="69" cy="20" r="1.5" fill={color}/>
        <circle cx="69" cy="24" r="1.5" fill={color}/>
        <circle cx="69" cy="28" r="1.5" fill={color}/>
        <circle cx="69" cy="32" r="1.5" fill={color}/>
      </svg>
      {showTagline && (
        <span className="text-[10px] text-slate-500 tracking-wide mt-0.5">Compra y vende agencias</span>
      )}
    </div>
  );
};

// Navigation Menu Item Component
const NavMenuItem = ({ title, items, isActive, onHover }) => {
  return (
    <div className="relative group">
      <button 
        className={`px-4 py-2 text-sm font-medium transition-colors rounded-md ${
          isActive 
            ? 'bg-arroba-coral/10 text-slate-900' 
            : 'text-slate-700 hover:text-slate-900'
        }`}
        onMouseEnter={onHover}
      >
        {title}
      </button>
      
      {/* Dropdown */}
      <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-6 min-w-[500px]">
          <div className="grid grid-cols-3 gap-6">
            {items.map((item, idx) => (
              <Link 
                key={idx} 
                to={item.href}
                className="block group/item"
              >
                <h4 className="font-semibold text-slate-900 mb-1 group-hover/item:text-arroba-coral transition-colors">
                  {item.title}
                </h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
          
          {/* Footer links */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
            <Link to="/how-it-works" className="text-sm text-slate-600 hover:text-arroba-coral">
              Cómo funciona la plataforma
            </Link>
            <Link to="/login" className="text-sm text-slate-600 hover:text-arroba-coral">
              Mi cuenta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getRoleDashboard = () => {
    if (!user) return '/login';
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

  // Navigation structure matching the mockups
  const navItems = {
    comprar: {
      title: 'Comprar',
      items: [
        { title: 'Inversores', description: 'Compra o invierte en agencias rentables', href: '/comprar/inversores' },
        { title: 'Listado de agencias', description: 'Explora todas las agencias disponibles', href: '/marketplace' },
        { title: 'Planes de suscripción', description: 'Conoce los precios y beneficios', href: '/pricing' },
      ]
    },
    vender: {
      title: 'Vender',
      items: [
        { title: 'Agencias', description: 'Encuentra a tu socio o comprador de tu agencia', href: '/vender/agencias' },
        { title: 'Vende tu agencia', description: 'Accede a una red cualificada de compradores', href: '/register?role=seller' },
        { title: 'Planes de suscripción', description: 'Conoce los precios y explora todo el potencial de la plataforma', href: '/pricing' },
      ]
    },
    fusionarse: {
      title: 'Fusionarse',
      items: [
        { title: 'Fusiona tu agencia', description: 'Accede un listado de agencias que quieren fusionarse', href: '/fusionarse' },
        { title: 'Planes de suscripción', description: 'Conoce los precios y explora todo el potencial de la plataforma', href: '/pricing' },
      ]
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200" data-testid="main-header">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center" data-testid="logo-link">
            <ArrobaLogo color="#FF5757" size={28} showTagline={true} />
          </Link>

          {/* Center Navigation */}
          <nav className="hidden lg:flex items-center gap-1" data-testid="main-nav">
            {Object.entries(navItems).map(([key, menu]) => (
              <NavMenuItem 
                key={key}
                title={menu.title}
                items={menu.items}
                isActive={activeMenu === key}
                onHover={() => setActiveMenu(key)}
              />
            ))}
          </nav>

          {/* Right Side - Notifications + Mi cuenta */}
          <div className="flex items-center gap-3">
            <NotificationBell />
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900" data-testid="user-menu-trigger">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-arroba-coral/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-arroba-coral" />
                      </div>
                    )}
                    <span>Mi cuenta</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border border-slate-200">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={getRoleDashboard()} className="cursor-pointer" data-testid="menu-dashboard">
                      Mi Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      Configuración
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer" data-testid="menu-logout">
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link 
                to="/login" 
                className="text-sm font-medium text-slate-700 hover:text-slate-900"
                data-testid="login-btn"
              >
                Mi cuenta
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export { Header, ArrobaLogo };
