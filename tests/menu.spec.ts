import { test } from "@playwright/test";
import { BEFOREACH } from "../POM/Hooks/before-each";
import { AFTEREACH } from "../POM/Hooks/after-each";
import { Menu } from "../POM/menu";

let menu: Menu; // Declare a variable to hold the Menu page object

// Hook to run before each test
test.beforeEach(async ({ page }, testInfo) => {
  await BEFOREACH(page, testInfo); // Perform setup actions
  await page.goto("/apps/links/"); // Navigate to the links app
  menu = new Menu(page); // Initialize the Menu page object
});

// Hook to run after each test
test.afterEach(async ({ page }, testInfo) => {
  await AFTEREACH(page, testInfo); // Perform cleanup actions
});

// Test to verify the display of navigation buttons
test("navigation buttons display", async () => {
  await menu.buttonsDisplay(); // Verify that all navigation buttons are displayed correctly
});

test("Home button", async () => {
  await menu.clickHome(); // Click the Home button and verify the URL
});

test("About button", async () => {
  await menu.clickAbout(); // Click the About button and verify the URL and welcome message
});

test("Blog button", async () => {
  await menu.clickBlog(); // Click the Blog button and verify the URL and welcome message
});

test("Porfolio button", async () => {
  await menu.clickPortfolio(); // Click the Portfolio button and verify the URL and welcome message
});

test("Contact button", async () => {
  await menu.clickContact(); // Click the Contact button and verify the URL and welcome message
});
