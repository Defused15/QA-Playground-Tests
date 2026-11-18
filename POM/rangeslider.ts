import { Page, Locator } from '@playwright/test';

export class RangeSlider {
  readonly rangebar: Locator;
  readonly emojis: Locator;
  readonly body: Locator;
  readonly sendFeedbackButton: Locator;
  readonly tyText: Locator;

  constructor(page: Page) {
    this.rangebar = page.getByRole('slider');
    // Emoji strip and page background have no accessible role.
    this.emojis = page.locator('li.slide-emoji');
    this.body = page.locator('body');
    this.sendFeedbackButton = page.getByRole('button', {
      name: 'Send Feedback',
    });
    // The thank-you paragraph is in the DOM (empty) before feedback is sent.
    this.tyText = page.locator('p#ty-msg');
  }
}
