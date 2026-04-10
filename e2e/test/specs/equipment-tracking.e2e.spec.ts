import { expect, test } from '@playwright/test';
import { loginAsStaff } from '../support/auth';
import { resetDatabase } from '../support/db';

const SEEDED_EQUIPMENT = 'Treadmill X100';

test.describe('Inventory and equipment tracking e2e', () => {
  test.beforeAll(() => {
    resetDatabase('equipment-tracking-beforeAll');
  });

  test.beforeEach(async ({ page }) => {
    await loginAsStaff(page);
  });

  test('staff filters and updates an equipment condition', async ({ page }) => {
    await page.getByRole('link', { name: /equipment status/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/inventory/);
    await expect(page.getByRole('heading', { name: 'Equipment Status' })).toBeVisible();

    await expect(page.getByRole('button', { name: `Edit condition for ${SEEDED_EQUIPMENT}` })).toBeVisible();
    await page.getByRole('button', { name: `Edit condition for ${SEEDED_EQUIPMENT}` }).click();
    await page.getByRole('combobox', { name: `Condition for ${SEEDED_EQUIPMENT}` }).selectOption({ label: 'Broken' });
    await page.getByRole('button', { name: `Save condition for ${SEEDED_EQUIPMENT}` }).click();

    await expect(page.getByRole('cell', { name: /Broken/i })).toBeVisible();
  });
});
