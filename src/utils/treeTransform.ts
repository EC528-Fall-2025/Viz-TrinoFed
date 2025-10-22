import { Node, Edge } from '@xyflow/react';
import { QueryTreeNode, QueryEvent } from '../types/api.types';

interface LayoutNode {
  node: QueryTreeNode & { displayName?: string; eventType?: string };
  x: number;
  y: number;
}

export const transformQueryTreeToReactFlow = (
  root: QueryTreeNode | null,
  events?: QueryEvent[]
): { nodes: Node[]; edges: Edge[] } => {
  if (!root) return { nodes: [], edges: [] };

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const layoutNodes: LayoutNode[] = [];

  // Check if the tree has actual structure or just a placeholder root
  const hasRealStructure = root.children && root.children.length > 0;

  if (!hasRealStructure && events && events.length > 0) {
    // Create a timeline-style visualization from events
    events.forEach((event, index) => {
      const eventNode: QueryTreeNode & { displayName?: string; eventType?: string } = {
        id: `event-${index}`,
        queryId: event.queryId,
        nodeType: 'EVENT',
        operatorType: null,
        sourceSystem: event.catalog || null,
        state: event.state,
        executionTime: event.cpuTimeMs || event.wallTimeMs || null,
        inputRows: event.totalRows,
        outputRows: null,
        inputBytes: event.totalBytes,
        outputBytes: null,
        cpuTime: event.cpuTimeMs,
        wallTime: event.wallTimeMs,
        memoryBytes: event.peakMemoryBytes,
        errorMessage: event.errorMessage,
        warnings: null,
        metadata: null,
        children: [],
        parentId: index > 0 ? `event-${index - 1}` : null,
        displayName: event.eventType,
        eventType: event.eventType
      };

      nodes.push({
        id: eventNode.id,
        position: { x: 0, y: index * 180 },
        data: { 
          label: event.eventType,
          ...eventNode
        },
        type: 'queryNode',
      });

      if (index > 0) {
        edges.push({
          id: `event-${index - 1}-event-${index}`,
          source: `event-${index - 1}`,
          target: `event-${index}`,
          animated: event.state === 'RUNNING',
          style: { stroke: '#495057', strokeWidth: 3 },
          type: 'smoothstep',
        });
      }
    });

    return { nodes, edges };
  }

  // Original tree layout algorithm for structured trees
  const calculateLayout = (
    node: QueryTreeNode,
    depth: number,
    leftBound: number,
    rightBound: number
  ): number => {
    const VERTICAL_SPACING = 180;
    const MIN_HORIZONTAL_SPACING = 320;
    
    const y = depth * VERTICAL_SPACING;

    if (!node.children || node.children.length === 0) {
      const x = (leftBound + rightBound) / 2;
      layoutNodes.push({ node, x, y });
      return x;
    }

    const childPositions: number[] = [];
    let currentLeft = leftBound;
    
    node.children.forEach((child) => {
      const childWidth = getSubtreeWidth(child) * MIN_HORIZONTAL_SPACING;
      const childRight = currentLeft + childWidth;
      const childX = calculateLayout(child, depth + 1, currentLeft, childRight);
      childPositions.push(childX);
      currentLeft = childRight;
    });

    const leftmostChild = childPositions[0];
    const rightmostChild = childPositions[childPositions.length - 1];
    const x = (leftmostChild + rightmostChild) / 2;
    
    layoutNodes.push({ node, x, y });
    return x;
  };

  const getSubtreeWidth = (node: QueryTreeNode): number => {
    if (!node.children || node.children.length === 0) return 1;
    return node.children.reduce((sum, child) => sum + getSubtreeWidth(child), 0);
  };

  const treeWidth = getSubtreeWidth(root);
  calculateLayout(root, 0, 0, treeWidth * 320);

  layoutNodes.forEach(({ node, x, y }) => {
    nodes.push({
      id: node.id,
      position: { x, y },
      data: { 
        label: node.operatorType || node.nodeType || 'Query Node',
        ...node
      },
      type: 'queryNode',
    });

    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => {
        edges.push({
          id: `${node.id}-${child.id}`,
          source: node.id,
          target: child.id,
          animated: child.state === 'RUNNING',
          style: { stroke: '#495057', strokeWidth: 3 },
          type: 'smoothstep',
        });
      });
    }
  });

  return { nodes, edges };
};

