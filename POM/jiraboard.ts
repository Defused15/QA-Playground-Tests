import { Page, Locator } from '@playwright/test';

export const JIRA_STORAGE_KEY = 'qap_board';

export const COLUMNS = {
  todo: 'To Do',
  inprogress: 'In Progress',
  inreview: 'In Review',
  done: 'Done',
} as const;

export type ColumnKey = keyof typeof COLUMNS;

export interface NewIssue {
  title: string;
  type?: 'task' | 'bug' | 'story';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  assignee?: 'Unassigned' | 'Alice' | 'Bob' | 'Carol';
  description?: string;
}

export class JiraBoard {
  readonly page: Page;
  readonly heading: Locator;
  readonly totalCount: Locator;
  readonly assigneeFilter: Locator;
  readonly priorityFilter: Locator;
  readonly createIssueButton: Locator;
  readonly board: Locator;
  readonly cards: Locator;

  // Create dialog
  readonly createOverlay: Locator;
  readonly createDialog: Locator;
  readonly titleInput: Locator;
  readonly titleError: Locator;
  readonly typeSelect: Locator;
  readonly prioritySelect: Locator;
  readonly assigneeSelect: Locator;
  readonly descriptionInput: Locator;
  readonly createSubmitButton: Locator;
  readonly createCancelButton: Locator;
  readonly createCloseButton: Locator;

  // Detail dialog
  readonly detailOverlay: Locator;
  readonly detailDialog: Locator;
  readonly detailId: Locator;
  readonly detailType: Locator;
  readonly detailPriority: Locator;
  readonly detailTitle: Locator;
  readonly detailStatus: Locator;
  readonly detailAssignee: Locator;
  readonly detailDescription: Locator;
  readonly detailCloseButton: Locator;

  // Delete confirmation dialog
  readonly confirmDialog: Locator;
  readonly confirmMessage: Locator;
  readonly confirmDeleteButton: Locator;
  readonly confirmCancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'QA Project Board' });
    this.totalCount = page.getByText(/^\d+ issues?$/);
    this.assigneeFilter = page.getByLabel('Filter by assignee');
    this.priorityFilter = page.getByLabel('Filter by priority');
    this.createIssueButton = page.getByRole('button', {
      name: '+ Create Issue',
    });
    // Board, columns and cards are plain divs with no accessible roles
    this.board = page.locator('#board');
    this.cards = page.locator('.issue-card');

    // Overlays are the click-outside targets around each dialog
    this.createOverlay = page.locator('#create-modal');
    this.createDialog = page.getByRole('dialog', { name: 'Create Issue' });
    this.titleInput = this.createDialog.getByLabel('Title');
    this.titleError = this.createDialog.getByRole('alert');
    this.typeSelect = this.createDialog.getByLabel('Type');
    this.prioritySelect = this.createDialog.getByLabel('Priority');
    this.assigneeSelect = this.createDialog.getByLabel('Assignee');
    this.descriptionInput = this.createDialog.getByLabel('Description');
    this.createSubmitButton = this.createDialog.getByRole('button', {
      name: 'Create',
    });
    this.createCancelButton = this.createDialog.getByRole('button', {
      name: 'Cancel',
    });
    this.createCloseButton = this.createDialog.getByRole('button', {
      name: 'Close',
    });

    // Detail fields are unlabeled spans, so they are located by id
    this.detailOverlay = page.locator('#detail-modal');
    this.detailDialog = this.detailOverlay.getByRole('dialog');
    this.detailId = page.locator('#detail-id');
    this.detailType = page.locator('#detail-type');
    this.detailPriority = page.locator('#detail-priority');
    this.detailTitle = this.detailDialog.getByRole('heading');
    this.detailStatus = page.locator('#detail-status');
    this.detailAssignee = page.locator('#detail-assignee');
    this.detailDescription = page.locator('#detail-desc');
    // Both the "×" and the footer button are named "Close"; use the footer one
    this.detailCloseButton = page.locator('#detail-close-btn');

    this.confirmDialog = page.getByRole('dialog', { name: 'Delete Issue?' });
    this.confirmMessage = this.confirmDialog.getByRole('paragraph');
    this.confirmDeleteButton = this.confirmDialog.getByRole('button', {
      name: 'Delete',
    });
    this.confirmCancelButton = this.confirmDialog.getByRole('button', {
      name: 'Cancel',
    });
  }

  card(id: string): Locator {
    return this.page.locator(`.issue-card[data-id="${id}"]`);
  }

  cardTitle(id: string): Locator {
    return this.card(id).getByRole('paragraph');
  }

  cardDeleteButton(id: string): Locator {
    return this.page.getByRole('button', { name: `Delete ${id}`, exact: true });
  }

  columnBody(column: ColumnKey): Locator {
    return this.page.locator(`#body-${column}`);
  }

  columnCards(column: ColumnKey): Locator {
    return this.columnBody(column).locator('.issue-card');
  }

  columnCount(column: ColumnKey): Locator {
    return this.page.locator(`#count-${column}`);
  }

  async openCreateDialog() {
    await this.createIssueButton.click();
  }

  async fillCreateForm(issue: NewIssue) {
    await this.titleInput.fill(issue.title);
    if (issue.type) await this.typeSelect.selectOption(issue.type);
    if (issue.priority) await this.prioritySelect.selectOption(issue.priority);
    if (issue.assignee) await this.assigneeSelect.selectOption(issue.assignee);
    if (issue.description !== undefined) {
      await this.descriptionInput.fill(issue.description);
    }
  }

  async createIssue(issue: NewIssue) {
    await this.openCreateDialog();
    await this.fillCreateForm(issue);
    await this.createSubmitButton.click();
  }

  async openDetail(id: string) {
    await this.cardTitle(id).click();
  }

  async requestDelete(id: string) {
    await this.cardDeleteButton(id).click();
  }

  async deleteIssue(id: string) {
    await this.requestDelete(id);
    await this.confirmDeleteButton.click();
  }

  async dragToColumn(id: string, column: ColumnKey) {
    await this.card(id).dragTo(this.columnBody(column));
  }

  async filterByAssignee(assignee: string) {
    await this.assigneeFilter.selectOption(assignee);
  }

  async filterByPriority(priority: string) {
    await this.priorityFilter.selectOption(priority);
  }

  // The site's fixed announcement bar sits above the overlay at the top, so
  // click the overlay's bottom-left corner instead
  async clickOverlayOutsideDialog(overlay: Locator) {
    const box = await overlay.boundingBox();
    if (!box) throw new Error('Overlay is not visible');
    await overlay.click({ position: { x: 5, y: box.height - 5 } });
  }
}
