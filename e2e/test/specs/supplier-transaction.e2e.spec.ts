import { expect, test, type Page, type Response } from '@playwright/test';
import { loginAsOwner, uniqueToken } from '../support/auth';
import { resetDatabase } from '../support/db';

interface SupplierApiItem {
  id: string;
  name: string;
  serviceCategory: string;
  contactPerson: string | null;
  contactNumber: string | null;
  address: string | null;
  updatedAt: string;
}

interface SupplierListResponse {
  items: SupplierApiItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface SupplierTransactionItem {
  id: string;
  itemsPurchased: string;
  totalCost: number;
  supplierId: string;
}

function buildContactNumber(seed: string): string {
  const digitsOnly = seed.replace(/\D/g, '').padEnd(9, '0').slice(0, 9);
  return `09${digitsOnly}`;
}

async function openSuppliersPage(page: Page): Promise<void> {
  await page.getByRole('link', { name: /suppliers/i }).click();
  await expect(page).toHaveURL(/\/dashboard\/suppliers/);
  await expect(page.getByRole('heading', { name: 'Suppliers' })).toBeVisible();
}

function buildSuppliersResponseMatcher(
  options: { searchQuery?: string; serviceCategory?: string } = {},
): (response: Response) => boolean {
  const { searchQuery, serviceCategory } = options;

  return (response: Response): boolean => {
    if (
      response.request().method() !== 'GET'
      || !response.ok()
      || !response.url().includes('/api/suppliers?')
    ) {
      return false;
    }

    const params = new URL(response.url()).searchParams;

    if (searchQuery && params.get('search') !== searchQuery) {
      return false;
    }

    if (serviceCategory && params.get('serviceCategory') !== serviceCategory) {
      return false;
    }

    return true;
  };
}

async function searchSuppliersAndWait(
  page: Page,
  searchQuery: string,
  options: { serviceCategory?: string } = {},
): Promise<Response> {
  const responseMatcher = buildSuppliersResponseMatcher({ searchQuery, serviceCategory: options.serviceCategory });
  const responsePromise = page.waitForResponse(responseMatcher);
  await page.getByPlaceholder('Search supplier...').fill(searchQuery);
  return responsePromise;
}

async function createSupplier(
  page: Page,
  supplier: {
    name: string;
    serviceCategory: string;
    contactPerson: string;
    contactNumber: string;
    address: string;
  },
): Promise<SupplierApiItem> {
  const createSupplierResponsePromise = page.waitForResponse((response) => (
    response.request().method() === 'POST'
    && response.url().includes('/api/suppliers')
    && response.ok()
  ));

  await page.getByRole('button', { name: 'Add Supplier' }).click();
  await page.getByPlaceholder('Supplier Name').fill(supplier.name);
  await page
    .getByPlaceholder('Service Category (e.g. Equipment, Nutrition)')
    .fill(supplier.serviceCategory);
  await page.getByPlaceholder('Contact Person').fill(supplier.contactPerson);
  await page
    .getByPlaceholder('Contact Number (e.g. 09171234567)')
    .fill(supplier.contactNumber);
  await page.getByPlaceholder('Address').fill(supplier.address);
  await page.getByRole('button', { name: 'Create Supplier' }).click();

  const createSupplierResponse = await createSupplierResponsePromise;
  return (await createSupplierResponse.json()) as SupplierApiItem;
}

test.describe('Supplier and transaction management e2e', () => {
  test.beforeAll(async () => {
    await resetDatabase('supplier-transaction-beforeAll');
  });

  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
    await openSuppliersPage(page);
  });

  test('owner filters by Nutrition category and edits supplier details', async ({ page }) => {
    const token = uniqueToken();
    const supplierName = `NutritionSupplier${token}`;
    const updatedSupplierName = `NutritionSupplierUpdated${token}`;
    const originalContactNumber = buildContactNumber(token);
    const updatedContactNumber = buildContactNumber(`${token}7`);

    const createdSupplier = await createSupplier(page, {
      name: supplierName,
      serviceCategory: 'Nutrition',
      contactPerson: `OwnerContact${token.slice(0, 3)}`,
      contactNumber: originalContactNumber,
      address: `Nutrition St ${token}`,
    });

    // Set up filter response listener BEFORE clicking filter
    const nutritionFilterResponsePromise = page.waitForResponse(
      buildSuppliersResponseMatcher({ serviceCategory: 'Nutrition' }),
    );
    await page.getByRole('button', { name: 'Filter' }).click();
    await expect(page.getByRole('button', { name: 'Nutrition', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Nutrition', exact: true }).click();
    await nutritionFilterResponsePromise;

    // Set up search response listener BEFORE filling search
    await searchSuppliersAndWait(page, supplierName, { serviceCategory: 'Nutrition' });

    // Set up edit response listener BEFORE triggering edit
    const updateSupplierResponsePromise = page.waitForResponse((response) => (
      response.request().method() === 'PUT'
      && response.url().includes(`/api/suppliers/${createdSupplier.id}`)
      && response.ok()
    ));

    await page.getByRole('button', { name: `Edit supplier ${supplierName}` }).click();
    await page.getByPlaceholder('Supplier Name').fill(updatedSupplierName);
    await page
      .getByPlaceholder('Service Category (e.g. Equipment, Nutrition)')
      .fill('Nutrition');
    await page.getByPlaceholder('Contact Person').fill(`UpdatedOwnerContact${token.slice(0, 3)}`);
    await page
      .getByPlaceholder('Contact Number (e.g. 09171234567)')
      .fill(updatedContactNumber);
    await page.getByPlaceholder('Address').fill(`Updated Nutrition Ave ${token}`);
    await page.getByRole('button', { name: 'Save Changes' }).click();

    const updateSupplierResponse = await updateSupplierResponsePromise;
    const updatedSupplierPayload = (await updateSupplierResponse.json()) as SupplierApiItem;

    expect(updatedSupplierPayload.id).toBe(createdSupplier.id);
    expect(updatedSupplierPayload.name).toBe(updatedSupplierName);
    expect(updatedSupplierPayload.serviceCategory).toBe('Nutrition');
    expect(updatedSupplierPayload.contactNumber).toBe(updatedContactNumber);

    // Set up search response listener BEFORE filling search
    await searchSuppliersAndWait(page, updatedSupplierName, { serviceCategory: 'Nutrition' });

    await expect(page.getByRole('button', { name: `Edit supplier ${updatedSupplierName}` })).toBeVisible();
  });

  test('owner searches supplier, opens purchase history, and logs a new transaction', async ({ page }) => {
    const token = uniqueToken();
    const supplierName = `FitSupplyTrading${token}`;
    const newItemsPurchased = `NutritionRestock${token}`;
    const newTransactionCost = '3210.50';

    const createdSupplier = await createSupplier(page, {
      name: supplierName,
      serviceCategory: 'Equipment',
      contactPerson: `SupplierContact${token.slice(0, 3)}`,
      contactNumber: buildContactNumber(token),
      address: `Supplier Ave ${token}`,
    });

    // Set up search response listener BEFORE filling search
    const supplierSearchResponse = await searchSuppliersAndWait(page, supplierName);
    const supplierSearchPayload = (await supplierSearchResponse.json()) as SupplierListResponse;

    const targetSupplier =
      supplierSearchPayload.items.find((supplier) => supplier.id === createdSupplier.id)
      ?? supplierSearchPayload.items.find((supplier) => supplier.name === supplierName);

    if (!targetSupplier) {
      throw new Error(`Unable to find supplier in search results: ${supplierName}`);
    }

    await expect(page.getByText(supplierName, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: `View transactions for ${supplierName}` }).click();

    await expect(page.getByRole('heading', { name: `Purchase Transactions: ${supplierName}` })).toBeVisible();
    await expect(page.getByText(/No transaction records found for this supplier\./i)).toBeVisible();

    const createTransactionResponsePromise = page.waitForResponse((response) => (
      response.request().method() === 'POST'
      && response.url().includes(`/api/suppliers/${targetSupplier.id}/transactions`)
      && response.ok()
    ));

    await page.getByRole('button', { name: 'Log Transaction' }).click();
    await page.getByPlaceholder('Items Purchased').fill(newItemsPurchased);
    await page.getByPlaceholder('Total Cost').fill(newTransactionCost);
    await page.getByRole('button', { name: 'Save Transaction' }).click();

    const createTransactionResponse = await createTransactionResponsePromise;
    const createdTransactionPayload =
      (await createTransactionResponse.json()) as SupplierTransactionItem;

    expect(createdTransactionPayload.supplierId).toBe(targetSupplier.id);
    expect(createdTransactionPayload.itemsPurchased).toBe(newItemsPurchased);

    await expect(page.getByText(newItemsPurchased)).toBeVisible();
  });
});
