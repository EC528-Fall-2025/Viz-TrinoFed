import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import QueryMetricsPanel from '../QueryMetricsPanel';

const baseQuery: any = {
  queryId: 'q1',
  state: 'FINISHED',
  user: 'alice',
  startTime: '2024-01-01T00:00:00Z',
  endTime: '2024-01-01T00:00:10Z',
  events: [
    {
      eventType: 'COMPLETED',
      state: 'FINISHED',
      timestamp: '2024-01-01T00:00:10Z',
      cpuTimeMs: 1000,
      wallTimeMs: 2000,
      queuedTimeMs: 0,
      peakMemoryBytes: 1024,
      totalRows: 10,
      totalBytes: 2048,
      completedSplits: 2,
      catalog: 'hive',
      schema: 'default',
    },
  ],
};

describe('QueryMetricsPanel', () => {
  it('renders header and status', () => {
    render(<QueryMetricsPanel query={baseQuery} />);
    expect(screen.getByText('Query ID')).toBeInTheDocument();
  });

});
