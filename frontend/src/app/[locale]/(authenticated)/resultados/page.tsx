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
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type CSSProperties } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  ArrowRight,
  Building2,
  ChevronDown,
  ChevronUp,
  Download,
  GitCompare,
  Columns3,
  MapPin,
  Users,
  Tag,
  TrendingUp,
  AlertTriangle,
  Flame,
  CircleDollarSign,
  CheckCircle2,
  X,
  Plus,
  ArrowUp,
  ArrowDown,
  Printer,
  Rows3,
  Rows4,
  Bookmark,
  BookmarkPlus,
} from 'lucide-react';

import { apiClient, ApiError } from '@/lib/api/client';
import type { SearchResultItem } from '@/components/blocks';
import type { RelatedEntity } from '@/lib/orchestrator';
import type { SuggestItem } from '@/lib/companies/types';
import { cn } from '@/lib/cn';
import { useActiveOrg } from '@/lib/workspaces/useActiveOrg';
import { useAuth } from '@/contexts/auth-context';
import { notify } from '@/lib/notify';
import { applySignalFilter } from './_signal-filter';
import { ResultCTA } from './_result-cta';

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

/**
 * BUGFIX-2026-08-30 · Daniel: los chips "Relacionado" (sector/territorio/
 * empresa que coinciden con la query) solo relanzaban una búsqueda de texto
 * por `display_name` — nunca llevaban a la ficha del propio sector/territorio/
 * empresa, aunque esas fichas ya existieran (o, para territorio, ya se
 * hubieran construido). `RelatedEntity.id` trae el identificador real con
 * prefijo de tipo (`cnae:{code}`, `ccaa:{code}`/`province:{code}`, o el CIF
 * tal cual para `company` — ver `entities/service.py::_resolve_sector` /
 * `_resolve_territory` / `_resolve_company`). Cuando el id no tiene el shape
 * esperado, o el tipo no tiene ficha propia todavía (ej. `investor`), se cae
 * al comportamiento anterior (relanzar búsqueda) — nunca un enlace roto.
 */
function relatedEntityHref(e: RelatedEntity): string {
  if (e.type === 'sector' && e.id.startsWith('cnae:')) {
    const code = e.id.slice('cnae:'.length);
    if (code) return `/sector/${encodeURIComponent(code)}`;
  }
  if (e.type === 'territory') {
    const [level, code] = e.id.split(':');
    if ((level === 'ccaa' || level === 'province') && code) {
      return `/territorio/${level}/${encodeURIComponent(code)}`;
    }
  }
  if (e.type === 'company' && e.id) {
    return `/empresa-f01/${encodeURIComponent(e.id)}`;
  }
  return `/resultados?q=${encodeURIComponent(e.display_name)}`;
}

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

// ══ Gestión de columnas (HARDENING-tabla-inteligente, fase 1: front puro) ══
// Catálogo de columnas disponibles para esta tabla. "Empresa" no está aquí:
// va siempre fija en primera posición y no es gestionable. El resto se puede
// añadir/quitar/reordenar desde el botón "Columnas"; el orden y la selección
// se persisten en localStorage (sin backend — ver PROPUESTA_TABLA_INTELIGENTE_
// RESULTADOS.md §6, fase 2 son vistas/listas guardadas con backend real).
interface ColumnDef {
  id: string;
  label: string;
  align?: 'right';
  width?: string; // fracción del grid-template-columns; por defecto 1fr
  defaultVisible: boolean;
  wrapperClassName: (r: Row, s: RowSummary) => string;
  render: (r: Row, s: RowSummary) => ReactNode;
  // Valor primitivo para ordenar y exportar (reutilizado en ambos). `null` se
  // trata como "sin dato" y se manda al final del orden, independientemente
  // de asc/desc.
  sortValue: (r: Row, s: RowSummary) => number | string | null;
}

const COLUMN_DEFS: ColumnDef[] = [
  {
    id: 'facturacion',
    label: 'Facturación',
    align: 'right',
    defaultVisible: true,
    wrapperClassName: () => 'text-right text-sm tabular-nums text-text',
    render: (_r, s) => eur(s.revenue),
    sortValue: (_r, s) => s.revenue ?? null,
  },
  {
    id: 'ebitda',
    label: 'EBITDA',
    align: 'right',
    defaultVisible: true,
    wrapperClassName: () => 'text-right text-sm tabular-nums text-text',
    render: (_r, s) => (
      <>
        {eur(s.ebitda)}
        {s.ebitda_margin != null && (
          <span className="block text-[11px] text-text-subtle">{margin(s.ebitda_margin)}</span>
        )}
      </>
    ),
    sortValue: (_r, s) => s.ebitda ?? null,
  },
  {
    id: 'crecimiento',
    label: 'Crecim.',
    align: 'right',
    defaultVisible: true,
    wrapperClassName: (_r, s) =>
      cn(
        'text-right text-sm font-semibold tabular-nums',
        (s.growth_pct ?? 0) >= 10 ? 'text-success' : (s.growth_pct ?? 0) > 0 ? 'text-warning' : 'text-text-muted',
      ),
    render: (_r, s) => pct(s.growth_pct),
    sortValue: (_r, s) => s.growth_pct ?? null,
  },
  {
    id: 'score_senales',
    label: 'Score señales',
    defaultVisible: true,
    wrapperClassName: () => 'flex items-center gap-2 min-w-0',
    render: (_r, s) => {
      const badge = s.signal_badge ? BADGES[s.signal_badge] : undefined;
      if (s.signal_score == null) return <span className="text-sm text-text-subtle">—</span>;
      return (
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
      );
    },
    sortValue: (_r, s) => s.signal_score ?? null,
  },
  {
    id: 'actualizado',
    label: 'Actualizado',
    align: 'right',
    width: '0.8fr',
    // BUGFIX-2026-08-29 - Daniel: la columna es larga y no aporta en el
    // primer vistazo de resultados. La dejamos en el catalogo (se puede
    // volver a activar desde el boton Columnas) pero fuera del set por
    // defecto. La fecha de actualizacion ya es visible dentro de la
    // ficha de empresa al pinchar, que es donde de verdad importa.
    defaultVisible: false,
    wrapperClassName: () => 'text-right text-xs text-text-subtle',
    render: (_r, s) => s.updated_at || '—',
    // Ordena como string (localCompare) — si `updated_at` no viene en ISO
    // sortable, el orden puede no ser cronológico real; pendiente de que
    // Intel confirme el formato exacto del campo.
    sortValue: (_r, s) => s.updated_at ?? null,
  },
  // — Añadibles (no visibles por defecto) —
  {
    id: 'cif',
    label: 'CIF',
    defaultVisible: false,
    wrapperClassName: () => 'text-sm text-text-subtle tabular-nums',
    render: (r) => r.cif || '—',
    sortValue: (r) => r.cif ?? null,
  },
  {
    id: 'sector',
    label: 'Sector',
    defaultVisible: false,
    wrapperClassName: () => 'text-sm text-text truncate',
    render: (r, s) => s.activity_label || r.sector || '—',
    sortValue: (r, s) => s.activity_label || r.sector || null,
  },
  {
    id: 'ciudad',
    label: 'Ciudad',
    defaultVisible: false,
    wrapperClassName: () => 'text-sm text-text-subtle truncate',
    render: (r, s) => s.city || r.city || '—',
    sortValue: (r, s) => s.city || r.city || null,
  },
  {
    id: 'empleados',
    label: 'Empleados',
    align: 'right',
    defaultVisible: false,
    wrapperClassName: () => 'text-right text-sm tabular-nums text-text',
    render: (_r, s) => (s.employees != null ? String(s.employees) : '—'),
    sortValue: (_r, s) => s.employees ?? null,
  },
  {
    id: 'valoracion',
    label: 'Valoración',
    align: 'right',
    defaultVisible: false,
    wrapperClassName: () => 'text-right text-sm tabular-nums text-text',
    render: (_r, s) => eur(s.valuation?.mid),
    sortValue: (_r, s) => s.valuation?.mid ?? null,
  },
  {
    id: 'score_arroba',
    label: 'Score Arroba',
    align: 'right',
    defaultVisible: false,
    wrapperClassName: () => 'text-right text-sm tabular-nums text-text',
    render: (_r, s) => (s.arroba_score != null ? String(s.arroba_score) : '—'),
    sortValue: (_r, s) => s.arroba_score ?? null,
  },
];
const DEFAULT_COLUMN_IDS = COLUMN_DEFS.filter((c) => c.defaultVisible).map((c) => c.id);
// BUGFIX-2026-08-29 · Daniel: tras poner `actualizado` en `defaultVisible:
// false` (arriba), seguia apareciendo para quien ya habia visitado la
// pagina antes — el set de columnas guardado en localStorage gana al
// default nuevo. Bump v1 -> v2 para que ese set viejo se descarte una vez
// y todo el mundo arranque con el default de hoy (sigue pudiendo
// reactivarse "Actualizado" a mano desde el boton Columnas).
const COLUMNS_STORAGE_KEY = 'arroba.resultados.columnas.v2';
const DENSITY_STORAGE_KEY = 'arroba.resultados.densidad.v1';

export default function ResultadosPage() {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname() ?? '/resultados';
  const q = (params.get('q') || '').trim();
  // HARDENING-033 · locale extraído del pathname (`/es/...` o `/en/...`) o
  // fallback a 'es'. Con `localePrefix: 'never'` el pathname puede venir sin
  // prefijo — el CTA usa 'es' como default coherente con el resto de rutas.
  const locale = pathname.match(/^\/(es|en)(\/|$)/)?.[1] ?? 'es';

  const [input, setInput] = useState(q);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  // BUGFIX-2026-09-09 · Daniel (Punto 3): buscador predictivo. Dropdown de
  // sugerencias vía `GET /api/companies/suggest` (proxy fino a Intel). Se
  // gate-a en `input.length >= 2` y se debounce ~200ms para no rebotar en
  // cada tecla. `activeIndex = -1` significa "ningún item seleccionado"
  // (Enter dispara la búsqueda completa normal); `>= 0` selecciona el item
  // y navega a `/empresa-f01/{cif}`.
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // HARDENING 2026-08-24 · "Sectores relacionados" — sector/territory/investor
  // que coinciden con la query, chips de navegación aparte de la tabla.
  const [relatedEntities, setRelatedEntities] = useState<RelatedEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sector, setSector] = useState<string | null>(params.get('sector') || null);
  // HARDENING-032 · Filtro por signal_badge client-side. Toggles independientes
  // combinables (AND). Intel emite hoy los badges en snake_case ES
  // (`alto_crecimiento`, `riesgo`, `estable`, `comprando`, `buscando_financiacion`).
  // Comparamos con tokens defensivos (ES + EN) por si Intel migra el vocabulario
  // en el futuro sin regresión visual. Sin persistencia (URL/localStorage) —
  // HARDENING-031 aborda persistencia por separado.
  const [onlyGrowth, setOnlyGrowth] = useState(params.get('growth') === '1');
  const [excludeRisk, setExcludeRisk] = useState(params.get('norisk') === '1');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(Number(params.get('page') || '0') || 0);

  // ── Columnas (gestión front-only, ver COLUMN_DEFS más arriba) ──
  const [columnIds, setColumnIds] = useState<string[]>(DEFAULT_COLUMN_IDS);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [columnsHydrated, setColumnsHydrated] = useState(false);
  const columnsWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COLUMNS_STORAGE_KEY);
      if (raw) {
        const ids = JSON.parse(raw) as string[];
        const valid = ids.filter((id) => COLUMN_DEFS.some((c) => c.id === id));
        if (valid.length) setColumnIds(valid);
      }
    } catch {
      // localStorage no disponible o corrupto — se queda el set por defecto.
    }
    setColumnsHydrated(true);
  }, []);

  useEffect(() => {
    if (!columnsHydrated) return; // evita sobrescribir lo guardado con el default en el primer render
    try {
      window.localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(columnIds));
    } catch {
      // localStorage no disponible (modo privado, cuota…) — se pierde la persistencia, sin romper.
    }
  }, [columnIds, columnsHydrated]);

  useEffect(() => {
    if (!columnsOpen) return;
    function onOutside(e: MouseEvent) {
      if (columnsWrapRef.current && !columnsWrapRef.current.contains(e.target as Node)) {
        setColumnsOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [columnsOpen]);

  const visibleColumns = useMemo(
    () => columnIds.map((id) => COLUMN_DEFS.find((c) => c.id === id)).filter((c): c is ColumnDef => Boolean(c)),
    [columnIds],
  );
  const availableColumns = useMemo(
    () => COLUMN_DEFS.filter((c) => !columnIds.includes(c.id)),
    [columnIds],
  );
  const gridTemplate = `minmax(220px,1.6fr) ${visibleColumns.map((c) => c.width ?? '1fr').join(' ')}`;

  function moveColumn(index: number, dir: -1 | 1) {
    setColumnIds((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const a = next[index];
      const b = next[target];
      if (a == null || b == null) return prev;
      next[index] = b;
      next[target] = a;
      return next;
    });
  }
  function removeColumn(id: string) {
    setColumnIds((prev) => prev.filter((c) => c !== id));
  }
  function addColumn(id: string) {
    setColumnIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  // ── Orden por cabecera ──
  //
  // Grupo A (server-side · pide reorden global a Intel + reset a página 0):
  //   `empresa` → sort_by=name, `facturacion` → revenue, `ebitda` → ebitda,
  //   `empleados` → employees, `cif` → cif.
  // Grupo B (front-only · reordena la página visible vía `useMemo(sortedRows)`):
  //   crecimiento, señal, valoración, arroba_score.
  // BUGFIX-2026-09-09 · Daniel (Punto 2): sort server-side para el Grupo A.
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const SORT_A_MAP: Record<string, string> = {
    empresa: 'name',
    facturacion: 'revenue',
    ebitda: 'ebitda',
    empleados: 'employees',
    cif: 'cif',
  };

  function toggleSort(id: string) {
    // Toggle asc↔desc con misma columna; reset a asc si cambia de columna.
    const nextDir: 'asc' | 'desc' = sortColumn === id ? (sortDir === 'asc' ? 'desc' : 'asc') : 'asc';
    setSortColumn(id);
    setSortDir(nextDir);
    const backendCol = SORT_A_MAP[id];
    if (backendCol && q) {
      // Grupo A → server-side. Reset a página 0 porque el orden global cambia
      // qué es "página 1".
      void fetchResults(q, 0, { sort_by: backendCol, sort_dir: nextDir });
    }
    // Grupo B → nada más que hacer; el `useMemo(sortedRows)` reordena la
    // página visible con `sortColumn`/`sortDir` que acabamos de fijar.
  }

  // ── Densidad de fila (front-only, persistida) ──
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DENSITY_STORAGE_KEY);
      if (raw === 'compact' || raw === 'comfortable') setDensity(raw);
    } catch {
      // localStorage no disponible — se queda 'comfortable'.
    }
  }, []);
  function toggleDensity() {
    setDensity((prev) => {
      const next = prev === 'comfortable' ? 'compact' : 'comfortable';
      try {
        window.localStorage.setItem(DENSITY_STORAGE_KEY, next);
      } catch {
        // localStorage no disponible — se pierde la persistencia, sin romper.
      }
      return next;
    });
  }

  // ── Comparar (front-only) — modal con las empresas seleccionadas, una
  // columna por empresa, filas = las mismas columnas visibles en la tabla. ──
  const [compareOpen, setCompareOpen] = useState(false);

  // ── Seguir — conecta con el watchlist real (mismo endpoint que la ficha,
  // apiClient.companies.toggleWatchlist). `/resultados` no recibe el estado
  // inicial de watchlist por CIF desde el buscador (el SearchHit no lo trae),
  // así que este set solo refleja lo que se ha tocado EN ESTA SESIÓN — si una
  // empresa ya estaba guardada de antes, el botón la mostrará como "no
  // seguida" hasta que el usuario la toque aquí. Igual que en CompanyHeader.tsx. ──
  const { activeOrgId } = useActiveOrg();
  const { isAuthenticated } = useAuth();
  const [watchlisted, setWatchlisted] = useState<Set<string>>(new Set());
  const [watchlistBusy, setWatchlistBusy] = useState<string | null>(null);

  async function toggleRowWatchlist(cif: string) {
    if (!isAuthenticated) {
      notify({ kind: 'info', text: 'Inicia sesión para guardar empresas en tu cartera.' });
      return;
    }
    if (!activeOrgId) {
      notify({ kind: 'info', text: 'Selecciona una organización para guardar empresas.' });
      return;
    }
    setWatchlistBusy(cif);
    try {
      const r = await apiClient.companies.toggleWatchlist(cif, activeOrgId);
      setWatchlisted((prev) => {
        const next = new Set(prev);
        if (r.saved) next.add(cif);
        else next.delete(cif);
        return next;
      });
      notify({
        kind: 'success',
        text: r.saved ? 'Guardada en tu cartera de empresas.' : 'Quitada de tu cartera.',
      });
    } catch (e) {
      notify({
        kind: 'error',
        text: e instanceof ApiError ? e.detail : 'No se pudo actualizar la cartera.',
      });
    } finally {
      setWatchlistBusy(null);
    }
  }

  const fetchResults = useCallback(
    async (
      query: string,
      pageIdx: number,
      opts?: { sort_by?: string | null; sort_dir?: 'asc' | 'desc' | null },
    ) => {
      setLoading(true);
      setError(null);
      setExpanded(null);
      // BUGFIX-2026-08-29 · el contador de cabecera ("N resultados") y las
      // filas no se reseteaban al arrancar una busqueda nueva, solo al
      // terminar (setTotal/setRows solo se llamaban en los paths de exito
      // o error mas abajo). Efecto visible: al lanzar una query nueva se
      // veia el titulo actualizado junto al total ANTIGUO ("clinicas
      // dentales" con "898 resultados" heredado de la busqueda anterior)
      // mientras el skeleton de carga estaba activo — parecia que el loader
      // no funcionaba o mostraba datos incorrectos. Reseteamos aqui, antes
      // del fetch, para que la cabecera quede coherente con el skeleton.
      setRows([]);
      setTotal(0);
      try {
        const res = await apiClient.copilot.search({
          query,
          context: { locale: 'es', pathname: '/resultados' },
          offset: pageIdx * PAGE_SIZE,
          sort_by: opts?.sort_by ?? undefined,
          sort_dir: opts?.sort_dir ?? undefined,
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
        setRelatedEntities(res.related_entities ?? []);
        setPage(pageIdx);
      } catch {
        setError('No hemos podido cargar los resultados. Inténtalo de nuevo.');
        setRows([]);
        setTotal(0);
        setRelatedEntities([]);
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  // HARDENING-031 · en el PRIMER montaje respetamos sector/growth/norisk/page de
  // la URL (hidratados en los useState de arriba); cuando el usuario lanza una
  // NUEVA búsqueda (cambia q) reseteamos filtros y volvemos a la página 0.
  const prevQ = useRef<string | null>(null);
  const initialPageRef = useRef(Number(params.get('page') || '0') || 0);
  useEffect(() => {
    setInput(q);
    const isFirst = prevQ.current === null;
    prevQ.current = q;
    if (isFirst) {
      if (q) void fetchResults(q, initialPageRef.current);
      else {
        setRows([]);
        setTotal(0);
        setRelatedEntities([]);
      }
      return;
    }
    setSector(null);
    setOnlyGrowth(false);
    setExcludeRisk(false);
    setSelected(new Set());
    setPage(0);
    if (q) void fetchResults(q, 0);
    else {
      setRows([]);
      setTotal(0);
      setRelatedEntities([]);
    }
  }, [q, fetchResults]);

  // HARDENING-031 · refleja sector/growth/norisk/page en la URL (replace, sin
  // scroll) para que recargar o compartir el enlace conserve el estado.
  useEffect(() => {
    if (!q) return;
    const sp = new URLSearchParams();
    sp.set('q', q);
    if (sector) sp.set('sector', sector);
    if (onlyGrowth) sp.set('growth', '1');
    if (excludeRisk) sp.set('norisk', '1');
    if (page > 0) sp.set('page', String(page));
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  }, [q, sector, onlyGrowth, excludeRisk, page, pathname, router]);

  function goToPage(next: number) {
    const clamped = Math.max(0, Math.min(next, pages - 1));
    if (clamped === page || loading) return;
    void fetchResults(q, clamped);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Si hay item seleccionado en el dropdown, navega a su ficha
    // directamente (comportamiento típico de combobox).
    if (activeIndex >= 0 && suggestions[activeIndex]?.cif) {
      pickSuggestion(suggestions[activeIndex].cif);
      return;
    }
    const v = input.trim();
    if (v) router.push(`/resultados?q=${encodeURIComponent(v)}`);
  }

  // BUGFIX-2026-09-09 · Daniel (Punto 3): debounce ~200ms + fetch suggest.
  // R15: si Intel no responde (proxy devuelve `{suggestions: []}`), el
  // dropdown se cierra en silencio sin romper el input.
  useEffect(() => {
    const query = input.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setSuggestOpen(false);
      setActiveIndex(-1);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.companies.suggest(query, 8);
        if (cancelled) return;
        // Fix contrato Suggest (2026-09-09): Intel devuelve `results`;
        // el fallback R15 del proxy Beta devuelve `suggestions: []` cuando
        // Intel falla. Aceptamos ambos para cubrir los dos caminos.
        const list = res.results ?? res.suggestions ?? [];
        setSuggestions(list);
        setSuggestOpen(list.length > 0);
        setActiveIndex(-1);
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setSuggestOpen(false);
          setActiveIndex(-1);
        }
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [input]);

  function pickSuggestion(cif: string) {
    setSuggestOpen(false);
    setActiveIndex(-1);
    router.push(`/empresa-f01/${cif.toUpperCase()}`);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!suggestOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setSuggestOpen(false);
      setActiveIndex(-1);
    }
  }

  const sectors = useMemo(
    () => Array.from(new Set(rows.map((r) => r.sector).filter(Boolean) as string[])).sort(),
    [rows],
  );

  // BUGFIX-2026-08-30 · Daniel: "cada uno debe estar dividido... con
  // categorías diferentes, sectores, territorios, empresas" — antes
  // `relatedEntities` se pintaba como una sola tira de chips "Relacionado".
  // Ahora se separa por tipo para dar Sectores/Territorios su propia sección
  // visible, en paralelo a la sección de Empresas (la tabla de siempre).
  // `investor` y cualquier otro tipo sin ficha propia hoy quedan en
  // `otherMatches`, con el chip-strip antiguo — no se pierden, pero no se
  // les inventa una sección propia que no tenemos dónde llevar.
  //
  // FIX 2026-09-06 · Daniel: la sección se renombra a "Mercados" en el UI
  // (mismo dato/tipo `sector` interno vía CNAE — solo cambia la etiqueta
  // visible). Además, con el fix de `copilot/service.py::execute_search`
  // (mismo commit), ahora también se puebla `related_entities` cuando la
  // búsqueda resuelve por `disambiguation` (p.ej. "Sevilla") y no solo por
  // `workspace` — antes esta sección nunca aparecía en ese caso porque el
  // backend ni siquiera calculaba los matches.
  const sectorMatches = useMemo(() => relatedEntities.filter((e) => e.type === 'sector'), [relatedEntities]);
  const territoryMatches = useMemo(() => relatedEntities.filter((e) => e.type === 'territory'), [relatedEntities]);
  const otherMatches = useMemo(
    () => relatedEntities.filter((e) => e.type !== 'sector' && e.type !== 'territory'),
    [relatedEntities],
  );
  // `rows` ya es la página actual servida por el backend (offset = page*PAGE_SIZE).
  // El chip de sector y los toggles de signal_badge afinan la página visible;
  // la paginación se rige por `total` (server-side).
  const pageRows = useMemo(() => {
    const bySector = sector ? rows.filter((r) => r.sector === sector) : rows;
    return applySignalFilter(bySector, { onlyGrowth, excludeRisk });
  }, [rows, sector, onlyGrowth, excludeRisk]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Orden en cliente sobre la página visible. `null`/`undefined` siempre al
  // final, sea cual sea la dirección. 'empresa' es la única columna fija que
  // no vive en COLUMN_DEFS, se resuelve aparte por r.name.
  const sortedRows = useMemo(() => {
    if (!sortColumn) return pageRows;
    const col = sortColumn === 'empresa' ? null : COLUMN_DEFS.find((c) => c.id === sortColumn);
    if (sortColumn !== 'empresa' && !col) return pageRows;
    const dir = sortDir === 'asc' ? 1 : -1;
    const withValue = pageRows.map((r) => {
      const s = r.summary || {};
      const value = sortColumn === 'empresa' ? r.name ?? null : col!.sortValue(r, s);
      return { r, value };
    });
    withValue.sort((a, b) => {
      if (a.value == null && b.value == null) return 0;
      if (a.value == null) return 1;
      if (b.value == null) return -1;
      if (typeof a.value === 'number' && typeof b.value === 'number') {
        return (a.value - b.value) * dir;
      }
      return String(a.value).localeCompare(String(b.value), 'es') * dir;
    });
    return withValue.map((x) => x.r);
  }, [pageRows, sortColumn, sortDir]);

  // Sólo compara empresas que siguen presentes en la página actual (la
  // selección puede incluir ids de otra página cuyo Row ya no está cargado).
  const compareRows = useMemo(
    () => sortedRows.filter((r) => selected.has(r.master_company_id)),
    [sortedRows, selected],
  );

  useEffect(() => {
    if (compareOpen && selected.size < 2) setCompareOpen(false);
  }, [compareOpen, selected]);

  function toggleSel(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  // Exporta exactamente las columnas visibles en pantalla (mismo orden, mismo
  // valor crudo vía ColumnDef.sortValue) y en el orden actual de la tabla.
  // "Empresa" va siempre primero por ser la columna fija no gestionable.
  function exportCsv() {
    const head = ['Empresa', ...visibleColumns.map((c) => c.label)];
    const lines = sortedRows.map((r) => {
      const s = r.summary || {};
      const cells = [r.name, ...visibleColumns.map((c) => c.sortValue(r, s) ?? '')];
      return cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',');
    });
    const blob = new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultados-${q || 'busqueda'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div data-testid="resultados-page" className="max-w-6xl mx-auto px-6 pt-8 pb-40">
      {/* Buscador */}
      <div className="relative mb-6">
      <form
        onSubmit={submit}
        className="print:hidden flex items-center gap-2 px-4 h-12 rounded-[13px] border-[1.5px] border-border-strong bg-surface transition-colors focus-within:border-primary"
      >
        <Search size={18} strokeWidth={1.6} className="text-text-subtle shrink-0" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          onFocus={() => { if (suggestions.length > 0) setSuggestOpen(true); }}
          onBlur={() => { setTimeout(() => setSuggestOpen(false), 150); }}
          placeholder="Busca empresas, sectores o ubicaciones…"
          aria-label="Buscar"
          data-testid="resultados-search-input"
          role="combobox"
          aria-expanded={suggestOpen}
          aria-controls="suggest-listbox"
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `suggest-option-${activeIndex}` : undefined}
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
      {suggestOpen && suggestions.length > 0 && (
        <ul
          id="suggest-listbox"
          role="listbox"
          data-testid="suggest-dropdown"
          className="absolute left-0 right-0 top-full mt-1 max-h-80 overflow-auto rounded-[11px] border border-border-strong bg-surface shadow-lg z-30"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.cif}
              id={`suggest-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              data-testid={`suggest-option-${i}`}
              onMouseDown={(e) => { e.preventDefault(); pickSuggestion(s.cif); }}
              onMouseEnter={() => setActiveIndex(i)}
              className={cn(
                'flex flex-col gap-0.5 px-4 py-2 cursor-pointer text-[14px]',
                i === activeIndex ? 'bg-surface-strong text-text' : 'text-text hover:bg-surface-strong',
              )}
            >
              <span className="font-medium">
                {s.name_parts ? (
                  <>
                    <span>{s.name_parts.before}</span>
                    <strong className="font-semibold text-text">{s.name_parts.match}</strong>
                    <span>{s.name_parts.after}</span>
                  </>
                ) : (
                  <>{s.name ?? ''}</>
                )}
              </span>
              <span className="text-[12px] text-text-subtle">
                {s.cif}{s.sector ? ` · ${s.sector}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
      </div>

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

      {/* BUGFIX-2026-08-30 · Secciones "Sectores" / "Territorios" — sustituyen
          a la tira única "Relacionado" (HARDENING 2026-08-24). Cada fila
          navega a la ficha real (sector/territorio); antes solo relanzaban
          una búsqueda de texto. Distinto de los "Chips de filtro por sector"
          de abajo (que filtran ESTOS resultados de empresas, no navegan). */}
      {q && !loading && !error && sectorMatches.length > 0 && (
        <div className="print:hidden mb-4" data-testid="resultados-sector-matches">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-subtle uppercase tracking-wide mb-2">
            <Building2 size={13} /> Mercados
          </div>
          <div className="rounded-[13px] border border-border bg-surface divide-y divide-border overflow-hidden">
            {sectorMatches.map((e) => (
              <a
                key={`${e.type}:${e.id}`}
                href={relatedEntityHref(e)}
                className="flex items-center justify-between gap-3 px-4 h-11 text-sm hover:bg-surface-2 transition-colors"
              >
                <span className="font-medium text-text truncate">{e.display_name}</span>
                <span className="flex items-center gap-2 shrink-0 text-text-subtle">
                  {e.secondary_label && <span className="text-xs">{e.secondary_label}</span>}
                  <ArrowRight size={13} />
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {q && !loading && !error && territoryMatches.length > 0 && (
        <div className="print:hidden mb-4" data-testid="resultados-territory-matches">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-subtle uppercase tracking-wide mb-2">
            <MapPin size={13} /> Territorios
          </div>
          <div className="rounded-[13px] border border-border bg-surface divide-y divide-border overflow-hidden">
            {territoryMatches.map((e) => (
              <a
                key={`${e.type}:${e.id}`}
                href={relatedEntityHref(e)}
                className="flex items-center justify-between gap-3 px-4 h-11 text-sm hover:bg-surface-2 transition-colors"
              >
                <span className="font-medium text-text truncate">{e.display_name}</span>
                <span className="flex items-center gap-2 shrink-0 text-text-subtle">
                  {e.secondary_label && <span className="text-xs">{e.secondary_label}</span>}
                  <ArrowRight size={13} />
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {q && !loading && !error && otherMatches.length > 0 && (
        <div className="print:hidden mb-4" data-testid="resultados-related-entities">
          <div className="text-xs font-semibold text-text-subtle uppercase tracking-wide mb-1.5">
            Relacionado
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {otherMatches.map((e) => (
              <a
                key={`${e.type}:${e.id}`}
                href={relatedEntityHref(e)}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold border border-border bg-surface text-text-muted hover:border-border-strong hover:text-text transition-colors"
              >
                {e.display_name}
                {e.secondary_label && (
                  <span className="text-text-subtle font-normal">· {e.secondary_label}</span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {q && !loading && !error && (sectorMatches.length > 0 || territoryMatches.length > 0) && total > 0 && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-text-subtle uppercase tracking-wide mb-2" data-testid="resultados-empresas-label">
          <Users size={13} /> Empresas
        </div>
      )}

      {/* Chips de filtro por sector */}
      {q && !loading && !error && sectors.length > 0 && (
        <div className="print:hidden flex flex-wrap items-center gap-2 mb-4" data-testid="resultados-filters">
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
        <div className="print:hidden flex items-center justify-between gap-2 mb-2 text-sm">
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
              title={selected.size < 2 ? 'Selecciona al menos dos empresas' : 'Comparar empresas seleccionadas'}
              onClick={() => setCompareOpen(true)}
              data-testid="resultados-compare-btn"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[9px] text-text-muted hover:bg-surface-2 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              <GitCompare size={16} strokeWidth={1.6} /> Comparar
              {selected.size > 0 && ` (${selected.size})`}
            </button>
            <div className="relative" ref={columnsWrapRef}>
              <button
                type="button"
                onClick={() => setColumnsOpen((v) => !v)}
                aria-expanded={columnsOpen}
                aria-label="Gestionar columnas"
                data-testid="resultados-columns-btn"
                className={cn(
                  'inline-flex items-center gap-1.5 h-9 px-3 rounded-[9px] text-text-muted hover:bg-surface-2 transition-colors',
                  columnsOpen && 'bg-surface-2 text-text',
                )}
              >
                <Columns3 size={16} strokeWidth={1.6} /> Columnas
              </button>
              {columnsOpen && (
                <div
                  data-testid="resultados-columns-panel"
                  className="absolute right-0 top-full mt-2 w-72 rounded-[12px] border border-border-strong bg-surface shadow-lg p-3 z-30"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-text-subtle px-1 mb-2">
                    Columnas visibles
                  </div>
                  <ul className="space-y-1 mb-1">
                    {visibleColumns.map((col, i) => (
                      <li
                        key={col.id}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-[8px] hover:bg-surface-2 text-sm text-text"
                      >
                        <span className="flex-1 truncate">{col.label}</span>
                        <button
                          type="button"
                          disabled={i === 0}
                          onClick={() => moveColumn(i, -1)}
                          aria-label={`Subir ${col.label}`}
                          className="h-6 w-6 inline-flex items-center justify-center rounded-[6px] text-text-subtle hover:text-text disabled:opacity-30"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={i === visibleColumns.length - 1}
                          onClick={() => moveColumn(i, 1)}
                          aria-label={`Bajar ${col.label}`}
                          className="h-6 w-6 inline-flex items-center justify-center rounded-[6px] text-text-subtle hover:text-text disabled:opacity-30"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeColumn(col.id)}
                          aria-label={`Quitar columna ${col.label}`}
                          className="h-6 w-6 inline-flex items-center justify-center rounded-[6px] text-text-subtle hover:text-danger"
                        >
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                    {visibleColumns.length === 0 && (
                      <li className="px-2 py-1.5 text-xs text-text-subtle">
                        Sin columnas adicionales. Añade alguna abajo.
                      </li>
                    )}
                  </ul>
                  {availableColumns.length > 0 && (
                    <>
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-text-subtle px-1 mb-2 pt-2 border-t border-border">
                        Añadir columna
                      </div>
                      <ul className="space-y-1">
                        {availableColumns.map((col) => (
                          <li key={col.id}>
                            <button
                              type="button"
                              onClick={() => addColumn(col.id)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[8px] hover:bg-surface-2 text-sm text-text-muted hover:text-text text-left"
                            >
                              <Plus size={14} className="shrink-0" /> {col.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  <div className="flex justify-end pt-2 mt-2 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setColumnIds(DEFAULT_COLUMN_IDS)}
                      className="text-xs font-semibold text-text-subtle hover:text-text"
                    >
                      Restablecer
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={toggleDensity}
              aria-label={density === 'comfortable' ? 'Densidad compacta' : 'Densidad cómoda'}
              title={density === 'comfortable' ? 'Densidad compacta' : 'Densidad cómoda'}
              data-testid="resultados-density-btn"
              className="h-9 w-9 inline-flex items-center justify-center rounded-[9px] text-text-muted hover:bg-surface-2 transition-colors"
            >
              {density === 'comfortable' ? <Rows4 size={16} strokeWidth={1.6} /> : <Rows3 size={16} strokeWidth={1.6} />}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              aria-label="Imprimir"
              title="Imprimir"
              className="h-9 w-9 inline-flex items-center justify-center rounded-[9px] text-text-muted hover:bg-surface-2 transition-colors"
            >
              <Printer size={16} strokeWidth={1.6} />
            </button>
          </div>
        </div>
      )}

      {/* HARDENING-033 · CTA contextual sobre resultados filtrados. Sólo se
          renderiza cuando al menos un chip de signal_badge está activo
          (`onlyGrowth` u `excludeRisk`). Variante auth → watchlist stub;
          variante anon → registro con next=. Ver `_result-cta.tsx`. */}
      {q && !loading && !error && rows.length > 0 && (
        <div className="print:hidden">
          <ResultCTA
            query={q}
            onlyGrowth={onlyGrowth}
            excludeRisk={excludeRisk}
            locale={locale}
            pathname={pathname}
            visibleCount={pageRows.length}
          />
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
          <div
            className={cn(
              'hidden md:grid md:grid-cols-[var(--res-grid)] gap-3 px-2 text-[11px] uppercase tracking-wide text-text-subtle border-b border-border',
              density === 'compact' ? 'py-1.5' : 'py-2',
            )}
            style={{ '--res-grid': gridTemplate } as CSSProperties}
          >
            <button
              type="button"
              onClick={() => toggleSort('empresa')}
              className="inline-flex items-center gap-1 text-left hover:text-text"
            >
              Empresa
              {sortColumn === 'empresa' &&
                (sortDir === 'asc' ? <ArrowUp size={11} strokeWidth={2} /> : <ArrowDown size={11} strokeWidth={2} />)}
            </button>
            {visibleColumns.map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => toggleSort(col.id)}
                className={cn(
                  'inline-flex items-center gap-1 hover:text-text',
                  col.align === 'right' ? 'justify-end text-right' : 'text-left',
                )}
              >
                {col.label}
                {sortColumn === col.id &&
                  (sortDir === 'asc' ? <ArrowUp size={11} strokeWidth={2} /> : <ArrowDown size={11} strokeWidth={2} />)}
              </button>
            ))}
          </div>

          <ul data-testid="resultados-list">
            {sortedRows.map((r) => {
              const s = r.summary || {};
              const isOpen = expanded === r.master_company_id;
              return (
                <li key={r.master_company_id} className="border-b border-border">
                  <div
                    className={cn(
                      'grid grid-cols-1 md:grid-cols-[var(--res-grid)] gap-3 px-2 items-center',
                      density === 'compact' ? 'py-1.5' : 'py-3',
                    )}
                    style={{ '--res-grid': gridTemplate } as CSSProperties}
                  >
                    {/* Empresa */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={selected.has(r.master_company_id)}
                        onChange={() => toggleSel(r.master_company_id)}
                        aria-label={`Seleccionar ${r.name}`}
                        className="print:hidden shrink-0 accent-[var(--primary)]"
                      />
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : r.master_company_id)}
                        aria-label={isOpen ? 'Contraer' : 'Expandir'}
                        className="print:hidden shrink-0 text-text-subtle hover:text-text"
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
                    {visibleColumns.map((col) => (
                      <div key={col.id} className={col.wrapperClassName(r, s)}>
                        {col.render(r, s)}
                      </div>
                    ))}
                  </div>

                  {/* Fila expandida */}
                  {isOpen && (
                    <div className={cn('bg-surface-2 rounded-xl mb-3 mx-2', density === 'compact' ? 'p-3' : 'p-5')}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-flex w-10 h-10 rounded-lg bg-surface border border-border items-center justify-center font-display font-bold text-text">
                          {(r.name || '?').slice(0, 2).toUpperCase()}
                        </span>
                        <span className="font-display font-semibold text-text">{r.name}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 py-3 border-y border-border">
                        {[
                          ['Facturación', eur(s.revenue)],
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
                        <button
                          type="button"
                          disabled={!r.cif || watchlistBusy === r.cif}
                          onClick={() => r.cif && toggleRowWatchlist(r.cif)}
                          title={!r.cif ? 'Esta empresa no tiene CIF disponible' : undefined}
                          className={cn(
                            'inline-flex items-center gap-1.5 h-9 px-4 rounded-[9px] border text-sm font-semibold transition-colors disabled:opacity-50',
                            r.cif && watchlisted.has(r.cif)
                              ? 'border-primary/40 bg-primary/5 text-primary'
                              : 'border-border text-text-muted hover:bg-surface-2',
                          )}
                        >
                          {r.cif && watchlisted.has(r.cif) ? (
                            <Bookmark size={14} strokeWidth={1.8} />
                          ) : (
                            <BookmarkPlus size={14} strokeWidth={1.8} />
                          )}
                          {r.cif && watchlisted.has(r.cif) ? 'Siguiendo' : 'Seguir'}
                        </button>
                        <button type="button" disabled title="Próximamente" className="h-9 px-4 rounded-[9px] border border-border text-sm font-semibold text-text-muted opacity-50">Crear oportunidad</button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Paginación (servidor: cada página se pide con offset = page*PAGE_SIZE) */}
          <div className="print:hidden flex items-center justify-between mt-4 text-xs text-text-muted">
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

      {/* Comparar — empresas seleccionadas, una columna por empresa, filas =
          las columnas actualmente visibles en la tabla (reutiliza col.render). */}
      {compareOpen && compareRows.length >= 2 && (
        <div
          className="print:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setCompareOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Comparar empresas"
            data-testid="resultados-compare-modal"
            className="bg-surface rounded-2xl border border-border-strong shadow-lg w-full max-w-5xl max-h-[85vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-surface z-10">
              <h2 className="font-display font-semibold text-text">
                Comparar empresas ({compareRows.length})
              </h2>
              <button
                type="button"
                onClick={() => setCompareOpen(false)}
                aria-label="Cerrar"
                className="text-text-subtle hover:text-text"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-[11px] uppercase tracking-wide text-text-subtle font-semibold px-3 py-2 sticky left-0 bg-surface">
                      Empresa
                    </th>
                    {compareRows.map((r) => (
                      <th key={r.master_company_id} className="text-left px-3 py-2 min-w-[170px] align-top">
                        <div className="font-display font-semibold text-text">{r.name}</div>
                        <div className="text-xs text-text-muted">
                          {r.summary?.activity_label || r.sector || '—'}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleColumns.map((col) => (
                    <tr key={col.id} className="border-t border-border">
                      <td className="px-3 py-2 text-[11px] uppercase tracking-wide text-text-subtle font-semibold sticky left-0 bg-surface whitespace-nowrap">
                        {col.label}
                      </td>
                      {compareRows.map((r) => {
                        const s = r.summary || {};
                        return (
                          <td key={r.master_company_id} className="px-3 py-2 align-top">
                            {col.render(r, s)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
