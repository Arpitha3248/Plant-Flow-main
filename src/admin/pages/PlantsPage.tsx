// ============================================================
// PLANT MANAGEMENT PAGE
// ============================================================

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Search,
  Plus,
  Trash2,
  RotateCcw,
  ExternalLink,
  GitBranch,
  Link2,
  Cpu,
  AlertTriangle,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../auth/AuthContext';
import { INITIAL_PLANTS } from '../../data/cementPlantDemo';
import { AdminBreadcrumb } from '../AdminLayout';
import type { Plant } from '../../types/plant';

// ---- Confirm dialog --------------------------------------------------------
interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ title, message, confirmLabel = 'Confirm', onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-rose-50 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      </div>
      <p className="text-sm text-slate-600">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm} className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors">
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

// ---- New plant form --------------------------------------------------------
interface NewPlantFormProps {
  onSave: (id: string, name: string) => void;
  onCancel: () => void;
  existingIds: string[];
}
const NewPlantForm: React.FC<NewPlantFormProps> = ({ onSave, onCancel, existingIds }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Plant name is required.'); return; }
    const id = `plant-${trimmed.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`;
    if (existingIds.includes(id)) { setError('A plant with this ID already exists.'); return; }
    onSave(id, trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Create New Plant</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Plant Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="e.g. Aluminium Smelter Plant"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              autoFocus
            />
            {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
              Create Plant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---- Status badge ----------------------------------------------------------
const StatusBadge: React.FC<{ running: number; idle: number; stopped: number }> = ({ running, idle, stopped }) => (
  <div className="flex items-center gap-1.5 text-[10px] font-bold">
    {running > 0 && <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">{running} running</span>}
    {idle > 0 && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-full">{idle} idle</span>}
    {stopped > 0 && <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded-full">{stopped} stopped</span>}
  </div>
);

// ---- Page ------------------------------------------------------------------
export const PlantsPage: React.FC = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [plants, setPlants] = useState<Record<string, Plant>>(() => storageService.loadPlants());
  const [search, setSearch] = useState('');
  const [showNewPlant, setShowNewPlant] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<string | null>(null);

  const plantList = useMemo(() => {
    return Object.values(plants).filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [plants, search]);

  const persist = (updated: Record<string, Plant>) => {
    storageService.savePlants(updated);
    setPlants(updated);
  };

  const handleCreate = (id: string, name: string) => {
    const newPlant: Plant = {
      id,
      name,
      nodes: [],
      edges: [],
      compositeProcesses: {},
    };
    const updated = { ...plants, [id]: newPlant };
    persist(updated);
    setShowNewPlant(false);
    auditService.log({
      userId: session?.userId ?? 'unknown',
      userEmail: session?.email ?? 'unknown',
      userRole: session?.role ?? 'ADMIN',
      action: 'PLANT_CREATED',
      resource: name,
      plantId: id,
      plantName: name,
      status: 'SUCCESS',
    });
  };

  const handleDelete = (plantId: string) => {
    const updated = { ...plants };
    const name = updated[plantId]?.name ?? plantId;
    delete updated[plantId];
    persist(updated);
    setConfirmDelete(null);
    auditService.log({
      userId: session?.userId ?? 'unknown',
      userEmail: session?.email ?? 'unknown',
      userRole: session?.role ?? 'ADMIN',
      action: 'PLANT_DELETED',
      resource: name,
      plantId,
      plantName: name,
      status: 'SUCCESS',
    });
  };

  const handleReset = (plantId: string) => {
    const demo = INITIAL_PLANTS[plantId];
    if (!demo) return;
    const updated = { ...plants, [plantId]: JSON.parse(JSON.stringify(demo)) };
    persist(updated);
    setConfirmReset(null);
    auditService.log({
      userId: session?.userId ?? 'unknown',
      userEmail: session?.email ?? 'unknown',
      userRole: session?.role ?? 'ADMIN',
      action: 'PLANT_RESET',
      resource: demo.name,
      plantId,
      plantName: demo.name,
      status: 'SUCCESS',
    });
  };

  return (
    <div className="space-y-6">
      <AdminBreadcrumb items={[{ label: 'Admin' }, { label: 'Plants' }]} />

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Plant Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">{Object.keys(plants).length} plants configured</p>
        </div>
        <button
          onClick={() => setShowNewPlant(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-indigo-100"
        >
          <Plus className="w-4 h-4" />
          New Plant
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search plants…"
          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      {/* Plant cards */}
      {plantList.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium">No plants found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {plantList.map((plant) => {
            const running = plant.nodes.filter((n) => n.status === 'running').length;
            const idle = plant.nodes.filter((n) => n.status === 'idle').length;
            const stopped = plant.nodes.filter((n) => n.status === 'stopped').length;
            const hasDemoReset = !!INITIAL_PLANTS[plant.id];

            return (
              <div key={plant.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                {/* Card header */}
                <div className="px-5 pt-5 pb-3 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-indigo-50 rounded-xl shrink-0">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-800 truncate">{plant.name}</h3>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{plant.id}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="px-5 py-3 grid grid-cols-3 gap-3 text-center border-b border-slate-100">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-slate-500">
                      <Cpu className="w-3 h-3" />
                      <span className="text-xs font-bold text-slate-800">{plant.nodes.length}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-0.5">Equipment</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-slate-500">
                      <Link2 className="w-3 h-3" />
                      <span className="text-xs font-bold text-slate-800">{plant.edges.length}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-0.5">Connections</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-slate-500">
                      <GitBranch className="w-3 h-3" />
                      <span className="text-xs font-bold text-slate-800">{Object.keys(plant.compositeProcesses).length}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-0.5">Composites</p>
                  </div>
                </div>

                {/* Status */}
                <div className="px-5 py-3 border-b border-slate-100">
                  <StatusBadge running={running} idle={idle} stopped={stopped} />
                </div>

                {/* Actions */}
                <div className="px-4 py-3 flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/plantflow?plant=${plant.id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open in Designer
                  </button>
                  {hasDemoReset && (
                    <button
                      onClick={() => setConfirmReset(plant.id)}
                      title="Reset to demo data"
                      className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-200"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmDelete(plant.id)}
                    title="Delete plant"
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showNewPlant && (
        <NewPlantForm
          existingIds={Object.keys(plants)}
          onSave={handleCreate}
          onCancel={() => setShowNewPlant(false)}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete Plant"
          message={`Permanently delete "${plants[confirmDelete]?.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {confirmReset && (
        <ConfirmDialog
          title="Reset Plant to Demo"
          message={`Reset "${plants[confirmReset]?.name}" to its original demo configuration? All custom changes will be lost.`}
          confirmLabel="Reset"
          onConfirm={() => handleReset(confirmReset)}
          onCancel={() => setConfirmReset(null)}
        />
      )}
    </div>
  );
};
