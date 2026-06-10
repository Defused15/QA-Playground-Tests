import { FrameLocator, Locator, Page } from '@playwright/test';

export class IFrame {
  readonly outerIframe: Locator;
  readonly outerFrame: FrameLocator;
  readonly innerFrame: FrameLocator;
  readonly outerFrameTitle: Locator;
  readonly innerFrameTitle: Locator;
  readonly clickMeLink: Locator;
  readonly clickedMessage: Locator;

  constructor(page: Page) {
    this.outerIframe = page.locator('#frame1');
    this.outerFrame = page.frameLocator('#frame1');
    this.innerFrame = this.outerFrame.frameLocator('iframe');
    this.outerFrameTitle = this.outerFrame.locator('legend');
    this.innerFrameTitle = this.innerFrame.locator('legend');
    this.clickMeLink = this.innerFrame.getByRole('link', { name: 'Click Me' });
    this.clickedMessage = this.innerFrame.locator('p#msg');
  }
}
