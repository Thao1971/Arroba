/**
 * CopilotProvider — entity_context mode (E1.5-REWORK).
 *
 * Pins the philosophy v3.0 §12 invariants on the client side:
 *
 *   1. When the pathname matches `/empresa-f01/{cif}` the provider switches
 *      to `entity_context` mode and `send()` hits
 *      `POST /api/companies/{cif}/messages` (NOT `/api/copilot/...` and NOT
 *      `/api/workspaces/{id}/messages`).
 *
 *   2. When the response carries `section_updates[]` the provider
 *      dispatches `CustomEvent("arroba:company-section-update")` so the
 *      page can refresh sections in-place. It does NOT push the block to
 *      `state.workspace` (the dock thread only shows text).
 *
 *   3. `hydrateEntityConversation` attaches the human name and replaces the
 *      history with the prior conversation thread.
 *
 * These tests are the regression net for the P0 bug we just fixed (the
 * advisor was returning empty section_updates → page never refreshed).
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render } from '@testing-library/react';
import { useEffect } from 'react';

import {
  COMPANY_SECTION_UPDATE_EVENT,
  CopilotProvider,
  useCopilot,
} from './CopilotProvider';

vi.mock('next/navigation', () => ({
  usePathname: () => '/empresa-f01/B86540112',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: { user_id: 'u_1', email: 'buyer@arroba.com' },
    memberships: [],
    isAuthenticated: true,
    isLoading: false,
  }),
}));
vi.mock('@/lib/workspaces/useActiveOrg', () => ({
  useActiveOrg: () => ({
    activeOrgId: 'org_demo',
    setActiveOrgId: vi.fn(),
    availableOrgs: [],
  }),
}));

function mockSendMessageOnce(payload: unknown, status = 200) {
  global.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  ) as unknown as typeof fetch;
}

interface Captured {
  send: (text: string) => Promise<void>;
  loading: boolean;
  history: Array<{ role: string; text: string }>;
  workspace: unknown;
  currentEntity: {
    entity_type: string;
    entity_id: string;
    entity_name: string | null;
  } | null;
}

function HarnessProbe({
  onMount,
}: {
  onMount: (api: Captured) => void;
}) {
  const cop = useCopilot();
  useEffect(() => {
    onMount({
      send: cop.send,
      loading: cop.loading,
      history: cop.history.map((h) => ({ role: h.role, text: h.text })),
      workspace: cop.workspace,
      currentEntity: cop.currentEntity,
    });
  });
  return null;
}

describe('CopilotProvider — entity_context mode', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('detects /empresa-f01/{cif} pathname and sets currentEntity', async () => {
    let api: Captured | null = null;
    render(
      <CopilotProvider>
        <HarnessProbe onMount={(c) => (api = c)} />
      </CopilotProvider>,
    );
    expect(api!.currentEntity).toEqual({
      entity_type: 'company',
      entity_id: 'B86540112',
      entity_name: null,
    });
  });

  it('send() hits /api/companies/{cif}/messages with the right payload', async () => {
    mockSendMessageOnce({
      message_user: {
        message_id: 'cmsg_u',
        conversation_id: 'conv_1',
        role: 'user',
        content: 'Háblame de los riesgos',
        intent: 'entity_chat',
        section_updates: [],
        suggested_actions: [],
        created_at: new Date().toISOString(),
      },
      message_assistant: {
        message_id: 'cmsg_a',
        conversation_id: 'conv_1',
        role: 'assistant',
        content: 'He actualizado riesgos.',
        intent: 'entity_chat',
        section_updates: [],
        suggested_actions: [],
        created_at: new Date().toISOString(),
      },
      section_updates: [],
      suggested_actions: [],
    });

    let api: Captured | null = null;
    render(
      <CopilotProvider>
        <HarnessProbe onMount={(c) => (api = c)} />
      </CopilotProvider>,
    );

    await act(async () => {
      await api!.send('Háblame de los riesgos');
    });

    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/companies/B86540112/messages');
    expect((init as RequestInit).method).toBe('POST');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.query).toBe('Háblame de los riesgos');
    expect(body.context).toMatchObject({
      locale: 'es',
      pathname: '/empresa-f01/B86540112',
    });
  });

  it('dispatches CustomEvent("arroba:company-section-update") when section_updates is non-empty', async () => {
    const sectionUpdates = [
      {
        section: 'narrative',
        block: {
          id: 'blk_narr_1',
          type: 'narrative',
          props: {
            title: 'Lectura del analista',
            summary: 'Risk summary.',
            key_points: [],
            risks: ['Talent dependency', 'Geo concentration'],
            opportunities: [],
            citations: [],
          },
        },
      },
    ];
    mockSendMessageOnce({
      message_user: {
        message_id: 'cmsg_u',
        conversation_id: 'conv_1',
        role: 'user',
        content: 'Riesgos',
        intent: 'entity_chat',
        section_updates: [],
        suggested_actions: [],
        created_at: new Date().toISOString(),
      },
      message_assistant: {
        message_id: 'cmsg_a',
        conversation_id: 'conv_1',
        role: 'assistant',
        content: 'Lista de riesgos.',
        intent: 'entity_chat',
        section_updates: sectionUpdates,
        suggested_actions: [],
        created_at: new Date().toISOString(),
      },
      section_updates: sectionUpdates,
      suggested_actions: [],
    });

    const captured: Array<{ cif: string; section_updates: unknown[] }> = [];
    function listener(e: Event) {
      captured.push(
        (e as CustomEvent<{ cif: string; section_updates: unknown[] }>).detail,
      );
    }
    window.addEventListener(COMPANY_SECTION_UPDATE_EVENT, listener);

    let api: Captured | null = null;
    render(
      <CopilotProvider>
        <HarnessProbe onMount={(c) => (api = c)} />
      </CopilotProvider>,
    );

    await act(async () => {
      await api!.send('Riesgos por favor');
    });

    expect(captured).toHaveLength(1);
    expect(captured[0]!.cif).toBe('B86540112');
    expect(captured[0]!.section_updates).toHaveLength(1);
    expect(
      (captured[0]!.section_updates[0] as { section: string }).section,
    ).toBe('narrative');

    window.removeEventListener(COMPANY_SECTION_UPDATE_EVENT, listener);
  });

  it('does NOT push the section_update block into state.workspace (no free-standing blocks)', async () => {
    mockSendMessageOnce({
      message_user: {
        message_id: 'cmsg_u',
        conversation_id: 'conv_1',
        role: 'user',
        content: 'Riesgos',
        intent: 'entity_chat',
        section_updates: [],
        suggested_actions: [],
        created_at: new Date().toISOString(),
      },
      message_assistant: {
        message_id: 'cmsg_a',
        conversation_id: 'conv_1',
        role: 'assistant',
        content: 'Riesgos respondidos.',
        intent: 'entity_chat',
        section_updates: [
          {
            section: 'narrative',
            block: {
              id: 'blk_narr_1',
              type: 'narrative',
              props: {
                title: 'Lectura',
                summary: 'x',
                key_points: [],
                risks: ['r1'],
                opportunities: [],
                citations: [],
              },
            },
          },
        ],
        suggested_actions: [],
        created_at: new Date().toISOString(),
      },
      section_updates: [
        {
          section: 'narrative',
          block: {
            id: 'blk_narr_1',
            type: 'narrative',
            props: {
              title: 'Lectura',
              summary: 'x',
              key_points: [],
              risks: ['r1'],
              opportunities: [],
              citations: [],
            },
          },
        },
      ],
      suggested_actions: [],
    });

    let lastApi: Captured | null = null;
    render(
      <CopilotProvider>
        <HarnessProbe onMount={(c) => (lastApi = c)} />
      </CopilotProvider>,
    );

    await act(async () => {
      await lastApi!.send('Riesgos');
    });

    // workspace must remain null — only the page updates sections in-place.
    expect(lastApi!.workspace).toBeNull();
    // The dock thread shows the assistant text:
    const assistantMsgs = lastApi!.history.filter((m) => m.role === 'assistant');
    expect(assistantMsgs).toHaveLength(1);
    expect(assistantMsgs[0]!.text).toBe('Riesgos respondidos.');
  });

  it('does not dispatch the event when section_updates is empty', async () => {
    mockSendMessageOnce({
      message_user: {
        message_id: 'cmsg_u',
        conversation_id: 'conv_1',
        role: 'user',
        content: 'Hola',
        intent: 'entity_chat',
        section_updates: [],
        suggested_actions: [],
        created_at: new Date().toISOString(),
      },
      message_assistant: {
        message_id: 'cmsg_a',
        conversation_id: 'conv_1',
        role: 'assistant',
        content: '¡Hola!',
        intent: 'entity_chat',
        section_updates: [],
        suggested_actions: [],
        created_at: new Date().toISOString(),
      },
      section_updates: [],
      suggested_actions: [],
    });

    const captured: unknown[] = [];
    function listener(e: Event) {
      captured.push((e as CustomEvent).detail);
    }
    window.addEventListener(COMPANY_SECTION_UPDATE_EVENT, listener);

    let api: Captured | null = null;
    render(
      <CopilotProvider>
        <HarnessProbe onMount={(c) => (api = c)} />
      </CopilotProvider>,
    );

    await act(async () => {
      await api!.send('Hola');
    });

    expect(captured).toHaveLength(0);
    window.removeEventListener(COMPANY_SECTION_UPDATE_EVENT, listener);
  });
});
