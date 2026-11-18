import { expect, test } from '@playwright/test';
import { testSetup } from '../POM/Hooks/before-each';
import { testTeardown } from '../POM/Hooks/after-each';
import { BudgetTracker, BUDGET_STORAGE_KEY } from '../POM/budgettracker';

let budget: BudgetTracker;

test.describe('Budget Tracker', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await testSetup(page, testInfo);
    await page.goto('/apps/budget-tracker/');
    budget = new BudgetTracker(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await testTeardown(page, testInfo);
  });

  test.describe('Happy path', () => {
    test('Empty tracker shows headers, no entries and a zero total', async () => {
      await test.step('Column headers are shown', async () => {
        await expect(budget.columnHeaders).toHaveText([
          'Date',
          'Description',
          'Type',
          'Amount',
          '',
        ]);
      });

      await test.step('There are no entries and the total is $0.00', async () => {
        await expect(budget.entryRows).toHaveCount(0);
        await expect(budget.totalCell).toHaveText('Total: $0.00');
      });
    });

    test('New entry starts with default values', async ({ page }) => {
      const today = await page.evaluate(() =>
        new Date().toISOString().replace(/T.*/, '')
      );

      await test.step('Click New Entry', async () => {
        await budget.addEntry();
        await expect(budget.entryRows).toHaveCount(1);
      });

      await test.step("Row defaults to today's date, Income and 0", async () => {
        await expect(budget.dateInput(0)).toHaveValue(today);
        await expect(budget.descriptionInput(0)).toHaveValue('');
        await expect(budget.typeSelect(0)).toHaveValue('income');
        await expect(budget.amountInput(0)).toHaveValue('0');
      });

      await test.step('Total stays at $0.00', async () => {
        await expect(budget.totalCell).toHaveText('Total: $0.00');
      });
    });

    test('Income entry increases the total', async () => {
      await test.step('Add a $1500 income entry', async () => {
        await budget.addFilledEntry({
          description: 'Salary',
          type: 'income',
          amount: '1500',
        });
      });

      await test.step('Total is $1,500.00', async () => {
        await expect(budget.totalCell).toHaveText('Total: $1,500.00');
      });
    });

    test('Expense entry decreases the total', async () => {
      await test.step('Add a $40 expense entry', async () => {
        await budget.addFilledEntry({
          description: 'Groceries',
          type: 'expense',
          amount: '40',
        });
      });

      await test.step('Total is -$40.00', async () => {
        await expect(budget.totalCell).toHaveText('Total: -$40.00');
      });
    });

    test('Total sums mixed income and expense entries', async () => {
      await test.step('Add one income and two expenses', async () => {
        await budget.addFilledEntry({
          description: 'Wages',
          type: 'income',
          amount: '1000',
        });
        await budget.addFilledEntry({
          description: 'Rent',
          type: 'expense',
          amount: '250.50',
        });
        await budget.addFilledEntry({
          description: 'Bills',
          type: 'expense',
          amount: '49.50',
        });
      });

      await test.step('Total is $700.00', async () => {
        await expect(budget.entryRows).toHaveCount(3);
        await expect(budget.totalCell).toHaveText('Total: $700.00');
      });
    });

    test('Deleting an entry recalculates the total', async () => {
      await test.step('Add an income and an expense', async () => {
        await budget.addFilledEntry({ type: 'income', amount: '100' });
        await budget.addFilledEntry({ type: 'expense', amount: '30' });
        await expect(budget.totalCell).toHaveText('Total: $70.00');
      });

      await test.step('Delete the expense entry', async () => {
        await budget.deleteEntry(1);
      });

      await test.step('Only the income remains in the total', async () => {
        await expect(budget.entryRows).toHaveCount(1);
        await expect(budget.totalCell).toHaveText('Total: $100.00');
      });
    });

    test('Entries persist after reload', async ({ page }) => {
      await test.step('Add a fully filled entry', async () => {
        await budget.addFilledEntry({
          date: '2024-01-15',
          description: 'Freelance',
          type: 'expense',
          amount: '75.25',
        });
        await expect(budget.totalCell).toHaveText('Total: -$75.25');
      });

      await test.step('Reload the page', async () => {
        await page.reload();
      });

      await test.step('Entry and total are restored', async () => {
        await expect(budget.entryRows).toHaveCount(1);
        await expect(budget.dateInput(0)).toHaveValue('2024-01-15');
        await expect(budget.descriptionInput(0)).toHaveValue('Freelance');
        await expect(budget.typeSelect(0)).toHaveValue('expense');
        await expect(budget.amountInput(0)).toHaveValue('75.25');
        await expect(budget.totalCell).toHaveText('Total: -$75.25');
      });
    });
  });

  test.describe('Edge cases', () => {
    test('Decimal amounts are summed without floating point noise', async () => {
      await test.step('Add $0.10 and $0.20 income entries', async () => {
        await budget.addFilledEntry({ amount: '0.1' });
        await budget.addFilledEntry({ amount: '0.2' });
      });

      await test.step('Total is $0.30', async () => {
        await expect(budget.totalCell).toHaveText('Total: $0.30');
      });
    });

    test('Large amounts are formatted with separators and rounded to cents', async () => {
      await test.step('Add a 1234567.891 income entry', async () => {
        await budget.addFilledEntry({ amount: '1234567.891' });
      });

      await test.step('Total is $1,234,567.89', async () => {
        await expect(budget.totalCell).toHaveText('Total: $1,234,567.89');
      });
    });

    test('Switching an entry from income to expense flips the total', async () => {
      await test.step('Add a $200 income entry', async () => {
        await budget.addFilledEntry({ type: 'income', amount: '200' });
        await expect(budget.totalCell).toHaveText('Total: $200.00');
      });

      await test.step('Change its type to expense', async () => {
        await budget.setType(0, 'expense');
      });

      await test.step('Total becomes -$200.00', async () => {
        await expect(budget.totalCell).toHaveText('Total: -$200.00');
      });
    });

    test('Deleting every entry resets the total and storage', async () => {
      await test.step('Add two entries', async () => {
        await budget.addFilledEntry({ amount: '10' });
        await budget.addFilledEntry({ amount: '20' });
        await expect(budget.totalCell).toHaveText('Total: $30.00');
      });

      await test.step('Delete both entries', async () => {
        await budget.deleteEntry(0);
        await budget.deleteEntry(0);
      });

      await test.step('Table is empty, total is $0.00 and storage is empty', async () => {
        await expect(budget.entryRows).toHaveCount(0);
        await expect(budget.totalCell).toHaveText('Total: $0.00');
        await expect.poll(() => budget.getStoredEntries()).toEqual([]);
      });
    });

    test('Entry can be added and priced using the keyboard', async ({
      page,
    }) => {
      await test.step('Focus New Entry and press Enter', async () => {
        await budget.newEntryButton.focus();
        await page.keyboard.press('Enter');
        await expect(budget.entryRows).toHaveCount(1);
      });

      await test.step('Type an amount and tab away', async () => {
        await budget.amountInput(0).focus();
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.type('55');
        await page.keyboard.press('Tab');
      });

      await test.step('Total updates to $55.00', async () => {
        await expect(budget.totalCell).toHaveText('Total: $55.00');
      });
    });

    test('Tracker works on a mobile viewport', async ({ page }) => {
      await test.step('Resize to a phone viewport', async () => {
        await page.setViewportSize({ width: 375, height: 667 });
        await expect(budget.newEntryButton).toBeVisible();
      });

      await test.step('Add an income entry', async () => {
        await budget.addFilledEntry({ amount: '12.34' });
      });

      await test.step('Total updates to $12.34', async () => {
        await expect(budget.totalCell).toHaveText('Total: $12.34');
      });
    });
  });

  test.describe('Negative cases', () => {
    test('Non-numeric text cannot be typed into the amount', async () => {
      await test.step('Add an entry and type letters into the amount', async () => {
        await budget.addEntry();
        await budget.amountInput(0).clear();
        await budget.amountInput(0).pressSequentially('abc');
        await budget.amountInput(0).blur();
      });

      await test.step('Amount stays empty and the total is $0.00', async () => {
        await expect(budget.amountInput(0)).toHaveValue('');
        await expect(budget.totalCell).toHaveText('Total: $0.00');
      });
    });

    test('Cleared amount counts as zero and reloads as 0', async ({ page }) => {
      await test.step('Add a $90 entry then clear its amount', async () => {
        await budget.addFilledEntry({ amount: '90' });
        await expect(budget.totalCell).toHaveText('Total: $90.00');
        await budget.setAmount(0, '');
      });

      await test.step('Total drops to $0.00', async () => {
        await expect(budget.totalCell).toHaveText('Total: $0.00');
      });

      await test.step('After reload the amount is 0', async () => {
        await page.reload();
        await expect(budget.amountInput(0)).toHaveValue('0');
        await expect(budget.totalCell).toHaveText('Total: $0.00');
      });
    });

    // App has no validation — a negative income is accepted and lowers the total
    test('Negative income amount is accepted', async () => {
      await test.step('Add an income entry of -50', async () => {
        await budget.addFilledEntry({ type: 'income', amount: '-50' });
      });

      await test.step('Total is -$50.00', async () => {
        await expect(budget.totalCell).toHaveText('Total: -$50.00');
      });
    });

    // Entries are only saved on a field change, so an untouched row is lost
    test('Untouched new entry is not saved across reload', async ({ page }) => {
      await test.step('Add an entry without editing it', async () => {
        await budget.addEntry();
        await expect(budget.entryRows).toHaveCount(1);
      });

      await test.step('Reload the page', async () => {
        await page.reload();
      });

      await test.step('Entry is gone', async () => {
        await expect(budget.newEntryButton).toBeVisible();
        await expect(budget.entryRows).toHaveCount(0);
      });
    });

    // Bug: load() does not guard JSON.parse, so bad data throws a page error
    test('Corrupted saved data throws but leaves the tracker usable', async ({
      page,
    }) => {
      const errors: Error[] = [];

      await test.step('Store invalid JSON and reload', async () => {
        await page.evaluate(
          (key) => localStorage.setItem(key, '{not valid json'),
          BUDGET_STORAGE_KEY
        );
        page.on('pageerror', (error) => errors.push(error));
        await page.reload();
      });

      await test.step('A page error is raised and no entries are shown', async () => {
        await expect.poll(() => errors.length).toBe(1);
        await expect(budget.entryRows).toHaveCount(0);
        await expect(budget.totalCell).toHaveText('Total: $0.00');
      });

      await test.step('New entries can still be added', async () => {
        await budget.addFilledEntry({ amount: '5' });
        await expect(budget.totalCell).toHaveText('Total: $5.00');
      });
    });
  });
});
