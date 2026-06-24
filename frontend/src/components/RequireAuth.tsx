'use client';
import { useRouter, usePathname } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Spinner } from '@/components/ds';

export interface RequireAuthProps {
  children: ReactNode;
  /** If set, also require the user's role to match. */
  role?: 'admin';
  /** Where to redirect non-authenticated visitors. */
  loginPath?: string;
  /** Where to redirect when role mismatch (e.g. non-admin on /internal). */
  fallbackPath?: string;
}

export function RequireAuth({
  children,
  role,
  loginPath = '/login',
  fallbackPath = '/',
}: RequireAuthProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      const next = encodeURIComponent(pathname || '/');
      router.replace(`${loginPath}?next=${next}`);
      return;
    }
    if (role && user?.role !== role) {
      router.replace(fallbackPath);
    }
  }, [isAuthenticated, isLoading, role, user, router, pathname, loginPath, fallbackPath]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-muted gap-3">
        <Spinner /> Cargando…
      </div>
    );
  }
  if (!isAuthenticated) return null;
  if (role && user?.role !== role) return null;
  return <>{children}</>;
}
