import React from 'react';
import { Link } from 'react-router-dom';
import { ArrobaLogo } from './Header';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white" data-testid="main-footer">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <ArrobaLogo color="#FFFFFF" size={24} />
            <p className="text-sm text-slate-400 mt-4">
              La plataforma líder de compraventa y fusión de agencias digitales en España y Latinoamérica.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Plataforma</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/marketplace" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Planes y Precios
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Cómo Funciona
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Compañía</h4>
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
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
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
                  Política de Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Arroba. Todos los derechos reservados.
          </p>
          <p className="text-sm text-slate-500 mt-4 md:mt-0">
            Una compañía de <a href="https://budadvisors.com" target="_blank" rel="noopener noreferrer" className="text-arroba-coral hover:underline">BUD Advisors</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
