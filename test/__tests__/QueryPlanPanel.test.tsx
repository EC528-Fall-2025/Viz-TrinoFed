import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import QueryPlanPanel from '../../src/components/QueryPlanPanel';

const events: any[] = [
  {
    eventType: 'SUBMITTED',
    state: 'RUNNING',
    timestamp: '2024-01-01T00:00:00Z',
  },
  {
    eventType: 'COMPLETED',
    state: 'FINISHED',
    timestamp: '2024-01-01T00:00:05Z',
    cpuTimeMs: 500,
    totalRows: 10,
    peakMemoryBytes: 1024,
  },
];

describe('QueryPlanPanel', () => {

  it('toggles plan view', () => {
    render(<QueryPlanPanel events={events} plan={'PLAN_CONTENT'} />);

    const planButton = screen.getByText('Plan');
    fireEvent.click(planButton);

    expect(screen.getByText('PLAN_CONTENT')).toBeInTheDocument();
  });
});
