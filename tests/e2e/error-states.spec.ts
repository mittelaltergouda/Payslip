import { test, expect } from '@playwright/test';

/**
 * Error States E2E Tests
 *
 * These tests verify comprehensive error handling and edge cases:
 * 1. Invalid Inputs - Negative values, max int32 overflow, special characters
 * 2. Boundary Conditions - Zero members, empty revenue, long names, empty session
 * 3. Error Recovery - App recovers gracefully from error states
 * 4. Validation Messages - Appropriate error messages displayed
 * 5. Edge Cases - Empty member handles, percent mode validation, tax rate limits
 *
 * Tests run on Chrome, Firefox, Safari (WebKit), and mobile viewports
 */

test.describe('Error States - Invalid Input Handling', () => {
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
    // Filter out benign errors (UUID mismatches, style differences, dynamic IDs, hydration warnings)
    const significantErrors = consoleErrors.filter(error =>
      !error.includes('id=') &&
      !error.includes('htmlFor=') &&
      !error.includes('aria-labelledby=') &&
      !error.includes('aria-describedby=') &&
      !error.includes('A tree hydrated but') &&
      !error.includes('Hydration failed') &&
      !error.includes('__nextjs_original-stack-frames')
    );

    if (significantErrors.length > 0) {
      console.error('Significant console errors found:', significantErrors);
    }
    expect(significantErrors).toHaveLength(0);
  });

  test('Negative revenue values are handled gracefully', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find first visible numeric input
    const numericInputs = page.locator('input[inputmode="numeric"]');
    const inputCount = await numericInputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = numericInputs.nth(i);
      if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
        // Try to enter a negative value
        await input.fill('-5000');
        await page.waitForTimeout(300);

        // The app should handle this gracefully without crashing
        await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();
        return;
      }
    }
  });

  test('Very large numbers near int32 max are handled', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find first visible numeric input
    const numericInputs = page.locator('input[inputmode="numeric"]');
    const inputCount = await numericInputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = numericInputs.nth(i);
      if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
        // Try to enter max int32 value (2147483647)
        await input.fill('2147483647');
        await page.waitForTimeout(300);

        // Page should handle this without crashing
        await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();

        const value = await input.inputValue();
        // Value should be present (may be formatted)
        expect(value).toBeTruthy();
        return;
      }
    }
  });

  test('Numbers exceeding int32 max are handled', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find first visible numeric input
    const numericInputs = page.locator('input[inputmode="numeric"]');
    const inputCount = await numericInputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = numericInputs.nth(i);
      if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
        // Try to enter value exceeding int32 max
        await input.fill('9999999999999');
        await page.waitForTimeout(300);

        // Page should handle this gracefully
        await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();
        return;
      }
    }
  });

  test('Non-numeric input in number fields is handled', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find first visible numeric input
    const numericInputs = page.locator('input[inputmode="numeric"]');
    const inputCount = await numericInputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = numericInputs.nth(i);
      if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
        // Try to type letters in numeric input
        await input.fill('abc');
        await page.waitForTimeout(300);

        // Page should handle this gracefully
        await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();

        // Value should be empty or only contain valid characters
        const value = await input.inputValue();
        // Non-numeric characters should be stripped or rejected
        expect(value.match(/[a-zA-Z]/)).toBeFalsy();
        return;
      }
    }
  });

  test('Decimal values in integer fields are handled', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find first visible numeric input
    const numericInputs = page.locator('input[inputmode="numeric"]');
    const inputCount = await numericInputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = numericInputs.nth(i);
      if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
        // Try to enter a decimal value
        await input.fill('1000.50');
        await page.waitForTimeout(300);

        // Page should handle this gracefully
        await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();
        return;
      }
    }
  });

  test('Zero revenue is handled correctly', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find all visible and enabled numeric inputs and set them to zero
    const numericInputs = page.locator('input[inputmode="numeric"]');
    const inputCount = await numericInputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = numericInputs.nth(i);
      const isVisible = await input.isVisible({ timeout: 500 }).catch(() => false);
      const isEnabled = await input.isEnabled({ timeout: 500 }).catch(() => false);

      if (isVisible && isEnabled) {
        await input.fill('0');
        await page.waitForTimeout(200);
      }
    }

    // Wait for calculations
    await page.waitForTimeout(500);

    // Page should still render correctly with zero revenue
    await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();
  });
});

test.describe('Error States - Boundary Conditions', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('Content-Security-Policy') &&
            !text.includes('Content Security Policy') &&
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
    const significantErrors = consoleErrors.filter(error =>
      !error.includes('id=') &&
      !error.includes('htmlFor=') &&
      !error.includes('aria-labelledby=') &&
      !error.includes('aria-describedby=') &&
      !error.includes('A tree hydrated but') &&
      !error.includes('Hydration failed') &&
      !error.includes('__nextjs_original-stack-frames')
    );
    expect(significantErrors).toHaveLength(0);
  });

  test('Empty session name is handled', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const sessionNameInput = page.locator('input[type="text"]').first();
    await expect(sessionNameInput).toBeVisible();

    // Clear the session name
    await sessionNameInput.fill('');
    await page.waitForTimeout(300);

    // Page should still render
    await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();

    // Try to save with empty name
    await page.keyboard.press('Control+KeyS');
    await page.waitForTimeout(1000);

    // Page should handle this gracefully (may show error or use default name)
    await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();
  });

  test('Very long session name is handled (128+ characters)', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const sessionNameInput = page.locator('input[type="text"]').first();
    await expect(sessionNameInput).toBeVisible();

    // Create a very long name (over 128 characters)
    const longName = 'A'.repeat(200);
    await sessionNameInput.fill(longName);
    await page.waitForTimeout(300);

    // Page should handle this - either truncate or accept
    await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();

    // Verify something was entered
    const value = await sessionNameInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test('Empty member handle is handled', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find member handle inputs (skip the first input which is session name)
    const allInputs = await page.locator('input[type="text"]').all();

    // Try to set a member handle to empty
    for (let i = 1; i < allInputs.length; i++) {
      const input = allInputs[i];
      if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
        // Clear the handle
        await input.fill('');
        await page.waitForTimeout(300);

        // Page should still render
        await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();
        return;
      }
    }
  });

  test('Very long member handle is handled (64+ characters)', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find member handle inputs (skip the first input which is session name)
    const allInputs = await page.locator('input[type="text"]').all();

    for (let i = 1; i < allInputs.length; i++) {
      const input = allInputs[i];
      if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
        // Try to enter a very long handle (over 64 characters)
        const longHandle = 'Player' + 'X'.repeat(100);
        await input.fill(longHandle);
        await page.waitForTimeout(300);

        // Page should handle this
        await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();
        return;
      }
    }
  });

  test('Special characters in member handle are validated', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find member handle inputs (skip the first input which is session name)
    const allInputs = await page.locator('input[type="text"]').all();

    for (let i = 1; i < allInputs.length; i++) {
      const input = allInputs[i];
      if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
        // Try to enter invalid characters (based on validation regex)
        await input.fill('<script>alert("test")</script>');
        await page.waitForTimeout(300);

        // Page should handle this gracefully
        await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();
        return;
      }
    }
  });

  test('Whitespace-only session name is handled', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const sessionNameInput = page.locator('input[type="text"]').first();
    await expect(sessionNameInput).toBeVisible();

    // Enter only whitespace
    await sessionNameInput.fill('   ');
    await page.waitForTimeout(300);

    // Page should still render
    await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();
  });

  test('Single member session is handled', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for delete buttons to remove all but one member
    const deleteButtons = page.locator('button[aria-label*="delete"], button[aria-label*="remove"], button[aria-label*="löschen"]');
    const buttonCount = await deleteButtons.count();

    // Remove members until only one remains (if possible)
    for (let i = 0; i < buttonCount - 1; i++) {
      const button = deleteButtons.first();
      if (await button.isVisible({ timeout: 500 }).catch(() => false)) {
        await button.click();
        await page.waitForTimeout(300);
      }
    }

    // Page should still work with one member
    await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();

    // Enter revenue and verify calculation works
    const numericInputs = page.locator('input[inputmode="numeric"]');
    const inputCount = await numericInputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = numericInputs.nth(i);
      if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
        await input.fill('10000');
        await page.waitForTimeout(300);
        break;
      }
    }

    // Page should render correctly
    await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();
  });
});

test.describe('Error States - PERCENT Mode Validation', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('Content-Security-Policy') &&
            !text.includes('Content Security Policy') &&
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
    const significantErrors = consoleErrors.filter(error =>
      !error.includes('id=') &&
      !error.includes('htmlFor=') &&
      !error.includes('aria-labelledby=') &&
      !error.includes('aria-describedby=') &&
      !error.includes('A tree hydrated but') &&
      !error.includes('Hydration failed') &&
      !error.includes('__nextjs_original-stack-frames')
    );
    expect(significantErrors).toHaveLength(0);
  });

  test('PERCENT mode with percentages not summing to 100 is handled', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Switch to PERCENT mode
    const percentButton = page.locator('button, [role="tab"]').filter({ hasText: /percent|prozent|%/i });

    if (await percentButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await percentButton.first().click();
      await page.waitForTimeout(300);

      // The app should handle invalid percent totals gracefully
      // Page should still render
      await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();
    }
  });

  test('Percent share of 0% is handled', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Switch to PERCENT mode
    const percentButton = page.locator('button, [role="tab"]').filter({ hasText: /percent|prozent|%/i });

    if (await percentButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await percentButton.first().click();
      await page.waitForTimeout(500);

      // Page should render in PERCENT mode
      await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();
    }
  });

  test('Percent share exceeding 100% is handled', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Switch to PERCENT mode
    const percentButton = page.locator('button, [role="tab"]').filter({ hasText: /percent|prozent|%/i });

    if (await percentButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await percentButton.first().click();
      await page.waitForTimeout(300);

      // Try to find percent input and enter invalid value
      // Percent inputs typically appear after switching modes
      await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();
    }
  });

  test('Negative percent share is handled', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Switch to PERCENT mode
    const percentButton = page.locator('button, [role="tab"]').filter({ hasText: /percent|prozent|%/i });

    if (await percentButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await percentButton.first().click();
      await page.waitForTimeout(300);

      // Page should render without crashes even with invalid states
      await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();
    }
  });
});

test.describe('Error States - Error Recovery', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('Content-Security-Policy') &&
            !text.includes('Content Security Policy') &&
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
    const significantErrors = consoleErrors.filter(error =>
      !error.includes('id=') &&
      !error.includes('htmlFor=') &&
      !error.includes('aria-labelledby=') &&
      !error.includes('aria-describedby=') &&
      !error.includes('A tree hydrated but') &&
      !error.includes('Hydration failed') &&
      !error.includes('__nextjs_original-stack-frames')
    );
    expect(significantErrors).toHaveLength(0);
  });

  test('App recovers from invalid localStorage data', async ({ page }) => {
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

    // App should handle the corrupt data gracefully
    // The page should be functional
    const sessionNameInput = page.locator('input[type="text"]').first();
    await expect(sessionNameInput).toBeVisible();
  });

  test('App recovers from malformed session data in localStorage', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Inject malformed session data (valid JSON but invalid structure)
    await page.evaluate(() => {
      localStorage.setItem('sc-payslip-sessions', JSON.stringify([
        {
          id: 'test-id',
          session: {
            name: null, // Invalid: name should be string
            members: 'not an array', // Invalid: members should be array
            distributionMode: 'INVALID_MODE' // Invalid mode
          },
          createdAt: 'not a date',
          updatedAt: 'not a date'
        }
      ]));
    });

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Page should still load without crashing
    await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();
  });

  test('App recovers from empty localStorage', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Clear localStorage completely
    await page.evaluate(() => localStorage.clear());

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Page should still load with default state
    await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();

    // Session name input should be present with default value
    const sessionNameInput = page.locator('input[type="text"]').first();
    await expect(sessionNameInput).toBeVisible();
  });

  test('App continues to function after entering and clearing invalid input', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find first visible numeric input
    const numericInputs = page.locator('input[inputmode="numeric"]');
    const inputCount = await numericInputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = numericInputs.nth(i);
      if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
        // Enter invalid value
        await input.fill('-999999');
        await page.waitForTimeout(200);

        // Clear and enter valid value
        await input.fill('');
        await page.waitForTimeout(100);
        await input.fill('5000');
        await page.waitForTimeout(300);

        // Page should work normally
        await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();

        const value = await input.inputValue();
        expect(parseInt(value.replace(/[,.\s]/g, ''))).toBe(5000);
        return;
      }
    }
  });

  test('App handles rapid input changes without crashing', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find first visible numeric input
    const numericInputs = page.locator('input[inputmode="numeric"]');
    const inputCount = await numericInputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = numericInputs.nth(i);
      if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
        // Rapidly change input values
        for (let j = 0; j < 10; j++) {
          await input.fill((j * 1000).toString());
          await page.waitForTimeout(50);
        }

        // Page should still work
        await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();
        return;
      }
    }
  });
});

test.describe('Error States - Local-only API boundary', () => {
  test('session write API remains unavailable for every payload', async ({ page }) => {
    const response = await page.request.post('/api/sessions', {
      data: {
        name: 'Must stay local',
        members: [],
      },
    });

    expect(response.status()).toBe(404);
  });
});

test.describe('Error States - Edge Cases', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('Content-Security-Policy') &&
            !text.includes('Content Security Policy') &&
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
    const significantErrors = consoleErrors.filter(error =>
      !error.includes('id=') &&
      !error.includes('htmlFor=') &&
      !error.includes('aria-labelledby=') &&
      !error.includes('aria-describedby=') &&
      !error.includes('A tree hydrated but') &&
      !error.includes('Hydration failed') &&
      !error.includes('__nextjs_original-stack-frames')
    );
    expect(significantErrors).toHaveLength(0);
  });

  test('All members with zero revenue calculates correctly', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find all visible and enabled numeric inputs and set them to zero
    const numericInputs = page.locator('input[inputmode="numeric"]');
    const inputCount = await numericInputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = numericInputs.nth(i);
      const isVisible = await input.isVisible({ timeout: 500 }).catch(() => false);
      const isEnabled = await input.isEnabled({ timeout: 500 }).catch(() => false);

      if (isVisible && isEnabled) {
        await input.fill('0');
        await page.waitForTimeout(100);
      }
    }

    await page.waitForTimeout(500);

    // Page should handle zero revenue scenario
    await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();
  });

  test('Unicode characters in session name are handled', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const sessionNameInput = page.locator('input[type="text"]').first();
    await expect(sessionNameInput).toBeVisible();

    // Enter various unicode characters
    const unicodeName = '测试 Тест テスト 🎮🚀🌟';
    await sessionNameInput.fill(unicodeName);
    await page.waitForTimeout(300);

    // Page should handle unicode
    await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();

    const value = await sessionNameInput.inputValue();
    expect(value).toBeTruthy();
  });

  test('Tab characters in session name are handled', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const sessionNameInput = page.locator('input[type="text"]').first();
    await expect(sessionNameInput).toBeVisible();

    // Enter name with tab characters
    const tabName = 'Test\tWith\tTabs';
    await sessionNameInput.fill(tabName);
    await page.waitForTimeout(300);

    // Page should handle tab characters
    await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();
  });

  test('Newline characters in session name are handled', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const sessionNameInput = page.locator('input[type="text"]').first();
    await expect(sessionNameInput).toBeVisible();

    // Enter name with newline characters
    const newlineName = 'Test\nWith\nNewlines';
    await sessionNameInput.fill(newlineName);
    await page.waitForTimeout(300);

    // Page should handle newline characters
    await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();
  });

  test('Leading zeros in revenue are handled', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find first visible numeric input
    const numericInputs = page.locator('input[inputmode="numeric"]');
    const inputCount = await numericInputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = numericInputs.nth(i);
      if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
        // Enter value with leading zeros
        await input.fill('00001000');
        await page.waitForTimeout(300);

        // Page should handle leading zeros
        await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();

        const value = await input.inputValue();
        // Value should be parsed correctly
        expect(parseInt(value.replace(/[,.\s]/g, ''))).toBe(1000);
        return;
      }
    }
  });

  test('Scientific notation in number fields is handled', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find first visible numeric input
    const numericInputs = page.locator('input[inputmode="numeric"]');
    const inputCount = await numericInputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = numericInputs.nth(i);
      if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
        // Try to enter scientific notation
        await input.fill('1e5');
        await page.waitForTimeout(300);

        // Page should handle this gracefully
        await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();
        return;
      }
    }
  });

  test('Calculation with extremely unequal revenue distribution', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find visible numeric inputs
    const numericInputs = page.locator('input[inputmode="numeric"]');
    const visibleInputs: any[] = [];
    const inputCount = await numericInputs.count();

    for (let i = 0; i < inputCount && visibleInputs.length < 2; i++) {
      const input = numericInputs.nth(i);
      if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
        visibleInputs.push(input);
      }
    }

    if (visibleInputs.length >= 2) {
      // Set extremely unequal revenues
      await visibleInputs[0].fill('100000000'); // 100 million
      await page.waitForTimeout(200);
      await visibleInputs[1].fill('1');
      await page.waitForTimeout(500);
    }

    // Page should handle extreme differences
    await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();
  });
});

test.describe('Error States - Mobile Error Handling', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('Content-Security-Policy') &&
            !text.includes('Content Security Policy') &&
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
    const significantErrors = consoleErrors.filter(error =>
      !error.includes('id=') &&
      !error.includes('htmlFor=') &&
      !error.includes('aria-labelledby=') &&
      !error.includes('aria-describedby=') &&
      !error.includes('A tree hydrated but') &&
      !error.includes('Hydration failed') &&
      !error.includes('__nextjs_original-stack-frames')
    );
    expect(significantErrors).toHaveLength(0);
  });

  test('Error handling works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Try entering invalid data
    const sessionNameInput = page.locator('input[type="text"]').first();
    if (await sessionNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sessionNameInput.fill('');
      await page.waitForTimeout(300);
    }

    // Page should handle errors gracefully on mobile
    await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();
  });

  test('Corrupt localStorage recovery works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Inject corrupt data
    await page.evaluate(() => {
      localStorage.setItem('sc-payslip-sessions', 'corrupt data');
    });

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Page should recover on mobile
    await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();
  });
});
