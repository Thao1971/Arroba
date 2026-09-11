'use client';
/**
 * COMP-14003 — Criteria / Thesis (ver ACC_CUENTA_v0.1.md).
 * Role-adaptive. El caso comprador ya existe como "Mandato de compra"
 * (/oportunidades/mandato) — este componente NO reconstruye ese formulario,
 * solo muestra un resumen y enlaza a él (BR-14003-002: una sola Source of
 * Truth). El caso vendedor no tiene hoy un endpoint "mis empresas" en el
 * backend, así que se deja como nota explícita en vez de fingir un enlace
 * que no lleva a ningún sitio.
 */
import Link from 'next/link';
import useSWR from 'swr';
import { Target, Plus } from 'lucide-react';
import { Card, Badge, Button, Spinner } from '@/components/ds';
import { useAuth } from '@/contexts/auth-context';
import { useActiveOrg } from '@/lib/workspaces/useActiveOrg';
import { apiClient, type Mandate } from '@/lib/api/client';

function mandateSummary(m: Mandate): string {
  const parts: string[] = [];
  if (m.target_cnae_sections?.length) parts.push(m.target_cnae_sections.join(', '));
  if (m.revenue_min != null || m.revenue_max != null) {
    const lo = m.revenue_min != null ? `${(m.revenue_min / 1e6).toFixed(1)}M€` : '—';
    const hi = m.revenue_max != null ? `${(m.revenue_max / 1e6).toFixed(1)}M€` : '—';
    parts.push(`Facturación ${lo} – ${hi}`);
  }
  if (m.target_provincias?.length) parts.push(m.target_provincias.join(', '));
  return parts.join(' · ') || 'Sin criterios específicos todavía';
}

const MANDATE_TYPE_LABEL: Record<string, string> = {
  strategic: 'Estratégico',
  financial: 'Financiero',
  roll_up: 'Roll-up / consolidación',
};

export function CriteriaThesis() {
  const { user } = useAuth();
  const { activeOrgId } = useActiveOrg();

  const isBuyerLike = user?.role === 'corporate' || user?.role === 'investor';

  const { data: mandates, isLoading } = useSWR<Mandate[]>(
    isBuyerLike && activeOrgId ? ['/api/mandates/mine', activeOrgId, 'criteria-thesis'] : null,
    () => apiClient.mandates.listMine(activeOrgId, 'active'),
    { revalidateOnFocus: false }
  );

  if (!user) return null;

  if (!isBuyerLike) {
    return (
      <Card data-testid="criteria-thesis" header="Qué busco en arroba">
        <p className="text-sm text-text-muted">
          {user.role === 'advisor'
            ? 'La gestión de mandatos por cuenta de clientes se hace desde Oportunidades, asociando cada mandato a la organización del cliente.'
            : 'Tu cuenta todavía no tiene un criterio de compra o venta definido. Cuando decidas qué buscas en arroba, podrás definirlo desde Oportunidades.'}
        </p>
        <Link
          href="/oportunidades"
          className="inline-block mt-3 text-sm font-medium text-primary hover:underline"
        >
          Ir a Oportunidades →
        </Link>
      </Card>
    );
  }

  return (
    <Card data-testid="criteria-thesis" header="Mi mandato de compra">
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Spinner size={14} /> Cargando…
        </div>
      )}

      {!isLoading && (mandates?.length ?? 0) === 0 && (
        <div className="text-center py-4">
          <Target size={24} strokeWidth={1.5} className="mx-auto mb-2 text-text-subtle" />
          <p className="text-sm text-text-muted mb-3">
            Aún no tienes un mandato de compra activo. Es lo que arroba usa para mostrarte
            empresas candidatas reales.
          </p>
          <Link href="/oportunidades/mandato/nuevo">
            <Button size="sm" leftIcon={<Plus size={14} strokeWidth={1.75} />}>
              Crear mi mandato
            </Button>
          </Link>
        </div>
      )}

      {!isLoading &&
        mandates?.map((m) => (
          <div key={m.id} className="flex items-start justify-between gap-3 py-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm text-text truncate">{m.name}</p>
                <Badge variant="default">
                  {MANDATE_TYPE_LABEL[m.mandate_type ?? ''] ?? m.mandate_type}
                </Badge>
              </div>
              <p className="text-xs text-text-muted">{mandateSummary(m)}</p>
            </div>
            <Link
              href={`/oportunidades/mandato/${m.id}`}
              className="text-xs font-medium text-primary hover:underline whitespace-nowrap"
            >
              Ver / editar →
            </Link>
          </div>
        ))}
    </Card>
  );
}
