import { Page, Locator } from '@playwright/test';

export class QR {
  readonly inputField: Locator;
  readonly generateButton: Locator;
  readonly qrImage: Locator;

  constructor(page: Page) {
    this.inputField = page.getByRole('textbox', { name: 'Enter text or URL' });
    this.generateButton = page.getByRole('button', {
      name: 'Generate QR Code',
    });
    this.qrImage = page.getByRole('img', { name: 'qr-code' });
  }
}
