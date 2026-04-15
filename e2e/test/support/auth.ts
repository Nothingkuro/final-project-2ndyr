import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import {
  FRONTEND_URL,
  LOGIN_PASSWORD,
  LOGIN_USERNAME,
  OWNER_LOGIN_PASSWORD,
  OWNER_LOGIN_USERNAME,
} from './env';

interface LoginAsRoleOptions {
  role: 'Staff' | 'Owner';
  username: string;
  password?: string;
  missingPasswordMessage: string;
}

const NAVIGATION_ATTEMPTS = 3;
const NAVIGATION_TIMEOUT_MS = 20_000;

function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function gotoWithRetries(page: Page, url: string, description: string): Promise<void> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= NAVIGATION_ATTEMPTS; attempt += 1) {
    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: NAVIGATION_TIMEOUT_MS,
      });
      return;
    } catch (error) {
      lastError = error;

      if (attempt < NAVIGATION_ATTEMPTS) {
        await page.waitForTimeout(750);
      }
    }
  }

  throw new Error(
    `Unable to navigate to ${description} (${url}) after ${NAVIGATION_ATTEMPTS} attempts: ${formatErrorMessage(lastError)}`,
  );
}

async function loginAsRole(page: Page, options: LoginAsRoleOptions): Promise<void> {
  const {
    role,
    username,
    password,
    missingPasswordMessage,
  } = options;

  if (!password) {
    throw new Error(
      missingPasswordMessage,
    );
  }

  await gotoWithRetries(page, FRONTEND_URL, 'login page');
  await expect(page.getByRole('button', { name: role })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: role }).click();

  await page.getByPlaceholder('Username').fill(username);
  await page.getByPlaceholder('Password').fill(password);
  const loginResponsePromise = page.waitForResponse((response) => {
    return response.url().includes('/api/auth/login') && response.request().method() === 'POST';
  });

  await Promise.all([
    // if the app does navigate after login, catch it; if not, that's fine
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
    page.getByRole('button', { name: 'Log In' }).click(),
  ]);

  const loginResponse = await loginResponsePromise;
  if (!loginResponse.ok()) {
    const failureBody = await loginResponse.text().catch(() => 'Unable to read login response body');
    throw new Error(`Login failed with status ${loginResponse.status()}: ${failureBody}`);
  }

  // Ensure the frontend successfully stores the role in sessionStorage
  await page.waitForFunction(() => window.sessionStorage.getItem('authRole') !== null, undefined, { timeout: 10_000 }).catch(() => {
    throw new Error('E2E Login Helper: authRole never appeared in sessionStorage after login request.');
  });

  // Force the page your tests expect
  const membersUrl = new URL('/dashboard/members', FRONTEND_URL).toString();
  await gotoWithRetries(page, membersUrl, 'members dashboard');

  // If we got redirected back to a login-ish page, fail with a clear error
  if (!page.url().includes('/dashboard')) {
    throw new Error(`Not authenticated after login; redirected to: ${page.url()}`);
  }

  // Prefer a stable UI assertion as the real success criteria
  await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible({ timeout: 15_000 });

  // Keep a soft URL check
  await expect(page).toHaveURL(/\/dashboard\/members\/?(\?.*)?$/);
}

export async function loginAsStaff(page: Page): Promise<void> {
  await loginAsRole(page, {
    role: 'Staff',
    username: LOGIN_USERNAME,
    password: LOGIN_PASSWORD,
    missingPasswordMessage:
      'Missing login password. Set E2E_LOGIN_PASSWORD or SEED_STAFF_PASSWORD before running E2E tests.',
  });
}

export async function loginAsOwner(page: Page): Promise<void> {
  await loginAsRole(page, {
    role: 'Owner',
    username: OWNER_LOGIN_USERNAME,
    password: OWNER_LOGIN_PASSWORD,
    missingPasswordMessage:
      'Missing owner login password. Set E2E_OWNER_PASSWORD or SEED_OWNER_PASSWORD before running E2E tests.',
  });
}

export async function loginAsAdmin(page: Page): Promise<void> {
  await loginAsOwner(page);
}

export function uniqueToken(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-8);
}
