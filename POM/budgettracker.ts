import { Page, Locator } from '@playwright/test';

export const BUDGET_STORAGE_KEY = 'budget-tracker-entries-dev';

export type EntryType = 'income' | 'expense';

export interface BudgetEntry {
  description?: string;
  type?: EntryType;
  amount?: string;
  date?: string;
}

export class BudgetTracker {
  readonly page: Page;
  readonly table: Locator;
  readonly columnHeaders: Locator;
  readonly entryRows: Locator;
  readonly newEntryButton: Locator;
  readonly totalCell: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = page.getByRole('table');
    this.columnHeaders = this.table.getByRole('columnheader');
    // Entry rows are the only rows that contain a delete button
    this.entryRows = this.table
      .getByRole('row')
      .filter({ has: page.getByRole('button', { name: '✕' }) });
    this.newEntryButton = page.getByRole('button', { name: 'New Entry' });
    this.totalCell = page.getByRole('cell', { name: /^Total:/ });
  }

  row(index: number): Locator {
    return this.entryRows.nth(index);
  }

  // Date inputs expose different roles per browser, so match by type
  dateInput(index: number): Locator {
    return this.row(index).locator('input[type="date"]');
  }

  descriptionInput(index: number): Locator {
    return this.row(index).getByPlaceholder('Add a Description');
  }

  typeSelect(index: number): Locator {
    return this.row(index).getByRole('combobox');
  }

  amountInput(index: number): Locator {
    return this.row(index).getByRole('spinbutton');
  }

  deleteButton(index: number): Locator {
    return this.row(index).getByRole('button', { name: '✕' });
  }

  async addEntry() {
    await this.newEntryButton.click();
  }

  // The app saves and recalculates on "change", which text inputs fire on blur
  async setAmount(index: number, amount: string) {
    await this.amountInput(index).fill(amount);
    await this.amountInput(index).blur();
  }

  async setDescription(index: number, description: string) {
    await this.descriptionInput(index).fill(description);
    await this.descriptionInput(index).blur();
  }

  async setDate(index: number, date: string) {
    await this.dateInput(index).fill(date);
    await this.dateInput(index).blur();
  }

  async setType(index: number, type: EntryType) {
    await this.typeSelect(index).selectOption(type);
  }

  async addFilledEntry(entry: BudgetEntry) {
    const index = await this.entryRows.count();
    await this.addEntry();
    if (entry.date !== undefined) await this.setDate(index, entry.date);
    if (entry.description !== undefined) {
      await this.setDescription(index, entry.description);
    }
    if (entry.type !== undefined) await this.setType(index, entry.type);
    if (entry.amount !== undefined) await this.setAmount(index, entry.amount);
  }

  async deleteEntry(index: number) {
    await this.deleteButton(index).click();
  }

  async getStoredEntries(): Promise<unknown> {
    return this.page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? 'null'),
      BUDGET_STORAGE_KEY
    );
  }
}
