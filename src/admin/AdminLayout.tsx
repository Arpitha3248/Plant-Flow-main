// ============================================================
// ADMIN LAYOUT — sidebar + header shell for all admin pages
// ============================================================

import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Factory,
  LayoutDashboard,
  Building2,
  Settings2,
  Cpu,
  Activity,
  Users,
  ShieldCheck,
  ScrollText,
  FileJson,
  Settings,
  Lock,
  Info,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Bell,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

// ---- Sidebar nav items -----------------------------------------------------
interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}
interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Plant',
    items: [
      { label: 'Plants', to: '/admin/plants', icon: <Building2 className="w-4 h-4" /> },
      { label: 'Equipment', to: '/admin/equipment', icon: <Cpu className="w-4 h-4" /> },
      { label: 'Equipment Status', to: '/admin/equipment-status', icon: <Activity className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Users', to: '/admin/users', icon: <Users className="w-4 h-4" /> },
      { label: 'Roles & Permissions', to: '/admin/roles', icon: <ShieldCheck className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { label: 'Activity Logs', to: '/admin/audit-logs', icon: <ScrollText className="w-4 h-4" /> },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Import / Export', to: '/admin/import-export', icon: <FileJson className="w-4 h-4" /> },
      { label: 'Settings', to: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
      { label: 'Security', to: '/admin/security', icon: <Lock className="w-4 h-4" /> },
      { label: 'About', to: '/admin/about', icon: <Info className="w-4 h-4" /> },
    ],
  },
];

// ---- Sidebar ---------------------------------------------------------------
const AdminSidebar: React.FC<{ collapsed: boolean }> = ({ collapsed }) => {
  return (
    <aside
      className={`flex flex-col h-full bg-slate-900 border-r border-slate-800 transition-all duration-200 shrink-0 ${
        collapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-3.5 border-b border-slate-800 shrink-0">
        <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shrink-0">
          <Factory className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none min-w-0">
            <span className="text-white font-extrabold text-sm truncate">PlantFlow</span>
            <span className="text-slate-400 text-[10px] font-semibold truncate">Admin Console</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-2">
            {!collapsed && (
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2 py-1.5">
                {section.title}
              </p>
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`
                }
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom build tag */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-slate-800">
          <p className="text-[9px] text-slate-600 font-mono">PlantFlow Admin v2.0</p>
        </div>
      )}
    </aside>
  );
};

// ---- Top header ------------------------------------------------------------
const AdminHeader: React.FC<{
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}> = ({ onToggleSidebar, sidebarCollapsed }) => {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
        <div>
          <h2 className="text-sm font-bold text-slate-800">Admin Dashboard</h2>
          <p className="text-[10px] text-slate-400 font-medium">PlantFlow Platform Management</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications placeholder */}
        <button className="relative p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
        </button>

        {/* Go to PlantFlow */}
        <button
          onClick={() => navigate('/plantflow')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>PlantFlow Designer</span>
        </button>

        {/* Profile */}
        {session && (
          <div className="relative">
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-black">
                {session.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-xs font-bold text-slate-700">{session.displayName}</span>
                <span className="text-[9px] text-indigo-600 font-black uppercase tracking-wider">Admin</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-40 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <p className="text-xs font-bold text-slate-800">{session.displayName}</p>
                    <p className="text-[10px] text-slate-500">{session.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

// ---- Breadcrumb context (optional, used by pages) -------------------------
export const AdminBreadcrumb: React.FC<{ items: { label: string; to?: string }[] }> = ({ items }) => (
  <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6">
    {items.map((item, idx) => {
      const isLast = idx === items.length - 1;
      return (
        <React.Fragment key={idx}>
          {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
          <span className={isLast ? 'font-bold text-slate-700' : 'font-medium'}>
            {item.label}
          </span>
        </React.Fragment>
      );
    })}
  </nav>
);

// ---- Root layout -----------------------------------------------------------
export const AdminLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      <AdminSidebar collapsed={sidebarCollapsed} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminHeader
          onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
