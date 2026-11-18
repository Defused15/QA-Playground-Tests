// Turns a Playwright JSON report into the data model the report page renders.
// Pure: attachment files are handled by the caller through `mapAttachment`.

import { dirname, relative } from 'node:path';

/**
 * JSON.stringify for embedding inside an inline <script>. Escapes `<` so data
 * containing `</script>` or `<!--` cannot end or alter the script block, and
 * escapes the U+2028/U+2029 line terminators.
 */
export const safeJson = (v) =>
  JSON.stringify(v)
    .replace(/</g, '\\u003c')
    .replace(new RegExp(String.fromCharCode(0x2028), 'g'), '\\u2028')
    .replace(new RegExp(String.fromCharCode(0x2029), 'g'), '\\u2029');

/** Escape a value for HTML text or a quoted attribute. */
export const escHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const ANSI_RE = new RegExp(
  String.fromCharCode(0x1b) + '\\[[0-9;?]*[ -/]*[@-~]',
  'g'
);

/** Remove ANSI escape codes (Playwright colours its error messages). */
export const stripAnsi = (s) => String(s ?? '').replace(ANSI_RE, () => '');

const MAX_TEXT = 32 * 1024;
const clip = (s) => {
  const t = stripAnsi(s);
  return t.length > MAX_TEXT ? t.slice(0, MAX_TEXT) + '\n…' : t;
};

/** First meaningful line of an error message. */
const firstLine = (s) =>
  stripAnsi(s)
    .split('\n')
    .map((l) => l.trim())
    .find(Boolean) || '';

const OUTCOME = {
  expected: 'pass',
  unexpected: 'fail',
  flaky: 'flaky',
  skipped: 'skip',
};
const RESULT = {
  passed: 'pass',
  failed: 'fail',
  timedOut: 'fail',
  interrupted: 'fail',
  skipped: 'skip',
};

function errorOf(e) {
  if (!e) return null;
  const message = clip(e.message || e.value || '');
  const stack = clip(e.stack || '');
  return {
    message,
    // The stack starts with the message; keep only the frames.
    stack:
      stack && message && stack.startsWith(message)
        ? stack.slice(message.length).replace(/^\n+/, '')
        : stack,
    snippet: clip(e.snippet || ''),
    location: e.location
      ? { file: String(e.location.file || ''), line: e.location.line || 0 }
      : null,
  };
}

function stepsOf(steps) {
  return (steps || []).map((s) => {
    const nested = countSteps(s.steps);
    const failedChild = hasError(s.steps);
    return {
      title: stripAnsi(s.title),
      duration: Number.isFinite(s.duration) ? s.duration : null,
      status: s.error || failedChild ? 'fail' : 'pass',
      error: s.error ? firstError(s.error) : '',
      nested,
    };
  });
}
const countSteps = (steps) =>
  (steps || []).reduce((n, s) => n + 1 + countSteps(s.steps), 0);
const hasError = (steps) =>
  (steps || []).some((s) => s.error || hasError(s.steps));
const firstError = (e) => clip(e.message || e.value || '');

const attachmentKind = (a) => {
  const type = String(a.contentType || '');
  if (a.name === 'trace' || /trace.*\.zip$/i.test(a.path || '')) return 'trace';
  if (/^image\/(png|jpe?g|webp|gif)$/.test(type)) return 'image';
  if (type.startsWith('video/')) return 'video';
  return 'file';
};

/** The test directory relative to the config file ("tests"), or ''. */
function testDirOf(config) {
  if (!config.configFile || !config.rootDir) return '';
  const rel = relative(dirname(config.configFile), config.rootDir).replace(
    /\\/g,
    '/'
  );
  return rel && !rel.startsWith('..') && !/^[a-z]:|^\//i.test(rel) ? rel : '';
}

/** Relative path of a spec file from the test directory. */
const relFile = (file) => String(file || '').replace(/\\/g, '/');

/**
 * Build the page model from a Playwright JSON report.
 * meta: { repoUrl, hubUrl, pagesBase, rawReport, generatedAt }
 * mapAttachment(attachment, { testIndex, retry, test }) returns a relative URL,
 * or null when the attachment cannot be published.
 */
export function buildModel(report, meta = {}, mapAttachment = () => null) {
  const tests = [];
  const config = report.config || {};

  const walk = (suite, path) => {
    const here =
      suite.title && !/\.(spec|test)\.[cm]?[jt]sx?$/.test(suite.title)
        ? [...path, suite.title]
        : path;
    for (const spec of suite.specs || []) {
      for (const t of spec.tests || []) {
        const results = t.results || [];
        const last = results[results.length - 1] || null;
        let outcome = OUTCOME[t.status] || 'skip';
        if (!last) outcome = 'skip';
        const i = tests.length;
        const entry = {
          i,
          title: stripAnsi(spec.title),
          suite: here.map(stripAnsi),
          file: relFile(spec.file || suite.file),
          line: spec.line || 0,
          browser: String(t.projectName || t.projectId || ''),
          outcome,
          retries: Math.max(0, results.length - 1),
          duration: last && Number.isFinite(last.duration) ? last.duration : 0,
          tags: (spec.tags || []).map(String),
          annotations: (t.annotations || [])
            .concat(last ? last.annotations || [] : [])
            .filter((a) => a && a.type)
            .map((a) => ({
              type: String(a.type),
              description: stripAnsi(a.description || ''),
            }))
            .filter(
              (a, k, all) =>
                all.findIndex(
                  (b) => b.type === a.type && b.description === a.description
                ) === k
            ),
          error: null,
          errorLine: '',
          steps: [],
          attempts: [],
          attachments: [],
        };
        tests.push(entry);

        results.forEach((r, k) => {
          const err = r.error || (r.errors && r.errors[0]) || null;
          entry.attempts.push({
            retry: Number.isFinite(r.retry) ? r.retry : k,
            status: RESULT[r.status] || 'skip',
            rawStatus: String(r.status || ''),
            duration: Number.isFinite(r.duration) ? r.duration : 0,
            startTime: r.startTime ? Date.parse(r.startTime) || null : null,
            error: err ? firstLine(err.message || err.value || '') : '',
          });
          for (const a of r.attachments || []) {
            const url = mapAttachment(a, {
              testIndex: i,
              retry: Number.isFinite(r.retry) ? r.retry : k,
              test: entry,
            });
            if (!url) continue;
            entry.attachments.push({
              name: stripAnsi(a.name || 'attachment'),
              type: String(a.contentType || ''),
              kind: attachmentKind(a),
              retry: Number.isFinite(r.retry) ? r.retry : k,
              url,
            });
          }
        });

        if (last) {
          entry.steps = stepsOf(last.steps);
          if (outcome === 'fail') {
            entry.error = errorOf(
              last.error || (last.errors && last.errors[0]) || null
            ) || {
              message:
                last.status === 'timedOut'
                  ? 'Test timeout exceeded.'
                  : 'Test ' + (last.status || 'failed') + '.',
              stack: '',
              snippet: '',
              location: null,
            };
            entry.errorLine = firstLine(entry.error.message);
          } else if (outcome === 'flaky') {
            const failed = results.find((r) => RESULT[r.status] === 'fail');
            const e = failed && (failed.error || (failed.errors || [])[0]);
            entry.errorLine = e ? firstLine(e.message || e.value || '') : '';
          }
        }
      }
    }
    for (const s of suite.suites || []) walk(s, here);
  };
  for (const s of report.suites || []) walk(s, []);

  const count = (o) => tests.filter((t) => t.outcome === o).length;
  const browsers = [...new Set(tests.map((t) => t.browser))].filter(Boolean);
  const byBrowser = browsers.map((name) => {
    const list = tests.filter((t) => t.browser === name);
    const c = (o) => list.filter((t) => t.outcome === o).length;
    return {
      name,
      total: list.length,
      pass: c('pass'),
      fail: c('fail'),
      flaky: c('flaky'),
      skip: c('skip'),
    };
  });
  const stats = report.stats || {};
  const started = stats.startTime ? Date.parse(stats.startTime) || null : null;

  return {
    name: meta.name || 'QA-Playground-Tests',
    repoUrl: meta.repoUrl || '',
    hubUrl: meta.hubUrl || '',
    pagesBase: meta.pagesBase || '',
    rawReport: meta.rawReport || '',
    generatedAt: meta.generatedAt || Date.now(),
    playwrightVersion: String(config.version || ''),
    testDir: testDirOf(config),
    started,
    duration: Number.isFinite(stats.duration) ? stats.duration : null,
    browsers,
    files: [...new Set(tests.map((t) => t.file))].filter(Boolean).sort(),
    stats: {
      total: tests.length,
      pass: count('pass'),
      fail: count('fail'),
      flaky: count('flaky'),
      skip: count('skip'),
    },
    byBrowser,
    errors: (report.errors || []).map((e) => firstLine(e.message || '')),
    tests,
  };
}
