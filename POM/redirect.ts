import { Page, Locator, expect } from "@playwright/test";

// Class representing the redirection process
export class Redirect {
  readonly page: Page;
  readonly redirectButton: Locator;
  readonly pageMessage: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Locator for the redirect button
    this.redirectButton = page.locator("a#redirect");
    // Locator for the page message
    this.pageMessage = page.locator("p#info");
    // Locator for the back button
    this.backButton = page.locator("a.btn-green");
  }

  // Starts the redirection chain and waits for each URL in sequence
  async startRedirectionChain() {
    await this.redirectButton.click(); // Click the redirect button

    // Wait for each URL in the redirection chain
    await this.page.waitForURL('**/second');
    await this.page.waitForURL('**/third');
    await this.page.waitForURL('**/fourth');
    await this.page.waitForURL('**/fifth');
    await this.page.waitForURL('**/sixth');
    await this.page.waitForURL('**/last');
  }

  // Verifies the final state by checking if the back button is visible
  async verifyFinalState() {
    await expect(this.backButton).toBeVisible();
  }
}