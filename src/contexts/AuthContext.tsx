'use client';

import { apiFetch } from '@/lib/apiFetch';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSystemToken, SYSTEM_USER, SYSTEM_USER_ID } from '@/lib/system-user';

export interface User {
  id: string;
  username: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type ApiAuthUser = {
  id?: string;
  _id?: string;
  username?: string;
  role?: 'user' | 'admin' | string;
};

type ApiAuthResponse = {
  success?: boolean;
  token?: string;
  user?: ApiAuthUser;
  data?: {
    token?: string;
    user?: ApiAuthUser;
  };
  error?: {
    message?: string;
  } | string;
};

type DecodedJwtPayload = {
  userId?: string;
  username?: string;
  role?: 'user' | 'admin' | string;
  iat?: number;
  exp?: number;
};

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';
const SYSTEM_USER_KEY = 'system';

const getSystemSession = () => {
  return {
    token: getSystemToken(),
    user: { ...SYSTEM_USER },
  };
};

const persistSession = (session: { token: string; user: User }) => {
  localStorage.setItem(AUTH_TOKEN_KEY, session.token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));
  localStorage.setItem(SYSTEM_USER_KEY, JSON.stringify(SYSTEM_USER));
};

const normalizeStoredUser = (raw: unknown): User | null => {
  if (!raw || typeof raw !== 'object') return null;

  const parsed = raw as { id?: unknown; username?: unknown; role?: unknown };
  if (typeof parsed.id !== 'string' || typeof parsed.username !== 'string') {
    return null;
  }

  return {
    id: parsed.id,
    username: parsed.username,
    role: parsed.role === 'admin' ? 'admin' : 'user',
  };
};

const readStoredSession = (): { token: string; user: User } | null => {
  const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
  const storedUser = localStorage.getItem(AUTH_USER_KEY);

  if (!storedToken || !storedUser) return null;

  try {
    const parsedUser = normalizeStoredUser(JSON.parse(storedUser));
    if (!parsedUser) return null;
    return { token: storedToken, user: parsedUser };
  } catch {
    return null;
  }
};

const decodeJwtPayload = (token: string): DecodedJwtPayload | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const decoded = atob(padded);
    return JSON.parse(decoded) as DecodedJwtPayload;
  } catch {
    return null;
  }
};

const getErrorMessage = (raw: ApiAuthResponse): string => {
  if (typeof raw.error === 'string') return raw.error;
  if (raw.error?.message) return raw.error.message;
  return 'Login failed';
};

const normalizeAuthResponse = (raw: ApiAuthResponse) => {
  const source = raw.data ?? raw;
  const newToken = source.token;
  const newUser = source.user;

  if (!newUser || (!newUser.id && !newUser._id)) {
    throw new Error('Invalid user data');
  }

  if (!newToken) {
    throw new Error('Invalid login response: missing token');
  }

  const decoded = decodeJwtPayload(newToken);
  if (!decoded?.userId) {
    throw new Error('Invalid token payload: missing userId');
  }

  const normalizedUser: User = {
    id: String(newUser.id ?? newUser._id),
    username: newUser.username ?? decoded.username ?? '',
    role: (newUser.role === 'admin' ? 'admin' : 'user'),
  };

  if (!normalizedUser.username) {
    throw new Error('Invalid user data');
  }

  return {
    token: newToken,
    user: normalizedUser,
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapped, setIsBootstrapped] = useState(false);

  const resetToSystemSession = () => {
    const systemSession = getSystemSession();
    setToken(systemSession.token);
    setUser(systemSession.user);
    persistSession(systemSession);
  };

  useEffect(() => {
    const stored = readStoredSession();
    const fallback = getSystemSession();
    const session = stored ?? fallback;

    if (session.user.id === SYSTEM_USER_ID) {
      session.token = getSystemSession().token;
      session.user = { ...SYSTEM_USER };
    }

    setToken(session.token);
    setUser(session.user);
    persistSession(session);
    setIsBootstrapped(true);
  }, []);

  useEffect(() => {
    if (!token || !user) return;
    if (user.id === SYSTEM_USER_ID) return;

    const verifyCurrentSession = async () => {
      try {
        const response = await apiFetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Failed to verify session');
        }

        const payload = (await response.json()) as {
          data?: { user?: ApiAuthUser };
          user?: ApiAuthUser;
        };
        const verifiedUser = payload?.data?.user ?? payload?.user;

        if (!verifiedUser || (!verifiedUser.id && !verifiedUser._id) || !verifiedUser.username) {
          throw new Error('Invalid user data');
        }

        const nextUser: User = {
          id: String(verifiedUser.id ?? verifiedUser._id),
          username: verifiedUser.username,
          role: verifiedUser.role === 'admin' ? 'admin' : 'user',
        };

        setUser(nextUser);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
      } catch {
        resetToSystemSession();
      }
    };

    void verifyCurrentSession();
  }, [token, user]);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ApiAuthResponse;
        throw new Error(getErrorMessage(errorData));
      }

      const data = (await response.json()) as ApiAuthResponse;
      const { token: newToken, user: userWithRole } = normalizeAuthResponse(data);

      setToken(newToken);
      setUser(userWithRole);
      persistSession({ token: newToken, user: userWithRole });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      if (token && user?.id !== SYSTEM_USER_ID) {
        await apiFetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } finally {
      resetToSystemSession();
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleLogout = () => {
      resetToSystemSession();
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);


  const value: AuthContextType = {
    user,
    token,
    isLoading: !isBootstrapped || isLoading,
    isAuthenticated: Boolean(user && token),
    isAdmin: user?.role === 'admin',
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
