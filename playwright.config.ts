import { defineConfig, devices } from '@playwright/test';

const webPort = process.env.WEB_PORT ?? '5173';
const apiPort = process.env.API_PORT ?? '3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${webPort}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : [
        {
          command: 'npm run dev:api',
          url: `http://localhost:${apiPort}/health/ready`,
          reuseExistingServer: true,
          timeout: 120_000,
        },
        {
          command: 'npm run dev:web',
          url: `http://localhost:${webPort}`,
          reuseExistingServer: true,
          timeout: 120_000,
        },
      ],
});
