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
 */
import { useMemo } from 'react';
import {
  BookOpen,
  LineChart,
  Scale,
  Users,
  ShieldAlert,
  BarChart3,
  Trophy,
  GitCompare,
  Zap,
  Sparkles,
  FileText,
  Archive,
} from 'lucide-react';

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
  icon: React.ReactNode;
}

const GROUP_PERFIL: Item[] = [
  { key: 'resumen', label: 'Resumen', icon: <BookOpen size={14} strokeWidth={1.8} /> },
  { key: 'finanzas', label: 'Finanzas', icon: <LineChart size={14} strokeWidth={1.8} /> },
  { key: 'valoracion', label: 'Valoración', icon: <Scale size={14} strokeWidth={1.8} /> },
  { key: 'propiedad', label: 'Propiedad', icon: <Users size={14} strokeWidth={1.8} /> },
  { key: 'gobierno', label: 'Gobierno', icon: <ShieldAlert size={14} strokeWidth={1.8} /> },
  { key: 'mercado', label: 'Mercado', icon: <BarChart3 size={14} strokeWidth={1.8} /> },
  { key: 'ranking', label: 'Rankings', icon: <Trophy size={14} strokeWidth={1.8} /> },
  { key: 'comparativa', label: 'Comparativa', icon: <GitCompare size={14} strokeWidth={1.8} /> },
];

const GROUP_INTELIGENCIA: Item[] = [
  { key: 'senales', label: 'Señales', icon: <Zap size={14} strokeWidth={1.8} /> },
  { key: 'oportunidades', label: 'Oportunidades', icon: <Sparkles size={14} strokeWidth={1.8} /> },
];

const GROUP_FUENTES: Item[] = [
  { key: 'registros', label: 'Registros públicos', icon: <FileText size={14} strokeWidth={1.8} /> },
  { key: 'documentos', label: 'Documentos', icon: <Archive size={14} strokeWidth={1.8} /> },
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
              className="inline-flex items-center w-full text-left"
              style={{
                gap: '10px',
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
              <span style={{ opacity: active ? 1 : 0.75, display: 'inline-flex' }}>
                {it.icon}
              </span>
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
