// ============================================================
// AUDIT LOGS PAGE
// ============================================================

import React, { useState, useMemo } from 'react';
import { ScrollText, Search, Filter, Trash2, Download, AlertTriangle } from 'lucide-react';
import type { AuditAction, AuditStatus } from '../../services/auditService';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../auth/AuthContext';
import { AdminBreadcrumb } from '../AdminLayout';

const STATUS_COLORS: Record<AuditStatus, string> = {
  SUCCESS: 'bg-emerald-100 text-emerald-700',
  FAILURE: 'bg-rose-100 text-rose-700',
  WARNING: 'bg-amber-100 text-amber-700',
};

const ACTION_LABELS: Record<AuditAction, string> = {
  LOGIN:                  'Login',
  LOGOUT:                 'Logout',
  LOGIN_FAILED:           'Login Failed',
  PLANT_CREATED:          'Plant Created',
  PLANT_UPDATED:          'Plant Updated',
  PLANT_DELETED:          'Plant Deleted',
  PLANT_RESET:            'Plant Reset',
  PLANT_CLEARED:          'Plant Cleared',
  EQUIPMENT_ADDED:        'Equipment Added',
  EQUIPMENT_EDITED:       'Equipment Edited',
  EQUIPMENT_DELETED:      'Equipment Deleted',
  EQUIPMENT_DUPLICATED:   'Equipment Duplicated',
  EQUIPMENT_STATUS_CHANGED: 'Status Changed',
  CONNECTION_ADDED:       'Connection Added',
  CONNECTION_DELETED:     'Connection Deleted',
  COMPOSITE_EDITED:       'Composite Edited',
  CONFIGURATION_IMPORTED: 'Config Imported',
  CONFIGURATION_EXPORTED: 'Config Exported',
  USER_CREATED:           'User Created',
  USER_UPDATED:           'User Updated',
  USER_DISABLED:          'User Disabled',
  PASSWORD_RESET:         'Password Reset',
  PERMISSIONS_CHANGED:    'Permissions Changed',
  LAYOUT_SAVED:           'Layout Saved',
};

export const AuditLogsPage: React.FC = () => {
  const { session } = useAuth();
  const [entries, setEntries] = useState(() => auditService.getEntries());
  const [search, setSearch] = useState('');
  const [filterUser, setFilterUser] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const uniqueUsers = useMemo(() => ['all', ...new Set(entries.map((e) => e.userEmail))], [entries]);
  const uniqueActions = useMemo(() => ['all', ...new Set(entries.map((e) => e.action))], [entries]);

  const filtered = useMemo(() => entries.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      e.userEmail.toLowerCase().includes(q) ||
      e.action.toLowerCase().includes(q) ||
      e.resource.toLowerCase().includes(q) ||
      (e.plantName ?? '').toLowerCase().includes(q);
    const matchUser = filterUser === 'all' || e.userEmail === filterUser;
    const matchAction = filterAction === 'all' || e.action === filterAction;
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    return matchSearch && matchUser && matchAction && matchStatus;
  }), [entries, search, filterUser, filterAction, filterStatus]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleClear = () => {
    auditService.clearEntries();
    setEntries([]);
    setShowClearConfirm(false);
    auditService.log({
      userId: session?.userId ?? '',
      userEmail: session?.email ?? '',
      userRole: session?.role ?? '',
      action: 'PLANT_CLEARED',
      resource: 'Audit Log',
      plantId: null,
      plantName: null,
      status: 'SUCCESS',
      details: 'Audit log cleared by admin',
    });
  };

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'User', 'Role', 'Action', 'Resource', 'Plant', 'Status', 'Details'].join(','),
      ...filtered.map((e) =>
        [
          e.timestamp,
          e.userEmail,
          e.userRole,
          e.action,
          `"${e.resource}"`,
          e.plantName ?? '',
          e.status,
          `"${e.details ?? ''}"`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantflow-audit-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <AdminBreadcrumb items={[{ label: 'Admin' }, { label: 'Activity Logs' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Activity Logs</h1>
          <p className="text-sm text-slate-500 mt-0.5">{entries.length} total entries</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Logs
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search logs…"
            className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 w-56"
          />
        </div>
        {[
          { label: 'User', value: filterUser, set: setFilterUser, options: uniqueUsers.map((u) => ({ value: u, label: u === 'all' ? 'All Users' : u })) },
          { label: 'Action', value: filterAction, set: setFilterAction, options: uniqueActions.map((a) => ({ value: a, label: a === 'all' ? 'All Actions' : (ACTION_LABELS[a as AuditAction] ?? a) })) },
          {
            label: 'Status', value: filterStatus, set: setFilterStatus, options: [
              { value: 'all', label: 'All Statuses' },
              { value: 'SUCCESS', label: 'Success' },
              { value: 'FAILURE', label: 'Failure' },
              { value: 'WARNING', label: 'Warning' },
            ]
          },
        ].map((f) => (
          <div key={f.label} className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={f.value}
              onChange={(e) => { f.set(e.target.value); setPage(0); }}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <ScrollText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium">No log entries match filters</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Timestamp', 'User', 'Role', 'Action', 'Resource', 'Plant', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginated.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap font-mono">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700 max-w-[140px] truncate">{entry.userEmail}</td>
                    <td className="px-4 py-2.5 text-slate-500">{entry.userRole}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700">
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 max-w-[120px] truncate">{entry.resource}</td>
                    <td className="px-4 py-2.5 text-slate-500">{entry.plantName ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[entry.status]}`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clear confirm */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-50 rounded-xl"><AlertTriangle className="w-5 h-5 text-rose-600" /></div>
              <h3 className="text-sm font-bold text-slate-800">Clear All Audit Logs?</h3>
            </div>
            <p className="text-sm text-slate-600">This will permanently delete all activity log entries. This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowClearConfirm(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleClear} className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg">Clear All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
