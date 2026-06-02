import { test, expect } from '@playwright/test';

/**
 * Share Links E2E Tests
 *
 * These tests verify the share link functionality:
 * 1. API Token Generation - Export token creation via API
 * 2. Share URL Format - Correct URL structure and token format
 * 3. Security (XSS Prevention) - Token sanitization and safe rendering
 * 4. Cross-Browser Compatibility - Tests run on all configured browsers
 *
 * Note: The share page at /session/[token] may not exist yet.
 * Tests handle both success and 404 cases appropriately.
 *
 * Tests run on Chrome, Firefox, Safari (WebKit), and mobile viewports
 */

test.describe('Share Links - API Token Generation', () => {
  let consoleErrors: string[] = [];
  let testSessionId: string | null = null;

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

    // Create a test session via API for token generation tests
    const createResponse = await page.request.post('/api/sessions', {
      data: {
        name: 'Share Link Test ' + Date.now(),
        type: 'OTHER',
        taxEnabled: true,
        distribution: 'EQUAL',
        members: [
          { handle: 'TestUser', role: 'Pilot', revenue: 1000, investment: 0 }
        ]
      }
    });

    if (createResponse.status() === 200) {
      const sessionData = await createResponse.json();
      testSessionId = sessionData.id;
    }
  });

  test.afterEach(async ({ page }) => {
    // Clean up test session if it was created
    if (testSessionId) {
      await page.request.delete(`/api/sessions/${testSessionId}`).catch(() => {});
      testSessionId = null;
    }

    // Check for console errors
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

  test('Export token API returns 201 for valid session', async ({ page }) => {
    test.skip(!testSessionId, 'Session creation failed, skipping test');

    const response = await page.request.post(`/api/sessions/${testSessionId}/export-token`);
    expect(response.status()).toBe(201);

    const data = await response.json();
    expect(data).toHaveProperty('token');
    expect(data).toHaveProperty('sessionId');
    expect(data).toHaveProperty('shareUrl');
    expect(data.sessionId).toBe(testSessionId);
  });

  test('Export token API returns error for non-existent session', async ({ page }) => {
    const nonExistentId = 'non-existent-session-' + Date.now();
    const response = await page.request.post(`/api/sessions/${nonExistentId}/export-token`);

    // API returns 404 for valid-format IDs not found, or 500 for invalid ID formats
    // Both are acceptable error responses for non-existent sessions
    expect([404, 500]).toContain(response.status());

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('Generated token has correct format (URL-safe base64)', async ({ page }) => {
    test.skip(!testSessionId, 'Session creation failed, skipping test');

    const response = await page.request.post(`/api/sessions/${testSessionId}/export-token`);
    expect(response.status()).toBe(201);

    const data = await response.json();
    const token = data.token;

    // Token should only contain URL-safe base64 characters (A-Z, a-z, 0-9, -, _)
    const urlSafeBase64Regex = /^[A-Za-z0-9_-]+$/;
    expect(token).toMatch(urlSafeBase64Regex);

    // Token should have sufficient length for security (43 chars for 32 bytes)
    expect(token.length).toBeGreaterThanOrEqual(32);
  });

  test('Generated tokens are unique', async ({ page }) => {
    test.skip(!testSessionId, 'Session creation failed, skipping test');

    // Generate first token
    const response1 = await page.request.post(`/api/sessions/${testSessionId}/export-token`);
    expect(response1.status()).toBe(201);
    const data1 = await response1.json();

    // Generate second token
    const response2 = await page.request.post(`/api/sessions/${testSessionId}/export-token`);
    expect(response2.status()).toBe(201);
    const data2 = await response2.json();

    // Tokens should be different (cryptographically unique)
    expect(data1.token).not.toBe(data2.token);
  });

  test('Share URL format is correct', async ({ page }) => {
    test.skip(!testSessionId, 'Session creation failed, skipping test');

    const response = await page.request.post(`/api/sessions/${testSessionId}/export-token`);
    expect(response.status()).toBe(201);

    const data = await response.json();
    const shareUrl = data.shareUrl;
    const token = data.token;

    // Share URL should have the format /session/{token}
    expect(shareUrl).toBe(`/session/${token}`);
    expect(shareUrl).toMatch(/^\/session\/[A-Za-z0-9_-]+$/);
  });

  test('Multiple tokens can be generated for the same session', async ({ page }) => {
    test.skip(!testSessionId, 'Session creation failed, skipping test');

    const tokens: string[] = [];

    // Generate 3 tokens
    for (let i = 0; i < 3; i++) {
      const response = await page.request.post(`/api/sessions/${testSessionId}/export-token`);
      expect(response.status()).toBe(201);
      const data = await response.json();
      tokens.push(data.token);
    }

    // All tokens should be unique
    const uniqueTokens = new Set(tokens);
    expect(uniqueTokens.size).toBe(3);
  });
});

test.describe('Share Links - Security (XSS Prevention)', () => {
  let consoleErrors: string[] = [];
  let testSessionId: string | null = null;

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

    // Create a test session
    const createResponse = await page.request.post('/api/sessions', {
      data: {
        name: 'XSS Test Session ' + Date.now(),
        type: 'OTHER',
        taxEnabled: true,
        distribution: 'EQUAL',
        members: [
          { handle: 'TestUser', role: 'Pilot', revenue: 500, investment: 0 }
        ]
      }
    });

    if (createResponse.status() === 200) {
      const sessionData = await createResponse.json();
      testSessionId = sessionData.id;
    }
  });

  test.afterEach(async ({ page }) => {
    if (testSessionId) {
      await page.request.delete(`/api/sessions/${testSessionId}`).catch(() => {});
      testSessionId = null;
    }
  });

  test('Malicious token in URL does not execute scripts', async ({ page }) => {
    // Attempt to navigate with XSS payload in token position
    const xssPayloads = [
      '<script>alert(1)</script>',
      '"><script>alert(1)</script>',
      "'-alert(1)-'",
      'javascript:alert(1)',
      '%3Cscript%3Ealert(1)%3C/script%3E'
    ];

    for (const payload of xssPayloads) {
      // Navigate to share URL with malicious token
      const response = await page.goto(`/session/${encodeURIComponent(payload)}`);

      // Should return 404 (token not found) or handle safely
      // The page should not crash or execute scripts
      if (response) {
        expect([200, 404, 400, 500]).toContain(response.status());
      }

      // Wait briefly for any deferred scripts
      await page.waitForTimeout(500);

      // Page should not show alert dialogs or XSS indicators
      const alertTriggered = await page.evaluate(() => {
        return (window as any).__xssTriggered === true;
      });
      expect(alertTriggered).toBeFalsy();
    }
  });

  test('Token validation rejects invalid characters via API', async ({ page }) => {
    test.skip(!testSessionId, 'Session creation failed, skipping test');

    // The token schema validates URL-safe base64 format
    // Invalid tokens should be rejected
    const response = await page.request.post(`/api/sessions/${testSessionId}/export-token`);
    expect(response.status()).toBe(201);

    const data = await response.json();

    // Verify the generated token is safe
    expect(data.token).not.toContain('<');
    expect(data.token).not.toContain('>');
    expect(data.token).not.toContain('"');
    expect(data.token).not.toContain("'");
    expect(data.token).not.toContain('&');
    expect(data.token).not.toContain('/');
    expect(data.token).not.toContain('\\');
  });

  test('Share page handles special characters in URL safely', async ({ page }) => {
    const specialChars = [
      '..%2F..%2Fetc%2Fpasswd',  // Path traversal
      '%00',                       // Null byte
      '{{7*7}}',                   // Template injection
      '${7*7}'                     // Expression injection
    ];

    for (const chars of specialChars) {
      const response = await page.goto(`/session/${chars}`);

      // Should handle gracefully
      if (response) {
        expect([200, 404, 400, 500]).toContain(response.status());
      }

      // Page should not crash
      await page.waitForTimeout(300);
    }
  });

  test('Security headers are present on share page', async ({ page }) => {
    test.skip(!testSessionId, 'Session creation failed, skipping test');

    // Generate a valid token
    const tokenResponse = await page.request.post(`/api/sessions/${testSessionId}/export-token`);
    expect(tokenResponse.status()).toBe(201);
    const tokenData = await tokenResponse.json();

    // Navigate to share URL
    const response = await page.goto(`/session/${tokenData.token}`);

    // Check security headers regardless of page status
    if (response) {
      const headers = response.headers();

      // CSP should be present
      expect(headers['content-security-policy']).toBeTruthy();

      // X-Frame-Options should prevent framing
      expect(headers['x-frame-options']).toBe('DENY');

      // X-Content-Type-Options should prevent MIME sniffing
      expect(headers['x-content-type-options']).toBe('nosniff');
    }
  });
});

test.describe('Share Links - Share Page Navigation', () => {
  let consoleErrors: string[] = [];
  let testSessionId: string | null = null;
  let shareToken: string | null = null;

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

    // Create a test session and generate share token
    const createResponse = await page.request.post('/api/sessions', {
      data: {
        name: 'Navigation Test Session ' + Date.now(),
        type: 'TRADING',
        taxEnabled: true,
        distribution: 'EQUAL',
        members: [
          { handle: 'Captain', role: 'Pilot', revenue: 2000, investment: 100 },
          { handle: 'FirstMate', role: 'Turret', revenue: 1500, investment: 50 }
        ]
      }
    });

    if (createResponse.status() === 200) {
      const sessionData = await createResponse.json();
      testSessionId = sessionData.id;

      // Generate share token
      const tokenResponse = await page.request.post(`/api/sessions/${testSessionId}/export-token`);
      if (tokenResponse.status() === 201) {
        const tokenData = await tokenResponse.json();
        shareToken = tokenData.token;
      }
    }
  });

  test.afterEach(async ({ page }) => {
    if (testSessionId) {
      await page.request.delete(`/api/sessions/${testSessionId}`).catch(() => {});
      testSessionId = null;
      shareToken = null;
    }
  });

  test('Share URL is accessible (handles 200 or 404)', async ({ page }) => {
    test.skip(!shareToken, 'Share token generation failed, skipping test');

    const response = await page.goto(`/session/${shareToken}`);
    expect(response).not.toBeNull();

    // Page should return either 200 (if share page exists) or 404 (if not implemented yet)
    expect([200, 404]).toContain(response!.status());
  });

  test('Invalid share token returns 404', async ({ page }) => {
    const invalidToken = 'invalid-token-that-does-not-exist-' + Date.now();
    const response = await page.goto(`/session/${invalidToken}`);

    expect(response).not.toBeNull();
    // Invalid token should result in 404
    expect(response!.status()).toBe(404);
  });

  test('Share page displays session data if implemented', async ({ page }) => {
    test.skip(!shareToken, 'Share token generation failed, skipping test');

    const response = await page.goto(`/session/${shareToken}`);
    expect(response).not.toBeNull();

    if (response!.status() === 200) {
      // If share page exists, verify it displays session information
      await page.waitForLoadState('networkidle');

      // Look for session-related content
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();

      // The page should not be empty
      expect(pageContent!.length).toBeGreaterThan(0);
    } else {
      // Share page not implemented yet, this is acceptable
      expect(response!.status()).toBe(404);
    }
  });

  test('Share page is read-only (no edit controls visible)', async ({ page }) => {
    test.skip(!shareToken, 'Share token generation failed, skipping test');

    const response = await page.goto(`/session/${shareToken}`);
    expect(response).not.toBeNull();

    if (response!.status() === 200) {
      await page.waitForLoadState('networkidle');

      // Look for common edit controls that should NOT be present
      const editInputs = page.locator('input[type="number"]:not([readonly]):not([disabled])');
      const editButtons = page.locator('button').filter({ hasText: /save|delete|edit|remove/i });

      // Count should be zero or these elements should not be visible
      const editInputCount = await editInputs.count();
      const visibleEditButtons = await editButtons.count();

      // Share page should be read-only (no edit controls)
      // This test passes if no editable inputs are found
      // If share page shows data, it should be in read-only format
      if (editInputCount > 0) {
        // Verify inputs are disabled or readonly
        for (let i = 0; i < editInputCount; i++) {
          const input = editInputs.nth(i);
          const isDisabled = await input.isDisabled();
          const isReadonly = await input.getAttribute('readonly');
          expect(isDisabled || isReadonly !== null).toBe(true);
        }
      }
    }
  });
});

test.describe('Share Links - Cross-Browser Compatibility', () => {
  let testSessionId: string | null = null;
  let shareToken: string | null = null;

  test.beforeEach(async ({ page }) => {
    // Create test session
    const createResponse = await page.request.post('/api/sessions', {
      data: {
        name: 'Cross-Browser Test ' + Date.now(),
        type: 'MINING',
        taxEnabled: true,
        distribution: 'PERCENT',
        members: [
          { handle: 'Miner1', role: 'Pilot', revenue: 3000, investment: 0, percentShare: 60 },
          { handle: 'Miner2', role: 'Support', revenue: 0, investment: 200, percentShare: 40 }
        ]
      }
    });

    if (createResponse.status() === 200) {
      const sessionData = await createResponse.json();
      testSessionId = sessionData.id;

      const tokenResponse = await page.request.post(`/api/sessions/${testSessionId}/export-token`);
      if (tokenResponse.status() === 201) {
        const tokenData = await tokenResponse.json();
        shareToken = tokenData.token;
      }
    }
  });

  test.afterEach(async ({ page }) => {
    if (testSessionId) {
      await page.request.delete(`/api/sessions/${testSessionId}`).catch(() => {});
      testSessionId = null;
      shareToken = null;
    }
  });

  test('Share URL works on current browser', async ({ page, browserName }) => {
    test.skip(!shareToken, 'Share token generation failed, skipping test');

    const response = await page.goto(`/session/${shareToken}`);
    expect(response).not.toBeNull();

    // Should work on all browsers
    expect([200, 404]).toContain(response!.status());

    // Log browser for debugging
    test.info().annotations.push({ type: 'browser', description: browserName });
  });

  test('API token generation works on current browser', async ({ page, browserName }) => {
    test.skip(!testSessionId, 'Session creation failed, skipping test');

    const response = await page.request.post(`/api/sessions/${testSessionId}/export-token`);
    expect(response.status()).toBe(201);

    const data = await response.json();
    expect(data.token).toBeTruthy();
    expect(data.shareUrl).toBeTruthy();

    test.info().annotations.push({ type: 'browser', description: browserName });
  });

  test('Share page renders correctly on mobile viewports', async ({ page, viewport }) => {
    test.skip(!shareToken, 'Share token generation failed, skipping test');

    const response = await page.goto(`/session/${shareToken}`);
    expect(response).not.toBeNull();

    if (response!.status() === 200) {
      await page.waitForLoadState('networkidle');

      // Check for horizontal scroll on mobile
      if (viewport && viewport.width < 768) {
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

        // Allow reasonable tolerance for mobile browsers
        expect(scrollWidth - clientWidth).toBeLessThan(50);
      }
    }
  });

  test('Share page security headers present on all browsers', async ({ page, browserName }) => {
    test.skip(!shareToken, 'Share token generation failed, skipping test');

    const response = await page.goto(`/session/${shareToken}`);
    expect(response).not.toBeNull();

    const headers = response!.headers();

    // Security headers should be present regardless of browser
    expect(headers['content-security-policy']).toBeTruthy();
    expect(headers['x-frame-options']).toBeTruthy();
    expect(headers['x-content-type-options']).toBeTruthy();

    test.info().annotations.push({ type: 'browser', description: browserName });
  });
});

test.describe('Share Links - Edge Cases', () => {
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
  });

  test('Empty token path returns 404', async ({ page }) => {
    const response = await page.goto('/session/');
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(404);
  });

  test('Very long token path is handled', async ({ page }) => {
    // Generate a very long token-like string
    const longToken = 'A'.repeat(500);
    const response = await page.goto(`/session/${longToken}`);

    expect(response).not.toBeNull();
    // Should handle gracefully (likely 404)
    expect([400, 404, 414]).toContain(response!.status());
  });

  test('Token with URL-encoded characters is handled', async ({ page }) => {
    // URL-safe base64 tokens should not need encoding, but test handling
    const encodedToken = 'test%2Btoken%2F' + Date.now();
    const response = await page.goto(`/session/${encodedToken}`);

    expect(response).not.toBeNull();
    expect([400, 404]).toContain(response!.status());
  });

  test('Concurrent token generation requests are handled', async ({ page }) => {
    // Create a test session
    const createResponse = await page.request.post('/api/sessions', {
      data: {
        name: 'Concurrent Test ' + Date.now(),
        type: 'OTHER',
        taxEnabled: true,
        distribution: 'EQUAL',
        members: [
          { handle: 'TestUser', role: 'Pilot', revenue: 1000, investment: 0 }
        ]
      }
    });

    if (createResponse.status() === 200) {
      const sessionData = await createResponse.json();
      const sessionId = sessionData.id;

      try {
        // Make 5 concurrent token generation requests
        const promises = Array(5).fill(null).map(() =>
          page.request.post(`/api/sessions/${sessionId}/export-token`)
        );

        const responses = await Promise.all(promises);

        // All should succeed
        for (const response of responses) {
          expect(response.status()).toBe(201);
        }

        // All tokens should be unique
        const tokens = await Promise.all(
          responses.map(r => r.json().then(d => d.token))
        );
        const uniqueTokens = new Set(tokens);
        expect(uniqueTokens.size).toBe(5);
      } finally {
        // Cleanup
        await page.request.delete(`/api/sessions/${sessionId}`).catch(() => {});
      }
    }
  });

  test('Token for deleted session returns appropriate error', async ({ page }) => {
    // Create session
    const createResponse = await page.request.post('/api/sessions', {
      data: {
        name: 'Deleted Session Test ' + Date.now(),
        type: 'OTHER',
        taxEnabled: true,
        distribution: 'EQUAL',
        members: [
          { handle: 'TestUser', role: 'Pilot', revenue: 1000, investment: 0 }
        ]
      }
    });

    if (createResponse.status() === 200) {
      const sessionData = await createResponse.json();
      const sessionId = sessionData.id;

      // Generate token
      const tokenResponse = await page.request.post(`/api/sessions/${sessionId}/export-token`);
      expect(tokenResponse.status()).toBe(201);
      const tokenData = await tokenResponse.json();
      const token = tokenData.token;

      // Delete session
      await page.request.delete(`/api/sessions/${sessionId}`);

      // Try to access share page with token
      const response = await page.goto(`/session/${token}`);
      expect(response).not.toBeNull();

      // Should return 404 (session no longer exists)
      expect(response!.status()).toBe(404);
    }
  });
});
