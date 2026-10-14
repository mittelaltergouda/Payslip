import { test, expect } from '@playwright/test';

/**
 * Calculator happy-path E2E test.
 *
 * This is the canonical end-to-end smoke for the main calculator flow:
 * a user opens the tool, enters crew revenue, and sees the computed payout
 * (net profit + an equal split + a settlement transfer) rendered.
 *
 * It complements the broader, feature-by-feature coverage in
 * `session-wizard.spec.ts` with a single, tightly-asserted golden path that
 * verifies the actual calculation output — not just that "some number" shows.
 *
 * Scope: pure calculator only. The flow is fully client-side (localStorage),
 * so it does not require the database.
 *
 * Run with: `npm run test:e2e` (requires Playwright browsers installed via
 * `npx playwright install` on a supported platform).
 */

// Locale-tolerant matcher for a grouped number, e.g. "10.000" (de) or "10,000" (en).
const grouped = (n: string) => new RegExp(n.replace('.', '[.,]?'));

test.describe('Calculator - Happy Path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('computes an equal split and a settlement transfer from entered revenue', async ({
    page,
  }) => {
    // The wizard ships with two active members in EQUAL mode by default.
    // Put all 10,000 of revenue on the first member.
    const numericInputs = page.locator('input[inputmode="numeric"]');
    const count = await numericInputs.count();

    let filled = false;
    for (let i = 0; i < count; i++) {
      const input = numericInputs.nth(i);
      if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
        await input.fill('10000');
        filled = true;
        break;
      }
    }
    expect(filled, 'expected at least one visible revenue input').toBeTruthy();

    // Allow the client-side calculation to recompute.
    await page.waitForTimeout(500);

    // The results section header ("Payout") is identical in both locales.
    await expect(page.getByText(/Payout/i).first()).toBeVisible();

    // Revenue (10,000) is shown; there are no expenses or investments.
    // Visible only: the collapsed arithmetic details repeat the same numbers.
    await expect(
      page.getByText(grouped('10.000')).filter({ visible: true }).first()
    ).toBeVisible({ timeout: 5000 });

    // The 0.5 % service fee of the settlement transfer is a shared cost:
    // profit 10,000 - 25 fee = 9,975 -> 4,987.5 each. The second member gets
    // the full 4,987, the first pays 4,987 + 25 = 5,012.
    await expect(
      page.getByText(grouped('9.975')).filter({ visible: true }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText(grouped('4.987')).filter({ visible: true }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText(grouped('5.012')).filter({ visible: true }).first()
    ).toBeVisible({ timeout: 5000 });
  });
});
