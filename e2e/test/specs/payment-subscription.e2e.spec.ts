import { expect, test } from '@playwright/test';
import { loginAsStaff } from '../support/auth';
import { resetDatabase } from '../support/db';

const SEEDED_ACTIVE_MEMBER = {
  fullName: 'Carlos Reyes',
  contactNumber: '09170000001',
};

test.describe('Payment and subscription tracking e2e', () => {
  test.beforeAll(async () => {
    await resetDatabase('payment-subscription-beforeAll');
  });

  test.beforeEach(async ({ page }) => {
    await loginAsStaff(page);
  });

  test('staff processes payment on the payments page and can undo it within grace period', async ({ page }) => {
    await page.getByRole('link', { name: 'Payments' }).click();
    await expect(page).toHaveURL(/\/dashboard\/payments/);
    await expect(page.getByPlaceholder('Search member...')).toBeEnabled();

    await page.getByPlaceholder('Search member...').fill(SEEDED_ACTIVE_MEMBER.contactNumber);
    await expect(page.getByText(SEEDED_ACTIVE_MEMBER.fullName, { exact: true })).toBeVisible();
    await expect(page.getByText('ACTIVE', { exact: true })).toBeVisible();
    await page.getByText(SEEDED_ACTIVE_MEMBER.fullName, { exact: true }).click();

    await page.getByRole('combobox', { name: /payment method/i }).selectOption({ label: 'GCASH' });
    await expect(page.getByLabel('GCash Reference Number')).toBeVisible();
    await page.getByLabel('GCash Reference Number').fill('1029384756123');
    await page.getByRole('row', { name: /Quarterly Plus/ }).click();
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByText('Payment recorded successfully. Undo is available for 5 seconds.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Undo Action' })).toBeVisible();

    const undoPaymentResponsePromise = page.waitForResponse((response) => (
      response.request().method() === 'POST'
      && /\/api\/payments\/[^/]+\/undo$/.test(response.url())
      && response.ok()
    ));

    await page.getByRole('button', { name: 'Undo Action' }).click();
    await undoPaymentResponsePromise;

    await expect(page.getByText('Payment successfully undone.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
  });

  test('staff views member payment history and filters by current month', async ({ page }) => {
    const today = new Date();
    const currentMonth = today.toLocaleString('default', { month: 'long' });
    const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      .toLocaleString('default', { month: 'long' });

    await page.getByRole('link', { name: 'Payments' }).click();
    await expect(page).toHaveURL(/\/dashboard\/payments/);
    await expect(page.getByPlaceholder('Search member...')).toBeEnabled();

    await page.getByPlaceholder('Search member...').fill(SEEDED_ACTIVE_MEMBER.contactNumber);
    await expect(page.getByText(SEEDED_ACTIVE_MEMBER.fullName, { exact: true })).toBeVisible();
    await page.getByText(SEEDED_ACTIVE_MEMBER.fullName, { exact: true }).click();

    await page.getByRole('combobox', { name: /payment method/i }).selectOption({ label: 'GCASH' });
    await expect(page.getByLabel('GCash Reference Number')).toBeVisible();
    await page.getByLabel('GCash Reference Number').fill('1234567890123');
    await page.getByRole('row', { name: /Daily Pass/ }).click();
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Payment recorded successfully. Undo is available for 5 seconds.')).toBeVisible();

    await page.getByRole('link', { name: 'Members' }).click();
    await expect(page).toHaveURL(/\/dashboard\/members/);

    await page.getByPlaceholder('Search member...').fill(SEEDED_ACTIVE_MEMBER.contactNumber);
    await expect(page.getByText(SEEDED_ACTIVE_MEMBER.fullName, { exact: true })).toBeVisible();
    await page.getByText(SEEDED_ACTIVE_MEMBER.fullName, { exact: true }).click();

    await expect(page).toHaveURL(/\/dashboard\/members\/.+/);
    await page.getByRole('button', { name: 'Payment History' }).click();

    await page.getByRole('combobox', { name: 'Month' }).selectOption({ label: currentMonth });

    const paymentHistoryEntries = page.getByRole('article');
    await expect.poll(async () => paymentHistoryEntries.count()).toBeGreaterThan(0);

    const entryCount = await paymentHistoryEntries.count();

    expect(entryCount).toBeGreaterThan(0);

    for (let index = 0; index < entryCount; index += 1) {
      const paymentHistoryEntry = paymentHistoryEntries.nth(index);
      await expect(paymentHistoryEntry).toContainText(currentMonth);
      await expect(paymentHistoryEntry).not.toContainText(previousMonth);
    }

    await expect(page.getByText('GCash Ref: 1234567890123')).toBeVisible();
  });
});
