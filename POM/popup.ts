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
  // the click action is still finishing. Only that closure error is ignored;
  // awaiting the close event still proves the window actually closed.
  async submit(popup: Page) {
    const closed = popup.waitForEvent('close');
    await this.submitButton(popup)
      .click()
      .catch((error: Error) => {
        if (!/has been closed/.test(error.message)) throw error;
      });
    await closed;
  }

  // Enter closes the window mid-keypress and rejects the press, so the
  // Space key (which activates on keyup) is used instead.
  async submitWithKeyboard(popup: Page) {
    const closed = popup.waitForEvent('close');
    await this.submitButton(popup).focus();
    await popup.keyboard.down('Space');
    await popup.keyboard.up('Space');
    await closed;
  }
}
