import { expect, test } from '@playwright/test';
import { testSetup } from '../POM/Hooks/before-each';
import { testTeardown } from '../POM/Hooks/after-each';
import { Popup, POPUP_URL } from '../POM/popup';

const INITIAL_INFO = 'Click to open pop-up';
const CLICKED_INFO = 'Button Clicked';

let popup: Popup;

test.describe('PopUp', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await testSetup(page, testInfo);
    await page.goto('/apps/popup/');
    popup = new Popup(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await testTeardown(page, testInfo);
  });

  test.describe('Happy path', () => {
    test('Initial state shows the prompt and Open button', async () => {
      await test.step('Prompt text is shown', async () => {
        await expect(popup.info).toHaveText(INITIAL_INFO);
      });

      await test.step('Open button is visible', async () => {
        await expect(popup.openButton).toBeVisible();
      });
    });

    test('Open launches the pop-up window', async () => {
      const window = await test.step('Click Open', async () => {
        return await popup.open();
      });

      await test.step('Pop-up loads its page with a Submit button', async () => {
        await expect(window).toHaveURL(POPUP_URL);
        await expect(window).toHaveTitle('pop-up');
        await expect(popup.submitButton(window)).toBeVisible();
      });

      await test.step('Opener is not updated yet', async () => {
        await expect(popup.info).toHaveText(INITIAL_INFO);
      });
    });

    test('Submit closes the pop-up and updates the opener', async ({
      page,
    }) => {
      const window = await test.step('Open the pop-up', async () => {
        return await popup.open();
      });

      await test.step('Click Submit in the pop-up', async () => {
        await popup.submit(window);
      });

      await test.step('Pop-up is closed and opener shows the result', async () => {
        expect(window.isClosed()).toBe(true);
        await expect(popup.info).toHaveText(CLICKED_INFO);
        await expect(page).toHaveURL(/\/apps\/popup\/#?$/);
      });
    });
  });

  test.describe('Edge cases', () => {
    test('Full flow works with the keyboard only', async () => {
      const window = await test.step('Activate Open with Enter', async () => {
        return await popup.openWithKeyboard();
      });

      await test.step('Activate Submit with Space', async () => {
        await popup.submitWithKeyboard(window);
      });

      await test.step('Opener shows the result', async () => {
        await expect(popup.info).toHaveText(CLICKED_INFO);
      });
    });

    test('Open and submit can be repeated', async () => {
      await test.step('First open and submit', async () => {
        await popup.submit(await popup.open());
        await expect(popup.info).toHaveText(CLICKED_INFO);
      });

      const second = await test.step('Open the pop-up again', async () => {
        return await popup.open();
      });

      await test.step('Second pop-up works and closes', async () => {
        await expect(popup.submitButton(second)).toBeVisible();
        await popup.submit(second);
        await expect(popup.info).toHaveText(CLICKED_INFO);
      });
    });

    test('Any click inside the pop-up updates the opener', async () => {
      const window = await test.step('Open the pop-up', async () => {
        return await popup.open();
      });

      await test.step('Click an empty area of the pop-up', async () => {
        await window.mouse.click(5, 5);
      });

      // The handler is attached to the whole pop-up window, not the button.
      await test.step('Opener updates while the pop-up stays open', async () => {
        await expect(popup.info).toHaveText(CLICKED_INFO);
        expect(window.isClosed()).toBe(false);
      });
    });

    test('Clicking Open again reuses the existing pop-up window', async ({
      context,
    }) => {
      const window = await test.step('Open the pop-up', async () => {
        return await popup.open();
      });

      await test.step('Click Open again while it is still open', async () => {
        const reloaded = window.waitForEvent('load');
        await popup.openButton.click();
        await reloaded;
      });

      await test.step('No extra window is created', async () => {
        expect(context.pages()).toHaveLength(2);
        await expect(popup.submitButton(window)).toBeVisible();
      });
    });
  });

  test.describe('Negative cases', () => {
    test('Closing the pop-up without submitting changes nothing', async () => {
      const window = await test.step('Open the pop-up', async () => {
        return await popup.open();
      });

      await test.step('Close the pop-up window directly', async () => {
        await window.close();
      });

      await test.step('Opener keeps the initial prompt', async () => {
        await expect(popup.info).toHaveText(INITIAL_INFO);
      });
    });

    test('Submit after re-opening an already open pop-up is not reported', async () => {
      const window = await test.step('Open the pop-up', async () => {
        return await popup.open();
      });

      // Re-opening reloads the named window, which drops the click handler
      // the opener had attached to it.
      await test.step('Click Open again and wait for the reload', async () => {
        const reloaded = window.waitForEvent('load');
        await popup.openButton.click();
        await reloaded;
      });

      await test.step('Submit closes the pop-up', async () => {
        await popup.submit(window);
      });

      await test.step('Opener is not updated', async () => {
        await expect(popup.info).toHaveText(INITIAL_INFO);
      });
    });
  });
});
