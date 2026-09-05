import { expect, test } from '@playwright/test';

test.describe('Local-only sharing boundaries', () => {
  test('session and share write APIs remain unavailable', async ({ page }) => {
    const createResponse = await page.request.post('/api/sessions', {
      data: { name: 'must-not-persist' },
    });
    expect(createResponse.status()).toBe(404);

    const exportResponse = await page.request.post(
      '/api/sessions/non-existent/export-token'
    );
    expect(exportResponse.status()).toBe(404);

    const listResponse = await page.request.get('/api/sessions');
    expect(listResponse.status()).toBe(404);
  });

  test('saving private session data keeps the URL local and share-free', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const privateName = 'Private Session ' + Date.now();
    await page.locator('input[type="text"]').first().fill(privateName);
    await page.keyboard.press('Control+KeyS');

    await expect.poll(() => page.evaluate((name) => {
      const data = localStorage.getItem('sc-payslip-sessions');
      const sessions = data ? JSON.parse(data) : [];
      return sessions.some(
        (saved: { session: { name: string } }) => saved.session.name === name
      );
    }, privateName)).toBe(true);

    await expect(page).toHaveURL(/\/$/);
    expect(page.url()).not.toContain(privateName);
    await expect(page.locator('a[href*="/share"], a[href*="/session/"]')).toHaveCount(0);
  });
});
