import { expect, test } from '@playwright/test';
import { testSetup } from '../POM/Hooks/before-each';
import { testTeardown } from '../POM/Hooks/after-each';
import { DEFAULT_TAGS, MAX_TAGS, TagsInput } from '../POM/tagsinput';

let tags: TagsInput;

const remaining = (count: number) => `${count} tags are remaining`;

test.describe('Tags Input Box', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await testSetup(page, testInfo);
    await page.goto('/apps/tags-input-box/');
    tags = new TagsInput(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await testTeardown(page, testInfo);
  });

  test.describe('Happy path', () => {
    test('Default state shows two preset tags', async () => {
      await test.step('Heading and hint are visible', async () => {
        await expect(tags.heading).toBeVisible();
        await expect(tags.hint).toBeVisible();
      });

      await test.step('Preset tags and counter are shown', async () => {
        await expect(tags.tags).toHaveText(DEFAULT_TAGS);
        await expect(tags.remainingText).toHaveText(
          remaining(MAX_TAGS - DEFAULT_TAGS.length)
        );
      });

      await test.step('Input is empty and focused', async () => {
        await expect(tags.input).toHaveValue('');
        await expect(tags.input).toBeFocused();
      });
    });

    test('Enter adds a tag and clears the input', async () => {
      await test.step('Add "playwright"', async () => {
        await tags.addTag('playwright');
      });

      await test.step('Tag is appended and counter decreases', async () => {
        await expect(tags.tags).toHaveText([...DEFAULT_TAGS, 'playwright']);
        await expect(tags.remainingText).toHaveText(remaining(7));
      });

      await test.step('Input is cleared', async () => {
        await expect(tags.input).toHaveValue('');
      });
    });

    test('Comma-separated value adds several tags at once', async () => {
      await test.step('Add "react,vue,angular"', async () => {
        await tags.addTag('react,vue,angular');
      });

      await test.step('Each part becomes its own tag', async () => {
        await expect(tags.tags).toHaveText([
          ...DEFAULT_TAGS,
          'react',
          'vue',
          'angular',
        ]);
        await expect(tags.remainingText).toHaveText(remaining(5));
      });
    });

    test('Clicking x removes a single tag', async () => {
      await test.step('Remove "node"', async () => {
        await tags.removeTag('node');
      });

      await test.step('Only "javascript" remains', async () => {
        await expect(tags.tags).toHaveText(['javascript']);
        await expect(tags.remainingText).toHaveText(remaining(9));
      });
    });

    test('Remove All clears every tag', async () => {
      await test.step('Add a tag, then click Remove All', async () => {
        await tags.addTag('playwright');
        await expect(tags.tags).toHaveCount(3);
        await tags.removeAll();
      });

      await test.step('List is empty and full capacity is restored', async () => {
        await expect(tags.tags).toHaveCount(0);
        await expect(tags.remainingText).toHaveText(remaining(MAX_TAGS));
      });
    });
  });

  test.describe('Edge cases', () => {
    test('Two characters is the minimum accepted tag length', async () => {
      await test.step('Add "go"', async () => {
        await tags.addTag('go');
      });

      await test.step('Tag is added', async () => {
        await expect(tags.tag('go')).toBeVisible();
        await expect(tags.remainingText).toHaveText(remaining(7));
      });
    });

    test('Repeated whitespace inside a tag is collapsed', async () => {
      await test.step('Add "hello     world"', async () => {
        await tags.addTag('hello     world');
      });

      await test.step('Tag text uses a single space', async () => {
        // toHaveText normalises whitespace, so check the raw text content
        await expect
          .poll(() => tags.tags.last().textContent())
          .toBe('hello world ');
      });
    });

    test('Duplicate check is case-sensitive', async () => {
      await test.step('Add "Node" while "node" exists', async () => {
        await tags.addTag('Node');
      });

      await test.step('Both casings are present', async () => {
        await expect(tags.tags).toHaveText([...DEFAULT_TAGS, 'Node']);
      });
    });

    test('Limit of 10 tags blocks further additions', async () => {
      const extra = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'];

      await test.step('Fill up to 10 tags', async () => {
        await tags.addTags(extra);
        await expect(tags.tags).toHaveCount(MAX_TAGS);
        await expect(tags.remainingText).toHaveText(remaining(0));
      });

      await test.step('Try to add an 11th tag', async () => {
        await tags.addTag('overflow');
      });

      await test.step('Tag is rejected and input is cleared', async () => {
        await expect(tags.tags).toHaveCount(MAX_TAGS);
        await expect(tags.tag('overflow')).toHaveCount(0);
        await expect(tags.input).toHaveValue('');
      });
    });

    // App checks the limit before splitting on commas, so a list can overflow it
    test('Comma list can exceed the 10-tag limit', async () => {
      await test.step('Fill up to 9 tags', async () => {
        await tags.addTags(['t1', 't2', 't3', 't4', 't5', 't6', 't7']);
        await expect(tags.remainingText).toHaveText(remaining(1));
      });

      await test.step('Add three tags in one comma list', async () => {
        await tags.addTag('a1,b2,c3');
      });

      await test.step('All three are added and the counter goes negative', async () => {
        await expect(tags.tags).toHaveCount(12);
        await expect(tags.remainingText).toHaveText(remaining(-2));
      });
    });

    // App splits without filtering empties, so a trailing comma adds a blank tag
    test('Trailing comma adds an empty tag', async () => {
      await test.step('Add "vue,"', async () => {
        await tags.addTag('vue,');
      });

      await test.step('A blank tag is created after "vue"', async () => {
        await expect(tags.tags).toHaveText([...DEFAULT_TAGS, 'vue', '']);
        await expect(tags.remainingText).toHaveText(remaining(6));
      });
    });

    test('Rapid successive additions keep order', async () => {
      const burst = ['one', 'two', 'three', 'four', 'five'];

      await test.step('Add five tags back to back', async () => {
        await tags.addTags(burst);
      });

      await test.step('All tags appear in entry order', async () => {
        await expect(tags.tags).toHaveText([...DEFAULT_TAGS, ...burst]);
        await expect(tags.remainingText).toHaveText(remaining(3));
      });
    });

    test('Removed tag can be added again', async () => {
      await test.step('Remove "javascript"', async () => {
        await tags.removeTag('javascript');
        await expect(tags.tag('javascript')).toHaveCount(0);
      });

      await test.step('Add "javascript" again', async () => {
        await tags.addTag('javascript');
      });

      await test.step('Tag is back at the end of the list', async () => {
        await expect(tags.tags).toHaveText(['node', 'javascript']);
        await expect(tags.remainingText).toHaveText(remaining(8));
      });
    });

    test('Adding and removing works on a mobile viewport', async ({ page }) => {
      await test.step('Resize to phone width', async () => {
        await page.setViewportSize({ width: 375, height: 667 });
        await expect(tags.input).toBeVisible();
      });

      await test.step('Add and remove a tag', async () => {
        await tags.addTag('mobile');
        await expect(tags.tag('mobile')).toBeVisible();
        await tags.removeTag('mobile');
      });

      await test.step('List is back to the defaults', async () => {
        await expect(tags.tags).toHaveText(DEFAULT_TAGS);
      });
    });
  });

  test.describe('Negative cases', () => {
    test('Single-character tag is rejected', async () => {
      await test.step('Add "a"', async () => {
        await tags.addTag('a');
      });

      await test.step('Nothing is added and input is cleared', async () => {
        await expect(tags.tags).toHaveText(DEFAULT_TAGS);
        await expect(tags.input).toHaveValue('');
      });
    });

    test('Duplicate tag is rejected', async () => {
      await test.step('Add "node" again', async () => {
        await tags.addTag('node');
      });

      await test.step('List and counter are unchanged', async () => {
        await expect(tags.tag('node')).toHaveCount(1);
        await expect(tags.remainingText).toHaveText(remaining(8));
        await expect(tags.input).toHaveValue('');
      });
    });

    test('Whitespace-only tag is rejected', async () => {
      await test.step('Add only spaces', async () => {
        await tags.addTag('      ');
      });

      await test.step('Nothing is added', async () => {
        await expect(tags.tags).toHaveText(DEFAULT_TAGS);
        await expect(tags.remainingText).toHaveText(remaining(8));
      });
    });

    // Hint says a comma commits a tag, but only Enter does
    test('Typing a comma alone does not commit a tag', async () => {
      await test.step('Type "react," without pressing Enter', async () => {
        await tags.input.pressSequentially('react,');
      });

      await test.step('No tag is added and text stays in the input', async () => {
        await expect(tags.input).toHaveValue('react,');
        await expect(tags.tags).toHaveText(DEFAULT_TAGS);
      });
    });

    test('Remove All on an empty list keeps the counter at 10', async () => {
      await test.step('Click Remove All twice', async () => {
        await tags.removeAll();
        await expect(tags.tags).toHaveCount(0);
        await tags.removeAll();
      });

      await test.step('Counter never exceeds the maximum', async () => {
        await expect(tags.tags).toHaveCount(0);
        await expect(tags.remainingText).toHaveText(remaining(MAX_TAGS));
      });
    });
  });
});
