import { Page, Locator } from '@playwright/test';

export const OVERLAY_CLIP = {
  open: 'circle(75%)',
  closed: 'circle(25px at calc(0% + 45px) 45px)',
} as const;

export const TITLES = {
  welcome: 'Welcome Peter Parker! 🕷🎉',
  launched: 'Application successfully launched! 🚀',
} as const;

export class OnboardingModal {
  readonly page: Page;
  readonly toggle: Locator;
  readonly state: Locator;
  readonly overlay: Locator;
  readonly welcomeLink: Locator;
  readonly title: Locator;

  constructor(page: Page) {
    this.page = page;
    // The toggle is an icon-only <label> for a display:none checkbox, so
    // neither has an accessible handle.
    this.toggle = page.locator('label.menu-btn');
    this.state = page.locator('#active');
    this.overlay = page.locator('.wrapper');
    this.welcomeLink = page.getByRole('link', { name: 'Welcome on board!' });
    this.title = page.getByText(
      new RegExp(`^(${TITLES.welcome}|${TITLES.launched})$`)
    );
  }

  /**
   * The page shows the modal when Math.round(Math.random()) is 0,
   * so stubbing Math.random makes the initial state deterministic.
   */
  async loadWithModal(shown: boolean) {
    await this.page.addInitScript((value) => {
      Math.random = () => value;
    }, Number(!shown));
    // A fresh navigation rather than reload(): Firefox restores the
    // checkbox state from the previous load on reload.
    await this.page.goto(this.page.url());
  }

  async toggleModal() {
    await this.toggle.click();
  }
}
