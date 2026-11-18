import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkReport,
  testsWithoutSteps,
} from '../../scripts/ci/check-results.mjs';

const result = (status, steps = [{ title: 'Do something' }]) => ({
  status,
  steps,
});
const report = (tests, stats = {}) => ({
  stats: { expected: 1, unexpected: 0, flaky: 0, skipped: 0, ...stats },
  suites: [
    {
      specs: [{ title: 'A test', file: 'a.spec.ts', line: 3, tests }],
      suites: [],
    },
  ],
});

test('green run with steps passes', () => {
  assert.deepEqual(
    checkReport(
      report([{ projectName: 'chromium', results: [result('passed')] }])
    ),
    []
  );
});

test('executed test without steps fails', () => {
  const r = report([
    { projectName: 'firefox', results: [result('passed', [])] },
  ]);
  assert.deepEqual(testsWithoutSteps(r), ['a.spec.ts:3 A test [firefox]']);
  assert.equal(checkReport(r).length, 1);
});

test('skipped test without steps is ignored', () => {
  const r = report(
    [{ projectName: 'webkit', results: [result('skipped', [])] }],
    { expected: 0, skipped: 1 }
  );
  assert.deepEqual(checkReport(r), []);
});

test('failures and empty runs are reported', () => {
  assert.match(checkReport(report([], { expected: 0 })).join(), /No tests ran/);
  assert.match(
    checkReport(report([], { unexpected: 2 })).join(),
    /2 test\(s\) failed/
  );
});
