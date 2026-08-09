'use client';
import { createContext, ReactNode, useCallback, useContext, useEffect } from 'react';
import useSWR from 'swr';
import { ApiError, apiClient, swrFetcher } from '@/lib/api/client';
import type {
  LoginPayload,
  MeResponse,
  RegisterPayload,
} from '@/lib/api/types';

interface AuthContextValue {
  user: MeResponse['user'] | null;
  memberships: MeResponse['memberships'];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Race-condition guard: when the browser is on /auth/callback with a
 * `#session_id=…` fragment, SWR must NOT fetch /api/auth/me until the
 * callback page has exchanged the session_id (server cookie not set yet).
 */
function isOnOAuthCallback(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hash.includes('session_id=');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const skip = isOnOAuthCallback();
  const { data, error, isLoading, mutate } = useSWR<MeResponse, ApiError>(
    skip ? null : '/api/auth/me',
    swrFetcher,
    {
      shouldRetryOnError: (e) => !(e instanceof ApiError && e.status === 401),
      revalidateOnFocus: true,
      dedupingInterval: 2_000,
    }
  );

  // SWR exposes `error` but `data` stays undefined on 401 — normalise to null.
  const user = data?.user ?? null;
  const memberships = data?.memberships ?? [];
  const isAuthenticated = !!user;

  const login = useCallback<AuthContextValue['login']>(async (payload) => {
    await apiClient.auth.login(payload);
    await mutate();
  }, [mutate]);

  const register = useCallback<AuthContextValue['register']>(async (payload) => {
    await apiClient.auth.register(payload);
    await mutate();
  }, [mutate]);

  const logout = useCallback(async () => {
    try {
      await apiClient.auth.logout();
    } finally {
      await mutate(undefined, { revalidate: false });
    }
  }, [mutate]);

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  // Silence the 401 error — it's not really an error in our flow.
  useEffect(() => {
    if (error && error.status !== 401 && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[auth] /me failed:', error);
    }
  }, [error]);

  const value: AuthContextValue = {
    user,
    memberships,
    isLoading: skip ? false : isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refresh,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
