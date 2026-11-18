// Builds one report site per fixture before the page tests run.
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../../scripts/report/build-report.mjs';
import { mixedReport, passingReport } from './fixtures.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const SITE = join(HERE, '..', '.site');

export default function globalSetup() {
  rmSync(SITE, { recursive: true, force: true });
  const src = join(SITE, '_src');
  const fixtures = {
    mixed: mixedReport(join(src, 'mixed')),
    hostile: mixedReport(join(src, 'hostile'), { hostile: true }),
    passing: passingReport(join(src, 'passing')),
  };
  for (const [name, report] of Object.entries(fixtures)) {
    // Each input folder stands in for playwright-report/: the JSON plus,
    // for the mixed run, a native HTML report to copy alongside.
    const input = join(src, name, 'playwright-report');
    mkdirSync(input, { recursive: true });
    const file = join(input, 'report.json');
    writeFileSync(file, JSON.stringify(report));
    if (name === 'mixed') {
      writeFileSync(
        join(input, 'index.html'),
        '<!doctype html><meta charset="utf-8"><title>Playwright Test Report</title><p>Native report</p>'
      );
    }
    build(file, join(SITE, name));
  }
  // Smoke build from a real local run, when one exists (not in CI).
  const real = join(HERE, '..', '..', 'playwright-report', 'report.json');
  if (existsSync(real)) build(real, join(SITE, 'real'), { rawDir: null });

  // A plain page to navigate away to and come Back from.
  writeFileSync(
    join(SITE, 'away.html'),
    '<!doctype html><meta charset="utf-8"><title>Away</title><p>Away</p>'
  );
}
