'use client';
import {
  EmptyStateBlock,
  ErrorBlock,
  LoadingBlock,
  SearchResultsBlock,
} from '@/components/blocks';
import type { BlockSpec, Workspace } from '@/lib/orchestrator';
import { useCopilot } from './CopilotProvider';

/**
 * Block Orchestrator renderer. Single switch by `block.type`. Lives inside
 * the Copilot dock's expanded panel (transient workspace, no URL).
 *
 * Adding new block types in the future = adding one case here + one block
 * primitive in `components/blocks/`. The rest of the pipeline (transport,
 * provider, thread) stays untouched.
 */
export function WorkspaceArea({ workspace }: { workspace: Workspace }) {
  return (
    <div
      className="space-y-3"
      data-testid="copilot-workspace"
      data-workspace-id={workspace.workspace_id}
    >
      {workspace.blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </div>
  );
}

function BlockRenderer({ block }: { block: BlockSpec }) {
  const { send } = useCopilot();

  switch (block.type) {
    case 'search_results':
      return (
        <SearchResultsBlock
          query={block.props.query}
          total={block.props.total}
          results={block.props.results}
        />
      );
    case 'empty_state':
      return (
        <div className="rounded-xl border border-dashed border-border-strong bg-surface p-5">
          <h4 className="font-display font-semibold text-text mb-1">{block.props.title}</h4>
          {block.props.description && (
            <p className="text-sm text-text-muted leading-relaxed">{block.props.description}</p>
          )}
          {block.props.suggestions && block.props.suggestions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2" data-testid="copilot-workspace-empty-suggestions">
              {block.props.suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => void send(s)}
                  data-testid={`copilot-workspace-empty-suggestion-${i}`}
                  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full border border-border-strong bg-surface text-text text-xs font-medium hover:border-primary hover:text-primary transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    case 'error':
      return (
        <ErrorBlock
          title={block.props.title}
          message={block.props.message ?? undefined}
          onRetry={
            block.props.retry_intent === 'search'
              ? () => {
                  // best-effort retry — replay the last user query is handled at provider
                  // level. Here we just nudge the user.
                  void send('/help');
                }
              : undefined
          }
        />
      );
    case 'loading':
      return <LoadingBlock />;
    default: {
      const _exhaustive: never = block;
      return _exhaustive;
    }
  }
}

// Re-export so callers don't need to know about the internal modules.
export { EmptyStateBlock };
