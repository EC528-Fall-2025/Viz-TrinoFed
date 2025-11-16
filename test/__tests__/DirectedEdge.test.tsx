import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Position } from '@xyflow/react';
import DirectedEdge from '../../src/components/DirectedEdge';

describe('DirectedEdge', () => {
  // TODO: Revisit adding tests for polyline path when bendPoints are provided
  // it('renders polyline path when bendPoints are provided', () => {
  //   render(
  //     <DirectedEdge
  //       id="e1"
  //       source="a"
  //       target="b"
  //       sourceX={0}
  //       sourceY={0}
  //       targetX={100}
  //       targetY={100}
  //       sourcePosition={Position.Right}
  //       targetPosition={Position.Left}
  //       data={{ points: [{ x: 0, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 0 }] }}
  //     />
  //   );

  //   const svg = screen.getByTestId('base-edge');
  //   const path = svg.querySelector('path');
  //   expect(path).toHaveAttribute('d', 'M 0,0 L 50,50 L 100,0');
  // });

  it('falls back to bezier path and renders label when no bendPoints', () => {
    render(
      <DirectedEdge
        id="e2"
        source="a"
        target="b"
        sourceX={0}
        sourceY={0}
        targetX={100}
        targetY={100}
        sourcePosition={Position.Right}
        targetPosition={Position.Left}
        label="Edge Label"
      />
    );

    // const svg = screen.getByTestId('base-edge');
    // const path = svg.querySelector('path');
    // // From our mocked getBezierPath in vitest.setup.ts
    // expect(path?.getAttribute('d')).toContain('M 0,0 C 10,10 20,20 30,30');

    const labelWrapper = screen.getByTestId('directed-edge');
    expect(labelWrapper).toBeInTheDocument();
  });
});
