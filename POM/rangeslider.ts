import { Page, Locator } from '@playwright/test';

export class RangeSlider {
  readonly rangebar: Locator;
  readonly emojis: Locator;
  readonly body: Locator;
  readonly sendFeedbackButton: Locator;
  readonly tyText: Locator;

  constructor(page: Page) {
    this.rangebar = page.locator('input[type="range"]');
    this.emojis = page.locator('li.slide-emoji');
    this.body = page.locator('body');
    this.sendFeedbackButton = page.locator('button#feedback');
    this.tyText = page.locator('p#ty-msg');
  }
}
