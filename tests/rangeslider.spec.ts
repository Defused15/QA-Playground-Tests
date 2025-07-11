import { expect, test } from "@playwright/test";
import { BEFOREACH } from "../POM/Hooks/before-each";
import { AFTEREACH } from "../POM/Hooks/after-each";
import { RangeSlider } from "../POM/rangeslider";
let slider: RangeSlider;

// Set up hook to run before each test
test.beforeEach(async ({ page }, testInfo) => {
  await BEFOREACH(page, testInfo); // Custom before-each logic
  await page.goto("/apps/range-slider/");
  slider = new RangeSlider(page);
});

// Set up hook to run after each test
test.afterEach(async ({ page }, testInfo) => {
  await AFTEREACH(page, testInfo); // Custom after-each logic
});

// "Angry" range (slider values 0-19)
test.describe("Range Angry", () => {
  test("Range bar minimum value", async ({ page }) => {
    await slider.rangebar.fill("0");
    await expect(slider.rangebar).toHaveValue("0");
    // Margin-top 0px means the first emoji is active
    await expect(slider.emojis).toHaveCSS("margin-top", "0px");
    await expect(slider.body).toHaveCSS(
      "background-image",
      "linear-gradient(rgb(253, 141, 88), rgb(220, 97, 30))"
    );
    await expect(slider.sendFeedbackButton).toBeHidden();
  });
  test("Range bar max value", async ({ page }) => {
    await slider.rangebar.fill("19");
    await expect(slider.rangebar).toHaveValue("19");
    // Still in "Angry" range, margin-top should be 0px
    await expect(slider.emojis).toHaveCSS("margin-top", "0px");
    await expect(slider.body).toHaveCSS(
      "background-image",
      "linear-gradient(rgb(253, 141, 88), rgb(220, 97, 30))"
    );
    await expect(slider.sendFeedbackButton).toBeHidden();
  });
});

// "Confused" range (slider values 20-39)
test.describe("Range Confused", () => {
  test("Range bar min value", async ({ page }) => {
    await slider.rangebar.fill("20");
    await expect(slider.rangebar).toHaveValue("20");
    // Margin-top -140px means the second emoji is active
    await expect(slider.emojis).toHaveCSS("margin-top", "-140px");
    await expect(slider.body).toHaveCSS(
      "background-image",
      "linear-gradient(rgb(254, 169, 84), rgb(218, 115, 21))"
    );
    await expect(slider.sendFeedbackButton).toBeHidden();
  });
  test("Range bar max value", async ({ page }) => {
    await slider.rangebar.fill("39");
    await expect(slider.rangebar).toHaveValue("39");
    // Still in "Confused" range, margin-top should be -140px
    await expect(slider.emojis).toHaveCSS("margin-top", "-140px");
    await expect(slider.body).toHaveCSS(
      "background-image",
      "linear-gradient(rgb(254, 169, 84), rgb(218, 115, 21))"
    );
    await expect(slider.sendFeedbackButton).toBeHidden();
  });
});

// "Happy" range (slider values 40-59)
test.describe("Range Happy", () => {
  test("Range bar min value", async ({ page }) => {
    await slider.rangebar.fill("40");
    await expect(slider.rangebar).toHaveValue("40");
    // Margin-top -280px means the third emoji is active
    await expect(slider.emojis).toHaveCSS("margin-top", "-280px");
    await expect(slider.body).toHaveCSS(
      "background-image",
      "linear-gradient(rgb(254, 169, 84), rgb(218, 115, 21))"
    );
    await expect(slider.sendFeedbackButton).toBeVisible();
  });
  test("Range bar max value", async ({ page }) => {
    await slider.rangebar.fill("59");
    await expect(slider.rangebar).toHaveValue("59");
    // Still in "Happy" range, margin-top should be -280px
    await expect(slider.emojis).toHaveCSS("margin-top", "-280px");
    await expect(slider.body).toHaveCSS(
      "background-image",
      "linear-gradient(rgb(254, 169, 84), rgb(218, 115, 21))"
    );
    await expect(slider.sendFeedbackButton).toBeVisible();
  });
});

// "Like" range (slider values 60-79)
test.describe("Range Like", () => {
  test("Range bar min value", async ({ page }) => {
    await slider.rangebar.fill("60");
    await expect(slider.rangebar).toHaveValue("60");
    // Margin-top -420px means the fourth emoji is active
    await expect(slider.emojis).toHaveCSS("margin-top", "-420px");
    await expect(slider.body).toHaveCSS(
      "background-image",
      "linear-gradient(rgb(254, 209, 81), rgb(222, 152, 31))"
    );
    await expect(slider.sendFeedbackButton).toBeHidden();
    // "Thank you for your feedback!" message should appear
    await expect(slider.tyText).toHaveText("Thank you for your feedback!");
  });

  test("Range bar max value", async ({ page }) => {
    await slider.rangebar.fill("79");
    await expect(slider.rangebar).toHaveValue("79");
    // Still in "Like" range, margin-top should be -420px
    await expect(slider.emojis).toHaveCSS("margin-top", "-420px");
    await expect(slider.body).toHaveCSS(
      "background-image",
      "linear-gradient(rgb(254, 209, 81), rgb(222, 152, 31))"
    );
    await expect(slider.sendFeedbackButton).toBeHidden();
  });
});

// "Kiss" range (slider values 80-100)
test.describe("Range Kiss", () => {
  test("Range bar min value", async ({ page }) => {
    await slider.rangebar.fill("80");
    await expect(slider.rangebar).toHaveValue("80");
    // Margin-top -560px means the fifth emoji is active
    await expect(slider.emojis).toHaveCSS("margin-top", "-560px");
    await expect(slider.body).toHaveCSS(
      "background-image",
      "linear-gradient(rgb(254, 209, 81), rgb(222, 152, 31))"
    );
    await expect(slider.sendFeedbackButton).toBeHidden();
  });
  test("Range bar max value", async ({ page }) => {
    await slider.rangebar.fill("100");
    await expect(slider.rangebar).toHaveValue("100");
    // Still in "Kiss" range, margin-top should be -560px
    await expect(slider.emojis).toHaveCSS("margin-top", "-560px");
    await expect(slider.body).toHaveCSS(
      "background-image",
      "linear-gradient(rgb(254, 209, 81), rgb(222, 152, 31))"
    );
    await expect(slider.sendFeedbackButton).toBeHidden();
  });
});
