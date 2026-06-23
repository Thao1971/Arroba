import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { marketplaceAPI, matchingAPI, engagementsAPI, dealPresentationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, MapPin, Calendar, TrendingUp, Building2, Zap, Sparkles, ArrowUpDown, MoreHorizontal, Copy, Share2, X, Heart, Lock, ArrowRight, Shield } from 'lucide-react';
import { SPAIN_PROVINCES } from './BuyerOnboarding';

const ShareMenu = ({ dealId, title }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/explorar/${dealId}`;
  const shareTitle = title ? `${title} — ARROBA` : 'Oportunidad en ARROBA';

  const copyUrl = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* fallback */ }
  };

  const nativeShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      try { await navigator.share({ title: shareTitle, text: shareTitle, url }); } catch {}
    } else { copyUrl(e); }
    setOpen(false);
  };

  const toggle = (e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); };

  if (!open) {
    return (
      <button onClick={toggle} className="p-1.5 transition-opacity opacity-0 group-hover:opacity-100"
        style={{ color: 'var(--outline)' }} data-testid={`share-btn-${dealId}`}>
        <MoreHorizontal size={16} />
      </button>
    );
  }

  return (
    <div className="relative" onClick={e => e.preventDefault()}>
      <button onClick={toggle} className="p-1.5" style={{ color: 'var(--outline)' }}><X size={14} /></button>
      <div className="absolute right-0 top-8 z-20 py-1 min-w-[160px]"
        style={{ background: 'var(--surface-lowest)', boxShadow: '0 8px 24px rgba(25,28,30,0.12)' }}>
        <button onClick={copyUrl} className="w-full px-4 py-2.5 text-left text-xs font-semibold flex items-center gap-2 hover:opacity-70"
          style={{ color: 'var(--on-surface)' }} data-testid={`copy-url-${dealId}`}>
          <Copy size={12} /> {copied ? 'Copiado' : 'Copiar enlace'}
        </button>
        <button onClick={nativeShare} className="w-full px-4 py-2.5 text-left text-xs font-semibold flex items-center gap-2 hover:opacity-70"
          style={{ color: 'var(--on-surface)' }} data-testid={`share-native-${dealId}`}>
          <Share2 size={12} /> Compartir
        </button>
      </div>
    </div>
  );
};

const opTypeLabels = {
  full_sale: { text: 'Venta Total', color: 'bg-arroba-coral/10 text-arroba-coral' },
  partial_sale: { text: 'Venta Parcial', color: 'bg-arroba-blue/10 text-arroba-blue' },
  merger: { text: 'Fusión', color: 'bg-purple-100 text-purple-700' },
};

const affinityConfig = {
  high: { label: 'Alta afinidad', class: 'bg-green-100 text-green-700', icon: Zap },
  medium: { label: 'Afinidad media', class: 'bg-yellow-100 text-yellow-700', icon: Sparkles },
  low: { label: 'Baja afinidad', class: 'bg-slate-100 text-slate-500', icon: null },
};

const signalConfig = {
  loi: { dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
  competition: { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
  process: { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
  dr_activity: { dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
  freshness: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
};

const SignalBadge = ({ signal }) => {
  const cfg = signalConfig[signal.type] || signalConfig.freshness;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.bg} ${cfg.text}`}
      data-testid={`signal-${signal.type}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {signal.text}
    </span>
  );
};

const Marketplace = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [deals, setDeals] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [sortBy, setSortBy] = useState('actividad');
  const [matchData, setMatchData] = useState({}); // deal_id -> {affinity, affinity_label}
  const [savedIds, setSavedIds] = useState(new Set());
  const [cardPresentations, setCardPresentations] = useState({}); // deal_id -> card presentation
  const buyerProfileComplete = user?.buyer_profile?.profile_complete;
  
  const [filters, setFilters] = useState({
    sector: searchParams.get('sector') || '',
    operation_type: searchParams.get('operation_type') || '',
    revenue_min: searchParams.get('revenue_min') || '',
    revenue_max: searchParams.get('revenue_max') || '',
    ebitda_min: searchParams.get('ebitda_min') || '',
    ebitda_max: searchParams.get('ebitda_max') || '',
    province: searchParams.get('province') || '',
    size: searchParams.get('size') || '',
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const cleanFilters = Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '' && v != null)
        );
        
        const [dealsRes, sectorsRes, statsRes] = await Promise.all([
          marketplaceAPI.listDeals(cleanFilters),
          marketplaceAPI.getSectors(),
          marketplaceAPI.getStats()
        ]);
        setDeals(dealsRes.data);
        setSectors(sectorsRes.data);
        setStats(statsRes.data);

        // If buyer has complete profile, fetch matching data
        if (isAuthenticated && buyerProfileComplete) {
          try {
            const matchRes = await matchingAPI.getRecommendedDeals();
            const map = {};
            (matchRes.data.deals || []).forEach(d => {
              map[d.deal_id] = { affinity: d.affinity, label: d.affinity_label };
            });
            setMatchData(map);
          } catch {}
        }
        // Fetch saved deals for heart state
        if (isAuthenticated) {
          try {
            const savedRes = await engagementsAPI.listSaved();
            const ids = new Set((savedRes.data?.deals || []).map(d => d.deal_id));
            setSavedIds(ids);
          } catch {}
          // Fetch card presentations (plan-aware CTAs)
          try {
            const dealIds = (dealsRes.data || []).map(d => d.deal_id);
            if (dealIds.length > 0 && user?.role === 'buyer') {
              const presRes = await dealPresentationAPI.batchPresentations({ deal_ids: dealIds });
              const map = {};
              (presRes.data || []).forEach(p => { map[p.deal_id] = p; });
              setCardPresentations(map);
            }
          } catch {}
        }
      } catch (error) {
        
        setDeals([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters, isAuthenticated, buyerProfileComplete, user?.role]);

  // Sort deals
  const sortedDeals = React.useMemo(() => {
    if (sortBy === 'recent') {
      return [...deals].sort((a, b) => {
        const dateA = new Date(a.published_at || a.created_at || 0);
        const dateB = new Date(b.published_at || b.created_at || 0);
        return dateB - dateA;
      });
    }
    if (sortBy === 'relevance' && buyerProfileComplete) {
      return [...deals].sort((a, b) => {
        const scoreA = matchData[a.deal_id] ? { high: 3, medium: 2, low: 1 }[matchData[a.deal_id].affinity] || 0 : 0;
        const scoreB = matchData[b.deal_id] ? { high: 3, medium: 2, low: 1 }[matchData[b.deal_id].affinity] || 0 : 0;
        return scoreB - scoreA;
      });
    }
    // Default: "actividad" — backend already sorts by score
    return deals;
  }, [deals, sortBy, matchData, buyerProfileComplete]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({ sector: '', operation_type: '', revenue_min: '', revenue_max: '', ebitda_min: '', ebitda_max: '', province: '', size: '' });
    setSearchParams({});
  };

  const toggleSave = async (dealId, e) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) return;
    const isSaved = savedIds.has(dealId);
    // Optimistic update
    setSavedIds(prev => { const next = new Set(prev); if (isSaved) next.delete(dealId); else next.add(dealId); return next; });
    try {
      if (isSaved) await engagementsAPI.unsaveDeal(dealId);
      else await engagementsAPI.saveDeal(dealId);
    } catch { setSavedIds(prev => { const next = new Set(prev); if (isSaved) next.add(dealId); else next.delete(dealId); return next; }); }
  };

  return (
    <Layout>
      {/* Header */}
      <section className="py-8" style={{ background: 'var(--surface-lowest)', borderBottom: '1px solid var(--surface-2)' }} data-testid="marketplace-header">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="label-arroba mb-2" style={{ color: 'var(--arroba-primary)' }}>LISTADO DE AGENCIAS</p>
              <h1 className="text-3xl font-extrabold" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>Oportunidades de inversión</h1>
              <p className="text-sm mt-2" style={{ color: 'var(--outline)' }}>
                {stats?.published_deals || 0} deals activos &middot; {stats?.active_processes || 0} procesos en curso
              </p>
            </div>
            <Link to="/register?role=seller">
              <button className="btn-primary" data-testid="list-agency-btn">PUBLICAR MI AGENCIA</button>
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0" data-testid="filters-sidebar">
            <div className="card-arroba sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2"><Filter className="w-4 h-4" /> Filtros</h3>
                <button onClick={clearFilters} className="text-sm text-arroba-coral hover:underline" data-testid="clear-filters-btn">Limpiar</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label-arroba mb-1 block">Sector</label>
                  <Select value={filters.sector || "all"} onValueChange={(value) => handleFilterChange('sector', value === "all" ? '' : value)}>
                    <SelectTrigger className="w-full" data-testid="filter-sector"><SelectValue placeholder="Todos los sectores" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {sectors.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id}>{sector.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="label-arroba mb-1 block">Tipo de operación</label>
                  <Select value={filters.operation_type || "all"} onValueChange={(value) => handleFilterChange('operation_type', value === "all" ? '' : value)}>
                    <SelectTrigger className="w-full" data-testid="filter-operation"><SelectValue placeholder="Todos los tipos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="full_sale">Venta Total</SelectItem>
                      <SelectItem value="partial_sale">Venta Parcial</SelectItem>
                      <SelectItem value="merger">Fusión</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="label-arroba mb-1 block">Facturación</label>
                  <Select value={filters.revenue_min || "all"} onValueChange={(value) => { const ranges = { '0-1M': ['0','1000000'], '1M-3M': ['1000000','3000000'], '3M-10M': ['3000000','10000000'], '10M+': ['10000000',''] }; if (value === 'all') { handleFilterChange('revenue_min', ''); handleFilterChange('revenue_max', ''); } else { const [min, max] = ranges[value] || ['','']; setFilters(prev => ({ ...prev, revenue_min: min, revenue_max: max })); } }}>
                    <SelectTrigger className="w-full" data-testid="filter-revenue"><SelectValue placeholder="Cualquier facturación" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Cualquier facturación</SelectItem>
                      <SelectItem value="0-1M">Hasta 1M €</SelectItem>
                      <SelectItem value="1M-3M">1M – 3M €</SelectItem>
                      <SelectItem value="3M-10M">3M – 10M €</SelectItem>
                      <SelectItem value="10M+">Más de 10M €</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="label-arroba mb-1 block">Margen EBITDA (%)</label>
                  <Select value={filters.ebitda_min || "all"} onValueChange={(value) => { if (value === 'all') { handleFilterChange('ebitda_min', ''); handleFilterChange('ebitda_max', ''); } else { setFilters(prev => ({ ...prev, ebitda_min: value, ebitda_max: '' })); } }}>
                    <SelectTrigger className="w-full" data-testid="filter-ebitda"><SelectValue placeholder="Cualquier margen" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Cualquier margen</SelectItem>
                      <SelectItem value="5">Más del 5%</SelectItem>
                      <SelectItem value="10">Más del 10%</SelectItem>
                      <SelectItem value="15">Más del 15%</SelectItem>
                      <SelectItem value="20">Más del 20%</SelectItem>
                      <SelectItem value="25">Más del 25%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="label-arroba mb-1 block">Provincia</label>
                  <Select value={filters.province || "all"} onValueChange={(value) => handleFilterChange('province', value === "all" ? '' : value)}>
                    <SelectTrigger className="w-full" data-testid="filter-province"><SelectValue placeholder="Todas las provincias" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {SPAIN_PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="label-arroba mb-1 block">Tamaño</label>
                  <Select value={filters.size || "all"} onValueChange={(value) => handleFilterChange('size', value === "all" ? '' : value)}>
                    <SelectTrigger className="w-full" data-testid="filter-size"><SelectValue placeholder="Cualquier tamaño" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Cualquier tamaño</SelectItem>
                      <SelectItem value="1-10">1 – 10 empleados</SelectItem>
                      <SelectItem value="11-25">11 – 25 empleados</SelectItem>
                      <SelectItem value="26-50">26 – 50 empleados</SelectItem>
                      <SelectItem value="51-100">51 – 100 empleados</SelectItem>
                      <SelectItem value="100+">Más de 100 empleados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </aside>

          {/* Deals Grid */}
          <div className="flex-1">
            {/* Sort bar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">{sortedDeals.length} resultados</p>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-slate-400" />
                <Select value={sortBy} onValueChange={(v) => setSortBy(v)}>
                  <SelectTrigger className="w-48 h-9 text-sm" data-testid="sort-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actividad">Mayor actividad</SelectItem>
                    <SelectItem value="recent">Mas recientes</SelectItem>
                    {isAuthenticated && buyerProfileComplete && (
                      <SelectItem value="relevance">Por relevancia</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="card-arroba animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
                    <div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-full mb-4"></div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      <div className="h-12 bg-slate-200 rounded"></div>
                      <div className="h-12 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedDeals.length === 0 ? (
              <div className="card-arroba text-center py-12" data-testid="no-deals">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">No hay deals disponibles</h3>
                <p className="text-slate-500 mb-4">No encontramos oportunidades con los filtros seleccionados.</p>
                <Button onClick={clearFilters} className="btn-outline">Limpiar filtros</Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6" data-testid="deals-grid">
                {sortedDeals.map((deal) => {
                  const teaser = deal.teaser_full || deal.teaser || {};
                  const opTypes = deal.operation_types_allowed || [];
                  const highlights = (teaser.highlights || []).slice(0, 2);
                  const dealMatch = matchData[deal.deal_id];
                  const signals = deal.signals || [];
                  const cp = cardPresentations[deal.deal_id];
                  const isFreeBlocked = cp?.buyer_tier === 'free' && cp?.visibility_state === 'LOCKED_CONTACT_REQUIRED';
                  const showFins = !cp || cp.show_financials;

                  return (
                    <Link key={deal.deal_id} to={`/explorar/${deal.deal_id}`}
                      className="group relative transition-all duration-200"
                      style={{ background: 'var(--surface-lowest)', boxShadow: '0 2px 8px rgba(25,28,30,0.04)' }}
                      data-testid={`deal-card-${deal.deal_id}`}>
                      {cp?.is_premium && <div className="absolute top-0 right-0 px-2 py-0.5 text-[8px] font-bold" style={{ background: 'var(--arroba-primary)', color: '#fff' }}>PRO+</div>}
                      <div className="p-5">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-bold px-2 py-0.5" style={{ background: 'rgba(182,33,42,0.06)', color: 'var(--arroba-primary)' }}>{teaser.sector_display || 'Digital'}</span>
                          {dealMatch && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${affinityConfig[dealMatch.affinity]?.class || 'bg-slate-100 text-slate-500'}`}
                              data-testid={`affinity-${deal.deal_id}`}>
                              {affinityConfig[dealMatch.affinity]?.icon && React.createElement(affinityConfig[dealMatch.affinity].icon, { className: "w-3 h-3" })}
                              {dealMatch.label}
                            </span>
                          )}
                          {cp?.visibility_state === 'CONTACT_REQUESTED' && <span className="text-[9px] font-bold px-2 py-0.5" style={{ background: '#d9770615', color: '#d97706' }}>SOLICITUD ENVIADA</span>}
                          {cp?.has_nda && <span className="text-[9px] font-bold px-2 py-0.5" style={{ background: 'rgba(22,163,74,0.06)', color: '#16a34a' }}>NDA FIRMADO</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          {opTypes.slice(0, 2).map(t => {
                            const l = opTypeLabels[t] || { text: t, color: 'bg-slate-100 text-slate-600' };
                            return <span key={t} className="text-[9px] font-bold px-2 py-0.5" style={{ background: 'var(--surface-2)', color: 'var(--outline)' }}>{l.text}</span>;
                          })}
                          <ShareMenu dealId={deal.deal_id} title={teaser.title || teaser.headline} />
                          {isAuthenticated && (
                            <button onClick={(e) => toggleSave(deal.deal_id, e)}
                              className="p-1.5 transition-colors" style={{ color: savedIds.has(deal.deal_id) ? 'var(--arroba-primary)' : 'var(--outline)' }}
                              data-testid={`save-heart-${deal.deal_id}`}>
                              <Heart size={16} fill={savedIds.has(deal.deal_id) ? 'currentColor' : 'none'} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-bold mb-1" style={{ color: 'var(--on-surface)' }}>
                        {teaser.title || teaser.headline || 'Oportunidad de Inversion'}
                      </h3>

                      {/* Description */}
                      <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--outline)' }}>
                        {teaser.short_description || teaser.description || 'Oportunidad en el sector digital'}
                      </p>

                      {/* Soft Signals */}
                      {signals.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3" data-testid={`signals-${deal.deal_id}`}>
                          {signals.map((s, i) => <SignalBadge key={i} signal={s} />)}
                        </div>
                      )}

                      {/* Highlights (max 2) */}
                      {highlights.length > 0 && (
                        <div className="mb-3 space-y-1">
                          {highlights.map((h, i) => (
                            <p key={i} className="text-[10px] flex items-center gap-1" style={{ color: 'var(--outline)' }}>
                              <span className="w-1 h-1 flex-shrink-0" style={{ background: '#16a34a' }} /> {h}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Location */}
                      <div className="flex items-center gap-4 text-xs mb-3" style={{ color: 'var(--outline)' }}>
                        {(teaser.location || teaser.geography_display) && (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {teaser.location || teaser.geography_display}</span>
                        )}
                        {teaser.year_founded && (
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {teaser.year_founded}</span>
                        )}
                      </div>

                      {/* Financials */}
                      <div className="grid grid-cols-2 gap-4 pt-3" style={{ borderTop: '1px solid var(--surface-2)' }}>
                        <div>
                          <p className="label-arroba">FACTURACION</p>
                          {showFins ? (
                            <p className="font-bold" style={{ color: 'var(--on-surface)' }}>{teaser.revenue_range || teaser.revenue_display || 'N/D'}</p>
                          ) : (
                            <p className="text-[10px] flex items-center gap-1" style={{ color: 'var(--outline)' }}><Lock size={10} /> Contactar</p>
                          )}
                        </div>
                        <div>
                          <p className="label-arroba">EBITDA</p>
                          {showFins ? (
                            <p className="font-bold flex items-center gap-1" style={{ color: 'var(--on-surface)' }}>
                              <TrendingUp className="w-3 h-3" style={{ color: '#16a34a' }} />
                              {teaser.ebitda_range || teaser.ebitda_display || 'N/D'}
                            </p>
                          ) : (
                            <p className="text-[10px] flex items-center gap-1" style={{ color: 'var(--outline)' }}><Lock size={10} /> Contactar</p>
                          )}
                        </div>
                      </div>

                      {/* CTA — plan-aware */}
                      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--surface-2)' }}>
                        {cp?.card_cta ? (
                          <span className="text-[11px] font-bold flex items-center gap-1" style={{ color: cp.card_cta.action === 'wait' ? 'var(--outline)' : 'var(--arroba-primary)' }}>
                            {cp.card_cta.action === 'wait' ? <Shield size={11} /> : null}
                            {cp.card_cta.label} {cp.card_cta.action !== 'wait' && <ArrowRight size={11} />}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold" style={{ color: 'var(--arroba-primary)' }}>Ver oportunidad <ArrowRight size={11} className="inline" /></span>
                        )}
                      </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Marketplace;
