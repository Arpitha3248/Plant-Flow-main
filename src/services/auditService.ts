// ============================================================
// AUDIT SERVICE
// Records significant application actions for admin review.
// Persisted to localStorage — replace with API calls when
// a backend is available.
// ============================================================

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'PLANT_CREATED'
  | 'PLANT_UPDATED'
  | 'PLANT_DELETED'
  | 'PLANT_RESET'
  | 'PLANT_CLEARED'
  | 'EQUIPMENT_ADDED'
  | 'EQUIPMENT_EDITED'
  | 'EQUIPMENT_DELETED'
  | 'EQUIPMENT_DUPLICATED'
  | 'EQUIPMENT_STATUS_CHANGED'
  | 'CONNECTION_ADDED'
  | 'CONNECTION_DELETED'
  | 'COMPOSITE_EDITED'
  | 'CONFIGURATION_IMPORTED'
  | 'CONFIGURATION_EXPORTED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DISABLED'
  | 'PASSWORD_RESET'
  | 'PERMISSIONS_CHANGED'
  | 'LAYOUT_SAVED';

export type AuditStatus = 'SUCCESS' | 'FAILURE' | 'WARNING';

export interface AuditEntry {
  id: string;
  timestamp: string;       // ISO
  userId: string;
  userEmail: string;
  userRole: string;
  action: AuditAction;
  resource: string;        // e.g. node name, plant name, user email
  plantId: string | null;
  plantName: string | null;
  status: AuditStatus;
  details?: string;        // Extra context — never passwords or secrets
}

const AUDIT_STORAGE_KEY = 'plantflow_audit_log';
const MAX_ENTRIES = 500; // Prevent localStorage bloat

function loadEntries(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AuditEntry[];
  } catch {
    // ignore
  }
  return [];
}

function saveEntries(entries: AuditEntry[]): void {
  try {
    // Keep only the most recent MAX_ENTRIES
    const trimmed = entries.slice(-MAX_ENTRIES);
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    console.warn('auditService: failed to persist audit log');
  }
}

export const auditService = {
  log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): void {
    const entries = loadEntries();
    const newEntry: AuditEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    saveEntries([...entries, newEntry]);
  },

  getEntries(): AuditEntry[] {
    // Return newest-first for display
    return [...loadEntries()].reverse();
  },

  clearEntries(): void {
    try {
      localStorage.removeItem(AUDIT_STORAGE_KEY);
    } catch {
      // ignore
    }
  },

  // ---- Convenience wrappers ------------------------------------------------
  logLogin(userId: string, email: string, role: string, success: boolean): void {
    auditService.log({
      userId,
      userEmail: email,
      userRole: role,
      action: success ? 'LOGIN' : 'LOGIN_FAILED',
      resource: email,
      plantId: null,
      plantName: null,
      status: success ? 'SUCCESS' : 'FAILURE',
    });
  },

  logLogout(userId: string, email: string, role: string): void {
    auditService.log({
      userId,
      userEmail: email,
      userRole: role,
      action: 'LOGOUT',
      resource: email,
      plantId: null,
      plantName: null,
      status: 'SUCCESS',
    });
  },
};
