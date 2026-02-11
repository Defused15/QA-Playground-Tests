import { Locator, Page } from "@playwright/test";

// Class representing the API card component
export class API {

    readonly card: Locator; // Locator for the card container
    readonly title: Locator; // Locator for the card title
    readonly body: Locator; // Locator for the card body

    constructor(page: Page) {
       this.card = page.locator(".icard"); // Initialize the card locator
       this.title = this.card.locator(".header"); // Initialize the title locator within the card
       this.body = this.card.locator("[data-body]"); // Initialize the body locator within the card
    }
}