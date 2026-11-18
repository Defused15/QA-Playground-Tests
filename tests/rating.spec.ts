import { expect, test } from '@playwright/test';
import { testSetup } from '../POM/Hooks/before-each';
import { testTeardown } from '../POM/Hooks/after-each';
import { emojiOffset, Rating, RATING_LABELS, STAR_COLORS } from '../POM/rating';

let rating: Rating;

/** Asserts footer text, score, emoji and the first `active` stars are lit. */
const expectRatingShown = async (stars: number, active = stars) => {
  await expect
    .poll(() => rating.pseudoText(rating.ratingText))
    .toBe(RATING_LABELS[stars]);
  await expect
    .poll(() => rating.pseudoText(rating.ratingScore))
    .toBe(`${stars} out of 5`);
  await expect(rating.emojiStrip).toHaveCSS('margin-top', emojiOffset(stars));
  for (let n = 1; n <= 5; n++) {
    await expect(rating.star(n)).toHaveCSS(
      'color',
      n <= active ? STAR_COLORS.active : STAR_COLORS.inactive
    );
  }
};

test.describe('Rating', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await testSetup(page, testInfo);
    await page.goto('/apps/rating/');
    rating = new Rating(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await testTeardown(page, testInfo);
  });

  test.describe('Happy path', () => {
    test('Default state has no rating selected', async () => {
      await test.step('Five stars and no checked radio', async () => {
        await expect(rating.starLabels).toHaveCount(5);
        await expect(rating.radios).toHaveCount(5);
        await expect(rating.checkedRadios).toHaveCount(0);
      });

      await test.step('Footer prompts for a rating with 0 out of 5', async () => {
        await expectRatingShown(0);
      });
    });

    for (let stars = 1; stars <= 5; stars++) {
      test(`Selecting ${stars} star(s) shows "${RATING_LABELS[stars]}"`, async () => {
        await test.step(`Click star ${stars}`, async () => {
          await rating.rate(stars);
        });

        await test.step('Matching radio is checked', async () => {
          await expect(rating.radio(stars)).toBeChecked();
        });

        await test.step('Footer, emoji and stars reflect the rating', async () => {
          await expectRatingShown(stars);
        });
      });
    }
  });

  test.describe('Edge cases', () => {
    test('Changing from 5 stars to 1 star updates everything', async () => {
      await test.step('Rate 5 stars', async () => {
        await rating.rate(5);
        await expectRatingShown(5);
      });

      await test.step('Change to 1 star', async () => {
        await rating.rate(1);
      });

      await test.step('Display drops back to the lowest rating', async () => {
        await expect(rating.radio(5)).not.toBeChecked();
        await expectRatingShown(1);
      });
    });

    test('Hovering a star previews the highlight without changing the rating', async () => {
      await test.step('Rate 2 stars', async () => {
        await rating.rate(2);
        await expectRatingShown(2);
      });

      await test.step('Hover star 4', async () => {
        await rating.hoverStar(4);
      });

      await test.step('Stars 1-4 light up but footer still shows 2', async () => {
        await expect(rating.radio(4)).not.toBeChecked();
        await expectRatingShown(2, 4);
      });

      await test.step('Moving away restores the 2-star highlight', async () => {
        await rating.moveMouseAway();
        await expectRatingShown(2);
      });
    });

    test('Rapid clicks across all stars settle on the last one', async () => {
      await test.step('Click stars 1 to 5 then 3 in quick succession', async () => {
        for (const n of [1, 2, 3, 4, 5, 3]) {
          await rating.rate(n);
        }
      });

      await test.step('Only star 3 is selected', async () => {
        await expect(rating.radio(3)).toBeChecked();
        await expect(rating.checkedRadios).toHaveCount(1);
        await expectRatingShown(3);
      });
    });

    test('Rating works on a mobile viewport', async ({ page }) => {
      await test.step('Resize to phone width', async () => {
        await page.setViewportSize({ width: 375, height: 667 });
        await expect(rating.star(5)).toBeVisible();
      });

      await test.step('Rate 4 stars', async () => {
        await rating.rate(4);
      });

      await test.step('Rating is shown', async () => {
        await expectRatingShown(4);
      });
    });
  });

  test.describe('Negative cases', () => {
    test('Re-clicking the selected star does not clear the rating', async () => {
      await test.step('Click star 3 twice', async () => {
        await rating.rate(3);
        await expect(rating.radio(3)).toBeChecked();
        await rating.rate(3);
      });

      await test.step('Rating stays at 3', async () => {
        await expect(rating.radio(3)).toBeChecked();
        await expectRatingShown(3);
      });
    });

    test('Hover alone does not select a rating', async () => {
      await test.step('Hover star 5 then move away', async () => {
        await rating.hoverStar(5);
        await expect(rating.star(5)).toHaveCSS('color', STAR_COLORS.active);
        await rating.moveMouseAway();
      });

      await test.step('No rating is recorded', async () => {
        await expect(rating.radio(5)).not.toBeChecked();
        await expectRatingShown(0);
      });
    });

    // Radios are display:none, so the widget cannot be reached by keyboard
    test('Star inputs are hidden from keyboard and assistive tech', async ({
      page,
    }) => {
      await test.step('All radio inputs are hidden', async () => {
        for (let n = 1; n <= 5; n++) {
          await expect(rating.radio(n)).toBeHidden();
        }
      });

      await test.step('No radio is exposed in the accessibility tree', async () => {
        await expect(page.getByRole('radio')).toHaveCount(0);
      });
    });
  });
});
