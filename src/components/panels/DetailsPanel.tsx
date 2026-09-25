import React, { useEffect, useState } from 'react';
import { 
  X, 
  Trash2, 
  Copy, 
  FolderOpen, 
  Sliders, 
  Check, 
  FolderPlus,
  Database,
  HardHat,
  Settings,
  Layers,
  Flame,
  Droplet,
  Wind,
  Box,
  Activity
} from 'lucide-react';
import type { PlantNode, PlantEdge, NodeStatus, FlowType, NodeType } from '../../types/plant';

const getDetailsCategoryIcon = (category: string, type: NodeType) => {
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

interface DetailsPanelProps {
  selectedNodeId: string | null;
  nodes: PlantNode[];
  edges: PlantEdge[];
  onClose: () => void;
  onEdit: (nodeId: string, updates: Partial<PlantNode>) => void;
  onDelete: (nodeId: string) => void;
  onDuplicate: (nodeId: string) => void;
  onMakeComposite: (nodeId: string) => void;
  onViewSubprocess: (nodeId: string) => void;
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  selectedNodeId,
  nodes,
  edges,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onMakeComposite,
  onViewSubprocess,
}) => {
  const node = nodes.find((n) => n.id === selectedNodeId);

  // Edit states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Load selected node properties
  useEffect(() => {
    if (node) {
      setName(node.name);
      setCategory(node.category);
      setDescription(node.description);
      setCapacity(node.metadata?.capacity || '');
      setIsEditing(false);
    }
  }, [node]);

  if (!selectedNodeId || !node) {
    return (
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full items-center justify-center p-6 text-center select-none">
        <Sliders className="w-8 h-8 text-slate-300 mb-3 animate-pulse" />
        <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">No Node Selected</h3>
        <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] leading-normal">
          Click any process stage, silo, or feed input in the graph to view and configure its details.
        </p>
      </div>
    );
  }

  const handleSave = () => {
    onEdit(node.id, {
      name,
      category,
      description,
      metadata: node.type === 'storage' ? { ...node.metadata, capacity } : node.metadata,
    });
    setIsEditing(false);
  };

  // Find incoming and outgoing connections
  const incomingEdges = edges.filter((e) => e.target === node.id);
  const outgoingEdges = edges.filter((e) => e.source === node.id);

  const getSourceNodeName = (sourceId: string) => {
    return nodes.find((n) => n.id === sourceId)?.name || sourceId;
  };

  const getTargetNodeName = (targetId: string) => {
    return nodes.find((n) => n.id === targetId)?.name || targetId;
  };

  const getFlowColor = (type: FlowType) => {
    switch (type) {
      case 'fuel': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'air': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'alternative': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleDeleteClick = () => {
    const hasConnections = edges.some((e) => e.source === node.id || e.target === node.id);
    if (hasConnections) {
      const confirmDelete = window.confirm(
        `Delete "${node.name}" and all of its incoming/outgoing process graph links?`
      );
      if (!confirmDelete) return;
    }
    onDelete(node.id);
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full text-xs overflow-hidden select-none">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-white border border-slate-200 rounded text-slate-600 shadow-sm">
            {getDetailsCategoryIcon(node.category, node.type)}
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Node Properties</h3>
            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider leading-none mt-0.5 block">
              Type: {node.type}
            </span>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-1 hover:bg-slate-200 active:bg-slate-300 rounded text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Inline Editing Switch */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">
            Configuration
          </span>
          <button
            onClick={() => {
              if (isEditing) handleSave();
              else setIsEditing(true);
            }}
            className={`px-2.5 py-1 rounded font-bold text-[10px] shadow-sm transition-all border ${
              isEditing
                ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {isEditing ? (
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3" /> Save Changes
              </span>
            ) : (
              'Edit Fields'
            )}
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-3">
          {/* Node Name */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Node Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
              />
            ) : (
              <p className="font-bold text-slate-800 text-sm bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                {node.name}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Category
            </label>
            {isEditing ? (
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            ) : (
              <p className="font-medium text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                {node.category}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Description
            </label>
            {isEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 leading-normal">
                {node.description}
              </p>
            )}
          </div>

          {/* Capacity (Storage Node Only) */}
          {node.type === 'storage' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Storage Capacity Limit
              </label>
              {isEditing ? (
                <input
                  type="text"
                  placeholder="e.g. 50,000 Tons"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              ) : (
                <p className="font-bold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 flex justify-between">
                  <span>Capacity:</span>
                  <span className="text-indigo-600 bg-indigo-50/50 border border-indigo-100 px-1.5 py-0.5 rounded text-[10px]">
                    {capacity || 'Not Specified'}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Parallel Instance Details */}
          {node.equipmentType && (
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                Parallel Equipment Instance
              </span>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Type:</span>
                <span className="text-slate-800 font-bold">{node.equipmentType}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Instance Number:</span>
                <span className="text-indigo-600 font-extrabold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 text-[10px]">
                  {node.instanceId || '1'}
                </span>
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Current Operation Status
            </label>
            <div className="flex gap-1">
              {(['running', 'idle', 'stopped'] as NodeStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => onEdit(node.id, { status: st })}
                  className={`flex-1 py-1.5 border rounded-lg font-bold uppercase tracking-wider text-[9px] transition-all ${
                    node.status === st
                      ? st === 'running'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                        : st === 'idle'
                        ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-sm'
                        : 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Composite internal process toggle */}
        {node.type === 'composite' && (
          <div className="p-3.5 bg-violet-50 border border-violet-100 rounded-lg space-y-2">
            <div className="flex items-center gap-1.5 text-violet-800 font-bold">
              <FolderOpen className="w-4 h-4 text-violet-600" />
              <span>Sub-Process Container</span>
            </div>
            <p className="text-[10px] text-violet-600/90 leading-relaxed">
              This node holds its own internal flow graph representing the detailed chemical or thermal stages.
            </p>
            <button
              onClick={() => onViewSubprocess(node.id)}
              className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg transition-all shadow-sm text-center block"
            >
              Open Sub-Process
            </button>
          </div>
        )}

        {/* Connections */}
        <div className="space-y-3 pt-2">
          <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block border-b border-slate-100 pb-1">
            Process Connections ({incomingEdges.length + outgoingEdges.length})
          </span>

          {/* Inputs */}
          <div>
            <span className="text-slate-400 font-semibold text-[10px] block mb-1">
              Inputs / Upstream ({incomingEdges.length})
            </span>
            {incomingEdges.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic bg-slate-50/50 p-2 border border-dashed border-slate-200 rounded-lg">
                No active upstream inputs connected.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {incomingEdges.map((e) => (
                  <div
                    key={e.id}
                    className={`p-2 border rounded-lg flex items-center justify-between gap-1 shadow-sm ${getFlowColor(e.flowType)}`}
                  >
                    <span className="font-bold truncate max-w-[150px]">
                      {getSourceNodeName(e.source)}
                    </span>
                    {e.label && (
                      <span className="text-[8px] uppercase tracking-wider font-bold bg-white/70 px-1 py-0.5 rounded border border-slate-200">
                        {e.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outputs */}
          <div>
            <span className="text-slate-400 font-semibold text-[10px] block mb-1">
              Outputs / Downstream ({outgoingEdges.length})
            </span>
            {outgoingEdges.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic bg-slate-50/50 p-2 border border-dashed border-slate-200 rounded-lg">
                No active downstream outputs connected.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {outgoingEdges.map((e) => (
                  <div
                    key={e.id}
                    className={`p-2 border rounded-lg flex items-center justify-between gap-1 shadow-sm ${getFlowColor(e.flowType)}`}
                  >
                    <span className="font-bold truncate max-w-[150px]">
                      {getTargetNodeName(e.target)}
                    </span>
                    {e.label && (
                      <span className="text-[8px] uppercase tracking-wider font-bold bg-white/70 px-1 py-0.5 rounded border border-slate-200">
                        {e.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
        <button
          onClick={() => onDuplicate(node.id)}
          className="flex-1 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center gap-1.5 font-semibold text-slate-600 transition-colors shadow-sm"
        >
          <Copy className="w-3.5 h-3.5 text-slate-500" />
          <span>Duplicate</span>
        </button>

        {node.type !== 'composite' && (
          <button
            onClick={() => onMakeComposite(node.id)}
            title="Convert this node into a composite subprocess containing internal nodes"
            className="p-2 bg-white hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 border border-slate-200 rounded-lg flex items-center justify-center transition-colors shadow-sm"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={handleDeleteClick}
          className="py-2 px-3 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 rounded-lg flex items-center justify-center gap-1 font-semibold transition-colors shadow-sm"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};
