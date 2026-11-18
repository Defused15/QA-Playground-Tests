import { Page, Locator } from '@playwright/test';

// Correct order expected by the "Check Order" button
export const RICHEST_PEOPLE = [
  'Jeff Bezos',
  'Bill Gates',
  'Warren Buffett',
  'Bernard Arnault',
  'Carlos Slim Helu',
  'Amancio Ortega',
  'Larry Ellison',
  'Mark Zuckerberg',
  'Michael Bloomberg',
  'Larry Page',
] as const;

// Class the app gives an item after "Check Order", based on its position
export const expectedMark = (name: string, index: number): 'right' | 'wrong' =>
  name === RICHEST_PEOPLE[index] ? 'right' : 'wrong';

// Viewport y where the list is parked before dragging (below the fixed header)
const LIST_TOP_OFFSET = 120;

export class SortableList {
  readonly page: Page;
  readonly heading: Locator;
  readonly instructions: Locator;
  readonly list: Locator;
  readonly items: Locator;
  readonly names: Locator;
  readonly checkOrderButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: '10 Richest People' });
    this.instructions = page.getByText(
      'Drag and drop the items into their corresponding spots'
    );
    this.list = page.getByRole('main').getByRole('list');
    this.items = this.list.getByRole('listitem');
    this.names = this.list.getByRole('paragraph');
    this.checkOrderButton = page.getByRole('button', { name: 'Check Order' });
  }

  // The draggable handle is a plain <div draggable="true"> with no accessible role
  draggableAt(index: number): Locator {
    return this.items.nth(index).locator('.draggable');
  }

  numberAt(index: number): Locator {
    return this.items.nth(index).locator('.number');
  }

  // Native drag and drop breaks if the page scrolls mid-drag (dragTo scrolls
  // each end into view and the fixed ~115px header hides the top items), so
  // park the list just below the header and drag with the mouse in place.
  async dragItem(fromIndex: number, toIndex: number) {
    await this.list.evaluate(
      (el, offset) =>
        el.ownerDocument.defaultView?.scrollBy(
          0,
          el.getBoundingClientRect().top - offset
        ),
      LIST_TOP_OFFSET
    );
    const source = await this.draggableAt(fromIndex).boundingBox();
    const target = await this.items.nth(toIndex).boundingBox();
    if (!source || !target) {
      throw new Error(`Cannot drag item ${fromIndex} to ${toIndex}`);
    }
    await this.page.mouse.move(
      source.x + source.width / 2,
      source.y + source.height / 2
    );
    await this.page.mouse.down();
    // A single move (no intermediate steps) is required for WebKit to fire drop
    await this.page.mouse.move(
      target.x + target.width / 2,
      target.y + target.height / 2
    );
    await this.page.mouse.up();
  }

  async getNames(): Promise<string[]> {
    return (await this.names.allInnerTexts()).map((name) => name.trim());
  }

  // Swaps items one by one until the list matches RICHEST_PEOPLE
  async sortIntoCorrectOrder() {
    for (let target = 0; target < RICHEST_PEOPLE.length; target++) {
      const names = await this.getNames();
      const current = names.indexOf(RICHEST_PEOPLE[target]);
      if (current !== target) {
        await this.dragItem(current, target);
      }
    }
  }

  async checkOrder() {
    await this.checkOrderButton.click();
  }
}
