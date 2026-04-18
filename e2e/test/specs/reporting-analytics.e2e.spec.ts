import { expect, test, type Page, type Response } from '@playwright/test';
import { loginAsOwner } from '../support/auth';
import { resetDatabase } from '../support/db';

interface ReportsOverviewResponse {
  dailyRevenue: {
    total: number;
    cash: number;
    gcash: number;
    date: string;
  };
  monthlyRevenue: Array<{
    month: number;
    year: number;
    total: number;
  }>;
  membershipExpiryAlerts: Array<{
    id: string;
    name: string;
    expiryDate: string;
    contactNumber: string;
  }>;
  inventoryAlerts: Array<{
    id: string;
    itemName: string;
    quantity: number;
    threshold: number;
  }>;
}

async function openReportsPage(page: Page): Promise<void> {
  await page.getByRole('link', { name: 'Reports' }).click();
  await expect(page).toHaveURL(/\/dashboard\/reports/);
  await expect(page.getByRole('heading', { name: 'Reports and Analytics' })).toBeVisible();
}

async function waitForOverviewResponse(page: Page, threshold: number): Promise<Response> {
  return page.waitForResponse((response) => (
    response.request().method() === 'GET'
    && response.url().includes('/api/reports/overview?')
    && response.url().includes(`threshold=${threshold}`)
    && response.url().includes('days=3')
    && response.ok()
  ));
}

test.describe('Reporting and analytics e2e', () => {
  test.beforeAll(async () => {
    await resetDatabase('reporting-analytics-beforeAll');
  });

  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  test('owner views reports overview cards with seeded low inventory alert', async ({ page }) => {
    const initialOverviewResponsePromise = waitForOverviewResponse(page, 5);
    await openReportsPage(page);
    const initialOverviewResponse = await initialOverviewResponsePromise;
    const initialOverview = (await initialOverviewResponse.json()) as ReportsOverviewResponse;

    await expect(page.getByRole('heading', { name: 'Daily Revenue Summary' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Monthly Revenue Report' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Membership Expiry Alerts' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Low Inventory Alerts' })).toBeVisible();

    await expect(page.locator('#report-month-picker')).toBeVisible();
    await expect(page.locator('#report-year-picker')).toBeVisible();
    await expect(page.locator('#inventory-threshold')).toHaveValue('5');

    // Seeded equipment quantity is 4, so it should appear under default threshold 5.
    await expect(page.getByText('Treadmill X100', { exact: true })).toBeVisible();
    await expect(page.getByText('Qty: 4', { exact: true })).toBeVisible();

    const treadmillAlert = initialOverview.inventoryAlerts.find(
      (item) => item.itemName === 'Treadmill X100',
    );
    expect(treadmillAlert).toBeDefined();
    expect(treadmillAlert?.threshold).toBe(5);
  });

  test('owner updates low inventory threshold and refreshes alert list', async ({ page }) => {
    const initialOverviewResponsePromise = waitForOverviewResponse(page, 5);
    await openReportsPage(page);
    await initialOverviewResponsePromise;

    await expect(page.getByText('Treadmill X100', { exact: true })).toBeVisible();

    const thresholdInput = page.locator('#inventory-threshold');
    const refreshResponsePromise = waitForOverviewResponse(page, 3);

    await thresholdInput.fill('3');
    await page.getByRole('button', { name: 'Refresh' }).click();

    const refreshResponse = await refreshResponsePromise;
    const refreshedOverview = (await refreshResponse.json()) as ReportsOverviewResponse;

    await expect(thresholdInput).toHaveValue('3');
    
    // Treadmill X100 (qty 4) should disappear; Cable Machine A (qty 1) remains
    await expect(page.getByText('Treadmill X100', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Cable Machine A', { exact: true })).toBeVisible();
    await expect(page.getByText('Qty: 1', { exact: true })).toBeVisible();

    const treadmillAlertAfterRefresh = refreshedOverview.inventoryAlerts.find(
      (item) => item.itemName === 'Treadmill X100',
    );
    expect(treadmillAlertAfterRefresh).toBeUndefined();
  });
});