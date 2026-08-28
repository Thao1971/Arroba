'use client';
import { useRouter } from 'next/navigation';
import { RequireAuth } from '@/components/RequireAuth';
import { apiClient, type MandateCreatePayload } from '@/lib/api/client';
import { useActiveOrg } from '@/lib/workspaces/useActiveOrg';
import { MandateForm } from '../MandateForm';

export default function NuevoMandatoPage() {
  return (
    <RequireAuth>
      <NuevoMandatoContent />
    </RequireAuth>
  );
}

function NuevoMandatoContent() {
  const router = useRouter();
  const { activeOrgId } = useActiveOrg();

  async function handleSubmit(payload: MandateCreatePayload) {
    await apiClient.mandates.create(payload, activeOrgId);
    router.push('/oportunidades');
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:py-12 space-y-6">
      <header className="space-y-2">
        <p className="text-caption uppercase tracking-caption text-text-muted">
          Comprar / Vender · Oportunidades
        </p>
        <h1 className="font-display text-3xl font-semibold text-text-primary leading-tight">
          Crear mi mandato de compra
        </h1>
        <p className="text-body-lg text-text-secondary max-w-2xl">
          Cuéntanos qué buscas — Arroba usará estos criterios para mostrarte
          empresas candidatas reales del universo disponible.
        </p>
      </header>
      <MandateForm submitLabel="Crear mandato" onSubmit={handleSubmit} />
    </div>
  );
}
