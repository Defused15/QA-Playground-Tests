import { Page, Locator } from '@playwright/test';

export const POPUP_URL = 'https://qaplayground.dev/apps/popup/popup';

export class Popup {
  readonly page: Page;
  readonly info: Locator;
  readonly openButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.info = page.getByRole('main').getByRole('paragraph');
    this.openButton = page.getByRole('link', { name: 'Open' });
  }

  submitButton(popup: Page): Locator {
    return popup.getByRole('button', { name: 'Submit' });
  }

  async open(): Promise<Page> {
    const popupPromise = this.page.waitForEvent('popup');
    await this.openButton.click();
    const popup = await popupPromise;
    await popup.waitForLoadState();
    return popup;
  }

  async openWithKeyboard(): Promise<Page> {
    const popupPromise = this.page.waitForEvent('popup');
    await this.openButton.focus();
    await this.page.keyboard.press('Enter');
    const popup = await popupPromise;
    await popup.waitForLoadState();
    return popup;
  }

  // Submit calls window.close() in its onclick, so the window can close while
  // the action that triggered it is still finishing, which rejects that action.
  // Only that closure error is ignored; awaiting the close event still proves
  // the window actually closed.
  private async untilClosed(popup: Page, action: () => Promise<void>) {
    const closed = popup.waitForEvent('close');
    await action().catch((error: Error) => {
      if (!/has been closed/.test(error.message)) throw error;
    });
    await closed;
  }

  async submit(popup: Page) {
    await this.untilClosed(popup, () => this.submitButton(popup).click());
  }

  // Space activates the button on keyup, so the window closes during the key
  // release (Enter would close it mid-keydown).
  async submitWithKeyboard(popup: Page) {
    await this.submitButton(popup).focus();
    await this.untilClosed(popup, async () => {
      await popup.keyboard.down('Space');
      await popup.keyboard.up('Space');
    });
  }
}
