import { Locator, Page } from '@playwright/test';

export class Covered {
  readonly page: Page;
  readonly scrollContainer: Locator;
  readonly infoText: Locator;
  readonly hiddenLink: Locator;

  constructor(page: Page) {
    this.page = page;
    // The 200px overflow:auto wrapper is a plain <div> with no role or label
    this.scrollContainer = page.locator('main .wrapper');
    this.infoText = page.getByRole('main').getByRole('paragraph');
    this.hiddenLink = page.getByRole('link', { name: 'You found me!' });
  }

  /** Scrolls the inner container with the mouse wheel, like a user would. */
  async wheelScrollContainer(deltaY: number) {
    await this.scrollContainer.hover();
    await this.page.mouse.wheel(0, deltaY);
  }

  /**
   * Clicks with the raw mouse at the link's current layout position,
   * without Playwright's auto-scroll into view.
   */
  async clickAtLinkPosition() {
    const box = await this.hiddenLink.boundingBox();
    if (!box) throw new Error('Link has no bounding box');
    await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }

  /**
   * Moves focus with the keyboard until the hidden link is focused.
   * WebKit only tabs through links with Alt+Tab (macOS default).
   */
  async tabToLink(browserName: string, maxPresses = 15) {
    const key = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
    for (let i = 0; i < maxPresses; i++) {
      await this.page.keyboard.press(key);
      const focused = await this.hiddenLink.evaluate((el) =>
        el.matches(':focus')
      );
      if (focused) return;
    }
  }

  async resizeToMobile() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }
}
