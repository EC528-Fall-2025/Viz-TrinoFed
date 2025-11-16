import React from 'react';

// Minimal Position enum used by your node/edge components
export const Position = {
  Top: 'top',
  Bottom: 'bottom',
  Left: 'left',
  Right: 'right',
} as const;

// BaseEdge: simple path, enough for DirectedEdge tests
type BaseEdgeProps = React.SVGProps<SVGPathElement> & {
  id?: string;
  path?: string;
  markerEnd?: string;
};

export const BaseEdge: React.FC<BaseEdgeProps> = ({ path = '', ...rest }) => (
  <path data-testid="base-edge" d={path} {...rest} />
);

// EdgeLabelRenderer: wraps labels for edges
export const EdgeLabelRenderer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <g data-testid="edge-label">{children}</g>;

// Handle: stub connector element for nodes
type HandleProps = React.HTMLAttributes<HTMLDivElement> & {
  id?: string;
  type?: 'source' | 'target';
  position?: (typeof Position)[keyof typeof Position] | string;
};

export const Handle: React.FC<HandleProps> = (props) => (
  <div data-testid="rf-handle" {...props} />
);

// Bezier path stub for DirectedEdge when no custom points are provided
export function getBezierPath(): [string, number, number] {
  return ['M 0,0 C 10,10 20,20 30,30', 10, 10];
}

// Types your components expect; keep loose so TS is happy
export type EdgeProps<T = any> = {
  id?: string;
  source?: string;
  target?: string;
  label?: string;
  data?: T;
};

export type NodeProps<T = any> = {
  id: string;
  data: T;
  selected?: boolean;
};
