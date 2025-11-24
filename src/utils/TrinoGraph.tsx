import { Node, Edge, Position } from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import { Fragment } from '../types/api.types';
import { Database } from '../types/database.types';

// --- Types ---
interface TrinoPlanNode {
  id: string;
  name: string;
  descriptor?: {
    sourceFragmentIds?: string;
  };
  children?: TrinoPlanNode[];
}

export interface TrinoQueryData {
  jsonPlan: string | object;
  fragments: Fragment[];
  state: string;
  databases: Database[];
}

// --- Helpers ---
const parseSourceFragmentIds = (value: string): string[] => {
  if (!value) return [];
  return value.replace(/[\[\]]/g, '').split(',').map(s => s.trim()).filter(s => s);
};

const findDependencies = (node: TrinoPlanNode, dependencies: Set<string>) => {
  if (node.name === 'RemoteSource' || node.name === 'RemoteMerge') {
    if (node.descriptor?.sourceFragmentIds) {
      const ids = parseSourceFragmentIds(node.descriptor.sourceFragmentIds);
      ids.forEach(id => dependencies.add(id));
    }
  }
  if (node.children) {
    node.children.forEach(child => findDependencies(child, dependencies));
  }
};

const formatBytes = (bytes: number | undefined) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatTime = (ms: number | undefined) => {
  if (!ms && ms !== 0) return 'N/A';
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

// --- Main Parsing & Layout Function ---
export const parseTrinoQueryPlan = (data: TrinoQueryData) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  let planMap: Record<string, TrinoPlanNode> = {};
  
  try {
    if (typeof data.jsonPlan === 'string') {
      planMap = JSON.parse(data.jsonPlan);
    } else if (typeof data.jsonPlan === 'object' && data.jsonPlan !== null) {
      planMap = data.jsonPlan as unknown as Record<string, TrinoPlanNode>;
    } else {
      return { nodes: [], edges: [] };
    }
  } catch (e) {
    console.error("Failed to parse jsonPlan:", e);
    return { nodes: [], edges: [] };
  }

  // 1. Initialize Dagre Graph
  const g = new dagre.graphlib.Graph();
  g.setGraph({ 
    rankdir: 'LR',  // Left-to-Right flow
    nodesep: 60,    // Space between sibling nodes (vertical)
    ranksep: 150,   // Space between ranks (horizontal)
    // align: 'UL'  <-- REMOVED: This allows Dagre to center nodes vertically
  });
  g.setDefaultEdgeLabel(() => ({}));

  // 2. Parse Fragments and Build Dependencies
  const incomingEdges: Record<string, string[]> = {};
  const allFragmentIds = Object.keys(planMap);
  const dependentFragments = new Set<string>(); 

  allFragmentIds.forEach(fragmentId => {
    const rootOperator = planMap[fragmentId];
    const sources = new Set<string>();
    findDependencies(rootOperator, sources);
    
    incomingEdges[fragmentId] = Array.from(sources);
    sources.forEach(s => dependentFragments.add(fragmentId)); 

    // Add Fragment Node to Dagre
    g.setNode(fragmentId, { width: 280, height: 200 });

    // Add Fragment->Fragment Edges
    sources.forEach(sourceId => {
      g.setEdge(sourceId, fragmentId);
      edges.push({
        id: `e-${sourceId}-${fragmentId}`,
        source: sourceId,
        target: fragmentId,
        sourceHandle: 'out',
        targetHandle: 'in',
        type: 'directed',
        animated: data.state === 'RUNNING',
        style: { stroke: '#b1b1b7', strokeWidth: 2 },
      });
    });
  });

  // 3. Add Database Nodes
  // Identify "Source Fragments" (Leaves): Fragments that don't have any incoming edges
  const sourceFragmentIds = allFragmentIds.filter(id => (incomingEdges[id]?.length || 0) === 0);

  data.databases.forEach(db => {
    const dbNodeId = `db_${db.id}`;
    
    // Add DB Node to Dagre Layout
    g.setNode(dbNodeId, { width: 350, height: 200 });
    
    // Add React Flow node placeholder (position updated later)
    nodes.push({
      id: dbNodeId,
      type: 'databaseNode',
      position: { x: 0, y: 0 },
      data: { ...db, label: db.name },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });

    // Connect this DB to ALL source fragments
    // (Dagre will center the DB node relative to all these fragments)
    sourceFragmentIds.forEach(fragId => {
      g.setEdge(dbNodeId, fragId);
      
      edges.push({
        id: `e-${dbNodeId}-${fragId}`,
        source: dbNodeId,
        target: fragId,
        sourceHandle: 'right', 
        targetHandle: 'in',
        type: 'directed',
        style: { stroke: '#6c757d', strokeWidth: 2, strokeDasharray: '5,5' },
      });
    });
  });

  // 4. Calculate Layout
  dagre.layout(g);

  // 5. Update Node Positions
  // Update Database Nodes
  nodes.forEach(node => {
    if (node.type === 'databaseNode') {
      const pos = g.node(node.id);
      if (pos) {
        // Dagre gives center x/y, React Flow needs top-left
        node.position = {
          x: pos.x - (350 / 2), // using fixed width we set earlier
          y: pos.y - (200 / 2),
        };
      }
    }
  });

  // Create and Position Fragment Nodes
  allFragmentIds.forEach(fragmentId => {
    const numericId = parseInt(fragmentId);
    const originalFragment = data.fragments?.find(f => f.fragmentId === numericId);
    const nodePos = g.node(fragmentId);

    const fragmentData: Fragment = {
      ...originalFragment,
      fragmentId: numericId,
      partitioningType: originalFragment?.partitioningType || 'UNKNOWN',
      cpuTime: originalFragment?.cpuTime || formatTime(originalFragment?.cpuTimeMs),
      peakMemory: originalFragment?.peakMemory || formatBytes(originalFragment?.peakMemoryBytes),
      cpuTimeMs: originalFragment?.cpuTimeMs,
      inputRows: originalFragment?.inputRows || 0,
      outputRows: originalFragment?.outputRows || 0,
      operators: originalFragment?.operators || []
    };

    nodes.push({
      id: fragmentId,
      type: 'fragmentNode',
      position: {
        x: nodePos.x - (280 / 2),
        y: nodePos.y - (200 / 2)
      },
      data: { fragment: fragmentData },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
  });

  // 6. Add Output Node
  // Find Fragment 0 (final output fragment)
  const fragment0 = data.fragments?.find(f => f.fragmentId === 0);

  // Find the rightmost fragment (fragment with no outgoing edges)
  const finalFragmentIds = allFragmentIds.filter(id => {
    return !allFragmentIds.some(otherId => {
      return incomingEdges[otherId]?.includes(id);
    });
  });

  // Use Fragment 0 or the first final fragment as the output source
  const outputSourceFragmentId = finalFragmentIds.includes('0') ? '0' : finalFragmentIds[0];

  if (outputSourceFragmentId) {
    const outputNodeId = 'output_node';
    const sourcePos = g.node(outputSourceFragmentId);

    // Parse output columns from Fragment 0's outputLayout
    let outputColumns: string[] = [];
    if (fragment0?.outputLayout) {
      outputColumns = fragment0.outputLayout
        .split(',')
        .map(col => col.trim().split(':')[0].replace(/[\[\]]/g, '').trim())
        .filter(col => col.length > 0);
    }

    // Position output node to the right of the final fragment
    const outputX = sourcePos.x + 280 / 2 + 200; // fragment center + half width + spacing
    const outputY = sourcePos.y;

    // Create output node
    nodes.push({
      id: outputNodeId,
      type: 'outputNode',
      position: {
        x: outputX - (280 / 2),
        y: outputY - (140 / 2)
      },
      data: {
        queryId: (data as any).queryId || 'unknown',
        query: (data as any).query || '',
        state: data.state,
        totalRows: (data as any).totalRows ?? null,
        executionTime: (data as any).totalExecutionTime ?? null,
        outputLayout: fragment0?.outputLayout ?? null,
        outputColumns: outputColumns.length > 0 ? outputColumns : undefined,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });

    // Connect final fragment to output node
    edges.push({
      id: `e-${outputSourceFragmentId}-output`,
      source: outputSourceFragmentId,
      target: outputNodeId,
      sourceHandle: 'out',
      targetHandle: 'in',
      type: 'directed',
      style: { stroke: '#2e7d32', strokeWidth: 3 },
    });
  }

  return { nodes, edges };
};