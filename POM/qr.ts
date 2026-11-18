import { Page, Locator } from '@playwright/test';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';

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

  async generate(text: string) {
    await this.inputField.fill(text);
    await this.generateButton.click();
  }

  /**
   * Decodes the QR code as it is rendered on the page. The capture uses CSS
   * pixels (WebKit's 2x upscale blurs the modules) and finishes the 0.5s
   * opacity fade-in first, as a half-faded code can't be read.
   */
  async decodeRenderedCode(): Promise<string | null> {
    const png = PNG.sync.read(
      await this.qrImage.screenshot({
        scale: 'css',
        animations: 'disabled',
      })
    );
    const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    return code?.data ?? null;
  }
}
