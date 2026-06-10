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
    await menu.buttonsDisplay();
  });

  test('Home button', async ({ page }) => {
    await menu.clickHome();
    await expect(page).toHaveURL(MENU_URLS.home);
  });

  test('About button', async ({ page }) => {
    await menu.clickAbout();
    await expect(page).toHaveURL(MENU_URLS.about);
    await expect(menu.welcomeMessage).toHaveText('Welcome to the About Page');
  });

  test('Blog button', async ({ page }) => {
    await menu.clickBlog();
    await expect(page).toHaveURL(MENU_URLS.blog);
    await expect(menu.welcomeMessage).toHaveText('Welcome to the Blog Page');
  });

  test('Portfolio button', async ({ page }) => {
    await menu.clickPortfolio();
    await expect(page).toHaveURL(MENU_URLS.portfolio);
    await expect(menu.welcomeMessage).toHaveText(
      'Welcome to the Portfolio Page'
    );
  });

  test('Contact button', async ({ page }) => {
    await menu.clickContact();
    await expect(page).toHaveURL(MENU_URLS.contact);
    await expect(menu.welcomeMessage).toHaveText('Welcome to the Contact Page');
  });

  test('Go Back button from About returns to home', async ({ page }) => {
    await menu.clickAbout();
    await expect(menu.welcomeButton).toBeVisible();
    await menu.welcomeButton.click();
    await expect(page).toHaveURL(MENU_URLS.base);
  });

  test('Go Back button from Blog returns to home', async ({ page }) => {
    await menu.clickBlog();
    await expect(menu.welcomeButton).toBeVisible();
    await menu.welcomeButton.click();
    await expect(page).toHaveURL(MENU_URLS.base);
  });

  test('Go Back button from Portfolio returns to home', async ({ page }) => {
    await menu.clickPortfolio();
    await expect(menu.welcomeButton).toBeVisible();
    await menu.welcomeButton.click();
    await expect(page).toHaveURL(MENU_URLS.base);
  });

  test('Go Back button from Contact returns to home', async ({ page }) => {
    await menu.clickContact();
    await expect(menu.welcomeButton).toBeVisible();
    await menu.welcomeButton.click();
    await expect(page).toHaveURL(MENU_URLS.base);
  });
});
