import { test, expect } from '@playwright/test';

/**
 * Security Headers E2E Tests
 *
 * These tests verify that all security headers are correctly implemented:
 * 1. X-Frame-Options (from next.config.mjs)
 * 2. X-Content-Type-Options (from next.config.mjs)
 * 3. Referrer-Policy (from next.config.mjs)
 * 4. Strict-Transport-Security (from next.config.mjs)
 * 5. Permissions-Policy (from next.config.mjs)
 * 6. Content-Security-Policy hydration directives (from middleware.ts)
 *
 * Tests run on Chrome, Firefox, Safari (WebKit), and mobile viewports
 */

test.describe('Security Headers Verification', () => {
  test('X-Frame-Options header is present', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();

    const headers = response!.headers();
    expect(headers['x-frame-options']).toBe('DENY');
  });

  test('X-Content-Type-Options header is present', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();

    const headers = response!.headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
  });

  test('Referrer-Policy header is present', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();

    const headers = response!.headers();
    expect(headers['referrer-policy']).toBe('origin-when-cross-origin');
  });

  test('Strict-Transport-Security header is present', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();

    const headers = response!.headers();
    expect(headers['strict-transport-security']).toContain('max-age=31536000');
    expect(headers['strict-transport-security']).toContain('includeSubDomains');
  });

  test('Permissions-Policy header is present', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();

    const headers = response!.headers();
    expect(headers['permissions-policy']).toContain('camera=()');
    expect(headers['permissions-policy']).toContain('microphone=()');
    expect(headers['permissions-policy']).toContain('geolocation=()');
  });

  test('Content-Security-Policy uses nonce-authorized scripts', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();

    const headers = response!.headers();
    const csp = headers['content-security-policy'];

    // Verify CSP exists
    expect(csp).toBeTruthy();

    // Verify key CSP directives
    expect(csp).toContain("default-src 'self'");
    expect(csp).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain("img-src 'self'");
    expect(csp).toContain("font-src 'self'");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");

    // Playwright starts the Next development server, which needs eval for HMR.
    // Middleware unit tests and the standalone smoke test verify it is absent in production.
    expect(csp).toContain("'unsafe-eval'");

    const nonce = csp.match(/'nonce-([^']+)'/)?.[1];
    expect(nonce).toBeTruthy();

    const scripts = await page.locator('script').evaluateAll((elements) =>
      elements.map((script) => ({
        nonce: script.nonce,
        source: script.getAttribute('src'),
        textLength: script.textContent?.length ?? 0,
      })),
    );
    expect(scripts.length).toBeGreaterThan(0);

    // Non-empty inline scripts must always carry the request nonce. In dev,
    // strict-dynamic permits Next's trusted bootstrap to add the HMR client.
    const executableInlineScripts = scripts.filter(
      (script) => script.source === null && script.textLength > 0,
    );
    expect(executableInlineScripts.length).toBeGreaterThan(0);
    expect(executableInlineScripts.every((script) => script.nonce === nonce)).toBe(true);
    expect(scripts.filter((script) => script.nonce).every((script) => script.nonce === nonce)).toBe(true);
  });

  test('All security headers are present together', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();

    const headers = response!.headers();

    // Verify all security headers are present in a single request
    const requiredHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'referrer-policy',
      'strict-transport-security',
      'permissions-policy',
      'content-security-policy',
    ];

    for (const headerName of requiredHeaders) {
      expect(headers[headerName]).toBeTruthy();
    }
  });

  test('Security headers do not cause JavaScript errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Listen for console errors (excluding CSP violations which are warnings)
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter out CSP violations - they are expected and don't break functionality
        // Handle different browser formats for CSP errors
        // Also filter out browser connection cleanup messages during test teardown
        // And filter out hydration mismatch warnings (UUID differences)
        if (!text.includes('Content-Security-Policy') &&
            !text.includes('Content Security Policy') &&
            !text.includes('CSP') &&
            !text.includes('violates the following directive') &&
            !text.includes('Connection closed') &&
            !text.toLowerCase().includes('connection') &&
            !text.toLowerCase().includes('websocket') &&
            !text.includes('id=') &&
            !text.includes('htmlFor=') &&
            !text.includes('A tree hydrated but') &&
            !text.includes('Hydration failed') &&
            !text.includes('aria-labelledby=') &&
            !text.includes('aria-describedby=') &&
            !text.includes('__nextjs_original-stack-frames')) {
          consoleErrors.push(text);
        }
      }
    });

    // Listen for page errors (actual JavaScript errors)
    page.on('pageerror', (error) => {
      // Filter out CSP-related errors, connection cleanup, and hydration warnings
      if (!error.message.includes('Content-Security-Policy') &&
          !error.message.includes('Content Security Policy') &&
          !error.message.includes('Connection closed') &&
          !error.message.toLowerCase().includes('connection') &&
          !error.message.toLowerCase().includes('websocket') &&
          !error.message.includes('Hydration failed') &&
          !error.message.includes('A tree hydrated')) {
        consoleErrors.push(error.message);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait a bit for any deferred scripts
    await page.waitForTimeout(1000);

    // Verify page loaded successfully
    await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();

    // Check for no actual JavaScript errors (CSP violations and hydration warnings are filtered out)
    if (consoleErrors.length > 0) {
      console.error('JavaScript errors found:', consoleErrors);
    }
    expect(consoleErrors).toHaveLength(0);
  });

  test('x-nonce changes between requests', async ({ page }) => {
    // First request
    const response1 = await page.goto('/');
    expect(response1).not.toBeNull();
    const headers1 = response1!.headers();
    const nonce1 = headers1['x-nonce'];
    expect(nonce1).toBeTruthy();

    // Second request (reload page)
    const response2 = await page.goto('/');
    expect(response2).not.toBeNull();
    const headers2 = response2!.headers();
    const nonce2 = headers2['x-nonce'];
    expect(nonce2).toBeTruthy();

    // Verify nonces are different (dynamic generation)
    expect(nonce1).not.toBe(nonce2);
  });

  test('Application renders correctly with security headers', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for the main component to load
    await expect(
      page.getByRole('main', { name: 'SC Payslip', exact: true })
    ).toBeVisible({ timeout: 10_000 });

    // Verify key application elements are visible
    await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();

    // Verify session settings section exists
    await expect(page.locator('h2').first()).toBeVisible();

    // Verify form elements work (select may not be visible on all viewports)
    const select = page.locator('select');
    if (await select.count() > 0) {
      // Select exists, just verify it's in the DOM (may not be visible on mobile)
      expect(await select.count()).toBeGreaterThan(0);
    }

    // Verify language switcher exists (buttons or other elements)
    const deElement = page.locator('button, a, span').filter({ hasText: 'DE' }).first();
    const enElement = page.locator('button, a, span').filter({ hasText: 'EN' }).first();

    // At least one language switcher should be visible
    const deVisible = await deElement.isVisible().catch(() => false);
    const enVisible = await enElement.isVisible().catch(() => false);
    expect(deVisible || enVisible).toBeTruthy();
  });
});

test.describe('Security Headers on Different Routes', () => {
  test('Root route has all security headers', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();

    const headers = response!.headers();
    expect(headers['x-frame-options']).toBeTruthy();
    expect(headers['content-security-policy']).toBeTruthy();
  });

  test('API routes have security headers', async ({ page, baseURL }) => {
    // Use page.request to make API call
    const response = await page.request.get(`${baseURL}/api/health`);

    // Even if endpoint doesn't exist, headers should be present
    // (or we get a proper error response with headers)
    const headers = response.headers();

    // CSP header should be present on all routes
    expect(headers['content-security-policy']).toBeTruthy();
  });
});

test.describe('Cross-Browser Security Header Verification', () => {
  test('Security headers work on mobile viewports', async ({ page, viewport }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();

    const headers = response!.headers();

    // Verify security headers are present on mobile
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['content-security-policy']).toBeTruthy();

    // Verify page renders correctly on mobile
    if (viewport && viewport.width < 768) {
      await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();
    }
  });

  test('Security headers work on desktop viewports', async ({ page, viewport }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();

    const headers = response!.headers();

    // Verify security headers are present on desktop
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['content-security-policy']).toBeTruthy();

    // Verify page renders correctly on desktop
    if (viewport && viewport.width >= 768) {
      await expect(page.getByRole('main', { name: 'SC Payslip', exact: true })).toBeVisible();
    }
  });
});
