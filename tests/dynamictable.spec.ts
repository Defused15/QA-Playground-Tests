import { expect, test } from '@playwright/test';
import { testSetup } from '../POM/Hooks/before-each';
import { testTeardown } from '../POM/Hooks/after-each';
import { DynamicTable, SUPERHEROES, TABLE_DATA_URL } from '../POM/dynamictable';

let table: DynamicTable;

test.describe('Dynamic Table', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await testSetup(page, testInfo);
    await page.goto('/apps/dynamic-table/');
    table = new DynamicTable(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await testTeardown(page, testInfo);
  });

  test.describe('Happy path', () => {
    test('Table shows the expected column headers', async () => {
      await test.step('Headers are Superhero, Status and Real Name', async () => {
        await expect(table.columnHeaders).toHaveText([
          'Superhero',
          'Status',
          'Real Name',
        ]);
      });
    });

    test('Table loads one row per superhero', async () => {
      await test.step('Eight data rows are rendered', async () => {
        await expect(table.rows).toHaveCount(SUPERHEROES.length);
      });

      await test.step('Every row has three cells', async () => {
        for (let i = 0; i < SUPERHEROES.length; i++) {
          await expect(table.rows.nth(i).getByRole('cell')).toHaveCount(3);
        }
      });
    });

    test("Spider-Man's real name is Peter Parker", async () => {
      await test.step('Find the Spider-Man row regardless of position', async () => {
        await expect(table.rowFor('Spider-Man')).toHaveCount(1);
      });

      await test.step('Real name cell shows Peter Parker', async () => {
        await expect(table.realNameCell('Spider-Man')).toHaveText(
          'Peter Parker'
        );
      });
    });

    test('Every superhero row shows the matching email and real name', async () => {
      await test.step('Wait for the data to load', async () => {
        await expect(table.rows).toHaveCount(SUPERHEROES.length);
      });

      for (const hero of SUPERHEROES) {
        await test.step(`${hero.name} row is correct`, async () => {
          await expect(table.heroCell(hero.name)).toContainText(hero.email);
          await expect(table.realNameCell(hero.name)).toHaveText(hero.realName);
        });
      }
    });

    test('Every superhero has Active status', async () => {
      await test.step('Wait for the data to load', async () => {
        await expect(table.rows).toHaveCount(SUPERHEROES.length);
      });

      await test.step('Status cell of every hero reads Active', async () => {
        for (const hero of SUPERHEROES) {
          await expect(table.statusCell(hero.name)).toHaveText('Active');
        }
      });
    });
  });

  test.describe('Edge cases', () => {
    test('Row order is shuffled between page loads', async ({ page }) => {
      const orders = new Set<string>();

      await test.step('Record the row order over three page loads', async () => {
        await expect(table.rows).toHaveCount(SUPERHEROES.length);
        orders.add((await table.getHeroOrder()).join('|'));
        for (let reload = 0; reload < 2; reload++) {
          await page.reload();
          await expect(table.rows).toHaveCount(SUPERHEROES.length);
          orders.add((await table.getHeroOrder()).join('|'));
        }
      });

      await test.step('At least two different orders were seen', async () => {
        expect(orders.size).toBeGreaterThan(1);
      });
    });

    test('Real name lookup is stable after reload', async ({ page }) => {
      await test.step('Spider-Man is Peter Parker on first load', async () => {
        await expect(table.realNameCell('Spider-Man')).toHaveText(
          'Peter Parker'
        );
      });

      await test.step('Reload the page', async () => {
        await page.reload();
        await expect(table.rows).toHaveCount(SUPERHEROES.length);
      });

      await test.step('Spider-Man is still Peter Parker', async () => {
        await expect(table.realNameCell('Spider-Man')).toHaveText(
          'Peter Parker'
        );
      });
    });

    test('Every superhero avatar image loads', async () => {
      await test.step('Wait for the data to load', async () => {
        await expect(table.rows).toHaveCount(SUPERHEROES.length);
      });

      await test.step('Each avatar is visible and decoded', async () => {
        for (const hero of SUPERHEROES) {
          await expect(table.avatar(hero.name)).toBeVisible();
          await expect(table.avatar(hero.name)).toHaveJSProperty(
            'complete',
            true
          );
          await expect(table.avatar(hero.name)).not.toHaveJSProperty(
            'naturalWidth',
            0
          );
        }
      });
    });

    test('Table is usable on a mobile viewport', async ({ page }) => {
      await test.step('Resize to a phone viewport', async () => {
        await page.setViewportSize({ width: 375, height: 667 });
      });

      await test.step('All rows are still rendered', async () => {
        await expect(table.rows).toHaveCount(SUPERHEROES.length);
      });

      // Quirk: cells use whitespace-nowrap, so the table overflows the page sideways
      await test.step('Table is wider than the viewport', async () => {
        await expect
          .poll(async () => (await table.table.boundingBox())?.width ?? 0)
          .toBeGreaterThan(375);
      });

      await test.step('Spider-Man real name can be scrolled to and read', async () => {
        await table.realNameCell('Spider-Man').scrollIntoViewIfNeeded();
        await expect(table.realNameCell('Spider-Man')).toBeInViewport();
        await expect(table.realNameCell('Spider-Man')).toHaveText(
          'Peter Parker'
        );
      });
    });
  });

  test.describe('Negative cases', () => {
    test('Unknown superhero is not listed', async () => {
      await test.step('Wait for the data to load', async () => {
        await expect(table.rows).toHaveCount(SUPERHEROES.length);
      });

      await test.step('No row exists for Thor', async () => {
        await expect(table.rowFor('Thor')).toHaveCount(0);
      });
    });

    test('Superhero names are not duplicated', async () => {
      await test.step('Wait for the data to load', async () => {
        await expect(table.rows).toHaveCount(SUPERHEROES.length);
      });

      await test.step('Every hero name is unique', async () => {
        const names = await table.getHeroOrder();
        expect(new Set(names).size).toBe(SUPERHEROES.length);
      });
    });

    test('Failed data request leaves the table empty', async ({ page }) => {
      await test.step('Block the data request and reload', async () => {
        await page.route(TABLE_DATA_URL, (route) => route.abort());
        const failed = page.waitForEvent('requestfailed', (request) =>
          request.url().endsWith('/db1.json')
        );
        await page.reload();
        await failed;
      });

      await test.step('Headers render but no data rows do', async () => {
        await expect(table.columnHeaders).toHaveCount(3);
        await expect(table.rows).toHaveCount(0);
      });
    });

    test('Empty data response renders no rows', async ({ page }) => {
      await test.step('Serve an empty list and reload', async () => {
        await page.route(TABLE_DATA_URL, (route) =>
          route.fulfill({ json: [] })
        );
        const response = page.waitForResponse(TABLE_DATA_URL);
        await page.reload();
        await response;
      });

      await test.step('Table has headers and no data rows', async () => {
        await expect(table.columnHeaders).toHaveCount(3);
        await expect(table.rows).toHaveCount(0);
      });
    });

    test('Single-row data response renders exactly that row', async ({
      page,
    }) => {
      await test.step('Serve only Spider-Man and reload', async () => {
        await page.route(TABLE_DATA_URL, (route) =>
          route.fulfill({
            json: [
              {
                id: 1,
                name: 'Spider-Man',
                email: 'spider-man@avengers.com',
                profile: 'spiderman.jpg',
                real_name: 'Peter Parker',
              },
            ],
          })
        );
        await page.reload();
      });

      await test.step('Only the Spider-Man row is rendered', async () => {
        await expect(table.rows).toHaveCount(1);
        await expect(table.realNameCell('Spider-Man')).toHaveText(
          'Peter Parker'
        );
      });
    });
  });
});
