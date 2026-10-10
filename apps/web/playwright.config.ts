import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

// Some sandboxed/CI containers ship a pinned Chromium build outside
// Playwright's normal cache and block the usual `playwright install`
// download. Use it when present; otherwise fall back to Playwright's
// default browser resolution (the normal case on a developer machine).
const sandboxChromiumPath = '/opt/pw-browsers/chromium';
const sandboxChromiumExists = existsSync(sandboxChromiumPath);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: process.env.WEB_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(sandboxChromiumExists
          ? { launchOptions: { executablePath: sandboxChromiumPath } }
          : {}),
      },
    },
  ],
  webServer: {
    command: 'pnpm run build && pnpm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
