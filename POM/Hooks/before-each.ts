import { Page, TestInfo } from "@playwright/test";

// BEFOREACH hook to be run before each test
export const BEFOREACH = async (page: Page, testInfo: TestInfo) => {
  // Await for the page to load completely (network idle)
  await page.waitForLoadState("networkidle");
  // Log the title of the test that is about to run
  console.log(`Running test: ${testInfo.title}`);
};
