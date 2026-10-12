'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authedFetch, handleAuthed } from '../../lib/authed-api';
import { getAccessToken, setAccessToken } from '../../lib/auth/token-store';
import { loginRequest, logoutRequest, refreshRequest, registerRequest } from './api';
import type { AuthUser } from './types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface ImpersonationResponse {
  accessToken: string;
  expiresInSeconds: number;
  user: AuthUser;
}

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: {
    email: string;
    phone?: string;
    password: string;
    roles: ('TUTOR' | 'GUARDIAN')[];
  }) => Promise<void>;
  logout: () => Promise<void>;
  /** Non-null while an admin is viewing the app as another account ("view as") — the admin's own identity, stashed. */
  impersonatorAdmin: AuthUser | null;
  startImpersonation: (targetUserId: string) => Promise<void>;
  endImpersonation: () => void;
  /** Used by the Google OAuth callback and sign-up-completion pages, which already hold a fresh access token + user from the API response. */
  setAuthenticatedSession: (accessToken: string, user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [adminStash, setAdminStash] = useState<{ token: string; user: AuthUser } | null>(null);

  // Session restoration: the access token lives only in memory, so a page
  // reload loses it. Try a silent refresh using the HttpOnly cookie before
  // deciding whether the visitor is signed in.
  useEffect(() => {
    let cancelled = false;

    refreshRequest()
      .then((data) => {
        if (cancelled) return;
        setAccessToken(data.accessToken);
        setUser(data.user);
        setStatus('authenticated');
      })
      .catch(() => {
        if (cancelled) return;
        setAccessToken(null);
        setUser(null);
        setStatus('unauthenticated');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginRequest(email, password);
    setAccessToken(data.accessToken);
    setUser(data.user);
    setStatus('authenticated');
    return data.user;
  }, []);

  const register = useCallback(
    async (input: {
      email: string;
      phone?: string;
      password: string;
      roles: ('TUTOR' | 'GUARDIAN')[];
    }) => {
      await registerRequest(input);
      await login(input.email, input.password);
    },
    [login],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setAccessToken(null);
      setUser(null);
      setAdminStash(null);
      setStatus('unauthenticated');
    }
  }, []);

  const startImpersonation = useCallback(
    async (targetUserId: string) => {
      const currentToken = getAccessToken();
      if (!currentToken || !user) {
        throw new Error('You need to be signed in to do this.');
      }
      const res = await authedFetch(`/admin/users/${targetUserId}/impersonate`, { method: 'POST' });
      const data = await handleAuthed<ImpersonationResponse>(res);
      setAdminStash({ token: currentToken, user });
      setAccessToken(data.accessToken);
      setUser(data.user);
    },
    [user],
  );

  const endImpersonation = useCallback(() => {
    if (!adminStash) return;
    setAccessToken(adminStash.token);
    setUser(adminStash.user);
    setAdminStash(null);
  }, [adminStash]);

  const setAuthenticatedSession = useCallback((accessToken: string, nextUser: AuthUser) => {
    setAccessToken(accessToken);
    setUser(nextUser);
    setStatus('authenticated');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      login,
      register,
      logout,
      impersonatorAdmin: adminStash?.user ?? null,
      startImpersonation,
      endImpersonation,
      setAuthenticatedSession,
    }),
    [
      status,
      user,
      login,
      register,
      logout,
      adminStash,
      startImpersonation,
      endImpersonation,
      setAuthenticatedSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/** Exposed for components (not context consumers) that need the raw token, e.g. a future authenticated fetch helper. */
export { getAccessToken };
