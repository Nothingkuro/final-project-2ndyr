import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { FRONTEND_URL, LOGIN_PASSWORD, LOGIN_USERNAME } from './env';

export async function loginAsStaff(page: Page): Promise<void> {
  if (!LOGIN_PASSWORD) {
    throw new Error(
      'Missing login password. Set E2E_LOGIN_PASSWORD or SEED_STAFF_PASSWORD before running E2E tests.',
    );
  }

  await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Staff' }).click();

  await page.getByPlaceholder('Username').fill(LOGIN_USERNAME);
  await page.getByPlaceholder('Password').fill(LOGIN_PASSWORD);
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
  await page.goto(membersUrl, { waitUntil: 'domcontentloaded' });

  // If we got redirected back to a login-ish page, fail with a clear error
  if (!page.url().includes('/dashboard')) {
    throw new Error(`Not authenticated after login; redirected to: ${page.url()}`);
  }

  // Prefer a stable UI assertion as the real success criteria
  await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible({ timeout: 15_000 });

  // Keep a soft URL check
  await expect(page).toHaveURL(/\/dashboard\/members\/?(\?.*)?$/);
}

export function uniqueToken(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-8);
}
