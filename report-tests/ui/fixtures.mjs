// Playwright-shaped JSON report fixtures for the report page tests. Generated,
// not recorded, so they stay deterministic and small. Attachment files are
// written to `dir` so the build can copy them like real screenshots, videos
// and traces.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

export const HOSTILE_TITLE = '</script><img src=x onerror=alert(1)>';
export const DOLLAR_TITLE = "Keeps $& and $' and $1 in the label";
export const HOSTILE_ERROR =
  'Error: expected </script><script>alert(2)</script> to be "$&"';
const HOSTILE_ATTACHMENT = '"><img src=x onerror=alert(3)>.png';

const ESC = String.fromCharCode(0x1b);
const red = (s) => ESC + '[31m' + s + ESC + '[39m';
const dim = (s) => ESC + '[2m' + s + ESC + '[22m';

// ── Tiny binary files ─────────────────────────────────────────────────────────

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

/** A small PNG that looks like a page screenshot (header, text lines, a box). */
function screenshotPng(w = 640, h = 400, accent = [192, 38, 47]) {
  const rows = [];
  for (let y = 0; y < h; y++) {
    const row = Buffer.alloc(1 + w * 3);
    for (let x = 0; x < w; x++) {
      let c = [251, 251, 251];
      if (y < 44) c = [24, 24, 27];
      else if (y > 80 && y < 92 && x > 40 && x < 360) c = [91, 91, 99];
      else if (y > 108 && y < 116 && x > 40 && x < 520) c = [217, 217, 221];
      else if (y > 126 && y < 134 && x > 40 && x < 470) c = [217, 217, 221];
      else if (y > 170 && y < 330 && x > 40 && x < 600) {
        const edge = y < 174 || y > 326 || x < 44 || x > 596;
        c = edge ? accent : [255, 255, 255];
        if (y > 200 && y < 236 && x > 64 && x < 260) c = [231, 231, 233];
      }
      row.set(c, 1 + x * 3);
    }
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
// EBML header magic followed by filler: enough to look like a WebM file.
const WEBM = Buffer.concat([
  Buffer.from([0x1a, 0x45, 0xdf, 0xa3]),
  Buffer.alloc(60, 0),
]);
// An empty ZIP archive (end of central directory record only).
const ZIP = Buffer.from([
  0x50, 0x4b, 0x05, 0x06, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]);

// ── Report shape ──────────────────────────────────────────────────────────────

const BROWSERS = ['chromium', 'firefox', 'webkit'];
const SPECS = [
  {
    file: 'dropdown.spec.ts',
    suite: ['Dropdown'],
    tests: [
      'Selects an option with the mouse',
      'Selects an option with the keyboard',
      'Shows the placeholder before a choice',
      'Lists every fruit option',
    ],
  },
  {
    file: 'geolocation.spec.ts',
    suite: ['Geolocation', 'Happy path'],
    tests: [
      'Initial state prompts the user to click the button',
      'Shows the city for Paris coordinates',
      'Denied permission shows an error',
      'Reverse geocoding failure is handled',
    ],
  },
  {
    file: 'qr.spec.ts',
    suite: ['QR Code Generator'],
    tests: [
      'Generates a code for a URL',
      'Regenerates when the text changes',
      'Rejects an empty input',
      'Downloads the generated image',
    ],
  },
  {
    file: 'rangeslider.spec.ts',
    suite: ['Range Slider', 'Range Kiss'],
    tests: [
      'Range bar min value',
      'Range bar max value',
      'Keyboard arrows move the thumb',
      'Value label follows the thumb',
    ],
  },
  {
    file: 'upload.spec.ts',
    suite: ['Upload'],
    tests: [
      'Uploads a single file',
      'Shows the file name after upload',
      'Rejects files over the size limit',
      'Clears the selection',
    ],
  },
  {
    file: 'menu.spec.ts',
    suite: ['Menu'],
    tests: [
      'Opens the nested submenu',
      'Closes on outside click',
      'Highlights the active item',
      'Keyboard navigation wraps around',
    ],
  },
];

const ROOT = '/home/runner/work/QA-Playground-Tests/QA-Playground-Tests';

/**
 * A mixed run: 72 tests (6 specs x 4 tests x 3 browsers, three pages in the
 * table), two failures with retries, one flaky test, two skipped tests, steps
 * with a failing step, screenshots, videos, a trace and a missing file.
 */
export function mixedReport(dir, { hostile = false } = {}) {
  mkdirSync(dir, { recursive: true });
  const file = (name, buf) => {
    const p = join(dir, name);
    writeFileSync(p, buf);
    return p;
  };
  const shotFail = file('test-failed-1.png', screenshotPng());
  const shotFlaky = file(
    'flaky-failed-1.png',
    screenshotPng(640, 400, [138, 83, 0])
  );
  const video = file('video.webm', WEBM);
  const trace = file('trace.zip', ZIP);
  const missing = join(dir, 'gone', 'video.webm');

  const started = Date.now() - 2 * 86400000 - 3 * 3600000;
  let clock = started;
  const keyboardError = {
    message:
      red('Error: expect(locator).toHaveText(expected) failed') +
      "\n\nLocator:  locator('#fruits')\nExpected: " +
      red('"Banana"') +
      '\nReceived: ' +
      red('"Apple"') +
      '\nTimeout:  5000ms\n\nCall log:\n' +
      dim('  - Expect "toHaveText" with timeout 5000ms') +
      '\n' +
      dim("  - waiting for locator('#fruits')"),
    stack:
      'Error: expect(locator).toHaveText(expected) failed\n    at ' +
      ROOT +
      '/tests/dropdown.spec.ts:42:35\n    at ' +
      ROOT +
      '/node_modules/playwright/lib/worker/workerMain.js:315:9',
    snippet:
      "  40 |     await page.keyboard.press('ArrowDown');\n  41 |     await page.keyboard.press('Enter');\n" +
      red('>') +
      " 42 |     await expect(dropdown.select).toHaveText('Banana');\n     |                                   ^\n  43 |   });",
    location: { file: ROOT + '/tests/dropdown.spec.ts', line: 42, column: 35 },
  };
  if (hostile)
    keyboardError.message = HOSTILE_ERROR + '\n' + keyboardError.message;
  const timeoutError = {
    message: 'Test timeout of 30000ms exceeded.',
    stack: 'Test timeout of 30000ms exceeded.',
  };
  const flakyError = {
    message:
      red('Error: expect(locator).toHaveText(expected) failed') +
      '\n\nExpected: "Paris, France"\nReceived: "Locating…"',
    stack:
      'Error: expect(locator).toHaveText(expected) failed\n    at ' +
      ROOT +
      '/tests/geolocation.spec.ts:58:41',
  };

  const result = (retry, status, duration, opts = {}) => {
    const r = {
      workerIndex: retry,
      parallelIndex: 0,
      status,
      duration,
      errors: opts.error ? [{ message: opts.error.message }] : [],
      stdout: [],
      stderr: [],
      retry,
      startTime: new Date((clock += duration + 40)).toISOString(),
      annotations: opts.annotations || [],
      attachments: opts.attachments || [],
    };
    if (opts.error) r.error = opts.error;
    if (opts.steps) r.steps = opts.steps;
    return r;
  };
  const okSteps = (title, d) => [
    { title: 'Open the app', duration: Math.round(d * 0.4) },
    {
      title: 'Verify ' + title.charAt(0).toLowerCase() + title.slice(1),
      duration: Math.round(d * 0.3),
      steps: [{ title: 'Check visible text', duration: 12 }],
    },
  ];

  const suites = SPECS.map((spec, si) => {
    const specs = spec.tests.map((title0, ti) => {
      let title = title0;
      if (hostile && si === 0 && ti === 3) title = HOSTILE_TITLE;
      if (hostile && si === 2 && ti === 0) title = DOLLAR_TITLE;
      const line = 20 + ti * 14;
      const tests = BROWSERS.map((browser, bi) => {
        const d = 600 + ((si * 7 + ti * 5 + bi * 3) % 11) * 230;
        const base = {
          timeout: 30000,
          annotations: [],
          expectedStatus: 'passed',
          projectId: browser,
          projectName: browser,
        };
        // Failing: keyboard selection on WebKit, three attempts.
        if (si === 0 && ti === 1 && browser === 'webkit') {
          const steps = [
            { title: 'Open the dropdown', duration: 210 },
            {
              title: 'Press ArrowDown twice and Enter',
              duration: 5130,
              error: keyboardError,
              steps: [{ title: 'Press ArrowDown', duration: 30 }],
            },
            { title: 'Verify the chosen fruit', duration: 0 },
          ];
          const att = (retry) => [
            { name: 'screenshot', contentType: 'image/png', path: shotFail },
            { name: 'video', contentType: 'video/webm', path: video },
            ...(retry === 1
              ? [{ name: 'trace', contentType: 'application/zip', path: trace }]
              : []),
            ...(hostile && retry === 0
              ? [
                  {
                    name: HOSTILE_ATTACHMENT,
                    contentType: 'image/png',
                    path: shotFail,
                  },
                ]
              : []),
          ];
          return {
            ...base,
            status: 'unexpected',
            results: [0, 1, 2].map((r) =>
              result(r, 'failed', 5600 + r * 120, {
                error: keyboardError,
                steps,
                attachments: att(r),
              })
            ),
          };
        }
        // Failing: upload times out on Firefox; one attachment file is missing.
        if (si === 4 && ti === 0 && browser === 'firefox') {
          const steps = [
            { title: 'Choose the file', duration: 340 },
            {
              title: 'Wait for the upload confirmation',
              duration: 29600,
              error: {
                message:
                  'Error: page.waitForSelector: Test timeout of 30000ms exceeded.',
              },
            },
          ];
          return {
            ...base,
            status: 'unexpected',
            results: [0, 1].map((r) =>
              result(r, 'timedOut', 30000 + r * 15, {
                error: timeoutError,
                steps,
                attachments: [
                  {
                    name: 'screenshot',
                    contentType: 'image/png',
                    path: shotFail,
                  },
                  { name: 'video', contentType: 'video/webm', path: missing },
                ],
              })
            ),
          };
        }
        // Flaky: fails first, passes on retry with a trace.
        if (si === 1 && ti === 1 && browser === 'chromium') {
          return {
            ...base,
            status: 'flaky',
            results: [
              result(0, 'failed', 3100, {
                error: flakyError,
                steps: [
                  { title: 'Open the app', duration: 280 },
                  {
                    title: 'Click Get location',
                    duration: 2700,
                    error: flakyError,
                  },
                ],
                attachments: [
                  {
                    name: 'screenshot',
                    contentType: 'image/png',
                    path: shotFlaky,
                  },
                ],
              }),
              result(1, 'passed', 1450, {
                steps: [
                  { title: 'Open the app', duration: 260 },
                  { title: 'Click Get location', duration: 980 },
                ],
                attachments: [
                  {
                    name: 'trace',
                    contentType: 'application/zip',
                    path: trace,
                  },
                ],
              }),
            ],
          };
        }
        // Skipped outside Chromium.
        if (si === 1 && ti === 2 && browser !== 'chromium') {
          const annotations = [
            {
              type: 'skip',
              description: 'Permission prompts are Chromium-only in this suite',
            },
          ];
          return {
            ...base,
            annotations,
            expectedStatus: 'skipped',
            status: 'skipped',
            results: [result(0, 'skipped', 0, { annotations })],
          };
        }
        const extra =
          si === 5 && ti === 0 && browser === 'chromium'
            ? [
                {
                  name: 'console.log',
                  contentType: 'text/plain',
                  body: Buffer.from('Menu opened\nSubmenu opened\n').toString(
                    'base64'
                  ),
                },
              ]
            : [];
        return {
          ...base,
          status: 'expected',
          results: [
            result(0, 'passed', d, {
              steps: okSteps(title, d),
              attachments: extra,
            }),
          ],
        };
      });
      return {
        title,
        ok: !tests.some((t) => t.status === 'unexpected'),
        tags: si === 2 ? ['@smoke'] : [],
        tests,
        id: 'spec-' + si + '-' + ti,
        file: spec.file,
        line,
        column: 5,
      };
    });
    // describe blocks nest inside the file suite
    let inner = {
      title: spec.suite[spec.suite.length - 1],
      file: spec.file,
      line: 10,
      column: 6,
      specs,
      suites: [],
    };
    for (let k = spec.suite.length - 2; k >= 0; k--) {
      inner = {
        title: spec.suite[k],
        file: spec.file,
        line: 8,
        column: 6,
        specs: [],
        suites: [inner],
      };
    }
    return {
      title: spec.file,
      file: spec.file,
      line: 0,
      column: 0,
      specs: [],
      suites: [inner],
    };
  });

  const all = suites.flatMap(function flat(s) {
    return [
      ...(s.specs || []).flatMap((sp) => sp.tests),
      ...(s.suites || []).flatMap(flat),
    ];
  });
  const count = (st) => all.filter((t) => t.status === st).length;
  return {
    config: {
      configFile: ROOT + '/playwright.config.ts',
      rootDir: ROOT + '/tests',
      version: '1.65.1',
      projects: BROWSERS.map((b) => ({ id: b, name: b })),
    },
    suites,
    errors: [],
    stats: {
      startTime: new Date(started).toISOString(),
      duration: 252400,
      expected: count('expected'),
      skipped: count('skipped'),
      unexpected: count('unexpected'),
      flaky: count('flaky'),
    },
  };
}

/** A run where everything passes (hides "Needs attention"). */
export function passingReport(dir) {
  const r = mixedReport(dir);
  const walk = (s) => {
    for (const sp of s.specs || []) {
      for (const t of sp.tests) {
        t.status = 'expected';
        t.expectedStatus = 'passed';
        t.annotations = [];
        const last = t.results[t.results.length - 1];
        last.status = 'passed';
        last.retry = 0;
        last.duration = last.duration || 900;
        delete last.error;
        last.errors = [];
        last.annotations = [];
        last.attachments = [];
        last.steps = [{ title: 'Open the app', duration: 300 }];
        t.results = [last];
      }
    }
    (s.suites || []).forEach(walk);
  };
  r.suites.forEach(walk);
  Object.assign(r.stats, { expected: 72, skipped: 0, unexpected: 0, flaky: 0 });
  return r;
}
