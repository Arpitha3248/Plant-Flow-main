// ============================================================
// ADMIN DASHBOARD — home overview
// All numbers are derived from actual plant data.
// ============================================================

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Cpu,
  Play,
  Pause,
  Square,
  GitBranch,
  Link2,
  Users,
  ArrowRight,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { authService } from '../../services/authService';
import { auditService } from '../../services/auditService';
import { AdminBreadcrumb } from '../AdminLayout';

// ---- Stat card component ---------------------------------------------------
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  onClick?: () => void;
}
const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, bgColor, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all text-left w-full ${
      onClick ? 'cursor-pointer hover:border-indigo-200' : 'cursor-default'
    }`}
  >
    <div className={`p-3 rounded-xl ${bgColor} shrink-0`}>
      <span className={color}>{icon}</span>
    </div>
    <div>
      <p className="text-2xl font-extrabold text-slate-800">{value}</p>
      <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
    </div>
    {onClick && <ArrowRight className="w-4 h-4 text-slate-300 ml-auto" />}
  </button>
);

// ---- Dashboard -------------------------------------------------------------
export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Pull live plant data from storage (same source as PlantFlow)
  const plants = useMemo(() => storageService.loadPlants(), []);
  const users = useMemo(() => authService.getUsers(), []);
  const recentActivity = useMemo(() => auditService.getEntries().slice(0, 8), []);

  const stats = useMemo(() => {
    const allPlants = Object.values(plants);
    let totalNodes = 0;
    let running = 0;
    let idle = 0;
    let stopped = 0;
    let composites = 0;
    let connections = 0;

    for (const plant of allPlants) {
      totalNodes += plant.nodes.length;
      running += plant.nodes.filter((n) => n.status === 'running').length;
      idle += plant.nodes.filter((n) => n.status === 'idle').length;
      stopped += plant.nodes.filter((n) => n.status === 'stopped').length;
      composites += Object.keys(plant.compositeProcesses).length;
      connections += plant.edges.length;
    }

    return {
      totalPlants: allPlants.length,
      totalEquipment: totalNodes,
      running,
      idle,
      stopped,
      composites,
      connections,
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.active).length,
    };
  }, [plants, users]);

  return (
    <div className="space-y-6">
      <AdminBreadcrumb items={[{ label: 'Admin' }, { label: 'Dashboard' }]} />

      <div>
        <h1 className="text-xl font-extrabold text-slate-800">Platform Overview</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Real-time summary of PlantFlow configuration and user data.
        </p>
      </div>

      {/* ---- Primary stats grid ----------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Plants"
          value={stats.totalPlants}
          icon={<Building2 className="w-5 h-5" />}
          color="text-indigo-600"
          bgColor="bg-indigo-50"
          onClick={() => navigate('/admin/plants')}
        />
        <StatCard
          label="Total Equipment"
          value={stats.totalEquipment}
          icon={<Cpu className="w-5 h-5" />}
          color="text-slate-600"
          bgColor="bg-slate-100"
          onClick={() => navigate('/admin/equipment')}
        />
        <StatCard
          label="Active Users"
          value={stats.activeUsers}
          icon={<Users className="w-5 h-5" />}
          color="text-violet-600"
          bgColor="bg-violet-50"
          onClick={() => navigate('/admin/users')}
        />
        <StatCard
          label="Process Connections"
          value={stats.connections}
          icon={<Link2 className="w-5 h-5" />}
          color="text-cyan-600"
          bgColor="bg-cyan-50"
        />
      </div>

      {/* ---- Equipment status row --------------------------------------- */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Running Equipment"
          value={stats.running}
          icon={<Play className="w-5 h-5" />}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
          onClick={() => navigate('/admin/equipment-status')}
        />
        <StatCard
          label="Idle Equipment"
          value={stats.idle}
          icon={<Pause className="w-5 h-5" />}
          color="text-amber-600"
          bgColor="bg-amber-50"
          onClick={() => navigate('/admin/equipment-status')}
        />
        <StatCard
          label="Stopped Equipment"
          value={stats.stopped}
          icon={<Square className="w-5 h-5" />}
          color="text-rose-600"
          bgColor="bg-rose-50"
          onClick={() => navigate('/admin/equipment-status')}
        />
      </div>

      {/* ---- Bottom row ------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Plant summary table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-700">Plant Summary</h3>
            </div>
            <button
              onClick={() => navigate('/admin/plants')}
              className="text-xs text-indigo-600 hover:underline font-semibold"
            >
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Plant</th>
                  <th className="text-right px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Nodes</th>
                  <th className="text-right px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Edges</th>
                  <th className="text-right px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Composites</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {Object.values(plants).map((plant) => (
                  <tr key={plant.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 font-semibold text-slate-700 truncate max-w-[140px]">{plant.name}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500">{plant.nodes.length}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500">{plant.edges.length}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500">
                      {Object.keys(plant.compositeProcesses).length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-700">Recent Activity</h3>
            </div>
            <button
              onClick={() => navigate('/admin/audit-logs')}
              className="text-xs text-indigo-600 hover:underline font-semibold"
            >
              View all
            </button>
          </div>

          {recentActivity.length === 0 ? (
            <div className="px-5 py-8 text-center text-xs text-slate-400">No activity recorded yet.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentActivity.map((entry) => (
                <div key={entry.id} className="px-4 py-2.5 flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    entry.status === 'SUCCESS' ? 'bg-emerald-500' : entry.status === 'FAILURE' ? 'bg-rose-500' : 'bg-amber-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">
                      {entry.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{entry.userEmail}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Composite processes card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex items-center gap-4">
        <div className="p-3 bg-purple-50 rounded-xl">
          <GitBranch className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <p className="text-2xl font-extrabold text-slate-800">{stats.composites}</p>
          <p className="text-xs font-semibold text-slate-500">Composite Processes across all plants</p>
        </div>
      </div>
    </div>
  );
};
