'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LogOut, ChevronDown, User as UserIcon, Settings, Wrench } from 'lucide-react';
import { ThemeSwitcher, Avatar } from '@/components/ds';
import { OrgSwitcher } from './OrgSwitcher';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/cn';

const NAV_ITEMS = [
  { href: '/historial', key: 'historial' as const },
];

/**
 * Authenticated header — STRICT spec from E1.1:
 *   [Logo ARROBA] | Analizar  Valorar  Comprar/Vender | [Theme] [User ▼]
 * No sidebars, no breadcrumbs, no mega-menus, no badges/counters.
 */
export function AuthHeader() {
  const t = useTranslations();
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', onClick);
      document.addEventListener('keydown', onEsc);
      return () => {
        document.removeEventListener('mousedown', onClick);
        document.removeEventListener('keydown', onEsc);
      };
    }
    return undefined;
  }, [open]);

  async function onLogout() {
    setOpen(false);
    await logout();
    router.replace('/login');
  }

  return (
    <header
      data-testid="auth-header"
      className="sticky top-0 z-30 backdrop-blur border-b border-border bg-surface/85"
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
        <Link
          href="/organizaciones"
          className="font-display font-semibold text-lg flex items-center gap-2 shrink-0"
          data-testid="auth-header-logo"
          aria-label="arroba"
        >
          {/* HARDENING-030 · logo real ARROBA (asset /brand/logo.png). */}
          <img src="/brand/logo.png" alt="arroba" className="h-7 w-auto" />
        </Link>
        <nav className="hidden md:flex items-center gap-1" data-testid="auth-header-nav">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`auth-header-nav-${item.key}`}
                className={cn(
                  'px-3 h-10 inline-flex items-center rounded-md text-sm font-body transition-colors',
                  active
                    ? 'text-text bg-surface-2'
                    : 'text-text-muted hover:text-text hover:bg-surface-2'
                )}
              >
                {t(`nav.${item.key}`)}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <OrgSwitcher />
          <ThemeSwitcher />
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label={t('header.openMenu')}
              data-testid="auth-header-user-menu-button"
              className="inline-flex items-center gap-1.5 h-10 pl-1 pr-2 rounded-md hover:bg-surface-2 transition-colors"
            >
              <Avatar size={28} name={user?.full_name || user?.email || '?'} />
              <ChevronDown size={14} strokeWidth={1.6} className="text-text-subtle" />
            </button>
            {open && (
              <div
                role="menu"
                data-testid="auth-header-user-menu"
                className="absolute right-0 mt-2 w-60 rounded-lg border border-border bg-surface shadow-lg overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-border">
                  <p className="font-display font-medium text-sm truncate">
                    {user?.full_name || user?.email}
                  </p>
                  {user?.full_name && (
                    <p className="text-xs text-text-subtle truncate font-mono">{user.email}</p>
                  )}
                </div>
                <MenuLink
                  href="/perfil"
                  icon={UserIcon}
                  label={t('header.profile')}
                  testId="auth-header-menu-profile"
                  onClick={() => setOpen(false)}
                />
                <MenuLink
                  href="/ajustes"
                  icon={Settings}
                  label={t('header.settings')}
                  testId="auth-header-menu-settings"
                  onClick={() => setOpen(false)}
                />
                {user?.role === 'admin' && (
                  <MenuLink
                    href="/internal/design-system"
                    icon={Wrench}
                    label={t('header.designSystemAdmin')}
                    testId="auth-header-menu-ds"
                    onClick={() => setOpen(false)}
                  />
                )}
                <button
                  type="button"
                  onClick={onLogout}
                  data-testid="auth-header-logout-button"
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-surface-2 border-t border-border"
                >
                  <LogOut size={16} strokeWidth={1.6} />
                  {t('header.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function MenuLink({
  href,
  icon: IconCmp,
  label,
  testId,
  onClick,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  testId: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-surface-2"
      data-testid={testId}
      onClick={onClick}
    >
      <IconCmp size={16} strokeWidth={1.6} className="text-text-subtle" />
      {label}
    </Link>
  );
}
