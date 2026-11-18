import { expect, test } from '@playwright/test';
import { readFile, stat } from 'fs/promises';
import { testSetup } from '../POM/Hooks/before-each';
import { testTeardown } from '../POM/Hooks/after-each';
import { Download, SAMPLE_PDF } from '../POM/download';

let download: Download;

test.describe('File Download', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await testSetup(page, testInfo);
    await page.goto('/apps/download/');
    download = new Download(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await testTeardown(page, testInfo);
  });

  test.describe('Happy path', () => {
    test('Page shows the download prompt and button', async ({ page }) => {
      await test.step('Verify page title', async () => {
        await expect(page).toHaveTitle('Test File Download');
      });

      await test.step('Verify prompt text and download button', async () => {
        await expect(download.infoText).toBeVisible();
        await expect(download.downloadButton).toBeVisible();
        await expect(download.downloadButton).toHaveText('Download ⏬');
      });
    });

    test('Download link points to the sample PDF', async () => {
      await test.step('Verify href and download attribute', async () => {
        await expect(download.downloadButton).toHaveAttribute(
          'href',
          'sample.pdf'
        );
        await expect(download.downloadButton).toHaveAttribute(
          'download',
          'sample'
        );
      });
    });

    test('Clicking Download saves sample.pdf', async ({ page }, testInfo) => {
      const file = await test.step('Click Download', async () => {
        return download.downloadFile();
      });

      await test.step('Verify suggested filename and source URL', async () => {
        expect(file.suggestedFilename()).toBe(SAMPLE_PDF.fileName);
        expect(file.url()).toBe(new URL(SAMPLE_PDF.path, page.url()).href);
        expect(await file.failure()).toBeNull();
      });

      await test.step('Save file and verify size and PDF header', async () => {
        const savePath = testInfo.outputPath(file.suggestedFilename());
        await file.saveAs(savePath);
        const { size } = await stat(savePath);
        expect(size).toBe(SAMPLE_PDF.sizeInBytes);
        const content = await readFile(savePath);
        expect(content.subarray(0, 5).toString('ascii')).toBe('%PDF-');
      });
    });

    test('Downloading keeps the user on the same page', async ({ page }) => {
      const startUrl = page.url();

      await test.step('Download the file', async () => {
        await download.downloadFile();
      });

      await test.step('Verify page did not navigate away', async () => {
        await expect(page).toHaveURL(startUrl);
        await expect(download.downloadButton).toBeVisible();
      });
    });
  });

  test.describe('Edge cases', () => {
    test('Download works using the keyboard only', async () => {
      const file = await test.step('Focus link and press Enter', async () => {
        return download.downloadFileWithKeyboard();
      });

      await test.step('Verify downloaded filename', async () => {
        expect(file.suggestedFilename()).toBe(SAMPLE_PDF.fileName);
        expect(await file.failure()).toBeNull();
      });
    });

    test('Repeated downloads each produce an identical file', async ({}, testInfo) => {
      const first = await test.step('Download the file once', async () => {
        return download.downloadFile();
      });

      const second = await test.step('Download the file again', async () => {
        return download.downloadFile();
      });

      await test.step('Verify both files are identical', async () => {
        const firstPath = testInfo.outputPath(
          'first',
          first.suggestedFilename()
        );
        const secondPath = testInfo.outputPath(
          'second',
          second.suggestedFilename()
        );
        await first.saveAs(firstPath);
        await second.saveAs(secondPath);
        expect(second.suggestedFilename()).toBe(first.suggestedFilename());
        expect(await readFile(secondPath)).toEqual(await readFile(firstPath));
      });
    });

    test('Rapid double click triggers two downloads', async ({ page }) => {
      const downloads: string[] = [];
      page.on('download', (file) => downloads.push(file.suggestedFilename()));

      await test.step('Double click the Download link', async () => {
        await download.downloadButton.dblclick();
      });

      await test.step('Verify two downloads were started', async () => {
        await expect
          .poll(() => downloads)
          .toEqual([SAMPLE_PDF.fileName, SAMPLE_PDF.fileName]);
      });
    });

    test('Download works on a mobile-sized viewport', async ({ page }) => {
      await test.step('Resize viewport to mobile width', async () => {
        await page.setViewportSize({ width: 375, height: 667 });
        await expect(download.downloadButton).toBeInViewport();
      });

      const file = await test.step('Click Download', async () => {
        return download.downloadFile();
      });

      await test.step('Verify downloaded filename', async () => {
        expect(file.suggestedFilename()).toBe(SAMPLE_PDF.fileName);
      });
    });
  });

  test.describe('Negative cases', () => {
    test('Clicking the prompt text does not start a download', async ({
      page,
    }) => {
      const downloads: string[] = [];
      page.on('download', (file) => downloads.push(file.suggestedFilename()));

      await test.step('Click the info text next to the button', async () => {
        await download.infoText.click();
      });

      await test.step('Click Download as a control action', async () => {
        await download.downloadFile();
      });

      await test.step('Verify only the button click downloaded a file', async () => {
        expect(downloads).toEqual([SAMPLE_PDF.fileName]);
      });
    });
  });
});
