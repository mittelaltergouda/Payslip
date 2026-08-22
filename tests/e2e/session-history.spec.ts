import { expect, test } from '@playwright/test';

test.describe('Local-only session routing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('/sessions redirects to the local editor', async ({ page }) => {
    await page.goto('/sessions');

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('main', { name: 'SC Payslip', exact: true })
    ).toBeVisible();
    await expect(page.locator('a[href="/sessions"]')).toHaveCount(0);
  });
});
