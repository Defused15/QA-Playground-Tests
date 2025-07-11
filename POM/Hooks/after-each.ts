import { Page, TestInfo } from "@playwright/test";
import test from "node:test";

// AFTEREACH hook to be run after each test
export const AFTEREACH = async (page: Page, testinfo: TestInfo) => {
  // Close the page after the test is done
  await page.close();
  // Log the test title and its status
  const FULLTITLE = testinfo.titlePath.join(" > ");
  const BROWSER = testinfo.project.name;
  console.log(`Finished ${FULLTITLE} on ${BROWSER} with status: ${testinfo.status}`);
  // If the test did not end with the expected status, log the current page URL
  if (testinfo.status !== testinfo.expectedStatus) {
    console.log(`Did not run as expected, ended up at ${page.url()}`);
  }
};
