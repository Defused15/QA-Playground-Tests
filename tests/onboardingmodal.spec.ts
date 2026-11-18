import { expect, test } from '@playwright/test';
import { testSetup } from '../POM/Hooks/before-each';
import { testTeardown } from '../POM/Hooks/after-each';
import { OnboardingModal, OVERLAY_CLIP, TITLES } from '../POM/onboardingmodal';

let onboarding: OnboardingModal;

test.describe('Onboarding Modal', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await testSetup(page, testInfo);
    await page.goto('/apps/onboarding-modal/');
    onboarding = new OnboardingModal(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await testTeardown(page, testInfo);
  });

  test('Random initial state is internally consistent', async () => {
    let isWelcome = false;

    await test.step('Read which variant was rendered', async () => {
      await expect(onboarding.title).toBeVisible();
      isWelcome = (await onboarding.title.innerText()).startsWith('Welcome');
    });

    await test.step('Modal state matches the rendered title', async () => {
      await expect(onboarding.state).toBeChecked({ checked: isWelcome });
    });
  });

  test.describe('When the modal is shown on load', () => {
    test.beforeEach(async () => {
      await onboarding.loadWithModal(true);
    });

    test.describe('Happy path', () => {
      test('Welcome modal is displayed', async () => {
        await test.step('Modal state is open', async () => {
          await expect(onboarding.state).toBeChecked();
          await expect(onboarding.overlay).toHaveCSS(
            'clip-path',
            OVERLAY_CLIP.open
          );
        });

        await test.step('Welcome content is rendered', async () => {
          await expect(onboarding.welcomeLink).toBeVisible();
          await expect(onboarding.title).toHaveText(TITLES.welcome);
        });
      });

      test('Toggle button closes the modal', async () => {
        await test.step('Click the close toggle', async () => {
          await onboarding.toggleModal();
        });

        await test.step('Modal collapses to the corner', async () => {
          await expect(onboarding.state).not.toBeChecked();
          await expect(onboarding.overlay).toHaveCSS(
            'clip-path',
            OVERLAY_CLIP.closed
          );
        });
      });

      test('Modal can be reopened after closing', async () => {
        await test.step('Close the modal', async () => {
          await onboarding.toggleModal();
          await expect(onboarding.state).not.toBeChecked();
        });

        await test.step('Open it again', async () => {
          await onboarding.toggleModal();
        });

        await test.step('Modal is expanded again', async () => {
          await expect(onboarding.state).toBeChecked();
          await expect(onboarding.overlay).toHaveCSS(
            'clip-path',
            OVERLAY_CLIP.open
          );
        });
      });
    });

    test.describe('Edge cases', () => {
      test('Rapid toggling ends in the state given by click parity', async () => {
        await test.step('Click the toggle five times quickly', async () => {
          for (let i = 0; i < 5; i++) {
            await onboarding.toggleModal();
          }
        });

        await test.step('Odd number of clicks leaves it closed', async () => {
          await expect(onboarding.state).not.toBeChecked();
          await expect(onboarding.overlay).toHaveCSS(
            'clip-path',
            OVERLAY_CLIP.closed
          );
        });
      });

      test('Modal can be closed on a mobile viewport', async ({ page }) => {
        await test.step('Resize the viewport to a phone size', async () => {
          await page.setViewportSize({ width: 375, height: 667 });
        });

        await test.step('Toggle and welcome link are still visible', async () => {
          await expect(onboarding.toggle).toBeInViewport();
          await expect(onboarding.welcomeLink).toBeInViewport();
        });

        await test.step('Close the modal', async () => {
          await onboarding.toggleModal();
          await expect(onboarding.state).not.toBeChecked();
        });
      });

      test('Clicking the welcome link keeps the modal open', async ({
        page,
      }) => {
        await test.step('Click "Welcome on board!"', async () => {
          await onboarding.welcomeLink.click();
        });

        await test.step('Only the hash changes, modal remains', async () => {
          await expect(page).toHaveURL(/\/apps\/onboarding-modal\/#$/);
          await expect(onboarding.state).toBeChecked();
        });
      });

      test('Closed state is not persisted across reloads', async ({ page }) => {
        await test.step('Close the modal', async () => {
          await onboarding.toggleModal();
          await expect(onboarding.state).not.toBeChecked();
        });

        await test.step('Reload the page', async () => {
          await page.reload();
        });

        await test.step('Modal is shown again', async () => {
          await expect(onboarding.state).toBeChecked();
          await expect(onboarding.title).toHaveText(TITLES.welcome);
        });
      });
    });

    test.describe('Negative cases', () => {
      test('Escape key does not dismiss the modal', async ({ page }) => {
        await test.step('Press Escape', async () => {
          await page.keyboard.press('Escape');
        });

        await test.step('Modal remains open', async () => {
          await expect(onboarding.state).toBeChecked();
        });
      });

      test('Clicking the overlay background does not dismiss the modal', async ({
        page,
      }) => {
        await test.step('Click an empty area of the overlay', async () => {
          await page.mouse.click(200, 800);
        });

        await test.step('Modal remains open', async () => {
          await expect(onboarding.state).toBeChecked();
          await expect(onboarding.overlay).toHaveCSS(
            'clip-path',
            OVERLAY_CLIP.open
          );
        });
      });

      test('Toggle cannot receive keyboard focus', async () => {
        await test.step('Try to focus the toggle', async () => {
          await onboarding.toggle.focus();
        });

        await test.step('Toggle is not focused, modal unchanged', async () => {
          await expect(onboarding.toggle).not.toBeFocused();
          await expect(onboarding.state).toBeChecked();
        });
      });

      test('Closing the modal does not restore the default title', async () => {
        await test.step('Close the modal', async () => {
          await onboarding.toggleModal();
          await expect(onboarding.state).not.toBeChecked();
        });

        await test.step('Title still shows the welcome text', async () => {
          await expect(onboarding.title).toHaveText(TITLES.welcome);
        });
      });
    });
  });

  test.describe('When the modal is not shown on load', () => {
    test.beforeEach(async () => {
      await onboarding.loadWithModal(false);
    });

    test('Default launch screen is displayed', async () => {
      await test.step('Modal is collapsed', async () => {
        await expect(onboarding.state).not.toBeChecked();
        await expect(onboarding.overlay).toHaveCSS(
          'clip-path',
          OVERLAY_CLIP.closed
        );
      });

      await test.step('Launch title is shown', async () => {
        await expect(onboarding.title).toHaveText(TITLES.launched);
      });
    });

    test('Modal can be opened manually', async () => {
      await test.step('Click the toggle', async () => {
        await onboarding.toggleModal();
      });

      await test.step('Modal expands but keeps the launch title', async () => {
        await expect(onboarding.state).toBeChecked();
        await expect(onboarding.overlay).toHaveCSS(
          'clip-path',
          OVERLAY_CLIP.open
        );
        await expect(onboarding.title).toHaveText(TITLES.launched);
      });
    });
  });
});
