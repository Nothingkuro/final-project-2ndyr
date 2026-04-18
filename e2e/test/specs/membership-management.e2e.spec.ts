import { expect, test, type Page } from '@playwright/test';
import { loginAsStaff, uniqueToken } from '../support/auth';
import { resetDatabase } from '../support/db';

function buildMemberNamePattern(firstName: string, lastName: string): RegExp {
  return new RegExp(`^\\s*${firstName}\\s+${lastName}\\s*$`);
}

async function searchMemberByContact(page: Page, contactNumber: string): Promise<void> {
  const encodedContact = encodeURIComponent(contactNumber);

  const searchResponsePromise = page.waitForResponse((response) => (
    response.request().method() === 'GET'
    && response.url().includes('/api/members?')
    && response.url().includes(`search=${encodedContact}`)
    && response.ok()
  ));

  await page.getByPlaceholder('Search member...').fill(contactNumber);
  await searchResponsePromise;

  const loadingMembersText = page.getByText('Loading members...');
  if (await loadingMembersText.isVisible().catch(() => false)) {
    await expect(loadingMembersText).toBeHidden({ timeout: 10_000 });
  }
}

async function waitForMembersFilterResponse(
  page: Page,
  filterParams: Record<string, string> = {},
): Promise<void> {
  const filterResponsePromise = page.waitForResponse((response) => {
    if (
      response.request().method() !== 'GET'
      || !response.ok()
      || !response.url().includes('/api/members?')
    ) {
      return false;
    }

    const params = new URL(response.url()).searchParams;

    for (const [key, value] of Object.entries(filterParams)) {
      if (params.get(key) !== value) {
        return false;
      }
    }

    return true;
  });

  await filterResponsePromise;
}

async function submitMemberModal(page: Page): Promise<void> {
  const firstNameInput = page.getByPlaceholder('First Name');

  const submitResponsePromise = page.waitForResponse((response) => (
    response.request().method() === 'POST'
    && response.url().includes('/api/members')
    && response.ok()
  ));

  await page.getByRole('button', { name: 'Submit' }).click();
  await submitResponsePromise;
  await expect(firstNameInput).toBeHidden({ timeout: 10_000 });
}

test.describe('Membership management e2e', () => {
  test.beforeAll(async () => {
    await resetDatabase('membership-management-beforeAll');
  });

  test.beforeEach(async ({ page }) => {
    await loginAsStaff(page);
  });

  test('staff adds new member', async ({ page }) => {
    const token = uniqueToken();
    const firstName = `AddFirst${token.slice(0, 3)}`;
    const lastName = `AddLast${token.slice(3)}`;
    const contactNumber = `09${token}1`;

    await page.getByRole('button', { name: 'Member' }).click();
    await page.getByPlaceholder('First Name').fill(firstName);
    await page.getByPlaceholder('Last Name').fill(lastName);
    await page.getByPlaceholder('Contact Number').fill(contactNumber);
    await page.getByPlaceholder('Notes').fill(`Add member notes ${token}`);
    await submitMemberModal(page);

    await searchMemberByContact(page, contactNumber);
    await expect(page.getByText(buildMemberNamePattern(firstName, lastName))).toBeVisible();
  });

  test('staff checks in active member, edits profile, then deactivates member', async ({ page }) => {
    const token = uniqueToken();
    const firstName = `ManageFirst${token.slice(0, 3)}`;
    const lastName = `ManageLast${token.slice(3)}`;
    const contactNumber = `09${token}1`;

    await page.getByRole('button', { name: 'Member' }).click();
    await page.getByPlaceholder('First Name').fill(firstName);
    await page.getByPlaceholder('Last Name').fill(lastName);
    await page.getByPlaceholder('Contact Number').fill(contactNumber);
    await page.getByPlaceholder('Notes').fill(`Manage member notes ${token}`);
    await submitMemberModal(page);

    // Set up listener BEFORE clicking filter to avoid race
    const activeFilterResponsePromise = page.waitForResponse((response) => (
      response.request().method() === 'GET'
      && response.url().includes('/api/members?')
      && response.ok()
    ));

    await page.getByRole('button', { name: 'Filter' }).click();
    await page.getByRole('button', { name: 'Active', exact: true }).click();
    await activeFilterResponsePromise;

    await searchMemberByContact(page, contactNumber);
    await page.getByText(buildMemberNamePattern(firstName, lastName)).click();

    await expect(page).toHaveURL(/\/dashboard\/members\/.+/);
    await page.getByRole('button', { name: 'Edit Profile' }).click();

    const updatedFirstName = `${firstName}Updated`;
    const updatedLastName = `${lastName}Updated`;
    const updatedFullName = `${updatedFirstName} ${updatedLastName}`;
    const updatedContact = `${contactNumber.slice(0, -1)}8`;
    const updatedNotes = `Updated notes ${token}`;

    await page.getByPlaceholder('First Name').fill(updatedFirstName);
    await page.getByPlaceholder('Last Name').fill(updatedLastName);
    await page.getByPlaceholder('Contact Number').fill(updatedContact);
    await page.getByPlaceholder('Notes').fill(updatedNotes);
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page.getByRole('heading', { name: updatedFullName })).toBeVisible();
    await expect(page.getByText(updatedContact)).toBeVisible();
    await expect(page.getByText(updatedNotes)).toBeVisible();

    const checkInResponsePromise = page.waitForResponse((response) => (
      response.request().method() === 'POST'
      && /\/api\/members\/[^/]+\/check-in$/.test(response.url())
      && response.ok()
    ));

    await page.getByRole('button', { name: 'Check-In' }).click();
    await checkInResponsePromise;

    await expect(page.getByRole('heading', { name: 'Attendance History' })).toBeVisible();
    await expect(page.locator('tbody tr').first()).toBeVisible();

    await page.getByRole('button', { name: 'Attendance' }).click();
    await expect(page.getByRole('button', { name: 'Deactivate' })).toBeVisible();

    const deactivateButton = page.getByRole('button', { name: 'Deactivate' });
    const checkInButton = page.getByRole('button', { name: 'Check-In' });
    await deactivateButton.click();

    await expect(page.getByText('INACTIVE')).toBeVisible();
    await expect(deactivateButton).toBeDisabled();
    await expect(checkInButton).toBeDisabled();
  });
});
