import { expect, Page, Locator } from '@playwright/test';

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
    this.navBar = page.locator('#nav');
    this.homeLink = this.navBar.getByRole('link', { name: 'Home' });
    this.aboutLink = this.navBar.getByRole('link', { name: 'About' });
    this.blogLink = this.navBar.getByRole('link', { name: 'Blog' });
    this.portfolioLink = this.navBar.getByRole('link', { name: 'Portfolio' });
    this.contactLink = this.navBar.getByRole('link', { name: 'Contact' });
    this.welcomeMessage = page.locator('#title');
    this.welcomeButton = page.getByRole('link', { name: 'Go Back' });
  }

  async buttonsDisplay() {
    await expect(this.homeLink).toBeVisible();
    await expect(this.homeLink).toHaveText('Home');
    await expect(this.aboutLink).toBeVisible();
    await expect(this.aboutLink).toHaveText('About');
    await expect(this.blogLink).toBeVisible();
    await expect(this.blogLink).toHaveText('Blog');
    await expect(this.portfolioLink).toBeVisible();
    await expect(this.portfolioLink).toHaveText('Portfolio');
    await expect(this.contactLink).toBeVisible();
    await expect(this.contactLink).toHaveText('Contact');
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
