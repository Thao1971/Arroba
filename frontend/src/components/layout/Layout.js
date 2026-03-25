import React from 'react';
import { Header } from './Header';
import Footer from './Footer';

const Layout = ({ children, showFooter = true }) => {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--surface-0)' }}>
      <Header />
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;
