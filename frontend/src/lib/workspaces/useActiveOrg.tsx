'use client';
/**
 * useActiveOrg — single source of truth for the org the user is currently
 * acting on. Persists to localStorage as `arroba.active_org_id`. Notifies
 * other components via a CustomEvent so they can refilter without prop
 * drilling.
 *
 * PERF · dedup auth/org fan-out (2026-08-24): this used to be a plain hook
 * that each caller invoked independently, each opening its own
 * `useSWR('/api/organizations/mine', …)` subscription. SWR dedupes
 * identical requests fired within `dedupingInterval` (2s default), but the
 * ~6 call sites (CopilotProvider, RecentWorkspacesPanel, CompanyHeader,
 * OrgSwitcher, several pages) don't all mount in the same tick — e.g.
 * `CompanyHeader` only mounts once the ficha aggregate resolves, seconds
 * later — so each late mount fired a fresh network request outside the
 * dedup window. Now `ActiveOrgProvider` (mounted once at the root layout)
 * owns the single SWR fetch, and `useActiveOrg()` just reads the resulting
 * context — same public API, one request instead of N.
 *
 * Auto-detection:
 *   - If localStorage value is missing or stale (not in user's memberships),
 *     defaults to memberships[0].org_id.
 *   - If memberships is empty, returns null (caller decides what to do).
 */
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import useSWR from 'swr';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/contexts/auth-context';
import type { OrgWithMembership } from '@/lib/api/types';

const STORAGE_KEY = 'arroba.active_org_id';
const EVENT_NAME = 'arroba:active-org-changed';

export interface ActiveOrgState {
  activeOrgId: string | null;
  setActiveOrgId: (orgId: string) => void;
  availableOrgs: Array<{ org_id: string; legal_name?: string }>;
}

function readStored(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStored(value: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, value);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore quota / private mode
  }
}

const ActiveOrgContext = createContext<ActiveOrgState | undefined>(undefined);

export function ActiveOrgProvider({ children }: { children: ReactNode }) {
  const { memberships, isAuthenticated } = useAuth();
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(null);

  // Fetch orgs with legal_name lazily (memberships only has IDs). SWR caches
  // it for us; revalidates on focus. Single subscription for the whole app.
  const { data: orgsWithName } = useSWR<OrgWithMembership[]>(
    isAuthenticated && memberships.length > 0 ? '/api/organizations/mine' : null,
    () => apiClient.organizations.mine(),
  );

  const availableOrgs = useMemo(() => {
    if (orgsWithName && orgsWithName.length > 0) {
      return orgsWithName.map((o) => ({ org_id: o.org.org_id, legal_name: o.org.legal_name }));
    }
    return memberships.map((m) => ({ org_id: m.org_id }));
  }, [memberships, orgsWithName]);

  // Hydrate on memberships change.
  useEffect(() => {
    const stored = readStored();
    const orgIds = availableOrgs.map((m) => m.org_id);
    if (stored && orgIds.includes(stored)) {
      setActiveOrgIdState(stored);
      return;
    }
    const fallback = orgIds[0] ?? null;
    setActiveOrgIdState(fallback);
    writeStored(fallback);
  }, [availableOrgs]);

  // Listen for cross-component active-org changes.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    function onChange(e: Event) {
      const detail = (e as CustomEvent<{ orgId: string | null }>).detail;
      if (detail) setActiveOrgIdState(detail.orgId);
    }
    window.addEventListener(EVENT_NAME, onChange);
    return () => window.removeEventListener(EVENT_NAME, onChange);
  }, []);

  const setActiveOrgId = useCallback((orgId: string) => {
    writeStored(orgId);
    setActiveOrgIdState(orgId);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(EVENT_NAME, { detail: { orgId } }),
      );
    }
  }, []);

  const value = useMemo<ActiveOrgState>(
    () => ({ activeOrgId, setActiveOrgId, availableOrgs }),
    [activeOrgId, setActiveOrgId, availableOrgs],
  );

  return <ActiveOrgContext.Provider value={value}>{children}</ActiveOrgContext.Provider>;
}

export function useActiveOrg(): ActiveOrgState {
  const ctx = useContext(ActiveOrgContext);
  if (!ctx) throw new Error('useActiveOrg must be used within <ActiveOrgProvider>');
  return ctx;
}

export const ACTIVE_ORG_EVENT = EVENT_NAME;
export const ACTIVE_ORG_STORAGE_KEY = STORAGE_KEY;
