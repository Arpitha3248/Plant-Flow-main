import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { 
  Settings, 
  Database, 
  Flame, 
  Wind, 
  Layers, 
  HardHat, 
  Box, 
  Activity, 
  ChevronRight,
  FolderSync,
  Droplet
} from 'lucide-react';
import type { NodeStatus, NodeType } from '../../types/plant';

// Helper to get Status Indicator Classes
const getStatusBadge = (status: NodeStatus) => {
  switch (status) {
    case 'running':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        label: 'Running',
      };
    case 'idle':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        label: 'Idle',
      };
    case 'stopped':
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
        label: 'Stopped',
      };
    default:
      return {
        bg: 'bg-slate-50 text-slate-700 border-slate-200',
        dot: 'bg-slate-500',
        label: 'Unknown',
      };
  }
};

// Helper to get Category Icons
const getCategoryIcon = (category: string, type: NodeType) => {
  const cat = category.toLowerCase();
  if (type === 'storage') return <Database className="w-4 h-4" />;
  if (cat.includes('mines') || cat.includes('raw')) return <HardHat className="w-4 h-4" />;
  if (cat.includes('crush') || cat.includes('grind') || cat.includes('mill')) return <Settings className="w-4 h-4" />;
  if (cat.includes('homo') || cat.includes('stack')) return <Layers className="w-4 h-4" />;
  if (cat.includes('pyro') || cat.includes('kiln') || cat.includes('thermal')) return <Flame className="w-4 h-4" />;
  if (cat.includes('fuel')) return <Flame className="w-4 h-4 text-orange-500" />;
  if (cat.includes('gas') || cat.includes('oil')) return <Droplet className="w-4 h-4 text-orange-500" />;
  if (cat.includes('air') || cat.includes('fan')) return <Wind className="w-4 h-4 text-sky-500" />;
  if (cat.includes('pack') || cat.includes('loader')) return <Box className="w-4 h-4" />;
  
  return <Activity className="w-4 h-4" />;
};

interface CustomNodeData {
  name: string;
  category: string;
  description: string;
  status: NodeStatus;
  instanceId?: string;
  equipmentType?: string;
  metadata?: Record<string, any>;
  onViewSubprocess?: (nodeId: string) => void;
}

// 1. STANDARD PROCESS NODE
export const StandardNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as CustomNodeData;
  const status = getStatusBadge(nodeData.status);

  return (
    <div className={`w-64 bg-white rounded-lg border-2 shadow-sm transition-all duration-200 ${
      selected ? 'border-indigo-600 ring-2 ring-indigo-100 shadow-md scale-105' : 'border-slate-200 hover:border-slate-300'
    }`}>
      <div className="h-1 bg-indigo-500 rounded-t-md" />
      
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            {getCategoryIcon(nodeData.category, 'standard')}
            <span>{nodeData.category}</span>
          </div>
          <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-medium leading-none ${status.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1">
          {nodeData.name}
          {nodeData.instanceId && (
            <span className="text-[10px] px-1 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 rounded">
              Inst {nodeData.instanceId}
            </span>
          )}
        </h3>

        <p className="text-slate-500 text-[11px] mt-1 line-clamp-2 leading-relaxed">
          {nodeData.description}
        </p>
      </div>

      <Handle type="target" position={Position.Left} id="in-left" className="!w-2 h-2 !bg-indigo-400" />
      <Handle type="target" position={Position.Top} id="in-top" className="!w-2 h-2 !bg-indigo-300" />
      <Handle type="source" position={Position.Right} id="out-right" className="!w-2 h-2 !bg-indigo-400" />
      <Handle type="source" position={Position.Bottom} id="out-bottom" className="!w-2 h-2 !bg-indigo-300" />
    </div>
  );
};

// 2. STORAGE NODE
export const StorageNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as CustomNodeData;
  const status = getStatusBadge(nodeData.status);
  const capacity = nodeData.metadata?.capacity;

  return (
    <div className={`w-60 bg-white rounded-lg border-2 shadow-sm transition-all duration-200 ${
      selected ? 'border-slate-800 ring-2 ring-slate-100 shadow-md scale-105' : 'border-slate-200 hover:border-slate-300'
    }`}>
      <div className="h-1 bg-slate-700 rounded-t-md" />
      
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <Database className="w-3.5 h-3.5 text-slate-600" />
            <span>Storage</span>
          </div>
          <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-medium leading-none ${status.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1">
          {nodeData.name}
          {nodeData.instanceId && (
            <span className="text-[10px] px-1 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 rounded">
              Silo {nodeData.instanceId}
            </span>
          )}
        </h3>
        
        <p className="text-slate-500 text-[11px] mt-1 line-clamp-1 leading-relaxed">
          {nodeData.description}
        </p>

        {capacity && (
          <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-medium">CAPACITY:</span>
            <span className="text-slate-700 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{capacity}</span>
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Left} id="in-left" className="!w-2 h-2 !bg-slate-500" />
      <Handle type="target" position={Position.Top} id="in-top" className="!w-2 h-2 !bg-slate-400" />
      <Handle type="source" position={Position.Right} id="out-right" className="!w-2 h-2 !bg-slate-500" />
      <Handle type="source" position={Position.Bottom} id="out-bottom" className="!w-2 h-2 !bg-slate-400" />
    </div>
  );
};

// 3. INPUT FEED NODE
export const InputNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as CustomNodeData;
  const category = nodeData.category.toLowerCase();
  
  let colorTheme = {
    border: 'border-slate-200 hover:border-slate-300',
    selectedBorder: 'border-slate-600 ring-slate-100',
    tagBg: 'bg-slate-50 text-slate-700 border-slate-200',
    bar: 'bg-slate-600',
    icon: <HardHat className="w-3.5 h-3.5" />,
    label: 'Supply'
  };

  if (category.includes('fuel') || category.includes('coal')) {
    colorTheme = {
      border: 'border-orange-200 hover:border-orange-300',
      selectedBorder: 'border-orange-600 ring-orange-100',
      tagBg: 'bg-orange-50 text-orange-700 border-orange-200',
      bar: 'bg-orange-500',
      icon: <Flame className="w-3.5 h-3.5" />,
      label: 'Fuel Input'
    };
  } else if (category.includes('air') || category.includes('fan')) {
    colorTheme = {
      border: 'border-sky-200 hover:border-sky-300',
      selectedBorder: 'border-sky-600 ring-sky-100',
      tagBg: 'bg-sky-50 text-sky-700 border-sky-200',
      bar: 'bg-sky-500',
      icon: <Wind className="w-3.5 h-3.5" />,
      label: 'Gas/Air'
    };
  } else if (category.includes('add') || category.includes('alternative') || category.includes('slag') || category.includes('ash')) {
    colorTheme = {
      border: 'border-purple-200 hover:border-purple-300',
      selectedBorder: 'border-purple-600 ring-purple-100',
      tagBg: 'bg-purple-50 text-purple-700 border-purple-200',
      bar: 'bg-purple-500',
      icon: <Layers className="w-3.5 h-3.5" />,
      label: 'Alt Feed'
    };
  }

  return (
    <div className={`w-52 bg-white rounded-lg border-2 shadow-sm transition-all duration-200 ${
      selected ? `${colorTheme.selectedBorder} ring-2 shadow-md scale-105` : colorTheme.border
    }`}>
      <div className={`h-1 ${colorTheme.bar} rounded-t-md`} />

      <div className="p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-semibold leading-none ${colorTheme.tagBg}`}>
            {colorTheme.icon}
            {colorTheme.label}
          </span>
        </div>

        <h3 className="font-bold text-slate-800 text-xs">{nodeData.name}</h3>
        <p className="text-slate-400 text-[10px] leading-snug mt-0.5 line-clamp-1">{nodeData.description}</p>
      </div>

      <Handle type="source" position={Position.Right} id="out-right" className="!w-2 h-2 !bg-slate-500" />
      <Handle type="source" position={Position.Bottom} id="out-bottom" className="!w-2 h-2 !bg-slate-400" />
    </div>
  );
};

// 4. COMPOSITE PROCESS NODE
export const CompositeNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const nodeData = data as unknown as CustomNodeData;
  const status = getStatusBadge(nodeData.status);

  const handleSubprocessClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nodeData.onViewSubprocess) {
      nodeData.onViewSubprocess(id);
    }
  };

  return (
    <div className={`w-64 bg-slate-50 rounded-lg border-2 shadow-sm transition-all duration-200 ${
      selected ? 'border-violet-600 ring-2 ring-violet-100 shadow-md scale-105' : 'border-slate-300 hover:border-slate-400'
    }`}>
      <div className="h-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-t-md" />
      
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 text-violet-700 text-xs font-semibold uppercase tracking-wider">
            <FolderSync className="w-3.5 h-3.5" />
            <span>Composite</span>
          </div>
          <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-medium leading-none ${status.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1">
          {nodeData.name}
        </h3>
        
        <p className="text-slate-500 text-[11px] mt-1 line-clamp-2 leading-relaxed">
          {nodeData.description}
        </p>

        <button 
          onClick={handleSubprocessClick}
          className="mt-3 w-full flex items-center justify-center gap-1 py-1.5 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-semibold text-xs rounded transition-all shadow-sm"
        >
          <span>View Internal Process</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <Handle type="target" position={Position.Left} id="in-left" className="!w-2.5 h-2.5 !bg-violet-500" />
      <Handle type="target" position={Position.Top} id="in-top" className="!w-2.5 h-2.5 !bg-violet-400" />
      <Handle type="source" position={Position.Right} id="out-right" className="!w-2.5 h-2.5 !bg-violet-500" />
      <Handle type="source" position={Position.Bottom} id="out-bottom" className="!w-2.5 h-2.5 !bg-violet-400" />
    </div>
  );
};

// Node type mapping helper for React Flow
// oxlint-disable-next-line react/only-export-components -- nodeTypes mapping is intentionally co-located with node component definitions
export const nodeTypes = {
  standard: StandardNode,
  storage: StorageNode,
  input: InputNode,
  composite: CompositeNode,
};
