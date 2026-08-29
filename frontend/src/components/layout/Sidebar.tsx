'use client';

/**
 * Sidebar — App Shell: menú de navegación persistente (izquierda), presente
 * en todas las páginas autenticadas.
 *
 * Sustituye a `AuthHeader` (2026-08-29, confirmado por Daniel): organización
 * activa y cerrar sesión, que antes vivían en el top bar, ahora viven aquí,
 * dentro del menú que se abre bajo el nombre de usuario.
 *
 * Contenido = especificación verbal de Daniel (2026-08-29), ver
 * memory/project_app_shell_navegacion.md. Los enlaces marcados `soon` no
 * tienen página real todavía — se muestran inertes con una etiqueta
 * "Pronto" en vez de apuntar a una URL que daría 404.
 */
import {
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  Activity,
  Bell,
  Bookmark,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  Heart,
  LineChart,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
  User as UserIcon,
  Workflow,
  ArrowRightLeft,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/contexts/auth-context';
import { useActiveOrg } from '@/lib/workspaces/useActiveOrg';
import { useTheme } from '@/lib/theme';
import { Avatar } from '@/components/ds';

/* ---------------------------------------------------------------------
 * Icono @ mosaico animado (colapsado) — mismo mark que el Copilot en
 * `_design_intake/App Shell.html`. Marca visual únicamente por ahora
 * (Daniel, 2026-08-29: "solo marca visual", no abre el Copilot real).
 * ------------------------------------------------------------------- */
const MOSAIC_ROWS = [
  '..XXXX..',
  '.X....X.',
  'X..XX..X',
  'X.X..X.X',
  'X.X..X.X',
  'X..XXXXX',
  '.X......',
  '..XXXX..',
];

function ArrobaMark({ className }: { className?: string }) {
  const cell = 3.4;
  const ox = 5;
  const oy = 5;
  const rects: ReactNode[] = [];
  MOSAIC_ROWS.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== 'X') continue;
      rects.push(
        <rect
          key={`${x}-${y}`}
          className="cm-px"
          style={{ ['--o' as string]: x + y } as React.CSSProperties}
          x={(ox + x * cell).toFixed(1)}
          y={(oy + y * cell).toFixed(1)}
          width={cell - 0.7}
          height={cell - 0.7}
          rx={0.7}
        />
      );
    }
  });
  return (
    <svg viewBox="0 0 36 36" className={cn('arroba-mark', className)} aria-hidden>
      {rects}
    </svg>
  );
}

/* ---------------------------------------------------------------------
 * Contenido del menú
 * ------------------------------------------------------------------- */
type NavItem = { key: string; href?: string; soon?: boolean };

type Pillar = {
  key: 'analizar' | 'valorar' | 'comprarVender';
  icon: React.ElementType;
  items: NavItem[];
};

const PILLARS: Pillar[] = [
  {
    key: 'analizar',
    icon: Search,
    items: [
      { key: 'empresas', href: '/resultados' },
      { key: 'sectores', href: '/mapa-empresarial' },
      { key: 'territorios', href: '/mapa-empresarial' },
    ],
  },
  {
    key: 'valorar',
    icon: LineChart,
    items: [
      { key: 'multiplos', soon: true },
      { key: 'valorarCompania', soon: true },
      { key: 'valoracionAvanzada', soon: true },
    ],
  },
  {
    key: 'comprarVender',
    icon: ArrowRightLeft,
    items: [
      { key: 'empresasEnVenta', soon: true },
      { key: 'oportunidadesMercado', href: '/oportunidades' },
    ],
  },
];

const MI_ESPACIO: Array<NavItem & { icon: React.ElementType }> = [
  { key: 'pipeline', icon: Workflow, soon: true },
  { key: 'seguimiento', icon: Heart, soon: true },
  { key: 'alertas', icon: Bell, soon: true },
  { key: 'senales', icon: Activity, soon: true },
  { key: 'busquedasGuardadas', icon: Bookmark, soon: true },
  { key: 'misTesis', icon: FileText, soon: true },
  { key: 'configuracion', icon: Settings, href: '/ajustes' },
];

/* ---------------------------------------------------------------------
 * Sidebar
 * ------------------------------------------------------------------- */
export function Sidebar({ children }: { children: ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const { user, logout } = useAuth();
  const { activeOrgId, setActiveOrgId, availableOrgs } = useActiveOrg();
  const { theme, toggle: toggleTheme } = useTheme();
  const [, startTransition] = useTransition();

  const [collapsed, setCollapsed] = useState(false);
  const [hoverExpand, setHoverExpand] = useState(false);
  const [openPillar, setOpenPillar] = useState<Pillar['key'] | null>(() => {
    const match = PILLARS.find((p) => p.items.some((it) => it.href && pathname?.startsWith(it.href)));
    return match?.key ?? null;
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const expanded = !collapsed || hoverExpand;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!userMenuRef.current?.contains(e.target as Node)) setUserMenuOpen(false);
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', onClick);
      return () => document.removeEventListener('mousedown', onClick);
    }
    return undefined;
  }, [userMenuOpen]);

  const activeOrg = useMemo(
    () => availableOrgs.find((o) => o.org_id === activeOrgId) ?? availableOrgs[0],
    [availableOrgs, activeOrgId]
  );
  const orgLabel = activeOrg?.legal_name ?? activeOrg?.org_id ?? '—';
  const displayName = user?.full_name || user?.email || '—';
  const roleLabel = t(`sidebar.roles.${user?.role ?? 'anonymous'}`);

  async function onLogout() {
    setUserMenuOpen(false);
    await logout();
    router.replace('/login');
  }

  function toggleLocale() {
    const next = locale === 'es' ? 'en' : 'es';
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
    startTransition(() => router.refresh());
  }

  return (
    <div className="min-h-screen">
      <aside
        data-testid="app-shell-sidebar"
        onMouseEnter={() => collapsed && setHoverExpand(true)}
        onMouseLeave={() => setHoverExpand(false)}
        className={cn(
          'fixed inset-y-0 left-0 z-[110] flex flex-col overflow-hidden',
          'bg-surface border-r border-border transition-[width] duration-200 ease-out',
          expanded ? 'w-sb' : 'w-sb-collapsed',
          collapsed && hoverExpand && 'shadow-lg'
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center flex-shrink-0 px-4 pt-[22px] pb-4', !expanded && 'justify-center px-0')}>
          <Link href="/inicio" className="flex items-center min-w-0" data-testid="app-shell-logo">
            {expanded ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src="/brand/logo.png" alt="arroba.com" className="h-[30px] w-auto object-contain" />
            ) : (
              <ArrobaMark className="w-8 h-8 flex-shrink-0" />
            )}
          </Link>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2 flex flex-col gap-0.5">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            const isOpen = openPillar === pillar.key;
            const isActive = pillar.items.some((it) => it.href && pathname?.startsWith(it.href));
            return (
              <div key={pillar.key}>
                <button
                  type="button"
                  onClick={() => setOpenPillar(isOpen ? null : pillar.key)}
                  data-testid={`app-shell-pillar-${pillar.key}`}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-[10px] py-2.5 px-3 font-display font-bold text-[15px] transition-colors',
                    !expanded && 'justify-center px-0 py-[11px]',
                    isActive || isOpen ? 'text-brand-primary' : 'text-text-muted hover:text-brand-primary'
                  )}
                >
                  <Icon size={18} strokeWidth={1.7} className="flex-shrink-0" />
                  {expanded && (
                    <>
                      <span className="truncate">{t(`sidebar.pillars.${pillar.key}.label`)}</span>
                      <ChevronRight
                        size={14}
                        strokeWidth={2.3}
                        className={cn(
                          'ml-auto flex-shrink-0 transition-transform',
                          isOpen ? 'rotate-90 opacity-100' : 'opacity-0'
                        )}
                      />
                    </>
                  )}
                </button>
                {expanded && (
                  <div
                    className={cn('overflow-hidden transition-[max-height] duration-200 ease-in-out', isOpen ? 'max-h-56' : 'max-h-0')}
                  >
                    <div className="flex flex-col gap-0.5 pt-0.5 pb-2 pl-[41px] pr-1">
                      {pillar.items.map((it) =>
                        it.soon || !it.href ? (
                          <span
                            key={it.key}
                            className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-[7px] text-[13px] font-medium text-text-disabled cursor-default"
                          >
                            {t(`sidebar.pillars.${pillar.key}.items.${it.key}`)}
                            <span className="text-[10px] font-mono uppercase tracking-wide text-text-disabled">
                              {t('common.soon')}
                            </span>
                          </span>
                        ) : (
                          <Link
                            key={it.key}
                            href={it.href}
                            className="rounded-lg px-2.5 py-[7px] text-[13px] font-medium text-text-muted hover:text-brand-primary transition-colors"
                          >
                            {t(`sidebar.pillars.${pillar.key}.items.${it.key}`)}
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex-1 min-h-[20px]" />

          {expanded && (
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-text-disabled px-3 pt-3.5 pb-1.5 whitespace-nowrap">
              {t('sidebar.miEspacio.eyebrow')}
            </div>
          )}
          <div className="flex flex-col gap-0.5 px-0.5 pb-1">
            {MI_ESPACIO.map((it) => {
              const Icon = it.icon;
              const label = t(`sidebar.miEspacio.${it.key}`);
              if (it.soon || !it.href) {
                return (
                  <span
                    key={it.key}
                    title={expanded ? undefined : label}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg py-[7px] px-2.5 text-[12.5px] font-semibold text-text-disabled cursor-default',
                      !expanded && 'justify-center px-0'
                    )}
                  >
                    <Icon size={15} strokeWidth={1.7} className="flex-shrink-0" />
                    {expanded && <span className="truncate">{label}</span>}
                  </span>
                );
              }
              return (
                <Link
                  key={it.key}
                  href={it.href}
                  title={expanded ? undefined : label}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg py-[7px] px-2.5 text-[12.5px] font-semibold text-text-subtle hover:text-brand-primary transition-colors',
                    !expanded && 'justify-center px-0'
                  )}
                >
                  <Icon size={15} strokeWidth={1.7} className="flex-shrink-0" />
                  {expanded && <span className="truncate">{label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Tema / idioma */}
        <div className={cn('flex gap-1 px-2.5 pt-1.5 pb-0.5 flex-shrink-0', !expanded && 'flex-col')}>
          <button
            type="button"
            onClick={toggleTheme}
            title={t('theme.toggle')}
            className="flex-1 h-[34px] rounded-lg border border-border bg-surface text-text-muted hover:bg-surface-2 hover:text-text flex items-center justify-center transition-colors"
          >
            {theme === 'dark' ? <Sun size={16} strokeWidth={1.6} /> : <Moon size={16} strokeWidth={1.6} />}
          </button>
          <button
            type="button"
            onClick={toggleLocale}
            title={t('nav.locale')}
            className="flex-1 h-[34px] rounded-lg border border-border bg-surface text-text-muted hover:bg-surface-2 hover:text-text flex items-center justify-center gap-1 font-mono text-[11.5px] font-bold uppercase transition-colors"
          >
            <Globe size={14} strokeWidth={1.6} />
            {expanded && locale}
          </button>
        </div>

        {/* Identidad — organización, perfil, ajustes, cerrar sesión (2026-08-29:
            todo lo que antes vivía en AuthHeader se movió aquí, bajo el nombre) */}
        <div className="relative flex-shrink-0 border-t border-border p-2.5" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            data-testid="app-shell-user-menu-button"
            className={cn(
              'w-full flex items-center gap-2.5 rounded-lg py-1.5 px-1.5 hover:bg-surface-2 transition-colors',
              !expanded && 'justify-center px-0'
            )}
          >
            <Avatar name={displayName} size={34} />
            {expanded && (
              <span className="flex flex-col items-start min-w-0 text-left">
                <span className="text-[12.5px] font-bold text-text truncate max-w-full">{displayName}</span>
                <span className="text-[11.5px] font-semibold text-text-muted uppercase tracking-wide truncate max-w-full">
                  {roleLabel}
                </span>
              </span>
            )}
          </button>

          {userMenuOpen && (
            <div
              role="menu"
              data-testid="app-shell-user-menu"
              className="absolute bottom-full left-2 right-2 mb-2 rounded-lg border border-border bg-surface shadow-lg overflow-hidden z-50"
            >
              <div className="px-4 py-3 border-b border-border">
                <p className="font-display font-medium text-sm truncate">{displayName}</p>
                {user?.email && <p className="text-xs text-text-subtle truncate font-mono">{user.email}</p>}
              </div>
              <Link
                href="/perfil"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-surface-2"
              >
                <UserIcon size={16} strokeWidth={1.6} className="text-text-subtle" />
                {t('header.profile')}
              </Link>
              <Link
                href="/ajustes"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-surface-2"
              >
                <Settings size={16} strokeWidth={1.6} className="text-text-subtle" />
                {t('header.settings')}
              </Link>
              {availableOrgs.length > 0 && (
                <div className="border-t border-border">
                  <div className="px-4 pt-2.5 pb-1 text-[11px] uppercase tracking-wider text-text-subtle">
                    {t('sidebar.org.activeLabel')}
                  </div>
                  {availableOrgs.map((o) => {
                    const isActive = o.org_id === activeOrgId;
                    return (
                      <button
                        key={o.org_id}
                        type="button"
                        onClick={() => setActiveOrgId(o.org_id)}
                        data-testid={`app-shell-org-item-${o.org_id}`}
                        className={cn(
                          'w-full flex items-center justify-between gap-2 px-4 py-2 text-sm text-left transition-colors',
                          isActive ? 'bg-surface-2 text-text' : 'text-text-muted hover:bg-surface-2 hover:text-text'
                        )}
                      >
                        <span className="flex items-center gap-2 min-w-0 flex-1">
                          <Building2 size={14} strokeWidth={1.6} className="text-text-subtle shrink-0" />
                          <span className="truncate">{o.legal_name ?? o.org_id}</span>
                        </span>
                        {isActive && <Check size={14} strokeWidth={2} className="text-success" />}
                      </button>
                    );
                  })}
                </div>
              )}
              <button
                type="button"
                onClick={onLogout}
                data-testid="app-shell-logout-button"
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-surface-2 border-t border-border"
              >
                <LogOut size={16} strokeWidth={1.6} />
                {t('header.logout')}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Botón plegar / desplegar */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        title={t('sidebar.fold')}
        data-testid="app-shell-fold-button"
        style={{ left: collapsed ? 'calc(var(--sb-w-collapsed) - 12px)' : 'calc(var(--sb-w) - 12px)' }}
        className="fixed top-1/2 -translate-y-1/2 z-[130] w-6 h-6 rounded-full bg-surface border border-border-strong text-text-muted shadow-md flex items-center justify-center transition-[left] duration-200 hover:text-text hover:border-brand-primary"
      >
        <ChevronLeft size={12} strokeWidth={2} className={cn('transition-transform', collapsed && 'rotate-180')} />
      </button>

      <div
        className={cn('min-h-screen flex flex-col transition-[margin-left] duration-200 ease-out', expanded ? 'ml-sb' : 'ml-sb-collapsed')}
      >
        {children}
      </div>
    </div>
  );
}
