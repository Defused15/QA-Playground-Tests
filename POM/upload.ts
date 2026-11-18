import { Page, Locator } from '@playwright/test';

export type InMemoryFile = { name: string; mimeType: string; buffer: Buffer };

export class Upload {
  readonly page: Page;
  readonly fileInput: Locator;
  readonly selectButton: Locator;
  readonly selectedCount: Locator;
  readonly previews: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fileInput = page.getByLabel('Select Image File');
    this.selectButton = page.getByText('Select Image File');
    // Counter paragraph has no role or label to target
    this.selectedCount = page.locator('#num-of-files');
    this.previews = page.getByRole('figure');
  }

  preview(fileName: string): Locator {
    return this.page.getByRole('figure', { name: fileName });
  }

  previewImage(fileName: string): Locator {
    return this.preview(fileName).getByRole('img');
  }

  async uploadFiles(files: string | string[] | InMemoryFile | InMemoryFile[]) {
    await this.fileInput.setInputFiles(files);
  }

  async clearFiles() {
    await this.fileInput.setInputFiles([]);
  }

  async uploadViaFileChooser(files: string | string[]) {
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.selectButton.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(files);
  }
}
