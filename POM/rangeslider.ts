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
  // Locator for the Send Feedback button
  readonly sendFeedbackButton: Locator;
  // Locator for the Thanks for your feedback message
  readonly tyText: Locator;

  /**
   * Constructor initializes locators using the provided Playwright Page object.
   */
  constructor(page: Page) {
    this.rangebar = page.locator('input[type="range"]');
    this.emojis = page.locator("li.slide-emoji");
    this.body = page.locator("body");
    this.sendFeedbackButton = page.locator("button#feedback");
    this.tyText = page.locator("p#ty-msg");
  }
}
