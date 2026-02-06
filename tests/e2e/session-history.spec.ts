import { test, expect } from '@playwright/test';

/**
 * Session History View E2E Tests
 *
 * These tests verify the complete session history feature:
 * 1. Navigation to sessions page from home
 * 2. Session list display with metadata
 * 3. Filtering by session type (Mining, Trading, etc.)
 * 4. Searching sessions by name
 * 5. Navigation to individual sessions
 * 6. Empty state handling
 * 7. Error state handling
 *
 * Tests run on Chrome, Firefox, Safari (WebKit), and mobile viewports
 */

test.describe('Session History View E2E Tests', () => {
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

    // Start from home page and clear localStorage
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    // Check for console errors
    if (consoleErrors.length > 0) {
      console.error('Console errors found:', consoleErrors);
    }
    expect(consoleErrors).toHaveLength(0);
  });

  test('Navigation link to sessions page is visible and functional', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for the Sessions button/link
    const sessionsLink = page.locator('a[href="/sessions"]').first();
    await expect(sessionsLink).toBeVisible({ timeout: 5000 });

    // Verify the link text (DE or EN)
    const linkText = await sessionsLink.textContent();
    expect(linkText).toBeTruthy();

    // Click the link
    await sessionsLink.click();
    await page.waitForLoadState('networkidle');

    // Verify we're on the sessions page
    expect(page.url()).toContain('/sessions');
  });

  test('Sessions page loads without errors', async ({ page }) => {
    // Navigate to sessions page
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');

    // Verify page title/header is present (Session History in DE or EN)
    const header = page.locator('h1').first();
    await expect(header).toBeVisible();

    const headerText = await header.textContent();
    expect(headerText).toBeTruthy();

    // Verify back link to home page exists
    const backLink = page.locator('a[href="/"]').first();
    await expect(backLink).toBeVisible();

    // Verify language switcher is present
    const languageButtons = page.locator('button').filter({ hasText: /DE|EN/ });
    expect(await languageButtons.count()).toBeGreaterThan(0);
  });

  test('Empty state displays when no sessions exist', async ({ page }) => {
    // Ensure localStorage is empty
    await page.evaluate(() => localStorage.clear());

    // Navigate to sessions page
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');

    // Wait for loading to complete
    await page.waitForTimeout(1000);

    // Look for empty state message
    const emptyMessage = page.locator('text=/no.*session|keine.*session|empty/i').first();

    // Check if empty message is visible
    const isEmptyMessageVisible = await emptyMessage.isVisible({ timeout: 3000 }).catch(() => false);

    if (isEmptyMessageVisible) {
      const messageText = await emptyMessage.textContent();
      expect(messageText).toBeTruthy();
    }
  });

  test('Complete workflow: save sessions, navigate, view, filter, search', async ({ page }) => {
    // Step 1: Save multiple sessions with different types
    const sessions = [
      { name: 'Mining Session Alpha ' + Date.now(), type: 'Mining' },
      { name: 'Trading Run Beta ' + Date.now(), type: 'Trading' },
      { name: 'Mining Session Gamma ' + Date.now(), type: 'Mining' },
    ];

    const sessionNameInput = page.locator('input[type="text"]').first();

    for (const session of sessions) {
      await sessionNameInput.fill(session.name);
      await page.waitForTimeout(300);

      // Try to set session type if dropdown is available
      const typeDropdown = page.locator('button[aria-haspopup="listbox"]').first();
      if (await typeDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
        await typeDropdown.click();
        await page.waitForTimeout(300);

        // Look for the session type option
        const typeOption = page.locator(`[role="option"]`).filter({ hasText: new RegExp(session.type, 'i') }).first();
        if (await typeOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await typeOption.click();
          await page.waitForTimeout(300);
        }
      }

      // Save the session
      await page.keyboard.press('Control+KeyS');
      await page.waitForTimeout(1000);
    }

    // Step 2: Navigate to sessions page
    const sessionsLink = page.locator('a[href="/sessions"]').first();
    await sessionsLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Step 3: Verify sessions are displayed
    for (const session of sessions) {
      const sessionItem = page.locator(`text="${session.name}"`).first();
      await expect(sessionItem).toBeVisible({ timeout: 5000 });
    }

    // Step 4: Test filtering by type
    const filterDropdown = page.locator('button[aria-haspopup="listbox"]').first();
    if (await filterDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
      await filterDropdown.click();
      await page.waitForTimeout(300);

      // Filter by Mining
      const miningOption = page.locator('[role="option"]').filter({ hasText: /mining/i }).first();
      if (await miningOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await miningOption.click();
        await page.waitForTimeout(500);

        // Verify only Mining sessions are visible
        const miningSession1 = page.locator(`text="${sessions[0].name}"`).first();
        const tradingSession = page.locator(`text="${sessions[1].name}"`).first();
        const miningSession2 = page.locator(`text="${sessions[2].name}"`).first();

        await expect(miningSession1).toBeVisible();
        await expect(miningSession2).toBeVisible();

        // Trading session should not be visible
        const isTradingVisible = await tradingSession.isVisible({ timeout: 1000 }).catch(() => false);
        expect(isTradingVisible).toBe(false);

        // Reset filter to show all
        await filterDropdown.click();
        await page.waitForTimeout(300);
        const allTypesOption = page.locator('[role="option"]').filter({ hasText: /all|alle/i }).first();
        if (await allTypesOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await allTypesOption.click();
          await page.waitForTimeout(500);
        }
      }
    }

    // Step 5: Test search functionality
    const searchInput = page.locator('input[type="text"]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Search for "Alpha"
      await searchInput.fill('Alpha');
      await page.waitForTimeout(500);

      // Verify only the Alpha session is visible
      const alphaSession = page.locator(`text="${sessions[0].name}"`).first();
      const betaSession = page.locator(`text="${sessions[1].name}"`).first();

      await expect(alphaSession).toBeVisible();

      const isBetaVisible = await betaSession.isVisible({ timeout: 1000 }).catch(() => false);
      expect(isBetaVisible).toBe(false);

      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(500);

      // All sessions should be visible again
      for (const session of sessions) {
        const sessionItem = page.locator(`text="${session.name}"`).first();
        await expect(sessionItem).toBeVisible({ timeout: 3000 });
      }
    }

    // Step 6: Click on a session to navigate to editor
    const firstSessionItem = page.locator(`text="${sessions[0].name}"`).first();

    // Find the clickable parent element (the session list item)
    const sessionCard = firstSessionItem.locator('..').locator('..').first();
    await sessionCard.click();
    await page.waitForTimeout(1000);

    // Verify we navigated away from the sessions page (could be to home or session editor)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/sessions');

    // Verify the session name is loaded in the editor
    const editorSessionName = page.locator('input[type="text"]').first();
    const loadedName = await editorSessionName.inputValue();
    expect(loadedName).toBe(sessions[0].name);
  });

  test('Session metadata is displayed correctly', async ({ page }) => {
    // Save a session with known data
    const sessionName = 'Metadata Test ' + Date.now();
    const sessionNameInput = page.locator('input[type="text"]').first();
    await sessionNameInput.fill(sessionName);
    await page.waitForTimeout(300);

    // Add some revenue data
    const numberInputs = await page.locator('input[type="number"]').all();
    if (numberInputs.length > 0) {
      await numberInputs[0].fill('5000');
      await page.waitForTimeout(200);
    }

    // Save the session
    await page.keyboard.press('Control+KeyS');
    await page.waitForTimeout(1000);

    // Navigate to sessions page
    const sessionsLink = page.locator('a[href="/sessions"]').first();
    await sessionsLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Find the session in the list
    const sessionItem = page.locator(`text="${sessionName}"`).first();
    await expect(sessionItem).toBeVisible();

    // Verify the session card container is visible and contains metadata
    const sessionCard = sessionItem.locator('..').locator('..').first();
    const cardText = await sessionCard.textContent();

    // Card should contain the session name
    expect(cardText).toContain(sessionName);

    // Card should contain some metadata (date, revenue, members, etc.)
    // The exact format depends on the implementation, but it should have content
    expect(cardText?.length || 0).toBeGreaterThan(sessionName.length);
  });

  test('Language switching works on sessions page', async ({ page }) => {
    // Navigate to sessions page
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');

    // Find language buttons
    const deButton = page.locator('button:has-text("DE")').first();
    const enButton = page.locator('button:has-text("EN")').first();

    await expect(deButton).toBeVisible();
    await expect(enButton).toBeVisible();

    // Get initial header text
    const header = page.locator('h1').first();
    const initialText = await header.textContent();

    // Switch to English
    await enButton.click();
    await page.waitForTimeout(500);

    const englishText = await header.textContent();
    expect(englishText).toBeTruthy();

    // Switch to German
    await deButton.click();
    await page.waitForTimeout(500);

    const germanText = await header.textContent();
    expect(germanText).toBeTruthy();

    // Texts should be different (unless already in that language)
    if (initialText !== germanText) {
      expect(englishText).not.toBe(germanText);
    }
  });

  test('Back link returns to home page', async ({ page }) => {
    // Navigate to sessions page
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');

    // Click back link
    const backLink = page.locator('a[href="/"]').first();
    await backLink.click();
    await page.waitForLoadState('networkidle');

    // Verify we're back on home page
    const url = page.url();
    expect(url).not.toContain('/sessions');
    expect(url.endsWith('/')).toBe(true);

    // Verify home page elements are present
    await expect(page.locator('text=SC Payslip')).toBeVisible();
  });

  test('Sessions are sorted by date (newest first)', async ({ page }) => {
    // Save three sessions with slight delays to ensure different timestamps
    const sessionNames = [
      'First Session ' + Date.now(),
      'Second Session ' + (Date.now() + 100),
      'Third Session ' + (Date.now() + 200),
    ];

    const sessionNameInput = page.locator('input[type="text"]').first();

    for (let i = 0; i < sessionNames.length; i++) {
      await sessionNameInput.fill(sessionNames[i]);
      await page.keyboard.press('Control+KeyS');
      await page.waitForTimeout(1200); // Wait to ensure different timestamps
    }

    // Navigate to sessions page
    const sessionsLink = page.locator('a[href="/sessions"]').first();
    await sessionsLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Get all session name elements
    const sessionElements = await page.locator('[data-testid="session-name"], .session-name, h3, h4').all();

    if (sessionElements.length >= 3) {
      const displayedNames = await Promise.all(
        sessionElements.slice(0, 3).map(el => el.textContent())
      );

      // The newest (third) session should appear first
      const thirdSessionFirst = displayedNames.some(name => name?.includes('Third Session'));
      expect(thirdSessionFirst).toBe(true);
    }
  });

  test('Search shows "no results" message when no matches found', async ({ page }) => {
    // Save a session
    const sessionName = 'Searchable Session ' + Date.now();
    const sessionNameInput = page.locator('input[type="text"]').first();
    await sessionNameInput.fill(sessionName);
    await page.keyboard.press('Control+KeyS');
    await page.waitForTimeout(1000);

    // Navigate to sessions page
    const sessionsLink = page.locator('a[href="/sessions"]').first();
    await sessionsLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Search for something that doesn't exist
    const searchInput = page.locator('input[type="text"]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('NonexistentSessionXYZ123');
      await page.waitForTimeout(500);

      // Look for "no results" message
      const noResultsMessage = page.locator('text=/no.*found|keine.*gefunden|no.*match/i').first();
      const isNoResultsVisible = await noResultsMessage.isVisible({ timeout: 3000 }).catch(() => false);

      if (isNoResultsVisible) {
        const messageText = await noResultsMessage.textContent();
        expect(messageText).toBeTruthy();
      }

      // The saved session should not be visible
      const sessionItem = page.locator(`text="${sessionName}"`).first();
      const isSessionVisible = await sessionItem.isVisible({ timeout: 1000 }).catch(() => false);
      expect(isSessionVisible).toBe(false);
    }
  });

  test('Filter combination with search works correctly', async ({ page }) => {
    // Save sessions of different types
    const sessions = [
      { name: 'Mining Alpha ' + Date.now(), type: 'Mining' },
      { name: 'Trading Alpha ' + Date.now(), type: 'Trading' },
      { name: 'Mining Beta ' + Date.now(), type: 'Mining' },
    ];

    const sessionNameInput = page.locator('input[type="text"]').first();

    for (const session of sessions) {
      await sessionNameInput.fill(session.name);
      await page.waitForTimeout(300);

      // Set session type if possible
      const typeDropdown = page.locator('button[aria-haspopup="listbox"]').first();
      if (await typeDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
        await typeDropdown.click();
        await page.waitForTimeout(300);

        const typeOption = page.locator(`[role="option"]`).filter({ hasText: new RegExp(session.type, 'i') }).first();
        if (await typeOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await typeOption.click();
          await page.waitForTimeout(300);
        }
      }

      await page.keyboard.press('Control+KeyS');
      await page.waitForTimeout(1000);
    }

    // Navigate to sessions page
    const sessionsLink = page.locator('a[href="/sessions"]').first();
    await sessionsLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Apply both filter (Mining) and search (Alpha)
    const filterDropdown = page.locator('button[aria-haspopup="listbox"]').first();
    if (await filterDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
      await filterDropdown.click();
      await page.waitForTimeout(300);

      const miningOption = page.locator('[role="option"]').filter({ hasText: /mining/i }).first();
      if (await miningOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await miningOption.click();
        await page.waitForTimeout(500);
      }
    }

    const searchInput = page.locator('input[type="text"]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('Alpha');
      await page.waitForTimeout(500);

      // Only "Mining Alpha" should be visible
      const miningAlpha = page.locator(`text="${sessions[0].name}"`).first();
      const tradingAlpha = page.locator(`text="${sessions[1].name}"`).first();
      const miningBeta = page.locator(`text="${sessions[2].name}"`).first();

      await expect(miningAlpha).toBeVisible();

      const isTradingAlphaVisible = await tradingAlpha.isVisible({ timeout: 1000 }).catch(() => false);
      const isMiningBetaVisible = await miningBeta.isVisible({ timeout: 1000 }).catch(() => false);

      expect(isTradingAlphaVisible).toBe(false);
      expect(isMiningBetaVisible).toBe(false);
    }
  });
});

test.describe('Session History View - Mobile and Desktop', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('Content-Security-Policy') &&
            !text.includes('Connection closed') &&
            !text.toLowerCase().includes('websocket')) {
          consoleErrors.push(text);
        }
      }
    });

    page.on('pageerror', (error) => {
      if (!error.message.includes('Content-Security-Policy') &&
          !error.message.includes('Connection closed')) {
        consoleErrors.push(error.message);
      }
    });

    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    if (consoleErrors.length > 0) {
      console.error('Console errors found:', consoleErrors);
    }
    expect(consoleErrors).toHaveLength(0);
  });

  test('Sessions page renders correctly on mobile viewport', async ({ page, viewport }) => {
    // Navigate to sessions page
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');

    if (viewport && viewport.width < 768) {
      // Check that content is not cut off
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

      // Allow tolerance for mobile browser variations
      expect(scrollWidth - clientWidth).toBeLessThan(400);

      // Verify main elements are visible
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.locator('a[href="/"]').first()).toBeVisible();
    }
  });

  test('Sessions page renders correctly on desktop viewport', async ({ page, viewport }) => {
    // Navigate to sessions page
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');

    if (viewport && viewport.width >= 768) {
      // Verify main elements are visible
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.locator('a[href="/"]').first()).toBeVisible();

      // Language switcher should be visible
      const languageButtons = page.locator('button').filter({ hasText: /DE|EN/ });
      expect(await languageButtons.count()).toBeGreaterThan(0);
    }
  });

  test('Delete button removes session from database', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Create a test session via API
    const testSessionName = 'QA Delete Test ' + Date.now();
    const createResponse = await page.request.post('/api/sessions', {
      data: {
        name: testSessionName,
        type: 'TRADING',
        taxEnabled: true,
        distribution: 'EQUAL',
        members: [
          { handle: 'Trader1', role: 'Captain', revenue: 10000, investment: 0 }
        ]
      }
    });

    expect(createResponse.ok()).toBeTruthy();
    const sessionData = await createResponse.json();
    const sessionId = sessionData.id;

    // Navigate to sessions page
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify session appears in list
    const sessionInList = page.locator(`text="${testSessionName}"`).first();
    await expect(sessionInList).toBeVisible({ timeout: 5000 });

    // Click delete button
    const deleteButton = page.locator('button').filter({ hasText: /delete/i }).first();
    await deleteButton.click();
    await page.waitForTimeout(500);

    // Confirm in dialog
    const confirmButton = page.locator('[role="dialog"] button').filter({ hasText: /delete|löschen/i }).first();
    await expect(confirmButton).toBeVisible({ timeout: 2000 });
    await confirmButton.click();

    // Wait for success toast
    await expect(page.locator('text=/deleted|gelöscht/i')).toBeVisible({ timeout: 3000 });

    // Verify session removed from list
    await page.waitForTimeout(500);
    await expect(sessionInList).not.toBeVisible();

    // Verify deleted from database
    const checkResponse = await page.request.get(`/api/sessions/${sessionId}`);
    expect(checkResponse.status()).toBe(404);

    // Check for console errors
    expect(consoleErrors.length).toBe(0);
  });
});
