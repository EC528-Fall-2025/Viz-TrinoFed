// vitest.setup.ts
import '@testing-library/jest-dom';
// import { vi } from 'vitest';

// matchMedia mock
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// // clipboard mock
// if (!navigator.clipboard) {
//   // @ts-expect-error
//   navigator.clipboard = {
//     writeText: vi.fn().mockResolvedValue(undefined),
//   };
// }

