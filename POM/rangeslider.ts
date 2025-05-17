import { Page,Locator } from "@playwright/test";

export class RangeSlider {
    readonly rangebar: Locator;
    readonly emojis: Locator[];
    

    constructor(page: Page) {
        this.rangebar = page.locator('input[type="range"]');
        this.emojis = [
            page.locator('li.slide-emoji').nth(0),
            page.locator('li.slide-emoji').nth(1),
            page.locator('li.slide-emoji').nth(2),
            page.locator('li.slide-emoji').nth(3),
            page.locator('li.slide-emoji').nth(4)
        ];
        
    }
}