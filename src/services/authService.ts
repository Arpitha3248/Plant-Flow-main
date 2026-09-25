// ============================================================
// AUTH SERVICE
// ============================================================
// DEVELOPMENT-ONLY local authentication.
// Passwords are never stored in plaintext. This prototype uses
// a simple hash marker. Replace authenticateUser() with a real
// REST API call when a backend is available.
//
// ⚠️  DEVELOPMENT ONLY — not for production deployment.
// ============================================================

import type {
  UserRecord,
  AuthSession,
  LoginCredentials,
  AuthResult,
  Permission,
  UserRole,
} from '../types/auth';
import { ADMIN_PERMISSIONS, DEFAULT_OPERATOR_PERMISSIONS } from '../types/auth';

// ---- Storage keys ----------------------------------------------------------
const USERS_STORAGE_KEY = 'plantflow_users';
const SESSION_STORAGE_KEY = 'plantflow_session';
const REMEMBER_STORAGE_KEY = 'plantflow_remember';

// ---- Session duration ------------------------------------------------------
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;    // 8 hours (normal)
const REMEMBER_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days (remember me)

// ---- Minimal password "hashing" for this prototype -------------------------
// In production: use bcrypt/argon2 on a backend. Never in the browser.
function hashPassword(plain: string): string {
  // Simple deterministic obfuscation — NOT cryptographically secure.
  // Sufficient to ensure we never store the raw password string.
  const encoded = btoa(
    plain
      .split('')
      .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ ((i % 7) + 3)))
      .join('')
  );
  return `dev_hash::${encoded}`;
}

function verifyPassword(plain: string, hash: string): boolean {
  if (!hash.startsWith('dev_hash::')) return false;
  return hashPassword(plain) === hash;
}

// ---- Seed demo users -------------------------------------------------------
// ⚠️  DEVELOPMENT ONLY credentials — replace with backend auth in production.
const DEMO_USERS: Omit<UserRecord, 'passwordHash'>[] = [
  {
    id: 'user-admin-001',
    email: 'admin@plantflow.local',
    displayName: 'Plant Administrator',
    role: 'ADMIN',
    permissions: ADMIN_PERMISSIONS,
    active: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    lastLoginAt: null,
  },
  {
    id: 'user-op-001',
    email: 'operator@plantflow.local',
    displayName: 'Plant Operator',
    role: 'OPERATOR',
    permissions: DEFAULT_OPERATOR_PERMISSIONS,
    active: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    lastLoginAt: null,
  },
];

// ---- Demo passwords (dev-only) ---------------------------------------------
const DEMO_PASSWORDS: Record<string, string> = {
  'user-admin-001': 'Admin@1234',
  'user-op-001':    'Operator@1234',
};

// ---- Load / initialise user store ------------------------------------------
function loadUsers(): UserRecord[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as UserRecord[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fall through to seed
  }
  // First run — seed demo users
  const seeded: UserRecord[] = DEMO_USERS.map((u) => ({
    ...u,
    passwordHash: hashPassword(DEMO_PASSWORDS[u.id] ?? 'changeme'),
  }));
  saveUsers(seeded);
  return seeded;
}

function saveUsers(users: UserRecord[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {
    console.error('authService: failed to persist user store');
  }
}

// ---- Session helpers --------------------------------------------------------
function buildSession(user: UserRecord, rememberMe: boolean): AuthSession {
  const now = new Date();
  const duration = rememberMe ? REMEMBER_DURATION_MS : SESSION_DURATION_MS;
  return {
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    permissions: user.role === 'ADMIN' ? ADMIN_PERMISSIONS : user.permissions,
    loginAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + duration).toISOString(),
    rememberMe,
  };
}

function persistSession(session: AuthSession): void {
  try {
    const store = session.rememberMe ? localStorage : sessionStorage;
    store.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    if (session.rememberMe) {
      localStorage.setItem(REMEMBER_STORAGE_KEY, '1');
    }
  } catch {
    console.error('authService: failed to persist session');
  }
}

function clearPersistedSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(REMEMBER_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ---- Public API ------------------------------------------------------------

export const authService = {
  // ---- Login ---------------------------------------------------------------
  login(credentials: LoginCredentials): AuthResult {
    const { email, password, rememberMe } = credentials;

    // Basic input validation
    if (!email?.trim()) return { success: false, error: 'Email is required.' };
    if (!password)      return { success: false, error: 'Password is required.' };
    if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters.' };

    const users = loadUsers();
    // Never reveal whether the username exists — always return the same message.
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return { success: false, error: 'Invalid email or password.' };
    }
    if (!user.active) {
      return { success: false, error: 'This account has been disabled. Contact your administrator.' };
    }

    // Update lastLoginAt
    const updatedUsers = users.map((u) =>
      u.id === user.id ? { ...u, lastLoginAt: new Date().toISOString() } : u
    );
    saveUsers(updatedUsers);

    const session = buildSession(user, rememberMe);
    persistSession(session);
    return { success: true, session };
  },

  // ---- Logout --------------------------------------------------------------
  logout(): void {
    clearPersistedSession();
  },

  // ---- Restore session on app load ----------------------------------------
  restoreSession(): AuthSession | null {
    try {
      // Check sessionStorage first (non-remember), then localStorage (remember-me)
      const raw =
        sessionStorage.getItem(SESSION_STORAGE_KEY) ??
        localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as AuthSession;
      if (new Date(session.expiresAt) <= new Date()) {
        clearPersistedSession();
        return null;
      }
      return session;
    } catch {
      clearPersistedSession();
      return null;
    }
  },

  // ---- User CRUD -----------------------------------------------------------
  getUsers(): UserRecord[] {
    return loadUsers();
  },

  getUserById(id: string): UserRecord | undefined {
    return loadUsers().find((u) => u.id === id);
  },

  createUser(data: {
    email: string;
    displayName: string;
    role: UserRole;
    password: string;
    permissions?: Permission[];
  }): { success: boolean; error?: string; user?: UserRecord } {
    const users = loadUsers();
    if (users.find((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, error: 'A user with this email already exists.' };
    }
    if (data.password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters.' };
    }
    const now = new Date().toISOString();
    const newUser: UserRecord = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: data.email.trim().toLowerCase(),
      displayName: data.displayName.trim(),
      role: data.role,
      permissions: data.role === 'ADMIN'
        ? ADMIN_PERMISSIONS
        : (data.permissions ?? DEFAULT_OPERATOR_PERMISSIONS),
      active: true,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
      passwordHash: hashPassword(data.password),
    };
    saveUsers([...users, newUser]);
    return { success: true, user: newUser };
  },

  updateUser(id: string, updates: Partial<Pick<UserRecord, 'displayName' | 'role' | 'permissions' | 'active' | 'email'>>): { success: boolean; error?: string } {
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return { success: false, error: 'User not found.' };

    // Prevent removing the last active admin
    if (updates.role === 'OPERATOR' || updates.active === false) {
      const admins = users.filter((u) => u.id !== id && u.role === 'ADMIN' && u.active);
      if (admins.length === 0) {
        return { success: false, error: 'Cannot remove the last active administrator.' };
      }
    }

    const updated = {
      ...users[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    // If role changed to admin, ensure full permissions
    if (updates.role === 'ADMIN') updated.permissions = ADMIN_PERMISSIONS;

    const newUsers = [...users];
    newUsers[idx] = updated;
    saveUsers(newUsers);
    return { success: true };
  },

  resetPassword(id: string, newPassword: string): { success: boolean; error?: string } {
    if (newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters.' };
    }
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return { success: false, error: 'User not found.' };

    const newUsers = [...users];
    newUsers[idx] = {
      ...newUsers[idx],
      passwordHash: hashPassword(newPassword),
      updatedAt: new Date().toISOString(),
    };
    saveUsers(newUsers);
    return { success: true };
  },

  updatePermissions(userId: string, permissions: Permission[]): { success: boolean; error?: string } {
    const users = loadUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'User not found.' };
    if (user.role === 'ADMIN') return { success: false, error: 'Admin permissions cannot be modified.' };
    return authService.updateUser(userId, { permissions });
  },

  // ---- Permission check (runtime) -----------------------------------------
  hasPermission(session: AuthSession | null, permission: Permission): boolean {
    if (!session) return false;
    if (session.role === 'ADMIN') return true;
    return session.permissions.includes(permission);
  },
};
