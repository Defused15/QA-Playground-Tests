import { Locator, Page } from '@playwright/test';

export class ShadowDom {
  readonly page: Page;
  readonly progressBar: Locator;
  readonly progressFill: Locator;
  readonly boostButton: Locator;
  readonly boostButtonByXPath: Locator;

  constructor(page: Page) {
    this.page = page;
    // Custom element host and its inner fill have no ARIA role; CSS pierces the open shadow root
    this.progressBar = page.locator('progress-bar');
    this.progressFill = this.progressBar.locator('.fill');
    this.boostButton = page.getByRole('button', { name: 'Boost 🚀' });
    // XPath does not pierce shadow roots
    this.boostButtonByXPath = page.locator('xpath=//button');
  }

  async boost() {
    await this.boostButton.click();
  }

  async boostRepeatedly(times: number) {
    for (let i = 0; i < times; i++) {
      await this.boostButton.click();
    }
  }

  /** Sets the component's public `percent` attribute directly. */
  async setPercent(value: string) {
    await this.progressBar.evaluate(
      (el, v) => el.setAttribute('percent', v),
      value
    );
  }

  /**
   * Moves focus with the keyboard until the Boost button is focused.
   * WebKit only tabs through every control with Alt+Tab (macOS default).
   */
  async tabToBoost(browserName: string, maxPresses = 15) {
    const key = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
    for (let i = 0; i < maxPresses; i++) {
      await this.page.keyboard.press(key);
      const focused = await this.boostButton.evaluate((el) =>
        el.matches(':focus')
      );
      if (focused) return;
    }
  }

  async resizeToMobile() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }
}
