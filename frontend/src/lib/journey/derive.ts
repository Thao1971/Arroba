import type { IntentId, DemoCompany } from './data';
import { COMPANIES_DEMO, INTENTS, PLAZO_LONG } from './data';

/** NFD normalisation + lowercase + trim, for accent-insensitive company search. */
export function normalizeES(s: string): string {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export interface JourneyState {
  intent: IntentId | null;
  about: string | null;
  vehicle?: string;
  company?: { id?: string; name: string; cif?: string; razon?: string; sector?: string; city?: string; free?: boolean } | null;
  objetivo?: string | readonly string[];
  plazo?: string;
}

export interface JourneyDerived {
  entityType: string;
  companyName: string;
  goalsStr: string;
  plazo: string;
  narrative: string;
}

export function deriveJourney(state: JourneyState): JourneyDerived {
  const it = INTENTS.find((x) => x.id === state.intent);
  const company = state.company ? state.company.name : state.vehicle || '';
  const goalsArr = Array.isArray(state.objetivo) ? state.objetivo : state.objetivo ? [state.objetivo] : [];
  const goalsStr = goalsArr.map((g) => g.toLowerCase()).join(', ');
  const plazo = (state.plazo && PLAZO_LONG[state.plazo]) || (state.plazo ?? '').toLowerCase();
  const entityType = it?.entity ?? 'Oportunidad';
  const narrative = renderNarrative(state.intent, { company: company || 'Tu empresa', goals: goalsStr, plazo });
  return { entityType, companyName: company, goalsStr: goalsArr.join(' · '), plazo, narrative };
}

function renderNarrative(intent: IntentId | null, ctx: { company: string; goals: string; plazo: string }): string {
  if (intent === 'vender') return `${ctx.company} está estudiando su futuro: ${ctx.goals}. Se plantea avanzar ${ctx.plazo}, manteniendo el control del proceso en todo momento.`;
  if (intent === 'financiar') return `${ctx.company} busca financiación para ${ctx.goals}, con la intención de avanzar ${ctx.plazo}.`;
  if (intent === 'comprar') return `Estás preparando una tesis de adquisición para ${ctx.goals}, operando desde ${ctx.company}, con un horizonte de ${ctx.plazo}.`;
  return `${ctx.company}: tu espacio personal de inteligencia y operaciones.`;
}

/** Búsqueda difusa local sobre las empresas demo (sin llamada al backend). */
export function searchCompanies(q: string): DemoCompany[] {
  const nq = normalizeES(q);
  if (nq.length === 0) return [];
  const nqCif = nq.replace(/[\s.\-]/g, '');
  return COMPANIES_DEMO.filter((c) => {
    const cifClean = normalizeES(c.cif).replace(/[\s.\-]/g, '');
    return (
      normalizeES(c.name).includes(nq) ||
      normalizeES(c.sector).includes(nq) ||
      (nqCif.length >= 3 && cifClean.includes(nqCif))
    );
  });
}
