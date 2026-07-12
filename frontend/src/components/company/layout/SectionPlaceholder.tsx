'use client';
/**
 * SectionPlaceholder (F0.1b · layout container · sin COMP-ID).
 *
 * Renderiza un UnavailableBlock a pantalla completa dentro de la columna
 * central cuando el usuario selecciona una sección que aún no está
 * implementada. Respeta la geometría del `content` column del ZIP.
 */
import { UnavailableBlock } from '@/components/blocks/UnavailableBlock';
import type { SectionKey } from './CompanySectionNav';

const SECTION_LABELS: Record<SectionKey, string> = {
  resumen: 'Resumen',
  finanzas: 'Finanzas',
  valoracion: 'Valoración',
  propiedad: 'Propiedad',
  gobierno: 'Gobierno',
  mercado: 'Mercado',
  ranking: 'Rankings',
  comparativa: 'Comparativa',
  senales: 'Señales',
  oportunidades: 'Oportunidades',
  registros: 'Registros públicos',
  documentos: 'Documentos',
};

const SECTION_SUB_SPRINT: Record<SectionKey, string> = {
  resumen: '',
  finanzas: 'F0.2',
  valoracion: 'F0.3',
  propiedad: 'F0.4',
  gobierno: 'F0.5',
  mercado: 'F0.6',
  ranking: 'F0.7',
  comparativa: 'F0.8',
  senales: 'F0.9',
  oportunidades: 'F0.10',
  registros: 'F0.11',
  documentos: 'F0.11',
};

export interface SectionPlaceholderProps {
  section: Exclude<SectionKey, 'resumen'>;
}

export function SectionPlaceholder({ section }: SectionPlaceholderProps) {
  const label = SECTION_LABELS[section];
  const sub = SECTION_SUB_SPRINT[section];
  return (
    <div
      data-testid={`ficha-section-placeholder-${section}`}
      style={{ minHeight: '520px' }}
    >
      <UnavailableBlock
        testId={`placeholder-${section}`}
        title={`${label} · pendiente de implementación`}
        description={`El motor Agency Tool V2 asociado a esta sección aún no está integrado. Se entregará en el sub-sprint ${sub}.`}
        req={`Sub-sprint ${sub} · Ficha de Empresa`}
        eta={sub}
      />
    </div>
  );
}
