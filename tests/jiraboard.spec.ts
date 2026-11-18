import { expect, test } from '@playwright/test';
import { testSetup } from '../POM/Hooks/before-each';
import { testTeardown } from '../POM/Hooks/after-each';
import { JiraBoard, JIRA_STORAGE_KEY } from '../POM/jiraboard';

let board: JiraBoard;

test.describe('Jira Board', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await testSetup(page, testInfo);
    await page.goto('/apps/jira-board/');
    board = new JiraBoard(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await testTeardown(page, testInfo);
  });

  test.describe('Happy path', () => {
    test('Default board shows eight issues across four columns', async () => {
      await test.step('Header shows the board title and total', async () => {
        await expect(board.heading).toBeVisible();
        await expect(board.totalCount).toHaveText('8 issues');
      });

      await test.step('Column counts match the seeded issues', async () => {
        await expect(board.columnCount('todo')).toHaveText('3');
        await expect(board.columnCount('inprogress')).toHaveText('2');
        await expect(board.columnCount('inreview')).toHaveText('1');
        await expect(board.columnCount('done')).toHaveText('2');
      });

      await test.step('Cards are placed in their columns', async () => {
        await expect(board.columnCards('todo')).toHaveCount(3);
        await expect(board.columnBody('inreview')).toContainText(
          'Fix broken search results'
        );
        await expect(board.columnBody('done')).toContainText(
          'Implement dark mode'
        );
      });
    });

    test('Create an issue with every field filled', async () => {
      await test.step('Fill and submit the create form', async () => {
        await board.createIssue({
          title: 'Checkout button misaligned',
          type: 'bug',
          priority: 'critical',
          assignee: 'Carol',
          description: 'Button overlaps the footer on small screens.',
        });
      });

      await test.step('Dialog closes and the issue lands in To Do', async () => {
        await expect(board.createDialog).toBeHidden();
        await expect(board.card('QAP-9')).toBeVisible();
        await expect(board.columnCards('todo')).toHaveCount(4);
        await expect(board.columnCount('todo')).toHaveText('4');
        await expect(board.totalCount).toHaveText('9 issues');
      });

      await test.step('Card shows type, title, priority and initials', async () => {
        await expect(board.card('QAP-9')).toContainText('bug');
        await expect(board.cardTitle('QAP-9')).toHaveText(
          'Checkout button misaligned'
        );
        await expect(board.card('QAP-9')).toContainText('critical');
        await expect(board.card('QAP-9')).toContainText('CA');
      });
    });

    test('Clicking a card opens its details', async () => {
      await test.step('Open issue QAP-6', async () => {
        await board.openDetail('QAP-6');
        await expect(board.detailDialog).toBeVisible();
      });

      await test.step('Detail dialog shows every field', async () => {
        await expect(board.detailId).toHaveText('QAP-6');
        await expect(board.detailType).toHaveText('bug');
        await expect(board.detailPriority).toHaveText('critical');
        await expect(board.detailTitle).toHaveText('Fix broken search results');
        await expect(board.detailStatus).toHaveText('In Review');
        await expect(board.detailAssignee).toHaveText('Carol');
        await expect(board.detailDescription).toHaveText(
          'Search returns incorrect results when the query contains special characters.'
        );
      });

      await test.step('Close button hides the dialog', async () => {
        await board.detailCloseButton.click();
        await expect(board.detailDialog).toBeHidden();
      });
    });

    test('Dragging an issue moves it to another column', async () => {
      await test.step('Drag QAP-1 from To Do to In Progress', async () => {
        await board.dragToColumn('QAP-1', 'inprogress');
      });

      await test.step('Card and column counts are updated', async () => {
        await expect(board.columnBody('inprogress')).toContainText(
          'Fix login form validation'
        );
        await expect(board.columnCount('todo')).toHaveText('2');
        await expect(board.columnCount('inprogress')).toHaveText('3');
        await expect(board.totalCount).toHaveText('8 issues');
      });

      await test.step('Detail dialog shows the new status', async () => {
        await board.openDetail('QAP-1');
        await expect(board.detailStatus).toHaveText('In Progress');
      });
    });

    test('Deleting an issue asks for confirmation then removes it', async () => {
      await test.step('Click the delete button on QAP-2', async () => {
        await board.requestDelete('QAP-2');
      });

      await test.step('Confirmation names the issue', async () => {
        await expect(board.confirmDialog).toBeVisible();
        await expect(board.confirmMessage).toHaveText(
          'QAP-2: "Add user profile page" will be permanently removed.'
        );
      });

      await test.step('Confirm the deletion', async () => {
        await board.confirmDeleteButton.click();
        await expect(board.confirmDialog).toBeHidden();
      });

      await test.step('Issue is gone and counts are updated', async () => {
        await expect(board.card('QAP-2')).toHaveCount(0);
        await expect(board.columnCount('todo')).toHaveText('2');
        await expect(board.totalCount).toHaveText('7 issues');
      });
    });

    test('Filtering by assignee shows only their issues', async () => {
      await test.step('Filter by Alice', async () => {
        await board.filterByAssignee('Alice');
      });

      await test.step("Only Alice's three issues are shown", async () => {
        await expect(board.cards).toHaveCount(3);
        for (const id of ['QAP-1', 'QAP-4', 'QAP-7']) {
          await expect(board.card(id)).toBeVisible();
        }
      });

      await test.step('Column counts still show unfiltered totals', async () => {
        await expect(board.columnCount('todo')).toHaveText('3');
        await expect(board.totalCount).toHaveText('8 issues');
      });
    });

    test('Filtering by priority and assignee combines both filters', async () => {
      await test.step('Filter by High priority', async () => {
        await board.filterByPriority('high');
        await expect(board.cards).toHaveCount(3);
      });

      await test.step('Add the Bob assignee filter', async () => {
        await board.filterByAssignee('Bob');
      });

      await test.step("Only Bob's high priority issues remain", async () => {
        await expect(board.cards).toHaveCount(2);
        await expect(board.card('QAP-5')).toBeVisible();
        await expect(board.card('QAP-8')).toBeVisible();
      });

      await test.step('Clearing the filters shows every issue again', async () => {
        await board.filterByPriority('');
        await board.filterByAssignee('');
        await expect(board.cards).toHaveCount(8);
      });
    });

    test('Board changes persist after reload', async ({ page }) => {
      await test.step('Create, move and delete issues', async () => {
        await board.createIssue({ title: 'Persisted issue' });
        await expect(board.card('QAP-9')).toBeVisible();
        await board.dragToColumn('QAP-3', 'done');
        await expect(board.columnCount('done')).toHaveText('3');
        await board.deleteIssue('QAP-8');
        await expect(board.card('QAP-8')).toHaveCount(0);
      });

      await test.step('Reload the page', async () => {
        await page.reload();
      });

      await test.step('Board state is restored', async () => {
        await expect(board.totalCount).toHaveText('8 issues');
        await expect(board.columnBody('todo')).toContainText('Persisted issue');
        await expect(board.columnBody('done')).toContainText(
          'Write REST API tests'
        );
        await expect(board.card('QAP-8')).toHaveCount(0);
      });
    });
  });

  test.describe('Edge cases', () => {
    test('Issue created with only a title uses default values', async () => {
      await test.step('Create an issue with just a title', async () => {
        await board.createIssue({ title: 'Minimal issue' });
        await expect(board.card('QAP-9')).toBeVisible();
      });

      await test.step('Card shows task, medium and unassigned avatar', async () => {
        await expect(board.card('QAP-9')).toContainText('task');
        await expect(board.card('QAP-9')).toContainText('medium');
        await expect(board.card('QAP-9')).toContainText('?');
      });

      await test.step('Details show Unassigned and an empty description', async () => {
        await board.openDetail('QAP-9');
        await expect(board.detailStatus).toHaveText('To Do');
        await expect(board.detailAssignee).toHaveText('Unassigned');
        await expect(board.detailDescription).toHaveText('—');
      });
    });

    test('Title is trimmed and HTML is shown as plain text', async () => {
      const title = '<b>Bold</b> & <i>script</i>';

      await test.step('Create an issue with padded HTML in the title', async () => {
        await board.createIssue({ title: `   ${title}   ` });
      });

      await test.step('Title is rendered literally and trimmed', async () => {
        await expect(board.cardTitle('QAP-9')).toHaveText(title);
        await expect(board.card('QAP-9').locator('b')).toHaveCount(0);
      });
    });

    test('Escape and clicking outside close the dialogs', async () => {
      await test.step('Escape closes the create dialog', async () => {
        await board.openCreateDialog();
        await expect(board.createDialog).toBeVisible();
        await board.titleInput.press('Escape');
        await expect(board.createDialog).toBeHidden();
      });

      await test.step('Clicking the overlay closes the detail dialog', async () => {
        await board.openDetail('QAP-4');
        await expect(board.detailDialog).toBeVisible();
        await board.clickOverlayOutsideDialog(board.detailOverlay);
        await expect(board.detailDialog).toBeHidden();
      });

      await test.step('The × button closes the create dialog', async () => {
        await board.openCreateDialog();
        await board.createCloseButton.click();
        await expect(board.createDialog).toBeHidden();
        await expect(board.cards).toHaveCount(8);
      });
    });

    test('Dropping an issue into its own column changes nothing', async () => {
      await test.step('Drag QAP-6 onto In Review', async () => {
        await board.dragToColumn('QAP-6', 'inreview');
      });

      await test.step('Counts and placement are unchanged', async () => {
        await expect(board.columnCards('inreview')).toHaveCount(1);
        await expect(board.columnCount('inreview')).toHaveText('1');
        await expect(board.totalCount).toHaveText('8 issues');
      });
    });

    test('Filters with no match show a placeholder in every column', async () => {
      await test.step('Filter by Carol and Medium priority', async () => {
        await board.filterByAssignee('Carol');
        await board.filterByPriority('medium');
      });

      await test.step('No cards are shown', async () => {
        await expect(board.cards).toHaveCount(0);
        await expect(board.page.getByText('No matching issues')).toHaveCount(4);
      });

      await test.step('Column counts keep the unfiltered totals', async () => {
        await expect(board.columnCount('todo')).toHaveText('3');
        await expect(board.columnCount('done')).toHaveText('2');
      });
    });

    test('Emptying a column shows a No issues placeholder', async () => {
      await test.step('Delete both Done issues', async () => {
        await board.deleteIssue('QAP-7');
        await expect(board.card('QAP-7')).toHaveCount(0);
        await board.deleteIssue('QAP-8');
      });

      await test.step('Done column shows No issues and a zero count', async () => {
        await expect(board.columnBody('done')).toHaveText('No issues');
        await expect(board.columnCount('done')).toHaveText('0');
        await expect(board.totalCount).toHaveText('6 issues');
      });
    });

    test('Deleted issue ids are not reused', async () => {
      await test.step('Delete the newest issue QAP-8', async () => {
        await board.deleteIssue('QAP-8');
        await expect(board.card('QAP-8')).toHaveCount(0);
      });

      await test.step('Create a new issue', async () => {
        await board.createIssue({ title: 'After delete' });
      });

      await test.step('New issue gets id QAP-9', async () => {
        await expect(board.card('QAP-9')).toBeVisible();
        await expect(board.card('QAP-8')).toHaveCount(0);
      });
    });

    test('Issue can be created with the keyboard only', async ({ page }) => {
      await test.step('Open the create dialog with Enter', async () => {
        await board.createIssueButton.focus();
        await page.keyboard.press('Enter');
        await expect(board.titleInput).toBeFocused();
      });

      await test.step('Type a title and submit with Enter', async () => {
        await page.keyboard.type('Keyboard issue');
        await page.keyboard.press('Enter');
      });

      await test.step('Issue is created and the dialog closes', async () => {
        await expect(board.createDialog).toBeHidden();
        await expect(board.cardTitle('QAP-9')).toHaveText('Keyboard issue');
      });
    });

    test('Board scrolls horizontally inside its container on mobile', async ({
      page,
    }) => {
      await test.step('Resize to a phone viewport', async () => {
        await page.setViewportSize({ width: 375, height: 667 });
      });

      await test.step('Board overflows its container, not the page', async () => {
        await expect
          .poll(() =>
            board.board.evaluate((el) => el.scrollWidth > el.clientWidth)
          )
          .toBe(true);
        await expect
          .poll(() => page.locator('html').evaluate((el) => el.scrollWidth))
          .toBe(375);
      });

      await test.step('Create dialog still works', async () => {
        await board.createIssue({ title: 'Mobile issue' });
        await expect(board.totalCount).toHaveText('9 issues');
      });
    });
  });

  test.describe('Negative cases', () => {
    test('Empty title shows an error and keeps the dialog open', async () => {
      await test.step('Submit the form without a title', async () => {
        await board.openCreateDialog();
        await board.createSubmitButton.click();
      });

      await test.step('Error is shown and focus returns to the title', async () => {
        await expect(board.titleError).toHaveText('Title is required');
        await expect(board.titleInput).toHaveClass(/invalid/);
        await expect(board.titleInput).toBeFocused();
        await expect(board.createDialog).toBeVisible();
      });

      await test.step('No issue was created', async () => {
        await expect(board.totalCount).toHaveText('8 issues');
      });
    });

    test('Whitespace-only title is rejected', async () => {
      await test.step('Submit a title made of spaces', async () => {
        await board.openCreateDialog();
        await board.fillCreateForm({ title: '     ' });
        await board.createSubmitButton.click();
      });

      await test.step('Error is shown and no issue is created', async () => {
        await expect(board.titleError).toHaveText('Title is required');
        await expect(board.createDialog).toBeVisible();
        await expect(board.totalCount).toHaveText('8 issues');
      });
    });

    test('Reopening the create dialog clears the previous error and input', async () => {
      await test.step('Trigger the error, type text and cancel', async () => {
        await board.openCreateDialog();
        await board.createSubmitButton.click();
        await expect(board.titleError).toHaveText('Title is required');
        await board.fillCreateForm({ title: 'Draft', priority: 'high' });
        await board.createCancelButton.click();
        await expect(board.createDialog).toBeHidden();
      });

      await test.step('Reopen the dialog', async () => {
        await board.openCreateDialog();
      });

      await test.step('Form is reset with no error', async () => {
        await expect(board.titleError).toHaveText('');
        await expect(board.titleInput).not.toHaveClass(/invalid/);
        await expect(board.titleInput).toHaveValue('');
        await expect(board.prioritySelect).toHaveValue('medium');
      });

      await test.step('Cancelled draft was not created', async () => {
        await expect(board.totalCount).toHaveText('8 issues');
      });
    });

    test('Cancelling a delete keeps the issue', async () => {
      await test.step('Request delete of QAP-5', async () => {
        await board.requestDelete('QAP-5');
        await expect(board.confirmDialog).toBeVisible();
      });

      await test.step('Cancel the confirmation', async () => {
        await board.confirmCancelButton.click();
        await expect(board.confirmDialog).toBeHidden();
      });

      await test.step('Issue and counts are unchanged', async () => {
        await expect(board.card('QAP-5')).toBeVisible();
        await expect(board.columnCount('inprogress')).toHaveText('2');
        await expect(board.totalCount).toHaveText('8 issues');
      });
    });

    test('Delete button does not open the issue details', async () => {
      await test.step('Click the delete button on QAP-3', async () => {
        await board.requestDelete('QAP-3');
      });

      await test.step('Only the confirmation dialog opens', async () => {
        await expect(board.confirmDialog).toBeVisible();
        await expect(board.detailDialog).toBeHidden();
      });

      await test.step('Escape closes the confirmation without deleting', async () => {
        await board.page.keyboard.press('Escape');
        await expect(board.confirmDialog).toBeHidden();
        await expect(board.card('QAP-3')).toBeVisible();
      });
    });

    test('Corrupted saved data falls back to the default board', async ({
      page,
    }) => {
      await test.step('Store invalid JSON and reload', async () => {
        await page.evaluate(
          (key) => localStorage.setItem(key, '{not valid json'),
          JIRA_STORAGE_KEY
        );
        await page.reload();
      });

      await test.step('Default eight issues are shown', async () => {
        await expect(board.totalCount).toHaveText('8 issues');
        await expect(board.cards).toHaveCount(8);
      });
    });
  });
});
