import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UnifiedMetricsPanel from '../../../src/components/UnifiedMetricsPanel';
import React from 'react';
 

const baseQuery: any = {
  queryId: 'q1',
  user: 'alice',
  state: 'FINISHED',
  startTime: '2024-01-01T00:00:00Z',
  endTime: '2024-01-01T00:00:05Z',
  events: [
    {
      eventType: 'COMPLETED',
      state: 'FINISHED',
      timestamp: '2024-01-01T00:00:05Z',
      cpuTimeMs: 1000,
      wallTimeMs: 2000,
      queuedTimeMs: 100,
      peakMemoryBytes: 1024 * 1024,
      totalRows: 10,
      totalBytes: 4096,
      completedSplits: 2,
      catalog: 'hive',
      schema: 'default',
      statistics: {},
    },
  ],
};

describe('UnifiedMetricsPanel', () => {
  beforeEach(() => {
    // Default: desktop breakpoint
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as any;
  });
//TODO: Revisit this
//   it('hides panel when isOpen = false', () => {
//     render(
//       <UnifiedMetricsPanel
//         query={baseQuery}
//         activeFragment={null}
//         isOpen={false}
//       />
//     );
//     const panel = screen.getByTestId('metrics-side-panel');
//     expect(panel.className).toContain('is-closed');
//   });

//   it('shows panel when isOpen = true', () => {
//     render(
//       <UnifiedMetricsPanel
//         query={baseQuery}
//         activeFragment={null}
//         isOpen={true}
//       />
//     );
//     const panel = screen.getByTestId('metrics-side-panel');
//     expect(panel.className).toContain('is-open');
//     expect(screen.getByText(/Query Metrics & Statistics/)).toBeInTheDocument();
//     expect(screen.getByText('q1')).toBeInTheDocument();
//   });

//   it('calls onClose when close button clicked', () => {
//     const onClose = vi.fn();
//     render(
//       <UnifiedMetricsPanel
//         query={baseQuery}
//         activeFragment={null}
//         isOpen={true}
//         onClose={onClose}
//       />
//     );
//     fireEvent.click(screen.getByTestId('close-button'));
//     expect(onClose).toHaveBeenCalledTimes(1);
//   });

  it('shows mobile open button and calls onOpen when clicked', () => {
    const onOpen = vi.fn();

    // mobile viewport
    window.matchMedia = ((query: string) => ({
      matches: query.includes('max-width'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as any;

    render(
      <UnifiedMetricsPanel
        query={baseQuery}
        activeFragment={null}
        isOpen={false}
        onOpen={onOpen}
      />
    );

    const btn = screen.getByTestId('open-panel-button');
    fireEvent.click(btn);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
