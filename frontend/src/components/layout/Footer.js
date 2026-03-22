import React from 'react';
import { Link } from 'react-router-dom';
import { ArrobaLogo } from './Header';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white" data-testid="main-footer">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <ArrobaLogo color="#FFFFFF" size={24} showTagline={false} />
            <p className="text-xs text-slate-500 mt-1">Compra y vende agencias</p>
            <p className="text-sm text-slate-400 mt-4">
              La plataforma líder de compraventa y fusión de agencias digitales.
            </p>
          </div>

          {/* Platform */}
          <div>
            <ul className="space-y-3">
              <li>
                <Link to="/marketplace" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Cómo Funciona
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Planes y Precios
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Contacto
                </Link>
              </li>
              <li>
                <a href="https://budadvisors.com" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-white transition-colors">
                  BUD Advisors
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Términos de Uso
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Arroba. Todos los derechos reservados.
          </p>
          <p className="text-xs text-slate-500 mt-2 md:mt-0">
            Una compañía de <a href="https://budadvisors.com" target="_blank" rel="noopener noreferrer" className="text-arroba-coral hover:underline">BUD Advisors</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
