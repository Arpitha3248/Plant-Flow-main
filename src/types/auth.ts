// ============================================================
// AUTH TYPES
// Separate from plant.ts — do not modify plant.ts for auth.
// ============================================================

export type UserRole = 'ADMIN' | 'OPERATOR';

// ---- Permission identifiers --------------------------------
// Derived from actual PlantFlow capabilities only.
export type Permission =
  | 'PLANT_VIEW'
  | 'PLANT_CREATE'
  | 'PLANT_EDIT'
  | 'PLANT_DELETE'
  | 'PLANT_RESET'
  | 'EQUIPMENT_VIEW'
  | 'EQUIPMENT_CREATE'
  | 'EQUIPMENT_EDIT'
  | 'EQUIPMENT_DELETE'
  | 'EQUIPMENT_STATUS_EDIT'
  | 'GRAPH_VIEW'
  | 'GRAPH_EDIT'
  | 'NODE_CREATE'
  | 'NODE_EDIT'
  | 'NODE_DELETE'
  | 'NODE_DUPLICATE'
  | 'CONNECTION_CREATE'
  | 'CONNECTION_DELETE'
  | 'COMPOSITE_VIEW'
  | 'COMPOSITE_EDIT'
  | 'IMPORT_CONFIGURATION'
  | 'EXPORT_CONFIGURATION'
  | 'USER_VIEW'
  | 'USER_CREATE'
  | 'USER_EDIT'
  | 'USER_DISABLE'
  | 'ROLE_MANAGE'
  | 'AUDIT_VIEW'
  | 'SYSTEM_SETTINGS'
  | 'SECURITY_SETTINGS';

// ---- User record (stored — no plaintext password) ----------
export interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  /** Per-user permission overrides (operator only; admin always gets all) */
  permissions: Permission[];
  active: boolean;
  createdAt: string;       // ISO timestamp
  updatedAt: string;
  lastLoginAt: string | null;
  /** bcrypt/scrypt hash stored here in production. For dev-only: a marker string. */
  passwordHash: string;
}

// ---- Live session (runtime only — never persisted in localStorage) ---------
export interface AuthSession {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  permissions: Permission[];
  loginAt: string;         // ISO timestamp
  expiresAt: string;       // ISO timestamp
  rememberMe: boolean;
}

// ---- Login form input -------------------------------------------------------
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

// ---- Auth service result types ---------------------------------------------
export interface AuthResult {
  success: boolean;
  error?: string;
  session?: AuthSession;
}

// ---- Default permission sets -----------------------------------------------

/** Admins get every permission. */
export const ADMIN_PERMISSIONS: Permission[] = [
  'PLANT_VIEW', 'PLANT_CREATE', 'PLANT_EDIT', 'PLANT_DELETE', 'PLANT_RESET',
  'EQUIPMENT_VIEW', 'EQUIPMENT_CREATE', 'EQUIPMENT_EDIT', 'EQUIPMENT_DELETE', 'EQUIPMENT_STATUS_EDIT',
  'GRAPH_VIEW', 'GRAPH_EDIT',
  'NODE_CREATE', 'NODE_EDIT', 'NODE_DELETE', 'NODE_DUPLICATE',
  'CONNECTION_CREATE', 'CONNECTION_DELETE',
  'COMPOSITE_VIEW', 'COMPOSITE_EDIT',
  'IMPORT_CONFIGURATION', 'EXPORT_CONFIGURATION',
  'USER_VIEW', 'USER_CREATE', 'USER_EDIT', 'USER_DISABLE',
  'ROLE_MANAGE',
  'AUDIT_VIEW',
  'SYSTEM_SETTINGS',
  'SECURITY_SETTINGS',
];

/** Default operator permissions — configurable per user by admin. */
export const DEFAULT_OPERATOR_PERMISSIONS: Permission[] = [
  'PLANT_VIEW',
  'EQUIPMENT_VIEW', 'EQUIPMENT_CREATE', 'EQUIPMENT_EDIT', 'EQUIPMENT_DELETE', 'EQUIPMENT_STATUS_EDIT',
  'GRAPH_VIEW', 'GRAPH_EDIT',
  'NODE_CREATE', 'NODE_EDIT', 'NODE_DELETE', 'NODE_DUPLICATE',
  'CONNECTION_CREATE', 'CONNECTION_DELETE',
  'COMPOSITE_VIEW', 'COMPOSITE_EDIT',
  'IMPORT_CONFIGURATION', 'EXPORT_CONFIGURATION',
];

/** Human-readable labels for permissions */
export const PERMISSION_LABELS: Record<Permission, string> = {
  PLANT_VIEW:              'View Plants',
  PLANT_CREATE:            'Create Plants',
  PLANT_EDIT:              'Edit Plants',
  PLANT_DELETE:            'Delete Plants',
  PLANT_RESET:             'Reset Plant Demo',
  EQUIPMENT_VIEW:          'View Equipment',
  EQUIPMENT_CREATE:        'Add Equipment',
  EQUIPMENT_EDIT:          'Edit Equipment',
  EQUIPMENT_DELETE:        'Delete Equipment',
  EQUIPMENT_STATUS_EDIT:   'Change Equipment Status',
  GRAPH_VIEW:              'View Process Graph',
  GRAPH_EDIT:              'Edit Process Graph',
  NODE_CREATE:             'Add Nodes',
  NODE_EDIT:               'Edit Nodes',
  NODE_DELETE:             'Delete Nodes',
  NODE_DUPLICATE:          'Duplicate Nodes',
  CONNECTION_CREATE:       'Add Connections',
  CONNECTION_DELETE:       'Delete Connections',
  COMPOSITE_VIEW:          'View Composite Processes',
  COMPOSITE_EDIT:          'Edit Composite Processes',
  IMPORT_CONFIGURATION:    'Import Configuration',
  EXPORT_CONFIGURATION:    'Export Configuration',
  USER_VIEW:               'View Users',
  USER_CREATE:             'Create Users',
  USER_EDIT:               'Edit Users',
  USER_DISABLE:            'Disable Users',
  ROLE_MANAGE:             'Manage Roles & Permissions',
  AUDIT_VIEW:              'View Audit Logs',
  SYSTEM_SETTINGS:         'System Settings',
  SECURITY_SETTINGS:       'Security Settings',
};

/** Groups for the Roles & Permissions UI */
export const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
  {
    label: 'Plant Management',
    permissions: ['PLANT_VIEW', 'PLANT_CREATE', 'PLANT_EDIT', 'PLANT_DELETE', 'PLANT_RESET'],
  },
  {
    label: 'Equipment',
    permissions: ['EQUIPMENT_VIEW', 'EQUIPMENT_CREATE', 'EQUIPMENT_EDIT', 'EQUIPMENT_DELETE', 'EQUIPMENT_STATUS_EDIT'],
  },
  {
    label: 'Process Graph',
    permissions: ['GRAPH_VIEW', 'GRAPH_EDIT', 'NODE_CREATE', 'NODE_EDIT', 'NODE_DELETE', 'NODE_DUPLICATE', 'CONNECTION_CREATE', 'CONNECTION_DELETE'],
  },
  {
    label: 'Composite Processes',
    permissions: ['COMPOSITE_VIEW', 'COMPOSITE_EDIT'],
  },
  {
    label: 'Import / Export',
    permissions: ['IMPORT_CONFIGURATION', 'EXPORT_CONFIGURATION'],
  },
  {
    label: 'Administration',
    permissions: ['USER_VIEW', 'USER_CREATE', 'USER_EDIT', 'USER_DISABLE', 'ROLE_MANAGE', 'AUDIT_VIEW', 'SYSTEM_SETTINGS', 'SECURITY_SETTINGS'],
  },
];
