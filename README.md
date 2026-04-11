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
├── POM/                          # Page Object Models
│   ├── api.ts
│   ├── qr.ts
│   ├── rangeslider.ts
│   ├── redirect.ts
│   └── Hooks/
│       ├── before-each.ts
│       └── after-each.ts
│
├── tests/                        # Playwright test specs
│   ├── api.spec.ts
│   ├── qr.spec.ts
│   ├── rangeslider.spec.ts
│   └── redirect.spec.ts
│
├── reporter-template.html        # Custom dashboard template
├── generate-dashboard.mjs        # Dashboard generation script
├── playwright.config.ts
├── package.json
│
└── .github/
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

This project uses **GitHub Actions** to run the full test suite on every push to `main` or `dev`, and on every pull request.

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

- **API Mini App** — request/response validation
- **QR Code Generator** — output and rendering checks
- **Range Slider** — value and interaction tests
- **Redirect** — navigation and history behavior

---

## License

ISC — feel free to fork, adapt, or contribute.