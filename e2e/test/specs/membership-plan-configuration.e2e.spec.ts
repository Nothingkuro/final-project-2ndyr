import { expect, test, type Page } from '@playwright/test';
import { loginAsAdmin, uniqueToken } from '../support/auth';
import { resetDatabase } from '../support/db';

/**
 * Returns a locator that finds a plan entry by its visible text.
 *
 * The MembershipPlanTable renders each plan with two layouts: a mobile card
 * (`md:hidden`) and a desktop row (`hidden md:grid`). We target the desktop
 * row to avoid strict-mode violations from duplicate buttons.
 */
function getPlanDesktopRow(page: Page, planName: string) {
  return page.locator('.hidden.md\\:grid').filter({ hasText: planName });
}

async function openMembershipPlansPage(page: Page): Promise<void> {
  await page.goto('/dashboard/membership-plans');
  await expect(page).toHaveURL(/\/dashboard\/membership-plans\/?(\\?.*)?$/);
  await expect(page.getByRole('heading', { name: 'Membership Plans' })).toBeVisible();
}

async function openAddPlanModal(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^(Add Plan|Create New Plan|Plan)$/i }).click();
  await expect(page.getByRole('heading', { name: 'Create Plan' })).toBeVisible();
}

async function fillPlanForm(
  page: Page,
  data: {
    name?: string;
    price?: string;
    duration?: string;
  },
): Promise<void> {
  if (data.name !== undefined) {
    await page.getByLabel(/Plan Name/i).fill(data.name);
  }

  if (data.price !== undefined) {
    await page.getByLabel(/Price \(PHP\)/i).fill(data.price);
  }

  if (data.duration !== undefined) {
    await page.getByLabel(/Duration \(Days\)/i).fill(data.duration);
  }
}

async function assertOptionalSuccessFeedback(page: Page, messagePattern: RegExp): Promise<void> {
  const alert = page.getByRole('alert').filter({ hasText: messagePattern }).first();
  await alert.waitFor({ state: 'visible', timeout: 3_000 }).catch(() => {});

  if (await alert.isVisible().catch(() => false)) {
    await expect(alert).toBeVisible();
    return;
  }

  const status = page.getByRole('status').filter({ hasText: messagePattern }).first();
  await status.waitFor({ state: 'visible', timeout: 3_000 }).catch(() => {});

  if (await status.isVisible().catch(() => false)) {
    await expect(status).toBeVisible();
  }
}

test.describe('Membership plan configuration e2e', () => {
  test.beforeAll(async () => {
    await resetDatabase('membership-plan-configuration-beforeAll');
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await openMembershipPlansPage(page);
  });

  test('admin creates, edits, validates visibility, and deletes a membership plan', async ({ page }) => {
    const token = uniqueToken();
    const planName = `E2E Plan ${token}`;
    const updatedPlanName = `E2E Plan ${token} Updated`;

    await openAddPlanModal(page);

    const createResponsePromise = page.waitForResponse((response) => (
      response.request().method() === 'POST'
      && response.url().includes('/api/membership-plans')
      && response.ok()
    ));

    await fillPlanForm(page, {
      name: planName,
      price: '1500',
      duration: '30',
    });
    await page.getByRole('button', { name: 'Create Plan' }).click();

    await createResponsePromise;
    await expect(page.getByRole('heading', { name: 'Create Plan' })).toBeHidden();
    await assertOptionalSuccessFeedback(page, /(created|added|success)/i);

    const createdRow = getPlanDesktopRow(page, planName);
    await expect(createdRow).toBeVisible();
    await expect(createdRow).toContainText(/1,500(\.00)?|1500/);

    const updateResponsePromise = page.waitForResponse((response) => (
      response.request().method() === 'PUT'
      && response.url().includes('/api/membership-plans/')
      && response.ok()
    ));

    await createdRow.getByTitle('Edit plan').click();
    await expect(page.getByRole('heading', { name: 'Edit Plan' })).toBeVisible();

    await fillPlanForm(page, {
      name: updatedPlanName,
      price: '1750',
      duration: '30',
    });
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await updateResponsePromise;
    await assertOptionalSuccessFeedback(page, /(updated|saved|success)/i);

    const updatedRow = getPlanDesktopRow(page, updatedPlanName);
    await expect(updatedRow).toBeVisible();
    await expect(updatedRow).toContainText(/1,750(\.00)?|1750/);

    const deleteResponsePromise = page.waitForResponse((response) => (
      response.request().method() === 'DELETE'
      && response.url().includes('/api/membership-plans/')
      && response.ok()
    ));

    await updatedRow.getByTitle('Delete plan').click();
    await expect(page.getByRole('heading', { name: 'Delete Plan' })).toBeVisible();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    await deleteResponsePromise;
    await assertOptionalSuccessFeedback(page, /(deleted|archived|removed|success)/i);

    await expect.poll(async () => {
      const rowAfterDelete = getPlanDesktopRow(page, updatedPlanName);
      const rowCount = await rowAfterDelete.count();

      if (rowCount === 0) {
        return 'removed';
      }

      const isArchived = await rowAfterDelete
        .getByText(/Archived/i)
        .isVisible()
        .catch(() => false);

      return isArchived ? 'archived' : 'present';
    }).toMatch(/removed|archived/);
  });

  test('admin sees validation errors for required fields and negative price', async ({ page }) => {
    const token = uniqueToken();
    const invalidNegativePlanName = `E2E Plan Negative ${token}`;

    await openAddPlanModal(page);

    await page.getByRole('button', { name: 'Create Plan' }).click();

    await expect(page.getByText('Plan name is required.')).toBeVisible();
    await expect(page.getByText('Price is required.')).toBeVisible();
    await expect(page.getByText('Duration is required.')).toBeVisible();

    await fillPlanForm(page, {
      name: invalidNegativePlanName,
      price: '-100',
      duration: '30',
    });
    await page.getByRole('button', { name: 'Create Plan' }).click();

    await expect.poll(async () => {
      const hasCustomError = await page
        .getByText('Price must not be negative.')
        .isVisible()
        .catch(() => false);

      if (hasCustomError) {
        return 'custom';
      }

      const hasNativeNumberValidation = await page
        .getByLabel(/Price \(PHP\)/i)
        .evaluate((element) => {
          const input = element as HTMLInputElement;
          return !input.validity.valid && input.validationMessage.length > 0;
        })
        .catch(() => false);

      return hasNativeNumberValidation ? 'native' : 'none';
    }).toMatch(/custom|native/);

    await expect(page.getByRole('heading', { name: 'Create Plan' })).toBeVisible();
    await expect(getPlanDesktopRow(page, invalidNegativePlanName)).toHaveCount(0);
  });

  test('admin creates a plan and verifies it appears on the payments page plan selection', async ({ page }) => {
    const token = uniqueToken();
    const planName = `PaymentVisiblePlan ${token}`;

    await openAddPlanModal(page);

    const createResponsePromise = page.waitForResponse((response) => (
      response.request().method() === 'POST'
      && response.url().includes('/api/membership-plans')
      && response.ok()
    ));

    await fillPlanForm(page, {
      name: planName,
      price: '2500',
      duration: '60',
    });
    await page.getByRole('button', { name: 'Create Plan' }).click();
    await createResponsePromise;
    await expect(page.getByRole('heading', { name: 'Create Plan' })).toBeHidden();

    const createdRow = getPlanDesktopRow(page, planName);
    await expect(createdRow).toBeVisible();

    // Navigate to payments page and verify the plan is listed
    await page.getByRole('link', { name: 'Payments' }).click();
    await expect(page).toHaveURL(/\/dashboard\/payments/);
    await expect(page.getByText(planName)).toBeVisible();
  });
});