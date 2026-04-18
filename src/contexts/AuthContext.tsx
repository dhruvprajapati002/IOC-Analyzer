'use client';

import { apiFetch } from '@/lib/apiFetch';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  role: 'user' | 'admin'; // NEW: Role support
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean; // NEW: Quick admin check
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

  // Required debug trace before reading .id
  console.log('DEBUG VALUE:', newUser);

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

  // Load user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        setToken(storedToken);
        setUser(parsedUser);
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    setIsBootstrapped(true);
  }, []);

  useEffect(() => {
    if (!token) return;

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

        if (!verifiedUser || !verifiedUser.id || !verifiedUser.username) {
          throw new Error('Invalid user data');
        }

        const nextUser: User = {
          id: verifiedUser.id,
          username: verifiedUser.username,
          role: verifiedUser.role === 'admin' ? 'admin' : 'user',
        };

        setUser(nextUser);
        localStorage.setItem('auth_user', JSON.stringify(nextUser));
      } catch {
        setToken(null);
        setUser(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    };

    void verifyCurrentSession();
  }, [token]);

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
      localStorage.setItem('auth_token', newToken);
      localStorage.setItem('auth_user', JSON.stringify(userWithRole));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      if (token) {
        await apiFetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleLogout = () => {
      setToken(null);
      setUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);


  const value: AuthContextType = {
    user,
    token,
    isLoading: !isBootstrapped || isLoading,
    isAuthenticated: Boolean(user && token),
    isAdmin: user?.role === 'admin', // NEW: Quick admin check
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
