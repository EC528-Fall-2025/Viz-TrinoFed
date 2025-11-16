import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Single React everywhere
      react: path.resolve(__dirname, '../../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(
        __dirname,
        '../../node_modules/react/jsx-runtime.js'
      ),
      'react/jsx-dev-runtime': path.resolve(
        __dirname,
        '../../node_modules/react/jsx-dev-runtime.js'
      ),

      // Our lightweight XYFlow mock for tests
      '@xyflow/react': path.resolve(
        __dirname,
        './vite-test/__mocks__/@xyflow/react.tsx'
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/frontend-tests/vite-test/setup.ts',
    deps: {
      inline: ['@testing-library/react', '@testing-library/dom'],
    },
  },
});
