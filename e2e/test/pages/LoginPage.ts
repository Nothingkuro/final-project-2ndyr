import { By, Key, type WebDriver } from 'selenium-webdriver';
import {
  buttonByText,
  DEFAULT_TIMEOUT_MS,
  waitForUrlContains,
  waitForVisible,
} from '../utils/driverFactory';

export type LoginRole = 'Staff' | 'Owner';

export interface LoginCredentials {
  role: LoginRole;
  username: string;
  password: string;
}

export class LoginPage {
  constructor(
    private readonly driver: WebDriver,
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS,
  ) {}

  async open(baseUrl: string): Promise<void> {
    await this.driver.get(baseUrl);
    await waitForVisible(this.driver, buttonByText('Staff'), this.timeoutMs);
  }

  async selectRole(role: LoginRole): Promise<void> {
    const usernameFieldLocator = By.css('input[placeholder="Username"]');

    if (await this.isCredentialsStepVisible()) {
      return;
    }

    const roleButton = await waitForVisible(this.driver, buttonByText(role), this.timeoutMs);
    await roleButton.click();

    try {
      await waitForVisible(this.driver, usernameFieldLocator, this.timeoutMs);
      return;
    } catch {
      await this.driver.executeScript('arguments[0].click();', roleButton);
      await waitForVisible(this.driver, usernameFieldLocator, this.timeoutMs);
    }
  }

  async enterUsername(username: string): Promise<void> {
    await this.setInputValue(By.css('input[placeholder="Username"]'), username);
  }

  async enterPassword(password: string): Promise<void> {
    await this.setInputValue(By.css('input[placeholder="Password"]'), password);
  }

  async submit(): Promise<void> {
    const submitButton = await waitForVisible(this.driver, buttonByText('Log In'), this.timeoutMs);
    await submitButton.click();

    if (await this.isCredentialsStepVisible()) {
      await this.driver.executeScript('arguments[0].click();', submitButton);
    }

    if (await this.isCredentialsStepVisible()) {
      const forms = await this.driver.findElements(By.css('form'));
      if (forms.length > 0) {
        await this.driver.executeScript(
          'if (arguments[0].requestSubmit) { arguments[0].requestSubmit(); } else { arguments[0].submit(); }',
          forms[0],
        );
      }
    }
  }

  async login(credentials: LoginCredentials): Promise<void> {
    await this.selectRole(credentials.role);
    await this.enterUsername(credentials.username);
    await this.enterPassword(credentials.password);
    await this.submit();

    const loginErrorLocator = By.xpath('//div[contains(@class, "text-red-600")]');

    await this.driver.wait(async () => {
      const url = await this.driver.getCurrentUrl();
      if (url.includes('/dashboard/members')) {
        return true;
      }

      const errors = await this.driver.findElements(loginErrorLocator);
      if (errors.length === 0) {
        return false;
      }

      return errors[0].isDisplayed();
    }, this.timeoutMs);

    const url = await this.driver.getCurrentUrl();
    if (!url.includes('/dashboard/members')) {
      const errors = await this.driver.findElements(loginErrorLocator);
      const message = errors.length > 0
        ? await errors[0].getText()
        : `Login did not navigate to members page (url=${url}).`;
      throw new Error(`Login failed in E2E: ${message}`);
    }
  }

  async waitForMembersPage(): Promise<void> {
    await waitForUrlContains(this.driver, '/dashboard/members', this.timeoutMs);
    await waitForVisible(
      this.driver,
      By.xpath('//h1[normalize-space()="Members"]'),
      this.timeoutMs,
    );
  }

  private async isCredentialsStepVisible(): Promise<boolean> {
    const usernameFields = await this.driver.findElements(By.css('input[placeholder="Username"]'));
    if (usernameFields.length === 0) {
      return false;
    }

    return usernameFields[0].isDisplayed();
  }

  private async setInputValue(locator: By, value: string): Promise<void> {
    const input = await waitForVisible(this.driver, locator, this.timeoutMs);
    await input.click();
    await input.sendKeys(Key.CONTROL, 'a');
    await input.sendKeys(Key.DELETE);
    await input.sendKeys(value);

    await this.driver.wait(async () => {
      const currentValue = await input.getAttribute('value');
      return currentValue === value;
    }, this.timeoutMs);
  }
}
