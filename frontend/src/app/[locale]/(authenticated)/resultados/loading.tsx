import { LoadingBlock } from '@/components/blocks';

/**
 * Next.js route-level loading UI — se muestra al instante al navegar hacia
 * `/resultados` (desde el hero, el Composer del Copilot, o un enlace
 * directo), antes de que el componente de la página monte y gestione su
 * propio estado de carga. Mismo patrón que ya usan las páginas de
 * Oportunidades (`LoadingBlock`), para que la transición entre pantallas
 * sea consistente en toda la plataforma.
 */
export default function ResultadosLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-40">
      <LoadingBlock testId="resultados-route-loading" />
    </div>
  );
}
