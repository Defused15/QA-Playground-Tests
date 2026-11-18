# QA Playground Tests

> Automated E2E test suite for [qaplayground.dev](https://qaplayground.dev) — built with Playwright, structured with Page Object Model, and deployed with GitHub Actions.

[![Tests](https://github.com/Defused15/QA-Playground-Tests/actions/workflows/playwright.yml/badge.svg)](https://github.com/Defused15/QA-Playground-Tests/actions/workflows/playwright.yml)
[![Playwright](https://img.shields.io/badge/tested%20with-Playwright-45ba4b?logo=playwright)](https://playwright.dev/)
[![License: ISC](https://img.shields.io/badge/license-ISC-blue)](LICENSE)

---

## 📊 Test Reports

| Report | Link |
|--------|------|
| 📊 E2E report | [defused15.github.io/QA-Playground-Tests](https://defused15.github.io/QA-Playground-Tests/) |
| 🎭 Raw Playwright report | [defused15.github.io/QA-Playground-Tests/playwright/](https://defused15.github.io/QA-Playground-Tests/playwright/) |

The E2E report lists every test per browser with its steps, errors, screenshots, videos, retries and a link to the trace in Playwright's Trace Viewer. Run history across CI runs lives on the [QA Hub](https://qa.rcastillo.dev/projects/QA-Playground-Tests.html). Both reports are deployed to GitHub Pages on every push to `main`.

To build and preview the report locally after a run (`npx playwright test` writes `playwright-report/report.json`):

```sh
npm run report:build            # playwright-report/report.json -> site/
npx serve site                  # or any static file server
```

---

## Project Structure

```
QA-Playground-Tests/
│
├── POM/                          # Page Objects: locators and actions only
│   ├── api.ts
│   ├── budgettracker.ts
│   ├── changingiframe.ts
│   ├── contextmenu.ts
│   ├── covered.ts
│   ├── download.ts
│   ├── dropdown.ts
│   ├── dynamictable.ts
│   ├── geolocation.ts
│   ├── iframe.ts
│   ├── jiraboard.ts
│   ├── menu.ts
│   ├── mousehover.ts
│   ├── newtab.ts
│   ├── onboardingmodal.ts
│   ├── popup.ts
│   ├── qr.ts
│   ├── rangeslider.ts
│   ├── rating.ts
│   ├── redirect.ts
│   ├── registerlogin.ts
│   ├── shadowdom.ts
│   ├── sortablelist.ts
│   ├── tagsinput.ts
│   ├── upload.ts
│   ├── verifyaccount.ts
│   └── Hooks/
│       ├── before-each.ts
│       └── after-each.ts
│
├── tests/                        # One spec per mini app
│   ├── api.spec.ts
│   ├── budgettracker.spec.ts
│   ├── changingiframe.spec.ts
│   ├── contextmenu.spec.ts
│   ├── covered.spec.ts
│   ├── download.spec.ts
│   ├── dropdown.spec.ts
│   ├── dynamictable.spec.ts
│   ├── geolocation.spec.ts
│   ├── iframe.spec.ts
│   ├── jiraboard.spec.ts
│   ├── menu.spec.ts
│   ├── mousehover.spec.ts
│   ├── newtab.spec.ts
│   ├── onboardingmodal.spec.ts
│   ├── popup.spec.ts
│   ├── qr.spec.ts
│   ├── rangeslider.spec.ts
│   ├── rating.spec.ts
│   ├── redirect.spec.ts
│   ├── registerlogin.spec.ts
│   ├── shadowdom.spec.ts
│   ├── sortablelist.spec.ts
│   ├── tagsinput.spec.ts
│   ├── upload.spec.ts
│   ├── verifyaccount.spec.ts
│   └── fixtures/upload/          # Small files used by the upload spec
│
├── __snapshots__/                # Visual baselines (per browser and OS)
├── scripts/report/               # Builds the static E2E report page (site/)
├── report-tests/                 # Tests for the report page (build + UI)
├── playwright.config.ts
├── playwright.report.config.mjs  # Config for the report page tests only
├── package.json
│
└── .github/
    ├── actions/playwright-report-hub/   # Pushes the JSON report to the QA Test Hub
    └── workflows/
        └── playwright.yml        # CI/CD pipeline
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 26 LTS, the version in `.nvmrc` that CI also uses (`nvm use` picks it up)
- [npm](https://www.npmjs.com/)

### Installation

```sh
# Clone the repo
git clone https://github.com/Defused15/QA-Playground-Tests.git
cd QA-Playground-Tests

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Running Tests

```sh
# Run all tests
npx playwright test

# Run a specific suite
npm run test:range
npx playwright test tests/jiraboard.spec.ts

# Lint and format (ESLint with the Google config, Prettier)
npm run lint
npm run format
```

### Visual Tests (Docker)

Pixel comparisons (tests tagged `@visual`) run only inside the official Playwright image, `mcr.microsoft.com/playwright:v1.65.1-noble`, the same image CI uses. Every machine then renders identically, so there is one Linux baseline per browser. Outside the container these comparisons are skipped, while the rest of each test (for example decoding the QR code) still runs.

With [Docker Desktop](https://www.docker.com/products/docker-desktop/) running:

```sh
# Compare against the baselines, exactly as CI does
npm run test:visual

# Re-record the baselines after an intended visual change (review the diff before committing)
npm run test:visual:update
```

When upgrading `@playwright/test`, update the image tag in `package.json` and the workflow too (`npm run check:playwright-image` enforces the match), then re-record the baselines.

### Building the Report Page

`npx playwright test` writes the native HTML report and `playwright-report/report.json`. Build the static report page from it:

```sh
npm run report:build    # writes site/index.html, site/assets/, site/attachments/ and site/playwright/
npm run test:report     # tests for the report page itself (fixture data, Chromium and WebKit)
```

Open `site/` with any static file server (for example `npx serve site`).

---

## CI / CD

This project uses **GitHub Actions** to run the full test suite on every push to `main` or `dev`, on every pull request, and on a weekly schedule (Mondays 06:00 UTC). Jobs run on `ubuntu-24.04`; browser jobs run inside the official Playwright container, where the visual baselines are recorded.

| Job | What it does |
|-----|--------------|
| `quality` | ESLint (Google config), TypeScript type check, Prettier format check, and a check that the Playwright Docker image tag matches `@playwright/test` |
| `e2e-tests` | One job per browser (Chromium, Firefox, WebKit) running in parallel inside the official Playwright container, each producing a blob report. Visual comparisons run here |
| `report` | Merges the blob reports, builds the report page into `site/`, uploads the reports as an artifact (30 days), deploys to GitHub Pages, pushes the JSON to the QA Test Hub, then fails the run if any test failed, none ran, or an executed test has no `test.step` |
| `report-ui` | Tests the report page itself (layout, keyboard, touch, contrast, escaping) with fixture data |
| `keepalive` | Monthly: re-enables the workflow through the GitHub API, resetting GitHub's 60-day inactivity timer so the schedule is never disabled |

Publishing to Pages and the QA Test Hub happens **only from `main`**: pull request and `dev` runs test everything but never replace the live report or the status badge. Superseded pull request runs are cancelled; runs on `main` queue so every publish completes.

Actions are pinned to full commit SHAs and kept current, together with the dev dependencies, by a monthly grouped Dependabot update.

See the full workflow: [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml)

### QA Test Hub Integration

This repository is integrated with the **[QA Test Hub](https://qa.rcastillo.dev)**. After each CI run, the `playwright-report-hub` custom action:
1. Pushes the JSON report to the `test-hub` repository.
2. Sends a `repository_dispatch` event to trigger an automatic rebuild of the global dashboard.

---

## Stack

| Tool | Purpose |
|------|---------|
| [Playwright](https://playwright.dev/) | E2E test framework |
| [TypeScript](https://www.typescriptlang.org/) | Language |
| [Page Object Model](https://playwright.dev/docs/pom) | Test architecture |
| [ESLint](https://eslint.org/) + [Google config](https://github.com/google/eslint-config-google) | Linting, with `eslint-plugin-playwright` |
| [Prettier](https://prettier.io/) | Formatting |
| [GitHub Actions](https://github.com/features/actions) | CI/CD |
| [GitHub Pages](https://pages.github.com/) | Report hosting |

---

## Tested Features

All 26 mini apps on qaplayground.dev are covered: **324 tests per browser, 972 in total** across Chromium, Firefox and WebKit. Each spec groups happy-path, edge and negative cases, and wraps each test phase in `test.step` so reports show a per-step breakdown.

| App | Spec | Tests per browser | Focus |
|-----|------|:---:|-------|
| [API Fetch](https://qaplayground.dev/apps/fetch/) | [`api.spec.ts`](tests/api.spec.ts) | 4 | Cards rendered from the JSONPlaceholder API match the response |
| [Budget Tracker](https://qaplayground.dev/apps/budget-tracker/) | [`budgettracker.spec.ts`](tests/budgettracker.spec.ts) | 18 | Income/expense entries, totals, persistence, input edge cases |
| [Changeable Iframe](https://qaplayground.dev/apps/changing-iframe/) | [`changingiframe.spec.ts`](tests/changingiframe.spec.ts) | 9 | Countdown and in-frame document swap |
| [Context Menu](https://qaplayground.dev/apps/context-menu/) | [`contextmenu.spec.ts`](tests/contextmenu.spec.ts) | 21 | Right-click menu, Share submenu, positioning, dismissal |
| [Covered Elements](https://qaplayground.dev/apps/covered/) | [`covered.spec.ts`](tests/covered.spec.ts) | 10 | Element hidden below a scroll container, keyboard reach |
| [Download](https://qaplayground.dev/apps/download/) | [`download.spec.ts`](tests/download.spec.ts) | 9 | File name, size and content of the downloaded PDF |
| [Multi-Level Dropdown](https://qaplayground.dev/apps/multi-level-dropdown/) | [`dropdown.spec.ts`](tests/dropdown.spec.ts) | 16 | Nested menus, back navigation, keyboard use |
| [Dynamic Table](https://qaplayground.dev/apps/dynamic-table/) | [`dynamictable.spec.ts`](tests/dynamictable.spec.ts) | 14 | Superhero rows, shuffled order, stubbed data responses |
| [Geolocation](https://qaplayground.dev/apps/geolocation/) | [`geolocation.spec.ts`](tests/geolocation.spec.ts) | 15 | Emulated coordinates, stubbed reverse geocoding, error paths |
| [Nested iFrame](https://qaplayground.dev/apps/iframe/) | [`iframe.spec.ts`](tests/iframe.spec.ts) | 5 | Two-level iframe content and interaction |
| [Jira Board](https://qaplayground.dev/apps/jira-board/) | [`jiraboard.spec.ts`](tests/jiraboard.spec.ts) | 23 | Create, drag, filter and delete issues, persistence, validation |
| [Navigation Menu](https://qaplayground.dev/apps/links/) | [`menu.spec.ts`](tests/menu.spec.ts) | 10 | Navigation links and Go Back flow |
| [Mouse Hover](https://qaplayground.dev/apps/mouse-hover/) | [`mousehover.spec.ts`](tests/mousehover.spec.ts) | 10 | Hover-revealed movie card |
| [New Tab](https://qaplayground.dev/apps/new-tab/) | [`newtab.spec.ts`](tests/newtab.spec.ts) | 10 | Link opening a new tab, opener isolation |
| [Onboarding Modal](https://qaplayground.dev/apps/onboarding-modal/) | [`onboardingmodal.spec.ts`](tests/onboardingmodal.spec.ts) | 14 | Random welcome modal, open/close, dismissal gaps |
| [Pop-Up Window](https://qaplayground.dev/apps/popup/) | [`popup.spec.ts`](tests/popup.spec.ts) | 9 | Popup window submit flow back to the opener |
| [QR Code Generator](https://qaplayground.dev/apps/qr-code-generator/) | [`qr.spec.ts`](tests/qr.spec.ts) | 2 | Decoded QR content plus a visual baseline recorded in Docker |
| [Range Slider](https://qaplayground.dev/apps/range-slider/) | [`rangeslider.spec.ts`](tests/rangeslider.spec.ts) | 12 | Slider ranges, emoji and background, feedback flow |
| [Star Rating](https://qaplayground.dev/apps/rating/) | [`rating.spec.ts`](tests/rating.spec.ts) | 13 | Star selection labels, hover preview, accessibility gaps |
| [Redirect Chain](https://qaplayground.dev/apps/redirect/) | [`redirect.spec.ts`](tests/redirect.spec.ts) | 2 | Redirect chain and Go Back |
| [Register & Login](https://qaplayground.dev/apps/register-login/) | [`registerlogin.spec.ts`](tests/registerlogin.spec.ts) | 24 | Registration, login, logout, form validation |
| [Shadow DOM](https://qaplayground.dev/apps/shadow-dom/) | [`shadowdom.spec.ts`](tests/shadowdom.spec.ts) | 11 | Progress bar inside an open shadow root |
| [Sortable List](https://qaplayground.dev/apps/sortable-list/) | [`sortablelist.spec.ts`](tests/sortablelist.spec.ts) | 15 | Drag-and-drop ordering and Check Order marking |
| [Tags Input Box](https://qaplayground.dev/apps/tags-input-box/) | [`tagsinput.spec.ts`](tests/tagsinput.spec.ts) | 19 | Adding/removing tags, limits, duplicates, whitespace |
| [Upload File](https://qaplayground.dev/apps/upload/) | [`upload.spec.ts`](tests/upload.spec.ts) | 15 | Image previews, multiple files, no type validation |
| [Verify Account](https://qaplayground.dev/apps/verify-account/) | [`verifyaccount.spec.ts`](tests/verifyaccount.spec.ts) | 14 | Six-digit code entry, focus movement, wrong codes |

---

## License

ISC — feel free to fork, adapt, or contribute.