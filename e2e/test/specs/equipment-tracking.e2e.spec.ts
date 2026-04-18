import { expect, test, type Page, type Response } from '@playwright/test';
import { loginAsOwner, loginAsStaff, uniqueToken } from '../support/auth';
import { resetDatabase } from '../support/db';

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

function buildAssetListResponseMatcher(
  options: { searchQuery?: string; condition?: EquipmentConditionFilter } = {},
): (response: Response) => boolean {
  const { searchQuery, condition } = options;

  return (response: Response): boolean => {
    if (
      response.request().method() !== 'GET'
      || !response.ok()
      || !response.url().includes('/api/equipment?')
    ) {
      return false;
    }

    const params = new URL(response.url()).searchParams;

    if (searchQuery && params.get('search') !== searchQuery) {
      return false;
    }

    if (condition && params.get('condition') !== condition) {
      return false;
    }

    return true;
  };
}

async function searchAssetsAndWait(
  page: Page,
  searchPlaceholder: string,
  searchQuery: string,
  options: { condition?: EquipmentConditionFilter } = {},
): Promise<Response> {
  const responseMatcher = buildAssetListResponseMatcher({ searchQuery, condition: options.condition });
  const responsePromise = page.waitForResponse(responseMatcher);
  await page.getByPlaceholder(searchPlaceholder).fill(searchQuery);
  return responsePromise;
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
  test.beforeAll(async () => {
    await resetDatabase('equipment-tracking-beforeAll');
  });

  test('staff filters and updates an equipment condition', async ({ page }) => {
    const token = uniqueToken();
    const assetName = `StaffConditionAsset${token}`;

    await loginAsOwner(page);
    await openAssetsInventoryPage(page);

    await createAsset(page, {
      itemName: assetName,
      quantity: 1,
      conditionLabel: 'Good',
    });

    await loginAsStaff(page);
    await openEquipmentStatusPage(page);

    // Set up filter response listener BEFORE clicking filter
    const goodFilterResponsePromise = page.waitForResponse(
      buildAssetListResponseMatcher({ condition: 'GOOD' }),
    );
    await page.getByRole('button', { name: 'Filter' }).click();
    await page.getByRole('button', { name: 'Good', exact: true }).click();
    await goodFilterResponsePromise;

    // Set up search response listener BEFORE filling search
    await searchAssetsAndWait(page, 'Search equipment...', assetName, { condition: 'GOOD' });

    await expect(page.getByRole('button', { name: `Edit condition for ${assetName}` })).toBeVisible();
    await page.getByRole('button', { name: `Edit condition for ${assetName}` }).click();
    await page.getByRole('combobox', { name: `Condition for ${assetName}` }).selectOption({ label: 'Broken' });
    const saveConditionResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' &&
        response.url().includes('/api/equipment/') &&
        response.url().includes('/condition') &&
        response.ok(),
    );
    await page.getByRole('button', { name: `Save condition for ${assetName}` }).click();
    await saveConditionResponsePromise;

    // Set up filter response listener BEFORE switching to Broken filter
    const brokenFilterResponsePromise = page.waitForResponse(
      buildAssetListResponseMatcher({ searchQuery: assetName, condition: 'BROKEN' }),
    );
    await page.getByRole('button', { name: 'Filter' }).click();
    await page.getByRole('button', { name: 'Broken', exact: true }).click();
    await brokenFilterResponsePromise;

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

    // Set up filter response listener BEFORE clicking filter
    const brokenFilterResponsePromise = page.waitForResponse(
      buildAssetListResponseMatcher({ condition: 'BROKEN' }),
    );
    await page.getByRole('button', { name: 'Filter' }).click();
    await page.getByRole('button', { name: 'Broken', exact: true }).click();
    await brokenFilterResponsePromise;

    // Set up search response listener BEFORE filling search
    const brokenAssetsResponse = await searchAssetsAndWait(
      page, 'Search assets...', originalAssetName, { condition: 'BROKEN' },
    );
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
    expect(new Date(updatedAssetPayload.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(assetBeforeEdit.updatedAt).getTime(),
    );

    // Set up filter response listener BEFORE clicking filter
    const goodFilterResponsePromise = page.waitForResponse(
      buildAssetListResponseMatcher({ condition: 'GOOD' }),
    );
    await page.getByRole('button', { name: 'Filter' }).click();
    await page.getByRole('button', { name: 'Good', exact: true }).click();
    await goodFilterResponsePromise;

    // Set up search response listener BEFORE filling search
    await searchAssetsAndWait(page, 'Search assets...', updatedAssetName, { condition: 'GOOD' });

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

    // Set up filter response listener BEFORE clicking filter
    const goodFilterResponsePromise = page.waitForResponse(
      buildAssetListResponseMatcher({ condition: 'GOOD' }),
    );
    await page.getByRole('button', { name: 'Filter' }).click();
    await page.getByRole('button', { name: 'Good', exact: true }).click();
    await goodFilterResponsePromise;

    // Set up search response listener BEFORE filling search
    await searchAssetsAndWait(page, 'Search assets...', deletableAssetName, { condition: 'GOOD' });

    await page.getByRole('button', { name: `Delete asset ${deletableAssetName}` }).click();
    await expect(page.getByRole('heading', { name: 'Delete Asset' })).toBeVisible();

    const deleteAssetResponsePromise = page.waitForResponse((response) => (
      response.request().method() === 'DELETE'
      && response.url().includes(`/api/equipment/${deletableAsset.id}`)
      && response.ok()
    ));

    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await deleteAssetResponsePromise;

    await expect(page.getByRole('button', { name: `Edit asset ${deletableAssetName}` })).toHaveCount(0);

    await createAsset(page, {
      itemName: replacementAssetName,
      quantity: 4,
      conditionLabel: 'Good',
    });

    // Set up search response listener BEFORE filling search
    await searchAssetsAndWait(page, 'Search assets...', replacementAssetName, { condition: 'GOOD' });

    await expect(page.getByRole('button', { name: `Edit asset ${replacementAssetName}` })).toBeVisible();
  });
});
