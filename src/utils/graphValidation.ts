import type { PlantNode, PlantEdge } from '../types/plant';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateConnection(
  connection: { source: string; target: string },
  nodes: PlantNode[],
  edges: PlantEdge[]
): ValidationResult {
  const { source, target } = connection;

  // Rule 3: Source != target
  if (source === target) {
    return {
      isValid: false,
      error: 'Cannot connect a node to itself (self-loop invalid).',
    };
  }

  // Rule 1: Source node exists
  const sourceNode = nodes.find((n) => n.id === source);
  if (!sourceNode) {
    return {
      isValid: false,
      error: 'Source node does not exist in active graph.',
    };
  }

  // Rule 2: Target node exists
  const targetNode = nodes.find((n) => n.id === target);
  if (!targetNode) {
    return {
      isValid: false,
      error: 'Target node does not exist in active graph.',
    };
  }

  // Rule 4: Duplicate connection check (same source and target in same direction)
  const existingEdge = edges.find((e) => e.source === source && e.target === target);
  if (existingEdge) {
    return {
      isValid: false,
      error: 'A connection between these equipment nodes already exists.',
    };
  }

  return { isValid: true };
}
