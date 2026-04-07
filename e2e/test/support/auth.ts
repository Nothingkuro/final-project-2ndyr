import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { createHmac } from 'node:crypto';
import { FRONTEND_URL, LOGIN_PASSWORD, LOGIN_USERNAME } from './env';

const DEV_JWT_SECRET = 'dev-only-change-this-secret';

function base64Url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signSessionToken(payload: { sub: string; username: string; role: string }): string {
  const secret = process.env.JWT_SECRET ?? (process.env.NODE_ENV !== 'production' ? DEV_JWT_SECRET : undefined);

  if (!secret) {
    throw new Error('JWT_SECRET is required to mint an E2E auth token in production.');
  }

  const header = { alg: 'HS256', typ: 'JWT' };
  const issuedAt = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: issuedAt,
    exp: issuedAt + 60 * 60 * 24,
  };

  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(tokenPayload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac('sha256', secret).update(data).digest('base64url');

  return `${data}.${signature}`;
}

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
  await page.getByRole('button', { name: 'Log In' }).click();
  const loginResponse = await loginResponsePromise;

  if (!loginResponse.ok()) {
    const failureBody = await loginResponse.text().catch(() => 'Unable to read login response body');
    throw new Error(`Login failed with status ${loginResponse.status()}: ${failureBody}`);
  }

  const responseData = await loginResponse.json() as {
    user?: { id?: string; username?: string; role?: string };
  };

  const userId = responseData.user?.id;
  const username = responseData.user?.username ?? LOGIN_USERNAME;
  const role = responseData.user?.role ?? 'STAFF';

  if (typeof userId === 'string' && userId) {
    const token = signSessionToken({ sub: userId, username, role });

    await page.evaluate((value) => {
      window.sessionStorage.setItem('authToken', value);
    }, token);
  }

  try {
    await expect(page).toHaveURL(/\/dashboard\/members/, { timeout: 5_000 });
  } catch {
    const membersUrl = new URL('/dashboard/members', FRONTEND_URL).toString();
    await page.goto(membersUrl, { waitUntil: 'domcontentloaded' });
  }

  await expect(page).toHaveURL(/\/dashboard\/members/);
  await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible();
}

export function uniqueToken(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-8);
}
