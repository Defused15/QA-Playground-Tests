import { defineConfig, devices } from '@playwright/test';

const VIEWPORT = { width: 1440, height: 900 };

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  /* Limit workers locally to avoid browser resource contention against external sites. */
  workers: process.env.CI ? 1 : 3,
  reporter: [
    ['html'],
    ['json', { outputFile: 'playwright-report/report.json' }],
  ],
  snapshotDir: './__snapshots__',
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'https://qaplayground.dev',
    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: VIEWPORT },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], viewport: VIEWPORT },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], viewport: VIEWPORT },
    },
  ],
});
