// Regression tests for the report build: data embedded in the inline <script>
// block must not be able to close the tag or be mangled by String.replace
// substitution patterns ($&, $', $`); attachments are copied with safe names.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  rmSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build, safeName } from '../../scripts/report/build-report.mjs';
import { buildModel, safeJson, stripAnsi } from '../../scripts/report/lib.mjs';
import {
  mixedReport,
  HOSTILE_TITLE,
  DOLLAR_TITLE,
  HOSTILE_ERROR,
} from '../ui/fixtures.mjs';

let work;
let html;
let result;

/** [attributes, body] for every <script> block without a src. */
const inlineScripts = (h) =>
  [...h.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi)].map(
    (m) => [m[1], m[2]]
  );
const dataOf = (h) => JSON.parse(inlineScripts(h)[0][1]);

before(() => {
  work = mkdtempSync(join(tmpdir(), 'qapt-report-'));
  const input = join(work, 'playwright-report');
  mkdirSync(join(input, 'data'), { recursive: true });
  writeFileSync(
    join(input, 'index.html'),
    '<!doctype html><title>Native</title>'
  );
  writeFileSync(join(input, 'data', 'abc.png'), 'x');
  const file = join(input, 'report.json');
  writeFileSync(
    file,
    JSON.stringify(mixedReport(join(work, 'src'), { hostile: true }))
  );
  result = build(file, join(work, 'site'));
  html = readFileSync(join(work, 'site', 'index.html'), 'utf8');
});

after(() => rmSync(work, { recursive: true, force: true }));

test('writes the page and its assets', () => {
  for (const f of [
    'index.html',
    'assets/report.css',
    'assets/report.js',
    'assets/theme.js',
  ]) {
    assert.ok(existsSync(join(work, 'site', f)), f + ' missing');
  }
});

test('hostile titles cannot break out of the data block', () => {
  assert.ok(
    !html.includes('</script><img'),
    'raw </script><img found in output'
  );
  assert.ok(!html.includes('<img'), 'an <img> tag reached the HTML');
  assert.ok(
    !html.includes('</script><script>alert'),
    'raw script tag from an error message'
  );

  const scripts = inlineScripts(html);
  assert.equal(
    scripts.length,
    1,
    'expected exactly one inline script block (the data)'
  );
  const [attrs] = scripts[0];
  assert.match(
    attrs,
    /type="application\/json"/,
    'data block must not be executable'
  );

  const data = dataOf(html);
  const titles = data.tests.map((t) => t.title);
  assert.ok(
    titles.includes(HOSTILE_TITLE),
    'hostile title must round-trip exactly'
  );
  assert.ok(titles.includes(DOLLAR_TITLE), "$& and $' must survive untouched");
  const failing = data.tests.find(
    (t) => t.outcome === 'fail' && t.browser === 'webkit'
  );
  assert.ok(failing.error.message.startsWith(HOSTILE_ERROR));
});

test('safeJson escapes <, U+2028 and U+2029', () => {
  const ls = String.fromCharCode(0x2028);
  const ps = String.fromCharCode(0x2029);
  const out = safeJson({ s: '</script>' + ls + ps });
  assert.ok(!out.includes('<'));
  assert.ok(!out.includes(ls) && !out.includes(ps));
  assert.deepEqual(JSON.parse(out), { s: '</script>' + ls + ps });
});

test('ANSI escape codes are stripped from errors', () => {
  const data = dataOf(html);
  const failing = data.tests.find(
    (t) => t.outcome === 'fail' && t.browser === 'webkit'
  );
  const esc = String.fromCharCode(0x1b);
  assert.ok(!JSON.stringify(failing).includes(esc));
  assert.ok(!html.includes('\\u001b'));
  assert.equal(stripAnsi(esc + '[31mred' + esc + '[39m'), 'red');
  assert.equal(failing.errorLine, HOSTILE_ERROR);
});

test('summary counts match the run', () => {
  const m = buildModel(mixedReport(join(work, 'counts')));
  assert.deepEqual(m.stats, {
    total: 72,
    pass: 67,
    fail: 2,
    flaky: 1,
    skip: 2,
  });
  assert.deepEqual(m.browsers, ['chromium', 'firefox', 'webkit']);
  assert.equal(m.files.length, 6);
  assert.equal(m.testDir, 'tests');
  assert.equal(m.playwrightVersion, '1.65.1');
  const t = m.tests.find((x) => x.outcome === 'fail' && x.browser === 'webkit');
  assert.deepEqual(t.suite, ['Dropdown']);
  assert.equal(t.retries, 2);
  assert.equal(t.attempts.length, 3);
  assert.deepEqual(
    t.steps.map((s) => s.status),
    ['pass', 'fail', 'pass']
  );
  assert.equal(t.steps[1].nested, 1);
  const skipped = m.tests.filter((x) => x.outcome === 'skip');
  assert.equal(skipped[0].annotations[0].type, 'skip');
});

test('attachments are copied with safe unique names; missing files are skipped', () => {
  assert.equal(
    result.attachments.missing,
    2,
    'the missing video, once per attempt'
  );
  const data = dataOf(html);
  const all = data.tests.flatMap((t) => t.attachments);
  assert.ok(all.length > 0);
  const urls = all.map((a) => a.url);
  assert.equal(
    new Set(urls).size,
    urls.length,
    'attachment URLs must be unique'
  );
  for (const u of urls) {
    assert.match(u, /^attachments\/[0-9a-f]{12}-r\d+\/[A-Za-z0-9._-]+$/, u);
    assert.ok(existsSync(join(work, 'site', u)), u + ' not copied');
  }
  const traces = all.filter((a) => a.kind === 'trace');
  assert.ok(traces.length >= 2);
  for (const t of traces) assert.match(t.url, /\/trace\.zip$/);
  // Inline (body) attachments are written out too.
  assert.ok(
    all.some((a) => a.name === 'console.log' && a.url.endsWith('/console.log'))
  );
});

test('safeName neutralises paths and scriptable extensions', () => {
  assert.equal(safeName('../../etc/passwd'), 'etc-passwd');
  assert.equal(
    safeName('"><img src=x onerror=alert(3)>.png'),
    'img-src-x-onerror-alert-3-.png'
  );
  assert.equal(safeName('page.html'), 'page.html.txt');
  assert.equal(safeName('icon.svg'), 'icon.svg.txt');
  assert.equal(safeName(''), 'attachment');
  assert.equal(safeName('shot', '.png'), 'shot.png');
});

test('copies the native report without its JSON', () => {
  assert.ok(result.rawReport);
  const raw = join(work, 'site', 'playwright');
  assert.ok(existsSync(join(raw, 'index.html')));
  assert.ok(existsSync(join(raw, 'data', 'abc.png')));
  assert.ok(
    !existsSync(join(raw, 'report.json')),
    'report.json must not be published'
  );
  assert.match(html, /href="playwright\/">Raw Playwright report</);
  assert.ok(!readdirSync(raw).includes('site'));
});

test('builds without a native report or attachments on disk', () => {
  const dir = join(work, 'bare');
  mkdirSync(dir, { recursive: true });
  const report = mixedReport(join(work, 'bare-src'));
  rmSync(join(work, 'bare-src'), { recursive: true, force: true });
  writeFileSync(join(dir, 'report.json'), JSON.stringify(report));
  const r = build(join(dir, 'report.json'), join(dir, 'site'));
  assert.equal(r.rawReport, false);
  assert.equal(r.attachments.copied, 1); // only the inline text body
  const page = readFileSync(join(dir, 'site', 'index.html'), 'utf8');
  assert.ok(!page.includes('Raw Playwright report'));
});
