#!/usr/bin/env node
// The CI jobs and the test:visual scripts run inside the official Playwright
// image, whose browsers must match the installed @playwright/test version.
// Fails if any image tag differs, so a Playwright bump can't silently desync.

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const version = require('@playwright/test/package.json').version;
const files = ['.github/workflows/playwright.yml', 'package.json'];
const tag = /mcr\.microsoft\.com\/playwright:v([0-9][0-9A-Za-z.-]*?)-noble/g;

let found = 0;
const mismatches = [];
for (const file of files) {
  for (const match of readFileSync(file, 'utf8').matchAll(tag)) {
    found++;
    if (match[1] !== version) mismatches.push(`${file}: image v${match[1]}`);
  }
}

if (found === 0) {
  console.error('No Playwright image references found');
  process.exit(1);
}
if (mismatches.length > 0) {
  console.error(
    `@playwright/test is ${version}, but these use another image:\n  ${mismatches.join('\n  ')}\n` +
      'Update the image tags (and re-record the visual baselines) together with the package.'
  );
  process.exit(1);
}
console.log(`Playwright ${version} matches all ${found} image references`);
