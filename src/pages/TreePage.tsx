import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow, applyNodeChanges, applyEdgeChanges,
  type NodeChange, type EdgeChange,
  type Node, type Edge, type ReactFlowInstance, type ProOptions,
  MarkerType, Background, Controls, MiniMap
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import ELK from 'elkjs/lib/elk.bundled.js';
import { Position } from '@xyflow/react';
import DirectedEdge from '../components/DirectedEdge';
import { QueryRFNode, QueryNodeData } from '../components/Node';
import DatabaseNode from '../components/DatabaseNode';
import { FragmentNode } from '../components/FragmentNode';
import { OutputNode } from '../components/OutputNode';
import QueryPlanPanel from '../components/QueryPlanPanel';
import UnifiedMetricsPanel from '../components/UnifiedMetricsPanel';
import { apiService } from '../services/api.service';
import { QueryTree, QueryTreeNode, Fragment } from '../types/api.types';
import { Database } from '../types/database.types';
// --- NEW IMPORT ---
import { parseTrinoQueryPlan } from '../utils/TrinoGraph';

const elk = new ELK();
const NODE_W = 300;
const NODE_H = 160;
const DB_NODE_W = 350;
const DB_NODE_H = 200;
const FRAGMENT_NODE_W = 320;
const FRAGMENT_NODE_H = 200;
const OUTPUT_NODE_W = 280;
const OUTPUT_NODE_H = 140;
const directedEdgeTypes = { directed: DirectedEdge };
const nodeTypes = { queryNode: QueryRFNode, databaseNode: DatabaseNode, fragmentNode: FragmentNode, outputNode: OutputNode };
const proOptions: ProOptions = { hideAttribution: true };

// Map state to status
function mapState(state: string): QueryNodeData['status'] {
  const s = state.toLowerCase();
  if (s.includes('finish') || s.includes('complete')) return 'finished';
  if (s.includes('fail') || s.includes('error')) return 'failed';
  if (s.includes('running')) return 'ok';
  if (s.includes('queued')) return 'queued';
  if (s.includes('idle')) return 'idle';
  return 'unknown';
}

// Convert backend QueryTreeNode to QueryNodeData format
function convertToQueryNodeData(node: QueryTreeNode): QueryNodeData {
  return {
    id: node.id,
    stage: node.nodeType || node.operatorType || 'Query Stage',
    title: node.operatorType || node.nodeType || 'Query Node',
    connector: node.sourceSystem || undefined,
    status: mapState(node.state),
    durationMs: node.executionTime || node.wallTime || undefined,
    rows: node.outputRows || node.inputRows || undefined,
    timestamp: undefined,
    children: node.children?.map(convertToQueryNodeData),
  };
}

// Convert events to QueryNodeData timeline
function createEventTimeline(queryTree: QueryTree): QueryNodeData[] {
  const events = queryTree.events || [];
  if (events.length === 0) return [];

  return events.map((event, index) => {
    const node: QueryNodeData = {
      id: `${queryTree.queryId}-event-${index}`,
      stage: event.eventType,
      title: `${event.eventType} - ${event.state}`,
      connector: event.catalog || event.source || undefined,
      status: mapState(event.state),
      durationMs: event.cpuTimeMs || event.wallTimeMs || undefined,
      rows: event.totalRows || undefined,
      timestamp: event.timestamp,
      metrics: [
        { kind: 'text', label: 'Event Type', value: event.eventType },
        { kind: 'text', label: 'State', value: event.state },
        { kind: 'text', label: 'User', value: event.user },
        ...(event.cpuTimeMs ? [{ kind: 'text' as const, label: 'CPU Time', value: `${event.cpuTimeMs} ms` }] : []),
        ...(event.wallTimeMs ? [{ kind: 'text' as const, label: 'Wall Time', value: `${event.wallTimeMs} ms` }] : []),
        ...(event.queuedTimeMs ? [{ kind: 'text' as const, label: 'Queued Time', value: `${event.queuedTimeMs} ms` }] : []),
        ...(event.totalRows ? [{ kind: 'text' as const, label: 'Total Rows', value: event.totalRows.toLocaleString() }] : []),
        ...(event.totalBytes ? [{ kind: 'text' as const, label: 'Total Bytes', value: `${(event.totalBytes / 1024 / 1024).toFixed(2)} MB` }] : []),
        ...(event.peakMemoryBytes ? [{ kind: 'text' as const, label: 'Peak Memory', value: `${(event.peakMemoryBytes / 1024 / 1024).toFixed(2)} MB` }] : []),
        ...(event.completedSplits ? [{ kind: 'text' as const, label: 'Completed Splits', value: event.completedSplits.toString() }] : []),
      ],
    };

    // Create next relationship for timeline
    if (index < events.length - 1) {
      node.next = {
        id: `${queryTree.queryId}-event-${index + 1}`,
        stage: events[index + 1].eventType,
        title: `${events[index + 1].eventType} - ${events[index + 1].state}`,
        status: mapState(events[index + 1].state),
      };
    }

    return node;
  });
}

// ELK Layout
async function layoutWithElk(nodes: Node<{ node: QueryNodeData }>[], edges: Edge[]) {
  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.portConstraints': 'FIXED_SIDE',
      'elk.spacing.nodeNode': '40',
      'elk.spacing.edgeNode': '20',
      'elk.spacing.edgeEdge': '20',
      'elk.layered.spacing.nodeNodeBetweenLayers': '80',
      'elk.layered.crossingMinimization.strategy': 'INTERACTIVE',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
    },
    children: nodes.map(n => ({
      id: n.id,
      width: NODE_W,
      height: NODE_H,
      ports: [
        { id: 'in',        properties: { 'org.eclipse.elk.port.side': 'WEST'  } },
        { id: 'out',       properties: { 'org.eclipse.elk.port.side': 'EAST'  } },
        { id: 'inTop',     properties: { 'org.eclipse.elk.port.side': 'NORTH' } },
        { id: 'outBottom', properties: { 'org.eclipse.elk.port.side': 'SOUTH' } },
      ],
    })),
    edges: edges.map(e => ({
      id: e.id,
      sources: [`${e.source}#${e.sourceHandle ?? 'out'}`],
      targets: [`${e.target}#${e.targetHandle ?? 'in'}`],
    })),
  };

  const res = await elk.layout(graph);

  const posNodes = nodes.map(n => {
    const ln = res.children!.find((c: any) => c.id === n.id)!;
    return {
      ...n,
      position: { x: ln.x ?? 0, y: ln.y ?? 0 },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
    };
  });

  const posEdges = edges.map(e => {
    const le = res.edges!.find((x: any) => x.id === e.id) as any;
    if (!le?.sections?.[0]) return e;
    const sec = le.sections[0];
    const points = [
      ...(sec.startPoint ? [sec.startPoint] : []),
      ...(sec.bendPoints ?? []),
      ...(sec.endPoint ? [sec.endPoint] : []),
    ].map((p: any) => ({ x: p.x, y: p.y }));
    return { ...e, data: { ...(e.data || {}), points } };
  });

  return { nodes: posNodes, edges: posEdges };
}

// Dagre layout helper
function dagreLayoutLR(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 100, ranksep: 200 });
  g.setDefaultEdgeLabel(() => ({}));
  nodes.forEach(n => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach(e => g.setEdge(e.source, e.target));
  dagre.layout(g);
  nodes.forEach(n => {
    const p = g.node(n.id);
    n.position = { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 };
    (n as any).sourcePosition = Position.Right;
    (n as any).targetPosition = Position.Left;
  });
}

// Convert QueryNodeData tree to ReactFlow nodes and edges
function toReactFlow(nodes: QueryNodeData[], databases: Database[]) {
  const rfNodes: Node[] = [];
  const rfEdges: Edge[] = [];
  const seen = new Set<string>();

  // Add database nodes in a vertical column
  const DB_VERTICAL_SPACING = 250; // Space between database nodes
  const DB_START_Y = 0; // Starting Y position for database nodes
  
  databases.forEach((db, index) => {
    rfNodes.push({
      id: `db_${db.id}`,
      type: 'databaseNode',
      position: { x: -600, y: DB_START_Y + (index * DB_VERTICAL_SPACING) },
      data: { ...db, label: db.name },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
  });

  // Gather all query nodes (top-level + children + next) exactly once
  const addNode = (n: QueryNodeData) => {
    if (seen.has(n.id)) return;
    seen.add(n.id);
    rfNodes.push({
      id: n.id,
      type: 'queryNode',
      position: { x: 0, y: 0 },
      data: { node: n },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
    n.children?.forEach(addNode);
    if (n.next) addNode(n.next);
  };

  nodes.forEach(addNode);

  // Find the first non-database node (entry point to the query processing)
  const queryNodes = rfNodes.filter(n => n.type === 'queryNode');
  const allQueryIds = new Set(queryNodes.map(n => n.id));
  
  // A node is a "first node" if it's not referenced as a child or next node by any other node
  const firstNodes = queryNodes.filter(qn => {
    const isChild = nodes.some(n => n.children?.some(c => c.id === qn.id));
    const isNext = nodes.some(n => n.next?.id === qn.id);
    return !isChild && !isNext;
  });

  // If no clear first nodes, use the first query node
  const targetNodes = firstNodes.length > 0 ? firstNodes : (queryNodes.length > 0 ? [queryNodes[0]] : []);
  
  // Connect ALL database nodes to ALL first non-database nodes
  databases.forEach(db => {
    targetNodes.forEach(targetNode => {
      rfEdges.push({
        id: `db_${db.id}__to__${targetNode.id}`,
        source: `db_${db.id}`,
        sourceHandle: 'right',
        target: targetNode.id,
        targetHandle: 'in',
        type: 'directed',
        style: { 
          stroke: '#6c757d', 
          strokeWidth: 2, 
          strokeDasharray: '5,5' 
        },
        markerEnd: { 
          type: MarkerType.ArrowClosed, 
          color: '#6c757d', 
          width: 16, 
          height: 16 
        },
      });
    });
  });

  // Child edges: parent -> child (top→bottom handles)
  const addChildEdges = (n: QueryNodeData) => {
    n.children?.forEach((c) => {
      if (n.id !== c.id) {
        rfEdges.push({
          id: `${n.id}__child__${c.id}`,
          source: n.id,
          sourceHandle: 'outBottom',
          target: c.id,
          targetHandle: 'inTop',
          type: 'directed',
          style: { stroke: '#1976d2', strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#1976d2', width: 20, height: 20 },
        });
        addChildEdges(c);
      }
    });
    if (n.next && n.id !== n.next.id) {
      // Next edges: current -> next (left→right handles)
      rfEdges.push({
        id: `${n.id}__next__${n.next.id}`,
        source: n.id,
        sourceHandle: 'out',
        target: n.next.id,
        targetHandle: 'in',
        type: 'directed',
        style: { stroke: '#1976d2', strokeWidth: 3 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#1976d2', width: 20, height: 20 },
      });
      addChildEdges(n.next);
    }
  };
  nodes.forEach(addChildEdges);

  // Layout with dagre for query nodes only
  const queryNodesForLayout = rfNodes.filter(n => n.type === 'queryNode');
  const queryEdges = rfEdges.filter(e => 
    queryNodesForLayout.some(n => n.id === e.source) && 
    queryNodesForLayout.some(n => n.id === e.target)
  );
  dagreLayoutLR(queryNodesForLayout, queryEdges);

  return { nodes: rfNodes, edges: rfEdges };
}

// Convert fragments to ReactFlow nodes and edges
function convertFragmentsToNodes(fragments: Fragment[], databases: Database[], queryTree: QueryTree) {
  const rfNodes: Node[] = [];
  const rfEdges: Edge[] = [];

  // Add database nodes in a vertical column (far left)
  const DB_VERTICAL_SPACING = 250;
  const DB_START_Y = 0;
  
  databases.forEach((db, index) => {
    rfNodes.push({
      id: `db_${db.id}`,
      type: 'databaseNode',
      position: { x: -600, y: DB_START_Y + (index * DB_VERTICAL_SPACING) },
      data: { ...db, label: db.name },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
  });

  // Sort fragments by fragmentId in descending order (Trino convention: higher IDs = sources)
  const sortedFragments = [...fragments].sort((a, b) => b.fragmentId - a.fragmentId);
  
  // Identify source fragments: fragments that read directly from tables
  // These typically have SOURCE or SCAN partitioning and are leaf nodes
  const sourceFragments = sortedFragments.filter(f => 
    f.partitioningType === 'SOURCE' || 
    f.partitioningType?.includes('SCAN') ||
    // Also check if operators contain TableScan or similar
    f.operators?.some(op => 
      op.operatorType?.includes('TableScan') || 
      op.operatorType?.includes('Scan') ||
      op.operatorType?.includes('Source')
    )
  );
  
  const nonSourceFragments = sortedFragments.filter(f => !sourceFragments.includes(f));

  // Fallback: if no source fragments detected via partitioning/operators,
  // use fragments with highest IDs as sources
  if (sourceFragments.length === 0 && sortedFragments.length > 0) {
    const maxFragmentId = Math.max(...sortedFragments.map(f => f.fragmentId));
    sourceFragments.push(...sortedFragments.filter(f => f.fragmentId === maxFragmentId));
    nonSourceFragments.splice(0, nonSourceFragments.length, 
      ...sortedFragments.filter(f => f.fragmentId !== maxFragmentId));
  }

  // Layout source fragments VERTICALLY (middle column)
  const SOURCE_VERTICAL_SPACING = 200;
  const SOURCE_START_X = -50;
  const SOURCE_START_Y = 0;
  
  sourceFragments.forEach((fragment, index) => {
    rfNodes.push({
      id: `fragment_${fragment.fragmentId}`,
      type: 'fragmentNode',
      position: { 
        x: SOURCE_START_X, 
        y: SOURCE_START_Y + (index * SOURCE_VERTICAL_SPACING)
      },
      data: { fragment },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
  });

  // Layout non-source fragments HORIZONTALLY (right side)
  const NON_SOURCE_HORIZONTAL_SPACING = 400;
  const NON_SOURCE_START_X = 400;
  const NON_SOURCE_Y = SOURCE_START_Y + ((sourceFragments.length - 1) * SOURCE_VERTICAL_SPACING) / 2;
  
  nonSourceFragments.forEach((fragment, index) => {
    rfNodes.push({
      id: `fragment_${fragment.fragmentId}`,
      type: 'fragmentNode',
      position: { 
        x: NON_SOURCE_START_X + (index * NON_SOURCE_HORIZONTAL_SPACING), 
        y: NON_SOURCE_Y
      },
      data: { fragment },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
  });

  // Get Fragment 0 for output information
  const fragment0 = fragments.find(f => f.fragmentId === 0);
  
  // Parse output columns from Fragment 0's outputLayout
  let outputColumns: string[] = [];
  if (fragment0?.outputLayout) {
    outputColumns = fragment0.outputLayout
      .split(',')
      .map(col => col.trim().split(':')[0].replace(/[\[\]]/g, '').trim())
      .filter(col => col.length > 0);
  }

  // Add output node at the end of the horizontal chain
  const OUTPUT_X = NON_SOURCE_START_X + (nonSourceFragments.length * NON_SOURCE_HORIZONTAL_SPACING);
  rfNodes.push({
    id: 'output_node',
    type: 'outputNode',
    position: { 
      x: OUTPUT_X, 
      y: NON_SOURCE_Y
    },
    data: {
      queryId: queryTree.queryId,
      query: queryTree.query,
      state: queryTree.state,
      totalRows: queryTree.events?.find(e => e.totalRows)?.totalRows ?? null,
      executionTime: queryTree.totalExecutionTime,
      outputLayout: fragment0?.outputLayout ?? null,
      outputColumns: outputColumns.length > 0 ? outputColumns : undefined,
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  });

  // Connect ALL source fragments' RIGHT edges to FIRST non-source fragment's LEFT edge
  const firstNonSourceFragment = nonSourceFragments.length > 0 ? nonSourceFragments[0] : fragment0;
  
  if (firstNonSourceFragment) {
    sourceFragments.forEach(sourceFragment => {
      rfEdges.push({
        id: `fragment_${sourceFragment.fragmentId}_to_${firstNonSourceFragment.fragmentId}`,
        source: `fragment_${sourceFragment.fragmentId}`,
        sourceHandle: 'out',
        target: `fragment_${firstNonSourceFragment.fragmentId}`,
        targetHandle: 'in',
        type: 'directed',
        style: { stroke: '#1976d2', strokeWidth: 3 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#1976d2', width: 20, height: 20 },
      });
    });
  }

  // Create sequential edges between NON-SOURCE fragments (horizontal flow: left to right)
  for (let i = 0; i < nonSourceFragments.length - 1; i++) {
    const currentFragment = nonSourceFragments[i];
    const nextFragment = nonSourceFragments[i + 1];
    
    rfEdges.push({
      id: `fragment_${currentFragment.fragmentId}_to_${nextFragment.fragmentId}`,
      source: `fragment_${currentFragment.fragmentId}`,
      sourceHandle: 'out',
      target: `fragment_${nextFragment.fragmentId}`,
      targetHandle: 'in',
      type: 'directed',
      style: { stroke: '#1976d2', strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#1976d2', width: 20, height: 20 },
    });
  }

  // Connect last non-source fragment to Output Node
  const lastNonSourceFragment = nonSourceFragments.length > 0 ? nonSourceFragments[nonSourceFragments.length - 1] : null;
  
  if (lastNonSourceFragment) {
    rfEdges.push({
      id: `fragment_${lastNonSourceFragment.fragmentId}_to_output`,
      source: `fragment_${lastNonSourceFragment.fragmentId}`,
      sourceHandle: 'out',
      target: 'output_node',
      targetHandle: 'in',
      type: 'directed',
      style: { stroke: '#2e7d32', strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#2e7d32', width: 20, height: 20 },
    });
  } else if (fragment0 && sourceFragments.length > 0) {
    sourceFragments.forEach(sourceFragment => {
      rfEdges.push({
        id: `fragment_${sourceFragment.fragmentId}_to_output`,
        source: `fragment_${sourceFragment.fragmentId}`,
        sourceHandle: 'out',
        target: 'output_node',
        targetHandle: 'in',
        type: 'directed',
        style: { stroke: '#2e7d32', strokeWidth: 3 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#2e7d32', width: 20, height: 20 },
      });
    });
  }

  // Connect database nodes ONLY to source fragments (horizontal connections)
  databases.forEach(db => {
    sourceFragments.forEach(sourceFragment => {
      rfEdges.push({
        id: `db_${db.id}_to_fragment_${sourceFragment.fragmentId}`,
        source: `db_${db.id}`,
        sourceHandle: 'right',
        target: `fragment_${sourceFragment.fragmentId}`,
        targetHandle: 'in',
        type: 'directed',
        style: { 
          stroke: '#6c757d', 
          strokeWidth: 2, 
          strokeDasharray: '5,5' 
        },
        markerEnd: { 
          type: MarkerType.ArrowClosed, 
          color: '#6c757d', 
          width: 16, 
          height: 16 
        },
      });
    });
  });

  return { nodes: rfNodes, edges: rfEdges };
}

const TreePage: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState<QueryTree | null>(null);
  const [selectedFragment, setSelectedFragment] = useState<Fragment | null>(null);
  const [selectedDatabase, setSelectedDatabase] = useState<Database | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryId = searchParams.get('queryId');

  const loadData = useCallback(async () => {
    try {
      const databases = await apiService.getDatabases();
      let queryToDisplay: QueryTree;

      if (queryId) {
        queryToDisplay = await apiService.getQueryById(queryId);
      } else {
        const allQueries = await apiService.getAllQueries();
        const queries = allQueries.filter(query => 
          query.user && 
          query.user !== 'system' && 
          !query.user.startsWith('$') &&
          query.queryId &&
          !query.queryId.includes('system')
        );
        if (queries.length === 0) {
          setError('No user queries found. Run a query in Trino to see visualization.');
          setLoading(false);
          return;
        }
        queryToDisplay = queries[queries.length - 1];
      }

      if (currentQuery?.queryId !== queryToDisplay.queryId) {
        setSelectedFragment(null);
        setSelectedDatabase(null);
      }

      if (currentQuery?.queryId === queryToDisplay.queryId && currentQuery?.state === queryToDisplay.state) {
        setCurrentQuery(queryToDisplay); 
        return; 
      }
      
      setCurrentQuery(queryToDisplay);

      let rfNodes: Node[] = [];
      let rfEdges: Edge[] = [];

      const queryDataAny = queryToDisplay as any;
      
      // 1. ROBUST PLAN FINDING - Check root, then nested events
      let jsonPlan = queryDataAny.jsonPlan;
      if (!jsonPlan && queryToDisplay.events) {
        const eventWithPlan = queryToDisplay.events.find((e: any) => e.jsonPlan);
        if (eventWithPlan) {
          jsonPlan = (eventWithPlan as any).jsonPlan;
        }
      }

      // 2. TRY PARSING IF PLAN EXISTS
      if (jsonPlan) {
        console.log("Found jsonPlan, attempting DAG layout...");
        const result = parseTrinoQueryPlan({
          jsonPlan: jsonPlan,
          fragments: queryToDisplay.fragments || [],
          state: queryToDisplay.state,
          databases: databases // <--- PASS DATABASES HERE
        });
        
        if (result.nodes.length > 0) {
          rfNodes = result.nodes;
          rfEdges = result.edges;
        }
      } 

      // 3. FALLBACK (Old Logic)
      if (rfNodes.length === 0) {
        console.log("No jsonPlan found or parsing failed. Using fallback layout.");
        if (queryToDisplay.fragments && queryToDisplay.fragments.length > 0) {
           const result = convertFragmentsToNodes(queryToDisplay.fragments, databases, queryToDisplay);
           rfNodes = result.nodes;
           rfEdges = result.edges;
        } else {
           const hasComplexTree = queryToDisplay.root?.children && queryToDisplay.root.children.length > 0;
           let nodesToVisualize: QueryNodeData[];
           
           if (hasComplexTree && queryToDisplay.root) {
             nodesToVisualize = [convertToQueryNodeData(queryToDisplay.root)];
           } else if (queryToDisplay.events && queryToDisplay.events.length > 0) {
             nodesToVisualize = createEventTimeline(queryToDisplay);
           } else {
             setError('No visualization data available');
             setLoading(false);
             return;
           }
           const result = toReactFlow(nodesToVisualize, databases);
           rfNodes = result.nodes;
           rfEdges = result.edges;
        }
      }
      
      setNodes(rfNodes);
      setEdges(rfEdges);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load data:', err);
      if (!queryId) {
        setError('Failed to connect to backend. Make sure backend is running on http://localhost:8080');
      }
      setLoading(false);
    }
  }, [queryId, currentQuery]);

  useEffect(() => {
    loadData();
    let interval: NodeJS.Timeout | null = null;
    if (!queryId) {
      interval = setInterval(loadData, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [queryId, loadData]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes(ns => applyNodeChanges(changes, ns)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges(es => applyEdgeChanges(changes, es)),
    []
  );

  const onInit = useCallback(
    (rfi: ReactFlowInstance) => {
      rfi.fitView({ padding: 0.1 });
    },
    []
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === 'fragmentNode' || node.type === 'queryNode') {
        // Check if it's a fragment-based node (from new parser) or old query node
        if (node.data.node && (node.data.node as any).stage?.startsWith('Fragment')) {
             // For new parser nodes, map the ID back to the fragment list
             const fragId = parseInt(node.id);
             const fragment = currentQuery?.fragments?.find(f => f.fragmentId === fragId);
             if (fragment) {
                 setSelectedFragment(fragment);
                 setSelectedDatabase(null);
                 return;
             }
        }
        // Fallback for old "fragmentNode" type
        if (node.data.fragment) {
             setSelectedFragment(node.data.fragment as Fragment);
             setSelectedDatabase(null);
        }
    } else if (node.type === 'databaseNode') {
      setSelectedDatabase(node.data as Database); 
      setSelectedFragment(null); 
    }
  }, [currentQuery]);

  const onPaneClick = useCallback(() => {
    setSelectedFragment(null);
    setSelectedDatabase(null);
  }, []);

  const handleBackToLatest = () => {
    navigate('/');
    setSelectedFragment(null);
    setSelectedDatabase(null);
  };

  if (loading && !currentQuery) {
    return (
      <div
        data-testid="loading-spinner"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
        }}
      >
        Loading queries...
      </div>
    );
  }

  if (error && !currentQuery) {
    return (
      <div
        className="page-level-error"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          color: 'red',
          fontSize: '16px',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Historical Query Banner */}
      {queryId && currentQuery && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fff3cd',
          borderBottom: '2px solid #ffc107',
          padding: '12px 20px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
            }}>
              <span style={{ color: '#856404' }}>📋 Historical Query:</span>
              <code style={{ 
                backgroundColor: '#fff',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #ffc107',
                fontSize: '13px',
              }}>
                {currentQuery.queryId}
              </code>
            </div>
            <div style={{ fontSize: '13px', color: '#856404' }}>
              🕒 {new Date(currentQuery.startTime).toLocaleString()}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate('/query-history')}
              style={{
                backgroundColor: '#ffffff',
                color: '#1976d2',
                border: '2px solid #1976d2',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e3f2fd';
                e.currentTarget.style.borderColor = '#1565c0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#1976d2';
              }}
            >
              📜 Query History
            </button>
            <button
              onClick={handleBackToLatest}
              style={{
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1565c0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1976d2';
              }}
            >
              ⬅️ Back to Latest
            </button>
          </div>
        </div>
      )}
      
      {/* Always show panels if we have query data */}
      {currentQuery && (
        <>
          {/* Pass selectedFragment and selectedDatabase to the panel */}
          <UnifiedMetricsPanel 
            query={currentQuery} 
            selectedFragment={selectedFragment} 
            selectedDatabase={selectedDatabase}
          />
          <QueryPlanPanel
            events={currentQuery.events || []}
            plan={currentQuery.events?.find(e => e.plan)?.plan}
          />
        </>
      )}
      <ReactFlow
        className="dag-canvas"
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={directedEdgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{
          padding: 0.2,
          maxZoom: 1.5,
          minZoom: 0.5,
        }}
        proOptions={proOptions} 
        nodeExtent={[[ -800, -200 ], [ 20000, 12000 ]]}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default TreePage;