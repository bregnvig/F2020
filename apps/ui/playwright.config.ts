import { defineConfig } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { join } from 'path';
// eslint-disable-next-line

// For CI, you may want to set BASE_URL to the deployed application.
const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './playwright' }),
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Capture screenshot after each test failure. */
    screenshot: 'only-on-failure',
    /* Record video for each test, but remove all videos from successful test runs. */
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run serve',
    port: 4200,
  },

  globalSetup: join(__dirname, 'playwright/globalSetup.ts'),
  globalTeardown: join(__dirname, 'playwright/globalTeardown.ts'),

  /* Run your local dev server before starting the tests */ // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  //   cwd: workspaceRoot,
  // },
});
