// ============================================================
// EQUIPMENT MANAGEMENT PAGE
// Shows all equipment nodes across all plants.
// ============================================================

import React, { useState, useMemo } from 'react';
import { Search, Cpu, Filter } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { AdminBreadcrumb } from '../AdminLayout';
import type { PlantNode, NodeStatus, NodeType } from '../../types/plant';

interface EquipmentRow extends PlantNode {
  plantId: string;
  plantName: string;
}

const STATUS_COLORS: Record<NodeStatus, string> = {
  running: 'bg-emerald-100 text-emerald-700',
  idle: 'bg-amber-100 text-amber-700',
  stopped: 'bg-rose-100 text-rose-700',
};

const TYPE_COLORS: Record<NodeType, string> = {
  standard: 'bg-slate-100 text-slate-700',
  storage: 'bg-sky-100 text-sky-700',
  input: 'bg-violet-100 text-violet-700',
  composite: 'bg-indigo-100 text-indigo-700',
};

export const EquipmentPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlant, setFilterPlant] = useState('all');

  const plants = useMemo(() => storageService.loadPlants(), []);

  const allEquipment = useMemo<EquipmentRow[]>(() => {
    const rows: EquipmentRow[] = [];
    for (const plant of Object.values(plants)) {
      for (const node of plant.nodes) {
        rows.push({ ...node, plantId: plant.id, plantName: plant.name });
      }
      // Also gather nodes from composite processes
      for (const comp of Object.values(plant.compositeProcesses)) {
        for (const node of comp.nodes) {
          rows.push({ ...node, plantId: plant.id, plantName: plant.name });
        }
      }
    }
    return rows;
  }, [plants]);

  const categories = useMemo(() => ['all', ...new Set(allEquipment.map((e) => e.category))], [allEquipment]);
  const plantOptions = useMemo(() => Object.values(plants).map((p) => ({ id: p.id, name: p.name })), [plants]);

  const filtered = useMemo(() => {
    return allEquipment.filter((eq) => {
      const matchSearch =
        !search ||
        eq.name.toLowerCase().includes(search.toLowerCase()) ||
        eq.category.toLowerCase().includes(search.toLowerCase()) ||
        (eq.equipmentType ?? '').toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory === 'all' || eq.category === filterCategory;
      const matchType = filterType === 'all' || eq.type === filterType;
      const matchStatus = filterStatus === 'all' || eq.status === filterStatus;
      const matchPlant = filterPlant === 'all' || eq.plantId === filterPlant;
      return matchSearch && matchCat && matchType && matchStatus && matchPlant;
    });
  }, [allEquipment, search, filterCategory, filterType, filterStatus, filterPlant]);

  return (
    <div className="space-y-6">
      <AdminBreadcrumb items={[{ label: 'Admin' }, { label: 'Equipment' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Equipment Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} equipment items</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search equipment…"
            className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 w-56"
          />
        </div>

        {[
          {
            label: 'Plant',
            value: filterPlant,
            onChange: setFilterPlant,
            options: [{ value: 'all', label: 'All Plants' }, ...plantOptions.map((p) => ({ value: p.id, label: p.name }))],
          },
          {
            label: 'Category',
            value: filterCategory,
            onChange: setFilterCategory,
            options: categories.map((c) => ({ value: c, label: c === 'all' ? 'All Categories' : c })),
          },
          {
            label: 'Type',
            value: filterType,
            onChange: setFilterType,
            options: [
              { value: 'all', label: 'All Types' },
              { value: 'standard', label: 'Standard' },
              { value: 'storage', label: 'Storage' },
              { value: 'input', label: 'Input' },
              { value: 'composite', label: 'Composite' },
            ],
          },
          {
            label: 'Status',
            value: filterStatus,
            onChange: setFilterStatus,
            options: [
              { value: 'all', label: 'All Statuses' },
              { value: 'running', label: 'Running' },
              { value: 'idle', label: 'Idle' },
              { value: 'stopped', label: 'Stopped' },
            ],
          },
        ].map((f) => (
          <div key={f.label} className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
            >
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Cpu className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium">No equipment matches filters</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Name', 'Category', 'Type', 'Status', 'Plant', 'Equipment Type', 'Instance'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((eq) => (
                  <tr key={`${eq.plantId}-${eq.id}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-700">{eq.name}</td>
                    <td className="px-4 py-3 text-slate-500">{eq.category}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TYPE_COLORS[eq.type]}`}>
                        {eq.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[eq.status]}`}>
                        {eq.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 truncate max-w-[120px]">{eq.plantName}</td>
                    <td className="px-4 py-3 text-slate-500">{eq.equipmentType ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{eq.instanceId ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ---- Equipment Status sub-page -------------------------------------------
export const EquipmentStatusPage: React.FC = () => {
  const [filterPlant, setFilterPlant] = useState('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  const plants = useMemo(() => storageService.loadPlants(), []);

  const allEquipment = useMemo<EquipmentRow[]>(() => {
    const rows: EquipmentRow[] = [];
    for (const plant of Object.values(plants)) {
      for (const node of plant.nodes) {
        rows.push({ ...node, plantId: plant.id, plantName: plant.name });
      }
    }
    return rows;
  }, [plants]);

  const counts = useMemo(() => ({
    running: allEquipment.filter((e) => e.status === 'running').length,
    idle: allEquipment.filter((e) => e.status === 'idle').length,
    stopped: allEquipment.filter((e) => e.status === 'stopped').length,
  }), [allEquipment]);

  const filtered = useMemo(() => allEquipment.filter((eq) => {
    const matchSearch = !search || eq.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || eq.status === filterStatus;
    const matchPlant = filterPlant === 'all' || eq.plantId === filterPlant;
    return matchSearch && matchStatus && matchPlant;
  }), [allEquipment, search, filterStatus, filterPlant]);

  const plantOptions = Object.values(plants).map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="space-y-6">
      <AdminBreadcrumb items={[{ label: 'Admin' }, { label: 'Equipment Status' }]} />

      <div>
        <h1 className="text-xl font-extrabold text-slate-800">Equipment Status Overview</h1>
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mt-2 inline-block">
          ℹ Status reflects configured application data — not live sensor readings.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Running', count: counts.running, color: 'bg-emerald-50 border-emerald-200', textColor: 'text-emerald-700', dot: 'bg-emerald-500' },
          { label: 'Idle', count: counts.idle, color: 'bg-amber-50 border-amber-200', textColor: 'text-amber-700', dot: 'bg-amber-500' },
          { label: 'Stopped', count: counts.stopped, color: 'bg-rose-50 border-rose-200', textColor: 'text-rose-700', dot: 'bg-rose-500' },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setFilterStatus(s.label.toLowerCase())}
            className={`p-4 rounded-2xl border ${s.color} text-left hover:shadow-md transition-all`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className={`text-xs font-bold ${s.textColor}`}>{s.label}</span>
            </div>
            <p className={`text-2xl font-extrabold ${s.textColor}`}>{s.count}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 w-48" />
        </div>
        <select value={filterPlant} onChange={(e) => setFilterPlant(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
          <option value="all">All Plants</option>
          {plantOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
          <option value="all">All Statuses</option>
          <option value="running">Running</option>
          <option value="idle">Idle</option>
          <option value="stopped">Stopped</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Equipment Name', 'Category', 'Status', 'Plant'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((eq) => (
                <tr key={`${eq.plantId}-${eq.id}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-700">{eq.name}</td>
                  <td className="px-4 py-3 text-slate-500">{eq.category}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[eq.status]}`}>
                      {eq.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{eq.plantName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
