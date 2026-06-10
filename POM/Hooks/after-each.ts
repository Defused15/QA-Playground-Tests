import { Page, TestInfo } from '@playwright/test';

export const testTeardown = async (page: Page, testInfo: TestInfo) => {
  const fullTitle = testInfo.titlePath.join(' > ');
  const browser = testInfo.project.name;

  if (testInfo.status !== testInfo.expectedStatus) {
    console.log(`Did not run as expected, ended up at ${page.url()}`);
  }

  console.log(
    `Finished ${fullTitle} on ${browser} with status: ${testInfo.status}`
  );
};
