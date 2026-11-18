import { Page, Locator, Download as PwDownload } from '@playwright/test';

export const SAMPLE_PDF = {
  fileName: 'sample.pdf',
  path: '/apps/download/sample.pdf',
  sizeInBytes: 1042157,
};

export class Download {
  readonly page: Page;
  readonly infoText: Locator;
  readonly downloadButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.infoText = page.getByText('Click to download PDF file');
    this.downloadButton = page.getByRole('link', { name: 'Download' });
  }

  async downloadFile(): Promise<PwDownload> {
    const downloadPromise = this.page.waitForEvent('download');
    await this.downloadButton.click();
    return downloadPromise;
  }

  async downloadFileWithKeyboard(): Promise<PwDownload> {
    const downloadPromise = this.page.waitForEvent('download');
    await this.downloadButton.focus();
    await this.page.keyboard.press('Enter');
    return downloadPromise;
  }
}
