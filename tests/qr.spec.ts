import { expect, test } from "@playwright/test";
import { BEFOREACH } from "../POM/Hooks/before-each";
import { AFTEREACH } from "../POM/Hooks/after-each";
import { QR } from "../POM/qr";
let qr: QR;

test.beforeEach(async ({ page }, testInfo) => {
  await BEFOREACH(page, testInfo); // Custom before-each logic
  await page.goto("/apps/qr-code-generator/");
  qr = new QR(page);
});

test.afterEach(async ({ page }, testInfo) => {
  await AFTEREACH(page, testInfo); // Custom after-each logic
});

test.describe("QR Code Generator Tests", () => {
  test("Generate QR Code", async ({ page }) => {
    await qr.inputField.fill("https://google.com");
    await qr.generateButton.click();
    await expect(qr.qrImage).toBeVisible();
    await expect(qr.qrImage).toHaveScreenshot("qr/qr-code.png");
  });
});
