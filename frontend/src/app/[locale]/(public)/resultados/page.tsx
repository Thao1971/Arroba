'use client';
/**
 * `/resultados` — página de resultados de búsqueda (pública). Tabla rica al
 * estilo del diseño: fila por empresa con datos financieros, badge de señal,
 * fila expandible con métricas + acciones, filtro por sector, barra de acciones
 * (Exportar), paginación. Reutiliza el Search Skill del Copilot.
 *
 * Las columnas financieras se pintan desde `item.summary` (REQ a Intel: cada
 * SearchHit trae `summary`). Mientras Intel no lo devuelva, muestran «—» sin
 * romper. Si la consulta resuelve a una sola empresa, redirige a su ficha.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  ArrowRight,
  ChevronDown,
  Download,
  GitCompare,
  Columns3,
  MoreHorizontal,
  MapPin,
  Users,
  Tag,
  TrendingUp,
  AlertTriangle,
  Flame,
  CircleDollarSign,
  CheckCircle2,
} from 'lucide-react';

import { apiClient } from '@/lib/api/client';
import type { SearchResultItem } from '@/components/blocks';
import { cn } from '@/lib/cn';
import { applySignalFilter } from './_signal-filter';

interface RowSummary {
  revenue?: number | null;
  ebitda?: number | null;
  ebitda_margin?: number | null; // 0..1 or 0..100
  growth_pct?: number | null;
  signal_score?: number | null; // 0..100
  signal_badge?: string | null;
  valuation?: {
    low?: number | null;
    mid?: number | null;
    high?: number | null;
    currency?: string | null;
    basis?: string | null;
  } | null;
  employees?: number | null;
  arroba_score?: number | null;
  city?: string | null;
  activity_label?: string | null;
  updated_at?: string | null;
}
type Row = SearchResultItem & { summary?: RowSummary | null };

const PAGE_SIZE = 12; // debe coincidir con _RESULTS_PAGE del backend

const BADGES: Record<
  string,
  { label: string; tone: 'ok' | 'warn'; icon: typeof Flame }
> = {
  comprando: { label: 'Comprando', tone: 'ok', icon: CheckCircle2 },
  alto_crecimiento: { label: 'Alto crecimiento', tone: 'ok', icon: Flame },
  riesgo: { label: 'Riesgo', tone: 'warn', icon: AlertTriangle },
  buscando_financiacion: {
    label: 'Buscando financiación',
    tone: 'warn',
    icon: CircleDollarSign,
  },
};

function eur(n?: number | null): string {
  if (n == null) return '—';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} M€`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1000)} k€`;
  return `${Math.round(n)} €`;
}
function pct(n?: number | null): string {
  if (n == null) return '—';
  const v = Math.round(n);
  return `${v > 0 ? '+' : ''}${v}%`;
}
function margin(n?: number | null): string {
  if (n == null) return '';
  const v = n <= 1 ? n * 100 : n;
  return `${v.toFixed(1).replace('.', ',')}%`;
}

export default function ResultadosPage() {
  const router = useRouter();
  const params = useSearchParams();
  const q = (params.get('q') || '').trim();

  const [input, setInput] = useState(q);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sector, setSector] = useState<string | null>(null);
  // HARDENING-032 · Filtro por signal_badge client-side. Toggles independientes
  // combinables (AND). Intel emite hoy los badges en snake_case ES
  // (`alto_crecimiento`, `riesgo`, `estable`, `comprando`, `buscando_financiacion`).
  // Comparamos con tokens defensivos (ES + EN) por si Intel migra el vocabulario
  // en el futuro sin regresión visual. Sin persistencia (URL/localStorage) —
  // HARDENING-031 aborda persistencia por separado.
  const [onlyGrowth, setOnlyGrowth] = useState(false);
  const [excludeRisk, setExcludeRisk] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);

  const fetchResults = useCallback(
    async (query: string, pageIdx: number) => {
      setLoading(true);
      setError(null);
      setExpanded(null);
      try {
        const res = await apiClient.copilot.search({
          query,
          context: { locale: 'es', pathname: '/resultados' },
          offset: pageIdx * PAGE_SIZE,
        });
        if (res.navigate_to) {
          router.replace(res.navigate_to);
          return;
        }
        let items: Row[] = [];
        let count = 0;
        if (res.disambiguation?.length) {
          items = res.disambiguation.map((d) => ({
            master_company_id: d.master_company_id,
            name: d.name,
            legal_name: d.name,
            cif: d.cif,
            sector: d.sector,
            city: d.region,
            score: 1,
          }));
          count = items.length;
        } else {
          const block = res.workspace?.blocks?.find((b) => b.type === 'search_results');
          if (block && block.type === 'search_results') {
            items = block.props.results as Row[];
            // total real del conjunto (servidor); fallback al tamaño de página.
            count = (block.props.total as number | undefined) ?? items.length;
          }
        }
        setRows(items);
        setTotal(count);
        setPage(pageIdx);
      } catch {
        setError('No hemos podido cargar los resultados. Inténtalo de nuevo.');
        setRows([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  // Nueva búsqueda (cambia q): resetea filtros/selección y pide la página 0.
  useEffect(() => {
    setInput(q);
    setSector(null);
    setOnlyGrowth(false);
    setExcludeRisk(false);
    setSelected(new Set());
    if (q) void fetchResults(q, 0);
    else {
      setRows([]);
      setTotal(0);
    }
  }, [q, fetchResults]);

  function goToPage(next: number) {
    const clamped = Math.max(0, Math.min(next, pages - 1));
    if (clamped === page || loading) return;
    void fetchResults(q, clamped);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = input.trim();
    if (v) router.push(`/resultados?q=${encodeURIComponent(v)}`);
  }

  const sectors = useMemo(
    () => Array.from(new Set(rows.map((r) => r.sector).filter(Boolean) as string[])).sort(),
    [rows],
  );
  // `rows` ya es la página actual servida por el backend (offset = page*PAGE_SIZE).
  // El chip de sector y los toggles de signal_badge afinan la página visible;
  // la paginación se rige por `total` (server-side).
  const pageRows = useMemo(() => {
    const bySector = sector ? rows.filter((r) => r.sector === sector) : rows;
    return applySignalFilter(bySector, { onlyGrowth, excludeRisk });
  }, [rows, sector, onlyGrowth, excludeRisk]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function toggleSel(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function exportCsv() {
    const head = ['Empresa', 'CIF', 'Sector', 'Ingresos', 'EBITDA', 'Crecimiento', 'Score señales', 'Afinidad'];
    const lines = pageRows.map((r) =>
      [
        r.name,
        r.cif ?? '',
        r.sector ?? '',
        r.summary?.revenue ?? '',
        r.summary?.ebitda ?? '',
        r.summary?.growth_pct ?? '',
        r.summary?.signal_score ?? '',
        Math.round((r.score ?? 0) * 100),
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(','),
    );
    const blob = new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultados-${q || 'busqueda'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div data-testid="resultados-page" className="max-w-6xl mx-auto px-6 py-8">
      {/* Buscador */}
      <form
        onSubmit={submit}
        className="flex items-center gap-2 px-4 h-12 rounded-[13px] border-[1.5px] border-border-strong bg-surface mb-6 transition-colors focus-within:border-primary"
      >
        <Search size={18} strokeWidth={1.6} className="text-text-subtle shrink-0" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Busca empresas, sectores o ubicaciones…"
          aria-label="Buscar"
          data-testid="resultados-search-input"
          className="flex-1 h-full bg-transparent border-none outline-none text-[15px] text-text placeholder:text-text-subtle"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Buscar"
          className="inline-flex items-center justify-center h-8 w-8 rounded-[9px] bg-primary text-white hover:bg-primary-hover disabled:opacity-40 transition-colors shrink-0"
        >
          <ArrowRight size={16} strokeWidth={1.8} />
        </button>
      </form>

      {q && (
        <header className="mb-4">
          <h1 className="font-display font-bold text-2xl md:text-[28px] tracking-tight text-text">
            {q}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {total} resultado{total === 1 ? '' : 's'}
          </p>
        </header>
      )}

      {/* Chips de filtro por sector */}
      {q && !loading && !error && sectors.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4" data-testid="resultados-filters">
          {sectors.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSector(sector === s ? null : s)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold border transition-colors',
                sector === s
                  ? 'bg-surface-2 border-border-strong text-text'
                  : 'bg-surface border-border text-text-muted hover:border-border-strong',
              )}
            >
              {s}
              {sector === s && <span className="text-text-subtle">✕</span>}
            </button>
          ))}
        </div>
      )}

      {/* Barra de acciones */}
      {q && !loading && !error && rows.length > 0 && (
        <div className="flex items-center justify-between gap-2 mb-2 text-sm">
          {/* HARDENING-032 · Chips de filtro por signal_badge (client-side). */}
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="resultados-signal-filters"
          >
            <button
              type="button"
              role="switch"
              aria-checked={onlyGrowth}
              aria-label="Sólo alto crecimiento"
              onClick={() => setOnlyGrowth((v) => !v)}
              data-testid="filter-chip-growth"
              data-active={onlyGrowth ? 'true' : 'false'}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold border transition-colors',
                onlyGrowth
                  ? 'bg-success/10 border-success/40 text-success'
                  : 'bg-surface border-border text-text-muted hover:border-border-strong',
              )}
            >
              <Flame size={12} strokeWidth={2} />
              Sólo alto crecimiento
              {onlyGrowth && <span className="text-text-subtle">✕</span>}
            </button>
            <button
              type="button"
              role="switch"
              aria-checked={excludeRisk}
              aria-label="Excluir riesgo"
              onClick={() => setExcludeRisk((v) => !v)}
              data-testid="filter-chip-exclude-risk"
              data-active={excludeRisk ? 'true' : 'false'}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold border transition-colors',
                excludeRisk
                  ? 'bg-warning/10 border-warning/40 text-warning'
                  : 'bg-surface border-border text-text-muted hover:border-border-strong',
              )}
            >
              <AlertTriangle size={12} strokeWidth={2} />
              Excluir riesgo
              {excludeRisk && <span className="text-text-subtle">✕</span>}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[9px] text-text-muted hover:bg-surface-2 transition-colors"
            >
              <Download size={16} strokeWidth={1.6} /> Exportar
            </button>
            <button
              type="button"
              disabled={selected.size < 2}
              title={selected.size < 2 ? 'Selecciona al menos dos empresas' : 'Próximamente'}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[9px] text-text-muted hover:bg-surface-2 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              <GitCompare size={16} strokeWidth={1.6} /> Comparar
              {selected.size > 0 && ` (${selected.size})`}
            </button>
            <button
              type="button"
              disabled
              title="Próximamente"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[9px] text-text-muted opacity-40"
            >
              <Columns3 size={16} strokeWidth={1.6} /> Columnas
            </button>
            <button type="button" disabled title="Próximamente" className="h-9 w-9 inline-flex items-center justify-center rounded-[9px] text-text-muted opacity-40">
              <MoreHorizontal size={16} strokeWidth={1.6} />
            </button>
          </div>
        </div>
      )}

      {/* Estados */}
      {loading && (
        <div data-testid="resultados-loading" className="space-y-2 mt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-surface border border-border animate-pulse" />
          ))}
        </div>
      )}
      {!loading && error && (
        <div data-testid="resultados-error" className="mt-6 border border-danger/30 bg-danger/5 rounded-xl p-6 text-sm text-text-muted">
          {error}{' '}
          <button type="button" onClick={() => q && fetchResults(q, page)} className="text-primary font-semibold hover:underline">
            Reintentar
          </button>
        </div>
      )}
      {!q && !loading && (
        <p className="mt-8 text-center text-sm text-text-muted">Escribe qué empresas buscas para empezar.</p>
      )}
      {q && !loading && !error && rows.length === 0 && (
        <p data-testid="resultados-empty" className="mt-8 text-center text-sm text-text-muted">
          No hemos encontrado empresas para «{q}». Prueba con otras palabras o con un nombre o CIF.
        </p>
      )}
      {q && !loading && !error && rows.length > 0 && pageRows.length === 0 && (
        <p
          data-testid="resultados-filter-empty"
          className="mt-8 text-center text-sm text-text-muted"
        >
          Ningún resultado en esta página cumple los filtros activos. Ajusta los
          chips o navega a otra página.
        </p>
      )}

      {/* Tabla */}
      {q && !loading && !error && pageRows.length > 0 && (
        <div className="border-t border-border">
          {/* Cabecera de columnas */}
          <div className="hidden md:grid grid-cols-[minmax(220px,1.6fr)_repeat(4,1fr)_0.8fr] gap-3 px-2 py-2 text-[11px] uppercase tracking-wide text-text-subtle border-b border-border">
            <span>Empresa</span>
            <span className="text-right">Ingresos</span>
            <span className="text-right">EBITDA</span>
            <span className="text-right">Crecim.</span>
            <span>Score señales</span>
            <span className="text-right">Actualizado</span>
          </div>

          <ul data-testid="resultados-list">
            {pageRows.map((r) => {
              const s = r.summary || {};
              const badge = s.signal_badge ? BADGES[s.signal_badge] : undefined;
              const isOpen = expanded === r.master_company_id;
              return (
                <li key={r.master_company_id} className="border-b border-border">
                  <div className="grid md:grid-cols-[minmax(220px,1.6fr)_repeat(4,1fr)_0.8fr] grid-cols-1 gap-3 px-2 py-3 items-center">
                    {/* Empresa */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={selected.has(r.master_company_id)}
                        onChange={() => toggleSel(r.master_company_id)}
                        aria-label={`Seleccionar ${r.name}`}
                        className="shrink-0 accent-[var(--primary)]"
                      />
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : r.master_company_id)}
                        aria-label={isOpen ? 'Contraer' : 'Expandir'}
                        className="shrink-0 text-text-subtle hover:text-text"
                      >
                        <ChevronDown size={16} className={cn('transition-transform', isOpen && 'rotate-180')} />
                      </button>
                      <span className="inline-flex w-8 h-8 rounded-lg bg-surface-2 border border-border items-center justify-center text-xs font-display font-bold text-text shrink-0">
                        {(r.name || '?').slice(0, 2).toUpperCase()}
                      </span>
                      <button
                        type="button"
                        onClick={() => r.cif && router.push(`/empresa-f01/${r.cif}`)}
                        disabled={!r.cif}
                        className="text-left min-w-0"
                      >
                        <span className="block text-sm font-display font-semibold text-text truncate hover:text-primary">
                          {r.name}
                        </span>
                        <span className="block text-xs text-text-muted truncate">
                          {r.summary?.activity_label || r.sector || '—'}
                        </span>
                      </button>
                    </div>
                    {/* Ingresos */}
                    <div className="text-right text-sm tabular-nums text-text">{eur(s.revenue)}</div>
                    {/* EBITDA + margen */}
                    <div className="text-right text-sm tabular-nums text-text">
                      {eur(s.ebitda)}
                      {s.ebitda_margin != null && (
                        <span className="block text-[11px] text-text-subtle">{margin(s.ebitda_margin)}</span>
                      )}
                    </div>
                    {/* Crecimiento */}
                    <div className={cn('text-right text-sm font-semibold tabular-nums', (s.growth_pct ?? 0) >= 10 ? 'text-success' : (s.growth_pct ?? 0) > 0 ? 'text-warning' : 'text-text-muted')}>
                      {pct(s.growth_pct)}
                    </div>
                    {/* Score señales + badge */}
                    <div className="flex items-center gap-2 min-w-0">
                      {s.signal_score != null ? (
                        <>
                          <span className="text-sm font-semibold tabular-nums text-text">{Math.round(s.signal_score)}</span>
                          <span className="h-1 w-8 rounded-full shrink-0" style={{ background: badge?.tone === 'warn' ? '#D97706' : '#1A8A4A' }} />
                          {badge && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
                              style={{
                                background: badge.tone === 'warn' ? '#FAEEDA' : '#EAF3EA',
                                color: badge.tone === 'warn' ? '#B45309' : '#1A8A4A',
                              }}
                            >
                              <badge.icon size={11} strokeWidth={2} /> {badge.label}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-text-subtle">—</span>
                      )}
                    </div>
                    {/* Actualizado */}
                    <div className="text-right text-xs text-text-subtle">{r.summary?.updated_at || '—'}</div>
                  </div>

                  {/* Fila expandida */}
                  {isOpen && (
                    <div className="bg-surface-2 rounded-xl p-5 mb-3 mx-2">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-flex w-10 h-10 rounded-lg bg-surface border border-border items-center justify-center font-display font-bold text-text">
                          {(r.name || '?').slice(0, 2).toUpperCase()}
                        </span>
                        <span className="font-display font-semibold text-text">{r.name}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 py-3 border-y border-border">
                        {[
                          ['Ingresos', eur(s.revenue)],
                          ['EBITDA', eur(s.ebitda)],
                          ['Margen EBITDA', s.ebitda_margin != null ? margin(s.ebitda_margin) : '—'],
                          ['Crecimiento', pct(s.growth_pct)],
                          ['Valoración', eur(s.valuation?.mid)],
                          ['Empleados', s.employees != null ? String(s.employees) : '—'],
                          ['Score Arroba', s.arroba_score != null ? String(s.arroba_score) : '—'],
                        ].map(([k, v]) => (
                          <div key={k}>
                            <div className="text-[11px] uppercase tracking-wide text-text-subtle">{k}</div>
                            <div className="text-base font-display font-semibold text-text mt-0.5">{v}</div>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted mt-3">
                        {(r.summary?.activity_label || r.sector) && (
                          <span className="inline-flex items-center gap-1.5"><Tag size={13} /> {r.summary?.activity_label || r.sector}</span>
                        )}
                        {(r.summary?.city || r.city) && (
                          <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {r.summary?.city || r.city}</span>
                        )}
                        {s.employees != null && (
                          <span className="inline-flex items-center gap-1.5"><Users size={13} /> {s.employees} empleados</span>
                        )}
                        {s.updated_at && (
                          <span className="inline-flex items-center gap-1.5"><TrendingUp size={13} /> Actualizado {s.updated_at}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <button
                          type="button"
                          onClick={() => r.cif && router.push(`/empresa-f01/${r.cif}`)}
                          disabled={!r.cif}
                          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[9px] bg-primary text-white text-sm font-semibold hover:bg-primary-hover disabled:opacity-40 transition-colors"
                        >
                          Abrir ficha
                        </button>
                        <button type="button" disabled title="Próximamente" className="h-9 px-4 rounded-[9px] border border-border text-sm font-semibold text-text-muted opacity-50">Comparar</button>
                        <button type="button" disabled title="Próximamente" className="h-9 px-4 rounded-[9px] border border-border text-sm font-semibold text-text-muted opacity-50">Seguir</button>
                        <button type="button" disabled title="Próximamente" className="h-9 px-4 rounded-[9px] border border-border text-sm font-semibold text-text-muted opacity-50">Crear oportunidad</button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Paginación (servidor: cada página se pide con offset = page*PAGE_SIZE) */}
          <div className="flex items-center justify-between mt-4 text-xs text-text-muted">
            <span>
              {total === 0
                ? '0 resultados'
                : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} de ${total}`}
            </span>
            <div className="flex items-center gap-4">
              <button type="button" disabled={page === 0 || loading} onClick={() => goToPage(page - 1)} className="disabled:opacity-40 hover:text-text">
                ← Anterior
              </button>
              <span>Página {page + 1} de {pages}</span>
              <button type="button" disabled={page >= pages - 1 || loading} onClick={() => goToPage(page + 1)} className="disabled:opacity-40 hover:text-text">
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
