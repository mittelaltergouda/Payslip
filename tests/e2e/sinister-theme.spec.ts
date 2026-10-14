import { test, expect } from '@playwright/test';
import { dismissStorageNotice, waitForAppReady } from './app-ready';

test.describe('Hidden Sinister theme', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('sc-payslip-theme'));
    await page.reload();
    await waitForAppReady(page);
    await dismissStorageNotice(page);
  });

  test('stays hidden until the access code is entered, then persists', async ({ page }) => {
    const html = page.locator('html');
    const themeSwitch = page.getByRole('radiogroup', { name: 'Design' });
    await expect(themeSwitch).toHaveCount(0);
    await expect(html).not.toHaveAttribute('data-theme', 'sinister');

    const title = page.getByText('SC Payslip', { exact: true }).first();
    for (let i = 0; i < 5; i++) {
      await title.click();
    }
    const terminal = page.getByRole('dialog');
    await expect(terminal).toContainText('Sinister Terminal');

    const code = terminal.getByRole('textbox');
    await code.fill('falsch');
    await code.press('Enter');
    await expect(terminal.getByRole('alert')).toContainText('ZUGRIFF VERWEIGERT');

    await code.fill('S1NISTER');
    await code.press('Enter');
    await expect(terminal).toContainText('ZUGANG GEWÄHRT');
    await expect(terminal).toBeHidden({ timeout: 5000 });

    await expect(html).toHaveAttribute('data-theme', 'sinister');
    await expect(themeSwitch).toBeVisible();

    // The boot script (allowed by the CSP nonce) applies the theme on reload.
    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'sinister');
    await waitForAppReady(page);
    await expect(themeSwitch).toBeVisible();

    await themeSwitch.getByText('Standard').click();
    await expect(html).not.toHaveAttribute('data-theme', 'sinister');
    await page.reload();
    await waitForAppReady(page);
    await expect(html).not.toHaveAttribute('data-theme', 'sinister');
    await expect(themeSwitch).toBeVisible();
  });

  test('an unlocked user can revoke the access in the terminal', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('sc-payslip-theme', JSON.stringify({ unlocked: true, theme: 'sinister' })));
    await page.reload();
    await waitForAppReady(page);
    const html = page.locator('html');
    const themeSwitch = page.getByRole('radiogroup', { name: 'Design' });
    await expect(html).toHaveAttribute('data-theme', 'sinister');
    await expect(themeSwitch).toBeVisible();

    const title = page.getByText('SC Payslip', { exact: true }).first();
    for (let i = 0; i < 5; i++) {
      await title.click();
    }
    const terminal = page.getByRole('dialog');
    await expect(terminal).toContainText('ZUGANG AKTIV');
    await terminal.getByRole('button', { name: 'Zugang entfernen' }).click();
    await expect(terminal).toBeHidden();

    await expect(html).not.toHaveAttribute('data-theme', 'sinister');
    await expect(themeSwitch).toHaveCount(0);
    await page.reload();
    await waitForAppReady(page);
    await expect(html).not.toHaveAttribute('data-theme', 'sinister');
    await expect(themeSwitch).toHaveCount(0);
  });
});
