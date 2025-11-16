import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatisticsPanel from '../../../src/components/StatisticsPanel';

describe('StatisticsPanel', () => {
  it('returns null when no events with statistics', () => {
    const query: any = { events: [] };
    const { container } = render(<StatisticsPanel query={query} />);
    expect(container).toBeEmptyDOMElement();
  });

});
