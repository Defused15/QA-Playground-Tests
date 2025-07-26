import { Locator, Page } from "@playwright/test";

export class API {

    readonly card: Locator;
    readonly title: Locator;
    readonly body: Locator;

    constructor(page: Page) {
       this.card = page.locator(".icard");
       this.title= this.card.locator(".header");
       this.body = this.card.locator("[data-body]");
    }
}