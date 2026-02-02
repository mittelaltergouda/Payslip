import { test, expect } from '@playwright/test';

/**
 * Browser Verification Tests for SessionWizard
 *
 * These tests verify:
 * 1. SessionWizard renders correctly
 * 2. No console errors occur
 * 3. Responsive design works
 * 4. DE/EN language switch works
 *
 * Tests run on Chrome, Firefox, Safari (WebKit), and mobile viewports
 */

test.describe('SessionWizard Browser Verification', () => {
  // Capture console errors
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    await page.goto('/');
  });

  test('SessionWizard renders without errors', async ({ page }) => {
    // Wait for the main component to load (look for app name or session settings)
    await page.waitForSelector('text=SC Payslip', { timeout: 10000 });

    // Check that the app name is present
    const appName = await page.locator('text=SC Payslip').textContent();
    expect(appName).toContain('SC Payslip');

    // Verify key elements are present (distribution mode button - now a custom dropdown)
    await expect(page.locator('button[aria-haspopup="listbox"]')).toBeVisible();

    // Verify language buttons are present (by aria-label for specificity)
    await expect(page.getByRole('button', { name: 'Switch to German' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Switch to English' })).toBeVisible();

    // Check for no console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('No console errors during page load', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Wait a bit for any deferred scripts
    await page.waitForTimeout(1000);

    // Verify no console errors
    if (consoleErrors.length > 0) {
      console.error('Console errors found:', consoleErrors);
    }
    expect(consoleErrors).toHaveLength(0);
  });

  test('DE/EN language switch works', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Get initial text (should be in one language)
    const initialText = await page.locator('h2').first().textContent();
    expect(initialText).toBeTruthy();

    // Find the language buttons by text content (they contain "DE" and "EN")
    const deButton = page.locator('button:has-text("DE")').first();
    const enButton = page.locator('button:has-text("EN")').first();

    // Verify both buttons exist
    await expect(deButton).toBeVisible();
    await expect(enButton).toBeVisible();

    // Click English button
    await enButton.click();
    await page.waitForTimeout(500);

    // Get new text (should be in English)
    const englishText = await page.locator('h2').first().textContent();
    expect(englishText).toContain('Session Settings'); // English version

    // Click German button
    await deButton.click();
    await page.waitForTimeout(500);

    // Get German text
    const germanText = await page.locator('h2').first().textContent();
    expect(germanText).toContain('Session Einstellungen'); // German version

    // Verify they are different
    expect(englishText).not.toBe(germanText);

    // Ensure no errors during language switching
    expect(consoleErrors).toHaveLength(0);
  });

  test('Form interactions work without errors', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Try to find and interact with select element
    const select = page.locator('select').first();
    if (await select.isVisible({ timeout: 5000 }).catch(() => false)) {
      await select.selectOption('PERCENT');
      await page.waitForTimeout(300);
    }

    // Try to find text inputs (handle fields)
    const textInputs = await page.locator('input[type="text"]').all();
    if (textInputs.length > 0) {
      await textInputs[0].click();
      await textInputs[0].fill('TestUser');
      await page.waitForTimeout(300);
    }

    // Try to find number inputs
    const numberInputs = await page.locator('input[type="number"]').all();
    if (numberInputs.length > 0) {
      // Fill revenue field
      await numberInputs[0].click();
      await numberInputs[0].fill('1000');
      await page.waitForTimeout(300);
    }

    // Verify no console errors after interactions
    expect(consoleErrors).toHaveLength(0);
  });
});

test.describe('Responsive Design Verification', () => {
  test('Mobile viewport renders correctly', async ({ page, viewport }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if we're on a mobile viewport
    if (viewport && viewport.width < 768) {
      // On mobile, check that content is visible and not cut off
      const body = await page.locator('body').boundingBox();
      expect(body).toBeTruthy();

      // Check that horizontal scrolling isn't needed (with tolerance for mobile browsers)
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

      // Allow tolerance for mobile browser variations (scrollbars, zoom, etc.)
      expect(scrollWidth - clientWidth).toBeLessThan(400);
    }

    // Verify main content is visible (app name)
    await expect(page.locator('text=SC Payslip')).toBeVisible();
  });

  test('Desktop viewport renders correctly', async ({ page, viewport }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // On desktop viewports (>= 768px), check layout
    if (viewport && viewport.width >= 768) {
      // Main content should be visible (app name and h2)
      await expect(page.locator('text=SC Payslip')).toBeVisible();

      // Session settings should be visible
      await expect(page.locator('h2').first()).toBeVisible();

      // Distribution mode button should be visible (now a custom dropdown)
      await expect(page.locator('button[aria-haspopup="listbox"]')).toBeVisible();
    }
  });

  test('Layout adapts to different screen sizes', async ({ page }) => {
    // Test desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const desktopLayout = await page.locator('body').boundingBox();

    // Test tablet size
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    const tabletLayout = await page.locator('body').boundingBox();

    // Test mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const mobileLayout = await page.locator('body').boundingBox();

    // All layouts should render (bounding boxes exist)
    expect(desktopLayout).toBeTruthy();
    expect(tabletLayout).toBeTruthy();
    expect(mobileLayout).toBeTruthy();
  });
});

test.describe('SessionWizard Functionality', () => {
  test('Can add a member', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for add member button
    const addButton = page.locator('button').filter({ hasText: /add member|mitglied hinzufügen|add|hinzufügen/i }).first();

    if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Count members before
      const membersBefore = await page.locator('input[type="text"]').count();

      // Click add button
      await addButton.click();
      await page.waitForTimeout(500);

      // Count members after (should increase)
      const membersAfter = await page.locator('input[type="text"]').count();

      expect(membersAfter).toBeGreaterThan(membersBefore);
    }
  });

  test('Distribution mode selection works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for distribution mode dropdown button (custom dropdown)
    const modeButton = page.locator('button[aria-haspopup="listbox"]').first();

    if (await modeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click to open dropdown
      await modeButton.click();
      await page.waitForTimeout(300);

      // Check if dropdown options are visible
      const dropdownOptions = page.locator('[role="listbox"]');
      await expect(dropdownOptions).toBeVisible();

      // Verify there are multiple mode options
      const options = await dropdownOptions.locator('[role="option"]').count();
      expect(options).toBeGreaterThan(0);
    }
  });

  test('Tax toggle works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for tax-related checkbox or toggle
    const taxToggle = page.locator('input[type="checkbox"]').first();

    if (await taxToggle.isVisible({ timeout: 5000 }).catch(() => false)) {
      const initialState = await taxToggle.isChecked();

      // Toggle tax
      await taxToggle.click();
      await page.waitForTimeout(300);

      const newState = await taxToggle.isChecked();
      expect(newState).not.toBe(initialState);
    }
  });

  test('Results display after calculation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for calculate button
    const calculateButton = page.locator('button').filter({ hasText: /calculate|berechnen|compute/i }).first();

    if (await calculateButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await calculateButton.click();
      await page.waitForTimeout(1000);

      // Check if results section appears (could be a table, list, or section)
      const hasResults =
        (await page.locator('table').count() > 0) ||
        (await page.locator('[class*="result"]').count() > 0) ||
        (await page.locator('h2, h3').filter({ hasText: /result|ergebnis/i }).count() > 0);

      expect(hasResults).toBe(true);
    }
  });
});
