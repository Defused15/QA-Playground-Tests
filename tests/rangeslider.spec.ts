import { expect, test } from "@playwright/test";
import { BEFOREACH } from "../POM/Hooks/before-each";
import { AFTEREACH } from "../POM/Hooks/after-each";
import { RangeSlider } from "../POM/rangeslider";
let slider: RangeSlider;

// Set up hook to run before each test
test.beforeEach(async ({ page }, testInfo) => {
  await BEFOREACH(page, testInfo); // Custom before-each logic
  // Navigate to the range slider app page
  await page.goto("/apps/range-slider/");
  // Initialize the RangeSlider page object
  slider = new RangeSlider(page);
});

// Set up hook to run after each test
test.afterEach(async ({ page }, testInfo) => {
  await AFTEREACH(page, testInfo); // Custom after-each logic
});

// Group of tests for the range slider
test.describe("Range 1", () => {
  // Test for minimum value of the range bar
  test("Range bar minimum value", async ({ page }) => {
    // Set the range bar value to minimum (0)
    await slider.rangebar.fill("0");
    // Assert the range bar value is '0'
    await expect(slider.rangebar).toHaveValue("0");
    // Assert only the first emoji is visible, others are hidden
    await expect(slider.emojis[0]).toBeVisible();
    await expect(slider.emojis[1]).toBeHidden();
    await expect(slider.emojis[2]).toBeHidden();
    await expect(slider.emojis[3]).toBeHidden();
    await expect(slider.emojis[4]).toBeHidden();
  });
});
