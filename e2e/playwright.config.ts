import path from 'node:path';
import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

const repoRoot = path.resolve(__dirname, '..');
const envPath = path.resolve(__dirname, '.env.test');
const repoEnvPath = path.resolve(__dirname, '../.env');
const backendEnvPath = path.resolve(__dirname, '../backend/.env');

dotenv.config({ path: repoEnvPath, override: false });
dotenv.config({ path: backendEnvPath, override: false });
dotenv.config({ path: envPath, override: true });

if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}

if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL_TEST in e2e/.env.test for Playwright E2E database setup.');
}

const frontendPort = Number(process.env.E2E_FRONTEND_PORT ?? '5173');
const backendPort = Number(process.env.E2E_BACKEND_PORT ?? '5001');
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${frontendPort}`;
const baseURLHost = new URL(baseURL).hostname;
const defaultApiBaseUrl = `http://${baseURLHost}:${backendPort}`;
const isHeadless = process.env.E2E_HEADLESS !== 'false';

export default defineConfig({
  testDir: './test/specs',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  reporter: process.env.CI
    ? [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : [['list'], ['html', { outputFolder: 'playwright-report', open: 'on-failure' }]],
  use: {
    baseURL,
    headless: isHeadless,
    viewport: { width: 1440, height: 900 },
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm --prefix backend run start:e2e',
      cwd: repoRoot,
      url: `http://127.0.0.1:${backendPort}/api/members`,
      reuseExistingServer: process.env.E2E_USE_EXISTING_BACKEND === 'true',
      timeout: 120_000,
      env: {
        ...process.env,
        PORT: String(backendPort),
        NODE_ENV: 'test',
        FRONTEND_URL: baseURL,
      },
    },
    {
      command: `npm --prefix frontend run dev -- --host 127.0.0.1 --port ${frontendPort} --strictPort`,
      cwd: repoRoot,
      url: baseURL,
      reuseExistingServer: process.env.E2E_USE_EXISTING_FRONTEND === 'true',
      timeout: 120_000,
      env: {
        ...process.env,
        VITE_API_BASE_URL:
          process.env.VITE_API_BASE_URL ?? defaultApiBaseUrl,
      },
    },
  ],
});
