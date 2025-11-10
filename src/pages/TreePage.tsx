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
import QueryPlanPanel from '../components/QueryPlanPanel';
import UnifiedMetricsPanel from '../components/UnifiedMetricsPanel';
import { apiService } from '../services/api.service';
import { QueryTree, QueryTreeNode } from '../types/api.types';
import { Database } from '../types/database.types';

const elk = new ELK();
const NODE_W = 300;
const NODE_H = 160;
const DB_NODE_W = 350;
const DB_NODE_H = 200;
const directedEdgeTypes = { directed: DirectedEdge };
const nodeTypes = { queryNode: QueryRFNode, databaseNode: DatabaseNode };
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

  // Add database nodes
  databases.forEach((db, index) => {
    rfNodes.push({
      id: `db_${db.id}`,
      type: 'databaseNode',
      position: { x: -500, y: index * (DB_NODE_H + 50) },
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

  // Connect databases to query nodes - fix to connect to left side
  const queryNodes = rfNodes.filter(n => n.type === 'queryNode');
  const firstQueryNode = queryNodes[0];
  
  if (firstQueryNode) {
    databases.forEach(db => {
      // Connect database right handle to query node left handle
      rfEdges.push({
        id: `db_${db.id}__to__${firstQueryNode.id}`,
        source: `db_${db.id}`,
        sourceHandle: 'right', // Use right handle from database
        target: firstQueryNode.id,
        targetHandle: 'in', // Use left handle on query node
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
  }

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

const getInitialPanelState = () => {
  if (typeof window === 'undefined') return true;
  return window.innerWidth > 768;
};

const TreePage: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState<QueryTree | null>(null);
  const [selectedFragmentId, setSelectedFragmentId] = useState<string | null>(null);
  const [isMetricsPanelOpen, setMetricsPanelOpen] = useState<boolean>(getInitialPanelState);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryId = searchParams.get('queryId');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load databases
        const databases = await apiService.getDatabases();
        
        let queryToDisplay: QueryTree;
        
        if (queryId) {
          // Historical mode: fetch specific query
          queryToDisplay = await apiService.getQueryById(queryId);
        } else {
          // Live mode: fetch latest query
          const allQueries = await apiService.getAllQueries();
          
          // Filter out system queries
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
        
        // Always update current query, even during subsequent updates
        setCurrentQuery(queryToDisplay);

        // Check if we have a complex tree structure or just simple events
        const hasComplexTree = queryToDisplay.root?.children && queryToDisplay.root.children.length > 0;
        
        let nodesToVisualize: QueryNodeData[];
        let isEventTimeline = false;
        
        if (hasComplexTree && queryToDisplay.root) {
          // Convert backend data to QueryNodeData format for complex trees
          nodesToVisualize = [convertToQueryNodeData(queryToDisplay.root)];
          isEventTimeline = false;
        } else if (queryToDisplay.events && queryToDisplay.events.length > 0) {
          // Create event timeline for simple queries
          nodesToVisualize = createEventTimeline(queryToDisplay);
          isEventTimeline = true;
        } else {
          setError('No visualization data available');
          setLoading(false);
          return;
        }
          
        // Generate React Flow nodes and edges with databases
        const { nodes: rfNodes, edges: rfEdges } = toReactFlow(nodesToVisualize, databases);
        const enhancedNodes = rfNodes.map(node =>
          node.type === 'queryNode'
            ? { ...node, data: { ...(node.data || {}), onSelect: (fragmentId: string) => {
                  setSelectedFragmentId(fragmentId);
                  setMetricsPanelOpen(true);
                } } }
            : node
        );
        
        // Use dagre layout for all trees (ELK has issues with port references)
        // Apply dagre layout to all nodes
        setNodes(enhancedNodes);
        setEdges(rfEdges);
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to connect to backend. Make sure backend is running on http://localhost:8080');
        setLoading(false);
      }
    };

    loadData();
    
    // Only set up auto-refresh if not viewing a historical query
    let interval: NodeJS.Timeout | null = null;
    if (!queryId) {
      interval = setInterval(loadData, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [queryId]);

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

  const handleBackToLatest = () => {
    navigate('/');
    setMetricsPanelOpen(true);
  };

  useEffect(() => {
    const transformGroup = document.querySelector('.react-flow__nodes');
    if (transformGroup) {
      transformGroup.classList.add('dag-transform-group');
    }
  }, [nodes]);

  const selectedFragment = useMemo(() => {
    const target = nodes.find(node => node.id === selectedFragmentId);
    return (target?.data as any)?.node ?? null;
  }, [nodes, selectedFragmentId]);

  // Show initial loading screen only on first load
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

  // Show error only if there's no query data to display
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
      )}
      
      {/* Always show panels if we have query data */}
      {currentQuery && (
        <>
          <UnifiedMetricsPanel
            query={currentQuery}
            activeFragment={selectedFragment}
            isOpen={isMetricsPanelOpen}
            onClose={() => setMetricsPanelOpen(false)}
            onOpen={() => setMetricsPanelOpen(true)}
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
        onNodeClick={(_, node) => {
          const fragmentId = (node.data as any)?.node?.id;
          if (fragmentId) {
            setSelectedFragmentId(fragmentId);
            setMetricsPanelOpen(true);
          }
        }}
        onNodeDoubleClick={(_, node) => {
          const fragmentId = (node.data as any)?.node?.id;
          if (fragmentId) {
            setSelectedFragmentId(fragmentId);
            setMetricsPanelOpen(true);
          }
        }}
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