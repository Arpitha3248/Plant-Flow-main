export type NodeStatus = 'running' | 'idle' | 'stopped';

export type FlowType = 'material' | 'fuel' | 'air' | 'alternative';

export type NodeType = 'standard' | 'storage' | 'input' | 'composite';

export interface PlantNode {
  id: string;
  type: NodeType;
  name: string;
  category: string; // e.g. "Grinding", "Thermal", "Storage", "Raw Material"
  description: string;
  status: NodeStatus;
  instanceId?: string; // e.g., "1" of "3"
  equipmentType?: string; // e.g., "Cement Mill"
  parentId?: string; // references owner composite node id if nested
  isComposite?: boolean;
  x?: number; // visual coordinates
  y?: number;
  metadata?: {
    capacity?: string; // for storage nodes
    flowRate?: string;
    temperature?: string;
    alternativeMaterialName?: string; // for inputs
    [key: string]: any;
  };
}

export interface PlantEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  flowType: FlowType;
}

export interface CompositeProcess {
  id: string;
  parentNodeId: string;
  nodes: PlantNode[];
  edges: PlantEdge[];
}

export interface Plant {
  id: string;
  name: string;
  nodes: PlantNode[];
  edges: PlantEdge[];
  compositeProcesses: Record<string, CompositeProcess>;
}

export interface EquipmentDefinition {
  name: string;
  nodeType: NodeType;
  category: string;
  description: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

