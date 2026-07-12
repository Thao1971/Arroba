'use client';
/**
 * CompanySectionNav (F0.1b · layout container · sin COMP-ID).
 *
 * Reproduce el sidebar izquierdo del ZIP (ce-app.jsx). 210px de ancho fijo,
 * sticky top:78. 3 grupos jerárquicos:
 *   - PERFIL: Resumen / Finanzas / Valoración / Propiedad / Gobierno / Mercado / Rankings / Comparativa
 *   - INTELIGENCIA: Señales / Oportunidades
 *   - FUENTES: Registros públicos / Documentos
 *
 * En F0.1b sólo `resumen` está activo con contenido real. Los demás items
 * quedan como links de navegación estilizados (sin ruta destino) que al
 * seleccionarse cambian el `section` local (visible como `UnavailableBlock`
 * en el content column).
 *
 * F0.1c (2026-07-06): sidebar sin iconos (labels solos), alineado con el ZIP.
 */
import { useMemo } from 'react';

export type SectionKey =
  | 'resumen'
  | 'finanzas'
  | 'valoracion'
  | 'propiedad'
  | 'gobierno'
  | 'mercado'
  | 'ranking'
  | 'comparativa'
  | 'senales'
  | 'oportunidades'
  | 'registros'
  | 'documentos';

interface Item {
  key: SectionKey;
  label: string;
}

const GROUP_PERFIL: Item[] = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'finanzas', label: 'Finanzas' },
  { key: 'valoracion', label: 'Valoración' },
  { key: 'propiedad', label: 'Propiedad' },
  { key: 'gobierno', label: 'Gobierno' },
  { key: 'mercado', label: 'Mercado' },
  { key: 'ranking', label: 'Rankings' },
  { key: 'comparativa', label: 'Comparativa' },
];

const GROUP_INTELIGENCIA: Item[] = [
  { key: 'senales', label: 'Señales' },
  { key: 'oportunidades', label: 'Oportunidades' },
];

const GROUP_FUENTES: Item[] = [
  { key: 'registros', label: 'Registros públicos' },
  { key: 'documentos', label: 'Documentos' },
];

export interface CompanySectionNavProps {
  section: SectionKey;
  onChange: (section: SectionKey) => void;
}

function Group({
  title,
  items,
  section,
  onChange,
}: {
  title: string;
  items: Item[];
  section: SectionKey;
  onChange: (section: SectionKey) => void;
}) {
  return (
    <div style={{ marginBottom: '18px' }} data-testid={`section-nav-group-${title.toLowerCase()}`}>
      <div
        style={{
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-secondary, #6B6B6B)',
          marginBottom: '8px',
          paddingLeft: '4px',
        }}
      >
        {title}
      </div>
      <div className="flex flex-col" style={{ gap: '2px' }}>
        {items.map((it) => {
          const active = it.key === section;
          return (
            <button
              type="button"
              key={it.key}
              onClick={() => onChange(it.key)}
              data-testid={`section-nav-item-${it.key}`}
              className="w-full text-left"
              style={{
                padding: '7px 10px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: active ? 700 : 500,
                color: active ? '#FFFFFF' : 'var(--text-primary, #101010)',
                background: active ? '#E8001D' : 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {it.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CompanySectionNav({ section, onChange }: CompanySectionNavProps) {
  const groups = useMemo(
    () => [
      { title: 'Perfil', items: GROUP_PERFIL },
      { title: 'Inteligencia', items: GROUP_INTELIGENCIA },
      { title: 'Fuentes', items: GROUP_FUENTES },
    ],
    [],
  );
  return (
    <nav
      data-testid="ficha-section-nav"
      className="sticky"
      style={{ top: '78px' }}
      aria-label="Secciones de la ficha"
    >
      {groups.map((g) => (
        <Group
          key={g.title}
          title={g.title}
          items={g.items}
          section={section}
          onChange={onChange}
        />
      ))}
    </nav>
  );
}
