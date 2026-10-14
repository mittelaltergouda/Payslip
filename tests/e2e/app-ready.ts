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
