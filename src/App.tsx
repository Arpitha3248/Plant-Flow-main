import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  useNodesState,
  useEdgesState,
  MarkerType
} from '@xyflow/react';
import type { Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useSearchParams, BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute, RoleGuard } from './auth/ProtectedRoute';
import { useAuth } from './auth/AuthContext';
import { usePlantState } from './hooks/usePlantState';
import { nodeTypes } from './components/graph/CustomNodes';
import { Header } from './components/Header';
import { Sidebar } from './components/panels/Sidebar';
import { DetailsPanel } from './components/panels/DetailsPanel';
import { GraphToolbar } from './components/toolbar/GraphToolbar';
import { AddNodeModal, AddParallelModal } from './components/modals/AddNodeModal';
import { CompositeModal } from './components/modals/CompositeModal';
import { ToastContainer } from './components/common/Toast';
import { LoginPage } from './pages/LoginPage';
import { AdminLayout } from './admin/AdminLayout';
import { AdminDashboard } from './admin/pages/AdminDashboard';
import { PlantsPage } from './admin/pages/PlantsPage';
import { EquipmentPage, EquipmentStatusPage } from './admin/pages/EquipmentPage';
import { UsersPage } from './admin/pages/UsersPage';
import { RolesPage } from './admin/pages/RolesPage';
import { AuditLogsPage } from './admin/pages/AuditLogsPage';
import { ImportExportPage } from './admin/pages/ImportExportPage';
import { SettingsPage, SecurityPage, AboutPage } from './admin/pages/SettingsPage';
import type { PlantNode, FlowType } from './types/plant';
import { ArrowLeft, GitBranch, ChevronRight, Factory } from 'lucide-react';
import dagre from '@dagrejs/dagre';

function FlowCanvas() {
  const { session } = useAuth();
  const [searchParams] = useSearchParams();

  const userContext = session
    ? { userId: session.userId, role: session.role }
    : undefined;

  const {
    plants,
    currentPlantId,
    activePlant,
    drillDownPath,
    nestedViewMode,
    selectedNodeId,
    toasts,
    canUndo,
    canRedo,
    dismissToast,
    setNestedViewMode,
    setDrillDownPath,
    setSelectedNodeId,
    selectPlant,
    resetDemo,
    clearCanvas,
    getActiveGraph,
    updateNodePositions,
    persistPositions,
    addNode,
    editNode,
    duplicateNode,
    deleteNode,
    addParallelEquipment,
    addConnection,
    deleteConnection,
    undo,
    redo,
    importJSON,
    exportJSON,
    makeNodeComposite,
    updateCompositeProcessGraph,
  } = usePlantState(userContext);

  // Navigate to a specific plant from admin dashboard (runs once on mount only)
  useEffect(() => {
    const plantParam = searchParams.get('plant');
    if (plantParam && plants[plantParam]) {
      selectPlant(plantParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [isAddParallelOpen, setIsAddParallelOpen] = useState(false);
  const [isConnectingMode, setIsConnectingMode] = useState(false);

  const { screenToFlowPosition } = useReactFlow();

  const [isSubprocessOpen, setIsSubprocessOpen] = useState(false);
  const [subprocessParent, setSubprocessParent] = useState<PlantNode | null>(null);

  const [activeFlowType, setActiveFlowType] = useState<FlowType>('material');
  const [activeEdgeLabel, setActiveEdgeLabel] = useState('');

  // Electron window title
  useEffect(() => {
    if (window.desktopAPI && activePlant?.name) {
      window.desktopAPI.setWindowTitle(activePlant.name);
    }
  }, [activePlant?.name]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'n') { e.preventDefault(); selectPlant('empty-plant'); }
        else if (e.key.toLowerCase() === 'o') { e.preventDefault(); importJSON(); }
        else if (e.key.toLowerCase() === 's') { e.preventDefault(); exportJSON(); }
        else if (e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
        else if (e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectPlant, importJSON, exportJSON, undo, redo]);

  // ── Active graph ──────────────────────────────────────────────────────────
  // Memoize to stable references so downstream effects only re-run when
  // content actually changes, not on every render.
  const { nodes: rawActiveNodes, edges: rawActiveEdges } = getActiveGraph();

  // Stable node/edge arrays — only change identity when IDs or content change
  const activeNodeIds = rawActiveNodes.map((n) => n.id).join(',');
  const activeEdgeIds = rawActiveEdges.map((e) => e.id).join(',');

  const activeNodes = useMemo(
    () => rawActiveNodes,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeNodeIds, JSON.stringify(rawActiveNodes)]
  );
  const activeEdges = useMemo(
    () => rawActiveEdges,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeEdgeIds, JSON.stringify(rawActiveEdges)]
  );

  // Local React Flow state
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<any>([]);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState<any>([]);

  // ── Auto Layout ───────────────────────────────────────────────────────────
  const onAutoLayout = useCallback(() => {
    if (activeNodes.length === 0) return;

    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'LR', align: 'UL', ranksep: 75, nodesep: 55 });
    g.setDefaultEdgeLabel(() => ({}));

    activeNodes.forEach((node) => {
      const width = node.type === 'input' ? 208 : (node.type === 'storage' ? 240 : 256);
      const height = node.type === 'input' ? 80 : (node.type === 'storage' ? 140 : 130);
      g.setNode(node.id, { width, height });
    });
    activeEdges.forEach((edge) => {
      g.setEdge(edge.source, edge.target, { id: edge.id });
    });

    dagre.layout(g);

    const laid = activeNodes.map((node) => {
      const pos = g.node(node.id);
      const width = node.type === 'input' ? 208 : (node.type === 'storage' ? 240 : 256);
      const height = node.type === 'input' ? 80 : (node.type === 'storage' ? 140 : 130);
      return {
        id: node.id,
        x: pos ? Math.round(pos.x - width / 2) : (node.x || 100),
        y: pos ? Math.round(pos.y - height / 2) : (node.y || 100),
      };
    });

    updateNodePositions(laid);
  }, [activeNodes, activeEdges, updateNodePositions]);

  // Initial layout guard — use a ref so the effect dependency list never
  // changes shape; we only want this to fire when the plant/path changes
  // or when nodes first appear, not on every re-render.
  const initialLayoutDoneRef = useRef<Record<string, boolean>>({});
  const onAutoLayoutRef = useRef(onAutoLayout);
  onAutoLayoutRef.current = onAutoLayout;

  useEffect(() => {
    if (activeNodes.length === 0) return;
    const pathKey = `${currentPlantId}:${drillDownPath.join('>')}`;
    const needsLayout = activeNodes.some((n) => typeof n.x !== 'number' || typeof n.y !== 'number');
    if (!initialLayoutDoneRef.current[pathKey]) {
      initialLayoutDoneRef.current[pathKey] = true;
      if (needsLayout) onAutoLayoutRef.current();
    }
  // Intentionally omit onAutoLayout — accessed via stable ref above.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlantId, drillDownPath, activeNodeIds]);

  // ── Stable onViewSubprocess callback (must not live inside the sync effect) ──
  const nestedViewModeRef = useRef(nestedViewMode);
  nestedViewModeRef.current = nestedViewMode;
  const activePlantRef = useRef(activePlant);
  activePlantRef.current = activePlant;

  const onViewSubprocess = useCallback((nodeId: string) => {
    const targetNode = activePlantRef.current.nodes.find((n) => n.id === nodeId)
      ?? Object.values(activePlantRef.current.compositeProcesses)
           .flatMap((c) => c.nodes)
           .find((n) => n.id === nodeId);
    if (!targetNode) return;

    if (nestedViewModeRef.current === 'expandable') {
      setSubprocessParent(targetNode);
      setIsSubprocessOpen(true);
      // Only initialise composite if it doesn't already exist
      if (!activePlantRef.current.compositeProcesses[nodeId]) {
        updateCompositeProcessGraph(nodeId, [], []);
      }
    } else {
      setDrillDownPath((prev) => [...prev, nodeId]);
      setSelectedNodeId(null);
    }
  }, [updateCompositeProcessGraph, setDrillDownPath, setSelectedNodeId]);

  // ── Sync activeNodes/activeEdges → React Flow local state ─────────────────
  // Key fix: do NOT include activePlant or updateCompositeProcessGraph in deps.
  // Those are only used by the stable onViewSubprocess callback above.
  // Including them was the cause of the infinite update loop.
  useEffect(() => {
    const formattedNodes = activeNodes.map((node) => ({
      id: node.id,
      type: node.type,
      data: {
        name: node.name,
        category: node.category,
        description: node.description,
        status: node.status,
        instanceId: node.instanceId,
        equipmentType: node.equipmentType,
        metadata: node.metadata,
        onViewSubprocess,
      },
      position: { x: node.x ?? 100, y: node.y ?? 100 },
    }));

    const formattedEdges = activeEdges.map((edge) => {
      let edgeColor = '#475569';
      if (edge.flowType === 'fuel') edgeColor = '#f97316';
      if (edge.flowType === 'air') edgeColor = '#0ea5e9';
      if (edge.flowType === 'alternative') edgeColor = '#a855f7';
      const isSpecialFlow = edge.flowType !== 'material';
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: 'default',
        animated: isSpecialFlow,
        className: isSpecialFlow ? 'edge-flow-animated' : '',
        style: { stroke: edgeColor, strokeWidth: 2.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor, width: 14, height: 14 },
      };
    });

    setFlowNodes(formattedNodes);
    setFlowEdges(formattedEdges);
  // Only re-run when node/edge content or the stable callback changes.
  // activePlant and updateCompositeProcessGraph are intentionally excluded —
  // they are accessed via refs in onViewSubprocess to avoid loops.
  }, [activeNodes, activeEdges, onViewSubprocess, setFlowNodes, setFlowEdges]);

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const dataStr = event.dataTransfer.getData('application/reactflow');
    if (!dataStr) return;
    try {
      const itemData = JSON.parse(dataStr);
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const newId = addNode({
        type: itemData.type,
        name: itemData.name,
        category: itemData.category,
        description: itemData.description,
        status: 'running',
        isComposite: itemData.type === 'composite',
      });
      setTimeout(() => {
        updateNodePositions([{ id: newId, x: Math.round(position.x), y: Math.round(position.y) }]);
      }, 50);
    } catch (e) {
      console.error('Failed to drop item', e);
    }
  }, [screenToFlowPosition, addNode, updateNodePositions]);

  // ── Connections ───────────────────────────────────────────────────────────
  const onConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target) {
      addConnection({
        source: connection.source,
        target: connection.target,
        flowType: activeFlowType,
        label: activeEdgeLabel,
      });
      setActiveEdgeLabel('');
    }
  }, [activeFlowType, activeEdgeLabel, addConnection]);

  // ── Delete handlers ───────────────────────────────────────────────────────
  const onNodesDelete = useCallback((deletedNodes: any[]) => {
    deletedNodes.forEach((node) => deleteNode(node.id));
  }, [deleteNode]);

  const onEdgesDelete = useCallback((deletedEdges: any[]) => {
    deletedEdges.forEach((edge) => deleteConnection(edge.id));
  }, [deleteConnection]);

  // ── Node interaction ──────────────────────────────────────────────────────
  const onNodeClick = useCallback((_: React.MouseEvent, node: any) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: any) => {
    const targetNode = activeNodes.find((n) => n.id === node.id);
    if (targetNode?.type === 'composite') {
      if (nestedViewMode === 'drilldown') {
        setDrillDownPath((prev) => [...prev, node.id]);
        setSelectedNodeId(null);
      } else {
        setSubprocessParent(targetNode);
        setIsSubprocessOpen(true);
      }
    }
  }, [activeNodes, nestedViewMode, setDrillDownPath, setSelectedNodeId]);

  // Drag stop — OnNodeDrag signature: (event, node, nodes)
  const onNodesDragStop = useCallback((_evt: any, _node: any, nodes: any[]) => {
    const positions = nodes.map((n: any) => ({
      id: n.id,
      x: Math.round(n.position.x),
      y: Math.round(n.position.y),
    }));
    updateNodePositions(positions);
    persistPositions();
  }, [updateNodePositions, persistPositions]);

  // ── Breadcrumb nav ────────────────────────────────────────────────────────
  const renderBreadcrumbHierarchy = () => {
    if (drillDownPath.length <= 1) return null;

    const pathItems: { id: string; name: string }[] = [
      { id: 'root', name: activePlant.name || 'Plant Graph' },
    ];

    for (let i = 1; i < drillDownPath.length; i++) {
      const parentId = drillDownPath[i];
      let name = 'Composite Process';
      const foundRoot = activePlant.nodes.find((n) => n.id === parentId);
      if (foundRoot) {
        name = foundRoot.name;
      } else {
        for (const comp of Object.values(activePlant.compositeProcesses)) {
          const found = comp.nodes.find((n) => n.id === parentId);
          if (found) { name = found.name; break; }
        }
      }
      pathItems.push({ id: parentId, name });
    }

    return (
      <div className="absolute top-20 left-6 z-10 flex items-center gap-1.5 p-2 bg-white/95 backdrop-blur border border-slate-200 shadow-md rounded-xl text-xs font-semibold text-slate-700">
        <button
          onClick={() => { setDrillDownPath((prev) => prev.slice(0, -1)); setSelectedNodeId(null); }}
          className="flex items-center gap-1 px-2 py-1 hover:bg-slate-100 rounded-lg text-indigo-600 transition-colors mr-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
        <span className="text-slate-300">|</span>
        {pathItems.map((item, idx) => {
          const isLast = idx === pathItems.length - 1;
          return (
            <React.Fragment key={`${item.id}-${idx}`}>
              {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-400" />}
              <button
                onClick={() => { setDrillDownPath(drillDownPath.slice(0, idx + 1)); setSelectedNodeId(null); }}
                disabled={isLast}
                className={`px-2 py-1 rounded-md transition-all ${
                  isLast
                    ? 'text-indigo-600 font-extrabold bg-indigo-50 border border-indigo-100'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {item.name}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const handleAddNodeDirectly = (data: {
    type: string; name: string; category: string;
    description: string; status: any; isComposite?: boolean;
  }) => { addNode(data as any); };

  const selectedCompositeProcess = useMemo(() => {
    if (!subprocessParent) return null;
    return activePlant.compositeProcesses[subprocessParent.id] || null;
  }, [subprocessParent, activePlant]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      <Header
        plants={plants}
        currentPlantId={currentPlantId}
        onSelectPlant={selectPlant}
        onSaveLocally={persistPositions}
        onResetDemo={resetDemo}
        onClearCanvas={clearCanvas}
        onExportJSON={exportJSON}
        onImportJSON={importJSON}
        nestedViewMode={nestedViewMode}
        onSetNestedViewMode={setNestedViewMode}
        drillDownPath={drillDownPath}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>
        <Sidebar onAddNode={handleAddNodeDirectly} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', background: '#f8fafc', minWidth: 0, minHeight: 0 }}>
          {renderBreadcrumbHierarchy()}

          {isConnectingMode && (
            <div className="absolute top-20 right-6 z-10 p-3 bg-white/95 backdrop-blur border border-amber-200 shadow-md rounded-xl w-60 space-y-2.5">
              <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs">
                <GitBranch className="w-4 h-4" />
                <span>Link Settings</span>
              </div>
              <div className="space-y-1.5 text-[10px]">
                <label className="block text-slate-400 font-bold uppercase tracking-wider">Select Flow Type</label>
                <div className="grid grid-cols-2 gap-1 font-semibold">
                  {[
                    { type: 'material', label: 'Material' },
                    { type: 'fuel', label: 'Fuel' },
                    { type: 'air', label: 'Air' },
                    { type: 'alternative', label: 'Alt Mat' },
                  ].map((flow) => (
                    <button
                      key={flow.type}
                      type="button"
                      onClick={() => setActiveFlowType(flow.type as FlowType)}
                      className={`py-1 border rounded-lg transition-all ${
                        activeFlowType === flow.type
                          ? flow.type === 'fuel' ? 'bg-orange-50 border-orange-500 text-orange-700'
                            : flow.type === 'air' ? 'bg-sky-50 border-sky-500 text-sky-700'
                            : flow.type === 'alternative' ? 'bg-purple-50 border-purple-500 text-purple-700'
                            : 'bg-slate-100 border-slate-600 text-slate-800'
                          : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {flow.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1 text-[10px]">
                <label className="block text-slate-400 font-bold uppercase tracking-wider">Link Label (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Coal Feed, 1450C Stream"
                  value={activeEdgeLabel}
                  onChange={(e) => setActiveEdgeLabel(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <p className="text-[9px] text-amber-600/90 leading-tight">
                Now drag links from a node's handle to another node. Click "Add Link" in toolbar to turn off.
              </p>
            </div>
          )}

          <GraphToolbar
            onAutoLayout={onAutoLayout}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onAddNode={() => setIsAddNodeOpen(true)}
            onAddParallel={() => setIsAddParallelOpen(true)}
            onAddConnection={() => setIsConnectingMode((prev) => !prev)}
            isConnectingMode={isConnectingMode}
          />

          <div style={{ flex: 1, width: '100%', minHeight: 0, position: 'relative' }} onDragOver={onDragOver} onDrop={onDrop}>
            {flowNodes.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50 select-none">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 mb-4 animate-bounce">
                  <Factory className="w-10 h-10" />
                </div>
                <h2 className="font-extrabold text-slate-800 text-base">Start building your plant</h2>
                <p className="text-slate-400 text-xs mt-1.5 max-w-sm leading-normal">
                  No equipment exists on the canvas. Drag items from the library on the left, or use the buttons below.
                </p>
                <div className="flex items-center gap-3 mt-5">
                  <button
                    onClick={() => setIsAddNodeOpen(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                  >
                    Add Process Node
                  </button>
                  <button
                    onClick={() => setIsAddParallelOpen(true)}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl shadow-sm transition-all"
                  >
                    Add Parallel Equipment
                  </button>
                </div>
              </div>
            ) : (
              <ReactFlow
                nodes={flowNodes}
                edges={flowEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodesDelete={onNodesDelete}
                onEdgesDelete={onEdgesDelete}
                onNodeDragStop={onNodesDragStop}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onNodeDoubleClick={onNodeDoubleClick}
                nodeTypes={nodeTypes}
                fitView
                proOptions={{ hideAttribution: true }}
                className="select-none font-sans"
              >
                <Background color="#cbd5e1" gap={16} size={1} />
                <Controls className="!bg-white !border-slate-200 !shadow-md !rounded-lg" />
                <MiniMap
                  className="!border-slate-200 !shadow-md !rounded-lg"
                  nodeColor={(node) => {
                    if (node.type === 'composite') return '#8b5cf6';
                    if (node.type === 'storage') return '#475569';
                    if (node.type === 'input') return '#f97316';
                    return '#3b82f6';
                  }}
                />
              </ReactFlow>
            )}
          </div>
        </div>

        <DetailsPanel
          selectedNodeId={selectedNodeId}
          nodes={activeNodes}
          edges={activeEdges}
          onClose={() => setSelectedNodeId(null)}
          onEdit={editNode}
          onDelete={deleteNode}
          onDuplicate={duplicateNode}
          onMakeComposite={makeNodeComposite}
          onViewSubprocess={(nodeId) => {
            const targetNode = activeNodes.find((n) => n.id === nodeId);
            if (!targetNode) return;
            if (nestedViewMode === 'expandable') {
              setSubprocessParent(targetNode);
              setIsSubprocessOpen(true);
            } else {
              setDrillDownPath((prev) => [...prev, nodeId]);
              setSelectedNodeId(null);
            }
          }}
        />
      </div>

      <AddNodeModal
        isOpen={isAddNodeOpen}
        onClose={() => setIsAddNodeOpen(false)}
        onAdd={handleAddNodeDirectly}
      />
      <AddParallelModal
        isOpen={isAddParallelOpen}
        onClose={() => setIsAddParallelOpen(false)}
        onAdd={addParallelEquipment}
      />
      <CompositeModal
        isOpen={isSubprocessOpen}
        onClose={() => { setIsSubprocessOpen(false); setSubprocessParent(null); }}
        parentNode={subprocessParent}
        compositeProcess={selectedCompositeProcess}
        onUpdateSubprocess={updateCompositeProcessGraph}
      />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// ── PlantFlow Designer route wrapper ─────────────────────────────────────────
function PlantFlowDesigner() {
  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <ReactFlowProvider>
        <FlowCanvas />
      </ReactFlowProvider>
    </div>
  );
}

// ── Root application with full routing ───────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <RoleRedirect />
                </ProtectedRoute>
              }
            />
            <Route
              path="/plantflow"
              element={
                <ProtectedRoute>
                  <PlantFlowDesigner />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <RoleGuard requiredRole="ADMIN">
                    <AdminLayout />
                  </RoleGuard>
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="plants" element={<PlantsPage />} />
              <Route path="equipment" element={<EquipmentPage />} />
              <Route path="equipment-status" element={<EquipmentStatusPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="roles" element={<RolesPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="import-export" element={<ImportExportPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="security" element={<SecurityPage />} />
              <Route path="about" element={<AboutPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Redirect root based on role
function RoleRedirect() {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  return <Navigate to={session.role === 'ADMIN' ? '/admin' : '/plantflow'} replace />;
}
