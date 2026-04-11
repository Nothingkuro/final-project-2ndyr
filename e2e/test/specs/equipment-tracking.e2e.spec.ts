import { expect, test, type Page, type Response } from '@playwright/test';
import { loginAsOwner, loginAsStaff, uniqueToken } from '../support/auth';
import { resetDatabase } from '../support/db';

const SEEDED_EQUIPMENT = 'Treadmill X100';

type EquipmentConditionFilter = 'GOOD' | 'MAINTENANCE' | 'BROKEN';

interface EquipmentApiItem {
  id: string;
  itemName: string;
  quantity: number;
  condition: EquipmentConditionFilter;
  updatedAt: string;
}

interface EquipmentListResponse {
  items: EquipmentApiItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

async function openEquipmentStatusPage(page: Page): Promise<void> {
  await page.getByRole('link', { name: /equipment status/i }).click();
  await expect(page).toHaveURL(/\/dashboard\/inventory/);
  await expect(page.getByRole('heading', { name: 'Equipment Status' })).toBeVisible();
}

async function openAssetsInventoryPage(page: Page): Promise<void> {
  await page.getByRole('link', { name: /assets inventory/i }).click();
  await expect(page).toHaveURL(/\/dashboard\/manage-assets/);
  await expect(page.getByRole('heading', { name: 'Assets Inventory' })).toBeVisible();
}

async function waitForAssetListResponse(
  page: Page,
  searchQuery: string,
  condition: EquipmentConditionFilter,
): Promise<Response> {
  const encodedSearch = encodeURIComponent(searchQuery);

  return page.waitForResponse((response) => (
    response.request().method() === 'GET'
    && response.url().includes('/api/equipment?')
    && response.url().includes(`condition=${condition}`)
    && response.url().includes(`search=${encodedSearch}`)
    && response.ok()
  ));
}

async function createAsset(
  page: Page,
  asset: { itemName: string; quantity: number; conditionLabel: 'Good' | 'Maintenance' | 'Broken' },
): Promise<EquipmentApiItem> {
  const createAssetResponsePromise = page.waitForResponse((response) => (
    response.request().method() === 'POST'
    && response.url().includes('/api/equipment')
    && response.ok()
  ));

  await page.getByRole('button', { name: 'Add asset' }).click();
  await page.getByPlaceholder('Item Name').fill(asset.itemName);
  await page.getByPlaceholder('Initial Quantity').fill(String(asset.quantity));
  await page.locator('select[name="condition"]').selectOption({ label: asset.conditionLabel });
  await page.getByRole('button', { name: 'Create Asset' }).click();

  const createAssetResponse = await createAssetResponsePromise;
  return (await createAssetResponse.json()) as EquipmentApiItem;
}

test.describe('Inventory and equipment tracking e2e', () => {
  test.beforeAll(() => {
    resetDatabase('equipment-tracking-beforeAll');
  });

  test('staff filters and updates an equipment condition', async ({ page }) => {
    await loginAsStaff(page);
    await openEquipmentStatusPage(page);

    await expect(page.getByRole('button', { name: `Edit condition for ${SEEDED_EQUIPMENT}` })).toBeVisible();
    await page.getByRole('button', { name: `Edit condition for ${SEEDED_EQUIPMENT}` }).click();
    await page.getByRole('combobox', { name: `Condition for ${SEEDED_EQUIPMENT}` }).selectOption({ label: 'Broken' });
    await page.getByRole('button', { name: `Save condition for ${SEEDED_EQUIPMENT}` }).click();

    await expect(page.getByRole('cell', { name: /Broken/i })).toBeVisible();
  });

  test('owner filters broken assets, edits to good, and sees updated timestamp change', async ({ page }) => {
    const token = uniqueToken();
    const originalAssetName = `BrokenAsset${token}`;
    const updatedAssetName = `GoodAsset${token}`;
    const updatedQuantity = 9;

    await loginAsOwner(page);
    await openAssetsInventoryPage(page);

    const createdAsset = await createAsset(page, {
      itemName: originalAssetName,
      quantity: 2,
      conditionLabel: 'Broken',
    });

    await page.getByRole('button', { name: 'Filter' }).click();
    await page.getByRole('button', { name: 'Broken', exact: true }).click();

    const brokenAssetsResponsePromise = waitForAssetListResponse(page, originalAssetName, 'BROKEN');
    await page.getByPlaceholder('Search assets...').fill(originalAssetName);
    const brokenAssetsResponse = await brokenAssetsResponsePromise;
    const brokenAssetsPayload = (await brokenAssetsResponse.json()) as EquipmentListResponse;

    const assetBeforeEdit =
      brokenAssetsPayload.items.find((asset) => asset.id === createdAsset.id)
      ?? brokenAssetsPayload.items.find((asset) => asset.itemName === originalAssetName);

    if (!assetBeforeEdit) {
      throw new Error(`Unable to find created broken asset: ${originalAssetName}`);
    }

    await page.getByRole('button', { name: `Edit asset ${originalAssetName}` }).click();
    await page.getByPlaceholder('Item Name').fill(updatedAssetName);
    await page.getByPlaceholder('Initial Quantity').fill(String(updatedQuantity));
    await page.locator('select[name="condition"]').selectOption({ label: 'Good' });

    const updateAssetResponsePromise = page.waitForResponse((response) => (
      response.request().method() === 'PUT'
      && response.url().includes(`/api/equipment/${assetBeforeEdit.id}`)
      && !response.url().includes('/condition')
      && response.ok()
    ));

    await page.getByRole('button', { name: 'Save Changes' }).click();
    const updatedAssetResponse = await updateAssetResponsePromise;
    const updatedAssetPayload = (await updatedAssetResponse.json()) as EquipmentApiItem;

    expect(updatedAssetPayload.itemName).toBe(updatedAssetName);
    expect(updatedAssetPayload.quantity).toBe(updatedQuantity);
    expect(updatedAssetPayload.condition).toBe('GOOD');
    expect(new Date(updatedAssetPayload.updatedAt).getTime()).toBeGreaterThan(
      new Date(assetBeforeEdit.updatedAt).getTime(),
    );

    await page.getByRole('button', { name: 'Filter' }).click();
    await page.getByRole('button', { name: 'Good', exact: true }).click();

    const goodAssetsResponsePromise = waitForAssetListResponse(page, updatedAssetName, 'GOOD');
    await page.getByPlaceholder('Search assets...').fill(updatedAssetName);
    await goodAssetsResponsePromise;

    await expect(page.getByRole('button', { name: `Edit asset ${updatedAssetName}` })).toBeVisible();
    await expect(page.getByRole('button', { name: `Edit asset ${originalAssetName}` })).toHaveCount(0);
  });

  test('owner filters good assets, deletes one asset, then adds another asset', async ({ page }) => {
    const token = uniqueToken();
    const deletableAssetName = `DeleteAsset${token}`;
    const replacementAssetName = `ReplacementAsset${token}`;

    await loginAsOwner(page);
    await openAssetsInventoryPage(page);

    const deletableAsset = await createAsset(page, {
      itemName: deletableAssetName,
      quantity: 3,
      conditionLabel: 'Good',
    });

    await page.getByRole('button', { name: 'Filter' }).click();
    await page.getByRole('button', { name: 'Good', exact: true }).click();

    const goodAssetsBeforeDeleteResponsePromise = waitForAssetListResponse(
      page,
      deletableAssetName,
      'GOOD',
    );
    await page.getByPlaceholder('Search assets...').fill(deletableAssetName);
    await goodAssetsBeforeDeleteResponsePromise;

    const deleteAssetResponsePromise = page.waitForResponse((response) => (
      response.request().method() === 'DELETE'
      && response.url().includes(`/api/equipment/${deletableAsset.id}`)
      && response.ok()
    ));

    page.once('dialog', (dialog) => {
      void dialog.accept();
    });

    await page.getByRole('button', { name: `Delete asset ${deletableAssetName}` }).click();
    await deleteAssetResponsePromise;

    await expect(page.getByRole('button', { name: `Edit asset ${deletableAssetName}` })).toHaveCount(0);

    await createAsset(page, {
      itemName: replacementAssetName,
      quantity: 4,
      conditionLabel: 'Good',
    });

    const goodAssetsAfterAddResponsePromise = waitForAssetListResponse(page, replacementAssetName, 'GOOD');
    await page.getByPlaceholder('Search assets...').fill(replacementAssetName);
    await goodAssetsAfterAddResponsePromise;

    await expect(page.getByRole('button', { name: `Edit asset ${replacementAssetName}` })).toBeVisible();
  });
});
