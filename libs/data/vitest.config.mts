import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/libs/data',
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'data',
    environment: 'node',
    // Nx runs it in a terminal, where Vitest would otherwise watch. Pass --watch to watch
    watch: false,
    include: ['src/**/*.spec.ts'],
  },
});
