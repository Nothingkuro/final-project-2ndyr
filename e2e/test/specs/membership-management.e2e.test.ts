import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { WebDriver } from 'selenium-webdriver';
import { By } from 'selenium-webdriver';
import { LoginPage } from '../pages/LoginPage';
import { MemberProfilePage } from '../pages/MemberProfilePage';
import { MembersPage, type MemberFormValues } from '../pages/MembersPage';
import { createDriver, quitDriver } from '../utils/driverFactory';

const FRONTEND_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const LOGIN_USERNAME = process.env.E2E_LOGIN_USERNAME ?? process.env.SEED_STAFF_USERNAME ?? 'staff';
const LOGIN_PASSWORD = process.env.E2E_LOGIN_PASSWORD ?? process.env.SEED_STAFF_PASSWORD;
const ARTIFACT_DIR = path.resolve(__dirname, '../../artifacts');

function buildUniqueMember(seed: string): MemberFormValues {
  const uniqueToken = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-8);

  return {
    firstName: `${seed}First${uniqueToken.slice(0, 3)}`,
    lastName: `${seed}Last${uniqueToken.slice(3)}`,
    contactNumber: `09${uniqueToken}1`,
    notes: `${seed} notes ${uniqueToken}`,
  };
}

describe('Membership management e2e', () => {
  let driver: WebDriver | undefined;
  let loginPage: LoginPage;
  let membersPage: MembersPage;
  let memberProfilePage: MemberProfilePage;

  beforeAll(async () => {
    if (!LOGIN_PASSWORD) {
      throw new Error(
        'Missing login password. Set E2E_LOGIN_PASSWORD or SEED_STAFF_PASSWORD before running E2E tests.',
      );
    }

    driver = await createDriver();
    loginPage = new LoginPage(driver);
    membersPage = new MembersPage(driver);
    memberProfilePage = new MemberProfilePage(driver);
  });

  afterAll(async () => {
    await quitDriver(driver);
  });

  async function collectDiagnostics(label: string): Promise<void> {
    if (!driver) {
      return;
    }

    await mkdir(ARTIFACT_DIR, { recursive: true });
    const safeLabel = label.replace(/[^a-zA-Z0-9_-]/g, '-');

    const currentUrl = await driver.getCurrentUrl().catch(() => 'unavailable');
    const pageTitle = await driver.getTitle().catch(() => 'unavailable');
    const bodyText = await driver
      .findElement(By.css('body'))
      .getText()
      .then((text) => text.slice(0, 2000))
      .catch(() => 'unavailable');

    await writeFile(
      path.join(ARTIFACT_DIR, `${safeLabel}.txt`),
      `url=${currentUrl}\ntitle=${pageTitle}\n\nbody:\n${bodyText}\n`,
      'utf8',
    );

    const screenshot = await driver.takeScreenshot().catch(() => undefined);
    if (screenshot) {
      await writeFile(path.join(ARTIFACT_DIR, `${safeLabel}.png`), screenshot, 'base64');
    }
  }

  beforeEach(async () => {
    const maxAttempts = 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await loginPage.open(FRONTEND_URL);
        await loginPage.login({
          role: 'Staff',
          username: LOGIN_USERNAME,
          password: LOGIN_PASSWORD as string,
        });

        await loginPage.waitForMembersPage();
        await membersPage.waitUntilLoaded();
        return;
      } catch (error) {
        await collectDiagnostics(`beforeEach-attempt-${attempt}`);
        if (attempt === maxAttempts) {
          throw error;
        }
      }
    }
  });

  it('staff login', async () => {
    const currentUrl = await driver?.getCurrentUrl();
    expect(currentUrl).toContain('/dashboard/members');
  });

  it('staff adds new member', async () => {
    const newMember = buildUniqueMember('AddMember');

    await membersPage.addMember(newMember);
    await membersPage.searchMember(newMember.contactNumber);

    const createdRow = await membersPage.waitForMemberRow(`${newMember.firstName} ${newMember.lastName}`);
    expect(await createdRow.isDisplayed()).toBe(true);
  });

  it('staff filters active list, searches member, edits profile fields, then deactivates', async () => {
    const targetMember = buildUniqueMember('ManageMember');
    const nextContactLastDigit = targetMember.contactNumber.endsWith('8') ? '7' : '8';
    const updatedMember: MemberFormValues = {
      firstName: `${targetMember.firstName}Updated`,
      lastName: `${targetMember.lastName}Updated`,
      contactNumber: `${targetMember.contactNumber.slice(0, -1)}${nextContactLastDigit}`,
      notes: `${targetMember.notes} updated`,
    };

    await membersPage.addMember(targetMember);
    await membersPage.applyActiveFilter();
    await membersPage.searchMember(targetMember.contactNumber);
    await membersPage.openMemberByFullName(`${targetMember.firstName} ${targetMember.lastName}`);

    await memberProfilePage.waitUntilLoaded();
    await memberProfilePage.editProfile(updatedMember);
    await memberProfilePage.assertNameBanner(`${updatedMember.firstName} ${updatedMember.lastName}`);
    await memberProfilePage.assertContactNumber(updatedMember.contactNumber);
    await memberProfilePage.assertNotes(updatedMember.notes);

    await memberProfilePage.deactivateMember();
    await memberProfilePage.assertDeactivateButtonDisabled();
  });
});
