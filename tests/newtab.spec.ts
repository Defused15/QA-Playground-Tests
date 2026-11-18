import { expect, test } from '@playwright/test';
import { testSetup } from '../POM/Hooks/before-each';
import { testTeardown } from '../POM/Hooks/after-each';
import { NewTab, NEW_PAGE_URL } from '../POM/newtab';

let newTab: NewTab;

test.describe('New Tab', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await testSetup(page, testInfo);
    await page.goto('/apps/new-tab/');
    newTab = new NewTab(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await testTeardown(page, testInfo);
  });

  test.describe('Happy path', () => {
    test('Page shows the Open New Tab button', async ({ page }) => {
      await test.step('Verify page title', async () => {
        await expect(page).toHaveTitle('Test New Tab');
      });

      await test.step('Verify link opens in a new browsing context', async () => {
        await expect(newTab.openButton).toBeVisible();
        await expect(newTab.openButton).toHaveAttribute('target', '_blank');
        await expect(newTab.openButton).toHaveAttribute(
          'href',
          './new-page.html'
        );
      });
    });

    test('Clicking the button opens the new page in a new tab', async ({
      context,
    }) => {
      const tab = await test.step('Click Open New Tab', async () => {
        return newTab.openNewTab();
      });

      await test.step('Verify the new tab content', async () => {
        await expect(tab).toHaveURL(NEW_PAGE_URL);
        await expect(tab).toHaveTitle('New Page');
        await expect(NewTab.heading(tab)).toBeVisible();
      });

      await test.step('Verify two tabs are open', async () => {
        expect(context.pages()).toHaveLength(2);
      });
    });

    test('Original tab stays on the same page', async ({ page }) => {
      const startUrl = page.url();

      await test.step('Open the new tab', async () => {
        await newTab.openNewTab();
      });

      await test.step('Verify original tab is unchanged', async () => {
        await expect(page).toHaveURL(startUrl);
        await expect(newTab.openButton).toBeVisible();
      });
    });

    test('Closing the new tab returns control to the original', async ({
      page,
      context,
    }) => {
      const tab = await test.step('Open the new tab', async () => {
        return newTab.openNewTab();
      });

      await test.step('Close the new tab', async () => {
        await tab.close();
        expect(context.pages()).toEqual([page]);
      });

      await test.step('Verify the original tab still works', async () => {
        await expect(newTab.openButton).toBeVisible();
        const reopened = await newTab.openNewTab();
        await expect(NewTab.heading(reopened)).toBeVisible();
      });
    });
  });

  test.describe('Edge cases', () => {
    test('Open the new tab using the keyboard only', async () => {
      const tab = await test.step('Focus link and press Enter', async () => {
        return newTab.openNewTabWithKeyboard();
      });

      await test.step('Verify the new tab content', async () => {
        await expect(tab).toHaveURL(NEW_PAGE_URL);
        await expect(NewTab.heading(tab)).toBeVisible();
      });
    });

    test('Each click opens a separate tab', async ({ context }) => {
      await test.step('Click the button twice', async () => {
        await newTab.openNewTab();
        await newTab.openNewTab();
      });

      await test.step('Verify three tabs with two new pages', async () => {
        const pages = context.pages();
        expect(pages).toHaveLength(3);
        for (const tab of pages.slice(1)) {
          await expect(NewTab.heading(tab)).toBeVisible();
        }
      });
    });

    test('New tab works on a mobile-sized viewport', async ({ page }) => {
      await test.step('Resize viewport to mobile width', async () => {
        await page.setViewportSize({ width: 375, height: 667 });
        await expect(newTab.openButton).toBeInViewport();
      });

      const tab = await test.step('Open the new tab', async () => {
        return newTab.openNewTab();
      });

      await test.step('Verify the new tab content', async () => {
        await expect(NewTab.heading(tab)).toBeVisible();
      });
    });

    test('Old .html URL redirects to the clean new page URL', async () => {
      const tab = await test.step('Open the new tab', async () => {
        return newTab.openNewTab();
      });

      await test.step('Verify final URL has no .html suffix', async () => {
        await expect(tab).toHaveURL(NEW_PAGE_URL);
        expect(tab.url()).not.toContain('.html');
      });
    });
  });

  test.describe('Negative cases', () => {
    // target=_blank without rel implies noopener in modern browsers
    test('New tab has no access to the opener window', async () => {
      const tab = await test.step('Open the new tab', async () => {
        return newTab.openNewTab();
      });

      await test.step('Verify window.opener is null', async () => {
        expect(await tab.evaluate('window.opener')).toBeNull();
      });
    });

    test('New page has no link back to the original page', async () => {
      const tab = await test.step('Open the new tab', async () => {
        return newTab.openNewTab();
      });

      await test.step('Verify there are no links or buttons', async () => {
        await expect(NewTab.heading(tab)).toBeVisible();
        await expect(tab.getByRole('link')).toHaveCount(0);
        await expect(tab.getByRole('button')).toHaveCount(0);
      });
    });
  });
});
