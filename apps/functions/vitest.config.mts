import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/functions',
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'functions',
    environment: 'node',
    // Nx runs it in a terminal, where Vitest would otherwise watch. Pass --watch to watch
    watch: false,
    include: ['src/**/*.spec.ts'],
    globalSetup: ['src/test/global-setup.ts'],
    setupFiles: ['src/test/setup.ts'],
    env: {
      FIRESTORE_EMULATOR_HOST: '127.0.0.1:8180',
      GCLOUD_PROJECT: 'demo-f2020',
    },
    // The tests share one emulator, which is cleared after each test
    fileParallelism: false,
    // The functions log every error, which is only of interest when a test fails
    silent: 'passed-only',
  },
});
