import React, { useRef, useState } from 'react';
import {
  Factory,
  Save,
  RotateCcw,
  Trash2,
  Download,
  Upload,
  LogOut,
  User,
  ShieldCheck,
  ChevronDown,
  LayoutDashboard,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Plant } from '../types/plant';
import { useAuth } from '../auth/AuthContext';

interface HeaderProps {
  plants: Record<string, Plant>;
  currentPlantId: string;
  onSelectPlant: (plantId: string) => void;
  onSaveLocally: () => void;
  onResetDemo: () => void;
  onClearCanvas: () => void;
  onExportJSON: () => void;
  onImportJSON: (jsonStr: string) => void | Promise<boolean>;
  nestedViewMode: 'expandable' | 'drilldown';
  onSetNestedViewMode: (mode: 'expandable' | 'drilldown') => void;
  drillDownPath: string[];
}

export const Header: React.FC<HeaderProps> = ({
  plants,
  currentPlantId,
  onSelectPlant,
  onSaveLocally,
  onResetDemo,
  onClearCanvas,
  onExportJSON,
  onImportJSON,
  nestedViewMode,
  onSetNestedViewMode,
  drillDownPath,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { session, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') onImportJSON(result);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const isDrilledDown = drillDownPath.length > 1;

  return (
    <header className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between select-none shrink-0 z-20 shadow-sm">
      {/* Brand Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-tr from-indigo-600 to-brand-500 text-white rounded-xl shadow-md">
          <Factory className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-slate-800 font-extrabold text-sm tracking-wide leading-none flex items-center gap-1.5">
            <span>Plant Flow Designer</span>
            <span className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
              V2.0 PRO
            </span>
          </h1>
          <span className="text-[10px] text-slate-400 font-semibold leading-none mt-1">
            Industrial Digital Twin Modeler
          </span>
        </div>
      </div>

      {/* Middle: Plant Selector + View Mode */}
      <div className="flex items-center gap-6">
        {/* Plant Selector */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Plant Profile
          </label>
          <select
            value={currentPlantId}
            onChange={(e) => onSelectPlant(e.target.value)}
            disabled={isDrilledDown}
            className={`px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm ${
              isDrilledDown ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {Object.values(plants).map((plant) => (
              <option key={plant.id} value={plant.id}>
                {plant.name}
              </option>
            ))}
          </select>
        </div>

        {/* Nested View Mode Switcher */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-1 rounded-xl shadow-sm">
          <div className="flex rounded-lg overflow-hidden border border-slate-200 bg-white">
            <button
              onClick={() => onSetNestedViewMode('expandable')}
              className={`px-3 py-1.5 font-bold text-[10px] uppercase tracking-wider transition-all ${
                nestedViewMode === 'expandable'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Expandable Node
            </button>
            <button
              onClick={() => onSetNestedViewMode('drilldown')}
              className={`px-3 py-1.5 font-bold text-[10px] uppercase tracking-wider transition-all ${
                nestedViewMode === 'drilldown'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Drill Down
            </button>
          </div>
          <div className="hidden lg:block max-w-[240px] text-[9px] text-slate-400 leading-tight">
            {nestedViewMode === 'expandable' ? (
              <span><b>Expandable:</b> Pop out internal subprocess layout in a modal overlay instantly.</span>
            ) : (
              <span><b>Drill Down:</b> Seamlessly enter sub-canvas pathways with breadcrumb navigation.</span>
            )}
          </div>
        </div>
      </div>

      {/* Right Side Controls */}
      <div className="flex items-center gap-2">
        {/* Save */}
        <button
          onClick={onSaveLocally}
          title="Save Layout Configuration Locally"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-lg transition-all shadow-md shadow-indigo-100"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save</span>
        </button>

        {/* Import / Export */}
        <div className="flex border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white">
          <button
            onClick={onExportJSON}
            title="Export JSON Configuration File"
            className="p-1.5 hover:bg-slate-50 text-slate-600 hover:text-slate-800 border-r border-slate-200 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleImportClick}
            title="Import JSON Configuration File"
            className="p-1.5 hover:bg-slate-50 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>
        <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

        {/* Reset & Clear */}
        <div className="flex border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white">
          <button
            onClick={onResetDemo}
            title="Reset Demo Layout"
            className="p-1.5 hover:bg-slate-50 text-slate-600 hover:text-slate-800 border-r border-slate-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear the entire graph?')) onClearCanvas();
            }}
            title="Clear Entire Canvas"
            className="p-1.5 hover:bg-slate-50 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* User Menu */}
        {session && (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 ${
                session.role === 'ADMIN' ? 'bg-indigo-600' : 'bg-emerald-600'
              }`}>
                {session.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-none">
                <span className="text-xs font-bold text-slate-700 leading-none">{session.displayName}</span>
                <span className={`text-[9px] font-black uppercase tracking-wider mt-0.5 ${
                  session.role === 'ADMIN' ? 'text-indigo-600' : 'text-emerald-600'
                }`}>
                  {session.role}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-40 overflow-hidden">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black ${
                        session.role === 'ADMIN' ? 'bg-indigo-600' : 'bg-emerald-600'
                      }`}>
                        {session.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col leading-none min-w-0">
                        <span className="text-xs font-bold text-slate-800 truncate">{session.displayName}</span>
                        <span className="text-[10px] text-slate-500 truncate">{session.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Role badge */}
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black ${
                      session.role === 'ADMIN'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}>
                      {session.role === 'ADMIN' ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {session.role === 'ADMIN' ? 'Administrator' : 'Operator'}
                    </div>
                  </div>

                  {/* Admin Dashboard link (admin only) */}
                  {isAdmin && (
                    <button
                      onClick={() => { setUserMenuOpen(false); navigate('/admin'); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                      Admin Dashboard
                    </button>
                  )}

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-100"
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
