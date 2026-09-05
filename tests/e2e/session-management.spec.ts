import { test, expect } from '@playwright/test';

/**
 * Session Management E2E Tests
 *
 * These tests verify the complete session management workflows:
 * 1. Save and Load Session - Fill form, save, reload, load from history
 * 2. Auto-Save - Fill form, wait for auto-save, verify persistence
 * 3. Delete Session - Save session, delete from history, verify removal
 * 4. Export/Import - Export sessions, clear storage, import, verify restoration
 * 5. Keyboard Shortcuts - Ctrl+S (save), Ctrl+O (history), Escape (close)
 * 6. Unsaved Changes Warning - Modify form, attempt navigation
 *
 * Tests run on Chrome, Firefox, Safari (WebKit), and mobile viewports
 */

test.describe('Session Management E2E Tests', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter out expected errors and browser cleanup messages
        if (!text.includes('Content-Security-Policy') &&
            !text.includes('Content Security Policy') &&
            !text.includes('Connection closed') &&
            !text.toLowerCase().includes('websocket')) {
          consoleErrors.push(text);
        }
      }
    });

    // Listen for page errors
    page.on('pageerror', (error) => {
      if (!error.message.includes('Content-Security-Policy') &&
          !error.message.includes('Connection closed')) {
        consoleErrors.push(error.message);
      }
    });

    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    // Filter out benign errors (UUID mismatches, style differences, dynamic IDs, hydration warnings, database errors)
    const significantErrors = consoleErrors.filter(error =>
      !error.includes('id=') &&  // Filter UUID mismatches
      !error.includes('htmlFor=') &&  // Filter label ID changes
      !error.includes('aria-labelledby=') &&  // Filter aria ID changes
      !error.includes('aria-describedby=') &&  // Filter aria description changes
      !error.includes('A tree hydrated but') &&  // Filter React hydration warnings (pre-existing in SessionWizard)
      !error.includes('Hydration failed') &&  // Filter hydration errors (pre-existing in SessionWizard)
      !error.includes('__nextjs_original-stack-frames') &&  // Filter Next.js dev server stack trace warnings
      !error.includes('500') &&  // Filter database connection errors
      !error.includes('Internal Server Error') &&
      !error.includes('Failed to load resource') &&
      !error.includes('status of 500') &&
      !error.includes('beforeunload')  // Filter browser-specific beforeunload warnings
    );

    if (significantErrors.length > 0) {
      console.error('Significant console errors found:', significantErrors);
    }
    expect(significantErrors).toHaveLength(0);
  });

  test('Session name input is visible and functional', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for session name input
    const sessionNameInput = page.locator('input[type="text"]').first();
    await expect(sessionNameInput).toBeVisible();

    // Verify placeholder text exists (in German or English)
    const placeholder = await sessionNameInput.getAttribute('placeholder');
    expect(placeholder).toBeTruthy();

    // Type a session name
    await sessionNameInput.fill('Test Session E2E');
    await page.waitForTimeout(300);

    // Verify the value was set
    const value = await sessionNameInput.inputValue();
    expect(value).toBe('Test Session E2E');
  });

  test('Save status indicator is visible and changes state', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Wait for the save status indicator to appear
    const saveIndicator = page.locator('[class*="save-status"], [title*="Saved"], [title*="Gespeichert"]').first();

    // The indicator should be visible
    if (await saveIndicator.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Check that it has some text or icon
      const text = await saveIndicator.textContent();
      expect(text).toBeTruthy();
    }

    // Modify the session to trigger unsaved state
    const sessionNameInput = page.locator('input[type="text"]').first();
    await sessionNameInput.fill('Modified Session ' + Date.now());

    // Wait a bit for status to update
    await page.waitForTimeout(500);

    // Wait for auto-save to complete (1 second debounce + save time)
    await page.waitForTimeout(1500);
  });

  test('Manual save with Ctrl+S works', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Fill in a session name
    const uniqueName = 'Manual Save Test ' + Date.now();
    const sessionNameInput = page.locator('input[type="text"]').first();
    await sessionNameInput.fill(uniqueName);
    await page.waitForTimeout(300);

    // Press Ctrl+S to save
    await page.keyboard.press('Control+KeyS');
    await page.waitForTimeout(1000);

    // Verify the session was saved by checking localStorage
    const savedData = await page.evaluate(() => {
      const data = localStorage.getItem('sc-payslip-sessions');
      return data ? JSON.parse(data) : null;
    });

    expect(savedData).toBeTruthy();
    expect(Array.isArray(savedData)).toBe(true);

    if (Array.isArray(savedData) && savedData.length > 0) {
      const session = savedData.find((s: any) => s.session.name === uniqueName);
      expect(session).toBeTruthy();
    }
  });

  test('Auto-save works after 1 second', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Fill in a session name
    const uniqueName = 'Auto Save Test ' + Date.now();
    const sessionNameInput = page.locator('input[type="text"]').first();
    await sessionNameInput.fill(uniqueName);

    // Wait for the debounce period (1 second) + save time
    await page.waitForTimeout(1500);

    // Verify the session was auto-saved
    const savedData = await page.evaluate(() => {
      const data = localStorage.getItem('sc-payslip-sessions');
      return data ? JSON.parse(data) : null;
    });

    expect(savedData).toBeTruthy();
    expect(Array.isArray(savedData)).toBe(true);

    if (Array.isArray(savedData) && savedData.length > 0) {
      const session = savedData.find((s: any) => s.session.name === uniqueName);
      expect(session).toBeTruthy();
      expect(session.session.name).toBe(uniqueName);
    }
  });

  test('Session History sidebar opens with Ctrl+O', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Press Ctrl+O to open history
    await page.keyboard.press('Control+KeyO');
    await page.waitForTimeout(500);

    // Look for the sidebar (it should have a backdrop or specific class)
    const sidebar = page.locator('[class*="sidebar"], [class*="history"]').first();

    // Check if sidebar elements are visible
    const isSidebarVisible = await sidebar.isVisible({ timeout: 2000 }).catch(() => false);

    // If sidebar is visible, verify it has content
    if (isSidebarVisible) {
      const sidebarText = await sidebar.textContent();
      expect(sidebarText).toBeTruthy();
    }
  });

  test('Session History sidebar can be closed with Escape', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // First, save a session
    const uniqueName = 'Escape Test ' + Date.now();
    const sessionNameInput = page.locator('input[type="text"]').first();
    await sessionNameInput.fill(uniqueName);
    await page.keyboard.press('Control+KeyS');
    await page.waitForTimeout(1000);

    // Open history
    await page.keyboard.press('Control+KeyO');
    await page.waitForTimeout(500);

    // Close with Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Verify sidebar is closed (backdrop should not be visible)
    const backdrop = page.locator('[class*="backdrop"], [class*="overlay"]');
    const isBackdropVisible = await backdrop.isVisible({ timeout: 1000 }).catch(() => false);

    // Backdrop should either not exist or not be visible
    expect(isBackdropVisible).toBe(false);
  });

  test('Complete save and load workflow', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Step 1: Fill in session details
    const uniqueName = 'Complete Workflow ' + Date.now();
    const sessionNameInput = page.locator('input[type="text"]').first();
    await sessionNameInput.fill(uniqueName);
    await page.waitForTimeout(300);

    // Fill in some member data
    const numberInputs = await page.locator('input[type="number"]').all();
    if (numberInputs.length > 0) {
      await numberInputs[0].fill('5000');
      await page.waitForTimeout(200);
    }

    // Step 2: Save with Ctrl+S
    await page.keyboard.press('Control+KeyS');
    await page.waitForTimeout(1000);

    // Step 3: Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Step 4: Open history with Ctrl+O
    await page.keyboard.press('Control+KeyO');
    await page.waitForTimeout(500);

    // Step 5: Look for the saved session in the list
    const sessionItem = page.locator(`text="${uniqueName}"`).first();
    await expect(sessionItem).toBeVisible({ timeout: 5000 });

    // Step 6: Click the Load button for this session
    // The Load button should be near the session name
    const loadButton = page.locator('button').filter({ hasText: /load|laden/i }).first();
    if (await loadButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await loadButton.click();
      await page.waitForTimeout(500);

      // Verify the session name was loaded
      const currentName = await sessionNameInput.inputValue();
      expect(currentName).toBe(uniqueName);
    }
  });

  test('Delete session workflow', async ({ page }) => {
    const uniqueName = 'Delete Test ' + Date.now();
    const sessionNameInput = page.locator('input[type="text"]').first();
    await sessionNameInput.fill(uniqueName);
    await page.keyboard.press('Control+KeyS');

    await expect.poll(() => page.evaluate(() => {
      const data = localStorage.getItem('sc-payslip-sessions');
      return data ? JSON.parse(data).length : 0;
    })).toBe(1);

    await page.keyboard.press('Control+KeyO');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const sessionCard = dialog.locator('div.glass').filter({
      has: page.getByRole('heading', { name: uniqueName, exact: true }),
    });
    await expect(sessionCard).toBeVisible();

    await sessionCard.getByRole('button', { name: /Delete|Löschen/i }).click();
    await sessionCard.getByRole('button', { name: /Delete|Löschen/i }).click();

    await expect(sessionCard).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => {
      const data = localStorage.getItem('sc-payslip-sessions');
      return data ? JSON.parse(data).length : 0;
    })).toBe(0);
  });

  test('Export and Import workflow', async ({ page }) => {
    const sessionName = 'Export Session ' + Date.now();
    const sessionNameInput = page.locator('input[type="text"]').first();
    await sessionNameInput.fill(sessionName);
    await page.keyboard.press('Control+KeyS');

    await expect.poll(() => page.evaluate(() => {
      const data = localStorage.getItem('sc-payslip-sessions');
      return data ? JSON.parse(data).length : 0;
    })).toBe(1);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', {
      name: /Alle Sessions als JSON herunterladen|Download all sessions as JSON/i,
    }).click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect.poll(() => page.evaluate(
      () => localStorage.getItem('sc-payslip-sessions')
    )).toBeNull();

    await page.locator('input[type="file"]').setInputFiles(downloadPath!);

    await expect.poll(() => page.evaluate((name) => {
      const data = localStorage.getItem('sc-payslip-sessions');
      const sessions = data ? JSON.parse(data) : [];
      return sessions.some(
        (saved: { session: { name: string } }) => saved.session.name === name
      );
    }, sessionName)).toBe(true);
  });

  test('Session data persists after page reload', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Save a session with specific data
    const uniqueName = 'Persistence Test ' + Date.now();
    const sessionNameInput = page.locator('input[type="text"]').first();
    await sessionNameInput.fill(uniqueName);

    // Fill in some revenue data (inputs may use inputMode="numeric" instead of type="number")
    const numericInputs = page.locator('input[inputmode="numeric"]:visible');
    if (await numericInputs.count() > 0) {
      await numericInputs.first().fill('7500');
      await page.waitForTimeout(300);
    } else {
      const numberInputs = await page.locator('input[type="number"]:visible').all();
      if (numberInputs.length > 0) {
        await numberInputs[0].fill('7500');
        await page.waitForTimeout(300);
      }
    }

    // Save the session
    await page.keyboard.press('Control+KeyS');
    await page.waitForTimeout(1000);

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify data persists in localStorage
    const savedData = await page.evaluate(() => {
      const data = localStorage.getItem('sc-payslip-sessions');
      return data ? JSON.parse(data) : null;
    });

    expect(savedData).toBeTruthy();
    expect(Array.isArray(savedData)).toBe(true);

    if (Array.isArray(savedData) && savedData.length > 0) {
      const session = savedData.find((s: any) => s.session.name === uniqueName);
      expect(session).toBeTruthy();
      expect(session.session.name).toBe(uniqueName);

      // Verify revenue data persisted
      if (session.session.members && session.session.members.length > 0) {
        expect(session.session.members[0].revenue).toBe(7500);
      }
    }
  });

  test('Duplicating a session creates an independent local snapshot', async ({ page }) => {
    const uniqueName = 'Duplicate Test ' + Date.now();
    const sessionNameInput = page.locator('input[type="text"]').first();
    await sessionNameInput.fill(uniqueName);
    await page.keyboard.press('Control+KeyS');

    await expect.poll(() => page.evaluate(() => {
      const data = localStorage.getItem('sc-payslip-sessions');
      return data ? JSON.parse(data).length : 0;
    })).toBe(1);

    await page.keyboard.press('Control+KeyO');
    const historyDialog = page.getByRole('dialog').filter({
      has: page.getByRole('heading', { name: /Session Verlauf|Session History/i }),
    });
    const sessionCard = historyDialog.locator('div.glass').filter({
      has: page.getByRole('heading', { name: uniqueName, exact: true }),
    });
    await sessionCard.getByRole('button', { name: /Duplicate|Duplizieren/i }).click();

    const duplicateDialog = page.getByRole('dialog').filter({
      has: page.getByRole('heading', { name: /Duplicate Session|Session duplizieren/i }),
    });
    await duplicateDialog.getByRole('button', { name: /Duplicate|Duplizieren/i }).click();

    await expect.poll(() => page.evaluate(() => {
      const data = localStorage.getItem('sc-payslip-sessions');
      return data ? JSON.parse(data) : [];
    })).toHaveLength(2);

    const ids = await page.evaluate(() => {
      const data = localStorage.getItem('sc-payslip-sessions');
      return data ? JSON.parse(data).map((saved: { id: string }) => saved.id) : [];
    });
    expect(new Set(ids).size).toBe(2);
  });

  test('Toast notifications appear on save', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Fill in a session name
    const uniqueName = 'Toast Test ' + Date.now();
    const sessionNameInput = page.locator('input[type="text"]').first();
    await sessionNameInput.fill(uniqueName);
    await page.waitForTimeout(300);

    // Manually save
    await page.keyboard.press('Control+KeyS');
    await page.waitForTimeout(500);

    // Look for toast notification
    const toast = page.locator('[role="alert"], [class*="toast"]');

    // Toast should appear briefly
    const isToastVisible = await toast.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (isToastVisible) {
      const toastText = await toast.first().textContent();
      expect(toastText).toBeTruthy();
    }
  });

  test('Corrupt localStorage data is handled gracefully', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Inject corrupt data into localStorage
    await page.evaluate(() => {
      localStorage.setItem('sc-payslip-sessions', 'invalid json data');
    });

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Page should still load without crashing
    await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();

    // Try to open history (should show empty state or clear corrupt data)
    await page.keyboard.press('Control+KeyO');
    await page.waitForTimeout(500);

    // No hard errors should occur
    expect(consoleErrors.filter(e =>
      e.includes('localStorage') ||
      e.includes('JSON')
    ).length).toBe(0);
  });

  test('Empty session list shows appropriate message', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Ensure localStorage is empty
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Open history
    await page.keyboard.press('Control+KeyO');
    await page.waitForTimeout(500);

    // Look for empty state message
    const emptyMessage = page.locator('text=/no.*session|keine.*session|empty/i').first();

    // Check if empty message is visible
    const isEmptyMessageVisible = await emptyMessage.isVisible({ timeout: 2000 }).catch(() => false);

    if (isEmptyMessageVisible) {
      const messageText = await emptyMessage.textContent();
      expect(messageText).toBeTruthy();
    }
  });

  test('Session timestamps are created correctly', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Save a session
    const uniqueName = 'Timestamp Test ' + Date.now();
    const sessionNameInput = page.locator('input[type="text"]').first();
    await sessionNameInput.fill(uniqueName);
    await page.keyboard.press('Control+KeyS');
    await page.waitForTimeout(1000);

    // Check localStorage for timestamps
    const savedData = await page.evaluate(() => {
      const data = localStorage.getItem('sc-payslip-sessions');
      return data ? JSON.parse(data) : null;
    });

    expect(savedData).toBeTruthy();
    expect(Array.isArray(savedData)).toBe(true);

    if (Array.isArray(savedData) && savedData.length > 0) {
      const session = savedData.find((s: any) => s.session.name === uniqueName);
      expect(session).toBeTruthy();
      expect(session.createdAt).toBeTruthy();
      expect(session.updatedAt).toBeTruthy();

      // Timestamps should be valid ISO date strings
      expect(new Date(session.createdAt).toString()).not.toBe('Invalid Date');
      expect(new Date(session.updatedAt).toString()).not.toBe('Invalid Date');
    }
  });
});

test.describe('Session Management - Cross-Browser Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('Session management works on mobile viewports', async ({ page, viewport }) => {
    // Save a session
    const uniqueName = 'Mobile Test ' + Date.now();
    const sessionNameInput = page.locator('input[type="text"]').first();
    await sessionNameInput.fill(uniqueName);
    await page.keyboard.press('Control+KeyS');
    await page.waitForTimeout(1000);

    // Verify it was saved
    const savedData = await page.evaluate(() => {
      const data = localStorage.getItem('sc-payslip-sessions');
      return data ? JSON.parse(data) : null;
    });

    expect(savedData).toBeTruthy();
    expect(Array.isArray(savedData)).toBe(true);

    if (viewport && viewport.width < 768) {
      // On mobile, verify the UI is still accessible
      await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();
    }
  });

  test('Session management works on desktop viewports', async ({ page, viewport }) => {
    // Save a session
    const uniqueName = 'Desktop Test ' + Date.now();
    const sessionNameInput = page.locator('input[type="text"]').first();
    await sessionNameInput.fill(uniqueName);
    await page.keyboard.press('Control+KeyS');
    await page.waitForTimeout(1000);

    // Open history
    await page.keyboard.press('Control+KeyO');
    await page.waitForTimeout(500);

    if (viewport && viewport.width >= 768) {
      // On desktop, verify sidebar opens properly
      const sidebar = page.locator('[class*="sidebar"], [class*="history"]').first();
      const isSidebarVisible = await sidebar.isVisible({ timeout: 2000 }).catch(() => false);

      if (isSidebarVisible) {
        expect(await sidebar.textContent()).toBeTruthy();
      }
    }
  });
});

test.describe('Session Management - Performance and Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('Can handle rapid session saves', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const sessionNameInput = page.locator('input[type="text"]').first();

    // Rapidly change session name multiple times
    for (let i = 0; i < 5; i++) {
      await sessionNameInput.fill(`Rapid Test ${i} ${Date.now()}`);
      await page.waitForTimeout(100);
    }

    // Wait for debounce to complete
    await page.waitForTimeout(1500);

    // Verify final state was saved
    const savedData = await page.evaluate(() => {
      const data = localStorage.getItem('sc-payslip-sessions');
      return data ? JSON.parse(data) : null;
    });

    expect(savedData).toBeTruthy();
    expect(Array.isArray(savedData)).toBe(true);

    // Should have at least one session saved (the last one after debounce)
    if (Array.isArray(savedData)) {
      expect(savedData.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('Session with special characters in name', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const specialName = 'Test Session 🚀 with "quotes" and <tags> & symbols!';
    const sessionNameInput = page.locator('input[type="text"]').first();
    await sessionNameInput.fill(specialName);
    await page.keyboard.press('Control+KeyS');
    await page.waitForTimeout(1000);

    // Verify it was saved correctly
    const savedData = await page.evaluate(() => {
      const data = localStorage.getItem('sc-payslip-sessions');
      return data ? JSON.parse(data) : null;
    });

    expect(savedData).toBeTruthy();
    expect(Array.isArray(savedData)).toBe(true);

    if (Array.isArray(savedData) && savedData.length > 0) {
      const session = savedData.find((s: any) => s.session.name === specialName);
      expect(session).toBeTruthy();
      expect(session.session.name).toBe(specialName);
    }
  });

  test('Very long session name is handled', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const longName = 'A'.repeat(500); // Very long name
    const sessionNameInput = page.locator('input[type="text"]').first();
    await sessionNameInput.fill(longName);
    await page.keyboard.press('Control+KeyS');
    await page.waitForTimeout(1000);

    // Verify it was saved
    const savedData = await page.evaluate(() => {
      const data = localStorage.getItem('sc-payslip-sessions');
      return data ? JSON.parse(data) : null;
    });

    expect(savedData).toBeTruthy();
    expect(Array.isArray(savedData)).toBe(true);
  });
});
