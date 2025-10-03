// src/pages/TreePage.tsx
import { useState, useCallback } from 'react';
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  NodeChange,
  EdgeChange,
  Connection,
  MarkerType,
  Node,
  Edge,
  ProOptions,
  ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import DirectedEdge from '../components/DirectedEdge';

const directedEdgeType = {default: DirectedEdge};

const proOptions: ProOptions = { hideAttribution: true };

const initialNodes: Node[] = [
    { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
    { id: 'n2', position: { x: 0, y: 100 }, data: { label: 'Node 2' } },
    { id: 'n3', position: { x: 0, y: 200 }, data: { label: 'Node 3' } },
    { id: 'n4', position: { x: 0, y: 300 }, data: { label: 'Node 4' } },
    { id: 'n5', position: { x: 0, y: 400 }, data: { label: 'Node 5' } },
    { id: 'n6', position: { x: -100, y: 500 }, data: { label: 'Node 6' } },
    { id: 'n7', position: { x: 100, y: 600 }, data: { label: 'Node 7' } },
    { id: 'n8', position: { x: 25, y: 700 }, data: { label: 'Node 8' } },
    { id: 'n9', position: { x: 200, y: 800 }, data: { label: 'Node 9' } },
    { id: 'n10', position: { x: -200, y: 900 }, data: { label: 'Node 10' } }
  ];
  
  // markerEnd is required for the edge direction to be displayed
  const initialEdges: Edge[] = [
    { id: 'n1-n2', source: 'n1', target: 'n2', markerEnd: {type: MarkerType.ArrowClosed, width: 20, height: 20}}, 
    { id: 'n2-n3', source: 'n2', target: 'n3' , markerEnd: {type: MarkerType.ArrowClosed, width: 20, height: 20}},
     {id : 'n4-n5', source: 'n4', target: 'n5', markerEnd: {type: MarkerType.ArrowClosed, width: 20, height: 20}}, 
     {id : 'n5-n6', source: 'n5', target: 'n6', markerEnd: {type: MarkerType.ArrowClosed, width: 20, height: 20}}, 
     {id: 'n5-n7', source: 'n5', target: 'n7', markerEnd: {type: MarkerType.ArrowClosed, width: 20, height: 20}}, 
     {id: 'n7-n8', source: 'n7', target: 'n8' , markerEnd: {type: MarkerType.ArrowClosed, width: 20, height: 20}}, 
     {id: 'n7-n9', source: 'n7', target: 'n9', markerEnd: {type: MarkerType.ArrowClosed, width: 20, height: 20}}, 
     {id: 'n8-n10', source: 'n8', target: 'n10', markerEnd: {type: MarkerType.ArrowClosed, width: 20, height: 20}}
    ];

const TreePage: React.FC = () => {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes(ns => applyNodeChanges(changes, ns)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges(es => applyEdgeChanges(changes, es)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges(es => addEdge(params, es)),
    []
  );

  const onInit = useCallback(
    (reactFlowInstance: ReactFlowInstance) => {
      reactFlowInstance.fitView({padding: 0.1});
    },
    []
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        onInit={onInit}
        proOptions={proOptions}
        edgeTypes={directedEdgeType}
      />
    </div>
  );
};

export default TreePage;
