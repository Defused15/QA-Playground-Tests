// Screenshots for visual review: desktop and mobile, light and dark, the page
// itself and the test drawer. Set REPORT_SHOTS_DIR to choose the folder.
import { test, expect } from '@playwright/test';

const OUT = process.env.REPORT_SHOTS_DIR || 'test-results/report-shots';
const FAILING = 'Selects an option with the keyboard';

for (const scheme of ['light', 'dark']) {
  test(`screenshots (${scheme})`, async ({ page }, info) => {
    test.skip(
      info.project.name === 'desktop-webkit',
      'Chromium covers the visual review'
    );
    const errors = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
    const tag = info.project.name + '-' + scheme;
    const shot = (name, opts = {}) =>
      page.screenshot({ path: `${OUT}/${tag}-${name}.png`, ...opts });

    await page.goto('/mixed/');
    await expect(page.locator('#lead')).toContainText('tests passed');
    await page.evaluate(() => document.fonts.ready);
    await shot('top');
    await shot('full', { fullPage: true });

    await page.locator('#table tr.fail .t-open', { hasText: FAILING }).click();
    await expect(page.locator('.drawer-root')).toHaveClass(/open/);
    await shot('drawer-steps');
    await page.getByRole('tab', { name: 'Error' }).click();
    await shot('drawer-error');
    await page.getByRole('tab', { name: /Attachments/ }).click();
    await page
      .locator('.thumb img')
      .first()
      .evaluate((img) => img.decode());
    await shot('drawer-attachments');
    await page.getByRole('tab', { name: /Retries/ }).click();
    await shot('drawer-retries');
    await page.getByRole('tab', { name: /Attachments/ }).click();
    await page.locator('.thumb').first().click();
    await expect(page.locator('.lightbox')).toHaveClass(/open/);
    await shot('lightbox');

    await page.goto('/passing/');
    await expect(page.locator('#lead')).toContainText('All');
    await shot('passing-top');

    expect(errors).toEqual([]);
  });
}
