import { expect, Page, Locator } from "@playwright/test";

export class Menu {
  readonly page: Page;
  readonly navBar: Locator;
  readonly homeLink: Locator;
  readonly aboutLink: Locator;
  readonly blogLink: Locator;
  readonly portfolioLink: Locator;
  readonly contactLink: Locator;
  readonly welcomeMessage: Locator;
  readonly welcomeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navBar = page.locator("#nav");
    this.homeLink = this.navBar.getByRole("link", { name: "HOME" }); // Initialize the Home button locator
    this.aboutLink = this.navBar.getByRole("link", { name: "ABOUT" }); // Initialize the About button locator
    this.blogLink = this.navBar.getByRole("link", { name: "BLOG" }); // Initialize the Blog button locator
    this.portfolioLink = this.navBar.getByRole("link", { name: "PORTFOLIO" }); // Initialize the Portfolio button locator
    this.contactLink = this.navBar.getByRole("link", { name: "CONTACT" }); // Initialize the Contact button locator
    this.welcomeMessage = page.locator("#title");
    this.welcomeButton = page.locator('role=link[name="Go Back"]');
  }

  async buttonsDisplay() {
    await expect(this.homeLink).toBeVisible();
    await expect(this.homeLink).toHaveText("Home");
    await expect(this.aboutLink).toBeVisible();
    await expect(this.aboutLink).toHaveText("About");
    await expect(this.blogLink).toBeVisible();
    await expect(this.blogLink).toHaveText("Blog");
    await expect(this.portfolioLink).toBeVisible();
    await expect(this.portfolioLink).toHaveText("Portfolio");
    await expect(this.contactLink).toBeVisible();
    await expect(this.contactLink).toHaveText("Contact");
  }

  async clickHome() {
    await this.homeLink.click();
    await expect(this.page.url()).toBe("https://qaplayground.dev/apps/links/#");
  }

  async clickAbout() {
    await this.aboutLink.click();
    await expect(this.page.url()).toBe(
      "https://qaplayground.dev/apps/links/about",
    );
    await expect(this.welcomeMessage).toHaveText("Welcome to the About Page");
    await expect(this.welcomeButton).toBeVisible();
    await this.welcomeButton.click();
    await expect(this.page.url()).toBe("https://qaplayground.dev/apps/links/");
  }

  async clickBlog() {
    await this.blogLink.click();
    await expect(this.page.url()).toBe(
      "https://qaplayground.dev/apps/links/blog",
    );
    await expect(this.welcomeMessage).toHaveText("Welcome to the Blog Page");
    await expect(this.welcomeButton).toBeVisible();
    await this.welcomeButton.click();
    await expect(this.page.url()).toBe("https://qaplayground.dev/apps/links/");
  }

  async clickPortfolio() {
    await this.portfolioLink.click();
    await expect(this.page.url()).toBe(
      "https://qaplayground.dev/apps/links/portfolio",
    );
    await expect(this.welcomeMessage).toHaveText(
      "Welcome to the Portfolio Page",
    );
    await expect(this.welcomeButton).toBeVisible();
    await this.welcomeButton.click();
    await expect(this.page.url()).toBe("https://qaplayground.dev/apps/links/");
  }

  async clickContact() {
    await this.contactLink.click();
    await expect(this.page.url()).toBe(
      "https://qaplayground.dev/apps/links/contact",
    );
    await expect(this.welcomeMessage).toHaveText("Welcome to the Contact Page");
    await expect(this.welcomeButton).toBeVisible();
    await this.welcomeButton.click();
    await expect(this.page.url()).toBe("https://qaplayground.dev/apps/links/");
  }
}
