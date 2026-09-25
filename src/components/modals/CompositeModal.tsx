import React, { useState, useCallback, useEffect } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType
} from '@xyflow/react';
import type { Connection } from '@xyflow/react';
import { X, Sparkles, FolderSync, Info, Plus, Trash2, GitBranch, LayoutTemplate } from 'lucide-react';
import type { PlantNode, PlantEdge, CompositeProcess, FlowType, NodeType } from '../../types/plant';
import { nodeTypes } from '../graph/CustomNodes';
import { validateConnection } from '../../utils/graphValidation';
import dagre from '@dagrejs/dagre';

interface CompositeModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentNode: PlantNode | null;
  compositeProcess: CompositeProcess | null;
  onUpdateSubprocess?: (parentNodeId: string, nodes: PlantNode[], edges: PlantEdge[]) => void;
}

export const CompositeModal: React.FC<CompositeModalProps> = ({
  isOpen,
  onClose,
  parentNode,
  compositeProcess,
  onUpdateSubprocess,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

  // Internal state tracking for editing
  const [internalNodes, setInternalNodes] = useState<PlantNode[]>([]);
  const [internalEdges, setInternalEdges] = useState<PlantEdge[]>([]);
  const [selectedInternalId, setSelectedInternalId] = useState<string | null>(null);
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState<NodeType>('standard');
  const [newNodeCategory, setNewNodeCategory] = useState('Sub-Stage');
  const [activeFlowType, setActiveFlowType] = useState<FlowType>('material');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Sync internal state from props when modal opens
  useEffect(() => {
    if (isOpen && compositeProcess) {
      setInternalNodes(compositeProcess.nodes || []);
      setInternalEdges(compositeProcess.edges || []);
      setSelectedInternalId(null);
    }
  }, [isOpen, compositeProcess]);

  // Layout helper
  const layoutInternalGraph = useCallback((iNodes: PlantNode[], iEdges: PlantEdge[]) => {
    if (iNodes.length === 0) return [];

    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'LR', align: 'UL', ranksep: 60, nodesep: 40 });
    g.setDefaultEdgeLabel(() => ({}));

    iNodes.forEach((node) => {
      g.setNode(node.id, { width: 220, height: 100 });
    });

    iEdges.forEach((edge) => {
      g.setEdge(edge.source, edge.target, { id: edge.id });
    });

    dagre.layout(g);

    return iNodes.map((node) => {
      const pos = g.node(node.id);
      return {
        ...node,
        x: pos ? Math.round(pos.x - 110) : (node.x || 100),
        y: pos ? Math.round(pos.y - 50) : (node.y || 100),
      };
    });
  }, []);

  // Format nodes and edges for React Flow
  useEffect(() => {
    const formattedNodes = internalNodes.map((node) => ({
      id: node.id,
      type: node.type,
      data: {
        name: node.name,
        category: node.category,
        description: node.description,
        status: node.status,
        metadata: node.metadata,
      },
      position: { x: node.x ?? 100, y: node.y ?? 100 },
    }));

    const formattedEdges = internalEdges.map((edge) => {
      let edgeColor = '#94a3b8';
      if (edge.flowType === 'fuel') edgeColor = '#f97316';
      if (edge.flowType === 'air') edgeColor = '#0ea5e9';
      if (edge.flowType === 'alternative') edgeColor = '#a855f7';

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: 'default',
        className: edge.flowType !== 'material' ? 'edge-flow-animated' : '',
        animated: edge.flowType !== 'material',
        style: { stroke: edgeColor, strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
          width: 15,
          height: 15,
        },
      };
    });

    setNodes(formattedNodes);
    setEdges(formattedEdges);
  }, [internalNodes, internalEdges, setNodes, setEdges]);

  // Persist internal changes back to parent store
  const commitChanges = useCallback((updatedNodes: PlantNode[], updatedEdges: PlantEdge[]) => {
    setInternalNodes(updatedNodes);
    setInternalEdges(updatedEdges);
    if (parentNode && onUpdateSubprocess) {
      onUpdateSubprocess(parentNode.id, updatedNodes, updatedEdges);
    }
  }, [parentNode, onUpdateSubprocess]);

  // Drag stop handler inside modal — OnNodeDrag signature: (event, node, nodes)
  // Use the third argument `nodes` (all dragged nodes) and map position.x/y to
  // the internal PlantNode coordinate fields.
  const onNodeDragStop = useCallback((_evt: any, _node: any, nodes: any[]) => {
    const updated = internalNodes.map((node) => {
      const dragged = nodes.find((n: any) => n.id === node.id);
      if (dragged) {
        return { ...node, x: Math.round(dragged.position.x), y: Math.round(dragged.position.y) };
      }
      return node;
    });
    commitChanges(updated, internalEdges);
  }, [internalNodes, internalEdges, commitChanges]);

  // Delete node inside modal
  const handleDeleteSelectedNode = () => {
    if (!selectedInternalId) return;
    const updatedNodes = internalNodes.filter((n) => n.id !== selectedInternalId);
    const updatedEdges = internalEdges.filter((e) => e.source !== selectedInternalId && e.target !== selectedInternalId);
    setSelectedInternalId(null);
    commitChanges(updatedNodes, updatedEdges);
  };

  // Connect inside modal
  const onConnectInternal = (connection: Connection) => {
    if (!connection.source || !connection.target) return;
    const val = validateConnection({ source: connection.source, target: connection.target }, internalNodes, internalEdges);
    if (!val.isValid) {
      setValidationError(val.error || 'Invalid connection');
      setTimeout(() => setValidationError(null), 3000);
      return;
    }

    const newEdge: PlantEdge = {
      id: `kedge-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      source: connection.source,
      target: connection.target,
      flowType: activeFlowType,
    };
    commitChanges(internalNodes, [...internalEdges, newEdge]);
  };

  // React Flow edges delete
  const onEdgesDeleteInternal = (deletedEdges: any[]) => {
    const deletedIds = new Set(deletedEdges.map((e) => e.id));
    const updated = internalEdges.filter((e) => !deletedIds.has(e.id));
    commitChanges(internalNodes, updated);
  };

  // React Flow nodes delete via key action
  const onNodesDeleteInternal = (deletedNodes: any[]) => {
    const deletedIds = new Set(deletedNodes.map((n) => n.id));
    const updatedNodes = internalNodes.filter((n) => !deletedIds.has(n.id));
    const updatedEdges = internalEdges.filter((e) => !deletedIds.has(e.source) && !deletedIds.has(e.target));
    commitChanges(updatedNodes, updatedEdges);
  };

  // Auto Layout trigger
  const handleAutoLayout = () => {
    const layoutedNodes = layoutInternalGraph(internalNodes, internalEdges);
    commitChanges(layoutedNodes, internalEdges);
  };

  // Add internal node
  const handleAddInternalNode = () => {
    if (!newNodeName.trim()) return;
    const newId = `knode-${Date.now()}`;
    const newNode: PlantNode = {
      id: newId,
      name: newNodeName,
      type: newNodeType,
      category: newNodeCategory,
      description: 'Internal sub-process stage',
      status: 'running',
      parentId: parentNode?.id,
      x: 100 + Math.random() * 100,
      y: 100 + Math.random() * 100,
    };
    const updated = [...internalNodes, newNode];
    commitChanges(updated, internalEdges);
    setNewNodeName('');
    setIsAddNodeOpen(false);
  };

  // Create Example Process (Phase 15 requirement)
  const handleCreateExampleProcess = () => {
    if (!parentNode) return;
    const sampleNodes: PlantNode[] = [
      {
        id: `knode-in-${Date.now()}`,
        type: 'input',
        name: `${parentNode.name} Primary Feed`,
        category: 'Feed Stock',
        description: 'Raw materials or fuel inlet port.',
        status: 'running',
        parentId: parentNode.id,
        x: 50,
        y: 100,
      },
      {
        id: `knode-proc-${Date.now()}`,
        type: 'standard',
        name: 'Reaction / Chamber Stage',
        category: 'Thermal Unit',
        description: 'Main internal transformation step.',
        status: 'running',
        parentId: parentNode.id,
        x: 300,
        y: 100,
      },
      {
        id: `knode-out-${Date.now()}`,
        type: 'standard',
        name: 'Discharge & Cooling',
        category: 'Discharge',
        description: 'Cooled product exit stage.',
        status: 'running',
        parentId: parentNode.id,
        x: 550,
        y: 100,
      },
    ];

    const sampleEdges: PlantEdge[] = [
      {
        id: `kedge-1-${Date.now()}`,
        source: sampleNodes[0].id,
        target: sampleNodes[1].id,
        flowType: 'material',
      },
      {
        id: `kedge-2-${Date.now()}`,
        source: sampleNodes[1].id,
        target: sampleNodes[2].id,
        flowType: 'material',
      },
    ];

    commitChanges(sampleNodes, sampleEdges);
  };

  if (!isOpen || !parentNode) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 select-none animate-in fade-in duration-200">
      <div className="bg-slate-50 rounded-2xl border border-slate-200 shadow-2xl w-[90vw] h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-violet-100 border border-violet-200 rounded-lg text-violet-700 shadow-sm">
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <span>Internal Sub-Process: {parentNode.name}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                  Sub-Graph Editor
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-none">
                Inspect, add, connect, or re-arrange internal process stages.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddNodeOpen((prev) => !prev)}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Stage</span>
            </button>
            <button
              onClick={handleAutoLayout}
              className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-lg transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Auto Layout</span>
            </button>
            {selectedInternalId && (
              <button
                onClick={handleDeleteSelectedNode}
                className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-lg transition-all shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 active:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 border border-slate-200 transition-all shadow-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Validation error toast bar */}
        {validationError && (
          <div className="bg-red-600 text-white text-xs px-4 py-2 flex items-center justify-between">
            <span>{validationError}</span>
            <button onClick={() => setValidationError(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Flow Type selector bar inside modal */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-slate-600 text-[11px]">Connection Flow:</span>
            {(['material', 'fuel', 'air', 'alternative'] as FlowType[]).map((ft) => (
              <button
                key={ft}
                onClick={() => setActiveFlowType(ft)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                  activeFlowType === ft
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {ft}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-400">Drag handles to connect internal stages</span>
        </div>

        {/* Add internal node dropdown form */}
        {isAddNodeOpen && (
          <div className="bg-indigo-50 border-b border-indigo-100 p-3 flex items-center gap-3 animate-in slide-in-from-top-2 duration-150">
            <input
              type="text"
              placeholder="Stage Name (e.g. Cyclone Fan, Burner)"
              value={newNodeName}
              onChange={(e) => setNewNodeName(e.target.value)}
              className="px-3 py-1.5 border border-indigo-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 flex-1"
            />
            <select
              value={newNodeType}
              onChange={(e) => setNewNodeType(e.target.value as NodeType)}
              className="px-3 py-1.5 border border-indigo-200 rounded-lg text-xs font-medium text-slate-800 bg-white"
            >
              <option value="standard">Standard Equipment</option>
              <option value="storage">Storage</option>
              <option value="input">Input Feed</option>
            </select>
            <input
              type="text"
              placeholder="Category"
              value={newNodeCategory}
              onChange={(e) => setNewNodeCategory(e.target.value)}
              className="px-3 py-1.5 border border-indigo-200 rounded-lg text-xs font-medium text-slate-800 w-36"
            />
            <button
              onClick={handleAddInternalNode}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              Save Stage
            </button>
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 relative bg-slate-100">
          {internalNodes.length === 0 ? (
            /* Phase 15 Empty State Requirement */
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50">
              <div className="p-4 bg-violet-50 border border-violet-100 rounded-full text-violet-600 mb-4">
                <LayoutTemplate className="w-10 h-10" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">
                This composite process has no internal stages yet.
              </h3>
              <p className="text-slate-400 text-xs mt-1.5 max-w-md">
                Add internal equipment stages to model the granular flow inside "{parentNode.name}".
              </p>
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setIsAddNodeOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Internal Node</span>
                </button>
                <button
                  onClick={handleCreateExampleProcess}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <span>Create Example Process</span>
                </button>
              </div>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeDragStop={onNodeDragStop}
              onConnect={onConnectInternal}
              onNodesDelete={onNodesDeleteInternal}
              onEdgesDelete={onEdgesDeleteInternal}
              onNodeClick={(_, node) => setSelectedInternalId(node.id)}
              nodeTypes={nodeTypes}
              fitView
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#cbd5e1" gap={16} size={1} />
              <Controls className="!bg-white !border-slate-200 !shadow-md !rounded-lg" />
              <MiniMap className="!border-slate-200 !shadow-md !rounded-lg" />
            </ReactFlow>
          )}
        </div>

        {/* Modal Info Banner */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <span>
              All modifications inside this sub-graph are synchronized directly with the plant data model.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 active:bg-black text-white font-bold rounded-lg transition-all shadow-sm"
          >
            Done Editing
          </button>
        </div>
      </div>
    </div>
  );
};
