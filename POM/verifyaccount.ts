import { Page, Locator } from '@playwright/test';

export const CORRECT_CODE = '999999';
export const CODE_LENGTH = 6;

export class VerifyAccount {
  readonly page: Page;
  readonly title: Locator;
  readonly instructions: Locator;
  readonly codeInputs: Locator;
  readonly hint: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByRole('heading', { name: 'Verify Your Account' });
    this.instructions = page.getByText('We emailed you the six digit code');
    this.codeInputs = page.getByRole('spinbutton');
    this.hint = page.getByText('The confirmation code is 9-9-9-9-9-9');
    this.successMessage = page.getByText('Success', { exact: true });
  }

  codeInput(index: number): Locator {
    return this.codeInputs.nth(index);
  }

  /**
   * Types the code one box at a time. The app moves focus with a 10ms
   * setTimeout, which can fire late (notably in WebKit) and steal focus from
   * the next key press, so wait for focus to land before typing the next digit.
   */
  async enterCode(code: string) {
    const digits = [...code];
    for (const [index, digit] of digits.entries()) {
      await this.codeInput(index).press(digit);
      if (index < digits.length - 1 && index < CODE_LENGTH - 1) {
        await this.waitForFocus(index + 1);
      }
    }
  }

  /** Waits until the box at `index` is the focused element. */
  async waitForFocus(index: number) {
    await this.page.waitForFunction(
      (i) => document.activeElement === document.querySelectorAll('.code')[i],
      index
    );
  }

  /** Presses a key on whichever box currently has focus. */
  async pressKey(key: string) {
    await this.page.keyboard.press(key);
  }
}
