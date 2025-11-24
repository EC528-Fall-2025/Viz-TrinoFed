import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as React from 'react';
import { createRoot } from 'react-dom/client';

function Smoke() {
  const [count, setCount] = React.useState(0);
  return <button>{count}</button>;
}

describe('react hooks sanity', () => {
  it('logs react info', () => {
    console.log('React.version:', (React as any).version);
    console.log('React.isMock:', (React as any)._isMockFunction === true);
    console.log('React keys:', Object.keys(React).sort());
  });

  it('createRoot direct render', () => {
    const div = document.createElement('div');
    const root = createRoot(div);
    root.render(<Smoke />);
  });

  it('testing-library render', () => {
    render(<Smoke />);
  });
});
