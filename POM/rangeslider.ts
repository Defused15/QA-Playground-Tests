import { Page, Locator } from "@playwright/test";

// RangeSlider class to interact with a range slider component on the page
export class RangeSlider {
  // Locator for the range input element
  readonly rangebar: Locator;
  // Array of Locators for each emoji element in the slider
  readonly emojis: Locator[];

  // Constructor initializes locators using the provided Playwright Page object
  constructor(page: Page) {
    // Locate the range input element
    this.rangebar = page.locator('input[type="range"]');
    // Locate each emoji in the slider and store them in an array
    this.emojis = [
      page.locator("li.slide-emoji").nth(0), // First emoji
      page.locator("li.slide-emoji").nth(1), // Second emoji
      page.locator("li.slide-emoji").nth(2), // Third emoji
      page.locator("li.slide-emoji").nth(3), // Fourth emoji
      page.locator("li.slide-emoji").nth(4), // Fifth emoji
    ];
  }
}
