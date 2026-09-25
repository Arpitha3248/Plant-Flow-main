import type { Plant, PlantNode, PlantEdge, CompositeProcess } from '../types/plant';

export interface PlantValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedPlant?: Plant;
}

const VALID_NODE_TYPES = new Set(['standard', 'storage', 'input', 'composite']);
const VALID_NODE_STATUSES = new Set(['running', 'idle', 'stopped']);
const VALID_FLOW_TYPES = new Set(['material', 'fuel', 'air', 'alternative']);

function validateNodes(nodes: any[]): { isValid: boolean; error?: string; cleanNodes?: PlantNode[] } {
  if (!Array.isArray(nodes)) return { isValid: false, error: 'Nodes must be an array.' };

  const seenIds = new Set<string>();
  const cleanNodes: PlantNode[] = [];

  for (const n of nodes) {
    if (!n || typeof n !== 'object') {
      return { isValid: false, error: 'Invalid node object encountered.' };
    }
    if (typeof n.id !== 'string' || !n.id.trim()) {
      return { isValid: false, error: 'Node missing valid string id.' };
    }
    if (seenIds.has(n.id)) {
      return { isValid: false, error: `Duplicate node ID found: ${n.id}` };
    }
    seenIds.add(n.id);

    if (!VALID_NODE_TYPES.has(n.type)) {
      return { isValid: false, error: `Node ${n.id} has invalid type: ${n.type}` };
    }

    const status = VALID_NODE_STATUSES.has(n.status) ? n.status : 'running';

    cleanNodes.push({
      id: n.id,
      type: n.type,
      name: typeof n.name === 'string' ? n.name : 'Unnamed Equipment',
      category: typeof n.category === 'string' ? n.category : 'General',
      description: typeof n.description === 'string' ? n.description : '',
      status: status,
      instanceId: n.instanceId,
      equipmentType: n.equipmentType,
      parentId: n.parentId,
      isComposite: Boolean(n.isComposite || n.type === 'composite'),
      x: typeof n.x === 'number' ? n.x : undefined,
      y: typeof n.y === 'number' ? n.y : undefined,
      metadata: typeof n.metadata === 'object' && n.metadata !== null ? n.metadata : {},
    });
  }

  return { isValid: true, cleanNodes };
}

function validateEdges(
  edges: any[],
  validNodeIds: Set<string>
): { isValid: boolean; error?: string; cleanEdges?: PlantEdge[] } {
  if (!Array.isArray(edges)) return { isValid: false, error: 'Edges must be an array.' };

  const seenIds = new Set<string>();
  const cleanEdges: PlantEdge[] = [];

  for (const e of edges) {
    if (!e || typeof e !== 'object') {
      return { isValid: false, error: 'Invalid edge object encountered.' };
    }
    if (typeof e.id !== 'string' || !e.id.trim()) {
      return { isValid: false, error: 'Edge missing valid string id.' };
    }
    if (seenIds.has(e.id)) {
      return { isValid: false, error: `Duplicate edge ID found: ${e.id}` };
    }
    seenIds.add(e.id);

    if (typeof e.source !== 'string' || !validNodeIds.has(e.source)) {
      return { isValid: false, error: `Edge ${e.id} points to missing source node: ${e.source}` };
    }
    if (typeof e.target !== 'string' || !validNodeIds.has(e.target)) {
      return { isValid: false, error: `Edge ${e.id} points to missing target node: ${e.target}` };
    }

    const flowType = VALID_FLOW_TYPES.has(e.flowType) ? e.flowType : 'material';

    cleanEdges.push({
      id: e.id,
      source: e.source,
      target: e.target,
      label: typeof e.label === 'string' ? e.label : '',
      flowType: flowType,
    });
  }

  return { isValid: true, cleanEdges };
}

export function validatePlantData(data: any): PlantValidationResult {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Plant configuration must be an object.' };
  }

  if (typeof data.id !== 'string' || !data.id.trim()) {
    return { isValid: false, error: 'Plant missing valid string id.' };
  }

  if (typeof data.name !== 'string' || !data.name.trim()) {
    return { isValid: false, error: 'Plant missing valid name.' };
  }

  // Validate root nodes
  const nodeVal = validateNodes(data.nodes || []);
  if (!nodeVal.isValid || !nodeVal.cleanNodes) return { isValid: false, error: nodeVal.error };

  const rootNodeIds = new Set(nodeVal.cleanNodes.map((n) => n.id));

  // Validate root edges
  const edgeVal = validateEdges(data.edges || [], rootNodeIds);
  if (!edgeVal.isValid || !edgeVal.cleanEdges) return { isValid: false, error: edgeVal.error };

  // Validate composite processes if present
  const cleanComposites: Record<string, CompositeProcess> = {};
  if (data.compositeProcesses && typeof data.compositeProcesses === 'object') {
    for (const [key, comp] of Object.entries(data.compositeProcesses)) {
      if (!comp || typeof comp !== 'object') continue;
      const cObj = comp as any;
      const compNodesVal = validateNodes(cObj.nodes || []);
      if (!compNodesVal.isValid || !compNodesVal.cleanNodes) {
        return { isValid: false, error: `Composite ${key}: ${compNodesVal.error}` };
      }
      const compNodeIds = new Set(compNodesVal.cleanNodes.map((n) => n.id));
      const compEdgesVal = validateEdges(cObj.edges || [], compNodeIds);
      if (!compEdgesVal.isValid || !compEdgesVal.cleanEdges) {
        return { isValid: false, error: `Composite ${key}: ${compEdgesVal.error}` };
      }

      cleanComposites[key] = {
        id: typeof cObj.id === 'string' ? cObj.id : `process-${key}`,
        parentNodeId: typeof cObj.parentNodeId === 'string' ? cObj.parentNodeId : key,
        nodes: compNodesVal.cleanNodes,
        edges: compEdgesVal.cleanEdges,
      };
    }
  }

  return {
    isValid: true,
    sanitizedPlant: {
      id: data.id,
      name: data.name,
      nodes: nodeVal.cleanNodes,
      edges: edgeVal.cleanEdges,
      compositeProcesses: cleanComposites,
    },
  };
}

export function validatePlantsStorage(data: any): Record<string, Plant> | null {
  if (!data || typeof data !== 'object') return null;

  const validPlants: Record<string, Plant> = {};
  let hasAtLeastOne = false;

  for (const [key, plantObj] of Object.entries(data)) {
    const res = validatePlantData(plantObj);
    if (res.isValid && res.sanitizedPlant) {
      validPlants[key] = res.sanitizedPlant;
      hasAtLeastOne = true;
    }
  }

  return hasAtLeastOne ? validPlants : null;
}
