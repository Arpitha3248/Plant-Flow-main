import React, { createContext, useContext, useState, useRef } from 'react';
import type { AuthSession, LoginCredentials, Permission } from '../types/auth';
import { authService } from '../services/authService';
import { auditService } from '../services/auditService';

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (c: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (p: Permission) => boolean;
  refreshSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(() => authService.restoreSession());
  const ref = useRef(session);
  ref.current = session;

  // All functions are STABLE (empty deps) — they read session via ref, never from closure
  function login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
    const result = authService.login(credentials);
    if (result.success && result.session) {
      ref.current = result.session;
      setSession(result.session);
      auditService.logLogin(result.session.userId, result.session.email, result.session.role, true);
    } else {
      auditService.logLogin('anonymous', credentials.email, 'UNKNOWN', false);
    }
    return Promise.resolve({ success: result.success, error: result.error });
  }

  function logout() {
    const s = ref.current;
    if (s) auditService.logLogout(s.userId, s.email, s.role);
    authService.logout();
    ref.current = null;
    setSession(null);
  }

  function hasPermission(p: Permission) {
    return authService.hasPermission(ref.current, p);
  }

  function refreshSession() {
    const s = authService.restoreSession();
    ref.current = s;
    setSession(s);
  }

  return (
    <AuthContext.Provider value={{ session, isAuthenticated: !!session, isAdmin: session?.role === 'ADMIN', login, logout, hasPermission, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

// oxlint-disable-next-line react/only-export-components -- useAuth hook intentionally co-located with AuthProvider
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
