#!/usr/bin/env node
// Builds the static E2E report page from a Playwright JSON report.
//
//   node scripts/report/build-report.mjs [playwright-report/report.json] [site]
//
// Writes site/index.html and site/assets/, copies screenshots, videos and
// traces into site/attachments/, and copies the native Playwright HTML report
// (without its JSON) into site/playwright/ when it sits next to the JSON.

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
  cpSync,
  existsSync,
  rmSync,
  statSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import {
  basename,
  dirname,
  extname,
  join,
  relative,
  resolve,
  sep,
} from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildModel, safeJson, escHtml } from './lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..');
const SITE = join(HERE, 'site');

export const HUB_URL =
  'https://qa.rcastillo.dev/projects/QA-Playground-Tests.html';
export const REPO_URL = 'https://github.com/Defused15/QA-Playground-Tests';
export const PAGES_BASE = 'https://defused15.github.io/QA-Playground-Tests/';
const FONTS_CSS =
  'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap';
const ASSETS = ['report.css', 'report.js', 'theme.js'];
const MAX_INLINE_BODY = 2 * 1024 * 1024;

const EXT_BY_TYPE = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'video/webm': '.webm',
  'video/mp4': '.mp4',
  'application/zip': '.zip',
  'application/json': '.json',
  'text/plain': '.txt',
};

/** A file name that is safe in a URL path and on any file system. */
export function safeName(name, fallbackExt = '') {
  let n = String(name || '')
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-.]+/, '')
    .slice(-80);
  if (!n || n === '.' || n === '..') n = 'attachment';
  if (fallbackExt && !extname(n)) n += fallbackExt;
  // Files a browser would run as a document on the Pages origin are served as text.
  if (/\.(html?|xhtml|svg|xml|js|mjs)$/i.test(n)) n += '.txt';
  return n;
}

const THEME_TOGGLE = `<button class="icon-btn theme-toggle" id="theme-toggle" type="button" aria-label="Switch theme">
      <svg class="i-moon" viewBox="0 0 16 16" aria-hidden="true"><path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z"/></svg>
      <svg class="i-sun" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"/></svg>
    </button>`;
const EXTERNAL =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5H3.5v9h9V10M9 3.5h3.5V7M12.5 3.5L7 9"/></svg>';

const section = (id, heading, inner, note = '') => `
  <section class="sec" id="${id}">
    <div class="sec-head"><h2>${heading}</h2><span class="sec-note">${note}</span></div>
    <div class="sec-body">${inner}</div>
  </section>`;

export function renderPage(model, cacheBust = String(Date.now())) {
  const v = encodeURIComponent(cacheBust);
  const title = `${model.name} E2E report`;
  const description = `Playwright end-to-end results for ${model.name}: every test per browser with steps, errors, screenshots, videos and traces.`;
  const raw = model.rawReport
    ? `<a class="link" href="${escHtml(model.rawReport)}">Raw Playwright report</a>`
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(title)}</title>
<meta name="description" content="${escHtml(description)}">
<meta name="theme-color" content="#fbfbfb" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0e0e10" media="(prefers-color-scheme: dark)">
<meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS_CSS}">
<link rel="stylesheet" href="assets/report.css?v=${v}">
<script src="assets/theme.js?v=${v}"></script>
</head>
<body>
<div class="page">
  <header class="top">
    <span class="brand">${escHtml(model.name)}</span>
    <span class="top-end">
      <a class="back" href="${escHtml(model.hubUrl)}">QA Hub</a>
      ${THEME_TOGGLE}
    </span>
  </header>

  <section class="hero">
    <p class="kicker"><span class="tag">E2E</span>Playwright end-to-end report</p>
    <h1 id="lead">Loading results</h1>
    <p class="sub" id="lead-sub"></p>
    <p class="meta" id="meta"></p>
    <p class="links">
      <a class="ext" href="${escHtml(model.hubUrl)}" rel="noopener">Overview and history on QA Hub${EXTERNAL}</a>
      <a class="ext" href="${escHtml(model.repoUrl)}" rel="noopener">Source code${EXTERNAL}</a>
    </p>
  </section>
${section('summary', 'Summary', '<div id="summary-body"></div>', 'Latest run')}
${section('attention', 'Needs attention', '<ul class="attn" id="attn-list"></ul>')}
${section('tests', 'Tests', '<div id="table"></div>', 'Failures first. Press / to search.')}

  <footer class="foot">
    <span>Generated from the Playwright JSON report of the latest CI run.</span>
    <span class="foot-links">${raw}<a class="link" href="${escHtml(model.repoUrl)}">Source</a></span>
  </footer>
</div>
<noscript><p class="page muted">This report needs JavaScript to display results.</p></noscript>
<script id="report-data" type="application/json">${safeJson(model)}</script>
<script src="assets/report.js?v=${v}" defer></script>
</body>
</html>
`;
}

/** Copies attachment files into <outDir>/attachments and returns their URLs. */
function attachmentCopier(outDir, stats) {
  const base = join(outDir, 'attachments');
  const used = new Set();
  return (a, { retry, test }) => {
    const key = createHash('sha1')
      .update(
        [test.file, ...test.suite, test.title, test.browser].join('\u0000')
      )
      .digest('hex')
      .slice(0, 12);
    const dir = key + '-r' + retry;
    const ext = EXT_BY_TYPE[String(a.contentType || '').split(';')[0]] || '';
    let name = safeName(a.path ? basename(a.path) : a.name, ext);
    if (name === 'attachment' + ext && a.name) name = safeName(a.name, ext);
    for (let n = 2; used.has(dir + '/' + name); n++) {
      const e = extname(name);
      name =
        name.slice(0, name.length - e.length).replace(/-\d+$/, '') +
        '-' +
        n +
        e;
    }
    const target = join(base, dir, name);
    try {
      if (a.path) {
        const src = resolve(a.path);
        if (!existsSync(src) || !statSync(src).isFile()) {
          stats.missing++;
          return null;
        }
        mkdirSync(dirname(target), { recursive: true });
        copyFileSync(src, target);
      } else if (typeof a.body === 'string') {
        const buf = Buffer.from(a.body, 'base64');
        if (!buf.length || buf.length > MAX_INLINE_BODY) {
          stats.missing++;
          return null;
        }
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, buf);
      } else {
        stats.missing++;
        return null;
      }
    } catch {
      stats.missing++;
      return null;
    }
    used.add(dir + '/' + name);
    stats.copied++;
    return 'attachments/' + dir + '/' + name;
  };
}

/** Copies the native HTML report (minus its JSON) into <outDir>/playwright. */
function copyRawReport(rawDir, outDir, inFile) {
  if (!rawDir || !existsSync(join(rawDir, 'index.html'))) return false;
  const src = resolve(rawDir);
  const out = resolve(outDir);
  if (src === out) return false;
  const skip = new Set([resolve(inFile), join(src, 'report.json')]);
  cpSync(src, join(out, 'playwright'), {
    recursive: true,
    filter: (p) => {
      const abs = resolve(p);
      if (skip.has(abs)) return false;
      // Never copy the output into itself.
      return !(abs === out || abs.startsWith(out + sep));
    },
  });
  return true;
}

/**
 * Build the site. options: { rawDir, generatedAt, pagesBase, hubUrl, repoUrl }
 */
export function build(inFile, outDir, options = {}) {
  const report = JSON.parse(readFileSync(inFile, 'utf8'));
  mkdirSync(join(outDir, 'assets'), { recursive: true });
  rmSync(join(outDir, 'attachments'), { recursive: true, force: true });
  rmSync(join(outDir, 'playwright'), { recursive: true, force: true });

  const rawDir =
    options.rawDir === undefined ? dirname(resolve(inFile)) : options.rawDir;
  const hasRaw = copyRawReport(rawDir, outDir, inFile);
  const stats = { copied: 0, missing: 0 };
  const model = buildModel(
    report,
    {
      repoUrl: options.repoUrl || REPO_URL,
      hubUrl: options.hubUrl || HUB_URL,
      pagesBase: options.pagesBase || PAGES_BASE,
      rawReport: hasRaw ? 'playwright/' : '',
      generatedAt: options.generatedAt || Date.now(),
    },
    attachmentCopier(outDir, stats)
  );
  for (const f of ASSETS)
    copyFileSync(join(SITE, f), join(outDir, 'assets', f));
  const out = join(outDir, 'index.html');
  writeFileSync(
    out,
    renderPage(model, String(model.started || model.generatedAt))
  );
  return { out, model, attachments: stats, rawReport: hasRaw };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const inFile = resolve(
    process.argv[2] || join(ROOT, 'playwright-report', 'report.json')
  );
  const outDir = resolve(process.argv[3] || join(ROOT, 'site'));
  const { out, model, attachments, rawReport } = build(inFile, outDir);
  const s = model.stats;
  console.log(
    `Report written to ${relative(process.cwd(), out) || out}: ${s.total} tests ` +
      `(${s.pass} passed, ${s.fail} failed, ${s.flaky} flaky, ${s.skip} skipped), ` +
      `${attachments.copied} attachments copied` +
      (attachments.missing
        ? `, ${attachments.missing} missing and skipped`
        : '') +
      (rawReport ? ', raw Playwright report copied to playwright/' : '')
  );
}
