import { Page, TestInfo } from '@playwright/test';

export const testSetup = async (page: Page, testInfo: TestInfo) => {
  console.log(`Running test: ${testInfo.title}`);
};
