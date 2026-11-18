import { test, expect } from '@playwright/test';
import { testSetup } from '../POM/Hooks/before-each';
import { testTeardown } from '../POM/Hooks/after-each';
import { Menu, MENU_URLS } from '../POM/menu';

let menu: Menu;

test.describe('Menu Navigation', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await testSetup(page, testInfo);
    await page.goto('/apps/links/');
    menu = new Menu(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await testTeardown(page, testInfo);
  });

  test('navigation buttons display', async () => {
    await test.step('All navigation links are visible with their labels', async () => {
      await expect(menu.homeLink).toBeVisible();
      await expect(menu.homeLink).toHaveText('Home');
      await expect(menu.aboutLink).toBeVisible();
      await expect(menu.aboutLink).toHaveText('About');
      await expect(menu.blogLink).toBeVisible();
      await expect(menu.blogLink).toHaveText('Blog');
      await expect(menu.portfolioLink).toBeVisible();
      await expect(menu.portfolioLink).toHaveText('Portfolio');
      await expect(menu.contactLink).toBeVisible();
      await expect(menu.contactLink).toHaveText('Contact');
    });
  });

  test('Home button', async ({ page }) => {
    await test.step('Open Home', async () => {
      await menu.clickHome();
      await expect(page).toHaveURL(MENU_URLS.home);
    });
  });

  test('About button', async ({ page }) => {
    await test.step('Open About', async () => {
      await menu.clickAbout();
      await expect(page).toHaveURL(MENU_URLS.about);
    });

    await test.step('About page shows its welcome message', async () => {
      await expect(menu.welcomeMessage).toHaveText('Welcome to the About Page');
    });
  });

  test('Blog button', async ({ page }) => {
    await test.step('Open Blog', async () => {
      await menu.clickBlog();
      await expect(page).toHaveURL(MENU_URLS.blog);
    });

    await test.step('Blog page shows its welcome message', async () => {
      await expect(menu.welcomeMessage).toHaveText('Welcome to the Blog Page');
    });
  });

  test('Portfolio button', async ({ page }) => {
    await test.step('Open Portfolio', async () => {
      await menu.clickPortfolio();
      await expect(page).toHaveURL(MENU_URLS.portfolio);
    });

    await test.step('Portfolio page shows its welcome message', async () => {
      await expect(menu.welcomeMessage).toHaveText(
        'Welcome to the Portfolio Page'
      );
    });
  });

  test('Contact button', async ({ page }) => {
    await test.step('Open Contact', async () => {
      await menu.clickContact();
      await expect(page).toHaveURL(MENU_URLS.contact);
    });

    await test.step('Contact page shows its welcome message', async () => {
      await expect(menu.welcomeMessage).toHaveText(
        'Welcome to the Contact Page'
      );
    });
  });

  test('Go Back button from About returns to home', async ({ page }) => {
    await test.step('Open About', async () => {
      await menu.clickAbout();
      await expect(menu.welcomeButton).toBeVisible();
    });

    await test.step('Go back to the menu', async () => {
      await menu.welcomeButton.click();
      await expect(page).toHaveURL(MENU_URLS.base);
    });
  });

  test('Go Back button from Blog returns to home', async ({ page }) => {
    await test.step('Open Blog', async () => {
      await menu.clickBlog();
      await expect(menu.welcomeButton).toBeVisible();
    });

    await test.step('Go back to the menu', async () => {
      await menu.welcomeButton.click();
      await expect(page).toHaveURL(MENU_URLS.base);
    });
  });

  test('Go Back button from Portfolio returns to home', async ({ page }) => {
    await test.step('Open Portfolio', async () => {
      await menu.clickPortfolio();
      await expect(menu.welcomeButton).toBeVisible();
    });

    await test.step('Go back to the menu', async () => {
      await menu.welcomeButton.click();
      await expect(page).toHaveURL(MENU_URLS.base);
    });
  });

  test('Go Back button from Contact returns to home', async ({ page }) => {
    await test.step('Open Contact', async () => {
      await menu.clickContact();
      await expect(menu.welcomeButton).toBeVisible();
    });

    await test.step('Go back to the menu', async () => {
      await menu.welcomeButton.click();
      await expect(page).toHaveURL(MENU_URLS.base);
    });
  });
});
