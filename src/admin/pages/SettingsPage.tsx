// ============================================================
// SETTINGS, SECURITY & ABOUT PAGES
// ============================================================

import React, { useState, useEffect } from 'react';
import { Settings, Lock, Shield, Monitor, Database, AlertTriangle, CheckCircle } from 'lucide-react';
import { AdminBreadcrumb } from '../AdminLayout';
import { useAuth } from '../../auth/AuthContext';

// ---- Settings page ---------------------------------------------------------
export const SettingsPage: React.FC = () => {
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [appName, setAppName] = useState('Plant Flow Designer');
  const [platform, setPlatform] = useState('browser');
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    window.desktopAPI?.getAppInfo().then((info) => {
      setAppVersion(info.version);
      setAppName(info.name);
      setPlatform(info.platform);
    }).catch(() => {});
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };
  void showToast; // may be used in future

  const handleClearAll = () => {
    if (window.confirm('Clear all local application data? This will remove all plants and settings. You will be logged out.')) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <AdminBreadcrumb items={[{ label: 'Admin' }, { label: 'Settings' }]} />
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl">
          {toastMsg}
        </div>
      )}

      <div>
        <h1 className="text-xl font-extrabold text-slate-800">System Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Application configuration and storage management.</p>
      </div>

      {/* App info */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Monitor className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-bold text-slate-700">Application Information</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          {[
            { label: 'Application', value: appName },
            { label: 'Version', value: appVersion },
            { label: 'Platform', value: platform },
            { label: 'Electron', value: window.desktopAPI ? 'Running in Electron' : 'Browser mode (dev)' },
          ].map((row) => (
            <div key={row.label} className="p-3 bg-slate-50 rounded-xl">
              <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">{row.label}</p>
              <p className="text-slate-700 font-semibold">{row.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Storage */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Database className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-bold text-slate-700">Local Storage</h2>
        </div>
        <p className="text-xs text-slate-500">
          All plant configurations, user records, and audit logs are stored in the browser&apos;s localStorage.
          This is appropriate for a local desktop deployment. For multi-user or cloud deployments, a backend database is required.
        </p>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Clearing storage is irreversible. Export any important plant configurations before proceeding.</span>
        </div>
        <button
          onClick={handleClearAll}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Clear All Local Data
        </button>
      </div>

      {/* Dev mode note */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-amber-800">Development Mode Active</p>
            <p className="text-xs text-amber-700">
              Authentication uses a local development implementation. Passwords are obfuscated but not cryptographically hashed.
              For production use, replace <code className="bg-amber-100 px-1 rounded">authService.ts</code> with a backend API integration
              using proper bcrypt/argon2 password hashing and JWT session tokens.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- Security page ---------------------------------------------------------
export const SecurityPage: React.FC = () => {
  const { session } = useAuth();

  const securityChecks = [
    { label: 'Context Isolation (Electron)', ok: true, note: 'contextIsolation: true in BrowserWindow config' },
    { label: 'Node Integration Disabled', ok: true, note: 'nodeIntegration: false in BrowserWindow config' },
    { label: 'Preload Bridge Only', ok: true, note: 'Renderer accesses Node.js only via contextBridge IPC' },
    { label: 'No Plaintext Passwords', ok: true, note: 'Passwords are obfuscated before storage (dev prototype)' },
    { label: 'Session Expiration', ok: true, note: '8h sessions (30 days with Remember Me)' },
    { label: 'Role-based Route Guards', ok: true, note: 'ProtectedRoute + RoleGuard components on all routes' },
    { label: 'Input Validation', ok: true, note: 'Plant schema validation on import and at storage layer' },
    { label: 'Production-grade Password Hashing', ok: false, note: 'Requires backend API with bcrypt/argon2 — dev only' },
    { label: 'Encrypted Storage', ok: false, note: 'localStorage is unencrypted — use OS keychain or backend for production' },
    { label: 'HTTPS / TLS Transport', ok: false, note: 'N/A for local desktop app; required if deploying as web app' },
  ];

  return (
    <div className="space-y-6">
      <AdminBreadcrumb items={[{ label: 'Admin' }, { label: 'Security' }]} />
      <div>
        <h1 className="text-xl font-extrabold text-slate-800">Security Overview</h1>
        <p className="text-sm text-slate-500 mt-0.5">Current security posture of the PlantFlow installation.</p>
      </div>

      {/* Current user info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
          <Shield className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-bold text-slate-700">Active Session</h2>
        </div>
        {session && (
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              { label: 'User', value: session.displayName },
              { label: 'Email', value: session.email },
              { label: 'Role', value: session.role },
              { label: 'Login Time', value: new Date(session.loginAt).toLocaleString() },
              { label: 'Expires', value: new Date(session.expiresAt).toLocaleString() },
              { label: 'Remember Me', value: session.rememberMe ? 'Yes (30 days)' : 'No (8 hours)' },
            ].map((row) => (
              <div key={row.label} className="p-3 bg-slate-50 rounded-xl">
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">{row.label}</p>
                <p className="text-slate-700 font-semibold">{row.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security checklist */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Lock className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-bold text-slate-700">Security Checklist</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {securityChecks.map((check) => (
            <div key={check.label} className="flex items-center gap-4 px-5 py-3">
              {check.ok ? (
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-700">{check.label}</p>
                <p className="text-[10px] text-slate-400">{check.note}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                check.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {check.ok ? 'OK' : 'Review'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---- About page ------------------------------------------------------------
export const AboutPage: React.FC = () => {
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [platform, setPlatform] = useState('browser');

  useEffect(() => {
    window.desktopAPI?.getAppInfo().then((info) => {
      setAppVersion(info.version);
      setPlatform(info.platform);
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <AdminBreadcrumb items={[{ label: 'Admin' }, { label: 'About' }]} />
      <div>
        <h1 className="text-xl font-extrabold text-slate-800">About PlantFlow</h1>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-2xl shadow-lg shadow-indigo-200">
          <Settings className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">PlantFlow Platform</h2>
          <p className="text-slate-500 text-sm mt-1">Industrial Digital Twin &amp; Plant Process Management</p>
        </div>
        <div className="flex items-center justify-center gap-3 text-xs text-slate-500">
          <span className="px-2 py-1 bg-slate-100 rounded-lg font-mono">v{appVersion}</span>
          <span className="px-2 py-1 bg-slate-100 rounded-lg font-mono">{platform}</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-700">Technology Stack</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ['React 19', 'UI Framework'],
            ['TypeScript', 'Type Safety'],
            ['Electron 43', 'Desktop Runtime'],
            ['Vite 8', 'Build System'],
            ['@xyflow/react', 'Process Graph Canvas'],
            ['Dagre', 'Auto-Layout Engine'],
            ['Tailwind CSS 4', 'Styling'],
            ['Lucide React', 'Icon Library'],
            ['React Router 6', 'Navigation'],
            ['localStorage', 'Local Persistence'],
          ].map(([tech, role]) => (
            <div key={tech} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
              <span className="font-semibold text-slate-700">{tech}</span>
              <span className="text-slate-400 text-[10px]">— {role}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-3">Platform Modules</h3>
        <div className="space-y-2 text-xs text-slate-600">
          <p>✓ Single Login Page with role-based routing</p>
          <p>✓ PlantFlow Designer — process graph modeling with React Flow</p>
          <p>✓ Admin Dashboard — plant, equipment, user, and permission management</p>
          <p>✓ Authentication system with session management</p>
          <p>✓ Audit logging for all significant actions</p>
          <p>✓ JSON import/export with schema validation</p>
          <p>✓ Electron native file dialogs and window management</p>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center">
        Industrial Software Group · Built with React, Electron, and love.
      </p>
    </div>
  );
};
