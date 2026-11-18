import { Page, Locator } from '@playwright/test';

export const RATING_LABELS: Record<number, string> = {
  0: 'Rate your experience',
  1: 'I just hate it',
  2: "I don't like it",
  3: 'This is awesome',
  4: 'I just like it',
  5: 'I just love it',
};

export const STAR_COLORS = {
  active: 'rgb(255, 221, 68)',
  inactive: 'rgb(204, 204, 204)',
};

/** Each emoji is 135px tall; the strip slides up one emoji per star. */
export const emojiOffset = (stars: number) =>
  stars <= 1 ? '0px' : `-${(stars - 1) * 135}px`;

export class Rating {
  readonly page: Page;
  readonly starLabels: Locator;
  readonly radios: Locator;
  readonly checkedRadios: Locator;
  readonly emojiStrip: Locator;
  readonly ratingText: Locator;
  readonly ratingScore: Locator;

  // This widget is pure CSS: the radios are display:none, the star <label>s
  // have no text, and the footer text lives in ::before content, so there is
  // no accessible handle and CSS selectors are used throughout.
  constructor(page: Page) {
    this.page = page;
    this.starLabels = page.locator('.stars label');
    this.radios = page.locator('input[name="rate"]');
    this.checkedRadios = page.locator('input[name="rate"]:checked');
    this.emojiStrip = page.locator('.emojis li.slideImg');
    this.ratingText = page.locator('.footer .text');
    this.ratingScore = page.locator('.footer .numb');
  }

  star(n: number): Locator {
    return this.page.locator(`label[for="star-${n}"]`);
  }

  radio(n: number): Locator {
    return this.page.locator(`#star-${n}`);
  }

  async rate(n: number) {
    await this.star(n).click();
  }

  async hoverStar(n: number) {
    await this.star(n).hover();
  }

  async moveMouseAway() {
    await this.page.mouse.move(0, 0);
  }

  /** Reads the CSS ::before text that renders the footer labels. */
  async pseudoText(locator: Locator): Promise<string> {
    const content = await locator.evaluate(
      (el) => getComputedStyle(el, '::before').content
    );
    return content.replace(/^"|"$/g, '');
  }
}
