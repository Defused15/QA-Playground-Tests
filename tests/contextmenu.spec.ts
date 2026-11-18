import { expect, test } from '@playwright/test';
import { testSetup } from '../POM/Hooks/before-each';
import { testTeardown } from '../POM/Hooks/after-each';
import { ContextMenu, SHARE_ITEMS, TOP_LEVEL_ITEMS } from '../POM/contextmenu';

const INITIAL_MESSAGE = 'Open Right-Click Context Menu';

let contextMenu: ContextMenu;

test.describe('Right-Click Context Menu', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await testSetup(page, testInfo);
    await page.goto('/apps/context-menu/');
    contextMenu = new ContextMenu(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await testTeardown(page, testInfo);
  });

  test.describe('Happy path', () => {
    test('Right-click opens the menu at the cursor position', async () => {
      await test.step('Right-click on an empty area of the page', async () => {
        await contextMenu.openAt(400, 400);
      });

      await test.step('Menu is visible and anchored at the click point', async () => {
        await expect(contextMenu.menu).toBeVisible();
        await expect(contextMenu.menu).toHaveCSS('left', '400px');
        await expect(contextMenu.menu).toHaveCSS('top', '400px');
      });

      await test.step('All top-level items are listed', async () => {
        for (const name of [...TOP_LEVEL_ITEMS, 'Share']) {
          await expect(contextMenu.item(name)).toBeVisible();
        }
      });
    });

    for (const name of TOP_LEVEL_ITEMS) {
      test(`Selecting "${name}" reports the item and closes the menu`, async () => {
        await test.step('Open the context menu', async () => {
          await contextMenu.openAt(400, 400);
          await expect(contextMenu.menu).toBeVisible();
        });

        await test.step(`Click "${name}"`, async () => {
          await contextMenu.select(name);
        });

        await test.step('Message names the item and menu is hidden', async () => {
          await expect(contextMenu.message).toHaveText(
            `Menu item ${name} clicked`
          );
          await expect(contextMenu.menu).toBeHidden();
        });
      });
    }

    test('Hovering Share reveals the share submenu', async () => {
      await test.step('Open the context menu', async () => {
        await contextMenu.openAt(400, 400);
      });

      await test.step('Hover the Share item', async () => {
        await contextMenu.revealShareMenu();
      });

      await test.step('Share submenu is shown with all networks', async () => {
        await expect(contextMenu.shareMenu).toHaveCSS('opacity', '1');
        for (const name of SHARE_ITEMS) {
          await expect(contextMenu.shareMenu.getByText(name)).toBeVisible();
        }
      });
    });

    for (const name of SHARE_ITEMS) {
      test(`Selecting nested share item "${name}"`, async () => {
        await test.step('Open the context menu', async () => {
          await contextMenu.openAt(400, 400);
        });

        await test.step(`Select ${name} from the Share submenu`, async () => {
          await contextMenu.selectShareItem(name);
        });

        await test.step('Message names the nested item', async () => {
          await expect(contextMenu.message).toHaveText(
            `Menu item ${name} clicked`
          );
          await expect(contextMenu.menu).toBeHidden();
        });
      });
    }
  });

  test.describe('Edge cases', () => {
    test('Repeated right-clicks move the menu to the latest position', async () => {
      await test.step('Right-click at the first position', async () => {
        await contextMenu.openAt(300, 400);
        await expect(contextMenu.menu).toHaveCSS('left', '300px');
      });

      // The second click must land outside the open menu: the page uses the
      // event offset relative to the clicked element, not the viewport.
      await test.step('Right-click again elsewhere', async () => {
        await contextMenu.openAt(900, 450);
      });

      await test.step('Menu is repositioned at the second click', async () => {
        await expect(contextMenu.menu).toBeVisible();
        await expect(contextMenu.menu).toHaveCSS('left', '900px');
        await expect(contextMenu.menu).toHaveCSS('top', '450px');
      });
    });

    test('Menu is kept inside the viewport near the bottom-right corner', async ({
      page,
    }) => {
      await test.step('Right-click close to the bottom-right corner', async () => {
        await contextMenu.openAt(1430, 890);
        await expect(contextMenu.menu).toBeVisible();
      });

      await test.step('Menu box fits inside the viewport', async () => {
        const viewport = page.viewportSize();
        await expect
          .poll(async () => {
            const box = await contextMenu.menu.boundingBox();
            return (
              !!box &&
              !!viewport &&
              box.x + box.width <= viewport.width &&
              box.y + box.height <= viewport.height
            );
          })
          .toBe(true);
      });

      await test.step('Share submenu flips to the left side', async () => {
        await expect(contextMenu.shareMenu).toHaveCSS('left', '-200px');
      });
    });

    test('Menu adapts to a resized (mobile) viewport', async ({ page }) => {
      await test.step('Resize the viewport to a phone size', async () => {
        await page.setViewportSize({ width: 375, height: 667 });
      });

      await test.step('Right-click near the bottom-right corner', async () => {
        await contextMenu.openAt(370, 660);
      });

      await test.step('Menu is clamped to the narrow viewport', async () => {
        await expect(contextMenu.menu).toBeVisible();
        // winWidth - menuWidth(300) - 5
        await expect(contextMenu.menu).toHaveCSS('left', '70px');
      });

      await test.step('Items remain selectable', async () => {
        await contextMenu.select('Rename');
        await expect(contextMenu.message).toHaveText(
          'Menu item Rename clicked'
        );
      });
    });

    test('Menu can be reopened after selecting an item', async () => {
      await test.step('Select Preview from a first menu', async () => {
        await contextMenu.openAt(400, 400);
        await contextMenu.select('Preview');
        await expect(contextMenu.menu).toBeHidden();
      });

      await test.step('Reopen and select Delete', async () => {
        await contextMenu.openAt(600, 300);
        await expect(contextMenu.menu).toBeVisible();
        await contextMenu.select('Delete');
      });

      await test.step('Message reflects the latest selection', async () => {
        await expect(contextMenu.message).toHaveText(
          'Menu item Delete clicked'
        );
      });
    });
  });

  test.describe('Negative cases', () => {
    test('Menu is hidden on page load', async () => {
      await test.step('Menu and its items are not shown', async () => {
        await expect(contextMenu.menu).toBeHidden();
        await expect(contextMenu.item('Preview')).toBeHidden();
      });

      await test.step('Default message is displayed', async () => {
        await expect(contextMenu.message).toHaveText(INITIAL_MESSAGE);
      });
    });

    test('Left-click does not open the menu', async ({ page }) => {
      await test.step('Left-click on an empty area', async () => {
        await page.mouse.click(400, 400);
      });

      await test.step('Menu stays hidden', async () => {
        await expect(contextMenu.menu).toBeHidden();
      });
    });

    test('Clicking outside dismisses the menu without a selection', async ({
      page,
    }) => {
      await test.step('Open the context menu', async () => {
        await contextMenu.openAt(400, 400);
        await expect(contextMenu.menu).toBeVisible();
      });

      await test.step('Click outside of the menu', async () => {
        await page.mouse.click(1000, 200);
      });

      await test.step('Menu closes and message is unchanged', async () => {
        await expect(contextMenu.menu).toBeHidden();
        await expect(contextMenu.message).toHaveText(INITIAL_MESSAGE);
      });
    });

    test('Escape key does not dismiss the menu', async ({ page }) => {
      await test.step('Open the context menu', async () => {
        await contextMenu.openAt(400, 400);
        await expect(contextMenu.menu).toBeVisible();
      });

      await test.step('Press Escape', async () => {
        await page.keyboard.press('Escape');
      });

      await test.step('Menu remains open (no keyboard support)', async () => {
        await expect(contextMenu.menu).toBeVisible();
        await expect(contextMenu.message).toHaveText(INITIAL_MESSAGE);
      });
    });

    test('Clicking the Share parent closes the menu without a selection', async () => {
      await test.step('Open the context menu', async () => {
        await contextMenu.openAt(400, 400);
      });

      await test.step('Click the Share entry itself', async () => {
        await contextMenu.shareItem.click();
      });

      await test.step('Menu closes and nothing is reported', async () => {
        await expect(contextMenu.menu).toBeHidden();
        await expect(contextMenu.message).toHaveText(INITIAL_MESSAGE);
      });
    });

    test('Share submenu stays collapsed until Share is hovered', async () => {
      await test.step('Open the context menu without hovering Share', async () => {
        await contextMenu.openAt(400, 400);
        await expect(contextMenu.menu).toBeVisible();
      });

      await test.step('Share submenu is transparent and not interactive', async () => {
        await expect(contextMenu.shareMenu).toHaveCSS('opacity', '0');
        await expect(contextMenu.shareMenu).toHaveCSS('pointer-events', 'none');
      });
    });
  });
});
