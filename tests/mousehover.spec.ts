import { expect, test } from '@playwright/test';
import { testSetup } from '../POM/Hooks/before-each';
import { testTeardown } from '../POM/Hooks/after-each';
import { MouseHover } from '../POM/mousehover';

let mouseHover: MouseHover;

// The details card is always in the DOM; only its opacity reveals it on :hover,
// so toBeVisible() cannot tell the states apart.
const HIDDEN = '0';
const SHOWN = '1';

test.describe('Mouse Hover', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await testSetup(page, testInfo);
    await page.goto('/apps/mouse-hover/');
    mouseHover = new MouseHover(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await testTeardown(page, testInfo);
  });

  test.describe('Happy path', () => {
    test('Poster is shown and movie details are transparent on load', async () => {
      await test.step('Poster image is visible', async () => {
        await expect(mouseHover.poster).toBeVisible();
      });

      await test.step('Details card is fully transparent', async () => {
        await expect(mouseHover.detailsPanel).toHaveCSS('opacity', HIDDEN);
      });
    });

    test('Hovering the poster reveals the movie price', async () => {
      await test.step('Hover over the poster', async () => {
        await mouseHover.hoverPoster();
      });

      await test.step('Details card fades in', async () => {
        await expect(mouseHover.detailsPanel).toHaveCSS('opacity', SHOWN);
      });

      await test.step('Current price is $24.96', async () => {
        await expect(mouseHover.currentPrice).toBeVisible();
        await expect(mouseHover.currentPrice).toHaveText('$24.96');
      });
    });

    test('Hover shows the full movie card content', async () => {
      await test.step('Hover over the poster', async () => {
        await mouseHover.hoverPoster();
        await expect(mouseHover.detailsPanel).toHaveCSS('opacity', SHOWN);
      });

      await test.step('Title, slogan and buy button are shown', async () => {
        await expect(mouseHover.movieTitle).toBeVisible();
        await expect(mouseHover.slogan).toBeVisible();
        await expect(mouseHover.buyButton).toBeVisible();
      });

      await test.step('Old price is struck through and new price is green', async () => {
        await expect(mouseHover.oldPrice).toHaveCSS(
          'text-decoration-line',
          'line-through'
        );
        await expect(mouseHover.currentPrice).toHaveCSS(
          'color',
          'rgb(9, 195, 114)'
        );
      });
    });
  });

  test.describe('Edge cases', () => {
    test('Moving the pointer away hides the details again', async () => {
      await test.step('Hover reveals the details', async () => {
        await mouseHover.hoverPoster();
        await expect(mouseHover.detailsPanel).toHaveCSS('opacity', SHOWN);
      });

      await test.step('Move the pointer off the card', async () => {
        await mouseHover.moveMouseAway();
      });

      await test.step('Details card is transparent again', async () => {
        await expect(mouseHover.detailsPanel).toHaveCSS('opacity', HIDDEN);
      });
    });

    test('Repeated hover in and out toggles the details each time', async () => {
      for (let round = 1; round <= 3; round++) {
        await test.step(`Hover round ${round}: in shows, out hides`, async () => {
          await mouseHover.hoverPoster();
          await expect(mouseHover.detailsPanel).toHaveCSS('opacity', SHOWN);
          await mouseHover.moveMouseAway();
          await expect(mouseHover.detailsPanel).toHaveCSS('opacity', HIDDEN);
        });
      }
    });

    test('Hovering the area below the poster also reveals the details', async () => {
      await test.step('Hover the Buy now button area', async () => {
        await mouseHover.buyButton.hover();
      });

      await test.step('Details card is shown with the price', async () => {
        await expect(mouseHover.detailsPanel).toHaveCSS('opacity', SHOWN);
        await expect(mouseHover.currentPrice).toHaveText('$24.96');
      });
    });

    test('Hover reveals the price at a mobile viewport', async () => {
      await test.step('Resize to 375x667', async () => {
        await mouseHover.resizeToMobile();
        await expect(mouseHover.detailsPanel).toHaveCSS('opacity', HIDDEN);
      });

      await test.step('Hover over the poster', async () => {
        await mouseHover.hoverPoster();
      });

      await test.step('Details card and price are shown', async () => {
        await expect(mouseHover.detailsPanel).toHaveCSS('opacity', SHOWN);
        await expect(mouseHover.currentPrice).toBeInViewport();
      });
    });
  });

  test.describe('Negative cases', () => {
    test('Keyboard focus on the poster link does not reveal the details', async ({
      browserName,
    }) => {
      await test.step('Tab to the poster link', async () => {
        await mouseHover.tabTo(mouseHover.posterLink, browserName);
        await expect(mouseHover.posterLink).toBeFocused();
      });

      await test.step('Details stay transparent (hover only, no focus style)', async () => {
        await expect(mouseHover.detailsPanel).toHaveCSS('opacity', HIDDEN);
      });
    });

    test('Buy now can receive keyboard focus while invisible', async ({
      browserName,
    }) => {
      await test.step('Tab to the Buy now button', async () => {
        await mouseHover.tabTo(mouseHover.buyButton, browserName);
        await expect(mouseHover.buyButton).toBeFocused();
      });

      await test.step('Focused button is still fully transparent', async () => {
        await expect(mouseHover.detailsPanel).toHaveCSS('opacity', HIDDEN);
      });
    });

    test('Buy now has no purchase action', async ({ page }) => {
      await test.step('Hover and click Buy now', async () => {
        await mouseHover.hoverPoster();
        await expect(mouseHover.detailsPanel).toHaveCSS('opacity', SHOWN);
        await mouseHover.buyButton.click();
      });

      await test.step('Page stays on the movie card', async () => {
        await expect(page).toHaveURL(/\/apps\/mouse-hover\/$/);
        await expect(mouseHover.currentPrice).toHaveText('$24.96');
      });
    });
  });
});
