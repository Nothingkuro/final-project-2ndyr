import { expect, test } from '@playwright/test';
import { loginAsStaff, uniqueToken } from '../support/auth';
import { resetDatabase } from '../support/db';

test.describe('Membership management e2e', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    resetDatabase(`${testInfo.title}-beforeEach`);
    await loginAsStaff(page);
  });

  test('staff adds new member', async ({ page }) => {
    const token = uniqueToken();
    const firstName = `AddFirst${token.slice(0, 3)}`;
    const lastName = `AddLast${token.slice(3)}`;
    const fullName = `${firstName} ${lastName}`;
    const contactNumber = `09${token}1`;

    await page.getByRole('button', { name: 'Member' }).click();
    await page.getByPlaceholder('First Name').fill(firstName);
    await page.getByPlaceholder('Last Name').fill(lastName);
    await page.getByPlaceholder('Contact Number').fill(contactNumber);
    await page.getByPlaceholder('Notes').fill(`Add member notes ${token}`);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByRole('button', { name: 'Close modal' }).click();

    await page.getByPlaceholder('Search member...').fill(contactNumber);
    await expect(page.getByText(fullName, { exact: true })).toBeVisible();
  });

  test('staff filters active list, edits profile, then deactivates member', async ({ page }) => {
    const token = uniqueToken();
    const firstName = `ManageFirst${token.slice(0, 3)}`;
    const lastName = `ManageLast${token.slice(3)}`;
    const fullName = `${firstName} ${lastName}`;
    const contactNumber = `09${token}1`;

    await page.getByRole('button', { name: 'Member' }).click();
    await page.getByPlaceholder('First Name').fill(firstName);
    await page.getByPlaceholder('Last Name').fill(lastName);
    await page.getByPlaceholder('Contact Number').fill(contactNumber);
    await page.getByPlaceholder('Notes').fill(`Manage member notes ${token}`);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByRole('button', { name: 'Close modal' }).click();

    await page.getByRole('button', { name: 'Filter' }).click();
    await page.getByRole('button', { name: 'Active', exact: true }).click();

    await page.getByPlaceholder('Search member...').fill(contactNumber);
    await page.getByText(fullName, { exact: true }).click();

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

    const deactivateButton = page.getByRole('button', { name: 'Deactivate' });
    await deactivateButton.click();

    await expect(page.getByText('INACTIVE')).toBeVisible();
    await expect(deactivateButton).toBeDisabled();
  });
});
