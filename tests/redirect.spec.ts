import { test, expect } from "@playwright/test";
import { BEFOREACH } from "../POM/Hooks/before-each";
import { AFTEREACH } from "../POM/Hooks/after-each";
import { Redirect } from "../POM/redirect";

let redirect: Redirect; // Declare a variable to hold the Redirect page object

// Hook to run before each test
test.beforeEach(async ({ page }, testInfo) => {
  await BEFOREACH(page, testInfo); // Perform setup actions
  await page.goto("/apps/redirect/"); // Navigate to the redirect app
  redirect = new Redirect(page); // Initialize the Redirect page object
});

// Hook to run after each test
test.afterEach(async ({ page }, testInfo) => {
  await AFTEREACH(page, testInfo); // Perform cleanup actions
});

// Test to verify the redirection chain
test("Redirection", async () => {
  await redirect.startRedirectionChain(); // Start the redirection process
  await redirect.verifyFinalState(); // Verify the final state of the redirection
});

// Test to verify the "Go Back" button functionality
test("Go Back button", async () => {
  await redirect.startRedirectionChain(); // Start the redirection process
  await redirect.verifyFinalState(); // Verify the final state of the redirection
  await redirect.backButton.click(); // Click the "Go Back" button
  await expect(redirect.redirectButton).toBeVisible(); // Verify the redirect button is visible again
});