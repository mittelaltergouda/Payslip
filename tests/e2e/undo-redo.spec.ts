import { test, expect, Page } from '@playwright/test';

/**
 * Undo/Redo E2E Tests for SessionWizard
 *
 * These tests verify:
 * 1. Basic undo/redo operations (add member → undo → redo)
 * 2. Multiple operations can be undone in reverse order
 * 3. Redo stack is cleared after new edit following undo
 * 4. Settings changes can be undone (tax toggle, distribution mode)
 * 5. Keyboard shortcuts work (Ctrl+Z, Ctrl+Y)
 * 6. Buttons are properly enabled/disabled based on history state
 */

/**
 * Helper function to get the editable members table (not the results table)
 */
function getMembersTable(page: Page) {
  return page.locator('table').first();
}

test.describe('Undo/Redo Basic Operations', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Undo/Redo buttons are visible and initially disabled', async ({ page }) => {
    await page.waitForSelector('text=SC Payout Split');

    const undoButton = page.getByRole('button', { name: /Undo last change/i });
    const redoButton = page.getByRole('button', { name: /Redo last undone change/i });

    await expect(undoButton).toBeVisible();
    await expect(redoButton).toBeVisible();
    await expect(undoButton).toBeDisabled();
    await expect(redoButton).toBeDisabled();

    expect(consoleErrors).toHaveLength(0);
  });

  test('Basic undo/redo: add member → undo → redo', async ({ page }) => {
    await page.waitForSelector('text=SC Payout Split');

    const initialRows = await getMembersTable(page).locator('tbody tr').count();
    expect(initialRows).toBe(2);

    const addMemberButton = page.locator('button', { hasText: /\+ M(ember|itglied)/i }).first();
    await addMemberButton.click();
    await page.waitForTimeout(500);

    const afterAddRows = await getMembersTable(page).locator('tbody tr').count();
    expect(afterAddRows).toBe(3);

    const undoButton = page.getByRole('button', { name: /Undo last change/i });
    await expect(undoButton).toBeEnabled();
    await undoButton.click();
    await page.waitForTimeout(500);

    const afterUndoRows = await getMembersTable(page).locator('tbody tr').count();
    expect(afterUndoRows).toBe(2);

    const redoButton = page.getByRole('button', { name: /Redo last undone change/i });
    await expect(redoButton).toBeEnabled();
    await redoButton.click();
    await page.waitForTimeout(500);

    const afterRedoRows = await getMembersTable(page).locator('tbody tr').count();
    expect(afterRedoRows).toBe(3);

    expect(consoleErrors).toHaveLength(0);
  });

  test('Multiple operations: add 3 members → undo all', async ({ page }) => {
    await page.waitForSelector('text=SC Payout Split');

    const addMemberButton = page.locator('button', { hasText: /\+ M(ember|itglied)/i }).first();
    const undoButton = page.getByRole('button', { name: /Undo last change/i });

    for (let i = 0; i < 3; i++) {
      await addMemberButton.click();
      await page.waitForTimeout(300);
    }

    let rowCount = await getMembersTable(page).locator('tbody tr').count();
    expect(rowCount).toBe(5);

    for (let i = 0; i < 3; i++) {
      await expect(undoButton).toBeEnabled();
      await undoButton.click();
      await page.waitForTimeout(300);
    }

    rowCount = await getMembersTable(page).locator('tbody tr').count();
    expect(rowCount).toBe(2);

    expect(consoleErrors).toHaveLength(0);
  });

  test('Redo cleared by new edit', async ({ page }) => {
    await page.waitForSelector('text=SC Payout Split');

    const addMemberButton = page.locator('button', { hasText: /\+ M(ember|itglied)/i }).first();
    const undoButton = page.getByRole('button', { name: /Undo last change/i });
    const redoButton = page.getByRole('button', { name: /Redo last undone change/i });

    await addMemberButton.click();
    await page.waitForTimeout(500);

    await undoButton.click();
    await page.waitForTimeout(500);

    await expect(redoButton).toBeEnabled();

    await addMemberButton.click();
    await page.waitForTimeout(500);

    await expect(redoButton).toBeDisabled();

    expect(consoleErrors).toHaveLength(0);
  });
});

test.describe('Undo/Redo for Settings Changes', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Undo/redo distribution mode change', async ({ page }) => {
    await page.waitForSelector('text=SC Payout Split');

    const distributionSelect = page.locator('select').first();
    const undoButton = page.getByRole('button', { name: /Undo last change/i });
    const redoButton = page.getByRole('button', { name: /Redo last undone change/i });

    const initialValue = await distributionSelect.inputValue();
    expect(initialValue).toBe('EQUAL');

    await distributionSelect.selectOption('PERCENT');
    await page.waitForTimeout(500);

    let currentValue = await distributionSelect.inputValue();
    expect(currentValue).toBe('PERCENT');

    await expect(undoButton).toBeEnabled();
    await undoButton.click();
    await page.waitForTimeout(500);

    currentValue = await distributionSelect.inputValue();
    expect(currentValue).toBe('EQUAL');

    await expect(redoButton).toBeEnabled();
    await redoButton.click();
    await page.waitForTimeout(500);

    currentValue = await distributionSelect.inputValue();
    expect(currentValue).toBe('PERCENT');

    expect(consoleErrors).toHaveLength(0);
  });

  test('Undo/redo tax toggle', async ({ page }) => {
    await page.waitForSelector('text=SC Payout Split');

    const taxCheckbox = page.locator('input[type="checkbox"]').first();
    const undoButton = page.getByRole('button', { name: /Undo last change/i });
    const redoButton = page.getByRole('button', { name: /Redo last undone change/i });

    const initialState = await taxCheckbox.isChecked();
    expect(initialState).toBe(true);

    await taxCheckbox.click();
    await page.waitForTimeout(500);

    let currentState = await taxCheckbox.isChecked();
    expect(currentState).toBe(false);

    await expect(undoButton).toBeEnabled();
    await undoButton.click();
    await page.waitForTimeout(500);

    currentState = await taxCheckbox.isChecked();
    expect(currentState).toBe(true);

    await expect(redoButton).toBeEnabled();
    await redoButton.click();
    await page.waitForTimeout(500);

    currentState = await taxCheckbox.isChecked();
    expect(currentState).toBe(false);

    expect(consoleErrors).toHaveLength(0);
  });
});

test.describe('Keyboard Shortcuts', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Ctrl+Z undoes last action', async ({ page }) => {
    await page.waitForSelector('text=SC Payout Split');

    const addMemberButton = page.locator('button', { hasText: /\+ M(ember|itglied)/i }).first();
    await addMemberButton.click();
    await page.waitForTimeout(500);

    let rowCount = await getMembersTable(page).locator('tbody tr').count();
    expect(rowCount).toBe(3);

    const isMac = process.platform === 'darwin';
    if (isMac) {
      await page.keyboard.press('Meta+z');
    } else {
      await page.keyboard.press('Control+z');
    }
    await page.waitForTimeout(500);

    rowCount = await getMembersTable(page).locator('tbody tr').count();
    expect(rowCount).toBe(2);

    expect(consoleErrors).toHaveLength(0);
  });

  test('Ctrl+Y redoes last undone action', async ({ page }) => {
    await page.waitForSelector('text=SC Payout Split');

    const addMemberButton = page.locator('button', { hasText: /\+ M(ember|itglied)/i }).first();
    await addMemberButton.click();
    await page.waitForTimeout(500);

    const undoButton = page.getByRole('button', { name: /Undo last change/i });
    await undoButton.click();
    await page.waitForTimeout(500);

    let rowCount = await getMembersTable(page).locator('tbody tr').count();
    expect(rowCount).toBe(2);

    const isMac = process.platform === 'darwin';
    if (isMac) {
      await page.keyboard.press('Meta+Shift+z');
    } else {
      await page.keyboard.press('Control+y');
    }
    await page.waitForTimeout(500);

    rowCount = await getMembersTable(page).locator('tbody tr').count();
    expect(rowCount).toBe(3);

    expect(consoleErrors).toHaveLength(0);
  });
});

test.describe('Button State Management', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Buttons correctly reflect history state', async ({ page }) => {
    await page.waitForSelector('text=SC Payout Split');

    const undoButton = page.getByRole('button', { name: /Undo last change/i });
    const redoButton = page.getByRole('button', { name: /Redo last undone change/i });
    const addMemberButton = page.locator('button', { hasText: /\+ M(ember|itglied)/i }).first();

    await expect(undoButton).toBeDisabled();
    await expect(redoButton).toBeDisabled();

    await addMemberButton.click();
    await page.waitForTimeout(500);

    await expect(undoButton).toBeEnabled();
    await expect(redoButton).toBeDisabled();

    await undoButton.click();
    await page.waitForTimeout(500);

    await expect(redoButton).toBeEnabled();

    await redoButton.click();
    await page.waitForTimeout(500);

    await expect(undoButton).toBeEnabled();
    await expect(redoButton).toBeDisabled();

    expect(consoleErrors).toHaveLength(0);
  });

  test('Reset button clears session', async ({ page }) => {
    await page.waitForSelector('text=SC Payout Split');

    const undoButton = page.getByRole('button', { name: /Undo last change/i });
    const addMemberButton = page.locator('button', { hasText: /\+ M(ember|itglied)/i }).first();
    const resetButton = page.getByRole('button', { name: /Reset/i });

    await addMemberButton.click();
    await page.waitForTimeout(300);
    await addMemberButton.click();
    await page.waitForTimeout(300);

    await expect(undoButton).toBeEnabled();

    await resetButton.click();
    await page.waitForTimeout(500);

    await expect(undoButton).toBeEnabled();

    const rowCount = await getMembersTable(page).locator('tbody tr').count();
    expect(rowCount).toBe(2);

    expect(consoleErrors).toHaveLength(0);
  });
});
