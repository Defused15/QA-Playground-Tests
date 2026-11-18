import { expect, test } from '@playwright/test';
import { testSetup } from '../POM/Hooks/before-each';
import { testTeardown } from '../POM/Hooks/after-each';
import {
  LOGIN_MESSAGES,
  REGISTER_ERRORS,
  RegisterLogin,
  VALID_USER,
} from '../POM/registerlogin';

let auth: RegisterLogin;

test.describe('Register & Login', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await testSetup(page, testInfo);
    await page.goto('/apps/register-login/');
    auth = new RegisterLogin(page);
    // Users persist in localStorage ("qap_users"); start every test clean.
    await page.evaluate(() => localStorage.clear());
  });

  test.afterEach(async ({ page }, testInfo) => {
    await testTeardown(page, testInfo);
  });

  test.describe('Happy path', () => {
    test('Register view is shown by default', async () => {
      await test.step('Register form is visible', async () => {
        await expect(auth.registerHeading).toBeVisible();
        await expect(auth.createAccountButton).toBeVisible();
      });

      await test.step('Login and dashboard views are hidden', async () => {
        await expect(auth.loginView).toBeHidden();
        await expect(auth.dashboardView).toBeHidden();
      });
    });

    test('Successful registration redirects to login with success message', async () => {
      await test.step('Submit a valid registration', async () => {
        await auth.register(VALID_USER);
      });

      await test.step('Login view shows the success alert', async () => {
        await expect(auth.loginHeading).toBeVisible();
        await expect(auth.registerView).toBeHidden();
        await expect(auth.loginAlert).toHaveText(LOGIN_MESSAGES.registered);
      });
    });

    test('Registered user can log in and sees the dashboard', async () => {
      await test.step('Register a new user', async () => {
        await auth.register(VALID_USER);
        await expect(auth.loginHeading).toBeVisible();
      });

      await test.step('Log in with the same credentials', async () => {
        await auth.login(VALID_USER.email, VALID_USER.password);
      });

      await test.step('Dashboard greets the user by name and email', async () => {
        await expect(auth.welcomeHeading).toHaveText(
          `Welcome, ${VALID_USER.name}!`
        );
        await expect(auth.welcomeEmail).toHaveText(VALID_USER.email);
        await expect(auth.loginView).toBeHidden();
      });
    });

    test('Log Out returns to an empty login view', async () => {
      await test.step('Register and log in', async () => {
        await auth.register(VALID_USER);
        await auth.login(VALID_USER.email, VALID_USER.password);
        await expect(auth.logoutButton).toBeVisible();
      });

      await test.step('Log out', async () => {
        await auth.logout();
      });

      await test.step('Login view is shown with cleared fields and no alert', async () => {
        await expect(auth.loginHeading).toBeVisible();
        await expect(auth.dashboardView).toBeHidden();
        await expect(auth.loginEmailInput).toHaveValue('');
        await expect(auth.loginPasswordInput).toHaveValue('');
        await expect(auth.loginAlert).toBeEmpty();
      });
    });

    test('Log In and Sign Up links switch between views', async () => {
      await test.step('Go to the login view', async () => {
        await auth.goToLogin();
        await expect(auth.loginHeading).toBeVisible();
        await expect(auth.registerView).toBeHidden();
      });

      await test.step('Go back to the register view', async () => {
        await auth.goToRegister();
        await expect(auth.registerHeading).toBeVisible();
        await expect(auth.loginView).toBeHidden();
      });
    });

    test('Show/Hide toggles password visibility', async () => {
      await test.step('Password is masked by default', async () => {
        await auth.regPasswordInput.fill(VALID_USER.password);
        await expect(auth.regPasswordInput).toHaveAttribute('type', 'password');
        await expect(auth.regPasswordToggle).toHaveText('Show');
      });

      await test.step('Show reveals the password', async () => {
        await auth.regPasswordToggle.click();
        await expect(auth.regPasswordInput).toHaveAttribute('type', 'text');
        await expect(auth.regPasswordToggle).toHaveText('Hide');
        await expect(auth.regPasswordInput).toHaveValue(VALID_USER.password);
      });

      await test.step('Hide masks it again; confirm field is unaffected', async () => {
        await auth.regPasswordToggle.click();
        await expect(auth.regPasswordInput).toHaveAttribute('type', 'password');
        await expect(auth.confirmInput).toHaveAttribute('type', 'password');
        await expect(auth.confirmToggle).toHaveText('Show');
      });
    });
  });

  test.describe('Edge cases', () => {
    test('Password of exactly 8 characters is accepted', async () => {
      await test.step('Register with an 8-character password', async () => {
        await auth.register({ ...VALID_USER, password: '12345678' });
      });

      await test.step('Registration succeeds', async () => {
        await expect(auth.loginAlert).toHaveText(LOGIN_MESSAGES.registered);
      });
    });

    test('Name and email are trimmed on register and login', async () => {
      await test.step('Register with surrounding whitespace', async () => {
        await auth.register({
          name: `   ${VALID_USER.name}  `,
          email: `  ${VALID_USER.email} `,
          password: VALID_USER.password,
        });
        await expect(auth.loginAlert).toHaveText(LOGIN_MESSAGES.registered);
      });

      await test.step('Log in with a padded email', async () => {
        await auth.login(`  ${VALID_USER.email}  `, VALID_USER.password);
      });

      await test.step('Dashboard shows trimmed values', async () => {
        await expect(auth.welcomeHeading).toHaveText(
          `Welcome, ${VALID_USER.name}!`
        );
        await expect(auth.welcomeEmail).toHaveText(VALID_USER.email);
      });
    });

    test('Register form is reset after a successful registration', async () => {
      await test.step('Register and return to the register view', async () => {
        await auth.register(VALID_USER);
        await expect(auth.loginHeading).toBeVisible();
        await auth.goToRegister();
      });

      await test.step('All register fields are empty', async () => {
        await expect(auth.nameInput).toHaveValue('');
        await expect(auth.regEmailInput).toHaveValue('');
        await expect(auth.regPasswordInput).toHaveValue('');
        await expect(auth.confirmInput).toHaveValue('');
      });
    });

    test('Switching views clears validation errors', async () => {
      await test.step('Trigger required errors', async () => {
        await auth.createAccountButton.click();
        await expect(auth.nameError).toHaveText(REGISTER_ERRORS.nameRequired);
      });

      await test.step('Navigate away and back', async () => {
        await auth.goToLogin();
        await auth.goToRegister();
      });

      await test.step('Errors and invalid styling are gone', async () => {
        await expect(auth.registerFieldErrors).toHaveText(['', '', '', '']);
        await expect(auth.nameInput).not.toHaveClass(/invalid/);
      });
    });

    test('Pressing Enter submits the registration form', async () => {
      await test.step('Fill the form and press Enter in the last field', async () => {
        await auth.fillRegisterForm(VALID_USER);
        await auth.confirmInput.press('Enter');
      });

      await test.step('Registration succeeds without clicking', async () => {
        await expect(auth.loginAlert).toHaveText(LOGIN_MESSAGES.registered);
      });
    });

    test('Full flow works on a mobile viewport', async ({ page }) => {
      await test.step('Resize to phone width', async () => {
        await page.setViewportSize({ width: 375, height: 667 });
        await expect(auth.createAccountButton).toBeVisible();
      });

      await test.step('Register and log in', async () => {
        await auth.register(VALID_USER);
        await auth.login(VALID_USER.email, VALID_USER.password);
      });

      await test.step('Dashboard is shown', async () => {
        await expect(auth.welcomeHeading).toHaveText(
          `Welcome, ${VALID_USER.name}!`
        );
      });
    });
  });

  test.describe('Negative cases', () => {
    test('Empty registration shows all required errors', async () => {
      await test.step('Submit an empty form', async () => {
        await auth.createAccountButton.click();
      });

      await test.step('Each field shows its required message', async () => {
        await expect(auth.nameError).toHaveText(REGISTER_ERRORS.nameRequired);
        await expect(auth.regEmailError).toHaveText(
          REGISTER_ERRORS.emailRequired
        );
        await expect(auth.regPasswordError).toHaveText(
          REGISTER_ERRORS.passwordRequired
        );
        await expect(auth.confirmError).toHaveText(
          REGISTER_ERRORS.confirmRequired
        );
      });

      await test.step('Inputs are flagged invalid and view does not change', async () => {
        await expect(auth.nameInput).toHaveClass(/invalid/);
        await expect(auth.confirmInput).toHaveClass(/invalid/);
        await expect(auth.registerHeading).toBeVisible();
      });
    });

    test('Whitespace-only name is rejected', async () => {
      await test.step('Submit with a blank name', async () => {
        await auth.register({ ...VALID_USER, name: '    ' });
      });

      await test.step('Only the name error is shown', async () => {
        await expect(auth.nameError).toHaveText(REGISTER_ERRORS.nameRequired);
        await expect(auth.regEmailError).toBeEmpty();
        await expect(auth.regPasswordError).toBeEmpty();
        await expect(auth.confirmError).toBeEmpty();
      });
    });

    for (const email of ['john', 'john@example', 'john @example.com']) {
      test(`Invalid email format "${email}" is rejected`, async () => {
        await test.step('Submit with a malformed email', async () => {
          await auth.register({ ...VALID_USER, email });
        });

        await test.step('Email format error is shown', async () => {
          await expect(auth.regEmailError).toHaveText(
            REGISTER_ERRORS.emailInvalid
          );
          await expect(auth.registerHeading).toBeVisible();
        });
      });
    }

    test('Password shorter than 8 characters is rejected', async () => {
      await test.step('Submit with a 7-character password', async () => {
        await auth.register({ ...VALID_USER, password: '1234567' });
      });

      await test.step('Length error is shown', async () => {
        await expect(auth.regPasswordError).toHaveText(
          REGISTER_ERRORS.passwordTooShort
        );
        await expect(auth.confirmError).toBeEmpty();
      });
    });

    test('Mismatched confirmation is rejected', async () => {
      await test.step('Submit with a different confirmation', async () => {
        await auth.register({ ...VALID_USER, confirm: 'secret124' });
      });

      await test.step('Mismatch error is shown', async () => {
        await expect(auth.confirmError).toHaveText(
          REGISTER_ERRORS.passwordMismatch
        );
        await expect(auth.regPasswordError).toBeEmpty();
      });
    });

    test('Confirmation is not compared when password is empty', async () => {
      await test.step('Submit with only a confirmation value', async () => {
        await auth.register({
          name: VALID_USER.name,
          email: VALID_USER.email,
          confirm: 'something',
        });
      });

      // Mismatch check is skipped when the password itself is missing
      await test.step('Only the password-required error is shown', async () => {
        await expect(auth.regPasswordError).toHaveText(
          REGISTER_ERRORS.passwordRequired
        );
        await expect(auth.confirmError).toBeEmpty();
      });
    });

    test('Duplicate email cannot be registered twice', async () => {
      await test.step('Register the user once', async () => {
        await auth.register(VALID_USER);
        await expect(auth.loginAlert).toHaveText(LOGIN_MESSAGES.registered);
      });

      await test.step('Register again with the same email', async () => {
        await auth.goToRegister();
        await auth.register({ ...VALID_USER, name: 'Jane Doe' });
      });

      await test.step('Already-registered error is shown', async () => {
        await expect(auth.regEmailError).toHaveText(REGISTER_ERRORS.emailTaken);
        await expect(auth.registerHeading).toBeVisible();
      });
    });

    test('Empty login shows required errors', async () => {
      await test.step('Submit the empty login form', async () => {
        await auth.goToLogin();
        await auth.loginButton.click();
      });

      await test.step('Both login fields show required errors', async () => {
        await expect(auth.loginEmailError).toHaveText(
          LOGIN_MESSAGES.emailRequired
        );
        await expect(auth.loginPasswordError).toHaveText(
          LOGIN_MESSAGES.passwordRequired
        );
        await expect(auth.dashboardView).toBeHidden();
      });
    });

    test('Login with unregistered email is rejected', async () => {
      await test.step('Log in without registering', async () => {
        await auth.goToLogin();
        await auth.login('nobody@example.com', VALID_USER.password);
      });

      await test.step('Invalid credentials alert is shown', async () => {
        await expect(auth.loginAlert).toHaveText(
          LOGIN_MESSAGES.invalidCredentials
        );
        await expect(auth.dashboardView).toBeHidden();
      });
    });

    test('Login with wrong-case password is rejected', async () => {
      await test.step('Register a user', async () => {
        await auth.register(VALID_USER);
        await expect(auth.loginHeading).toBeVisible();
      });

      await test.step('Log in with an upper-cased password', async () => {
        await auth.login(VALID_USER.email, VALID_USER.password.toUpperCase());
      });

      await test.step('Invalid credentials alert is shown', async () => {
        await expect(auth.loginAlert).toHaveText(
          LOGIN_MESSAGES.invalidCredentials
        );
        await expect(auth.dashboardView).toBeHidden();
      });
    });
  });
});
