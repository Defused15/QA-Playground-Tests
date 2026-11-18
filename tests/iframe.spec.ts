import { expect, test } from '@playwright/test';
import { testSetup } from '../POM/Hooks/before-each';
import { testTeardown } from '../POM/Hooks/after-each';
import { IFrame } from '../POM/iframe';

let iframeApp: IFrame;

test.describe('Nested iFrame', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await testSetup(page, testInfo);
    await page.goto('/apps/iframe/');
    iframeApp = new IFrame(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await testTeardown(page, testInfo);
  });

  test('Outer iframe loads with title', async () => {
    await test.step('Outer iframe is rendered', async () => {
      await expect(iframeApp.outerIframe).toBeVisible();
    });

    await test.step('Outer iframe shows its title', async () => {
      await expect(iframeApp.outerFrameTitle).toHaveText('First Level Iframe');
    });
  });

  test('Inner iframe loads with title', async () => {
    await test.step('Inner iframe shows its title', async () => {
      await expect(iframeApp.innerFrameTitle).toHaveText('Second Level Iframe');
    });
  });

  test('Click Me link is visible in inner iframe', async () => {
    await test.step('Click Me link is rendered inside the inner iframe', async () => {
      await expect(iframeApp.clickMeLink).toBeVisible();
    });
  });

  test('Clicked message hidden before interaction', async () => {
    await test.step('Confirmation message is not shown on load', async () => {
      await expect(iframeApp.clickedMessage).toBeHidden();
    });
  });

  test('Click Me shows confirmation message', async () => {
    await test.step('Click the Click Me link', async () => {
      await iframeApp.clickMeLink.click();
    });

    await test.step('Confirmation message is displayed', async () => {
      await expect(iframeApp.clickedMessage).toBeVisible();
      await expect(iframeApp.clickedMessage).toHaveText('Button Clicked');
    });
  });
});
