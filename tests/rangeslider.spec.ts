import { expect, test } from "@playwright/test";
import { BEFOREACH } from "../POM/Hooks/before-each";
import { AFTEREACH } from "../POM/Hooks/after-each";
import { RangeSlider } from "../POM/rangeslider";
let slider: RangeSlider;

// Set up hook to run before each test
test.beforeEach(async ({ page }, testInfo) => {
  await BEFOREACH(page, testInfo); // Run custom before-each logic
  // Navigate to the range slider app page
  await page.goto("/apps/range-slider/");
  // Initialize the RangeSlider page object
  slider = new RangeSlider(page);
});

// Set up hook to run after each test
test.afterEach(async ({ page }, testInfo) => {
  await AFTEREACH(page, testInfo); // Run custom after-each logic
});

// Group of tests for the "Angry" range (slider values 0-19)
test.describe("Range Angry", () => {
  // Test for minimum value of the range bar (0)
  test("Range bar minimum value", async ({ page }) => {
    // Set the range bar value to minimum (0)
    await slider.rangebar.fill("0");
  
    await expect(slider.rangebar).toHaveValue("0");
    // Assert the emoji has the correct margin for the current value.
    // All emojis are visible, so we rely on the margin change to identify the active one.
    await expect(slider.emojis).toHaveCSS("margin-top", "0px");
    // Assert the background color for this value
    await expect(slider.body).toHaveCSS(
      "background-image",
      "linear-gradient(rgb(253, 141, 88), rgb(220, 97, 30))"
    );
  });

  // Test for maximum value of the "Angry" range (19)
  test("Range bar max value", async ({ page }) => {
    // Set the range bar value to maximum for this range (19)
    await slider.rangebar.fill("19");
    await expect(slider.rangebar).toHaveValue("19");
    // Assert the emoji has the correct margin for the current value.
    // All emojis are visible, so we rely on the margin change to identify the active one.
    await expect(slider.emojis).toHaveCSS("margin-top", "0px");
    // Assert the background color for this value
    await expect(slider.body).toHaveCSS(
      "background-image",
      "linear-gradient(rgb(253, 141, 88), rgb(220, 97, 30))"
    );
  });
});

// Group of tests for the "Confused" range (slider values 20-39)
test.describe("Range Confused", () => {
  // Test for minimum value of the "Confused" range (20)
  test("Range bar min value", async ({ page }) => {
    // Set the range bar value to minimum for this range (20)
    await slider.rangebar.fill("20");
    // Assert the range bar value is '20'
    await expect(slider.rangebar).toHaveValue("20");
    // Assert the emoji has the correct margin for the current value.
    // All emojis are visible, so we rely on the margin change to identify the active one.
    await expect(slider.emojis).toHaveCSS("margin-top", "-140px");
    // Assert the background color for this value
    await expect(slider.body).toHaveCSS(
      "background-image",
      "linear-gradient(rgb(254, 169, 84), rgb(218, 115, 21))"
    );
  });

  // Test for maximum value of the "Confused" range (39)
  test("Range bar max value", async ({ page }) => {
    // Set the range bar value to maximum for this range (39)
    await slider.rangebar.fill("39");
    // Assert the range bar value is '39'
    await expect(slider.rangebar).toHaveValue("39");
    // Assert the emoji has the correct margin for the current value.
    // All emojis are visible, so we rely on the margin change to identify the active one.
    await expect(slider.emojis).toHaveCSS("margin-top", "-140px");
    // Assert the background color for this value
    await expect(slider.body).toHaveCSS(
      "background-image",
      "linear-gradient(rgb(254, 169, 84), rgb(218, 115, 21))"
    );
  });
});
