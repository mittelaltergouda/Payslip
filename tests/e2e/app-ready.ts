import { expect, type Page } from '@playwright/test';

/**
 * Waits until the editor has hydrated and read browser storage.
 *
 * `networkidle` alone is not enough on slower engines (WebKit under load):
 * input typed before hydration is overwritten by React's initial state.
 */
export async function waitForAppReady(page: Page): Promise<void> {
  await expect(page.getByRole('main', { name: 'SC Payslip', exact: true }))
    .toHaveAttribute('data-app-ready', 'true');
}

/**
 * Acknowledges the fixed storage notice like a user would. On small screens it
 * covers the bottom of the viewport and intercepts clicks on buttons there.
 */
export async function dismissStorageNotice(page: Page): Promise<void> {
  const notice = page.getByRole('region', { name: 'Cookie-Hinweis' });
  await notice.getByRole('button').first().click();
  await expect(notice).toBeHidden();
}
