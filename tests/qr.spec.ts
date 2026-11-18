import { expect, test } from '@playwright/test';
import { testSetup } from '../POM/Hooks/before-each';
import { testTeardown } from '../POM/Hooks/after-each';
import { QR } from '../POM/qr';

let qr: QR;

test.describe('QR Code Generator', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await testSetup(page, testInfo);
    await page.goto('/apps/qr-code-generator/');
    qr = new QR(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await testTeardown(page, testInfo);
  });

  test('Generate QR Code', async () => {
    await qr.inputField.fill('https://google.com');
    await qr.generateButton.click();
    await expect(qr.qrImage).toBeVisible();
    // The QR bitmap comes from api.qrserver.com; the <img> is visible (alt-text box)
    // before the bitmap arrives, so wait until the 200x200 image has actually decoded.
    await expect(qr.qrImage).toHaveJSProperty('naturalWidth', 200);
    await expect(qr.qrImage).toHaveScreenshot('qr/qr-code.png');
  });

  // App has no input validation — empty string generates a QR
  test('Generate QR Code with empty input', async () => {
    await qr.generateButton.click();
    await expect(qr.qrImage).toBeVisible();
  });
});
