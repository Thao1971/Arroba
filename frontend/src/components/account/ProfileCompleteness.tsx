'use client';
/**
 * COMP-14002 — Profile Completeness (ver ACC_CUENTA_v0.1.md).
 * Agrega en un único indicador cuánto le falta al usuario para que arroba
 * pueda recomendarle algo — nunca calcula matching score, solo completitud
 * de datos de entrada (BR-14002-003). Los campos medidos dependen del rol:
 * un `corporate`/`investor` necesita un mandato activo; el resto solo
 * necesita nombre + organización.
 */
import Link from 'next/link';
import useSWR from 'swr';
import { CheckCircle2, Circle } from 'lucide-react';
import { Card } from '@/components/ds';
import { useAuth } from '@/contexts/auth-context';
import { useActiveOrg } from '@/lib/workspaces/useActiveOrg';
import { apiClient, type Mandate } from '@/lib/api/client';

interface ChecklistItem {
  label: string;
  done: boolean;
  href?: string;
  hrefLabel?: string;
}

export function ProfileCompleteness() {
  const { user, memberships } = useAuth();
  const { activeOrgId } = useActiveOrg();

  const needsMandate = user?.role === 'corporate' || user?.role === 'investor';

  const { data: mandates } = useSWR<Mandate[]>(
    needsMandate && activeOrgId ? ['/api/mandates/mine', activeOrgId, 'completeness'] : null,
    () => apiClient.mandates.listMine(activeOrgId, 'active'),
    { revalidateOnFocus: false }
  );

  if (!user) return null;

  const items: ChecklistItem[] = [
    { label: 'Nombre completo', done: !!user.full_name?.trim() },
    {
      label: 'Perteneces a una organización',
      done: memberships.length > 0,
      href: '/organizaciones',
      hrefLabel: 'Organizaciones',
    },
  ];

  if (needsMandate) {
    items.push({
      label: 'Tienes un mandato de compra activo',
      done: (mandates?.length ?? 0) > 0,
      href: '/oportunidades/mandato/nuevo',
      hrefLabel: 'Crear mandato',
    });
  }

  const done = items.filter((i) => i.done).length;
  const pct = Math.round((done / items.length) * 100);

  return (
    <Card data-testid="profile-completeness">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-medium text-sm text-text">Completitud del perfil</h3>
        <span className="text-sm font-semibold text-text">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface-2 overflow-hidden mb-4">
        <div
          className="h-full bg-primary transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-sm">
            {item.done ? (
              <CheckCircle2 size={16} strokeWidth={1.75} className="text-success shrink-0" />
            ) : (
              <Circle size={16} strokeWidth={1.75} className="text-text-subtle shrink-0" />
            )}
            <span className={item.done ? 'text-text-muted' : 'text-text'}>{item.label}</span>
            {!item.done && item.href && (
              <Link href={item.href} className="ml-auto text-xs font-medium text-primary hover:underline">
                {item.hrefLabel} →
              </Link>
            )}
          </li>
        ))}
      </ul>
      {pct < 100 && needsMandate && (
        <p className="text-xs text-text-subtle mt-3">
          Sin un mandato activo no recibirás candidatas en Oportunidades.
        </p>
      )}
    </Card>
  );
}
