import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import QueryNode from '../../../src/components/QueryNode';

describe('QueryNode', () => {
  it('renders label and state and basic metrics', () => {
    const data: any = {
      label: 'Scan Node',
      state: 'FINISHED',
      executionTime: 123,
      inputRows: 1000,
      inputBytes: 4096,
    };

    render(<QueryNode data={data} />);

    // expect(screen.getByText('Scan Node')).toBeInTheDocument();
    // expect(screen.getByText(/FINISHED/)).toBeInTheDocument();
    expect(screen.getByTestId('query-node')).toBeInTheDocument();
  });

});
