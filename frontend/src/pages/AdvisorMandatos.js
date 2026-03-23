import React from 'react';
import Layout from '../components/layout/Layout';
import { Link } from 'react-router-dom';
import { Briefcase, ArrowRight, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';

const AdvisorMandatos = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl" data-testid="advisor-mandatos-page">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Mandatos</h1>
        <p className="text-sm text-slate-500 mb-8">Gestiona los mandatos de tus sellers</p>

        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center" data-testid="mandatos-placeholder">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">En preparacion</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            El modulo de mandatos permitira gestionar operaciones de venta para tus sellers directamente desde tu panel: crear deals, shortlistar buyers, otorgar exclusividad y monitorizar actividad — todo sin que el seller tenga que estar presente.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto mb-6">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="font-semibold text-slate-900 text-sm">Multi-mandato</p>
              <p className="text-xs text-slate-500 mt-0.5">Gestiona varios sellers</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="font-semibold text-slate-900 text-sm">Operar como seller</p>
              <p className="text-xs text-slate-500 mt-0.5">Publica y gestiona deals</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="font-semibold text-slate-900 text-sm">Vista unificada</p>
              <p className="text-xs text-slate-500 mt-0.5">Todos los mandatos</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
            <Clock className="w-4 h-4" />
            <span>Disponible en la proxima fase</span>
          </div>
        </div>

        {/* Temporary: explore marketplace */}
        <div className="mt-6 flex justify-center">
          <Link to="/explorar">
            <Button variant="outline" className="gap-2">
              Explorar marketplace <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default AdvisorMandatos;
