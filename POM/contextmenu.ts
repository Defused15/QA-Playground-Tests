import { Page, Locator } from '@playwright/test';

export const TOP_LEVEL_ITEMS = [
  'Preview',
  'Get Link',
  'Rename',
  'Delete',
  'Settings',
] as const;

export const SHARE_ITEMS = [
  'Twitter',
  'Instagram',
  'Dribble',
  'Telegram',
] as const;

export class ContextMenu {
  readonly page: Page;
  readonly message: Locator;
  readonly menu: Locator;
  readonly shareItem: Locator;
  readonly shareMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.message = page.getByRole('main').getByRole('paragraph');
    // The menu container and the share flyout are plain divs/uls with no
    // accessible name, so they are targeted by class.
    this.menu = page.locator('.wrapper');
    this.shareMenu = this.menu.locator('.share-menu');
    this.shareItem = this.menu.getByText('Share', { exact: true });
  }

  item(name: string): Locator {
    return this.menu.getByText(name, { exact: true });
  }

  async openAt(x: number, y: number) {
    await this.page.mouse.click(x, y, { button: 'right' });
  }

  async select(name: string) {
    await this.item(name).click();
  }

  async revealShareMenu() {
    await this.shareItem.hover();
  }

  async selectShareItem(name: string) {
    await this.revealShareMenu();
    await this.shareMenu.getByText(name, { exact: true }).click();
  }
}
