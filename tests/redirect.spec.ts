import { test, expect } from '@playwright/test';
import { testSetup } from '../POM/Hooks/before-each';
import { testTeardown } from '../POM/Hooks/after-each';
import { Redirect } from '../POM/redirect';

let redirect: Redirect;

test.describe('Redirect', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await testSetup(page, testInfo);
    await page.goto('/apps/redirect/');
    redirect = new Redirect(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await testTeardown(page, testInfo);
  });

  test('Redirection', async () => {
    await redirect.startRedirectionChain();
    await expect(redirect.backButton).toBeVisible();
  });

  test('Go Back button', async () => {
    await redirect.startRedirectionChain();
    await expect(redirect.backButton).toBeVisible();
    await redirect.backButton.click();
    await expect(redirect.redirectButton).toBeVisible();
  });
});
