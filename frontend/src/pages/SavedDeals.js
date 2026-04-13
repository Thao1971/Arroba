import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { engagementsAPI } from '../services/api';
import { Bookmark, ArrowRight, Loader2, Heart } from 'lucide-react';
import { Button } from '../components/ui/button';

const SavedDeals = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await engagementsAPI.listSaved();
        setDeals(res.data?.deals || res.data || []);
      } catch (e) {
        
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
      <div className="container mx-auto px-4 py-8 max-w-4xl" data-testid="saved-deals-page">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Guardados</h1>
        <p className="text-sm text-slate-500 mb-6">Deals que has guardado para revisar mas tarde</p>

        {deals.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-300 rounded-xl" data-testid="saved-empty">
            <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No tienes deals guardados</p>
            <p className="text-sm text-slate-400 mt-1 mb-4">Explora el marketplace y guarda los que te interesen</p>
            <Link to="/explorar">
              <Button variant="outline" size="sm">Explorar deals</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3" data-testid="saved-list">
            {deals.map((d) => {
              const deal = d.deal || d;
              const teaser = deal.teaser || {};
              return (
                <Link
                  key={deal.deal_id}
                  to={`/marketplace/${deal.deal_id}`}
                  className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:shadow-sm hover:border-slate-300 transition-all group"
                  data-testid={`saved-deal-${deal.deal_id}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-arroba-coral/10 flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5 text-arroba-coral" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{teaser.headline || deal.deal_id}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      {teaser.sector_display && <span>{teaser.sector_display}</span>}
                      {teaser.geography_display && <span>{teaser.geography_display}</span>}
                      {deal.status && (
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          deal.status === 'published' ? 'bg-green-100 text-green-700' :
                          deal.status === 'exclusivity' ? 'bg-purple-100 text-purple-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>{deal.status}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    {teaser.revenue_display && <p className="text-sm font-semibold text-slate-900">{teaser.revenue_display}</p>}
                    {teaser.ebitda_display && <p className="text-xs text-slate-500">EBITDA {teaser.ebitda_display}</p>}
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-arroba-coral transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SavedDeals;
