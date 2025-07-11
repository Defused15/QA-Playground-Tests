import { Page, Locator } from "@playwright/test";

export class QR {
    // Locator for the Input field for the QR code
    readonly inputField: Locator;
    // Locator for the Generate QR Code button
    readonly generateButton: Locator;
    // Locator for the QR code image
    readonly qrImage: Locator;

constructor(page: Page) {
this.inputField = page.getByRole("textbox", { name: "Enter text or URL" });
this.generateButton = page.getByRole("button", { name: "Generate QR Code" });
this.qrImage = page.getByRole("img", {name: "qr-code"});
}
}