import { Page, TestInfo } from '@playwright/test';

export const BEFOREACH = async (page: Page, testInfo: TestInfo) => {
    //Await for the page to load
    await page.waitForLoadState('networkidle');
    //TestInfo log
    console.log(`Running test: ${testInfo.title}`);

}