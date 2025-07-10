import { Page, Locator } from "@playwright/test";

/**
 * RangeSlider class to interact with a range slider component on the page.
 */
export class RangeSlider {
  // Locator for the range input element (the slider itself)
  readonly rangebar: Locator;
  // Locator for the emoji element in the slider
  readonly emojis: Locator;
  // Locator for the body element (used to check background color changes)
  readonly body: Locator;

  /**
   * Constructor initializes locators using the provided Playwright Page object.
   */
  constructor(page: Page) {
    // Locate the range input element (the slider itself)
    this.rangebar = page.locator('input[type="range"]');
    // Locate all emoji elements in the slider
    this.emojis = page.locator("li.slide-emoji");
    // Locate the body element to check for background color changes
    this.body = page.locator('body');
  }
}
