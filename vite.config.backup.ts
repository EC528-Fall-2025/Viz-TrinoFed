import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()] as any,
  resolve: {
    alias: {
      // ONLY mock @xyflow/react for tests; do NOT alias react itself
      '@xyflow/react': resolve(
        __dirname,
        'vite-test/__mocks__/@xyflow/react.ts'
      ),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vite-test/setup.ts',
  },
});