import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { dealsAPI, coachingAPI } from '../services/api';
import { Loader2, Users, ArrowRight, AlertTriangle, TrendingUp, FileText, Clock } from 'lucide-react';

const SellerInteresados = () => {
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState([]);
  const [allBuyers, setAllBuyers] = useState([]);
  const [nudges, setNudges] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [dealsRes, nudgesRes] = await Promise.all([
          dealsAPI.list(),
          coachingAPI.getSellerNudges(),
        ]);
        const myDeals = dealsRes.data || [];
        setDeals(myDeals);
        setNudges(nudgesRes.data?.nudges || []);

        // Fetch engagements for each deal
        const buyers = [];
        for (const deal of myDeals) {
          if (deal.status === 'draft') continue;
          try {
            const engRes = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/engagements/deal/${deal.deal_id}`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const engData = await engRes.json();
            const engs = engData.engagements || engData || [];
            if (Array.isArray(engs)) {
              for (const eng of engs) {
                // Get intent score
                let intentScore = 0;
                try {
                  const intentRes = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/tracking/intent/${deal.deal_id}/${eng.buyer_id}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                  });
                  const intentData = await intentRes.json();
                  intentScore = intentData.score || 0;
                } catch {}

                buyers.push({
                  ...eng,
                  deal_id: deal.deal_id,
                  deal_title: deal.teaser?.headline || deal.deal_id,
                  deal_status: deal.status,
                  intent_score: intentScore,
                });
              }
            }
          } catch {}
        }

        // Sort: LOI first, then by intent score descending
        buyers.sort((a, b) => {
          if (a.type === 'LOI' && b.type !== 'LOI') return -1;
          if (b.type === 'LOI' && a.type !== 'LOI') return 1;
          return (b.intent_score || 0) - (a.intent_score || 0);
        });

        setAllBuyers(buyers);
      } catch (e) {
        console.error('Error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stageLabel = (stage) => {
    const labels = {
      SUBMITTED: 'Enviado',
      VIEWED: 'Visto',
      SHORTLISTED: 'Shortlist',
      EXCLUSIVITY: 'Exclusividad',
      REJECTED: 'Descartado',
    };
    return labels[stage] || stage;
  };

  const stageColor = (stage) => {
    const colors = {
      SUBMITTED: 'bg-blue-100 text-blue-700',
      VIEWED: 'bg-slate-100 text-slate-600',
      SHORTLISTED: 'bg-green-100 text-green-700',
      EXCLUSIVITY: 'bg-purple-100 text-purple-700',
      REJECTED: 'bg-red-100 text-red-600',
    };
    return colors[stage] || 'bg-slate-100 text-slate-600';
  };

  const intentColor = (score) => {
    if (score >= 55) return 'text-green-600';
    if (score >= 25) return 'text-amber-600';
    return 'text-slate-400';
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl" data-testid="seller-interesados-page">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Interesados</h1>
        <p className="text-sm text-slate-500 mb-6">
          Todos los buyers de todos tus deals en un solo lugar
        </p>

        {/* Nudges (top 3 most important) */}
        {nudges.length > 0 && (
          <div className="space-y-2 mb-6" data-testid="interesados-nudges">
            {nudges.slice(0, 3).map((n, i) => (
              <Link key={n.id + i} to={n.deal_id ? `/seller/deal/${n.deal_id}` : '#'}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors hover:shadow-sm ${
                  n.priority === 'ALTA' ? 'bg-red-50 border-red-200' :
                  n.priority === 'MEDIA' ? 'bg-amber-50 border-amber-200' :
                  'bg-blue-50 border-blue-200'
                }`} data-testid={`interesados-nudge-${i}`}>
                <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${
                  n.priority === 'ALTA' ? 'text-red-600' : 'text-amber-600'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{n.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {allBuyers.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-300 rounded-xl" data-testid="interesados-empty">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Aun no tienes interesados</p>
            <p className="text-sm text-slate-400 mt-1">Publica un deal para empezar a recibir interes</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" data-testid="interesados-table">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left font-semibold text-slate-600 px-4 py-3">Deal</th>
                    <th className="text-left font-semibold text-slate-600 px-4 py-3">Buyer</th>
                    <th className="text-center font-semibold text-slate-600 px-4 py-3">Tipo</th>
                    <th className="text-center font-semibold text-slate-600 px-4 py-3">Estado</th>
                    <th className="text-center font-semibold text-slate-600 px-4 py-3">Intencion</th>
                    <th className="text-right font-semibold text-slate-600 px-4 py-3">LOI</th>
                    <th className="text-center font-semibold text-slate-600 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {allBuyers.map((b, i) => (
                    <tr key={b.engagement_id || i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors" data-testid={`interesado-row-${i}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 truncate max-w-[200px]">{b.deal_title}</p>
                        <p className="text-xs text-slate-400">{b.deal_id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{b.buyer_name || b.buyer_id}</p>
                        <p className="text-xs text-slate-400 capitalize">{b.buyer_type || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          b.type === 'LOI' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {b.type === 'LOI' ? <FileText className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                          {b.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stageColor(b.stage)}`}>
                          {stageLabel(b.stage)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold ${intentColor(b.intent_score)}`}>{b.intent_score}</span>
                        <span className="text-slate-400 text-xs">/100</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {b.valuation_offer ? (
                          <span className="font-semibold text-slate-900">{(b.valuation_offer / 1e6).toFixed(1)}M</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link to={`/seller/deal/${b.deal_id}`} className="text-arroba-coral hover:text-arroba-coral/80">
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
              {allBuyers.length} interesados en {deals.filter(d => d.status !== 'draft').length} deals activos
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SellerInteresados;
