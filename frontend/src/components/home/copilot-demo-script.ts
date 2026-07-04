/**
 * Guion pre-grabado usado por <CopilotDemoTeaser />. La forma replica el
 * protocolo real de Copilot+Skill futuro, para que la demo pueda cambiarse
 * de forma trivial cuando el flujo real esté disponible.
 *
 *   - `chip_id`         : stable id of the suggestion chip
 *   - `user_message`    : text appearing as the user's message when clicked
 *   - `copilot_response`: rendered as the Copilot's reply (markdown-light:
 *                         supports **bold** + line breaks; no real MD parser
 *                         in this demo — keep it short)
 *   - `cards`           : array of "materialised" cards the Copilot shows
 *                         below the reply. Each card has a title + body.
 *   - `citation`        : footer line ("Fuente: BdE, dic 2025 · Confidence 0.92")
 *
 * This data is sourced from the _design_intake brief and Home.html demo. No
 * LLM is involved in E1.1.5 — the script is fully deterministic.
 */

export interface DemoCard {
  title: string;
  body: string;
  meta?: string; // e.g. "Confidence 0.92 · ✦"
}

export interface DemoTurn {
  chip_id: string;
  chip_label: string;
  user_message: string;
  copilot_response: string;
  cards?: readonly DemoCard[];
  citation?: string;
}

/** First message shown when the demo loads, before any chip is clicked. */
export const DEMO_INTRO_USER = '¿Cuánto vale mi empresa?';
export const DEMO_INTRO_COPILOT =
  'Para indicarte un rango orientativo necesito apoyarme en tres palancas: tus **financieros** (P&G y balance), los **múltiplos sectoriales** y los **comparables** recientes. Empiezo por aquí:';
export const DEMO_INTRO_CARDS: readonly DemoCard[] = [
  {
    title: 'Múltiplos del sector',
    body: 'Software · EV/EBITDA mediana 8.4× (rango 6.1× — 10.7×).',
    meta: 'INE + BdE · Confidence 0.92 · ✦',
  },
  {
    title: 'Operaciones comparables (últ. 12 m)',
    body: '3 transacciones de empresas similares en España — múltiplos 7.2× / 8.9× / 9.6×.',
    meta: 'M&A Intelligence · Confidence 0.88 · ✦',
  },
];

export const DEMO_SCRIPT: readonly DemoTurn[] = [
  {
    chip_id: 'shortlist',
    chip_label: 'Ver shortlist',
    user_message: 'Ver shortlist',
    copilot_response:
      'He filtrado **12 compañías** en tu sector con tamaño 5–15 M€ de facturación y EBITDA positivo. Te muestro las 3 más afines a tu tesis:',
    cards: [
      {
        title: 'Kitchen Studio, S.L.',
        body: 'Madrid · Software a medida · 5,4M€ / EBITDA 1,1M€',
        meta: 'Match score 0.91 · ✦',
      },
      {
        title: 'Quickads Technologies, S.L.',
        body: 'Barcelona · SaaS · 3,1M€ / EBITDA 0,4M€',
        meta: 'Match score 0.83 · ✦',
      },
      {
        title: 'Muñoz Comunicación, S.L.',
        body: 'Madrid · Agencia · 4,2M€ / EBITDA 0,76M€',
        meta: 'Match score 0.78 · ✦',
      },
    ],
    citation: 'Fuente: Registradores + M&A Intelligence · Confidence 0.86 · ✦',
  },
  {
    chip_id: 'valuate',
    chip_label: 'Valorar las 3 mejores',
    user_message: 'Valorar las 3 mejores',
    copilot_response:
      'Con sus financieros y los múltiplos sectoriales actuales, te doy un **rango indicativo** para cada una. Recuerda: es orientativo, no sustituye un proceso completo.',
    cards: [
      {
        title: 'Kitchen Studio',
        body: '7,8M € – 11,4M € · base 9,3M €',
        meta: 'EV/EBITDA 7.1× – 10.4× · Confidence 0.81 · ✦',
      },
      {
        title: 'Quickads',
        body: '2,8M € – 4,2M € · base 3,4M €',
        meta: 'EV/EBITDA 7.0× – 10.5× · Confidence 0.74 · ✦',
      },
      {
        title: 'Muñoz Comunicación',
        body: '5,0M € – 7,5M € · base 6,2M €',
        meta: 'EV/EBITDA 6.6× – 9.9× · Confidence 0.78 · ✦',
      },
    ],
    citation: 'Fuente: BdE (múltiplos sector) + M&A Intelligence · Confidence 0.77 · ✦',
  },
  {
    chip_id: 'teasers',
    chip_label: 'Generar teasers',
    user_message: 'Generar teasers',
    copilot_response:
      'He preparado **3 teasers anónimos** listos para difundir a tu shortlist de compradores. Mantienen el secreto del nombre pero exponen tamaño, sector, ubicación y narrativa.',
    cards: [
      {
        title: 'Teaser #1 · Estudio digital madrileño',
        body: '5,4M € facturación · 20% EBITDA · Cartera de marcas tier-1.',
        meta: 'Borrador generado · ✦',
      },
      {
        title: 'Teaser #2 · SaaS B2B catalán',
        body: '3,1M € ARR · CAC payback 14m · Crecimiento +38% YoY.',
        meta: 'Borrador generado · ✦',
      },
    ],
    citation: 'Generado a partir de fichas internas · revisión humana recomendada · ✦',
  },
  {
    chip_id: 'signals',
    chip_label: 'Mostrar señales del sector',
    user_message: 'Mostrar señales del sector',
    copilot_response:
      'Tres señales relevantes en tu sector en los **últimos 30 días**. Las he cruzado con la base de oportunidades:',
    cards: [
      {
        title: 'Relevo generacional · ↑18%',
        body: 'Fundadores 55-65 años en cabecera de 4 compañías de tu shortlist.',
        meta: 'Confidence 0.92 · ✦',
      },
      {
        title: 'Consolidación regional · ↑11%',
        body: 'Tres operaciones de buy-and-build registradas en Cataluña.',
        meta: 'Confidence 0.85 · ✦',
      },
      {
        title: 'Captación de capital · estable',
        body: '6 rondas activas en sector software, ticket 1–5M €.',
        meta: 'Confidence 0.79 · ✦',
      },
    ],
    citation: 'Fuente: M&A Intelligence + Investor Intelligence · ✦',
  },
];
