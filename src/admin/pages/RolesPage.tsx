// ============================================================
// ROLES & PERMISSIONS PAGE
// ============================================================

import React, { useState, useCallback } from 'react';
import { ShieldCheck, CheckCircle, XCircle, Settings2, User, AlertTriangle } from 'lucide-react';
import type { Permission, UserRecord } from '../../types/auth';
import { PERMISSION_LABELS, PERMISSION_GROUPS, DEFAULT_OPERATOR_PERMISSIONS } from '../../types/auth';
import { authService } from '../../services/authService';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../auth/AuthContext';
import { AdminBreadcrumb } from '../AdminLayout';

export const RolesPage: React.FC = () => {
  const { session } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>(() => authService.getUsers());
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [localPerms, setLocalPerms] = useState<Permission[]>([]);
  const [dirty, setDirty] = useState(false);

  const operators = users.filter((u) => u.role === 'OPERATOR');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleSelectOperator = (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    setSelectedOperatorId(id);
    setLocalPerms([...user.permissions]);
    setDirty(false);
  };

  const togglePerm = (perm: Permission) => {
    setLocalPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
    setDirty(true);
  };

  const handleSave = useCallback(async () => {
    if (!selectedOperatorId) return;
    setSaving(true);
    const result = authService.updatePermissions(selectedOperatorId, localPerms);
    if (result.success) {
      setUsers(authService.getUsers());
      setDirty(false);
      showToast('Permissions saved.');
      auditService.log({
        userId: session?.userId ?? '',
        userEmail: session?.email ?? '',
        userRole: session?.role ?? '',
        action: 'PERMISSIONS_CHANGED',
        resource: selectedOperatorId,
        plantId: null,
        plantName: null,
        status: 'SUCCESS',
      });
    } else {
      showToast(result.error ?? 'Failed to save permissions.');
    }
    setSaving(false);
  }, [selectedOperatorId, localPerms, session]);

  const handleReset = () => {
    setLocalPerms([...DEFAULT_OPERATOR_PERMISSIONS]);
    setDirty(true);
  };

  const selectedUser = users.find((u) => u.id === selectedOperatorId);

  return (
    <div className="space-y-6">
      <AdminBreadcrumb items={[{ label: 'Admin' }, { label: 'Roles & Permissions' }]} />

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl">
          {toastMsg}
        </div>
      )}

      <div>
        <h1 className="text-xl font-extrabold text-slate-800">Roles &amp; Permissions</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Administrators always have full access. Configure per-operator permissions below.
        </p>
      </div>

      {/* Role overview table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-bold text-slate-700">Role Overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider w-2/5">Permission</th>
                <th className="text-center px-5 py-3 font-bold text-indigo-600 uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" />Admin</span>
                </th>
                <th className="text-center px-5 py-3 font-bold text-emerald-600 uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1"><User className="w-3.5 h-3.5" />Operator (Default)</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {PERMISSION_GROUPS.map((group) => (
                <React.Fragment key={group.label}>
                  <tr className="bg-slate-50">
                    <td colSpan={3} className="px-5 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {group.label}
                    </td>
                  </tr>
                  {group.permissions.map((perm) => (
                    <tr key={perm} className="hover:bg-slate-50/70">
                      <td className="px-5 py-2.5 font-medium text-slate-700">{PERMISSION_LABELS[perm]}</td>
                      <td className="px-5 py-2.5 text-center">
                        <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                      </td>
                      <td className="px-5 py-2.5 text-center">
                        {DEFAULT_OPERATOR_PERMISSIONS.includes(perm) ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-operator configuration */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-bold text-slate-700">Configure Operator Permissions</h2>
        </div>

        <div className="p-5 space-y-4">
          {operators.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No operators found. Create an operator user first.</p>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Select Operator</label>
                <select
                  value={selectedOperatorId ?? ''}
                  onChange={(e) => handleSelectOperator(e.target.value)}
                  className="w-full max-w-xs px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="" disabled>Choose operator…</option>
                  {operators.map((u) => (
                    <option key={u.id} value={u.id}>{u.displayName} ({u.email})</option>
                  ))}
                </select>
              </div>

              {selectedUser && (
                <>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                    Configuring permissions for <strong>{selectedUser.displayName}</strong>.
                    These override the default operator set for this specific user.
                  </div>

                  {dirty && (
                    <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Unsaved changes. Click "Save" to apply.</span>
                    </div>
                  )}

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    {PERMISSION_GROUPS.slice(0, 5).map((group) => (
                      <div key={group.label} className="border-b border-slate-100 last:border-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-4 pt-2.5 pb-1.5 bg-slate-50">
                          {group.label}
                        </p>
                        <div className="divide-y divide-slate-50">
                          {group.permissions.map((perm) => (
                            <label key={perm} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                              <div
                                onClick={() => togglePerm(perm)}
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                  localPerms.includes(perm)
                                    ? 'bg-indigo-600 border-indigo-600'
                                    : 'border-slate-300 bg-white hover:border-indigo-400'
                                }`}
                              >
                                {localPerms.includes(perm) && (
                                  <CheckCircle className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <span className="text-xs text-slate-700">{PERMISSION_LABELS[perm]}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                    >
                      Reset to Defaults
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving || !dirty}
                      className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving…' : 'Save Permissions'}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
