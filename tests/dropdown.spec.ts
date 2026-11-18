import { expect, test } from '@playwright/test';
import { testSetup } from '../POM/Hooks/before-each';
import { testTeardown } from '../POM/Hooks/after-each';
import {
  ANIMAL_ITEMS,
  Dropdown,
  MAIN_ITEMS,
  SETTINGS_ITEMS,
} from '../POM/dropdown';

let dropdown: Dropdown;

test.describe('Multi Level Dropdown', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await testSetup(page, testInfo);
    await page.goto('/apps/multi-level-dropdown/');
    dropdown = new Dropdown(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await testTeardown(page, testInfo);
  });

  test.describe('Happy path', () => {
    test('Toggle opens the main menu', async () => {
      await test.step('Dropdown is closed initially', async () => {
        await expect(dropdown.panel).toBeHidden();
      });

      await test.step('Click the dropdown toggle', async () => {
        await dropdown.open();
      });

      await test.step('Main menu items are listed', async () => {
        await expect(dropdown.menuItems).toHaveText(
          MAIN_ITEMS.map((name) => new RegExp(name))
        );
      });
    });

    test('Settings opens the tutorial submenu', async ({ page }) => {
      await test.step('Open the Settings submenu', async () => {
        await dropdown.openSettings();
      });

      await test.step('Submenu header and items are shown', async () => {
        await expect(dropdown.settingsBack).toBeVisible();
        for (const name of SETTINGS_ITEMS) {
          await expect(dropdown.link(name)).toBeVisible();
        }
      });

      await test.step('Main menu is replaced and hash updated', async () => {
        await expect(dropdown.myProfile).toBeHidden();
        await expect(page).toHaveURL(/#settings$/);
      });
    });

    test('Animals opens the animals submenu', async ({ page }) => {
      await test.step('Open the Animals submenu', async () => {
        await dropdown.openAnimals();
      });

      await test.step('Submenu header and items are shown', async () => {
        await expect(dropdown.animalsBack).toBeVisible();
        for (const name of ANIMAL_ITEMS) {
          await expect(dropdown.link(name)).toBeVisible();
        }
      });

      await test.step('Main menu is replaced and hash updated', async () => {
        await expect(dropdown.myProfile).toBeHidden();
        await expect(page).toHaveURL(/#animals$/);
      });
    });

    test('Back from Settings returns to the main menu', async ({ page }) => {
      await test.step('Open the Settings submenu', async () => {
        await dropdown.openSettings();
        await expect(dropdown.settingsBack).toBeVisible();
      });

      await test.step('Click the "My Tutorial" back item', async () => {
        await dropdown.settingsBack.click();
      });

      await test.step('Main menu is shown again', async () => {
        await expect(dropdown.myProfile).toBeVisible();
        await expect(dropdown.settingsBack).toBeHidden();
        await expect(page).toHaveURL(/#main$/);
      });
    });

    test('Back from Animals returns to the main menu', async () => {
      await test.step('Open the Animals submenu', async () => {
        await dropdown.openAnimals();
        await expect(dropdown.animalsBack).toBeVisible();
      });

      await test.step('Click the "Animals" back item', async () => {
        await dropdown.animalsBack.click();
      });

      await test.step('Main menu is shown again', async () => {
        await expect(dropdown.animals).toBeVisible();
        await expect(dropdown.link('Kangaroo')).toBeHidden();
      });
    });

    test('Toggle closes an open dropdown', async () => {
      await test.step('Open the dropdown', async () => {
        await dropdown.open();
        await expect(dropdown.panel).toBeVisible();
      });

      await test.step('Click the toggle again', async () => {
        await dropdown.toggle.click();
      });

      await test.step('Dropdown is removed', async () => {
        await expect(dropdown.panel).toBeHidden();
      });
    });
  });

  test.describe('Edge cases', () => {
    test('Walking every level in sequence keeps menus consistent', async () => {
      await test.step('Main -> Settings', async () => {
        await dropdown.openSettings();
        await expect(dropdown.link('JavaScript')).toBeVisible();
      });

      await test.step('Settings -> Main', async () => {
        await dropdown.settingsBack.click();
        await expect(dropdown.animals).toBeVisible();
      });

      await test.step('Main -> Animals', async () => {
        await dropdown.animals.click();
        await expect(dropdown.link('Hedgehog')).toBeVisible();
      });

      await test.step('Animals -> Main', async () => {
        await dropdown.animalsBack.click();
        await expect(dropdown.menuItems).toHaveCount(MAIN_ITEMS.length);
      });
    });

    test('Rapid toggling ends in the state given by click parity', async () => {
      await test.step('Click the toggle five times quickly', async () => {
        for (let i = 0; i < 5; i++) {
          await dropdown.toggle.click();
        }
      });

      await test.step('Odd number of clicks leaves it open', async () => {
        await expect(dropdown.myProfile).toBeVisible();
      });

      await test.step('One more click closes it', async () => {
        await dropdown.toggle.click();
        await expect(dropdown.panel).toBeHidden();
      });
    });

    test('Reopening the dropdown resets to the main menu', async () => {
      await test.step('Navigate into the Settings submenu', async () => {
        await dropdown.openSettings();
        await expect(dropdown.settingsBack).toBeVisible();
      });

      await test.step('Close and reopen the dropdown', async () => {
        await dropdown.toggle.click();
        await expect(dropdown.panel).toBeHidden();
        await dropdown.toggle.click();
      });

      await test.step('Main menu is shown instead of Settings', async () => {
        await expect(dropdown.myProfile).toBeVisible();
        await expect(dropdown.settingsBack).toBeHidden();
      });
    });

    // WebKit does not move Tab focus to links by default, so items are focused
    // directly. The app re-renders the menu items when it sets the panel height
    // and while a submenu slides in, which drops focus to <body>. Each key press
    // therefore waits for the panel to settle first.
    const menuSettled = async () => {
      await expect(dropdown.panel).toHaveAttribute('style', /height: \d+px/);
      await expect(dropdown.transitioningMenus).toHaveCount(0);
    };

    test('Dropdown is operable with the keyboard', async () => {
      await test.step('Open the dropdown with Enter', async () => {
        await dropdown.toggle.press('Enter');
        await expect(dropdown.settings).toBeVisible();
      });

      await test.step('Enter the Animals submenu with Enter', async () => {
        await menuSettled();
        await dropdown.animals.press('Enter');
        await expect(dropdown.link('Frog')).toBeVisible();
      });

      await test.step('Go back with Enter on the header item', async () => {
        await menuSettled();
        await dropdown.animalsBack.press('Enter');
        await expect(dropdown.myProfile).toBeVisible();
      });
    });

    test('Dropdown remains usable on a mobile viewport', async ({ page }) => {
      await test.step('Resize the viewport to a phone size', async () => {
        await page.setViewportSize({ width: 375, height: 667 });
      });

      await test.step('Open the Animals submenu', async () => {
        await dropdown.openAnimals();
      });

      await test.step('Nested items are shown', async () => {
        await expect(dropdown.link('Kangaroo')).toBeVisible();
        await expect(dropdown.animalsBack).toBeVisible();
      });
    });
  });

  test.describe('Negative cases', () => {
    test('Other navbar icons do not open a dropdown', async () => {
      await test.step('Click each of the first three nav icons', async () => {
        for (let i = 0; i < 3; i++) {
          await dropdown.navItems.nth(i).getByRole('link').click();
        }
      });

      await test.step('No dropdown panel is rendered', async () => {
        await expect(dropdown.panel).toBeHidden();
      });
    });

    test('Escape key does not close the dropdown', async ({ page }) => {
      await test.step('Open the dropdown', async () => {
        await dropdown.open();
        await expect(dropdown.panel).toBeVisible();
      });

      await test.step('Press Escape', async () => {
        await page.keyboard.press('Escape');
      });

      await test.step('Dropdown stays open', async () => {
        await expect(dropdown.myProfile).toBeVisible();
      });
    });

    test('Clicking outside does not close the dropdown', async ({ page }) => {
      await test.step('Open the dropdown', async () => {
        await dropdown.open();
        await expect(dropdown.panel).toBeVisible();
      });

      await test.step('Click an empty area of the page', async () => {
        await page.mouse.click(100, 700);
      });

      await test.step('Dropdown stays open', async () => {
        await expect(dropdown.myProfile).toBeVisible();
      });
    });

    test('"My Profile" has no submenu', async ({ page }) => {
      await test.step('Open the dropdown and click My Profile', async () => {
        await dropdown.open();
        await dropdown.myProfile.click();
      });

      await test.step('Main menu stays in place', async () => {
        await expect(dropdown.menuItems).toHaveCount(MAIN_ITEMS.length);
        await expect(dropdown.settings).toBeVisible();
        // The item has no target, so the app writes "undefined" to the hash.
        await expect(page).toHaveURL(/#undefined$/);
      });
    });

    test('Selecting a leaf item leaves an empty panel', async ({ page }) => {
      await test.step('Open Settings and click HTML', async () => {
        await dropdown.openSettings();
        await dropdown.link('HTML').click();
      });

      await test.step('Panel stays but every menu is unmounted', async () => {
        await expect(page).toHaveURL(/#!HTML$/);
        await expect(dropdown.menuItems).toHaveCount(0);
        await expect(dropdown.panel).toBeAttached();
      });
    });
  });
});
