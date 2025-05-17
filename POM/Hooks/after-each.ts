import { Page, TestInfo } from '@playwright/test';
import test from 'node:test';

export const AFTEREACH = async (page:Page, testinfo:TestInfo) => {
    //Close the page
    await page.close();
    //TestInfo log
    console.log(`Finished ${testinfo.title} with status: ${testinfo.status}`);
    if (testinfo.status !== testinfo.expectedStatus) {
        console.log (`Did not run as expected, endend up at ${page.url()}`);
    }
}