import { expect, test, type Page } from '@playwright/test';
import { loginAsAdmin } from '../support/auth';
import { resetDatabase } from '../support/db';

const PLAN_NAME = 'E2E Test Plan';
const UPDATED_PLAN_NAME = 'E2E Test Plan - Updated';

function getPlanRow(page: Page, planName: string) {
  return page.getByRole('row').filter({ hasText: planName });
}

async function openMembershipPlansPage(page: Page): Promise<void> {
  await page.goto('/dashboard/membership-plans');
  await expect(page).toHaveURL(/\/dashboard\/membership-plans\/?(\?.*)?$/);
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
  await alert.waitFor({ state: 'visible', timeout: 1_000 }).catch(() => {});

  if (await alert.isVisible().catch(() => false)) {
    await expect(alert).toBeVisible();
    return;
  }

  const status = page.getByRole('status').filter({ hasText: messagePattern }).first();
  await status.waitFor({ state: 'visible', timeout: 1_000 }).catch(() => {});

  if (await status.isVisible().catch(() => false)) {
    await expect(status).toBeVisible();
  }
}

async function deletePlanIfPresent(page: Page, planName: string): Promise<void> {
  await openMembershipPlansPage(page);
  const row = getPlanRow(page, planName);

  if ((await row.count()) === 0) {
    return;
  }

  await row.first().getByTitle('Delete plan').click();
  await expect(page.getByRole('heading', { name: 'Delete Plan' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(getPlanRow(page, planName)).toHaveCount(0);
}

test.describe('Membership plan configuration e2e', () => {
  test.beforeAll(() => {
    resetDatabase('membership-plan-configuration-beforeAll');
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await openMembershipPlansPage(page);
  });

  test.afterEach(async ({ page }) => {
    await deletePlanIfPresent(page, UPDATED_PLAN_NAME).catch(() => {});
    await deletePlanIfPresent(page, PLAN_NAME).catch(() => {});
  });

  test('admin creates, edits, validates visibility, and deletes a membership plan', async ({ page }) => {
    await openAddPlanModal(page);

    const createResponsePromise = page.waitForResponse((response) => (
      response.request().method() === 'POST'
      && response.url().includes('/api/membership-plans')
      && response.ok()
    ));

    await fillPlanForm(page, {
      name: PLAN_NAME,
      price: '1500',
      duration: '30',
    });
    await page.getByRole('button', { name: 'Create Plan' }).click();

    await createResponsePromise;
    await expect(page.getByRole('heading', { name: 'Create Plan' })).toBeHidden();
    await assertOptionalSuccessFeedback(page, /(created|added|success)/i);

    const createdRow = getPlanRow(page, PLAN_NAME);
    await expect(createdRow).toHaveCount(1);
    await expect(createdRow).toContainText(/1,500(\.00)?|1500/);

    const updateResponsePromise = page.waitForResponse((response) => (
      response.request().method() === 'PUT'
      && response.url().includes('/api/membership-plans/')
      && response.ok()
    ));

    await createdRow.getByTitle('Edit plan').click();
    await expect(page.getByRole('heading', { name: 'Edit Plan' })).toBeVisible();

    await fillPlanForm(page, {
      name: UPDATED_PLAN_NAME,
      price: '1750',
      duration: '30',
    });
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await updateResponsePromise;
    await assertOptionalSuccessFeedback(page, /(updated|saved|success)/i);

    const updatedRow = getPlanRow(page, UPDATED_PLAN_NAME);
    await expect(updatedRow).toHaveCount(1);
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
      const rowAfterDelete = getPlanRow(page, UPDATED_PLAN_NAME);
      const rowCount = await rowAfterDelete.count();

      if (rowCount === 0) {
        return 'removed';
      }

      const isArchived = await rowAfterDelete
        .first()
        .getByText(/Archived/i)
        .isVisible()
        .catch(() => false);

      return isArchived ? 'archived' : 'present';
    }).toMatch(/removed|archived/);
  });

  test('admin sees validation errors for required fields and negative price', async ({ page }) => {
    const invalidNegativePlanName = `${PLAN_NAME} Negative`;

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
    await expect(getPlanRow(page, invalidNegativePlanName)).toHaveCount(0);
  });
});