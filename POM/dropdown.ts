import { Page, Locator } from '@playwright/test';

export const MAIN_ITEMS = ['My Profile', 'Settings', 'Animals'] as const;
export const SETTINGS_ITEMS = [
  'HTML',
  'CSS',
  'JavaScript',
  'Awesome!',
] as const;
export const ANIMAL_ITEMS = ['Kangaroo', 'Frog', 'Horse', 'Hedgehog'] as const;

export class Dropdown {
  readonly navItems: Locator;
  readonly toggle: Locator;
  readonly panel: Locator;
  readonly menuItems: Locator;
  readonly myProfile: Locator;
  readonly settings: Locator;
  readonly animals: Locator;
  readonly settingsBack: Locator;
  readonly animalsBack: Locator;

  constructor(page: Page) {
    this.navItems = page
      .getByRole('main')
      .getByRole('navigation')
      .getByRole('listitem');
    // Only the last (caret) nav icon owns the dropdown; icons have no labels.
    this.toggle = this.navItems.last().getByRole('link').first();
    // The dropdown panel and menu wrappers are unlabelled divs.
    this.panel = page.locator('.dropdown');
    this.menuItems = this.panel.locator('.menu').getByRole('link');
    this.myProfile = this.panel.getByRole('link', { name: 'My Profile' });
    this.settings = this.panel.getByRole('link', {
      name: 'Settings',
      exact: true,
    });
    this.animals = this.panel.getByRole('link', { name: '🦧 Animals' });
    this.settingsBack = this.panel.getByRole('link', { name: 'My Tutorial' });
    this.animalsBack = this.panel.getByRole('link', {
      name: 'Animals',
      exact: true,
    });
  }

  link(name: string): Locator {
    return this.panel.getByRole('link', { name });
  }

  async open() {
    await this.toggle.click();
  }

  async openSettings() {
    await this.open();
    await this.settings.click();
  }

  async openAnimals() {
    await this.open();
    await this.animals.click();
  }
}
