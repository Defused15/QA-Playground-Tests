import { expect, test } from '@playwright/test';
import { testSetup } from '../POM/Hooks/before-each';
import { testTeardown } from '../POM/Hooks/after-each';
import { QR } from '../POM/qr';

let qr: QR;

const QR_TEXT = 'https://google.com';

test.describe('QR Code Generator', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await testSetup(page, testInfo);
    await page.goto('/apps/qr-code-generator/');
    qr = new QR(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await testTeardown(page, testInfo);
  });

  test('Generate QR Code', { tag: '@visual' }, async () => {
    await test.step('Enter a URL and generate', async () => {
      await qr.generate(QR_TEXT);
    });

    await test.step('QR image is rendered and loaded', async () => {
      await expect(qr.qrImage).toBeVisible();
      // The QR bitmap comes from api.qrserver.com; the <img> is visible (alt-text box)
      // before the bitmap arrives, so wait until the 200x200 image has actually decoded.
      await expect(qr.qrImage).toHaveJSProperty('naturalWidth', 200);
    });

    await test.step('QR code encodes the entered URL', async () => {
      expect(await qr.decodeRenderedCode()).toBe(QR_TEXT);
    });

    // Pixel comparison runs only inside the Playwright container
    // (CI and `npm run test:visual`); see ignoreSnapshots in the config.
    await test.step('QR image matches the baseline', async () => {
      await expect(qr.qrImage).toHaveScreenshot('qr/qr-code.png');
    });
  });

  // App has no input validation — empty string generates a QR
  test('Generate QR Code with empty input', async () => {
    await test.step('Generate with an empty input', async () => {
      await qr.generateButton.click();
    });

    await test.step('A QR image is still rendered', async () => {
      await expect(qr.qrImage).toBeVisible();
    });
  });
});
