'use client';
/**
 * FinanzasHeader — metadata bar de la sección Finanzas.
 *
 * Fila horizontal de badges canónicos que exponen provenance del dato
 * financiero (rango de años, basis individual/consolidado, auditoría,
 * fuente y última actualización) sin ocupar espacio vertical.
 *
 * Se renderiza justo debajo del título de sección canónico
 * (`<EntitySectionWrapper title="Finanzas">`), sobre el primer bloque
 * (RevenueEvolutionBlock).
 *
 * En Hito 1 se acepta que todos los campos vengan `null` — el componente
 * simplemente no renderiza los badges vacíos. Cuando el Financial Engine
 * exponga estos metadatos en `/api/companies/{cif}/financial-analysis`,
 * el mapping se hace 1:1 sin refactor.
 */
import { ShieldCheck, Calendar, Database, Building2, Clock } from 'lucide-react';

import { Badge } from '@/components/ds';
import { cn } from '@/lib/cn';

export type FinanzasBasis = 'individual' | 'consolidated';

export interface FinanzasHeaderProps {
  /** Ej. "2020–2024". Si `null` no se pinta. */
  yearsRange?: string | null;
  /** Basis del dato. */
  basis?: FinanzasBasis | null;
  /** Nombre del auditor. Si presente → badge `info` "Auditada por …". */
  auditor?: string | null;
  /** Fuente del dato (ej. "Iberinform", "SABI"). */
  source?: string | null;
  /** Texto relativo (ej. "hace 3 días"). */
  lastUpdatedLabel?: string | null;
  testId?: string;
  className?: string;
}

const BASIS_LABEL: Record<FinanzasBasis, string> = {
  individual: 'Individual',
  consolidated: 'Consolidado',
};

export function FinanzasHeader({
  yearsRange,
  basis,
  auditor,
  source,
  lastUpdatedLabel,
  testId = 'finanzas-header',
  className,
}: FinanzasHeaderProps) {
  /* Si no hay ningún badge que pintar, el componente NO se monta. Evita
     un contenedor visualmente vacío. */
  const hasAny = Boolean(
    yearsRange || basis || auditor || source || lastUpdatedLabel,
  );
  if (!hasAny) return null;

  return (
    <div
      data-testid={testId}
      className={cn(
        'flex flex-wrap items-center gap-2',
        'mb-4',
        className,
      )}
    >
      {yearsRange && (
        <Badge
          variant="default"
          icon={<Calendar size={12} strokeWidth={1.8} aria-hidden />}
        >
          Datos {yearsRange}
        </Badge>
      )}
      {basis && (
        <Badge variant="default" icon={<Building2 size={12} strokeWidth={1.8} aria-hidden />}>
          {BASIS_LABEL[basis]}
        </Badge>
      )}
      {auditor && (
        <Badge
          variant="info"
          icon={<ShieldCheck size={12} strokeWidth={1.8} aria-hidden />}
        >
          Auditada por {auditor}
        </Badge>
      )}
      {source && (
        <Badge variant="default" icon={<Database size={12} strokeWidth={1.8} aria-hidden />}>
          Fuente: {source}
        </Badge>
      )}
      {lastUpdatedLabel && (
        <Badge variant="default" icon={<Clock size={12} strokeWidth={1.8} aria-hidden />}>
          Actualizada {lastUpdatedLabel}
        </Badge>
      )}
    </div>
  );
}
