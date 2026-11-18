// Page tests for the static E2E report (scripts/report). Separate from the
// main suite: `npx playwright test` uses playwright.config.ts and ./tests.
import { defineConfig, devices } from '@playwright/test';

const PORT = 4318;
const DESKTOP = { width: 1440, height: 900 };

export default defineConfig({
  testDir: 'report-tests/ui',
  testMatch: '*.spec.mjs',
  globalSetup: './report-tests/ui/global-setup.mjs',
  outputDir: 'test-results/report-ui',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI
    ? [
        ['list'],
        [
          'html',
          { open: 'never', outputFolder: 'test-results/report-ui-html' },
        ],
      ]
    : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node report-tests/ui/serve.mjs',
    url: `http://127.0.0.1:${PORT}/health`,
    env: { PORT: String(PORT) },
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: DESKTOP },
    },
    {
      name: 'desktop-webkit',
      use: { ...devices['Desktop Safari'], viewport: DESKTOP },
    },
    {
      name: 'mobile',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
        deviceScaleFactor: 3,
      },
    },
  ],
});
