import { expect, test } from '@playwright/test';
import { loginAsOwner, uniqueToken } from '../support/auth';
import { resetDatabase } from '../support/db';

test.describe('Profile management e2e', () => {
  test.beforeAll(() => {
    resetDatabase('profile-management-beforeAll');
  });

  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
    await page.getByRole('link', { name: 'Profiles' }).click();
    await expect(page).toHaveURL(/\/dashboard\/profile/);
    await expect(page.getByRole('heading', { name: 'Profiles' })).toBeVisible();
  });

  test('owner updates admin and staff credentials', async ({ page }) => {
    const token = uniqueToken();
    const newAdminUsername = `owner_${token}`;
    const newStaffUsername = `staff_${token}`;
    const newAdminPassword = `Owner${token}Pass`;
    const newStaffPassword = `Staff${token}Pass`;

    const adminUsernameInput = page.getByPlaceholder('Admin username');
    const adminPasswordInput = page.getByPlaceholder('Admin new password');
    const staffUsernameInput = page.getByPlaceholder('Staff username');
    const staffPasswordInput = page.getByPlaceholder('Staff new password');

    await expect(adminUsernameInput).toBeVisible();
    await expect(adminPasswordInput).toBeVisible();
    await expect(staffUsernameInput).toBeVisible();
    await expect(staffPasswordInput).toBeVisible();

    await expect(adminUsernameInput).toHaveValue(/.+/);
    await expect(staffUsernameInput).toHaveValue(/.+/);

    await expect(page.getByText('Created At')).toHaveCount(2);
    await expect(page.getByText('Last Updated')).toHaveCount(2);

    await expect(
      page.locator([
        'input[placeholder="Admin username"]',
        'input[placeholder="Admin new password"]',
        'input[placeholder="Staff username"]',
        'input[placeholder="Staff new password"]',
      ].join(', '))
    ).toHaveCount(4);

    const updateAdminResponsePromise = page.waitForResponse((response) => (
      response.request().method() === 'PUT'
      && response.url().includes('/api/profile')
      && response.ok()
    ));

    await adminUsernameInput.fill(newAdminUsername);
    await adminPasswordInput.fill(newAdminPassword);
    await page.getByRole('button', { name: 'Save Admin Profile' }).click();

    await updateAdminResponsePromise;
    await expect(page.getByText('Admin credentials updated successfully.')).toBeVisible();
    await expect(adminUsernameInput).toHaveValue(newAdminUsername);

    const updateStaffResponsePromise = page.waitForResponse((response) => (
      response.request().method() === 'PUT'
      && response.url().includes('/api/users/')
      && response.ok()
    ));

    await staffUsernameInput.fill(newStaffUsername);
    await staffPasswordInput.fill(newStaffPassword);
    await page.getByRole('button', { name: 'Save Staff Profile' }).click();

    await updateStaffResponsePromise;
    await expect(page.getByText('Staff credentials updated successfully.')).toBeVisible();
    await expect(staffUsernameInput).toHaveValue(newStaffUsername);
  });
});
