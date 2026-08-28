'use client';
import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import { RequireAuth } from '@/components/RequireAuth';
import { LoadingBlock, ErrorBlock } from '@/components/blocks';
import { apiClient, type Mandate, type MandateCreatePayload } from '@/lib/api/client';
import { MandateForm } from '../MandateForm';

export default function EditarMandatoPage() {
  return (
    <RequireAuth>
      <EditarMandatoContent />
    </RequireAuth>
  );
}

function EditarMandatoContent() {
  const router = useRouter();
  const params = useParams<{ mandateId: string }>();
  const mandateId = params.mandateId;

  const { data: mandate, isLoading, error } = useSWR<Mandate>(
    mandateId ? ['/api/mandates', mandateId] : null,
    () => apiClient.mandates.get(mandateId),
    { revalidateOnFocus: false }
  );

  async function handleSubmit(payload: MandateCreatePayload) {
    await apiClient.mandates.update(mandateId, payload);
    router.push('/oportunidades');
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:py-12 space-y-6">
      <header className="space-y-2">
        <p className="text-caption uppercase tracking-caption text-text-muted">
          Comprar / Vender · Oportunidades
        </p>
        <h1 className="font-display text-3xl font-semibold text-text-primary leading-tight">
          Mi mandato de compra
        </h1>
      </header>

      {isLoading && <LoadingBlock testId="mandato-edit-loading" />}
      {!isLoading && error && (
        <ErrorBlock title="No hemos podido cargar tu mandato" testId="mandato-edit-error" />
      )}
      {!isLoading && !error && mandate && (
        <MandateForm initial={mandate} submitLabel="Guardar cambios" onSubmit={handleSubmit} />
      )}
    </div>
  );
}
