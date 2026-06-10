import { Page, Locator } from '@playwright/test';

export class Redirect {
  readonly page: Page;
  readonly redirectButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.redirectButton = page.locator('a#redirect');
    this.backButton = page.locator('a.btn-green');
  }

  async startRedirectionChain() {
    await this.redirectButton.click();
    // All redirects are automatic JS-driven — chain ends at /sixth, not /last
    await this.page.waitForURL('**/sixth');
  }
}
