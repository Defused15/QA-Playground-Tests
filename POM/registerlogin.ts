import { Page, Locator } from '@playwright/test';

export const REGISTER_ERRORS = {
  nameRequired: 'Full name is required',
  emailRequired: 'Email is required',
  emailInvalid: 'Enter a valid email address',
  emailTaken: 'This email is already registered',
  passwordRequired: 'Password is required',
  passwordTooShort: 'Password must be at least 8 characters',
  confirmRequired: 'Please confirm your password',
  passwordMismatch: 'Passwords do not match',
};

export const LOGIN_MESSAGES = {
  registered: 'Account created successfully! Please log in.',
  invalidCredentials: 'Invalid email or password',
  emailRequired: 'Email is required',
  passwordRequired: 'Password is required',
};

export interface User {
  name: string;
  email: string;
  password: string;
}

export const VALID_USER: User = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'secret123',
};

export class RegisterLogin {
  readonly page: Page;

  // The three views are plain <div> cards with no role/name, so they are
  // scoped by id; everything inside uses accessible locators.
  readonly registerView: Locator;
  readonly loginView: Locator;
  readonly dashboardView: Locator;

  readonly registerHeading: Locator;
  readonly nameInput: Locator;
  readonly regEmailInput: Locator;
  readonly regPasswordInput: Locator;
  readonly confirmInput: Locator;
  readonly regPasswordToggle: Locator;
  readonly confirmToggle: Locator;
  readonly createAccountButton: Locator;
  readonly goToLoginLink: Locator;
  readonly registerFieldErrors: Locator;

  // Field error <span>s share role="alert" with no accessible name, so they
  // are targeted by id to tie each message to its field.
  readonly nameError: Locator;
  readonly regEmailError: Locator;
  readonly regPasswordError: Locator;
  readonly confirmError: Locator;

  readonly loginHeading: Locator;
  readonly loginAlert: Locator;
  readonly loginEmailInput: Locator;
  readonly loginPasswordInput: Locator;
  readonly loginPasswordToggle: Locator;
  readonly loginButton: Locator;
  readonly goToRegisterLink: Locator;
  readonly loginEmailError: Locator;
  readonly loginPasswordError: Locator;

  readonly welcomeHeading: Locator;
  readonly welcomeEmail: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.registerView = page.locator('#register-view');
    this.loginView = page.locator('#login-view');
    this.dashboardView = page.locator('#dashboard-view');

    this.registerHeading = this.registerView.getByRole('heading', {
      name: 'Create Account',
    });
    this.nameInput = this.registerView.getByRole('textbox', {
      name: 'Full Name',
    });
    this.regEmailInput = this.registerView.getByRole('textbox', {
      name: 'Email',
    });
    this.regPasswordInput = this.registerView.getByRole('textbox', {
      name: 'Password',
      exact: true,
    });
    this.confirmInput = this.registerView.getByRole('textbox', {
      name: 'Confirm Password',
    });
    this.regPasswordToggle = this.registerView
      .getByRole('button', { name: /Show|Hide/ })
      .first();
    this.confirmToggle = this.registerView
      .getByRole('button', { name: /Show|Hide/ })
      .last();
    this.createAccountButton = this.registerView.getByRole('button', {
      name: 'Create Account',
    });
    this.goToLoginLink = this.registerView.getByRole('link', {
      name: 'Log In',
    });
    this.registerFieldErrors = this.registerView.locator('.field-error');

    this.nameError = page.locator('#reg-name-error');
    this.regEmailError = page.locator('#reg-email-error');
    this.regPasswordError = page.locator('#reg-password-error');
    this.confirmError = page.locator('#reg-confirm-error');

    this.loginHeading = this.loginView.getByRole('heading', {
      name: 'Welcome Back',
    });
    this.loginAlert = page.locator('#login-alert');
    this.loginEmailInput = this.loginView.getByRole('textbox', {
      name: 'Email',
    });
    this.loginPasswordInput = this.loginView.getByRole('textbox', {
      name: 'Password',
    });
    this.loginPasswordToggle = this.loginView.getByRole('button', {
      name: /Show|Hide/,
    });
    this.loginButton = this.loginView.getByRole('button', { name: 'Log In' });
    this.goToRegisterLink = this.loginView.getByRole('link', {
      name: 'Sign Up',
    });
    this.loginEmailError = page.locator('#login-email-error');
    this.loginPasswordError = page.locator('#login-password-error');

    this.welcomeHeading = this.dashboardView.getByRole('heading', {
      level: 2,
    });
    this.welcomeEmail = this.dashboardView.getByRole('strong');
    this.logoutButton = this.dashboardView.getByRole('button', {
      name: 'Log Out',
    });
  }

  async fillRegisterForm(user: Partial<User> & { confirm?: string }) {
    if (user.name !== undefined) await this.nameInput.fill(user.name);
    if (user.email !== undefined) await this.regEmailInput.fill(user.email);
    if (user.password !== undefined) {
      await this.regPasswordInput.fill(user.password);
    }
    const confirm = user.confirm ?? user.password;
    if (confirm !== undefined) await this.confirmInput.fill(confirm);
  }

  async register(user: Partial<User> & { confirm?: string }) {
    await this.fillRegisterForm(user);
    await this.createAccountButton.click();
  }

  async login(email: string, password: string) {
    await this.loginEmailInput.fill(email);
    await this.loginPasswordInput.fill(password);
    await this.loginButton.click();
  }

  async logout() {
    await this.logoutButton.click();
  }

  async goToLogin() {
    await this.goToLoginLink.click();
  }

  async goToRegister() {
    await this.goToRegisterLink.click();
  }
}
