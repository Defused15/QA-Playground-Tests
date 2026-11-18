import { Locator, Page } from '@playwright/test';

export class MouseHover {
  readonly page: Page;
  readonly posterLink: Locator;
  readonly poster: Locator;
  readonly detailsPanel: Locator;
  readonly movieTitle: Locator;
  readonly slogan: Locator;
  readonly currentPrice: Locator;
  readonly oldPrice: Locator;
  readonly buyButton: Locator;

  constructor(page: Page) {
    this.page = page;
    const main = page.getByRole('main');
    this.posterLink = main.getByRole('link');
    // The poster <img> has no alt text, so it has no accessible name
    this.poster = main.getByRole('img');
    // The card that fades in on :hover is a plain <div> with no role
    this.detailsPanel = page.locator('.title-container');
    this.movieTitle = main.getByRole('heading', {
      name: 'Spider-Man: No Way Home',
    });
    this.slogan = main.getByText('The Multiverse unleashed.');
    this.currentPrice = main.getByText('$24.96');
    this.oldPrice = main.getByText('$38.99');
    this.buyButton = main.getByRole('button', { name: 'Buy now' });
  }

  async hoverPoster() {
    await this.poster.hover();
  }

  /** Moves the pointer to the empty top-left corner of the page. */
  async moveMouseAway() {
    await this.page.mouse.move(0, 0);
  }

  /**
   * Moves focus with the keyboard until the target is focused.
   * WebKit only tabs through links with Alt+Tab (macOS default).
   */
  async tabTo(target: Locator, browserName: string, maxPresses = 15) {
    const key = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
    for (let i = 0; i < maxPresses; i++) {
      await this.page.keyboard.press(key);
      const focused = await target.evaluate((el) => el.matches(':focus'));
      if (focused) return;
    }
  }

  async resizeToMobile() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }
}
