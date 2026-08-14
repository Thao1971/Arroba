'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Archive, ChevronLeft, Loader2, Pencil, Share2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient, ApiError } from '@/lib/api/client';
import { useCopilot } from '@/components/copilot/CopilotProvider';
import { useActiveOrg } from '@/lib/workspaces/useActiveOrg';
import { WorkspaceArea } from '@/components/copilot/WorkspaceArea';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/cn';
import type {
  WorkspaceBlock,
  WorkspaceDetail,
  WorkspaceMessage,
} from '@/lib/workspaces/types';
import type { BlockSpec, Workspace } from '@/lib/orchestrator';

/**
 * Minimal in-page notifier. Renders a transient banner at the top of the
 * viewport for ~3 seconds. We avoid `sonner` to keep deps small for E1.5; a
 * proper toast system will arrive with the next DS bump.
 */
type NotifyKind = 'success' | 'warn' | 'error';
function notify(kind: NotifyKind, message: string): void {
  if (typeof window === 'undefined') return;
  const id = 'arroba-toast-host';
  let host = document.getElementById(id);
  if (!host) {
    host = document.createElement('div');
    host.id = id;
    host.setAttribute('data-testid', 'workspace-toast-host');
    host.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[1200] flex flex-col gap-2 items-center pointer-events-none';
    document.body.appendChild(host);
  }
  const node = document.createElement('div');
  const palette =
    kind === 'success'
      ? 'bg-success/95 text-white'
      : kind === 'warn'
        ? 'bg-warning/95 text-black'
        : 'bg-danger/95 text-white';
  node.className = `${palette} rounded-full px-4 py-2 text-sm font-medium shadow-lg pointer-events-auto`;
  node.setAttribute('data-testid', `workspace-toast-${kind}`);
  node.textContent = message;
  host.appendChild(node);
  window.setTimeout(() => {
    node.style.opacity = '0';
    node.style.transition = 'opacity 200ms';
    window.setTimeout(() => node.remove(), 220);
  }, 3000);
}

const TYPE_LABEL: Record<string, string> = {
  analyze: 'Análisis',
  value: 'Valoración',
  recommend: 'Recomendaciones',
  search: 'Búsqueda',
  mixed: 'Mixto',
};

/**
 * Persisted workspace view. Loads `/api/workspaces/{id}`, hydrates the dock so
 * the Composer extends THIS workspace (anchored mode), and renders the
 * messages + blocks in chronological order.
 */
export default function WorkspaceDetailPage() {
  const params = useParams<{ workspace_id: string }>();
  const router = useRouter();
  const workspaceId = params.workspace_id;
  const { user } = useAuth();
  const { activeOrgId, setActiveOrgId, availableOrgs } = useActiveOrg();
  const { hydratePersistent, openDock } = useCopilot();

  const { data, error, isLoading, mutate } = useSWR<WorkspaceDetail>(
    workspaceId ? `/api/workspaces/${workspaceId}` : null,
    () => apiClient.workspaces.detail(workspaceId),
  );

  // Cross-org guard: if the workspace belongs to an org the user is NOT
  // currently acting on, redirect to /es/historial with a toast.
  useEffect(() => {
    if (!data || !activeOrgId) return;
    const ws = data.workspace;
    if (ws.organization_id !== activeOrgId) {
      const userIsInOrg = availableOrgs.some((o) => o.org_id === ws.organization_id);
      if (userIsInOrg) {
        setActiveOrgId(ws.organization_id);
        return;
      }
      notify('warn', 'Has cambiado de organización. Este workspace pertenece a otra a la que no tienes acceso.');
      router.replace('/historial');
    }
  }, [data, activeOrgId, availableOrgs, setActiveOrgId, router]);

  // Once we have the data, hydrate the dock thread + open it so the user can
  // keep going.
  useEffect(() => {
    if (!data) return;
    const workspace = buildLiveWorkspace(data);
    const messages = data.messages.map((m) => ({
      id: m.message_id,
      role: m.role === 'system' ? ('assistant' as const) : m.role,
      text: m.content,
      ts: Date.parse(m.created_at),
      workspace: m.role === 'assistant' ? workspace : null,
    }));
    hydratePersistent(messages, workspace);
    openDock();
  }, [data, hydratePersistent, openDock]);

  if (error instanceof ApiError && error.status === 404) {
    return (
      <NotFoundOrForbidden testId="workspace-detail-404" message="Este workspace no existe." />
    );
  }
  if (error instanceof ApiError && error.status === 403) {
    return (
      <NotFoundOrForbidden testId="workspace-detail-403" message="No tienes acceso a este workspace." />
    );
  }

  if (isLoading || !data) {
    return (
      <div
        data-testid="workspace-detail-loading"
        className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center text-text-muted gap-2"
      >
        <Loader2 size={16} className="animate-spin" />
        Cargando workspace…
      </div>
    );
  }

  const ws = data.workspace;
  const isOwner = ws.created_by === user?.user_id;
  const workspace = buildLiveWorkspace(data);

  return (
    <div
      data-testid="workspace-detail"
      data-workspace-id={ws.workspace_id}
      className="max-w-3xl mx-auto px-6 py-8"
    >
      <Link
        href="/historial"
        className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text mb-4"
        data-testid="workspace-detail-back"
      >
        <ChevronLeft size={12} /> Volver al historial
      </Link>

      <WorkspaceHeader
        workspaceId={ws.workspace_id}
        title={ws.title}
        type={ws.workspace_type}
        visibility={ws.visibility}
        updatedAt={ws.updated_at}
        isOwner={isOwner}
        onUpdated={() => mutate()}
      />

      <CompanyBackrefBanner blocks={data.blocks} />

      <div className="mt-6 space-y-6" data-testid="workspace-detail-thread">
        <ThreadView messages={data.messages} blocks={data.blocks} />
      </div>

      <p className="mt-8 text-[11px] text-text-subtle text-center">
        Sigue trabajando desde el Copilot ↘
      </p>

      {/* Re-render the live (anchored) workspace area is handled by the dock. */}
      <PreserveLiveWorkspace workspace={workspace} />
    </div>
  );
}

// The live workspace lives in the dock; this component is just a marker for
// tests + accessibility.
function PreserveLiveWorkspace({ workspace }: { workspace: Workspace }) {
  return (
    <span data-testid="workspace-detail-live" data-blocks={workspace.blocks.length} className="sr-only">
      Workspace en el Copilot abierto.
    </span>
  );
}

function ThreadView({ messages, blocks }: { messages: WorkspaceMessage[]; blocks: WorkspaceBlock[] }) {
  // Group blocks by message_id so we render each turn's blocks right under it.
  const blocksByMessage = useMemo(() => {
    const map = new Map<string, WorkspaceBlock[]>();
    for (const b of blocks) {
      if (!b.message_id) continue;
      const arr = map.get(b.message_id) ?? [];
      arr.push(b);
      map.set(b.message_id, arr);
    }
    return map;
  }, [blocks]);

  const orphanBlocks = blocks.filter((b) => !b.message_id);

  return (
    <div className="space-y-5">
      {orphanBlocks.length > 0 && (
        <RenderedBlocks blocks={orphanBlocks} />
      )}
      {messages.map((m) => (
        <div key={m.message_id}>
          <MessageRow message={m} />
          {blocksByMessage.has(m.message_id) && (
            <div className="mt-3">
              <RenderedBlocks blocks={blocksByMessage.get(m.message_id) ?? []} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function RenderedBlocks({ blocks }: { blocks: WorkspaceBlock[] }) {
  const fakeWorkspace: Workspace = {
    workspace_id: 'inline',
    intent: 'mixed',
    blocks: blocks.map((b) => ({
      type: b.type,
      id: b.block_id,
      props: b.props,
    })) as BlockSpec[],
  };
  return <WorkspaceArea workspace={fakeWorkspace} />;
}

function MessageRow({ message }: { message: WorkspaceMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end" data-testid={`ws-msg-user-${message.message_id}`}>
        <div className="max-w-[78%] bg-primary text-white text-sm font-medium px-4 py-2 rounded-[15px_15px_5px_15px]">
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 items-start" data-testid={`ws-msg-assistant-${message.message_id}`}>
      <div
        className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5"
        style={{ background: 'linear-gradient(135deg,#0C0C0E,#2E2E2C)' }}
        aria-hidden
      />
      <div className="flex-1 min-w-0 text-sm text-text leading-relaxed">{message.content}</div>
    </div>
  );
}

function buildLiveWorkspace(detail: WorkspaceDetail): Workspace {
  return {
    workspace_id: detail.workspace.workspace_id,
    intent: detail.workspace.workspace_type,
    blocks: detail.blocks.map((b) => ({
      type: b.type,
      id: b.block_id,
      props: b.props,
    })) as BlockSpec[],
  };
}

function NotFoundOrForbidden({ testId, message }: { testId: string; message: string }) {
  return (
    <div
      data-testid={testId}
      className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center gap-3 px-6 text-center"
    >
      <h2 className="font-display font-semibold text-xl text-text">{message}</h2>
      <Link
        href="/historial"
        className="text-sm text-primary font-semibold"
      >
        Ver tu historial →
      </Link>
    </div>
  );
}

/**
 * Workspace header — title (inline editable), type badge, visibility badge,
 * share toggle, archive button.
 */
function WorkspaceHeader({
  workspaceId,
  title,
  type,
  visibility,
  updatedAt,
  isOwner,
  onUpdated,
}: {
  workspaceId: string;
  title: string;
  type: string;
  visibility: string;
  updatedAt: string;
  isOwner: boolean;
  onUpdated: () => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [pending, setPending] = useState(false);

  useEffect(() => setDraft(title), [title]);

  async function saveTitle() {
    if (!draft.trim() || draft === title) {
      setEditing(false);
      return;
    }
    setPending(true);
    try {
      await apiClient.workspaces.patchTitle(workspaceId, draft.trim());
      onUpdated();
    } catch {
      notify('error', 'No hemos podido renombrar el workspace.');
    } finally {
      setEditing(false);
      setPending(false);
    }
  }

  async function toggleShare() {
    setPending(true);
    try {
      const next = visibility === 'private' ? 'team' : 'private';
      await apiClient.workspaces.share(workspaceId, { visibility: next });
      onUpdated();
      notify('success', next === 'team' ? 'Workspace compartido con tu equipo.' : 'Workspace ahora privado.');
    } catch {
      notify('error', 'No hemos podido cambiar la visibilidad.');
    } finally {
      setPending(false);
    }
  }

  async function archive() {
    setPending(true);
    try {
      await apiClient.workspaces.archive(workspaceId);
      notify('success', 'Workspace archivado.');
      router.push('/historial');
    } catch {
      notify('error', 'No hemos podido archivar.');
    } finally {
      setPending(false);
    }
  }

  return (
    <header className="space-y-3" data-testid="workspace-header">
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className={cn(
            'inline-flex items-center px-2 h-5 rounded-full text-[10px] font-mono font-semibold',
            'bg-surface-2 text-text-muted',
          )}
          data-testid="workspace-header-type"
        >
          {TYPE_LABEL[type] ?? type}
        </span>
        <span
          className={cn(
            'inline-flex items-center px-2 h-5 rounded-full text-[10px] font-mono font-semibold',
            visibility === 'private'
              ? 'bg-warning/10 text-warning'
              : 'bg-success/10 text-success',
          )}
          data-testid="workspace-header-visibility"
        >
          {visibility === 'private' ? 'Privado' : 'Equipo'}
        </span>
        <span className="text-[11px] text-text-subtle ml-auto">
          Última actualización: {new Date(updatedAt).toLocaleString('es-ES')}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {editing ? (
          <input
            type="text"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void saveTitle();
              if (e.key === 'Escape') {
                setDraft(title);
                setEditing(false);
              }
            }}
            disabled={pending}
            data-testid="workspace-header-title-input"
            className="flex-1 font-display text-2xl font-semibold text-text bg-transparent border-b border-primary outline-none"
            maxLength={120}
          />
        ) : (
          <h1
            data-testid="workspace-header-title"
            className="font-display text-2xl font-semibold text-text flex-1"
          >
            {title}
          </h1>
        )}
        {isOwner && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            data-testid="workspace-header-edit-title"
            aria-label="Editar título"
            className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-border hover:border-primary hover:text-primary text-text-muted transition-colors"
          >
            <Pencil size={14} strokeWidth={1.6} />
          </button>
        )}
      </div>
      {isOwner && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleShare}
            disabled={pending}
            data-testid="workspace-header-share"
            className={cn(
              'inline-flex items-center gap-1.5 px-3 h-9 rounded-full border text-xs font-semibold transition-colors',
              visibility === 'private'
                ? 'border-border-strong text-text hover:border-primary hover:text-primary'
                : 'border-success text-success hover:bg-success/5',
              pending && 'opacity-60 cursor-progress',
            )}
          >
            <Share2 size={12} strokeWidth={1.8} />
            {visibility === 'private' ? 'Compartir con mi equipo' : 'Hacer privado'}
          </button>
          <button
            type="button"
            onClick={archive}
            disabled={pending}
            data-testid="workspace-header-archive"
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full border border-border text-text-muted hover:text-text hover:border-text-muted text-xs font-semibold"
          >
            <Archive size={12} strokeWidth={1.6} />
            Archivar
          </button>
        </div>
      )}
    </header>
  );
}



/**
 * E1.5-REWORK retrocompat banner: when a persisted workspace can be linked
 * to a known company (via its hero/company_card blocks), render a discreet
 * banner that points users to the new entity-first page.
 *
 * Heuristic — extract the first CIF we find in any of these places:
 *   - a `company_card` block's `props.cif`;
 *   - a `hero` block's `props.subtitle` matching `B12345678`;
 *   - a `metrics` block's title (unlikely but cheap).
 *
 * The hero's title (or the company_card's name) is used as the display
 * name. If none of the above matches, the banner is silently hidden.
 */
function CompanyBackrefBanner({ blocks }: { blocks: WorkspaceBlock[] }) {
  const inferred = useMemo(() => {
    const cifRe = /\b([A-Z]\d{8})\b/;
    let cif: string | null = null;
    let name: string | null = null;
    for (const b of blocks) {
      const p = (b.props || {}) as Record<string, unknown>;
      if (!cif) {
        if (typeof p['cif'] === 'string' && cifRe.test(p['cif'] as string)) {
          cif = (p['cif'] as string).toUpperCase().replace(/\s|-|\./g, '');
        } else if (typeof p['subtitle'] === 'string') {
          const m = (p['subtitle'] as string).toUpperCase().match(cifRe);
          if (m && m[1]) cif = m[1];
        }
      }
      if (!name) {
        if (b.type === 'company_card' && typeof p['name'] === 'string') {
          name = p['name'] as string;
        } else if (b.type === 'hero' && typeof p['title'] === 'string') {
          name = p['title'] as string;
        }
      }
      if (cif && name) break;
    }
    return cif ? { cif, name } : null;
  }, [blocks]);
  if (!inferred) return null;
  return (
    <div
      data-testid="workspace-company-backref-banner"
      className="mt-4 rounded-2xl border border-border bg-primary/5 px-4 py-3 flex items-center gap-3 text-sm"
    >
      <span className="text-text-muted">
        Esta sesión de análisis se basa en
      </span>
      <span className="font-semibold text-text">
        {inferred.name || inferred.cif}
      </span>
      <span className="text-text-muted">·</span>
      <Link
        href={`/empresa-f01/${inferred.cif}`}
        data-testid="workspace-company-backref-link"
        className="ml-auto text-primary font-semibold hover:underline"
      >
        Abrir ficha →
      </Link>
    </div>
  );
}
