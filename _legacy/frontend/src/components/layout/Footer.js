import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{ background: 'var(--on-surface)' }} data-testid="main-footer">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '-0.03em' }}>
              arroba
            </span>
            <p className="text-xs mt-2" style={{ color: 'var(--outline)' }}>
              Plataforma M&A para agencias digitales.
            </p>
          </div>

          <div>
            <p className="label-arroba mb-4" style={{ color: 'var(--outline)' }}>Plataforma</p>
            <ul className="space-y-2">
              <li><Link to="/explorar" className="text-sm hover:text-white transition-colors" style={{ color: 'var(--outline-variant)' }}>Listado de agencias</Link></li>
              <li><Link to="/planes" className="text-sm hover:text-white transition-colors" style={{ color: 'var(--outline-variant)' }}>Planes</Link></li>
              <li><Link to="/vender" className="text-sm hover:text-white transition-colors" style={{ color: 'var(--outline-variant)' }}>Vender mi empresa</Link></li>
            </ul>
          </div>

          <div>
            <p className="label-arroba mb-4" style={{ color: 'var(--outline)' }}>Compañía</p>
            <ul className="space-y-2">
              <li><a href="https://budadvisors.com" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors" style={{ color: 'var(--outline-variant)' }}>BUD Advisors</a></li>
              <li><Link to="/contact" className="text-sm hover:text-white transition-colors" style={{ color: 'var(--outline-variant)' }}>Contacto</Link></li>
            </ul>
          </div>

          <div>
            <p className="label-arroba mb-4" style={{ color: 'var(--outline)' }}>Legal</p>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-sm hover:text-white transition-colors" style={{ color: 'var(--outline-variant)' }}>Privacidad</Link></li>
              <li><Link to="/terms" className="text-sm hover:text-white transition-colors" style={{ color: 'var(--outline-variant)' }}>Términos de uso</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 flex flex-col md:flex-row justify-between items-center" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs" style={{ color: 'var(--outline)' }}>
            &copy; {new Date().getFullYear()} Arroba. Todos los derechos reservados.
          </p>
          <p className="text-xs mt-2 md:mt-0" style={{ color: 'var(--outline)' }}>
            Una compania de <a href="https://budadvisors.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" style={{ color: 'var(--arroba-primary-light)' }}>BUD Advisors</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
