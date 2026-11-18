import { Page, Locator } from '@playwright/test';

export const SUPERHEROES = [
  {
    name: 'Spider-Man',
    email: 'spider-man@avengers.com',
    realName: 'Peter Parker',
  },
  {
    name: 'Captain America',
    email: 'captain-america@avengers.com',
    realName: 'Steve Rogers',
  },
  { name: 'Hulk', email: 'hulk@avengers.com', realName: 'Robert Bruce Banner' },
  {
    name: 'Iron Man',
    email: 'iron-man@avengers.com',
    realName: "Anthony 'Tony' Stark",
  },
  { name: 'Ant-Man', email: 'ant-man@avengers.com', realName: "Eric O'Grady" },
  { name: 'Deadpool', email: 'deadpool@avengers.com', realName: 'Wade Wilson' },
  {
    name: 'Doctor Strange',
    email: 'doctor-strange@avengers.com',
    realName: 'Stephen Vincent Strange',
  },
  {
    name: 'Black Widow',
    email: 'black-widow@avengers.com',
    realName: 'Natasha Alianovna Romanova',
  },
] as const;

export const TABLE_DATA_URL = '**/apps/dynamic-table/database/db1.json';

export class DynamicTable {
  readonly page: Page;
  readonly table: Locator;
  readonly columnHeaders: Locator;
  readonly rows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = page.getByRole('table');
    this.columnHeaders = this.table.getByRole('columnheader');
    // Data rows are every row that is not the header row
    this.rows = this.table
      .getByRole('row')
      .filter({ hasNot: page.getByRole('columnheader') });
  }

  rowFor(heroName: string): Locator {
    return this.rows.filter({
      has: this.page.getByText(heroName, { exact: true }),
    });
  }

  heroCell(heroName: string): Locator {
    return this.rowFor(heroName).getByRole('cell').nth(0);
  }

  statusCell(heroName: string): Locator {
    return this.rowFor(heroName).getByRole('cell').nth(1);
  }

  realNameCell(heroName: string): Locator {
    return this.rowFor(heroName).getByRole('cell').nth(2);
  }

  // Avatars have alt="" so they are presentational and have no img role
  avatar(heroName: string): Locator {
    return this.rowFor(heroName).locator('img');
  }

  async getHeroOrder(): Promise<string[]> {
    return this.rows.evaluateAll((rows) =>
      rows.map((row) => row.querySelector('td')?.innerText.trim() ?? '')
    );
  }
}
