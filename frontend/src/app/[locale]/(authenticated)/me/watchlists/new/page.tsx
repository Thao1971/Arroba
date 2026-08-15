'use client';
/**
 * `/me/watchlists/new` — stub Fase 2 (HARDENING-033).
 *
 * Destino del CTA "Guardar esta búsqueda como watchlist" que aparece sobre
 * `/resultados` cuando hay al menos un filtro `signal_badge` activo. El
 * backend de watchlists aún no existe: esta página materializa la promesa
 * del CTA sin devolver 404 y sin ensuciar analytics con enlaces rotos.
 *
 * Consume los query params `q` y `signals` para pintar contexto y para
 * ofrecer un botón de vuelta preservándolos, garantizando que el usuario
 * no pierde su búsqueda al llegar aquí.
 */
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Bookmark } from 'lucide-react';
import { RequireAuth } from '@/components/RequireAuth';
import { EmptyStateBlock } from '@/components/blocks';

export default function WatchlistsNewPage() {
  return (
    <RequireAuth>
      <Suspense fallback={null}>
        <WatchlistsNewInner />
      </Suspense>
    </RequireAuth>
  );
}

function WatchlistsNewInner() {
  const params = useSearchParams();
  const q = params.get('q') ?? '';
  const signals = params.get('signals') ?? '';

  const backQs = new URLSearchParams();
  if (q) backQs.set('q', q);
  const backHref = backQs.toString()
    ? `/resultados?${backQs.toString()}`
    : '/resultados';

  const contextLine = q
    ? `Búsqueda: «${q}»${signals ? ` · filtros: ${signals}` : ''}.`
    : 'Aún no has llegado aquí desde una búsqueda filtrada.';

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <EmptyStateBlock
        icon={Bookmark}
        title="Watchlists · Fase 2"
        description={
          <>
            Estamos preparando la funcionalidad de watchlists. Guardaremos
            aquí tus búsquedas filtradas cuando esté lista, con actualización
            diaria y avisos de cambios en las señales.
          </>
        }
        hint={contextLine}
        action={
          <Link
            href={backHref}
            data-testid="watchlists-new-back"
            className="inline-flex items-center h-10 px-5 rounded-[10px] bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            Volver a los resultados
          </Link>
        }
        testId="watchlists-new-placeholder"
      />
    </div>
  );
}
