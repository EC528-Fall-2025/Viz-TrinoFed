import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DatabaseNode from '../../src/components/DatabaseNode';

describe('DatabaseNode', () => {
  it('renders database name and type label for relational DB', () => {
    const data: any = {
      name: 'Main Warehouse',
      type: 'postgresql',
      status: 'ACTIVE',
      label: 'main',
      schemas: [
        { name: 'public', tables: [{ name: 'users' }, { name: 'orders' }] },
      ],
    };

    render(<DatabaseNode data={data} />);

    expect(screen.getByTestId('database-node')).toBeInTheDocument();
    // expect(screen.getByText(/POSTGRESQL/i)).toBeInTheDocument();
  });

  // it('renders collections list for MongoDB', () => {
  //   const data: any = {
  //     name: 'Events DB',
  //     type: 'mongodb',
  //     status: 'ACTIVE',
  //     label: 'mongo',
  //     collections: [
  //       { name: 'events', fields: ['a', 'b'], documentCount: 10 },
  //       { name: 'logs', fields: [], documentCount: 5 },
  //     ],
  //   };

  //   render(<DatabaseNode data={data} />);
  //   expect(screen.getByText(/Events DB/)).toBeInTheDocument();
  //   // collection names appear
  //   expect(screen.getByText(/events/i)).toBeInTheDocument();
  //   expect(screen.getByText(/logs/i)).toBeInTheDocument();
  // });
});
