// ============================================================
// USER MANAGEMENT PAGE
// ============================================================

import React, { useState, useMemo, useCallback } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Lock,
  UserX,
  UserCheck,
  Shield,
  User,
  AlertTriangle,
  X,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { UserRecord, UserRole, Permission } from '../../types/auth';
import { DEFAULT_OPERATOR_PERMISSIONS, PERMISSION_LABELS, PERMISSION_GROUPS } from '../../types/auth';
import { authService } from '../../services/authService';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../auth/AuthContext';
import { AdminBreadcrumb } from '../AdminLayout';

// ---- Modal base ------------------------------------------------------------
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="overflow-y-auto">{children}</div>
    </div>
  </div>
);

// ---- Create / Edit user form -----------------------------------------------
interface UserFormData {
  email: string;
  displayName: string;
  role: UserRole;
  password: string;
  confirmPassword: string;
  permissions: Permission[];
}

const UserForm: React.FC<{
  initial?: Partial<UserFormData>;
  isEdit?: boolean;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
}> = ({ initial, isEdit, onSubmit, onCancel }) => {
  const [form, setForm] = useState<UserFormData>({
    email: initial?.email ?? '',
    displayName: initial?.displayName ?? '',
    role: initial?.role ?? 'OPERATOR',
    password: '',
    confirmPassword: '',
    permissions: initial?.permissions ?? DEFAULT_OPERATOR_PERMISSIONS,
  });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email.';
    if (!form.displayName.trim()) e.displayName = 'Name is required.';
    if (!isEdit) {
      if (!form.password) e.password = 'Password is required.';
      else if (form.password.length < 8) e.password = 'Minimum 8 characters.';
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (validate()) onSubmit(form);
  };

  const togglePerm = (p: Permission) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(p)
        ? prev.permissions.filter((x) => x !== p)
        : [...prev.permissions, p],
    }));
  };

  const field = (label: string, key: keyof UserFormData, type = 'text') => (
    <div>
      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">{label}</label>
      <div className="relative">
        <input
          type={key === 'password' || key === 'confirmPassword' ? (showPw ? 'text' : 'password') : type}
          value={form[key] as string}
          onChange={(e) => { setForm((p) => ({ ...p, [key]: e.target.value })); setErrors((p) => ({ ...p, [key]: undefined })); }}
          className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 ${errors[key] ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-200'}`}
          placeholder={key === 'password' ? (isEdit ? 'Leave blank to keep current' : 'Min. 8 characters') : undefined}
        />
        {(key === 'password' || key === 'confirmPassword') && (
          <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {errors[key] && <p className="text-xs text-rose-600 mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
      {field('Email Address', 'email', 'email')}
      {field('Display Name', 'displayName')}

      <div>
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Role</label>
        <select
          value={form.role}
          onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserRole }))}
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          <option value="OPERATOR">Operator</option>
          <option value="ADMIN">Administrator</option>
        </select>
      </div>

      {field('Password', 'password')}
      {!isEdit && field('Confirm Password', 'confirmPassword')}

      {/* Operator permissions */}
      {form.role === 'OPERATOR' && (
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Permissions</label>
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
            {PERMISSION_GROUPS.slice(0, 5).map((group) => (
              <div key={group.label} className="border-b border-slate-100 last:border-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 pt-2 pb-1">{group.label}</p>
                {group.permissions.map((p) => (
                  <label key={p} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                    <div
                      onClick={() => togglePerm(p)}
                      className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                        form.permissions.includes(p) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                      }`}
                    >
                      {form.permissions.includes(p) && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className="text-xs text-slate-700">{PERMISSION_LABELS[p]}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-2 pb-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
          {isEdit ? 'Save Changes' : 'Create User'}
        </button>
      </div>
    </form>
  );
};

// ---- Reset password form ---------------------------------------------------
const ResetPasswordModal: React.FC<{ user: UserRecord; onConfirm: (pw: string) => void; onCancel: () => void }> = ({ user, onConfirm, onCancel }) => {
  const [pw, setPw] = useState('');
  const [cpw, setCpw] = useState('');
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) { setError('Minimum 8 characters.'); return; }
    if (pw !== cpw) { setError('Passwords do not match.'); return; }
    onConfirm(pw);
  };

  return (
    <Modal title={`Reset Password — ${user.displayName}`} onClose={onCancel}>
      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
        {['New Password', 'Confirm Password'].map((label, idx) => (
          <div key={label}>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">{label}</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={idx === 0 ? pw : cpw}
                onChange={(e) => { (idx === 0 ? setPw : setCpw)(e.target.value); setError(''); }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 pr-10"
                placeholder="Min. 8 characters"
              />
              {idx === 0 && (
                <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        ))}
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <div className="flex gap-3 justify-end pt-2 pb-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
          <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Reset Password</button>
        </div>
      </form>
    </Modal>
  );
};

// ---- Page ------------------------------------------------------------------
export const UsersPage: React.FC = () => {
  const { session } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>(() => authService.getUsers());
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterActive, setFilterActive] = useState('all');

  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [resetUser, setResetUser] = useState<UserRecord | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  const refresh = useCallback(() => setUsers(authService.getUsers()), []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const filtered = useMemo(() => users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !search || u.email.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q);
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchActive = filterActive === 'all' || (filterActive === 'active' ? u.active : !u.active);
    return matchSearch && matchRole && matchActive;
  }), [users, search, filterRole, filterActive]);

  const handleCreate = (data: { email: string; displayName: string; role: UserRole; password: string; permissions: Permission[] }) => {
    const result = authService.createUser(data);
    if (result.success && result.user) {
      refresh();
      setShowCreate(false);
      showToast(`User "${data.displayName}" created.`);
      auditService.log({ userId: session?.userId ?? '', userEmail: session?.email ?? '', userRole: session?.role ?? '', action: 'USER_CREATED', resource: data.email, plantId: null, plantName: null, status: 'SUCCESS' });
    } else {
      showToast(result.error ?? 'Failed to create user.');
    }
  };

  const handleEdit = (data: { email: string; displayName: string; role: UserRole; permissions: Permission[] }) => {
    if (!editUser) return;
    const result = authService.updateUser(editUser.id, data);
    if (result.success) {
      refresh();
      setEditUser(null);
      showToast('User updated.');
      auditService.log({ userId: session?.userId ?? '', userEmail: session?.email ?? '', userRole: session?.role ?? '', action: 'USER_UPDATED', resource: editUser.email, plantId: null, plantName: null, status: 'SUCCESS' });
    } else {
      showToast(result.error ?? 'Failed to update user.');
    }
  };

  const handleToggleActive = (user: UserRecord) => {
    const result = authService.updateUser(user.id, { active: !user.active });
    if (result.success) {
      refresh();
      showToast(`User ${user.active ? 'disabled' : 'enabled'}.`);
      auditService.log({ userId: session?.userId ?? '', userEmail: session?.email ?? '', userRole: session?.role ?? '', action: 'USER_DISABLED', resource: user.email, plantId: null, plantName: null, status: 'SUCCESS' });
    } else {
      showToast(result.error ?? 'Failed.');
    }
  };

  const handleResetPw = (pw: string) => {
    if (!resetUser) return;
    const result = authService.resetPassword(resetUser.id, pw);
    if (result.success) {
      refresh();
      setResetUser(null);
      showToast('Password reset successfully.');
      auditService.log({ userId: session?.userId ?? '', userEmail: session?.email ?? '', userRole: session?.role ?? '', action: 'PASSWORD_RESET', resource: resetUser.email, plantId: null, plantName: null, status: 'SUCCESS' });
    } else {
      showToast(result.error ?? 'Failed to reset password.');
    }
  };

  return (
    <div className="space-y-6">
      <AdminBreadcrumb items={[{ label: 'Admin' }, { label: 'Users' }]} />

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl">
          {toastMsg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">{users.length} users registered</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…" className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 w-56" />
        </div>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200">
          <option value="all">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="OPERATOR">Operator</option>
        </select>
        <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium">No users found</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['User', 'Role', 'Status', 'Last Login', 'Created', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 ${user.role === 'ADMIN' ? 'bg-indigo-500' : 'bg-emerald-500'}`}>
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-700">{user.displayName}</p>
                        <p className="text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${user.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {user.role === 'ADMIN' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${user.active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {user.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditUser(user)} title="Edit user" className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setResetUser(user)} title="Reset password" className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        title={user.active ? 'Disable user' : 'Enable user'}
                        disabled={user.id === session?.userId}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {user.active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <Modal title="Create New User" onClose={() => setShowCreate(false)}>
          <UserForm onSubmit={handleCreate as any} onCancel={() => setShowCreate(false)} />
        </Modal>
      )}
      {editUser && (
        <Modal title={`Edit User — ${editUser.displayName}`} onClose={() => setEditUser(null)}>
          <UserForm
            initial={{ email: editUser.email, displayName: editUser.displayName, role: editUser.role, permissions: editUser.permissions }}
            isEdit
            onSubmit={handleEdit as any}
            onCancel={() => setEditUser(null)}
          />
        </Modal>
      )}
      {resetUser && (
        <ResetPasswordModal user={resetUser} onConfirm={handleResetPw} onCancel={() => setResetUser(null)} />
      )}

      {/* Confirm disable dialog */}
      {editUser && (
        <div className="hidden">
          <AlertTriangle />
        </div>
      )}
    </div>
  );
};
