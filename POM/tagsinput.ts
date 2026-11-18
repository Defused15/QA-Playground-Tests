import { Page, Locator } from '@playwright/test';

export const DEFAULT_TAGS = ['node', 'javascript'];
export const MAX_TAGS = 10;

export class TagsInput {
  readonly page: Page;
  readonly heading: Locator;
  readonly hint: Locator;
  readonly input: Locator;
  readonly tags: Locator;
  readonly remainingText: Locator;
  readonly removeAllButton: Locator;

  constructor(page: Page) {
    this.page = page;
    const main = page.getByRole('main');
    this.heading = main.getByRole('heading', { name: 'Tags' });
    this.hint = main.getByText('Press enter or add a comma after each tag');
    this.input = main.getByRole('textbox');
    this.tags = main.getByRole('listitem');
    this.remainingText = main.getByText(/tags are remaining/);
    this.removeAllButton = main.getByRole('button', { name: 'Remove All' });
  }

  tag(name: string): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.tags.filter({ hasText: new RegExp(`^\\s*${escaped}\\s*$`) });
  }

  /** Types a value and commits it with Enter (the app listens on keyup). */
  async addTag(value: string) {
    await this.input.fill(value);
    await this.input.press('Enter');
  }

  async addTags(values: string[]) {
    for (const value of values) {
      await this.addTag(value);
    }
  }

  async removeTag(name: string) {
    // The remove "x" is an icon-font <i> with no role or label
    await this.tag(name).locator('i.uit-multiply').click();
  }

  async removeAll() {
    await this.removeAllButton.click();
  }
}
