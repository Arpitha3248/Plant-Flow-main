import { useState, useCallback } from 'react';
import type { Plant, PlantNode, PlantEdge, CompositeProcess, FlowType, EquipmentDefinition, ToastMessage } from '../types/plant';
import { INITIAL_PLANTS } from '../data/cementPlantDemo';
import { validatePlantData } from '../utils/plantValidation';
import { validateConnection } from '../utils/graphValidation';
import { storageService } from '../services/storageService';

interface HistoryState {
  nodes: PlantNode[];
  edges: PlantEdge[];
  compositeProcesses: Record<string, CompositeProcess>;
}

// ---- Optional auth context for user-namespaced storage -------------------
export interface PlantStateUserContext {
  userId: string;
  role: string;
}

export function usePlantState(userContext?: PlantStateUserContext) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Safe storage read — use user-namespaced key when a user context is provided
  const [plants, setPlants] = useState<Record<string, Plant>>(() => {
    if (userContext) {
      return storageService.loadPlantsForUser(userContext.userId, userContext.role);
    }
    return storageService.loadPlants();
  });

  const [currentPlantId, setCurrentPlantId] = useState<string>('cement-plant');
  
  // Drill down path tracking. e.g., ['root'] or ['root', 'node-kiln'] or ['root', 'node-kiln', 'sub-node']
  const [drillDownPath, setDrillDownPath] = useState<string[]>(['root']);
  const [nestedViewMode, setNestedViewMode] = useState<'expandable' | 'drilldown'>('drilldown');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Undo/Redo stacks for the current plant
  const [undoStack, setUndoStack] = useState<HistoryState[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryState[]>([]);

  const activePlant = plants[currentPlantId] || INITIAL_PLANTS['empty-plant'];

  // Synchronous storage saver — routes to user-namespaced key when context provided
  const saveToLocalStorage = useCallback((updatedPlants: Record<string, Plant>) => {
    if (userContext) {
      storageService.savePlantsForUser(userContext.userId, userContext.role, updatedPlants);
    } else {
      storageService.savePlants(updatedPlants);
    }
  }, [userContext]);

  // Helper to save current state to undo history
  const pushToHistory = useCallback((nodes: PlantNode[], edges: PlantEdge[], compositeProcesses: Record<string, CompositeProcess>) => {
    setUndoStack((prev) => [...prev, {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      compositeProcesses: JSON.parse(JSON.stringify(compositeProcesses)),
    }]);
    setRedoStack([]); // Clear redo stack on new action
  }, []);

  // Get active graph at current drillDownPath depth
  const getActiveGraph = useCallback(() => {
    if (drillDownPath.length === 1) {
      return {
        nodes: activePlant.nodes || [],
        edges: activePlant.edges || [],
        isRoot: true,
        parentNodeId: null,
      };
    } else {
      const parentNodeId = drillDownPath[drillDownPath.length - 1];
      const compProcess = activePlant.compositeProcesses[parentNodeId];
      return {
        nodes: compProcess?.nodes || [],
        edges: compProcess?.edges || [],
        isRoot: false,
        parentNodeId,
      };
    }
  }, [activePlant, drillDownPath]);

  // Helper to safely update plant state and localStorage simultaneously
  const updatePlantState = useCallback((
    updater: (prevPlant: Plant) => Plant | { nodes: PlantNode[]; edges: PlantEdge[]; compositeProcesses: Record<string, CompositeProcess> }
  ) => {
    setPlants((prev) => {
      const current = prev[currentPlantId] || INITIAL_PLANTS['empty-plant'];
      const updated = updater(current);
      const newPlants = {
        ...prev,
        [currentPlantId]: {
          ...current,
          ...updated,
        },
      };
      saveToLocalStorage(newPlants);
      return newPlants;
    });
  }, [currentPlantId, saveToLocalStorage]);

  // Update node positions (Phase 3 & 4)
  const updateNodePositions = useCallback((updatedFlowNodes: { id: string; x: number; y: number }[]) => {
    updatePlantState((plant) => {
      if (drillDownPath.length === 1) {
        const newNodes = plant.nodes.map((node) => {
          const flowNode = updatedFlowNodes.find((n) => n.id === node.id);
          if (flowNode) {
            return { ...node, x: flowNode.x, y: flowNode.y };
          }
          return node;
        });
        return { ...plant, nodes: newNodes };
      } else {
        const parentId = drillDownPath[drillDownPath.length - 1];
        const compProcess = plant.compositeProcesses[parentId];
        if (!compProcess) return plant;

        const newNodes = compProcess.nodes.map((node) => {
          const flowNode = updatedFlowNodes.find((n) => n.id === node.id);
          if (flowNode) {
            return { ...node, x: flowNode.x, y: flowNode.y };
          }
          return node;
        });

        return {
          ...plant,
          compositeProcesses: {
            ...plant.compositeProcesses,
            [parentId]: { ...compProcess, nodes: newNodes },
          },
        };
      }
    });
  }, [drillDownPath, updatePlantState]);

  // Explicit persistence confirmation — shows a toast. Every mutation that goes
  // through updatePlantState already auto-saves to localStorage immediately, so
  // no extra write is needed here. Calling saveToLocalStorage(plants) from a
  // useCallback closure would read stale state after a concurrent setPlants call.
  const persistPositions = useCallback(() => {
    addToast('success', 'Plant layout and process data saved locally.');
  }, [addToast]);

  // Add a single node
  const addNode = useCallback((nodeData: Omit<PlantNode, 'id'>) => {
    pushToHistory(activePlant.nodes, activePlant.edges, activePlant.compositeProcesses);

    const newId = `node-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const newNode: PlantNode = {
      ...nodeData,
      id: newId,
      x: nodeData.x ?? (150 + Math.random() * 50),
      y: nodeData.y ?? (150 + Math.random() * 50),
    };

    updatePlantState((plant) => {
      if (drillDownPath.length === 1) {
        return { ...plant, nodes: [...plant.nodes, newNode] };
      } else {
        const parentId = drillDownPath[drillDownPath.length - 1];
        const compProcess = plant.compositeProcesses[parentId] || {
          id: `process-${parentId}`,
          parentNodeId: parentId,
          nodes: [],
          edges: [],
        };
        const updatedNodes = [...compProcess.nodes, { ...newNode, parentId }];
        return {
          ...plant,
          compositeProcesses: {
            ...plant.compositeProcesses,
            [parentId]: { ...compProcess, nodes: updatedNodes },
          },
        };
      }
    });

    addToast('success', `Added node "${newNode.name}".`);
    return newId;
  }, [drillDownPath, activePlant, pushToHistory, updatePlantState, addToast]);

  // Edit a node
  const editNode = useCallback((nodeId: string, updates: Partial<PlantNode>) => {
    pushToHistory(activePlant.nodes, activePlant.edges, activePlant.compositeProcesses);

    updatePlantState((plant) => {
      if (drillDownPath.length === 1) {
        const updatedNodes = plant.nodes.map((node) =>
          node.id === nodeId ? { ...node, ...updates } : node
        );
        return { ...plant, nodes: updatedNodes };
      } else {
        const parentId = drillDownPath[drillDownPath.length - 1];
        const compProcess = plant.compositeProcesses[parentId];
        if (!compProcess) return plant;

        const updatedNodes = compProcess.nodes.map((node) =>
          node.id === nodeId ? { ...node, ...updates } : node
        );
        return {
          ...plant,
          compositeProcesses: {
            ...plant.compositeProcesses,
            [parentId]: { ...compProcess, nodes: updatedNodes },
          },
        };
      }
    });

    addToast('info', 'Equipment details updated.');
  }, [drillDownPath, activePlant, pushToHistory, updatePlantState, addToast]);

  // Duplicate a node
  const duplicateNode = useCallback((nodeId: string) => {
    const { nodes } = getActiveGraph();
    const sourceNode = nodes.find((n) => n.id === nodeId);
    if (!sourceNode) return;

    pushToHistory(activePlant.nodes, activePlant.edges, activePlant.compositeProcesses);

    const newId = `node-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const duplicatedNode: PlantNode = {
      ...sourceNode,
      id: newId,
      name: `${sourceNode.name} (Copy)`,
      x: (sourceNode.x || 100) + 40,
      y: (sourceNode.y || 100) + 40,
    };

    updatePlantState((plant) => {
      if (drillDownPath.length === 1) {
        const updatedNodes = [...plant.nodes, duplicatedNode];
        const updatedComposites = { ...plant.compositeProcesses };
        if (sourceNode.isComposite && plant.compositeProcesses[nodeId]) {
          const originalSub = plant.compositeProcesses[nodeId];
          updatedComposites[newId] = {
            ...originalSub,
            id: `process-${newId}`,
            parentNodeId: newId,
            nodes: originalSub.nodes.map((n) => ({
              ...n,
              id: `knode-${newId}-${Date.now()}-${Math.random().toString(36).substring(2, 4)}`,
              parentId: newId,
            })),
            edges: originalSub.edges.map((e) => ({
              ...e,
              id: `kedge-${newId}-${Date.now()}-${Math.random().toString(36).substring(2, 4)}`,
            })),
          };
        }
        return { ...plant, nodes: updatedNodes, compositeProcesses: updatedComposites };
      } else {
        const parentId = drillDownPath[drillDownPath.length - 1];
        const compProcess = plant.compositeProcesses[parentId];
        if (!compProcess) return plant;

        const updatedNodes = [...compProcess.nodes, duplicatedNode];
        return {
          ...plant,
          compositeProcesses: {
            ...plant.compositeProcesses,
            [parentId]: { ...compProcess, nodes: updatedNodes },
          },
        };
      }
    });

    setSelectedNodeId(newId);
    addToast('success', `Duplicated "${sourceNode.name}".`);
  }, [drillDownPath, activePlant, getActiveGraph, pushToHistory, updatePlantState, addToast]);

  // Delete a node and its connected edges
  const deleteNode = useCallback((nodeId: string) => {
    pushToHistory(activePlant.nodes, activePlant.edges, activePlant.compositeProcesses);

    updatePlantState((plant) => {
      if (drillDownPath.length === 1) {
        const updatedNodes = plant.nodes.filter((n) => n.id !== nodeId);
        const updatedEdges = plant.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
        const updatedComposites = { ...plant.compositeProcesses };
        delete updatedComposites[nodeId];

        return {
          ...plant,
          nodes: updatedNodes,
          edges: updatedEdges,
          compositeProcesses: updatedComposites,
        };
      } else {
        const parentId = drillDownPath[drillDownPath.length - 1];
        const compProcess = plant.compositeProcesses[parentId];
        if (!compProcess) return plant;

        const updatedNodes = compProcess.nodes.filter((n) => n.id !== nodeId);
        const updatedEdges = compProcess.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);

        return {
          ...plant,
          compositeProcesses: {
            ...plant.compositeProcesses,
            [parentId]: { ...compProcess, nodes: updatedNodes, edges: updatedEdges },
          },
        };
      }
    });

    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
    addToast('info', 'Equipment node removed.');
  }, [drillDownPath, selectedNodeId, activePlant, pushToHistory, updatePlantState, addToast]);

  // Generic Parallel Equipment Creation (Phase 8 & 9)
  const addParallelEquipment = useCallback((equipmentDef: EquipmentDefinition, count: number) => {
    // Validate count range
    if (count < 2 || count > 10) {
      addToast('error', 'Parallel instance count must be between 2 and 10.');
      return;
    }

    pushToHistory(activePlant.nodes, activePlant.edges, activePlant.compositeProcesses);

    const newNodes: PlantNode[] = [];
    const baseId = `node-${Date.now()}`;
    const startX = 250;
    const startY = 150;

    for (let i = 1; i <= count; i++) {
      newNodes.push({
        id: `${baseId}-inst-${i}`,
        type: equipmentDef.nodeType,
        name: `${equipmentDef.name} ${i}`,
        category: equipmentDef.category,
        description: equipmentDef.description || `Parallel instance ${i} of ${equipmentDef.name}.`,
        status: 'running',
        equipmentType: equipmentDef.name,
        instanceId: `${i}`,
        x: startX,
        y: startY + (i - 1) * 120,
      });
    }

    updatePlantState((plant) => {
      if (drillDownPath.length === 1) {
        return { ...plant, nodes: [...plant.nodes, ...newNodes] };
      } else {
        const parentId = drillDownPath[drillDownPath.length - 1];
        const compProcess = plant.compositeProcesses[parentId] || {
          id: `process-${parentId}`,
          parentNodeId: parentId,
          nodes: [],
          edges: [],
        };
        const updatedNodes = [...compProcess.nodes, ...newNodes.map((n) => ({ ...n, parentId }))];
        return {
          ...plant,
          compositeProcesses: {
            ...plant.compositeProcesses,
            [parentId]: { ...compProcess, nodes: updatedNodes },
          },
        };
      }
    });

    addToast('success', `Created ${count} parallel instances of ${equipmentDef.name}.`);
  }, [drillDownPath, activePlant, pushToHistory, updatePlantState, addToast]);

  // Add Edge connection with Graph Validation (Phase 6 & 7)
  const addConnection = useCallback((connection: { source: string; target: string; flowType?: FlowType; label?: string }) => {
    const { nodes: activeNodes, edges: activeEdges } = getActiveGraph();

    // Validate connection
    const val = validateConnection(connection, activeNodes, activeEdges);
    if (!val.isValid) {
      addToast('error', val.error || 'Invalid connection request.');
      return false;
    }

    pushToHistory(activePlant.nodes, activePlant.edges, activePlant.compositeProcesses);

    const newEdge: PlantEdge = {
      id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      source: connection.source,
      target: connection.target,
      label: connection.label || '',
      flowType: connection.flowType || 'material',
    };

    updatePlantState((plant) => {
      if (drillDownPath.length === 1) {
        return { ...plant, edges: [...plant.edges, newEdge] };
      } else {
        const parentId = drillDownPath[drillDownPath.length - 1];
        const compProcess = plant.compositeProcesses[parentId];
        if (!compProcess) return plant;

        return {
          ...plant,
          compositeProcesses: {
            ...plant.compositeProcesses,
            [parentId]: { ...compProcess, edges: [...compProcess.edges, newEdge] },
          },
        };
      }
    });

    addToast('success', 'Flow link established.');
    return true;
  }, [getActiveGraph, drillDownPath, activePlant, pushToHistory, updatePlantState, addToast]);

  // Delete Edge connection
  const deleteConnection = useCallback((edgeId: string) => {
    pushToHistory(activePlant.nodes, activePlant.edges, activePlant.compositeProcesses);

    updatePlantState((plant) => {
      if (drillDownPath.length === 1) {
        return { ...plant, edges: plant.edges.filter((e) => e.id !== edgeId) };
      } else {
        const parentId = drillDownPath[drillDownPath.length - 1];
        const compProcess = plant.compositeProcesses[parentId];
        if (!compProcess) return plant;

        return {
          ...plant,
          compositeProcesses: {
            ...plant.compositeProcesses,
            [parentId]: { ...compProcess, edges: compProcess.edges.filter((e) => e.id !== edgeId) },
          },
        };
      }
    });

    addToast('info', 'Flow link removed.');
  }, [drillDownPath, activePlant, pushToHistory, updatePlantState, addToast]);

  // Undo action (Phase 17)
  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    setRedoStack((prev) => [
      ...prev,
      {
        nodes: JSON.parse(JSON.stringify(activePlant.nodes)),
        edges: JSON.parse(JSON.stringify(activePlant.edges)),
        compositeProcesses: JSON.parse(JSON.stringify(activePlant.compositeProcesses)),
      },
    ]);

    setPlants((prev) => {
      const updated = {
        ...prev,
        [currentPlantId]: {
          ...prev[currentPlantId],
          nodes: previous.nodes,
          edges: previous.edges,
          compositeProcesses: previous.compositeProcesses,
        },
      };
      saveToLocalStorage(updated);
      return updated;
    });
    addToast('info', 'Undo performed.');
  }, [undoStack, activePlant, currentPlantId, saveToLocalStorage, addToast]);

  // Redo action (Phase 17)
  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));

    setUndoStack((prev) => [
      ...prev,
      {
        nodes: JSON.parse(JSON.stringify(activePlant.nodes)),
        edges: JSON.parse(JSON.stringify(activePlant.edges)),
        compositeProcesses: JSON.parse(JSON.stringify(activePlant.compositeProcesses)),
      },
    ]);

    setPlants((prev) => {
      const updated = {
        ...prev,
        [currentPlantId]: {
          ...prev[currentPlantId],
          nodes: next.nodes,
          edges: next.edges,
          compositeProcesses: next.compositeProcesses,
        },
      };
      saveToLocalStorage(updated);
      return updated;
    });
    addToast('info', 'Redo performed.');
  }, [redoStack, activePlant, currentPlantId, saveToLocalStorage, addToast]);

  // Select plant
  const selectPlant = useCallback((plantId: string) => {
    setCurrentPlantId(plantId);
    setDrillDownPath(['root']);
    setSelectedNodeId(null);
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  // Reset demo plant dataset
  const resetDemo = useCallback(() => {
    const defaultPlant = INITIAL_PLANTS[currentPlantId];
    if (!defaultPlant) return;

    setPlants((prev) => {
      const updated = {
        ...prev,
        [currentPlantId]: JSON.parse(JSON.stringify(defaultPlant)),
      };
      saveToLocalStorage(updated);
      return updated;
    });
    setDrillDownPath(['root']);
    setSelectedNodeId(null);
    setUndoStack([]);
    setRedoStack([]);
    addToast('info', `Reset "${defaultPlant.name}" to demo state.`);
  }, [currentPlantId, saveToLocalStorage, addToast]);

  // Clear Canvas entirely
  const clearCanvas = useCallback(() => {
    pushToHistory(activePlant.nodes, activePlant.edges, activePlant.compositeProcesses);

    updatePlantState((plant) => ({
      ...plant,
      nodes: [],
      edges: [],
      compositeProcesses: {},
    }));

    setSelectedNodeId(null);
    if (drillDownPath.length > 1) {
      setDrillDownPath(['root']);
    }
    addToast('warning', 'Canvas cleared.');
  }, [activePlant, drillDownPath, pushToHistory, updatePlantState, addToast]);

  // Import JSON with Schema Validation & Desktop Native Dialog support
  const importJSON = useCallback(async (jsonData?: string) => {
    let contentToProcess = jsonData;

    // Desktop Native Open Dialog support
    if (!contentToProcess && window.desktopAPI) {
      const res = await window.desktopAPI.openPlantFile();
      if (res.canceled || !res.content) return false;
      contentToProcess = res.content;
    }

    if (!contentToProcess) return false;

    try {
      const parsed = JSON.parse(contentToProcess);
      const val = validatePlantData(parsed);

      if (!val.isValid || !val.sanitizedPlant) {
        addToast('error', `Import rejected: ${val.error}`);
        return false;
      }

      pushToHistory(activePlant.nodes, activePlant.edges, activePlant.compositeProcesses);

      const sanitized = val.sanitizedPlant;

      setPlants((prev) => {
        const updated = {
          ...prev,
          [sanitized.id]: sanitized,
        };
        saveToLocalStorage(updated);
        return updated;
      });

      setCurrentPlantId(sanitized.id);
      setDrillDownPath(['root']);
      setSelectedNodeId(null);
      addToast('success', `Successfully imported plant "${sanitized.name}".`);
      return true;
    } catch (e: any) {
      console.error('Import error:', e);
      addToast('error', `Import failed: Malformed JSON syntax.`);
      return false;
    }
  }, [activePlant, pushToHistory, saveToLocalStorage, addToast]);

  // Export JSON with Desktop Native Save Dialog support
  const exportJSON = useCallback(async () => {
    const jsonString = JSON.stringify(activePlant, null, 2);
    const defaultName = `${activePlant.id}-config.json`;

    if (window.desktopAPI) {
      const res = await window.desktopAPI.savePlantFile(jsonString, defaultName);
      if (!res.canceled) {
        addToast('success', `Saved plant configuration natively.`);
      }
    } else {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonString);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', defaultName);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      addToast('success', 'Exported plant configuration file.');
    }
  }, [activePlant, addToast]);

  // Make Node Composite (Phase 11 & 12) - Works on ANY node at any level!
  const makeNodeComposite = useCallback((nodeId: string) => {
    pushToHistory(activePlant.nodes, activePlant.edges, activePlant.compositeProcesses);

    updatePlantState((plant) => {
      const isRoot = drillDownPath.length === 1;

      if (isRoot) {
        const updatedNodes = plant.nodes.map((node) =>
          node.id === nodeId ? { ...node, type: 'composite' as const, isComposite: true } : node
        );
        const updatedComposites = {
          ...plant.compositeProcesses,
          [nodeId]: plant.compositeProcesses[nodeId] || {
            id: `process-${nodeId}`,
            parentNodeId: nodeId,
            nodes: [],
            edges: [],
          },
        };
        return { ...plant, nodes: updatedNodes, compositeProcesses: updatedComposites };
      } else {
        const parentId = drillDownPath[drillDownPath.length - 1];
        const compProcess = plant.compositeProcesses[parentId];
        if (!compProcess) return plant;

        const updatedNodes = compProcess.nodes.map((node) =>
          node.id === nodeId ? { ...node, type: 'composite' as const, isComposite: true } : node
        );
        const updatedComposites = {
          ...plant.compositeProcesses,
          [nodeId]: plant.compositeProcesses[nodeId] || {
            id: `process-${nodeId}`,
            parentNodeId: nodeId,
            nodes: [],
            edges: [],
          },
        };

        return {
          ...plant,
          nodes: plant.nodes,
          compositeProcesses: {
            ...updatedComposites,
            [parentId]: { ...compProcess, nodes: updatedNodes },
          },
        };
      }
    });

    addToast('success', 'Converted equipment into a composite process block.');
  }, [drillDownPath, activePlant, pushToHistory, updatePlantState, addToast]);

  // Direct composite subprocess updater for CompositeModal editing (Phase 14)
  const updateCompositeProcessGraph = useCallback((parentNodeId: string, internalNodes: PlantNode[], internalEdges: PlantEdge[]) => {
    pushToHistory(activePlant.nodes, activePlant.edges, activePlant.compositeProcesses);

    updatePlantState((plant) => ({
      ...plant,
      compositeProcesses: {
        ...plant.compositeProcesses,
        [parentNodeId]: {
          id: `process-${parentNodeId}`,
          parentNodeId,
          nodes: internalNodes,
          edges: internalEdges,
        },
      },
    }));
  }, [activePlant, pushToHistory, updatePlantState]);

  return {
    plants,
    currentPlantId,
    activePlant,
    drillDownPath,
    nestedViewMode,
    selectedNodeId,
    toasts,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    addToast,
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
  };
}
