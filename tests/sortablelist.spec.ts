import { expect, test } from '@playwright/test';
import { testSetup } from '../POM/Hooks/before-each';
import { testTeardown } from '../POM/Hooks/after-each';
import {
  SortableList,
  RICHEST_PEOPLE,
  expectedMark,
} from '../POM/sortablelist';

let list: SortableList;

test.describe('Sortable List', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await testSetup(page, testInfo);
    await page.goto('/apps/sortable-list/');
    list = new SortableList(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await testTeardown(page, testInfo);
  });

  test.describe('Happy path', () => {
    test('Displays heading, instructions and ten numbered items', async () => {
      await test.step('Heading and instructions are visible', async () => {
        await expect(list.heading).toBeVisible();
        await expect(list.instructions).toBeVisible();
      });

      await test.step('List has ten items numbered 1 to 10', async () => {
        await expect(list.items).toHaveCount(10);
        for (let i = 0; i < 10; i++) {
          await expect(list.numberAt(i)).toHaveText(String(i + 1));
        }
      });

      await test.step('Check Order button is visible', async () => {
        await expect(list.checkOrderButton).toBeVisible();
      });
    });

    test('List contains each of the richest people exactly once', async () => {
      await test.step('Wait for all ten names to render', async () => {
        await expect(list.names).toHaveCount(10);
      });

      await test.step('Names match the expected set with no duplicates', async () => {
        const names = await list.getNames();
        expect([...names].sort()).toEqual([...RICHEST_PEOPLE].sort());
      });
    });

    test('Dragging an item onto another swaps their positions', async () => {
      const before = await list.getNames();

      await test.step('Drag the first item onto the third item', async () => {
        await list.dragItem(0, 2);
      });

      await test.step('First and third names are swapped, others unchanged', async () => {
        const expected = [...before];
        [expected[0], expected[2]] = [expected[2], expected[0]];
        await expect(list.names).toHaveText(expected);
      });
    });

    test('Sorting into the correct order marks every item as right', async () => {
      await test.step('Drag items into the correct order', async () => {
        await list.sortIntoCorrectOrder();
        await expect(list.names).toHaveText([...RICHEST_PEOPLE]);
      });

      await test.step('Click Check Order', async () => {
        await list.checkOrder();
      });

      await test.step('Every item is marked right and none wrong', async () => {
        for (let i = 0; i < 10; i++) {
          await expect(list.items.nth(i)).toContainClass('right');
          await expect(list.items.nth(i)).not.toContainClass('wrong');
        }
      });
    });

    test('Check Order marks each item right or wrong by its position', async () => {
      const names = await list.getNames();

      await test.step('Click Check Order on the shuffled list', async () => {
        await list.checkOrder();
      });

      await test.step('Each item is marked according to its position', async () => {
        for (let i = 0; i < 10; i++) {
          await expect(list.items.nth(i)).toContainClass(
            expectedMark(names[i], i)
          );
        }
      });
    });
  });

  test.describe('Edge cases', () => {
    test('Dropping an item onto itself leaves the order unchanged', async () => {
      const before = await list.getNames();

      await test.step('Drag the fourth item onto itself', async () => {
        await list.dragItem(3, 3);
      });

      await test.step('Order is unchanged', async () => {
        await expect(list.names).toHaveText(before);
      });
    });

    test('Swapping the same pair twice restores the original order', async () => {
      const before = await list.getNames();

      await test.step('Swap the first and last items', async () => {
        await list.dragItem(0, 9);
        await expect(list.names.first()).toHaveText(before[9]);
      });

      await test.step('Swap them back', async () => {
        await list.dragItem(0, 9);
      });

      await test.step('Original order is restored', async () => {
        await expect(list.names).toHaveText(before);
      });
    });

    test('Position numbers stay fixed while names move', async () => {
      await test.step('Perform several drags in a row', async () => {
        await list.dragItem(0, 5);
        await list.dragItem(9, 1);
        await list.dragItem(4, 7);
      });

      await test.step('Numbers still run from 1 to 10', async () => {
        for (let i = 0; i < 10; i++) {
          await expect(list.numberAt(i)).toHaveText(String(i + 1));
        }
      });
    });

    test('Initial order is shuffled on every load', async ({ page }) => {
      const orders = new Set<string>();

      await test.step('Record the order over three page loads', async () => {
        await expect(list.names).toHaveCount(10);
        orders.add((await list.getNames()).join('|'));
        for (let reload = 0; reload < 2; reload++) {
          await page.reload();
          await expect(list.names).toHaveCount(10);
          orders.add((await list.getNames()).join('|'));
        }
      });

      await test.step('At least two different orders were seen', async () => {
        expect(orders.size).toBeGreaterThan(1);
      });
    });

    test('Check Order can be triggered with the keyboard', async ({ page }) => {
      await test.step('Focus the Check Order button and press Enter', async () => {
        await list.checkOrderButton.focus();
        await expect(list.checkOrderButton).toBeFocused();
        await page.keyboard.press('Enter');
      });

      await test.step('Every item has been evaluated', async () => {
        for (let i = 0; i < 10; i++) {
          await expect(list.items.nth(i)).toHaveClass(/\b(right|wrong)\b/);
        }
      });
    });

    test('Dragging works on a mobile viewport', async ({ page }) => {
      await test.step('Resize to a phone viewport', async () => {
        await page.setViewportSize({ width: 375, height: 667 });
        await expect(list.items).toHaveCount(10);
      });

      const before = await list.getNames();

      await test.step('Swap the first two items', async () => {
        await list.dragItem(0, 1);
      });

      await test.step('First two names are swapped', async () => {
        await expect(list.names.nth(0)).toHaveText(before[1]);
        await expect(list.names.nth(1)).toHaveText(before[0]);
      });
    });
  });

  test.describe('Negative cases', () => {
    test('Items are not marked before Check Order is clicked', async () => {
      await test.step('Swap two items without checking', async () => {
        await list.dragItem(0, 1);
      });

      await test.step('No item is marked right or wrong', async () => {
        for (let i = 0; i < 10; i++) {
          await expect(list.items.nth(i)).not.toHaveClass(/\b(right|wrong)\b/);
        }
      });
    });

    test('Clicking an item without dragging does not reorder', async () => {
      const before = await list.getNames();

      await test.step('Click the first and last items', async () => {
        await list.draggableAt(0).click();
        await list.draggableAt(9).click();
      });

      await test.step('Order is unchanged', async () => {
        await expect(list.names).toHaveText(before);
      });
    });

    test('Check Order does not reorder the list', async () => {
      const before = await list.getNames();

      await test.step('Click Check Order twice', async () => {
        await list.checkOrder();
        await list.checkOrder();
      });

      await test.step('Order is unchanged', async () => {
        await expect(list.names).toHaveText(before);
      });
    });

    // Bug: re-checking adds "wrong" but never removes a previous "right" class
    test('Item moved out of place after a correct check keeps both classes', async () => {
      await test.step('Sort correctly and check', async () => {
        await list.sortIntoCorrectOrder();
        await list.checkOrder();
        await expect(list.items.first()).toContainClass('right');
      });

      await test.step('Swap the first two items and check again', async () => {
        await list.dragItem(0, 1);
        await list.checkOrder();
      });

      await test.step('Moved items are flagged wrong but still marked right', async () => {
        for (const i of [0, 1]) {
          await expect(list.items.nth(i)).toContainClass('wrong');
          await expect(list.items.nth(i)).toContainClass('right');
        }
        await expect(list.items.nth(2)).not.toContainClass('wrong');
      });
    });
  });
});
