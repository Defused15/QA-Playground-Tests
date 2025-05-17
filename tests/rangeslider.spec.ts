import {expect, test} from '@playwright/test';
import {BEFOREACH} from '../POM/Hooks/before-each';
import {AFTEREACH} from '../POM/Hooks/after-each';
import {RangeSlider} from '../POM/rangeslider';
let slider: RangeSlider;


test.beforeEach(async ({page},testInfo) => {
    await BEFOREACH(page, testInfo);
    //Navigate to the page
    await page.goto('/apps/range-slider/');
    slider = new RangeSlider(page);
});
test.afterEach(async ({page},testInfo) => {
    await AFTEREACH(page, testInfo);
});

test.describe('Range 1',() =>{  
    test('Range bar minimum value', async ({page}) =>{
        await slider.rangebar.fill('0');
        await expect(slider.rangebar).toHaveValue('0');   
        await expect(slider.emojis[0]).toBeVisible();
        await expect(slider.emojis[1]).toBeHidden();
        await expect(slider.emojis[2]).toBeHidden();
        await expect(slider.emojis[3]).toBeHidden();
        await expect(slider.emojis[4]).toBeHidden();
    });
})