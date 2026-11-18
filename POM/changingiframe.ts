import { FrameLocator, Locator, Page } from '@playwright/test';

export class ChangingIframe {
  readonly page: Page;
  readonly iframe: Locator;
  readonly frame: FrameLocator;
  readonly firstIframeGroup: Locator;
  readonly secondIframeGroup: Locator;
  readonly registrationText: Locator;
  readonly countdown: Locator;
  readonly endMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    // The <iframe> has no title or accessible name, only id/name attributes
    this.iframe = page.locator('iframe#frame1');
    this.frame = this.iframe.contentFrame();
    // <fieldset> + <legend> is exposed as a named group
    this.firstIframeGroup = this.frame.getByRole('group', {
      name: 'First Iframe',
    });
    this.secondIframeGroup = this.frame.getByRole('group', {
      name: 'Second Iframe',
    });
    this.registrationText = this.frame.getByText(/Registration closes in/);
    // The timer is a bare <span> with no role or label
    this.countdown = this.frame.locator('#time');
    this.endMessage = this.frame.getByText('This is the end of the journey');
  }

  /** URL of the document currently loaded inside the iframe. */
  frameUrl(): string {
    return this.page.frame({ name: 'frame1' })?.url() ?? '';
  }

  /** Current timer text, or '' once the timer is gone (does not wait). */
  async readCountdown(): Promise<string> {
    const [text = ''] = await this.countdown.allTextContents();
    return text;
  }

  async resizeToMobile() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  async reload() {
    await this.page.reload();
  }
}
