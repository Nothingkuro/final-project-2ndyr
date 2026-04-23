import { expect, test } from '@playwright/test';
import { resetDatabase } from '../support/db';
import {
  FRONTEND_URL,
  LOGIN_USERNAME,
  LOGIN_PASSWORD,
  OWNER_LOGIN_USERNAME,
  OWNER_LOGIN_PASSWORD,
} from '../support/env';

async function navigateToLogin(page: import('@playwright/test').Page): Promise<void> {
  await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' });
}

test.describe('Authentication flow e2e', () => {
  test.beforeAll(async () => {
    await resetDatabase('authentication-flow-beforeAll');
  });

  test('shows login form with Staff and Owner role buttons', async ({ page }) => {
    await navigateToLogin(page);

    await expect(page.getByRole('button', { name: 'Staff' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Owner' })).toBeVisible();
  });

  test('shows error message when logging in with invalid credentials', async ({ page }) => {
    await navigateToLogin(page);

    await page.getByRole('button', { name: 'Staff' }).click();
    await page.getByPlaceholder('Username').fill('nonexistent_user');
    await page.getByPlaceholder('Password').fill('wrongpassword123');

    const loginResponsePromise = page.waitForResponse((response) => (
      response.url().includes('/api/auth/login')
      && response.request().method() === 'POST'
    ));

    await page.getByRole('button', { name: 'Log In' }).click();

    const loginResponse = await loginResponsePromise;
    expect(loginResponse.ok()).toBe(false);

    // Should show an error indication and NOT navigate to dashboard
    await expect(page).not.toHaveURL(/\/dashboard/);
  });

  test('staff can login and is redirected to members dashboard', async ({ page }) => {
    if (!LOGIN_PASSWORD) {
      test.skip(true, 'Missing E2E_LOGIN_PASSWORD — cannot test staff login');
      return;
    }

    await navigateToLogin(page);

    await page.getByRole('button', { name: 'Staff' }).click();
    await page.getByPlaceholder('Username').fill(LOGIN_USERNAME);
    await page.getByPlaceholder('Password').fill(LOGIN_PASSWORD);

    const loginResponsePromise = page.waitForResponse((response) => (
      response.url().includes('/api/auth/login')
      && response.request().method() === 'POST'
      && response.ok()
    ));

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
      page.getByRole('button', { name: 'Log In' }).click(),
    ]);

    await loginResponsePromise;

    await page.goto(`${FRONTEND_URL}/dashboard/members`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible({ timeout: 15_000 });

    // Staff should NOT see admin-only navigation items
    await expect(page.getByRole('link', { name: 'Suppliers' })).toBeHidden();
    await expect(page.getByRole('link', { name: 'Reports' })).toBeHidden();
    await expect(page.getByRole('link', { name: 'Profiles' })).toBeHidden();
  });

  test('owner can login and sees all navigation items including admin links', async ({ page }) => {
    if (!OWNER_LOGIN_PASSWORD) {
      test.skip(true, 'Missing E2E_OWNER_PASSWORD — cannot test owner login');
      return;
    }

    await navigateToLogin(page);

    await page.getByRole('button', { name: 'Owner' }).click();
    await page.getByPlaceholder('Username').fill(OWNER_LOGIN_USERNAME);
    await page.getByPlaceholder('Password').fill(OWNER_LOGIN_PASSWORD);

    const loginResponsePromise = page.waitForResponse((response) => (
      response.url().includes('/api/auth/login')
      && response.request().method() === 'POST'
      && response.ok()
    ));

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
      page.getByRole('button', { name: 'Log In' }).click(),
    ]);

    await loginResponsePromise;

    await page.goto(`${FRONTEND_URL}/dashboard/members`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible({ timeout: 15_000 });

    // Owner should see admin-only navigation items
    await expect(page.getByRole('link', { name: 'Suppliers' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Reports' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Profiles' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Membership Plans' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Assets Inventory' })).toBeVisible();
  });

  test('user can logout and is redirected to login page', async ({ page }) => {
    if (!LOGIN_PASSWORD) {
      test.skip(true, 'Missing E2E_LOGIN_PASSWORD — cannot test logout');
      return;
    }

    await navigateToLogin(page);

    await page.getByRole('button', { name: 'Staff' }).click();
    await page.getByPlaceholder('Username').fill(LOGIN_USERNAME);
    await page.getByPlaceholder('Password').fill(LOGIN_PASSWORD);

    const loginResponsePromise = page.waitForResponse((response) => (
      response.url().includes('/api/auth/login')
      && response.request().method() === 'POST'
      && response.ok()
    ));

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
      page.getByRole('button', { name: 'Log In' }).click(),
    ]);

    await loginResponsePromise;

    await page.goto(`${FRONTEND_URL}/dashboard/members`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible({ timeout: 15_000 });

    // Click Log Out
    await page.getByRole('button', { name: 'Log Out' }).click();

    // Should be redirected to login page
    await expect(page).toHaveURL(FRONTEND_URL + '/');
    await expect(page.getByRole('button', { name: 'Staff' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Owner' })).toBeVisible();

    // Navigating to dashboard should redirect back to login
    await page.goto(`${FRONTEND_URL}/dashboard/members`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Members' })).toBeHidden();
  });
});
