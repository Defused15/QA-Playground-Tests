import { Page, Locator } from '@playwright/test';

export const MENU_URLS = {
  home: 'https://qaplayground.dev/apps/links/#',
  about: 'https://qaplayground.dev/apps/links/about',
  blog: 'https://qaplayground.dev/apps/links/blog',
  portfolio: 'https://qaplayground.dev/apps/links/portfolio',
  contact: 'https://qaplayground.dev/apps/links/contact',
  base: 'https://qaplayground.dev/apps/links/',
} as const;

export class Menu {
  readonly navBar: Locator;
  readonly homeLink: Locator;
  readonly aboutLink: Locator;
  readonly blogLink: Locator;
  readonly portfolioLink: Locator;
  readonly contactLink: Locator;
  readonly welcomeMessage: Locator;
  readonly welcomeButton: Locator;

  constructor(page: Page) {
    // The app's link bar is an unlabelled container, distinct from the site header nav.
    this.navBar = page.locator('#nav');
    this.homeLink = this.navBar.getByRole('link', { name: 'Home' });
    this.aboutLink = this.navBar.getByRole('link', { name: 'About' });
    this.blogLink = this.navBar.getByRole('link', { name: 'Blog' });
    this.portfolioLink = this.navBar.getByRole('link', { name: 'Portfolio' });
    this.contactLink = this.navBar.getByRole('link', { name: 'Contact' });
    this.welcomeMessage = page
      .getByRole('main')
      .getByRole('heading', { level: 1 });
    this.welcomeButton = page.getByRole('link', { name: 'Go Back' });
  }

  async clickHome() {
    await this.homeLink.click();
  }

  async clickAbout() {
    await this.aboutLink.click();
  }

  async clickBlog() {
    await this.blogLink.click();
  }

  async clickPortfolio() {
    await this.portfolioLink.click();
  }

  async clickContact() {
    await this.contactLink.click();
  }
}
