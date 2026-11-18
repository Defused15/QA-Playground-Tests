import { expect, test } from '@playwright/test';
import { testSetup } from '../POM/Hooks/before-each';
import { testTeardown } from '../POM/Hooks/after-each';
import { CODE_LENGTH, CORRECT_CODE, VerifyAccount } from '../POM/verifyaccount';

let verify: VerifyAccount;

test.describe('Verify Account', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await testSetup(page, testInfo);
    await page.goto('/apps/verify-account/');
    verify = new VerifyAccount(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await testTeardown(page, testInfo);
  });

  test.describe('Happy path', () => {
    test('Initial state shows six empty boxes with the first focused', async () => {
      await test.step('Title, instructions and hint are visible', async () => {
        await expect(verify.title).toBeVisible();
        await expect(verify.instructions).toContainText('cool_guy@email.com');
        await expect(verify.hint).toBeVisible();
      });

      await test.step('Six empty code boxes are rendered', async () => {
        await expect(verify.codeInputs).toHaveCount(CODE_LENGTH);
        for (let i = 0; i < CODE_LENGTH; i++) {
          await expect(verify.codeInput(i)).toHaveValue('');
        }
      });

      await test.step('First box has focus on load', async () => {
        await expect(verify.codeInput(0)).toBeFocused();
      });
    });

    test('Correct code shows Success and hides the form', async () => {
      await test.step('Enter 9-9-9-9-9-9', async () => {
        await verify.enterCode(CORRECT_CODE);
      });

      await test.step('Success message replaces the hint', async () => {
        await expect(verify.successMessage).toBeVisible();
        await expect(verify.successMessage).toHaveClass(/success/);
      });

      await test.step('Title, instructions and code boxes are hidden', async () => {
        await expect(verify.title).toBeHidden();
        await expect(verify.instructions).toBeHidden();
        await expect(verify.codeInputs).toHaveCount(0);
      });
    });

    test('Keyboard-only entry advances focus box by box', async () => {
      await test.step('Type five digits, focus moves after each', async () => {
        for (let i = 0; i < CODE_LENGTH - 1; i++) {
          await expect(verify.codeInput(i)).toBeFocused();
          await verify.pressKey('9');
          await expect(verify.codeInput(i)).toHaveValue('9');
          await expect(verify.codeInput(i + 1)).toBeFocused();
        }
      });

      await test.step('Type the last digit', async () => {
        await verify.pressKey('9');
      });

      await test.step('Account is verified', async () => {
        await expect(verify.successMessage).toBeVisible();
      });
    });
  });

  test.describe('Edge cases', () => {
    test('Typing into a filled box replaces its digit', async () => {
      await test.step('Fill the first box with 9', async () => {
        await verify.codeInput(0).press('9');
        await expect(verify.codeInput(0)).toHaveValue('9');
        // Let the app's delayed focus move settle before re-focusing box 1
        await expect(verify.codeInput(1)).toBeFocused();
      });

      await test.step('Type 5 into the same box', async () => {
        await verify.codeInput(0).press('5');
      });

      await test.step('Box holds a single replaced digit', async () => {
        await expect(verify.codeInput(0)).toHaveValue('5');
      });
    });

    test('Focus stays on the last box after typing in it', async () => {
      await test.step('Type a digit in the last box', async () => {
        await verify.codeInput(CODE_LENGTH - 1).press('1');
      });

      await test.step('Last box keeps focus and value', async () => {
        await expect(verify.codeInput(CODE_LENGTH - 1)).toHaveValue('1');
        await expect(verify.codeInput(CODE_LENGTH - 1)).toBeFocused();
      });
    });

    test('Backspace moves focus to the previous box', async () => {
      await test.step('Type three digits', async () => {
        for (let i = 0; i < 3; i++) {
          await verify.pressKey('1');
          await expect(verify.codeInput(i + 1)).toBeFocused();
        }
      });

      await test.step('Press Backspace on the empty fourth box', async () => {
        await verify.pressKey('Backspace');
      });

      await test.step('Focus moves back to the third box; digits remain', async () => {
        await expect(verify.codeInput(2)).toBeFocused();
        await expect(verify.codeInput(2)).toHaveValue('1');
      });
    });

    test('Backspace on the first box keeps focus there', async () => {
      await test.step('Press Backspace on the first box', async () => {
        await expect(verify.codeInput(0)).toBeFocused();
        await verify.pressKey('Backspace');
      });

      await test.step('First box remains focused', async () => {
        await expect(verify.codeInput(0)).toBeFocused();
      });
    });

    test('Correcting a wrong last digit completes verification', async () => {
      await test.step('Enter 9-9-9-9-9-8', async () => {
        await verify.enterCode('999998');
        await expect(verify.successMessage).toBeHidden();
      });

      await test.step('Overwrite the last digit with 9', async () => {
        await verify.codeInput(CODE_LENGTH - 1).press('9');
      });

      await test.step('Account is verified', async () => {
        await expect(verify.successMessage).toBeVisible();
      });
    });

    test('Verification works on a mobile viewport', async ({ page }) => {
      await test.step('Resize to phone width', async () => {
        await page.setViewportSize({ width: 375, height: 667 });
        await expect(verify.codeInput(CODE_LENGTH - 1)).toBeVisible();
      });

      await test.step('Enter the correct code', async () => {
        await verify.enterCode(CORRECT_CODE);
      });

      await test.step('Success is shown', async () => {
        await expect(verify.successMessage).toBeVisible();
      });
    });

    // App treats Space as a digit (" " >= 0 is true), so focus advances
    test('Space key advances focus without entering a value', async () => {
      await test.step('Press Space on the first box', async () => {
        await verify.pressKey(' ');
      });

      await test.step('Focus moves on and the box stays empty', async () => {
        await expect(verify.codeInput(1)).toBeFocused();
        await expect(verify.codeInput(0)).toHaveValue('');
      });
    });
  });

  test.describe('Negative cases', () => {
    test('Wrong code does not verify', async () => {
      await test.step('Enter 1-2-3-4-5-6', async () => {
        await verify.enterCode('123456');
      });

      await test.step('Form stays visible without Success', async () => {
        await expect(verify.codeInput(CODE_LENGTH - 1)).toHaveValue('6');
        await expect(verify.successMessage).toBeHidden();
        await expect(verify.title).toBeVisible();
        await expect(verify.hint).toBeVisible();
      });
    });

    test('Incomplete code does not verify', async () => {
      await test.step('Enter only five nines', async () => {
        await verify.enterCode(CORRECT_CODE.slice(0, CODE_LENGTH - 1));
        await expect(verify.codeInput(CODE_LENGTH - 1)).toBeFocused();
      });

      await test.step('Form stays visible without Success', async () => {
        await expect(verify.codeInput(CODE_LENGTH - 1)).toHaveValue('');
        await expect(verify.successMessage).toBeHidden();
        await expect(verify.title).toBeVisible();
      });
    });

    test('Non-numeric key is ignored and does not advance focus', async () => {
      await test.step('Press "e" on the first box', async () => {
        await verify.pressKey('e');
      });

      await test.step('Box stays empty and keeps focus', async () => {
        await expect(verify.codeInput(0)).toHaveValue('');
        await expect(verify.codeInput(0)).toBeFocused();
      });
    });

    // Verification runs only on keyup, so values set without key events are ignored
    test('Code set without key events is not verified', async () => {
      await test.step('Fill every box programmatically', async () => {
        for (let i = 0; i < CODE_LENGTH; i++) {
          await verify.codeInput(i).fill('9');
        }
      });

      await test.step('Boxes hold the code but no Success appears', async () => {
        await expect(verify.codeInput(CODE_LENGTH - 1)).toHaveValue('9');
        await expect(verify.successMessage).toBeHidden();
        await expect(verify.title).toBeVisible();
      });
    });
  });
});
