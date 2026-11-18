#!/usr/bin/env node
// Gate for a merged Playwright JSON report. Fails when no tests ran, when any
// test failed, or when an executed test has no test.step (the QA Hub and the
// report page show steps per test).
//
//   node scripts/ci/check-results.mjs [playwright-report/report.json]

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Results that ran (not skipped) but recorded no test.step. */
export function testsWithoutSteps(report) {
  const missing = [];
  const walk = (suite) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests) {
        for (const result of test.results) {
          if (result.status === 'skipped') continue;
          if ((result.steps ?? []).length === 0) {
            missing.push(
              `${spec.file}:${spec.line} ${spec.title} [${test.projectName}]`
            );
            break;
          }
        }
      }
    }
    for (const child of suite.suites ?? []) walk(child);
  };
  for (const suite of report.suites ?? []) walk(suite);
  return missing;
}

/** Returns the list of problems; empty means the run is green. */
export function checkReport(report) {
  const s = report.stats;
  const problems = [];
  const total = s.expected + s.unexpected + s.flaky + s.skipped;
  if (total === 0) problems.push('No tests ran');
  if (s.unexpected > 0) problems.push(`${s.unexpected} test(s) failed`);
  const missing = testsWithoutSteps(report);
  if (missing.length > 0) {
    problems.push(
      `${missing.length} executed test(s) have no test.step:\n  ${missing.join('\n  ')}`
    );
  }
  return problems;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const file = resolve(process.argv[2] || 'playwright-report/report.json');
  const report = JSON.parse(readFileSync(file, 'utf8'));
  const s = report.stats;
  console.log(
    `passed ${s.expected}, failed ${s.unexpected}, flaky ${s.flaky}, skipped ${s.skipped}`
  );
  const problems = checkReport(report);
  for (const p of problems) console.error(p);
  process.exit(problems.length > 0 ? 1 : 0);
}
