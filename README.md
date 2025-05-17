# QA-Playground-Tests

The QA Playground page has Mini Web Apps that I use to showcase my test skills.

## Project Structure

```
.
├── POM/                # Page Object Models and hooks
│   ├── rangeslider.ts
│   └── Hooks/
│       ├── after-each.ts
│       └── before-each.ts
├── tests/              # Playwright test specs
│   └── rangeslider.spec.ts
├── playwright.config.ts
├── package.json
├── .github/
│   └── workflows/
│       └── playwright.yml
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/Defused15/QA-Playground-Tests.git
   cd QA-Playground-Tests
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Install Playwright browsers:
   ```sh
   npx playwright install
   ```

### Running Tests

To run the range slider tests:

```sh
npm run test:range
```

Or run all Playwright tests:

```sh
npx playwright test
```

Test results and HTML reports will be available in the `playwright-report/` directory.

### CI Integration

This project uses GitHub Actions for CI. See [.github/workflows/playwright.yml](.github/workflows/playwright.yml).

## Project Details

- **Test Framework:** [Playwright](https://playwright.dev/)
- **Tested App:** [QA Playground](https://qaplayground.dev)
- **Page Object Model:** Implemented in [POM/rangeslider.ts](POM/rangeslider.ts)
- **Custom Hooks:** See [POM/Hooks/before-each.ts](POM/Hooks/before-each.ts) and [POM/Hooks/after-each.ts](POM/Hooks/after-each.ts)

## License

ISC

---
Feel free to contribute or open issues!
