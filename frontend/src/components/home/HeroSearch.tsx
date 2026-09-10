'use client';
import { useEffect, useState } from 'react';
import { ArrowRight, Compass } from 'lucide-react';
import { useCopilot } from '@/components/copilot';

/**
 * Buscador con chips de sugerencia — extraído de la home pública
 * ((public)/page.tsx) el 2026-09-10 para que la Home privada (`inicio/`)
 * pueda reutilizar exactamente el mismo mecanismo en vez de inventar uno
 * nuevo: mismo `useCopilot().send()`, mismo skill público
 * `/api/copilot/skills/search`. Sin lógica paralela ni datos mock.
 */

const HERO_PLACEHOLDERS = [
  '¿Cuánto vale mi empresa?',
  'Quiero vender mi compañía',
  'Quiero comprar una empresa',
  'Cómo está mi empresa frente a la competencia',
  'Empresas industriales en Valencia',
];

export const HERO_SEARCH_CHIPS = [
  { label: 'Empresas industriales en Valencia', kind: 'categorico' },
  { label: 'Sector salud', kind: 'categorico' },
  { label: 'Empresas de IA', kind: 'semantico' },
  { label: '¿Cuánto vale mi sector?', kind: 'semantico' },
  { label: 'Consolidación veterinaria', kind: 'semantico' },
  { label: 'Empresas con crecimiento >20%', kind: 'financiero' },
] as const;

export function HeroSearchTeaser() {
  const { openDock, send, loading } = useCopilot();
  const [query, setQuery] = useState('');
  const [phIdx, setPhIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setPhIdx((i) => (i + 1) % HERO_PLACEHOLDERS.length),
      3200,
    );
    return () => clearInterval(id);
  }, []);

  function submit() {
    const q = query.trim();
    if (!q) return;
    openDock();
    void send(q);
  }

  return (
    <form
      data-testid="home-hero-search-teaser"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="mx-auto max-w-xl flex items-center gap-2 px-4 h-14 rounded-[14px] border-[1.5px] border-border-strong bg-surface shadow-sm transition-colors focus-within:border-primary"
    >
      <Compass size={18} strokeWidth={1.6} className="text-text-subtle shrink-0" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={HERO_PLACEHOLDERS[phIdx]}
        aria-label="Buscar empresas, sectores o territorios"
        data-testid="home-hero-search-input"
        className="flex-1 h-full bg-transparent border-none outline-none text-[15px] text-text font-body placeholder:text-text-subtle"
      />
      <button
        type="submit"
        disabled={loading || !query.trim()}
        data-testid="home-hero-search-submit"
        aria-label="Buscar"
        className="inline-flex items-center justify-center h-9 w-9 rounded-[10px] bg-primary text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
      >
        <ArrowRight size={16} strokeWidth={1.8} />
      </button>
    </form>
  );
}

export function HeroSearchChips() {
  const { openDock, send, loading } = useCopilot();

  function runChip(label: string) {
    if (loading) return;
    openDock();
    void send(label);
  }

  return (
    <div
      data-testid="home-hero-search-chips"
      className="mx-auto max-w-2xl flex flex-wrap justify-center gap-2 mt-4"
    >
      {HERO_SEARCH_CHIPS.map(({ label }) => (
        <button
          key={label}
          type="button"
          onClick={() => runChip(label)}
          disabled={loading}
          data-testid={`home-hero-search-chip-${label}`}
          className="px-3.5 h-8 rounded-full border border-border-strong bg-surface text-[13px] text-text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
