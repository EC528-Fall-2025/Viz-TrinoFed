import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BasicCard, {
  StatusChip,
  setStatusColor,
  setStatusIcon,
} from '../Card';

describe('Card helpers', () => {
  it('setStatusColor maps statuses to expected colors', () => {
    expect(setStatusColor('ok')).toBe('#22c601');
    expect(setStatusColor('failed')).toBe('#c60101');
    expect(setStatusColor('queued')).toBe('#ffffff');
    expect(setStatusColor('unknown')).toBe('#cdcdcd');
  });

  it('setStatusIcon returns an element for each status', () => {
    const statuses = [
      'ok',
      'idle',
      'failed',
      'queued',
      'finished',
      'unknown',
      'running',
    ] as const;

    for (const s of statuses) {
      const icon = setStatusIcon(s);
      expect(icon).toBeTruthy();
    }
  });
});

describe('StatusChip', () => {
  it('renders nothing when status is undefined', () => {
    const { container } = render(<StatusChip status={undefined as any} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders chip with uppercased label and status class', () => {
    render(<StatusChip status="ok" />);
    const chip = screen.getByTestId('query-status-chip');
    expect(chip).toHaveTextContent('OK');
    expect(chip.className).toContain('status-success');
  });
});

describe('BasicCard', () => {
  const baseProps = {
    title: 'Query 1',
    description: 'Runs something important',
    status: 'ok' as const,
    timestamp: '2024-01-01T00:00:00Z',
  };

  it('renders title, description, status chip, and timestamp', () => {
    render(<BasicCard {...baseProps} />);
    expect(screen.getByText('Query 1')).toBeInTheDocument();
    expect(screen.getByText('Runs something important')).toBeInTheDocument();
    expect(screen.getByTestId('query-status-chip')).toBeInTheDocument();
    expect(screen.getByText(baseProps.timestamp)).toBeInTheDocument();
  });

  it('applies status class on root card', () => {
    render(<BasicCard {...baseProps} />);
    const card = screen.getByTestId('query-status-card');
    expect(card.className).toContain('status-success');
  });

  it('invokes onClick when card is clicked', () => {
    const onClick = vi.fn();
    render(<BasicCard {...baseProps} onClick={onClick} />);
    const card = screen.getByTestId('query-status-card');
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
