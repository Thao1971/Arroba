/**
 * Orchestrator entry point.
 *
 *   text  →  routeIntent  →  executeSkill  →  Workspace
 *
 * The orchestrator is responsible for:
 *  - parsing the user input (slash commands vs free text)
 *  - dispatching the right Skill
 *  - shaping the response into a Workspace the UI can render
 *  - surfacing errors as ErrorBlock workspaces (never throws)
 */
import { apiClient, ApiError } from '@/lib/api/client';
import { routeIntent } from './route-intent';
import type {
  BlockSpec,
  Intent,
  SkillContext,
  Workspace,
} from './types';

export type { BlockSpec, Workspace, SkillContext, Intent };
export { routeIntent };
export { nextBestActions } from './next-best-actions';
export type { SuggestionChip } from './next-best-actions';

const HELP_TEXT =
  'Escribe lo que necesites: una empresa, un sector, un CIF, una ubicación. ' +
  'Arroba Copilot localiza la información y la materializa aquí. ' +
  'Atajos disponibles: /clear (limpiar conversación) · /help (esta ayuda).';

function makeErrorWorkspace(message: string, code?: string): Workspace {
  return {
    workspace_id: 'wsp_' + Date.now().toString(36),
    intent: 'error',
    blocks: [
      {
        type: 'error',
        id: 'blk_err_' + Date.now().toString(36),
        props: {
          title: 'No hemos podido completar tu petición',
          message,
          code,
          retry_intent: 'search',
        },
      } as BlockSpec,
    ],
  };
}

function makeHelpWorkspace(): Workspace {
  return {
    workspace_id: 'wsp_help_' + Date.now().toString(36),
    intent: 'help',
    blocks: [
      {
        type: 'empty_state',
        id: 'blk_help_' + Date.now().toString(36),
        props: {
          title: 'Ayuda rápida',
          description: HELP_TEXT,
          suggestions: ['Kitchen Studio', 'Software en Madrid', 'Hoteles termales'],
        },
      } as BlockSpec,
    ],
  };
}

export interface OrchestratorResult {
  intent: Intent;
  workspace: Workspace | null; // null for `clear` — UI clears history
  assistantMessage: string | null; // human-readable reply for the thread
}

export async function dispatch(
  input: string,
  context: SkillContext
): Promise<OrchestratorResult> {
  const intent = routeIntent(input);

  if (intent.kind === 'clear') {
    return { intent, workspace: null, assistantMessage: 'Conversación limpiada.' };
  }
  if (intent.kind === 'help') {
    return {
      intent,
      workspace: makeHelpWorkspace(),
      assistantMessage: 'Esto es lo que puedo hacer ahora mismo:',
    };
  }
  if (!intent.query) {
    return {
      intent,
      workspace: makeErrorWorkspace('La consulta está vacía.', 'empty_query'),
      assistantMessage: 'Cuéntame algo más, por favor.',
    };
  }

  try {
    const res = await apiClient.copilot.search({ query: intent.query, context });
    return {
      intent,
      workspace: res.workspace,
      assistantMessage: assistantSummaryFor(res.workspace),
    };
  } catch (err) {
    const isApi = err instanceof ApiError;
    return {
      intent,
      workspace: makeErrorWorkspace(
        isApi && err.detail ? err.detail : 'No hemos podido conectar con el Copilot.',
        isApi ? err.code : 'network_error'
      ),
      assistantMessage: 'No he podido procesar la búsqueda. Inténtalo de nuevo.',
    };
  }
}

function assistantSummaryFor(ws: Workspace): string {
  const first = ws.blocks[0];
  if (!first) return 'Listo.';
  if (first.type === 'search_results') {
    const t = first.props.total;
    return t === 1
      ? 'He encontrado 1 empresa que encaja. Te la muestro abajo.'
      : `He encontrado ${t} empresas que encajan. Te muestro las primeras abajo.`;
  }
  if (first.type === 'empty_state') {
    return 'No he encontrado coincidencias directas. Prueba con una de estas sugerencias:';
  }
  return 'Listo.';
}
