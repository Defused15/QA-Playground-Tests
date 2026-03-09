#!/usr/bin/env node
/**
 * generate-dashboard.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads Playwright's JSON reporter output and generates a self-contained
 * dashboard HTML file.
 *
 * Usage:
 *   node generate-dashboard.mjs \
 *     --json  ./playwright-report/report.json \
 *     --html  ./playwright-report/dashboard.html \
 *     --template ./reporter-template.html
 *
 * All flags are optional — defaults shown above.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const get  = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : fallback;
};

const __dir      = dirname(fileURLToPath(import.meta.url));
const jsonPath   = resolve(get('--json',     './playwright-report/report.json'));
const outPath    = resolve(get('--html',     './playwright-report/dashboard.html'));
const tmplPath   = resolve(get('--template', './reporter-template.html'));

// ── Validate inputs ───────────────────────────────────────────────────────────

if (!existsSync(jsonPath)) {
  console.error(`❌  JSON report not found: ${jsonPath}`);
  console.error('    Make sure you ran: npx playwright test --reporter=json');
  process.exit(1);
}

if (!existsSync(tmplPath)) {
  console.error(`❌  Template not found: ${tmplPath}`);
  console.error('    Put reporter-template.html in your project root.');
  process.exit(1);
}

// ── Read & parse ──────────────────────────────────────────────────────────────

const raw    = JSON.parse(readFileSync(jsonPath, 'utf8'));
const tmpl   = readFileSync(tmplPath, 'utf8');

// ── Transform Playwright JSON → dashboard data model ─────────────────────────
// Playwright JSON structure:
// {
//   stats: { startTime, duration, expected, unexpected, flaky, skipped },
//   suites: [ { title, suites: [...], specs: [...] } ]
// }

function flattenSpecs(suites, path = []) {
  const tests = [];
  for (const suite of suites) {
    const nextPath = suite.title ? [...path, suite.title] : path;
    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const test of spec.tests) {
          const result = test.results?.[0] ?? {};
          tests.push({
            title:    spec.title,
            path:     nextPath,
            file:     spec.file || (nextPath[0] ?? ''),
            line:     spec.line ?? 0,
            project:  test.projectName ?? 'default',
            outcome:  test.status,          // 'expected' | 'unexpected' | 'flaky' | 'skipped'
            duration: result.duration ?? 0,
            retries:  result.retry ?? 0,
            error:    result.error?.message ?? null,
          });
        }
      }
    }
    if (suite.suites) {
      tests.push(...flattenSpecs(suite.suites, nextPath));
    }
  }
  return tests;
}

const stats = raw.stats ?? {};
const tests = flattenSpecs(raw.suites ?? []);

const dashboardData = {
  startTime:    new Date(stats.startTime ?? Date.now()).getTime(),
  duration:     stats.duration ?? 0,
  workers:      raw.config?.workers ?? 1,
  stats: {
    total:      stats.expected + stats.unexpected + stats.flaky + stats.skipped,
    expected:   stats.expected   ?? 0,
    unexpected: stats.unexpected ?? 0,
    flaky:      stats.flaky      ?? 0,
    skipped:    stats.skipped    ?? 0,
    ok:         (stats.unexpected ?? 0) === 0,
  },
  projectNames: [...new Set(tests.map(t => t.project))],
  tests,
};

// ── Inject into template ──────────────────────────────────────────────────────
// The template must contain exactly this placeholder:
//   /* __PLAYWRIGHT_DATA__ */
// inside the <script> block where const DATA = ... lives.

const PLACEHOLDER = '/* __PLAYWRIGHT_DATA__ */';

if (!tmpl.includes(PLACEHOLDER)) {
  console.error(`❌  Template is missing the injection point: ${PLACEHOLDER}`);
  console.error('    Add it inside your <script> block like:');
  console.error('      const DATA = /* __PLAYWRIGHT_DATA__ */;');
  process.exit(1);
}

const injected = tmpl.replace(
  PLACEHOLDER,
  JSON.stringify(dashboardData, null, 2)
);

writeFileSync(outPath, injected, 'utf8');
console.log(`✅  Dashboard written to: ${outPath}`);
console.log(`    Tests: ${dashboardData.stats.total}  |  Passed: ${dashboardData.stats.expected}  |  Failed: ${dashboardData.stats.unexpected}`);
