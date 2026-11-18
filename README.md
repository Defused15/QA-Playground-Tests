# QA Playground Tests

> Automated E2E test suite for [qaplayground.dev](https://qaplayground.dev) — built with Playwright, structured with Page Object Model, and deployed with GitHub Actions.

[![Tests](https://github.com/Defused15/QA-Playground-Tests/actions/workflows/playwright.yml/badge.svg)](https://github.com/Defused15/QA-Playground-Tests/actions/workflows/playwright.yml)
[![Playwright](https://img.shields.io/badge/tested%20with-Playwright-45ba4b?logo=playwright)](https://playwright.dev/)
[![License: ISC](https://img.shields.io/badge/license-ISC-blue)](LICENSE)

---

## 📊 Test Reports

| Report | Link |
|--------|------|
| 🎨 Custom Dashboard | [defused15.github.io/QA-Playground-Tests/dashboard.html](https://defused15.github.io/QA-Playground-Tests/dashboard.html) |
| 🎭 Playwright Native | [defused15.github.io/QA-Playground-Tests](https://defused15.github.io/QA-Playground-Tests/) |

Reports are automatically deployed to GitHub Pages on every push to `main`.

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
├── reporter-template.html        # Custom dashboard template
├── generate-dashboard.mjs        # Dashboard generation script
├── playwright.config.ts
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

- [Node.js](https://nodejs.org/) v20+ (LTS recommended)
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

# Run with the JSON reporter (required for the custom dashboard)
npx playwright test --reporter=html,json
```

### Generating the Custom Dashboard

After running tests with the JSON reporter, generate the dashboard locally:

```sh
node generate-dashboard.mjs \
  --json     ./playwright-report/report.json \
  --html     ./playwright-report/dashboard.html \
  --template ./reporter-template.html
```

Then open `playwright-report/dashboard.html` in your browser.

---

## CI / CD

This project uses **GitHub Actions** to run the full test suite on every push to `main` or `dev`, on every pull request, and on a weekly schedule (Mondays 06:00 UTC). The job runs on `ubuntu-24.04`, the OS the Linux visual baselines were recorded on.

On the first day of each month, a `keepalive` job re-enables the workflow through the GitHub API. This resets GitHub's 60-day inactivity timer, so the schedule is not disabled when the repository goes quiet.

The pipeline:
1. Installs dependencies and Playwright browsers
2. Runs all tests across Chromium, Firefox, and WebKit
3. Generates the custom HTML dashboard from the JSON output
4. Uploads the report folder as a downloadable artifact (retained 30 days)
5. Deploys both reports to GitHub Pages

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
| [QR Code Generator](https://qaplayground.dev/apps/qr-code-generator/) | [`qr.spec.ts`](tests/qr.spec.ts) | 2 | QR rendering with a visual baseline |
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