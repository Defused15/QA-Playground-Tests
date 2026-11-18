import { expect, test } from '@playwright/test';
import { testSetup } from '../POM/Hooks/before-each';
import { testTeardown } from '../POM/Hooks/after-each';
import { Covered } from '../POM/covered';

let covered: Covered;

const INITIAL_TEXT = 'Click the button below';
const SUCCESS_TEXT = 'Mission accomplished';

test.describe('Covered Elements', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await testSetup(page, testInfo);
    await page.goto('/apps/covered/');
    covered = new Covered(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await testTeardown(page, testInfo);
  });

  test.describe('Happy path', () => {
    test('Link starts hidden below the scroll container fold', async () => {
      await test.step('Instruction text is shown', async () => {
        await expect(covered.infoText).toHaveText(INITIAL_TEXT);
      });

      await test.step('Link exists but is clipped out of view', async () => {
        await expect(covered.hiddenLink).toHaveCount(1);
        await expect(covered.hiddenLink).not.toBeInViewport();
      });
    });

    test('Scrolling the container with the mouse wheel reveals the link', async () => {
      await test.step('Wheel-scroll the inner container', async () => {
        await covered.wheelScrollContainer(1500);
      });

      await test.step('Link is now inside the viewport', async () => {
        await expect(covered.hiddenLink).toBeInViewport();
      });

      await test.step('Click the revealed link', async () => {
        await covered.hiddenLink.click();
        await expect(covered.infoText).toHaveText(SUCCESS_TEXT);
      });
    });

    test('Scroll into view and click shows the success message', async ({
      page,
    }) => {
      await test.step('Scroll the link into view', async () => {
        await covered.hiddenLink.scrollIntoViewIfNeeded();
        await expect(covered.hiddenLink).toBeInViewport();
      });

      await test.step('Click the link', async () => {
        await covered.hiddenLink.click();
      });

      await test.step('Success message replaces the instruction', async () => {
        await expect(covered.infoText).toHaveText(SUCCESS_TEXT);
        await expect(page).toHaveURL(/\/apps\/covered\/#$/);
      });
    });
  });

  test.describe('Edge cases', () => {
    test('Link can be found and activated with the keyboard only', async ({
      page,
      browserName,
    }) => {
      await test.step('Tab until the hidden link is focused', async () => {
        await covered.tabToLink(browserName);
        await expect(covered.hiddenLink).toBeFocused();
      });

      await test.step('Focusing scrolls the container to the link', async () => {
        await expect(covered.hiddenLink).toBeInViewport();
      });

      await test.step('Press Enter to activate the link', async () => {
        await page.keyboard.press('Enter');
        await expect(covered.infoText).toHaveText(SUCCESS_TEXT);
      });
    });

    test('Double-clicking the link keeps the success message', async () => {
      await test.step('Reveal the link', async () => {
        await covered.hiddenLink.scrollIntoViewIfNeeded();
        await expect(covered.hiddenLink).toBeInViewport();
      });

      await test.step('Double-click the link', async () => {
        await covered.hiddenLink.dblclick();
      });

      await test.step('Message is set once and stays stable', async () => {
        await expect(covered.infoText).toHaveText(SUCCESS_TEXT);
      });
    });

    test('Link is hidden and reachable at a mobile viewport', async () => {
      await test.step('Resize to 375x667', async () => {
        await covered.resizeToMobile();
      });

      await test.step('Link is still clipped out of view', async () => {
        await expect(covered.hiddenLink).not.toBeInViewport();
      });

      await test.step('Scroll the container and click the link', async () => {
        await covered.wheelScrollContainer(1500);
        await expect(covered.hiddenLink).toBeInViewport();
        await covered.hiddenLink.click();
        await expect(covered.infoText).toHaveText(SUCCESS_TEXT);
      });
    });

    test('A short scroll is not enough to reveal the link', async () => {
      await test.step('Wheel-scroll the container by 100px', async () => {
        await covered.wheelScrollContainer(100);
        await expect
          .poll(() => covered.scrollContainer.evaluate((el) => el.scrollTop))
          .toBeGreaterThan(0);
      });

      await test.step('Link is still out of view', async () => {
        await expect(covered.hiddenLink).not.toBeInViewport();
        await expect(covered.infoText).toHaveText(INITIAL_TEXT);
      });
    });
  });

  test.describe('Negative cases', () => {
    test('Clicking where the link sits before scrolling does nothing', async ({
      page,
    }) => {
      await test.step('Link is clipped by the scroll container', async () => {
        await expect(covered.hiddenLink).not.toBeInViewport();
      });

      await test.step('Mouse click at the link layout position', async () => {
        await covered.clickAtLinkPosition();
      });

      await test.step('Nothing was activated', async () => {
        await expect(covered.infoText).toHaveText(INITIAL_TEXT);
        await expect(page).toHaveURL(/\/apps\/covered\/$/);
      });
    });

    test('Clicking the instruction text does not complete the mission', async () => {
      await test.step('Click the instruction paragraph', async () => {
        await covered.infoText.click();
      });

      await test.step('Instruction text is unchanged', async () => {
        await expect(covered.infoText).toHaveText(INITIAL_TEXT);
      });
    });

    test('Revealing the link without clicking does not change the message', async () => {
      await test.step('Scroll the link into view', async () => {
        await covered.wheelScrollContainer(1500);
        await expect(covered.hiddenLink).toBeInViewport();
      });

      await test.step('Message still asks for a click', async () => {
        await expect(covered.infoText).toHaveText(INITIAL_TEXT);
      });
    });
  });
});
