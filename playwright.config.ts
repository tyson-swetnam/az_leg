import { defineConfig, devices } from '@playwright/test';

/**
 * Lightweight UI smoke-test config. Auto-starts the Vite dev server (which serves
 * the app under the `/az_leg/` base path) and runs a single chromium project.
 *
 * Run: `npx playwright install chromium` (once) then `npm run test:e2e`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    // Trailing slash matters: routes are resolved relative to this base.
    baseURL: 'http://localhost:5173/az_leg/',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173/az_leg/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
