import { Page, Locator } from '@playwright/test';

export const NEW_PAGE_URL = '/apps/new-tab/new-page';

export class NewTab {
  readonly page: Page;
  readonly openButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.openButton = page.getByRole('link', { name: 'Open New Tab' });
  }

  static heading(tab: Page): Locator {
    return tab.getByRole('heading', { name: 'Welcome to the new page!' });
  }

  async openNewTab(): Promise<Page> {
    const newPagePromise = this.page.context().waitForEvent('page');
    await this.openButton.click();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();
    return newPage;
  }

  async openNewTabWithKeyboard(): Promise<Page> {
    const popupPromise = this.page.waitForEvent('popup');
    await this.openButton.focus();
    await this.page.keyboard.press('Enter');
    const popup = await popupPromise;
    await popup.waitForLoadState();
    return popup;
  }
}
