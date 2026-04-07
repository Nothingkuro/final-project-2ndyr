import { expect, test } from '@playwright/test';
import { loginAsStaff } from '../support/auth';
import { resetDatabase } from '../support/db';

const SEEDED_ACTIVE_MEMBER = {
  fullName: 'Carlos Reyes',
  contactNumber: '09170000001',
};

test.describe('Payment and subscription tracking e2e', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    resetDatabase(`${testInfo.title}-beforeEach`);
    await loginAsStaff(page);
  });

  test('staff processes payment on the payments page', async ({ page }) => {
    await page.locator('a[href="/dashboard/payments"]').first().click();
    await expect(page).toHaveURL(/\/dashboard\/payments/);
    await expect(page.getByPlaceholder('Search member...')).toBeEnabled();

    await page.getByPlaceholder('Search member...').fill(SEEDED_ACTIVE_MEMBER.contactNumber);
    await expect(page.getByText(SEEDED_ACTIVE_MEMBER.fullName, { exact: true })).toBeVisible();
    await page.getByText(SEEDED_ACTIVE_MEMBER.fullName, { exact: true }).click();

    await page.locator('#paymentMethod').selectOption({ label: 'GCASH' });
    await page.getByRole('row', { name: /Quarterly Plus/ }).click();
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByText('Payment recorded successfully.')).toBeVisible();
  });

  test('staff views member payment history and filters by April', async ({ page }) => {
    await page.locator('a[href="/dashboard/payments"]').first().click();
    await expect(page).toHaveURL(/\/dashboard\/payments/);
    await expect(page.getByPlaceholder('Search member...')).toBeEnabled();

    await page.getByPlaceholder('Search member...').fill(SEEDED_ACTIVE_MEMBER.contactNumber);
    await expect(page.getByText(SEEDED_ACTIVE_MEMBER.fullName, { exact: true })).toBeVisible();
    await page.getByText(SEEDED_ACTIVE_MEMBER.fullName, { exact: true }).click();

    await page.locator('#paymentMethod').selectOption({ label: 'CASH' });
    await page.getByRole('row', { name: /Daily Pass/ }).click();
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Payment recorded successfully.')).toBeVisible();

    await page.locator('a[href="/dashboard/members"]').first().click();
    await expect(page).toHaveURL(/\/dashboard\/members/);

    await page.getByPlaceholder('Search member...').fill(SEEDED_ACTIVE_MEMBER.contactNumber);
    await expect(page.getByText(SEEDED_ACTIVE_MEMBER.fullName, { exact: true })).toBeVisible();
    await page.getByText(SEEDED_ACTIVE_MEMBER.fullName, { exact: true }).click();

    await expect(page).toHaveURL(/\/dashboard\/members\/.+/);
    await page.getByRole('button', { name: 'Payment History' }).click();

    await page.locator('label:has-text("Month") select').selectOption({ label: 'April' });

    const paymentHistoryEntry = page.getByRole('article');
    await expect(paymentHistoryEntry).toContainText('April');
    await expect(paymentHistoryEntry).not.toContainText('March');
  });
});
