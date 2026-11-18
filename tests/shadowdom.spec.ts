import { expect, test } from '@playwright/test';
import { testSetup } from '../POM/Hooks/before-each';
import { testTeardown } from '../POM/Hooks/after-each';
import { ShadowDom } from '../POM/shadowdom';

let shadowDom: ShadowDom;

// Boost animates the fill over a 6s CSS transition and sets percent="95" via a 6s setTimeout
const BOOST_TIMEOUT = 10_000;
// 5% and 95% of the fixed 380px track
const INITIAL_FILL_WIDTH = '19px';
const BOOSTED_FILL_WIDTH = '361px';

test.describe('Shadow DOM', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await testSetup(page, testInfo);
    await page.goto('/apps/shadow-dom/');
    shadowDom = new ShadowDom(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await testTeardown(page, testInfo);
  });

  test.describe('Happy path', () => {
    test('Progress bar renders at 5 percent with a Boost button', async () => {
      await test.step('Boost button inside the shadow root is visible', async () => {
        await expect(shadowDom.boostButton).toBeVisible();
        await expect(shadowDom.boostButton).toBeEnabled();
      });

      await test.step('Progress starts at 5 percent', async () => {
        await expect(shadowDom.progressBar).toHaveAttribute('percent', '5');
        await expect(shadowDom.progressFill).toHaveCSS(
          'width',
          INITIAL_FILL_WIDTH
        );
      });
    });

    test('Boost fills the progress bar to 95 percent', async () => {
      await test.step('Click Boost', async () => {
        await shadowDom.boost();
      });

      await test.step('Fill animates to 95 percent of the track', async () => {
        await expect(shadowDom.progressFill).toHaveCSS(
          'width',
          BOOSTED_FILL_WIDTH,
          { timeout: BOOST_TIMEOUT }
        );
      });
    });

    test('Boost updates the percent attribute to 95', async () => {
      await test.step('Click Boost', async () => {
        await shadowDom.boost();
      });

      await test.step('Host element reports percent 95', async () => {
        await expect(shadowDom.progressBar).toHaveAttribute('percent', '95', {
          timeout: BOOST_TIMEOUT,
        });
        await expect(shadowDom.progressFill).toHaveAttribute(
          'style',
          'width: 95%;'
        );
      });
    });
  });

  test.describe('Edge cases', () => {
    test('Fill width updates before the percent attribute does', async () => {
      await test.step('Click Boost', async () => {
        await shadowDom.boost();
      });

      await test.step('Inline width jumps to 95% immediately', async () => {
        await expect(shadowDom.progressFill).toHaveAttribute(
          'style',
          'width: 95%;'
        );
      });

      await test.step('Percent attribute still reads 5 until the delayed update', async () => {
        await expect(shadowDom.progressBar).toHaveAttribute('percent', '5');
      });
    });

    test('Rapid repeated boosts never exceed 95 percent', async () => {
      await test.step('Click Boost five times in a row', async () => {
        await shadowDom.boostRepeatedly(5);
      });

      await test.step('Progress settles at 95 percent', async () => {
        await expect(shadowDom.progressBar).toHaveAttribute('percent', '95', {
          timeout: BOOST_TIMEOUT,
        });
        await expect(shadowDom.progressFill).toHaveCSS(
          'width',
          BOOSTED_FILL_WIDTH,
          { timeout: BOOST_TIMEOUT }
        );
      });
    });

    test('Boost can be triggered with the keyboard only', async ({
      page,
      browserName,
    }) => {
      await test.step('Tab into the shadow root until Boost is focused', async () => {
        await shadowDom.tabToBoost(browserName);
        await expect(shadowDom.boostButton).toBeFocused();
      });

      await test.step('Press Enter to boost', async () => {
        await page.keyboard.press('Enter');
      });

      await test.step('Progress reaches 95 percent', async () => {
        await expect(shadowDom.progressBar).toHaveAttribute('percent', '95', {
          timeout: BOOST_TIMEOUT,
        });
      });
    });

    test('Boost works at a mobile viewport', async () => {
      await test.step('Resize to 375x667', async () => {
        await shadowDom.resizeToMobile();
        await expect(shadowDom.boostButton).toBeVisible();
      });

      await test.step('Click Boost', async () => {
        await shadowDom.boost();
      });

      await test.step('Fill reaches 95 percent of the fixed-width track', async () => {
        await expect(shadowDom.progressFill).toHaveCSS(
          'width',
          BOOSTED_FILL_WIDTH,
          { timeout: BOOST_TIMEOUT }
        );
      });
    });

    test('Percent attribute is clamped to the 0-100 range', async () => {
      await test.step('Values above 100 render as 100%', async () => {
        await shadowDom.setPercent('150');
        await expect(shadowDom.progressFill).toHaveAttribute(
          'style',
          'width: 100%;'
        );
      });

      await test.step('Negative values render as 0%', async () => {
        await shadowDom.setPercent('-20');
        await expect(shadowDom.progressFill).toHaveAttribute(
          'style',
          'width: 0%;'
        );
      });

      await test.step('In-range values render unchanged', async () => {
        await shadowDom.setPercent('42');
        await expect(shadowDom.progressFill).toHaveAttribute(
          'style',
          'width: 42%;'
        );
      });
    });
  });

  test.describe('Negative cases', () => {
    test('Non-numeric percent falls back to 0%', async () => {
      await test.step('Set percent to a non-numeric value', async () => {
        await shadowDom.setPercent('abc');
      });

      await test.step('Fill is rendered empty', async () => {
        await expect(shadowDom.progressFill).toHaveAttribute(
          'style',
          'width: 0%;'
        );
      });
    });

    test('Hovering Boost without clicking does not start progress', async () => {
      await test.step('Hover the Boost button', async () => {
        await shadowDom.boostButton.hover();
      });

      await test.step('Progress remains at 5 percent', async () => {
        await expect(shadowDom.progressFill).toHaveAttribute(
          'style',
          'width: 5%;'
        );
        await expect(shadowDom.progressBar).toHaveAttribute('percent', '5');
      });
    });

    test('XPath cannot reach the button inside the shadow root', async () => {
      await test.step('XPath finds no button in the light DOM', async () => {
        await expect(shadowDom.boostButtonByXPath).toHaveCount(0);
      });

      await test.step('Role-based locator pierces the shadow root', async () => {
        await expect(shadowDom.boostButton).toHaveCount(1);
      });
    });
  });
});
