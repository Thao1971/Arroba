/**
 * Orchestrator entry point.
 *
 *   text  →  routeIntent  →  executeSkill  →  Workspace
 *
 * Skills available in E1.4: search, analyze, value, recommend.
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
  'Pídeme: analizar una empresa, valorarla o recomendarte similares. ' +
  'Ejemplo: «analiza Kitchen Studio», «valora Grupo Olmedo», «empresas en alimentación». ' +
  'Atajos: /clear (limpiar conversación) · /help (esta ayuda).';

function makeErrorWorkspace(
  message: string,
  code: string | undefined,
  retry: string,
): Workspace {
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
          retry_intent: retry,
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
          suggestions: [
            'Analiza Kitchen Studio',
            'Valora Grupo Olmedo Hoteles',
            'Empresas en software',
          ],
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
  context: SkillContext,
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
      workspace: makeErrorWorkspace('La consulta está vacía.', 'empty_query', 'search'),
      assistantMessage: 'Cuéntame algo más, por favor.',
    };
  }

  try {
    let workspace: Workspace;
    if (intent.kind === 'analyze') {
      const res = await apiClient.copilot.analyze({ query: intent.query, context });
      workspace = res.workspace;
    } else if (intent.kind === 'value') {
      const res = await apiClient.copilot.value({ query: intent.query, context });
      workspace = res.workspace;
    } else if (intent.kind === 'recommend') {
      const res = await apiClient.copilot.recommend({ query: intent.query, context });
      workspace = res.workspace;
    } else {
      const res = await apiClient.copilot.search({ query: intent.query, context });
      workspace = res.workspace;
    }
    return {
      intent,
      workspace,
      assistantMessage: assistantSummaryFor(intent.kind, workspace),
    };
  } catch (err) {
    const isApi = err instanceof ApiError;
    return {
      intent,
      workspace: makeErrorWorkspace(
        isApi && err.detail ? err.detail : 'No hemos podido conectar con el Copilot.',
        isApi ? err.code : 'network_error',
        intent.kind,
      ),
      assistantMessage: 'No he podido procesar la petición. Inténtalo de nuevo.',
    };
  }
}

function assistantSummaryFor(
  kind: 'search' | 'analyze' | 'value' | 'recommend',
  ws: Workspace,
): string {
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
  if (first.type === 'hero') {
    if (kind === 'analyze') return 'He preparado el análisis de la empresa. Aquí abajo.';
    if (kind === 'value') return 'Aquí tienes la valoración indicativa.';
    if (kind === 'recommend') return 'Estas son mis recomendaciones.';
  }
  return 'Listo.';
}
