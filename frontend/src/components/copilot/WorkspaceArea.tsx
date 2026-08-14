'use client';
import {
  CompanyCardBlock,
  CompanyCardsGridBlock,
  EmptyStateBlock,
  ErrorBlock,
  HeroBlock,
  LoadingBlock,
  MetricsBlock,
  NarrativeBlock,
  SearchResultsBlock,
  ValuationBlock,
  type Metric,
} from '@/components/blocks';
import { useRouter } from 'next/navigation';
import type { BlockSpec, Workspace } from '@/lib/orchestrator';
import { useCopilot } from './CopilotProvider';

/**
 * Block Orchestrator renderer. Single switch by `block.type`. Lives inside
 * the Copilot dock's expanded panel (transient workspace, no URL until E1.5).
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
  const { send, retry, lastQuery } = useCopilot();
  // HARDENING-REQ001b · router para navegar al ficha desde search results.
  const router = useRouter();

  switch (block.type) {
    case 'search_results':
      return (
        <SearchResultsBlock
          query={block.props.query}
          total={block.props.total}
          results={block.props.results}
          onPick={(item) => {
            if (item.cif) router.push(`/empresa-f01/${item.cif}`);
          }}
        />
      );
    case 'empty_state':
      return (
        <div
          className="rounded-xl border border-dashed border-border-strong bg-surface p-5"
          data-testid={`block-empty-state-${block.id}`}
        >
          <h4 className="font-display font-semibold text-text mb-1">
            {block.props.title}
          </h4>
          {block.props.description && (
            <p className="text-sm text-text-muted leading-relaxed">
              {block.props.description}
            </p>
          )}
          {block.props.suggestions && block.props.suggestions.length > 0 && (
            <div
              className="mt-3 flex flex-wrap gap-2"
              data-testid="copilot-workspace-empty-suggestions"
            >
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
    case 'error': {
      const canRetry = Boolean(block.props.retry_intent && lastQuery);
      return (
        <ErrorBlock
          title={block.props.title}
          message={block.props.message ?? undefined}
          onRetry={canRetry ? () => void retry() : undefined}
        />
      );
    }
    case 'loading':
      return <LoadingBlock />;
    case 'hero':
      return (
        <HeroBlock
          variant="banner"
          tone="light"
          eyebrow={block.props.eyebrow ?? undefined}
          title={block.props.title}
          subtitle={block.props.subtitle ?? undefined}
          testId={`block-hero-${block.id}`}
        />
      );
    case 'metrics': {
      const metrics: Metric[] = block.props.items.map((it, i) => ({
        id: `m-${i}`,
        label: it.label,
        value: it.value,
        sub: it.hint ?? undefined,
        trend: it.trend ?? undefined,
      }));
      return (
        <MetricsBlock
          mode="configurable"
          metrics={metrics}
          title={block.props.title ?? undefined}
          testId={`block-metrics-${block.id}`}
        />
      );
    }
    case 'company_card':
      return (
        <CompanyCardBlock
          masterCompanyId={block.props.master_company_id}
          name={block.props.name}
          legalName={block.props.legal_name ?? undefined}
          cif={block.props.cif ?? undefined}
          sector={block.props.sector ?? undefined}
          region={block.props.region ?? undefined}
          country={block.props.country ?? undefined}
          revenue={block.props.revenue ?? undefined}
          ebitda={block.props.ebitda ?? undefined}
          employees={block.props.employees ?? undefined}
          fiscalYear={block.props.fiscal_year ?? undefined}
          confidence={block.props.confidence ?? undefined}
        />
      );
    case 'company_cards_grid':
      return (
        <CompanyCardsGridBlock
          title={block.props.title ?? undefined}
          subtype={block.props.subtype}
          items={block.props.items.map((it) => ({
            masterCompanyId: it.master_company_id,
            name: it.name,
            sector: it.sector ?? undefined,
            region: it.region ?? undefined,
            score: it.score,
            reason: it.reason ?? undefined,
          }))}
        />
      );
    case 'valuation':
      return (
        <ValuationBlock
          companyName={block.props.company_name}
          sector={block.props.sector ?? undefined}
          method={block.props.method}
          multipleLabel={block.props.multiple_label}
          multipleValue={block.props.multiple_value}
          centralValue={block.props.central_value}
          lowValue={block.props.low_value}
          highValue={block.props.high_value}
          currency={block.props.currency}
          inputs={block.props.inputs}
          disclaimer={block.props.disclaimer}
        />
      );
    case 'narrative':
      return (
        <NarrativeBlock
          title={block.props.title ?? undefined}
          summary={block.props.summary ?? undefined}
          keyPoints={block.props.key_points}
          risks={block.props.risks}
          opportunities={block.props.opportunities}
          citations={block.props.citations}
        />
      );
    default: {
      const _exhaustive: never = block;
      return _exhaustive;
    }
  }
}

// Re-export so callers don't need to know about the internal modules.
export { EmptyStateBlock };
