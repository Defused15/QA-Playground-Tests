// Usability, accessibility and safety checks for the E2E report page.
// Uses real mouse, keyboard and touch input (no synthetic dispatchEvent).
import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOSTILE_TITLE, DOLLAR_TITLE, HOSTILE_ERROR } from './fixtures.mjs';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..', '.site');
const PAGES_BASE = 'https://defused15.github.io/QA-Playground-Tests/';
const FAILING = 'Selects an option with the keyboard';

const isMobile = (info) => info.project.name === 'mobile';
const isWebkit = (info) => info.project.name === 'desktop-webkit';

// Every page must load without console errors or uncaught exceptions.
let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
});
test.afterEach(() => {
  expect(errors, 'console errors').toEqual([]);
});

async function open(page, path = '/mixed/') {
  await page.goto(path);
  await expect(page.locator('#lead')).not.toHaveText('Loading results');
  await page.evaluate(() => document.fonts.ready);
}

const rows = (page) => page.locator('#table tbody tr[data-i]');
const failingRow = (page) =>
  page.locator('#table tr.fail .t-open', { hasText: FAILING });
const drawerOpen = (page) =>
  expect(page.locator('.drawer-root')).toHaveClass(/\bopen\b/);
const drawerClosed = (page) =>
  expect(page.locator('.drawer-root')).not.toHaveClass(/\bopen\b/);
const inDrawer = (page) =>
  page.evaluate(() => !!document.activeElement.closest('.drawer'));
const search = (page) => page.getByRole('searchbox', { name: 'Search tests' });

// ── Content ───────────────────────────────────────────────────────────────────

test('hero, summary and needs attention describe the run', async ({ page }) => {
  await open(page);
  await expect(page.locator('#lead')).toHaveText('67 of 72 tests passed.');
  await expect(page.locator('#lead-sub')).toHaveText(
    'Failing: Selects an option with the keyboard (webkit) and Uploads a single file (firefox).'
  );
  await expect(page.locator('#meta')).toContainText('2 days ago');
  await expect(page.locator('#meta')).toContainText('4 min 12 s');
  await expect(page.locator('#meta')).toContainText(
    'chromium, firefox and webkit'
  );
  await expect(page.locator('.stat .lbl')).toHaveText([
    'Passed',
    'Failed',
    'Flaky',
    'Skipped',
    'Duration',
  ]);
  await expect(page.locator('.runners .r-name')).toHaveText([
    'chromium',
    'firefox',
    'webkit',
  ]);
  // Failures first, then flaky, each with browser and first error line.
  const attn = page.locator('#attn-list .attn-row');
  await expect(attn).toHaveCount(3);
  await expect(attn.nth(0)).toContainText('webkit');
  await expect(attn.nth(0).locator('.attn-msg')).toHaveText(
    'Error: expect(locator).toHaveText(expected) failed'
  );
  await expect(attn.nth(1)).toContainText('Test timeout of 30000ms exceeded.');
  await expect(attn.nth(2)).toContainText('Flaky');
  // ANSI escape codes never reach the page.
  expect(await page.content()).not.toContain('[31m');

  await expect(
    page.getByRole('link', { name: /Overview and history on QA Hub/ })
  ).toHaveAttribute(
    'href',
    'https://qa.rcastillo.dev/projects/QA-Playground-Tests.html'
  );
  await expect(page.getByRole('link', { name: /Source code/ })).toHaveAttribute(
    'href',
    'https://github.com/Defused15/QA-Playground-Tests'
  );
  const raw = page.getByRole('link', { name: 'Raw Playwright report' });
  await expect(raw).toHaveAttribute('href', 'playwright/');
  const res = await page.request.get('/mixed/playwright/');
  expect(res.ok()).toBe(true);
  expect(
    (await page.request.get('/mixed/playwright/report.json')).status()
  ).toBe(404);
});

test('a passing run hides needs attention', async ({ page }) => {
  await open(page, '/passing/');
  await expect(page.locator('#lead')).toHaveText('All 72 tests passed.');
  await expect(page.locator('#attention')).toBeHidden();
  await expect(
    page.getByRole('link', { name: 'Raw Playwright report' })
  ).toHaveCount(0);
});

test('a real local run renders without errors', async ({ page }, info) => {
  test.skip(
    !existsSync(join(SITE, 'real', 'index.html')),
    'no local playwright-report/report.json'
  );
  test.skip(isMobile(info), 'one smoke check is enough');
  await open(page, '/real/');
  await expect(page.locator('#lead')).toHaveText(/tests passed\.$/);
  expect(await rows(page).count()).toBeGreaterThan(0);
  await page.locator('#table .t-open').first().click();
  await drawerOpen(page);
});

// ── Safety ────────────────────────────────────────────────────────────────────

test('hostile titles render as text and never execute', async ({ page }) => {
  let dialogs = 0;
  page.on('dialog', (d) => {
    dialogs++;
    d.dismiss();
  });
  await open(page, '/hostile/');
  await page.waitForTimeout(200);

  // Only the (empty) lightbox image exists; nothing was injected.
  expect(await page.locator('.page img, img[src="x"]').count()).toBe(0);
  expect(await page.locator('script').count()).toBe(3); // theme, data, client

  await search(page).fill('</script>');
  const row = page.locator('.t-open', { hasText: '</script><img' });
  await expect(row).toHaveCount(3);
  expect(await row.first().textContent()).toBe(HOSTILE_TITLE);
  await row.first().click();
  await drawerOpen(page);
  expect(await page.locator('#dr-title').textContent()).toBe(HOSTILE_TITLE);
  await page.keyboard.press('Escape');

  await search(page).fill('$&');
  const dollar = page.locator('.t-open', { hasText: DOLLAR_TITLE });
  await expect(dollar).toHaveCount(3);
  expect(await dollar.first().textContent()).toBe(DOLLAR_TITLE);

  // Error message and attachment names with markup stay literal.
  await search(page).fill('');
  await failingRow(page).click();
  await drawerOpen(page);
  await page.getByRole('tab', { name: 'Error' }).click();
  await expect(page.locator('.drawer .err').first()).toContainText(
    HOSTILE_ERROR
  );
  await page.getByRole('tab', { name: /Attachments/ }).click();
  await expect(
    page.locator('.thumb', { hasText: '<img src=x onerror=alert(3)>' })
  ).toHaveCount(1);
  expect(await page.locator('.page img, img[src="x"]').count()).toBe(0);
  expect(dialogs).toBe(0);
});

// ── Drawer content ────────────────────────────────────────────────────────────

test('drawer shows steps, error, attachments and retries', async ({ page }) => {
  await open(page);
  await failingRow(page).click();
  await drawerOpen(page);
  await expect(page.locator('#dr-file')).toHaveText(
    'tests/dropdown.spec.ts:34'
  );
  await expect(page.locator('#dr-suite')).toHaveText('Dropdown');

  // Steps: one failing step with its error.
  await expect(page.locator('.drawer .step')).toHaveCount(3);
  await expect(page.locator('.drawer .step.fail .step-title')).toContainText(
    'Press ArrowDown twice and Enter'
  );
  await expect(page.locator('.drawer .step.fail .err')).toContainText(
    'Received: "Apple"'
  );

  // Error: message, source snippet, collapsible stack.
  await page.getByRole('tab', { name: 'Error' }).click();
  await expect(page.locator('.drawer .err')).toContainText(
    'Expected: "Banana"'
  );
  await expect(page.locator('.drawer .code')).toContainText(
    "toHaveText('Banana')"
  );
  const stack = page.locator('.drawer details.stack');
  await expect(stack.locator('pre')).toBeHidden();
  await stack.locator('summary').click();
  await expect(stack.locator('pre')).toContainText('dropdown.spec.ts:42:35');

  // Attachments: thumbnails with a lightbox, video, trace viewer link.
  await page.getByRole('tab', { name: /Attachments/ }).click();
  await expect(page.locator('.drawer .thumb')).toHaveCount(3);
  await expect(page.locator('.drawer video')).toHaveCount(3);
  const trace = page.getByRole('link', { name: /Open in Trace Viewer/ });
  await expect(trace).toHaveCount(1);
  const href = await trace.getAttribute('href');
  expect(href.startsWith('https://trace.playwright.dev/?trace=')).toBe(true);
  const traceUrl = decodeURIComponent(href.split('?trace=')[1]);
  expect(traceUrl).toMatch(
    new RegExp(
      '^' +
        PAGES_BASE.replace(/[.]/g, '\\.') +
        'attachments/[0-9a-f]{12}-r1/trace\\.zip$'
    )
  );
  // The local copy of every attachment is served.
  for (const src of await page
    .locator('.drawer .thumb img, .drawer video')
    .evaluateAll((els) => els.map((e) => e.getAttribute('src')))) {
    expect((await page.request.get('/mixed/' + src)).ok(), src).toBe(true);
  }
  const relTrace = traceUrl.slice(PAGES_BASE.length);
  expect((await page.request.get('/mixed/' + relTrace)).ok()).toBe(true);

  const thumb = page.locator('.drawer .thumb').first();
  await thumb.click();
  await expect(page.locator('.lightbox')).toHaveClass(/open/);
  await expect(page.locator('#lb-close')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.lightbox')).not.toHaveClass(/open/);
  await drawerOpen(page); // Esc closed only the lightbox
  await expect(thumb).toBeFocused();

  // Retries: one entry per attempt.
  await page.getByRole('tab', { name: /Retries/ }).click();
  await expect(page.locator('.drawer .attempts li')).toHaveCount(3);
  await expect(page.locator('.drawer .attempts .a-name')).toHaveText([
    'First attempt',
    'Retry 1',
    'Retry 2',
  ]);
});

test('error tab only for failing tests; missing files are skipped', async ({
  page,
}) => {
  await open(page);
  // Flaky: no Error tab, both attempts listed.
  await page.locator('#table tr.flaky .t-open').click();
  await drawerOpen(page);
  await expect(page.getByRole('tab', { name: 'Error' })).toHaveCount(0);
  await page.getByRole('tab', { name: /Retries/ }).click();
  await expect(page.locator('.drawer .attempts .chip')).toHaveText([
    'Failed',
    'Passed',
  ]);
  await page.keyboard.press('Escape');

  // Timed out upload: the missing video is left out, the screenshot stays.
  await page
    .locator('#table tr.fail .t-open', { hasText: 'Uploads a single file' })
    .click();
  await page.getByRole('tab', { name: /Attachments/ }).click();
  await expect(page.locator('.drawer .thumb')).toHaveCount(2);
  await expect(page.locator('.drawer video')).toHaveCount(0);
  await page.getByRole('tab', { name: /Retries/ }).click();
  await expect(page.locator('.drawer .attempts .chip').first()).toHaveText(
    'Timed out'
  );
  await page.keyboard.press('Escape');

  // Passing test: no Error tab.
  await page.locator('#table tr.pass .t-open').first().click();
  await expect(page.getByRole('tab')).toHaveText([
    'Steps',
    'Attachments',
    'Retries',
  ]);
});

test('copy spec path confirms with a toast', async ({
  page,
  context,
}, info) => {
  test.skip(
    isMobile(info) || isWebkit(info),
    'clipboard permission is granted on desktop Chromium'
  );
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await open(page);
  await failingRow(page).click();
  await page.getByRole('button', { name: 'Copy spec path' }).click();
  await expect(page.locator('.toast')).toHaveText('Copied spec path');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'tests/dropdown.spec.ts:34'
  );
});

// ── Paging ────────────────────────────────────────────────────────────────────

async function pagerToMiddle(page) {
  // Pager fully on screen, mid-viewport, so the click itself needs no scrolling.
  await page.evaluate(() => {
    const p = document.querySelector('.pager');
    window.scrollTo(
      0,
      p.getBoundingClientRect().top + scrollY - innerHeight / 2
    );
  });
}

test('paging keeps the pager under the cursor and keeps focus', async ({
  page,
}, info) => {
  test.skip(isMobile(info), 'same code path; measured with a mouse');
  await open(page);
  const pager = page.locator('.pager');
  await pagerToMiddle(page);
  const before = await pager.boundingBox();
  const y0 = await page.evaluate(() => scrollY);

  await page.getByRole('button', { name: 'Page 2' }).click();
  await expect(page.locator('.tt-count')).toHaveText('26–50 of 72 tests');
  expect(Math.abs((await pager.boundingBox()).y - before.y)).toBeLessThan(0.5);
  expect(await page.evaluate(() => scrollY)).toBe(y0); // same height: no scrolling at all
  await expect(page.locator('.pager [aria-current="page"]')).toBeFocused();

  // The last page is shorter: the pager still stays put.
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.locator('.tt-count')).toHaveText('51–72 of 72 tests');
  expect(Math.abs((await pager.boundingBox()).y - before.y)).toBeLessThan(0.5);
  expect(
    await page.evaluate(() => !!document.activeElement.closest('.pager'))
  ).toBe(true);

  await page.getByRole('button', { name: 'Page 1' }).click();
  await expect(page.locator('.tt-count')).toHaveText('1–25 of 72 tests');
  expect(Math.abs((await pager.boundingBox()).y - before.y)).toBeLessThan(0.5);
  await expect(page.locator('.pager [aria-current="page"]')).toBeFocused();
});

// ── Filtering ─────────────────────────────────────────────────────────────────

/** Click a filter and sample the control position and table height every frame. */
async function filterAndSample(page, label) {
  // Samples every animation frame for one second, with timestamps. Checks
  // below are time-based, not frame-count based, so a slower machine (fewer
  // frames) measures the same transition.
  await page.evaluate(() => {
    const mount = document.getElementById('table');
    const seg = mount.querySelector('.seg');
    window.__frames = [];
    let start = 0;
    const tick = (t) => {
      start ||= t;
      window.__frames.push({
        t,
        h: mount.getBoundingClientRect().height,
        segY: seg.getBoundingClientRect().top,
      });
      if (t - start < 1000) requestAnimationFrame(tick);
      else window.__sampled = true;
    };
    window.__sampled = false;
    requestAnimationFrame(tick);
  });
  await page.locator('#table .seg button', { hasText: label }).click();
  await page.waitForFunction(() => window.__sampled);
  return page.evaluate(() => window.__frames);
}

// Time from the last frame at the start value to the first within half a
// pixel of the end value. The 280 ms ease-out collapse gets there after about
// 190 ms, and fewer frames only make that span longer. A one-frame snap spans
// a single frame interval: ~17 ms, up to ~100 ms on a slow CI runner.
const MIN_TRANSITION_MS = 120;

function expectGlide(frames, key) {
  const start = frames[0][key];
  const end = frames[frames.length - 1][key];
  expect(Math.abs(end - start)).toBeGreaterThan(1);
  const lastAtStart = frames.findLastIndex(
    (f) => Math.abs(f[key] - start) < 0.5
  );
  const firstAtEnd = frames.findIndex((f) => Math.abs(f[key] - end) < 0.5);
  expect(firstAtEnd).toBeGreaterThan(lastAtStart);
  // It took transition time, not a single frame...
  expect(frames[firstAtEnd].t - frames[lastAtStart].t).toBeGreaterThanOrEqual(
    MIN_TRANSITION_MS
  );
  // ...and was caught at least once part-way.
  expect(firstAtEnd - lastAtStart).toBeGreaterThanOrEqual(2);
}

function expectSmoothCollapse(frames) {
  expect(frames[frames.length - 1].h).toBeLessThan(frames[0].h);
  // Heights only go down...
  for (let i = 1; i < frames.length; i++) {
    expect(frames[i].h).toBeLessThanOrEqual(frames[i - 1].h + 0.5);
  }
  // ...and over transition time rather than in one frame.
  expectGlide(frames, 'h');
}

async function expectNoBlankSpace(page) {
  const s = await page.evaluate(() => {
    const mount = document.getElementById('table');
    const foot = mount.querySelector('.tt-foot').getBoundingClientRect();
    return {
      minHeight: mount.style.minHeight,
      gap: mount.getBoundingClientRect().bottom - foot.bottom,
    };
  });
  expect(s.minHeight).toBe('');
  expect(Math.abs(s.gap)).toBeLessThan(1);
}

test('filtering keeps the controls exactly in place when the page can stay put', async ({
  page,
}, info) => {
  test.skip(
    isMobile(info),
    'measured on desktop; mobile uses the same code path'
  );
  await open(page);
  // Controls in the lower part of the viewport: enough page remains above them.
  await page.evaluate(() => {
    const seg = document.querySelector('#table .seg');
    window.scrollTo(
      0,
      seg.getBoundingClientRect().top + scrollY - innerHeight + 200
    );
  });
  const before = await page.locator('#table .seg').boundingBox();
  const frames = await filterAndSample(page, 'Failed');
  for (const f of frames) expect(Math.abs(f.segY - before.y)).toBeLessThan(0.5);
  expectSmoothCollapse(frames);
  await expectNoBlankSpace(page);
  await expect(rows(page)).toHaveCount(2);
});

test('filtering near the end of the page glides instead of snapping', async ({
  page,
}, info) => {
  test.skip(
    isMobile(info),
    'measured on desktop; mobile uses the same code path'
  );
  await open(page);
  // Controls near the top of the viewport: the page must get shorter than the view.
  await page.evaluate(() => {
    const seg = document.querySelector('#table .seg');
    window.scrollTo(0, seg.getBoundingClientRect().top + scrollY - 80);
  });
  const before = await page.locator('#table .seg').boundingBox();
  const frames = await filterAndSample(page, 'Failed');
  expectSmoothCollapse(frames);
  // No movement on the click frame; the controls then glide (over transition
  // time, caught part-way) instead of jumping.
  expect(Math.abs(frames[0].segY - before.y)).toBeLessThan(0.5);
  expectGlide(frames, 'segY');
  // It ends at the bottom of the page with no blank space below the content.
  await expectNoBlankSpace(page);
  const atEnd = await page.evaluate(() =>
    Math.abs(scrollY + innerHeight - document.documentElement.scrollHeight)
  );
  expect(atEnd).toBeLessThan(1);
});

test('search and selects keep their controls in place', async ({ page }) => {
  await open(page);
  const input = search(page);
  await input.scrollIntoViewIfNeeded();
  const before = await input.boundingBox();
  await input.click();
  await page.keyboard.type('upload');
  await expect(rows(page)).toHaveCount(12);
  await page.waitForTimeout(450);
  expect(Math.abs((await input.boundingBox()).y - before.y)).toBeLessThan(0.5);

  await input.fill('');
  await expect(page.locator('.tt-count')).toHaveText('1–25 of 72 tests');
  const sel = page.getByRole('combobox', { name: 'Filter by browser' });
  const selBefore = await sel.boundingBox();
  await sel.selectOption('webkit');
  await expect(page.locator('.tt-count')).toHaveText('1–24 of 24 tests');
  await page.waitForTimeout(450);
  expect(Math.abs((await sel.boundingBox()).y - selBefore.y)).toBeLessThan(0.5);
  for (const b of await page.locator('#table td.c-browser').allTextContents())
    expect(b).toBe('webkit');
});

test('failures sort first', async ({ page }) => {
  await open(page);
  const classes = await rows(page).evaluateAll((trs) =>
    trs.slice(0, 5).map((t) => t.className)
  );
  expect(classes).toEqual(['fail', 'fail', 'flaky', 'skip', 'skip']);
});

// ── URL state ─────────────────────────────────────────────────────────────────

test('filters live in the URL and Back restores them', async ({ page }) => {
  await open(page);
  await page.locator('#table .seg button', { hasText: 'Passed' }).click();
  await search(page).fill('range');
  await page
    .getByRole('combobox', { name: 'Filter by browser' })
    .selectOption('firefox');
  await page
    .getByRole('combobox', { name: 'Filter by spec file' })
    .selectOption('rangeslider.spec.ts');
  await expect(page).toHaveURL(/result=pass/);
  await expect(page).toHaveURL(/q=range/);
  await expect(page).toHaveURL(/browser=firefox/);
  await expect(page).toHaveURL(/spec=rangeslider\.spec\.ts/);
  await expect(rows(page)).toHaveCount(4);

  await page.goto('/away.html');
  await page.goBack();
  await expect(page.locator('#table .seg [aria-pressed="true"]')).toContainText(
    'Passed'
  );
  await expect(search(page)).toHaveValue('range');
  await expect(
    page.getByRole('combobox', { name: 'Filter by browser' })
  ).toHaveValue('firefox');
  await expect(
    page.getByRole('combobox', { name: 'Filter by spec file' })
  ).toHaveValue('rangeslider.spec.ts');
  await expect(rows(page)).toHaveCount(4);
});

test('invalid URL params fall back to defaults', async ({ page }) => {
  await open(page, '/mixed/?result=bogus&browser=lynx&spec=..%2Fetc&page=-3');
  await expect(page.locator('#table .seg [aria-pressed="true"]')).toContainText(
    'All'
  );
  await expect(
    page.getByRole('combobox', { name: 'Filter by browser' })
  ).toHaveValue('all');
  await expect(
    page.getByRole('combobox', { name: 'Filter by spec file' })
  ).toHaveValue('all');
  await expect(page.locator('.tt-count')).toHaveText('1–25 of 72 tests');
  await expect(page).not.toHaveURL(/result=|browser=|spec=|page=/);

  await open(page, '/mixed/?page=99');
  await expect(page.locator('.tt-count')).toHaveText('51–72 of 72 tests');
  await open(page, '/mixed/?page=abc');
  await expect(page.locator('.tt-count')).toHaveText('1–25 of 72 tests');
});

// ── Keyboard ──────────────────────────────────────────────────────────────────

test('"/" and Cmd/Ctrl+K focus search', async ({ page }, info) => {
  test.skip(isMobile(info), 'hardware keyboard shortcuts');
  await open(page);
  await page.keyboard.press('/');
  await expect(search(page)).toBeFocused();
  await page.locator('h1').click();
  await page.keyboard.press('ControlOrMeta+k');
  await expect(search(page)).toBeFocused();
});

test('every row is reachable by Tab, in order', async ({ page }, info) => {
  test.skip(isMobile(info), 'hardware keyboard');
  await open(page);
  await search(page).focus();
  const visited = [];
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press(isWebkit(info) ? 'Alt+Tab' : 'Tab');
    const at = await page.evaluate(() => {
      const el = document.activeElement;
      const tr = el.closest('tr[data-i]');
      return tr
        ? Number(tr.dataset.i)
        : el.closest('.pager')
          ? 'pager'
          : el.tagName;
    });
    if (at === 'pager') break;
    if (typeof at === 'number') visited.push(at);
  }
  const expected = await rows(page).evaluateAll((trs) =>
    trs.map((t) => Number(t.dataset.i))
  );
  expect(expected).toHaveLength(25);
  expect(visited).toEqual(expected);
});

test('drawer: Enter opens, focus is trapped, Esc returns focus', async ({
  page,
}, info) => {
  test.skip(isMobile(info), 'hardware keyboard');
  const TAB = isWebkit(info) ? 'Alt+Tab' : 'Tab';
  await open(page);
  const rowBtn = page.locator('#table tbody .t-open').nth(0);
  await rowBtn.focus();
  await page.keyboard.press('Enter');
  await drawerOpen(page);
  expect(await inDrawer(page)).toBe(true);

  for (let i = 0; i < 20; i++) {
    await page.keyboard.press(TAB);
    expect(await inDrawer(page)).toBe(true);
  }
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Shift+' + TAB);
    expect(await inDrawer(page)).toBe(true);
  }

  // Arrow keys move between tabs.
  await page.getByRole('tab', { name: 'Steps' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Error' })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Error' })).toHaveAttribute(
    'aria-selected',
    'true'
  );

  await page.keyboard.press('Escape');
  await drawerClosed(page);
  await expect(rowBtn).toBeFocused();

  // A closed drawer is hidden and cannot take focus.
  await expect
    .poll(() =>
      page
        .locator('.drawer-root')
        .evaluate((el) => getComputedStyle(el).visibility)
    )
    .toBe('hidden');
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press(TAB);
    expect(await inDrawer(page)).toBe(false);
  }
});

test('drawer locks background scroll and closes on scrim click', async ({
  page,
}, info) => {
  test.skip(
    isMobile(info),
    'scrim is covered by the sheet on mobile; covered by the touch test'
  );
  await open(page);
  await page.locator('#table').scrollIntoViewIfNeeded();
  await page.locator('#table tbody .t-open').first().click();
  await drawerOpen(page);
  const y = await page.evaluate(() => scrollY);
  await page.mouse.move(200, 450);
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => scrollY)).toBe(y);
  await page.mouse.click(120, 450);
  await drawerClosed(page);
});

// ── Tooltips ──────────────────────────────────────────────────────────────────

test('tooltips stay inside the viewport', async ({ page }, info) => {
  test.skip(isMobile(info), 'hover tooltips');
  await open(page);
  const vw = page.viewportSize();
  const check = async () => {
    const box = await page.locator('.tip.on').boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(vw.width);
    expect(box.y + box.height).toBeLessThanOrEqual(vw.height);
  };
  for (const sel of [
    '.r-bar span >> nth=0',
    '.runners li:last-child .r-bar span:last-child',
  ]) {
    await page.locator(sel).hover();
    await check();
  }
  await failingRow(page).click();
  await page.getByRole('button', { name: 'Copy spec path' }).hover();
  await check();
});

// ── Mobile ────────────────────────────────────────────────────────────────────

async function touchDrag(page, from, dy, steps) {
  const cdp = await page.context().newCDPSession(page);
  const { x, y } = from;
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y }],
  });
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y + (dy * i) / steps }],
    });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
}

test('mobile: no horizontal scroll, stacked rows, large touch targets', async ({
  page,
}, info) => {
  test.skip(!isMobile(info), 'mobile only');
  await open(page);
  const overflow = () =>
    page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(await overflow()).toBeLessThanOrEqual(0);

  expect(
    await page
      .locator('.tt thead')
      .evaluate((el) => getComputedStyle(el).display)
  ).toBe('none');
  expect(
    await rows(page)
      .first()
      .evaluate((el) => getComputedStyle(el).display)
  ).toBe('grid');

  for (const b of await page.locator('#table .seg button').all()) {
    expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(36);
  }
  for (const s of await page.locator('#table .select').all()) {
    expect((await s.boundingBox()).height).toBeGreaterThanOrEqual(36);
  }
  expect((await search(page).boundingBox()).height).toBeGreaterThanOrEqual(34);
  for (const b of await page.locator('.pager button').all()) {
    expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(40);
  }
  for (const b of await page.locator('#theme-toggle, .ext').all()) {
    expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(36);
  }
  expect(
    (await rows(page).first().boundingBox()).height
  ).toBeGreaterThanOrEqual(40);

  // Bottom sheet: tap to open, nothing overflows in any tab.
  await failingRow(page).tap();
  await drawerOpen(page);
  expect(await overflow()).toBeLessThanOrEqual(0);
  for (const tab of ['Error', /Attachments/, /Retries/, 'Steps']) {
    await page.getByRole('tab', { name: tab }).tap();
    expect(
      await page
        .locator('.drawer')
        .evaluate((el) => el.scrollWidth - el.clientWidth)
    ).toBeLessThanOrEqual(0);
    expect(
      await page
        .locator('.dr-body')
        .evaluate((el) => el.scrollWidth - el.clientWidth)
    ).toBeLessThanOrEqual(0);
  }
  for (const b of await page
    .locator('.dr-close, #dr-copy, .dr-tabs [role=tab]')
    .all()) {
    expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(36);
  }
  const box = await page.locator('.drawer').boundingBox();
  expect(Math.round(box.y + box.height)).toBe(844); // anchored to the bottom
  expect(Math.round(box.width)).toBe(390);
});

test('mobile: the sheet snaps back on a short drag and dismisses on a long one', async ({
  page,
}, info) => {
  test.skip(!isMobile(info), 'mobile only');
  await open(page);
  await failingRow(page).tap();
  await drawerOpen(page);
  await page.waitForTimeout(550); // let the sheet finish sliding in
  const head = await page.locator('.dr-title').boundingBox();
  const from = { x: head.x + 20, y: head.y + head.height / 2 };
  const sheetY = (await page.locator('.drawer').boundingBox()).y;

  // Short, slow drag: snaps back.
  await touchDrag(page, from, 50, 10);
  await page.waitForTimeout(550);
  await drawerOpen(page);
  expect(
    Math.abs((await page.locator('.drawer').boundingBox()).y - sheetY)
  ).toBeLessThan(1);

  // Long drag: dismisses.
  await touchDrag(page, from, 360, 12);
  await drawerClosed(page);
});

// ── Theme ─────────────────────────────────────────────────────────────────────

test('theme toggle switches and remembers the choice', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await open(page);
  expect(
    await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  ).toBe('rgb(251, 251, 251)');
  await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  // Applied by the blocking script in <head>, before the client runs.
  expect(
    await page.evaluate(() => document.documentElement.dataset.theme)
  ).toBe('dark');
  expect(
    await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  ).toBe('rgb(14, 14, 16)');
  await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

// ── Contrast (WCAG AA, both themes) ───────────────────────────────────────────

/** Returns every visible text run whose contrast is below 4.5:1. */
async function contrastFailures(page) {
  return page.evaluate(() => {
    const parse = (c) => {
      let m = c.match(
        /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/
      );
      if (m) return [+m[1], +m[2], +m[3], m[4] == null ? 1 : +m[4]];
      m = c.match(
        /^color\(srgb ([\d.e-]+) ([\d.e-]+) ([\d.e-]+)(?: \/ ([\d.]+))?\)$/
      );
      if (m)
        return [m[1] * 255, m[2] * 255, m[3] * 255, m[4] == null ? 1 : +m[4]];
      return null;
    };
    const over = (top, under) => {
      const a = top[3];
      return [0, 1, 2].map((i) => top[i] * a + under[i] * (1 - a)).concat(1);
    };
    const lum = ([r, g, b]) => {
      const f = (v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ratio = (a, b) => {
      const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
      return (x + 0.05) / (y + 0.05);
    };
    const bgOf = (el) => {
      const layers = [];
      for (let n = el; n; n = n.parentElement) {
        const c = parse(getComputedStyle(n).backgroundColor);
        if (c && c[3] > 0) {
          layers.push(c);
          if (c[3] >= 1) break;
        }
      }
      let bg = [255, 255, 255, 1];
      for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg);
      return bg;
    };
    const hidden = (el) => {
      for (let n = el; n; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (
          s.visibility === 'hidden' ||
          s.display === 'none' ||
          +s.opacity === 0
        )
          return true;
        if (n.classList && n.classList.contains('sr')) return true;
        if (n.disabled) return true;
      }
      return false;
    };
    const out = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT
    );
    const seen = new Set();
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      const el = t.parentElement;
      if (
        !t.textContent.trim() ||
        seen.has(el) ||
        el.closest('script, noscript')
      )
        continue;
      seen.add(el);
      if (!el.getClientRects().length || hidden(el)) continue;
      const fg = parse(getComputedStyle(el).color);
      if (!fg) {
        out.push('unparsed color ' + getComputedStyle(el).color);
        continue;
      }
      const bg = bgOf(el);
      const r = ratio(over(fg, bg), bg);
      if (r < 4.5)
        out.push(
          `${r.toFixed(2)} "${t.textContent.trim().slice(0, 40)}" (${el.className || el.tagName})`
        );
    }
    const input = document.querySelector('.search input');
    if (input) {
      const ph = parse(getComputedStyle(input, '::placeholder').color);
      const bg = bgOf(input);
      const r = ratio(over(ph, bg), bg);
      if (r < 4.5) out.push(`${r.toFixed(2)} placeholder`);
    }
    return out;
  });
}

for (const scheme of ['light', 'dark']) {
  test(`text contrast is at least 4.5:1 (${scheme})`, async ({
    page,
  }, info) => {
    test.skip(isMobile(info), 'same colors on mobile');
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
    await open(page);
    expect(await contrastFailures(page)).toEqual([]);

    // Hover and filtered states, and every drawer view.
    await page.locator('#table tbody tr.fail').first().hover();
    expect(await contrastFailures(page)).toEqual([]);
    await page.locator('#attn-list .attn-row').first().hover();
    expect(await contrastFailures(page)).toEqual([]);
    await failingRow(page).click();
    await drawerOpen(page);
    for (const tab of ['Steps', 'Error', /Attachments/, /Retries/]) {
      await page.getByRole('tab', { name: tab }).click();
      const details = page.locator('.drawer details.stack summary');
      if (await details.count()) await details.click();
      expect(await contrastFailures(page), String(tab)).toEqual([]);
    }
    await page.keyboard.press('Escape');
    await page.locator('#table tr.flaky .t-open').click();
    await page.getByRole('tab', { name: /Retries/ }).click();
    expect(await contrastFailures(page), 'flaky retries').toEqual([]);
    await page.keyboard.press('Escape');
    await page.locator('#table tr.skip .t-open').first().click();
    expect(await contrastFailures(page), 'skipped').toEqual([]);
  });
}
