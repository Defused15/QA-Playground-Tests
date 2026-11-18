import { expect, test } from '@playwright/test';
import { testSetup } from '../POM/Hooks/before-each';
import { testTeardown } from '../POM/Hooks/after-each';
import { ChangingIframe } from '../POM/changingiframe';

let changingIframe: ChangingIframe;

// The countdown starts at 01:00 and the frame swaps itself to the second page
// when it hits 00:51, i.e. about 10 seconds after load.
const SWAP_TIMEOUT = 15_000;

test.describe('Changeable Iframe', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await testSetup(page, testInfo);
    await page.goto('/apps/changing-iframe/');
    changingIframe = new ChangingIframe(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await testTeardown(page, testInfo);
  });

  test.describe('Happy path', () => {
    test('First iframe loads with the registration countdown', async () => {
      await test.step('Iframe is rendered on the page', async () => {
        await expect(changingIframe.iframe).toBeVisible();
      });

      await test.step('First iframe legend and countdown are shown', async () => {
        await expect(changingIframe.firstIframeGroup).toBeVisible();
        await expect(changingIframe.registrationText).toHaveText(
          /^Registration closes in 0[01]:\d{2} minutes!$/
        );
      });
    });

    test('Countdown ticks down every second', async () => {
      let first = '';

      await test.step('Read a running countdown value', async () => {
        await expect
          .poll(() => changingIframe.readCountdown(), { intervals: [100] })
          .toMatch(/^00:5[2-9]$/);
        first = await changingIframe.readCountdown();
      });

      await test.step('Countdown drops below the first value', async () => {
        await expect
          .poll(
            async () => {
              const current = await changingIframe.readCountdown();
              return current !== '' && current < first;
            },
            { intervals: [100] }
          )
          .toBe(true);
      });
    });

    test('Countdown reaches 53 seconds remaining', async () => {
      await test.step('Timer shows 00:53 before the frame changes', async () => {
        // The value is only on screen for ~1s, so poll faster than the default
        await expect
          .poll(() => changingIframe.readCountdown(), {
            intervals: [100],
            timeout: SWAP_TIMEOUT,
          })
          .toBe('00:53');
      });

      await test.step('Frame still shows the first page at 00:53', async () => {
        await expect(changingIframe.firstIframeGroup).toBeVisible();
      });
    });

    test('Iframe switches to the end-of-journey message', async () => {
      await test.step('Second iframe legend appears after the countdown', async () => {
        await expect(changingIframe.secondIframeGroup).toBeVisible({
          timeout: SWAP_TIMEOUT,
        });
      });

      await test.step('End-of-journey message is displayed', async () => {
        await expect(changingIframe.endMessage).toBeVisible();
        await expect(changingIframe.endMessage).toHaveCSS(
          'color',
          'rgb(250, 129, 66)'
        );
      });

      await test.step('First iframe content is gone', async () => {
        await expect(changingIframe.firstIframeGroup).toHaveCount(0);
      });
    });
  });

  test.describe('Edge cases', () => {
    test('Frame document changes while the iframe src attribute does not', async () => {
      await test.step('Iframe initially loads iframe1', async () => {
        expect(changingIframe.frameUrl()).toContain('/iframe1');
        await expect(changingIframe.iframe).toHaveAttribute(
          'src',
          'iframe1.html'
        );
      });

      await test.step('Frame navigates to iframe2 after the countdown', async () => {
        await expect
          .poll(() => changingIframe.frameUrl(), { timeout: SWAP_TIMEOUT })
          .toContain('/iframe2');
        await expect(changingIframe.endMessage).toBeVisible();
      });

      await test.step('Parent iframe src attribute is unchanged', async () => {
        // location.replace() inside the frame never touches the parent markup
        await expect(changingIframe.iframe).toHaveAttribute(
          'src',
          'iframe1.html'
        );
      });
    });

    test('Swap still happens after resizing to a mobile viewport', async () => {
      await test.step('Resize viewport mid-countdown', async () => {
        await expect(changingIframe.firstIframeGroup).toBeVisible();
        await changingIframe.resizeToMobile();
      });

      await test.step('Iframe stays visible at mobile width', async () => {
        await expect(changingIframe.iframe).toBeVisible();
        await expect(changingIframe.iframe).toBeInViewport();
      });

      await test.step('Second iframe message appears', async () => {
        await expect(changingIframe.endMessage).toBeVisible({
          timeout: SWAP_TIMEOUT,
        });
      });
    });

    test('Reloading after the swap restarts the countdown', async () => {
      await test.step('Wait for the second iframe', async () => {
        await expect(changingIframe.endMessage).toBeVisible({
          timeout: SWAP_TIMEOUT,
        });
      });

      await test.step('Reload the page', async () => {
        await changingIframe.reload();
      });

      await test.step('First iframe and countdown are back', async () => {
        await expect(changingIframe.firstIframeGroup).toBeVisible();
        await expect(changingIframe.countdown).toHaveText(/^0[01]:\d{2}$/);
        await expect(changingIframe.endMessage).toHaveCount(0);
      });
    });
  });

  test.describe('Negative cases', () => {
    test('End message is not present while the countdown runs', async () => {
      await test.step('Countdown is running in the first iframe', async () => {
        await expect(changingIframe.countdown).toBeVisible();
      });

      await test.step('Second iframe content does not exist yet', async () => {
        await expect(changingIframe.endMessage).toHaveCount(0);
        await expect(changingIframe.secondIframeGroup).toHaveCount(0);
      });
    });

    test('Countdown timer no longer exists after the swap', async () => {
      await test.step('Wait for the second iframe', async () => {
        await expect(changingIframe.secondIframeGroup).toBeVisible({
          timeout: SWAP_TIMEOUT,
        });
      });

      await test.step('Timer and registration text are gone', async () => {
        await expect(changingIframe.countdown).toHaveCount(0);
        await expect(changingIframe.registrationText).toHaveCount(0);
      });
    });
  });
});
