import { expect, test } from '@playwright/test';
import path from 'path';
import { testSetup } from '../POM/Hooks/before-each';
import { testTeardown } from '../POM/Hooks/after-each';
import { Upload } from '../POM/upload';

const FIXTURES = path.join(__dirname, 'fixtures', 'upload');
const PNG_FILE = path.join(FIXTURES, 'photo.png');
const JPG_FILE = path.join(FIXTURES, 'photo.jpg');
const TXT_FILE = path.join(FIXTURES, 'notes.txt');

let upload: Upload;

test.describe('File Upload', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await testSetup(page, testInfo);
    await page.goto('/apps/upload/');
    upload = new Upload(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await testTeardown(page, testInfo);
  });

  test.describe('Happy path', () => {
    test('Initial state shows no file selected', async ({ page }) => {
      await test.step('Verify page title and select button', async () => {
        await expect(page).toHaveTitle('Test File Upload');
        await expect(upload.selectButton).toBeVisible();
      });

      await test.step('Verify empty state', async () => {
        await expect(upload.selectedCount).toHaveText('No File Selected');
        await expect(upload.previews).toHaveCount(0);
      });
    });

    test('File input accepts multiple PNG and JPEG images', async () => {
      await test.step('Verify input attributes', async () => {
        await expect(upload.fileInput).toHaveAttribute(
          'accept',
          'image/png, image/jpeg'
        );
        await expect(upload.fileInput).toHaveAttribute('multiple', '');
      });
    });

    test('Upload a single PNG image shows its preview', async () => {
      await test.step('Upload PNG fixture', async () => {
        await upload.uploadFiles(PNG_FILE);
      });

      await test.step('Verify counter and caption', async () => {
        await expect(upload.selectedCount).toHaveText('1 File Selected');
        await expect(upload.previews).toHaveCount(1);
        await expect(upload.preview('photo.png')).toBeVisible();
      });

      await test.step('Verify the preview image decoded', async () => {
        const image = upload.previewImage('photo.png');
        await expect(image).toHaveAttribute('src', /^data:image\/png;base64,/);
        await expect(image).toHaveJSProperty('naturalWidth', 24);
        await expect(image).toHaveJSProperty('naturalHeight', 16);
      });
    });

    test('Upload a single JPEG image shows its preview', async () => {
      await test.step('Upload JPEG fixture', async () => {
        await upload.uploadFiles(JPG_FILE);
      });

      await test.step('Verify counter and preview', async () => {
        await expect(upload.selectedCount).toHaveText('1 File Selected');
        const image = upload.previewImage('photo.jpg');
        await expect(image).toHaveAttribute('src', /^data:image\/jpeg;base64,/);
        await expect(image).toHaveJSProperty('naturalWidth', 24);
      });
    });

    test('Upload multiple images shows a preview for each', async () => {
      await test.step('Upload PNG and JPEG together', async () => {
        await upload.uploadFiles([PNG_FILE, JPG_FILE]);
      });

      await test.step('Verify plural counter and captions in order', async () => {
        await expect(upload.selectedCount).toHaveText('2 Files Selected');
        await expect(upload.previews).toHaveCount(2);
        await expect(upload.previews.locator('figcaption')).toHaveText([
          'photo.png',
          'photo.jpg',
        ]);
      });
    });

    test('Upload through the native file chooser', async () => {
      await test.step('Click Select Image File and pick a file', async () => {
        await upload.uploadViaFileChooser(PNG_FILE);
      });

      await test.step('Verify the preview is shown', async () => {
        await expect(upload.selectedCount).toHaveText('1 File Selected');
        await expect(upload.preview('photo.png')).toBeVisible();
      });
    });
  });

  test.describe('Edge cases', () => {
    test('New selection replaces the previous previews', async () => {
      await test.step('Upload two images', async () => {
        await upload.uploadFiles([PNG_FILE, JPG_FILE]);
        await expect(upload.previews).toHaveCount(2);
      });

      await test.step('Upload a single different image', async () => {
        await upload.uploadFiles(JPG_FILE);
      });

      await test.step('Verify only the latest selection is shown', async () => {
        await expect(upload.selectedCount).toHaveText('1 File Selected');
        await expect(upload.previews).toHaveCount(1);
        await expect(upload.preview('photo.jpg')).toBeVisible();
        await expect(upload.preview('photo.png')).toHaveCount(0);
      });
    });

    test('Clearing the selection removes all previews', async () => {
      await test.step('Upload an image', async () => {
        await upload.uploadFiles(PNG_FILE);
        await expect(upload.previews).toHaveCount(1);
      });

      await test.step('Clear the file input', async () => {
        await upload.clearFiles();
      });

      // Counter switches to "0 Files Selected" rather than the initial text
      await test.step('Verify previews are gone', async () => {
        await expect(upload.selectedCount).toHaveText('0 Files Selected');
        await expect(upload.previews).toHaveCount(0);
      });
    });

    test('Upload many images at once', async () => {
      const files = Array.from({ length: 10 }, (_, i) => ({
        name: `image-${i + 1}.png`,
        mimeType: 'image/png',
        buffer: Buffer.from('fake-png-content'),
      }));

      await test.step('Upload ten in-memory images', async () => {
        await upload.uploadFiles(files);
      });

      await test.step('Verify ten previews with matching captions', async () => {
        await expect(upload.selectedCount).toHaveText('10 Files Selected');
        await expect(upload.previews).toHaveCount(10);
        await expect(upload.previews.locator('figcaption')).toHaveText(
          files.map((file) => file.name)
        );
      });
    });

    test('Upload a large file', async () => {
      const largeFile = {
        name: 'large.png',
        mimeType: 'image/png',
        buffer: Buffer.alloc(5 * 1024 * 1024, 1),
      };

      await test.step('Upload a 5 MB file', async () => {
        await upload.uploadFiles(largeFile);
      });

      await test.step('Verify it is listed with a data URL preview', async () => {
        await expect(upload.selectedCount).toHaveText('1 File Selected');
        await expect(upload.previewImage('large.png')).toHaveAttribute(
          'src',
          /^data:image\/png;base64,AQEB/
        );
      });
    });

    test('Upload an empty image file', async () => {
      await test.step('Upload a zero-byte PNG', async () => {
        await upload.uploadFiles({
          name: 'empty.png',
          mimeType: 'image/png',
          buffer: Buffer.alloc(0),
        });
      });

      await test.step('Verify it is listed with an empty data URL', async () => {
        await expect(upload.selectedCount).toHaveText('1 File Selected');
        const image = upload.previewImage('empty.png');
        await expect(image).toHaveAttribute('src', 'data:image/png;base64,');
        // complete=true with naturalWidth=0 means the browser gave up decoding
        await expect(image).toHaveJSProperty('complete', true);
        await expect(image).toHaveJSProperty('naturalWidth', 0);
      });
    });

    test('File names with spaces and unicode are shown as-is', async () => {
      const name = 'my holiday photo – été.png';

      await test.step('Upload file with a special name', async () => {
        await upload.uploadFiles({
          name,
          mimeType: 'image/png',
          buffer: Buffer.from('fake-png-content'),
        });
      });

      await test.step('Verify the caption matches the file name', async () => {
        await expect(upload.previews.locator('figcaption')).toHaveText(name);
      });
    });
  });

  test.describe('Negative cases', () => {
    // The accept attribute only filters the OS picker; the app does no validation
    test('Unsupported file type is still accepted with a broken preview', async () => {
      await test.step('Upload a text file', async () => {
        await upload.uploadFiles(TXT_FILE);
      });

      await test.step('Verify it is listed but does not render', async () => {
        await expect(upload.selectedCount).toHaveText('1 File Selected');
        const image = upload.previewImage('notes.txt');
        await expect(image).toHaveAttribute('src', /^data:text\/plain;base64,/);
        // complete=true with naturalWidth=0 means the browser gave up decoding
        await expect(image).toHaveJSProperty('complete', true);
        await expect(image).toHaveJSProperty('naturalWidth', 0);
      });
    });

    test('Image extension with non-image content does not render', async () => {
      await test.step('Upload a PNG named file with text content', async () => {
        await upload.uploadFiles({
          name: 'fake.png',
          mimeType: 'image/png',
          buffer: Buffer.from('this is not an image'),
        });
      });

      await test.step('Verify the preview image fails to decode', async () => {
        await expect(upload.selectedCount).toHaveText('1 File Selected');
        const image = upload.previewImage('fake.png');
        await expect(image).toHaveAttribute('src', /^data:image\/png;base64,/);
        // complete=true with naturalWidth=0 means the browser gave up decoding
        await expect(image).toHaveJSProperty('complete', true);
        await expect(image).toHaveJSProperty('naturalWidth', 0);
      });
    });

    test('Native file input is hidden behind the styled label', async () => {
      await test.step('Verify input is hidden and label is visible', async () => {
        await expect(upload.fileInput).toBeHidden();
        await expect(upload.selectButton).toBeVisible();
      });
    });
  });
});
