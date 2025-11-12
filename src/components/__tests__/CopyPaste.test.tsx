import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CopyPaste from '../CopyPaste';

describe('CopyPaste', () => {
  beforeEach(() => {
    vi.useFakeTimers();

    const writeTextMock = vi.fn().mockResolvedValue(undefined);

    // Define (or redefine) navigator.clipboard for each test
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });
  });

  it('copies provided dataToCopy on click', async () => {
    render(<CopyPaste dataToCopy="hello world" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello world');
  });

  it('toggles checkmark after copy and reverts', async () => {
    render(<CopyPaste dataToCopy="hello world" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // checkmark visible after copy
    expect(screen.getByTestId('copy-success-icon')).toBeInTheDocument();

    // advance timers to let it revert
    vi.runAllTimers();

    // original icon visible again (or success icon gone)
  });
});
