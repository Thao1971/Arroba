'use client';
/**
 * COMP-14001 — Identity Card (ver memory/sources/cuenta_v1/ACC_CUENTA_v0.1.md).
 * Identidad básica del usuario. `full_name` se edita aquí de verdad
 * (PATCH /api/users/me, ya existía en el backend — solo faltaba cablear el
 * frontend). Email y rol canónico son de solo lectura: el email porque
 * cambiarlo requiere un flujo de verificación aparte (no construido), el rol
 * porque solo lo cambia arroba_team/admin (BR-14001-002).
 */
import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { Card, Avatar, Badge, Button, Input, Spinner } from '@/components/ds';
import { useAuth } from '@/contexts/auth-context';
import { useActiveOrg } from '@/lib/workspaces/useActiveOrg';
import { apiClient } from '@/lib/api/client';
import type { Role } from '@/lib/api/types';

const ROLE_LABEL: Record<Role, string> = {
  anonymous: 'Sin identificar',
  subscriber: 'Suscriptor',
  corporate: 'Empresa',
  investor: 'Inversor',
  advisor: 'Asesor',
  admin: 'Equipo arroba',
};

export function IdentityCard() {
  const { user, memberships, refresh } = useAuth();
  const { activeOrgId, availableOrgs } = useActiveOrg();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const activeOrg = availableOrgs.find((o) => o.org_id === activeOrgId);

  async function handleSave() {
    if (!name.trim()) {
      setError('El nombre no puede quedar vacío.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiClient.users.updateMe({ full_name: name.trim() });
      await refresh();
      setEditing(false);
    } catch {
      setError('No hemos podido guardar el nombre. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setName(user?.full_name ?? '');
    setEditing(false);
    setError(null);
  }

  return (
    <Card data-testid="account-identity-card">
      <div className="flex items-start gap-4">
        <Avatar name={user.full_name} size={56} />
        <div className="flex-1 min-w-0 space-y-3">
          {editing ? (
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <Input
                  aria-label="Nombre completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={error ?? undefined}
                  autoFocus
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Guardar nombre"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <Spinner size={14} /> : <Check size={16} strokeWidth={1.75} />}
              </Button>
              <Button variant="ghost" size="sm" aria-label="Cancelar" onClick={handleCancel} disabled={saving}>
                <X size={16} strokeWidth={1.75} />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="font-display font-semibold text-lg text-text truncate">
                {user.full_name || 'Sin nombre'}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label="Editar nombre"
                data-testid="identity-edit-name"
                className="text-text-subtle hover:text-text transition-colors"
              >
                <Pencil size={14} strokeWidth={1.75} />
              </button>
            </div>
          )}

          <p className="text-sm text-text-muted">{user.email}</p>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">{ROLE_LABEL[user.role]}</Badge>
            {!user.email_verified && <Badge variant="warning">Email sin verificar</Badge>}
          </div>

          <div className="pt-2 border-t border-border">
            {memberships.length === 0 ? (
              <p className="text-xs text-text-subtle">
                Todavía no perteneces a ninguna organización — completa el onboarding para crear
                la tuya.
              </p>
            ) : (
              <p className="text-xs text-text-subtle">
                Organización activa:{' '}
                <span className="font-medium text-text-muted">
                  {activeOrg?.legal_name ?? activeOrg?.org_id ?? '—'}
                </span>
                {memberships.length > 1 && ` · ${memberships.length} organizaciones en total`}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
