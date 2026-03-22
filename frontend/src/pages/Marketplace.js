import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { marketplaceAPI } from '../services/api';
import { Search, Filter, MapPin, Calendar, TrendingUp, Building2 } from 'lucide-react';

const Marketplace = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [deals, setDeals] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    sector: searchParams.get('sector') || '',
    revenue_min: searchParams.get('revenue_min') || '',
    revenue_max: searchParams.get('revenue_max') || '',
    operation_type: searchParams.get('operation_type') || '',
    country: searchParams.get('country') || '',
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Filter out empty parameters before sending to API
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
      } catch (error) {
        console.error('Error fetching marketplace data:', error);
        setDeals([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({
      sector: '',
      revenue_min: '',
      revenue_max: '',
      operation_type: '',
      country: '',
    });
    setSearchParams({});
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      published: { class: 'status-published', label: 'Activo' },
      nda: { class: 'status-nda', label: 'En NDA' },
      evaluation: { class: 'status-evaluation', label: 'Evaluación' },
      intent: { class: 'status-intent', label: 'Intent' },
    };
    return statusMap[status] || { class: 'status-published', label: 'Activo' };
  };

  return (
    <Layout>
      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-8" data-testid="marketplace-header">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="label-arroba text-arroba-coral mb-2">Marketplace</p>
              <h1 className="text-3xl font-bold text-slate-900">Oportunidades de Inversión</h1>
              <p className="text-slate-500 mt-2">
                {stats?.published_deals || 0} deals activos · {stats?.active_processes || 0} procesos en curso
              </p>
            </div>
            <Link to="/register?role=seller">
              <Button className="btn-primary" data-testid="list-agency-btn">
                PUBLICAR MI AGENCIA
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0" data-testid="filters-sidebar">
            <div className="card-arroba sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros
                </h3>
                <button 
                  onClick={clearFilters}
                  className="text-sm text-arroba-coral hover:underline"
                  data-testid="clear-filters-btn"
                >
                  Limpiar
                </button>
              </div>

              <div className="space-y-4">
                {/* Sector */}
                <div>
                  <label className="label-arroba mb-1 block">Sector</label>
                  <Select 
                    value={filters.sector || "all"} 
                    onValueChange={(value) => handleFilterChange('sector', value === "all" ? '' : value)}
                  >
                    <SelectTrigger className="w-full" data-testid="filter-sector">
                      <SelectValue placeholder="Todos los sectores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {sectors.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id}>
                          {sector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Operation Type */}
                <div>
                  <label className="label-arroba mb-1 block">Tipo de Operación</label>
                  <Select 
                    value={filters.operation_type || "all"} 
                    onValueChange={(value) => handleFilterChange('operation_type', value === "all" ? '' : value)}
                  >
                    <SelectTrigger className="w-full" data-testid="filter-operation">
                      <SelectValue placeholder="Todos los tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="full_sale">Venta Total</SelectItem>
                      <SelectItem value="partial_sale">Venta Parcial</SelectItem>
                      <SelectItem value="merger">Fusión</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Revenue Range */}
                <div>
                  <label className="label-arroba mb-1 block">Facturación</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.revenue_min}
                      onChange={(e) => handleFilterChange('revenue_min', e.target.value)}
                      className="input-arroba"
                      data-testid="filter-revenue-min"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.revenue_max}
                      onChange={(e) => handleFilterChange('revenue_max', e.target.value)}
                      className="input-arroba"
                      data-testid="filter-revenue-max"
                    />
                  </div>
                </div>

                {/* Country */}
                <div>
                  <label className="label-arroba mb-1 block">País</label>
                  <Select 
                    value={filters.country || "all"} 
                    onValueChange={(value) => handleFilterChange('country', value === "all" ? '' : value)}
                  >
                    <SelectTrigger className="w-full" data-testid="filter-country">
                      <SelectValue placeholder="Todos los países" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="España">España</SelectItem>
                      <SelectItem value="México">México</SelectItem>
                      <SelectItem value="Argentina">Argentina</SelectItem>
                      <SelectItem value="Colombia">Colombia</SelectItem>
                      <SelectItem value="Chile">Chile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </aside>

          {/* Deals Grid */}
          <div className="flex-1">
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
            ) : deals.length === 0 ? (
              <div className="card-arroba text-center py-12" data-testid="no-deals">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">No hay deals disponibles</h3>
                <p className="text-slate-500 mb-4">
                  No encontramos oportunidades con los filtros seleccionados.
                </p>
                <Button onClick={clearFilters} className="btn-outline">
                  Limpiar filtros
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6" data-testid="deals-grid">
                {deals.map((deal) => {
                  const statusInfo = getStatusBadge(deal.status);
                  return (
                    <Link 
                      key={deal.deal_id} 
                      to={`/marketplace/${deal.deal_id}`}
                      className="card-arroba hover:border-slate-300 transition-all hover:shadow-sm group"
                      data-testid={`deal-card-${deal.deal_id}`}
                    >
                      {/* Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <span className="badge-coral">{deal.teaser?.sector_display || 'Digital'}</span>
                          <span className={`badge-arroba ${statusInfo.class}`}>{statusInfo.label}</span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono uppercase">
                          {deal.operation_types_allowed?.[0] === 'full_sale' ? 'Venta' : 
                           deal.operation_types_allowed?.[0] === 'merger' ? 'Fusión' : 'Parcial'}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold mb-2 group-hover:text-arroba-coral transition-colors">
                        {deal.teaser?.headline || 'Agencia Digital'}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                        {deal.teaser?.description || 'Oportunidad de inversión en el sector digital'}
                      </p>

                      {/* Location & Year */}
                      <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                        {deal.teaser?.geography_display && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {deal.teaser.geography_display}
                          </span>
                        )}
                        {deal.teaser?.year_founded && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Fundada en {deal.teaser.year_founded}
                          </span>
                        )}
                      </div>

                      {/* Financials */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div>
                          <p className="label-arroba">Facturación</p>
                          <p className="font-bold text-slate-900 flex items-center gap-1">
                            {deal.teaser?.revenue_display || 'N/D'}
                          </p>
                        </div>
                        <div>
                          <p className="label-arroba">EBITDA</p>
                          <p className="font-bold text-slate-900 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-arroba-green" />
                            {deal.teaser?.ebitda_display || 'N/D'}
                          </p>
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <span className="text-sm font-medium text-arroba-coral group-hover:underline">
                          Ver oportunidad →
                        </span>
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
