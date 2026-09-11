'use client';
/**
 * COMP-14004 — Account Security (ver ACC_CUENTA_v0.1.md).
 * Solo "Cerrar sesión" tiene endpoint real hoy (POST /api/auth/logout).
 * Cambiar contraseña y listar/revocar sesiones no existen en el backend
 * (auth/service.py solo tiene register/login/logout) — se marcan como
 * próximamente en vez de simularse.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, KeyRound, Monitor } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ds';
import { useAuth } from '@/contexts/auth-context';

export function AccountSecurity() {
  const { logout } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <Card data-testid="account-security" header="Seguridad de la cuenta">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <KeyRound size={16} strokeWidth={1.75} className="text-text-subtle" />
            <span className="text-sm text-text">Contraseña</span>
          </div>
          <Badge variant="default">Próximamente</Badge>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Monitor size={16} strokeWidth={1.75} className="text-text-subtle" />
            <span className="text-sm text-text">Sesiones activas</span>
          </div>
          <Badge variant="default">Próximamente</Badge>
        </div>

        <div className="pt-3 border-t border-border">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<LogOut size={14} strokeWidth={1.75} />}
            onClick={handleLogout}
            loading={loggingOut}
            data-testid="account-security-logout"
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
    </Card>
  );
}
