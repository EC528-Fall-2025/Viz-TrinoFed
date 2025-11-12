import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Position, type NodeProps } from '@xyflow/react';
import {
  setStatusColor,
  setStatusIcon,
  QueryTree,
  QueryRFNode,
  QueryNodeData,
} from '../Node';

describe('Node helpers', () => {
  it('setStatusColor returns appropriate colors', () => {
    expect(setStatusColor('ok')).toBe('#c8e6c9');
    expect(setStatusColor('failed')).toBe('#ffcdd2');
    expect(setStatusColor('queued')).toBe('#e3f2fd');
    expect(setStatusColor('unknown')).toBe('#f5f5f5');
  });

  it('setStatusIcon returns an element', () => {
    const icon = setStatusIcon('ok');
    expect(icon).toBeTruthy();
  });
});

describe('QueryTree', () => {
  it('renders QueryNode entries for each node', () => {
    const nodes: QueryNodeData[] = [
      {
        id: 'n1',
        stage: 'Scan',
        status: 'ok',
        metrics: [],
        children: [],
      },
    ];

    render(<QueryTree nodes={nodes} />);
    expect(screen.getByTestId('query-node-n1')).toBeInTheDocument();
  });
});

describe('QueryRFNode', () => {
  it('invokes onSelect on click and keyboard, and sets error class', () => {
    const onSelect = vi.fn();

    const node: QueryNodeData = {
      id: 'frag1',
      stage: 'Fragment',
      status: 'failed',
      metrics: [],
      children: [],
    };

    const props = {
      id: 'frag1',
      data: { node, onSelect },
      selected: false,
      dragging: false,
      selectable: true,
      connectable: true,
      deletable: true,
      focusable: true,
      draggable: false,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      zIndex: 0,
      positionAbsolute: { x: 0, y: 0 },
    } as unknown as NodeProps;

    render(<QueryRFNode {...props} />);

    const el = screen.getByTestId('node-frag1');

    fireEvent.click(el);
    fireEvent.keyDown(el, { key: 'Enter' });
    fireEvent.keyDown(el, { key: ' ' });

    expect(onSelect).toHaveBeenCalledTimes(3);
    expect(el.className).toContain('node-error');
  });
});
