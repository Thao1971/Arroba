'use client';
/**
 * COMP-14007 — Organization & Team (ver ACC_CUENTA_v0.1.md, DA-14003/DA-14006).
 * Real: lista de miembros vía GET /organizations/{org_id}/members y creación
 * de invitación vía POST /organizations/{org_id}/invitations — ambos
 * endpoints ya existen en el backend y exigen role_in_org owner|admin
 * (BR-14007-001), que el backend re-valida igualmente.
 *
 * Límite honesto: crear la invitación funciona y queda persistida, pero no
 * existe todavía una pantalla `/invitaciones/[token]` para aceptarla ni un
 * servicio de email que la envíe — así que no se ofrece un "enlace" que no
 * lleva a ningún sitio, solo confirmación de que quedó creada.
 */
import { useState } from 'react';
import useSWR from 'swr';
import { Users, UserPlus } from 'lucide-react';
import { Card, Badge, Button, Input, Alert, Spinner } from '@/components/ds';
import { useAuth } from '@/contexts/auth-context';
import { useActiveOrg } from '@/lib/workspaces/useActiveOrg';
import { apiClient, ApiError } from '@/lib/api/client';
import type { MembershipPublic, OrgRole } from '@/lib/api/types';

const ROLE_LABEL: Record<OrgRole, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  operator: 'Miembro',
};

export function OrganizationTeam() {
  const { memberships } = useAuth();
  const { activeOrgId, availableOrgs } = useActiveOrg();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgRole>('operator');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ email: string; role: OrgRole } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeOrg = availableOrgs.find((o) => o.org_id === activeOrgId);
  const myMembership = memberships.find((m) => m.org_id === activeOrgId);
  const canManage = myMembership?.role_in_org === 'owner' || myMembership?.role_in_org === 'admin';

  const { data: members, isLoading, mutate } = useSWR<MembershipPublic[]>(
    activeOrgId ? ['/api/organizations/members', activeOrgId] : null,
    () => apiClient.organizations.members(activeOrgId!),
    { revalidateOnFocus: false }
  );

  if (!activeOrgId) {
    return (
      <Card data-testid="organization-team" header="Organización y equipo">
        <p className="text-sm text-text-muted">
          Todavía no perteneces a ninguna organización.
        </p>
      </Card>
    );
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !activeOrgId) return;
    setInviting(true);
    setError(null);
    setInviteResult(null);
    try {
      await apiClient.organizations.invite(activeOrgId, { email: email.trim(), role_in_org: role });
      setInviteResult({ email: email.trim(), role });
      setEmail('');
      await mutate();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError('No tienes permiso para invitar en esta organización.');
      } else {
        setError('No hemos podido crear la invitación. Inténtalo de nuevo.');
      }
    } finally {
      setInviting(false);
    }
  }

  return (
    <Card
      data-testid="organization-team"
      header={
        <div className="flex items-center gap-2">
          <Users size={16} strokeWidth={1.75} />
          <span>{activeOrg?.legal_name ?? 'Organización'}</span>
        </div>
      }
    >
      <div className="space-y-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Spinner size={14} /> Cargando miembros…
          </div>
        )}

        {!isLoading && (
          <ul className="divide-y divide-border">
            {(members ?? []).map((m) => (
              <li key={m.membership_id} className="py-2 flex items-center justify-between gap-3">
                <span className="text-sm text-text truncate">{m.user_id}</span>
                <Badge variant={m.role_in_org === 'owner' ? 'info' : 'default'}>
                  {ROLE_LABEL[m.role_in_org]}
                </Badge>
              </li>
            ))}
          </ul>
        )}

        <div className="pt-2 text-right">
          <a href="/organizaciones" className="text-xs font-medium text-primary hover:underline">
            Ver todas mis organizaciones →
          </a>
        </div>

        {canManage ? (
          <form onSubmit={handleInvite} className="pt-4 border-t border-border space-y-3">
            <p className="text-sm font-medium text-text flex items-center gap-1.5">
              <UserPlus size={14} strokeWidth={1.75} /> Invitar a la organización
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="email@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-label="Email a invitar"
                />
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as OrgRole)}
                className="h-11 px-3 rounded-md font-body bg-surface text-text border border-border"
                aria-label="Rol en la organización"
              >
                <option value="operator">Miembro</option>
                <option value="admin">Administrador</option>
              </select>
              <Button type="submit" loading={inviting} data-testid="organization-team-invite-submit">
                Invitar
              </Button>
            </div>

            {error && (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            )}

            {inviteResult && (
              <Alert variant="success" title="Invitación creada">
                Queda pendiente de aceptación para {inviteResult.email} (
                {ROLE_LABEL[inviteResult.role]}). Todavía no hay una pantalla para que la acepte
                por su cuenta ni se le envía email automáticamente — hay que coordinarlo con
                ella a mano por ahora.
              </Alert>
            )}
          </form>
        ) : (
          <p className="text-xs text-text-subtle pt-3 border-t border-border">
            Solo un propietario o administrador de esta organización puede invitar miembros.
          </p>
        )}
      </div>
    </Card>
  );
}
