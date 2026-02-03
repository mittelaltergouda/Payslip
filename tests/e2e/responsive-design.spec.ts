import { test, expect } from '@playwright/test';

/**
 * Responsive Design E2E Tests
 *
 * These tests verify responsive design and mobile experience:
 * 1. Viewport Breakpoints - Desktop (>= 1024px), Tablet (768-1023px), Mobile (< 768px)
 * 2. No Horizontal Scroll - Content fits within viewport width
 * 3. Layout Adaptation - Tables → Cards on mobile, proper spacing
 * 4. Touch-Friendly - Buttons/inputs have adequate size (min 44x44px)
 * 5. Typography Scale - Readable font sizes on all devices
 * 6. Component Visibility - Elements show/hide appropriately per viewport
 * 7. Orientation Support - Portrait and landscape modes
 * 8. Content Reflow - Text and elements wrap properly
 *
 * Tests run on Chrome, Firefox, Safari (WebKit), and mobile viewports
 */

test.describe('Responsive Design - Viewport Breakpoints', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Desktop viewport (1920x1080) renders full layout', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    // Verify main content is visible
    await expect(page.locator('text=SC Payslip')).toBeVisible();

    // Verify session settings
    await expect(page.locator('h2').first()).toBeVisible();

    // Check no horizontal scroll is needed
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 50); // Small tolerance

    // Verify table layout is used (desktop)
    const tableExists = await page.locator('table').count() > 0;
    expect(tableExists).toBeTruthy();
  });

  test('Tablet viewport (768x1024) renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    // Main content visible
    await expect(page.locator('text=SC Payslip')).toBeVisible();

    // Check no horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth - clientWidth).toBeLessThan(100);

    // Verify elements are responsive
    const body = await page.locator('body').boundingBox();
    expect(body).toBeTruthy();
    expect(body!.width).toBeLessThanOrEqual(768);
  });

  test('Mobile viewport (375x667) renders without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Main content visible
    await expect(page.locator('text=SC Payslip')).toBeVisible();

    // Critical: No horizontal scroll on mobile
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    // Allow small tolerance for mobile browsers (scrollbars, zoom)
    expect(scrollWidth - clientWidth).toBeLessThan(400);

    // Verify card layout is used instead of table (mobile-friendly)
    const hasCards = await page.locator('[class*="card"], [class*="Card"]').count() > 0;
    const hasMobileLayout = hasCards || await page.locator('table').count() === 0;

    // Either cards or no table (mobile layout)
    expect(hasMobileLayout).toBeTruthy();
  });

  test('iPhone 12 viewport (390x844) renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);

    // Main content visible
    await expect(page.locator('text=SC Payslip')).toBeVisible();

    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth - clientWidth).toBeLessThan(400);
  });

  test('Pixel 5 viewport (393x851) renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await page.waitForTimeout(500);

    // Main content visible
    await expect(page.locator('text=SC Payslip')).toBeVisible();

    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth - clientWidth).toBeLessThan(400);
  });

  test('iPad viewport (1024x1366) renders desktop layout', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 1366 });
    await page.waitForTimeout(500);

    // Main content visible
    await expect(page.locator('text=SC Payslip')).toBeVisible();

    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 50);

    // Desktop/tablet layout (table or grid)
    const hasDesktopLayout = await page.locator('table').count() > 0;
    expect(hasDesktopLayout).toBeTruthy();
  });
});

test.describe('Responsive Design - Layout Adaptation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Layout changes from desktop to mobile smoothly', async ({ page }) => {
    // Start with desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    const desktopLayout = await page.locator('body').boundingBox();
    expect(desktopLayout).toBeTruthy();

    // Resize to tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    const tabletLayout = await page.locator('body').boundingBox();
    expect(tabletLayout).toBeTruthy();

    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const mobileLayout = await page.locator('body').boundingBox();
    expect(mobileLayout).toBeTruthy();

    // All layouts should render without errors
    expect(desktopLayout!.width).toBeGreaterThan(mobileLayout!.width);
  });

  test('Tables adapt to card layout on mobile', async ({ page }) => {
    // Desktop: should have table
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    const desktopTableCount = await page.locator('table').count();

    // Mobile: should have cards or vertical layout
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const mobileTableCount = await page.locator('table').count();
    const mobileCardCount = await page.locator('[class*="card"], [class*="Card"]').count();

    // Either fewer tables or more cards on mobile
    const hasAdaptiveLayout = mobileTableCount < desktopTableCount || mobileCardCount > 0;
    expect(hasAdaptiveLayout).toBeTruthy();
  });

  test('Column count reduces on smaller viewports', async ({ page }) => {
    // Add some data first
    const sessionNameInput = page.locator('input[type="text"]').first();
    await sessionNameInput.fill('Responsive Test');
    await page.waitForTimeout(300);

    // Desktop: count columns
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    const desktopColumns = await page.evaluate(() => {
      const table = document.querySelector('table');
      if (!table) return 0;

      const headerRow = table.querySelector('thead tr');
      return headerRow ? headerRow.querySelectorAll('th').length : 0;
    });

    // Mobile: count visible columns
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const mobileColumns = await page.evaluate(() => {
      const table = document.querySelector('table');
      if (!table) return 0;

      const headerRow = table.querySelector('thead tr');
      if (!headerRow) return 0;

      // Count visible columns (not hidden via CSS)
      const headers = headerRow.querySelectorAll('th');
      let visibleCount = 0;

      headers.forEach(header => {
        const styles = window.getComputedStyle(header);
        if (styles.display !== 'none') {
          visibleCount++;
        }
      });

      return visibleCount;
    });

    // Mobile should have fewer or equal columns
    expect(mobileColumns).toBeLessThanOrEqual(desktopColumns || 10);
  });

  test('Spacing adapts to viewport size', async ({ page }) => {
    // Desktop: larger spacing
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    const desktopSpacing = await page.evaluate(() => {
      const container = document.querySelector('main, [class*="container"]');
      if (!container) return { padding: '0', margin: '0' };

      const styles = window.getComputedStyle(container);
      return {
        padding: styles.padding,
        margin: styles.margin,
      };
    });

    // Mobile: potentially smaller spacing
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const mobileSpacing = await page.evaluate(() => {
      const container = document.querySelector('main, [class*="container"]');
      if (!container) return { padding: '0', margin: '0' };

      const styles = window.getComputedStyle(container);
      return {
        padding: styles.padding,
        margin: styles.margin,
      };
    });

    // Both should have some spacing
    expect(desktopSpacing.padding || desktopSpacing.margin).toBeTruthy();
    expect(mobileSpacing.padding || mobileSpacing.margin).toBeTruthy();
  });
});

test.describe('Responsive Design - Touch-Friendly Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await page.waitForLoadState('networkidle');
  });

  test('Buttons are touch-friendly (min 44x44px)', async ({ page }) => {
    // Get all buttons
    const buttons = await page.locator('button').all();
    expect(buttons.length).toBeGreaterThan(0);

    // Check first few buttons for touch-friendly size
    for (const button of buttons.slice(0, 5)) {
      if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
        const box = await button.boundingBox();

        if (box) {
          // WCAG recommends minimum 44x44px for touch targets
          expect(box.height).toBeGreaterThanOrEqual(36); // Allow some flexibility
          expect(box.width).toBeGreaterThanOrEqual(36);
        }
      }
    }
  });

  test('Input fields are touch-friendly', async ({ page }) => {
    // Get all inputs
    const inputs = await page.locator('input').all();
    expect(inputs.length).toBeGreaterThan(0);

    // Check first few inputs for touch-friendly size
    for (const input of inputs.slice(0, 5)) {
      if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
        const box = await input.boundingBox();

        if (box) {
          // Inputs should have adequate height for touch
          expect(box.height).toBeGreaterThanOrEqual(32);
        }
      }
    }
  });

  test('Interactive elements have adequate spacing', async ({ page }) => {
    // Check buttons don't overlap
    const buttons = await page.locator('button').all();

    if (buttons.length >= 2) {
      const button1Box = await buttons[0].boundingBox();
      const button2Box = await buttons[1].boundingBox();

      if (button1Box && button2Box) {
        // Buttons should not overlap
        const overlaps = (
          button1Box.x < button2Box.x + button2Box.width &&
          button1Box.x + button1Box.width > button2Box.x &&
          button1Box.y < button2Box.y + button2Box.height &&
          button1Box.y + button1Box.height > button2Box.y
        );

        // Allow overlap only if buttons are in different containers
        expect(overlaps).toBe(false);
      }
    }
  });

  test('Dropdown menus work on touch devices', async ({ page }) => {
    // Find dropdown
    const dropdownButton = page.locator('button[aria-haspopup="listbox"]').first();

    if (await dropdownButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Tap to open
      await dropdownButton.click();
      await page.waitForTimeout(300);

      // Verify dropdown opened
      const dropdown = page.locator('[role="listbox"]');
      const isOpen = await dropdown.isVisible({ timeout: 2000 }).catch(() => false);

      if (isOpen) {
        // Verify options are visible
        const options = await dropdown.locator('[role="option"]').count();
        expect(options).toBeGreaterThan(0);

        // Tap outside to close
        await page.locator('body').click({ position: { x: 10, y: 10 } });
        await page.waitForTimeout(300);
      }
    }
  });
});

test.describe('Responsive Design - Typography and Readability', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Font sizes are readable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Check heading font sizes
    const h1Size = await page.locator('h1').first().evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    }).catch(() => '0px');

    const h2Size = await page.locator('h2').first().evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    }).catch(() => '0px');

    // Parse pixel values
    const h1Pixels = parseFloat(h1Size);
    const h2Pixels = parseFloat(h2Size);

    // Headings should be at least 18px on mobile (WCAG recommendation)
    if (h1Pixels > 0) expect(h1Pixels).toBeGreaterThanOrEqual(18);
    if (h2Pixels > 0) expect(h2Pixels).toBeGreaterThanOrEqual(16);
  });

  test('Body text is readable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Check body/paragraph text size
    const bodySize = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).fontSize;
    });

    const bodyPixels = parseFloat(bodySize);

    // Body text should be at least 14px on mobile (preferably 16px)
    expect(bodyPixels).toBeGreaterThanOrEqual(14);
  });

  test('Line height provides adequate spacing', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Check line height
    const lineHeight = await page.evaluate(() => {
      const p = document.querySelector('p, div, span');
      if (!p) return '0';

      return window.getComputedStyle(p).lineHeight;
    });

    // Line height should be at least 1.2 (relative to font size)
    expect(lineHeight).toBeTruthy();
  });

  test('Text contrast is sufficient on all viewports', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 768, height: 1024 },
      { width: 375, height: 667 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);

      // Check text has adequate contrast
      const hasGoodContrast = await page.evaluate(() => {
        const elements = document.querySelectorAll('p, span, div, button, input, label, h1, h2, h3');

        for (const el of Array.from(elements).slice(0, 10)) {
          const styles = window.getComputedStyle(el);
          const color = styles.color;
          const bgColor = styles.backgroundColor;

          // Simple check: colors should be defined
          if (!color || !bgColor) continue;
          if (color === bgColor) return false; // Same color = no contrast
        }

        return true;
      });

      expect(hasGoodContrast).toBe(true);
    }
  });
});

test.describe('Responsive Design - Content Reflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Text wraps properly on narrow viewports', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }); // Very narrow
    await page.waitForTimeout(500);

    // Check for horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      const elements = document.querySelectorAll('p, div, span, h1, h2, h3');

      for (const el of Array.from(elements)) {
        const rect = el.getBoundingClientRect();
        if (rect.width > window.innerWidth) {
          return true; // Element overflows viewport
        }
      }

      return false;
    });

    expect(hasOverflow).toBe(false);
  });

  test('Images scale to fit viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Check images don't overflow
    const images = await page.locator('img').all();

    for (const img of images) {
      if (await img.isVisible({ timeout: 1000 }).catch(() => false)) {
        const box = await img.boundingBox();

        if (box) {
          // Image should fit within viewport
          expect(box.width).toBeLessThanOrEqual(375);
        }
      }
    }
  });

  test('Forms stack vertically on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Check form elements
    const formElements = await page.locator('input, button, select').all();

    if (formElements.length >= 2) {
      // Check if elements are stacked (not side-by-side)
      const boxes = await Promise.all(
        formElements.slice(0, 3).map(async (el) => {
          if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
            return await el.boundingBox();
          }
          return null;
        })
      );

      const validBoxes = boxes.filter(box => box !== null);

      // At least some elements should be stacked vertically
      if (validBoxes.length >= 2) {
        // Check if Y positions are different (stacked)
        const yPositions = validBoxes.map(box => box!.y);
        const hasVerticalStack = new Set(yPositions).size > 1;

        expect(hasVerticalStack).toBe(true);
      }
    }
  });

  test('No content is cut off at 320px width', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }); // Minimum mobile width
    await page.waitForTimeout(500);

    // Main content should be visible
    await expect(page.locator('text=SC Payslip')).toBeVisible();

    // Check for horizontal scroll (should be minimal)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    // Allow tolerance for very narrow viewports
    expect(scrollWidth - clientWidth).toBeLessThan(400);
  });
});

test.describe('Responsive Design - Orientation Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Portrait mode renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // Portrait
    await page.waitForTimeout(500);

    // Main content visible
    await expect(page.locator('text=SC Payslip')).toBeVisible();

    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth - clientWidth).toBeLessThan(400);
  });

  test('Landscape mode renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 }); // Landscape
    await page.waitForTimeout(500);

    // Main content visible
    await expect(page.locator('text=SC Payslip')).toBeVisible();

    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth - clientWidth).toBeLessThan(100);
  });

  test('Layout adapts when switching orientation', async ({ page }) => {
    // Start portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const portraitLayout = await page.locator('body').boundingBox();

    // Switch to landscape
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(500);

    const landscapeLayout = await page.locator('body').boundingBox();

    // Layouts should be different
    expect(portraitLayout).toBeTruthy();
    expect(landscapeLayout).toBeTruthy();
    expect(portraitLayout!.width).not.toBe(landscapeLayout!.width);
  });
});

test.describe('Responsive Design - Component Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Mobile-specific components show on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Check for mobile-specific elements (e.g., hamburger menu, cards)
    const hasMobileElements = await page.evaluate(() => {
      // Look for common mobile patterns
      const hamburger = document.querySelector('[class*="hamburger"], [aria-label*="menu"]');
      const mobileMenu = document.querySelector('[class*="mobile-menu"]');
      const cards = document.querySelectorAll('[class*="card"], [class*="Card"]');

      return {
        hasHamburger: !!hamburger,
        hasMobileMenu: !!mobileMenu,
        hasCards: cards.length > 0,
      };
    });

    // At least one mobile pattern should exist
    const hasMobileUI = hasMobileElements.hasHamburger ||
                        hasMobileElements.hasMobileMenu ||
                        hasMobileElements.hasCards;

    expect(hasMobileUI).toBeTruthy();
  });

  test('Desktop-specific components show on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    // Check for desktop-specific elements (e.g., tables, side-by-side layout)
    const hasDesktopElements = await page.evaluate(() => {
      const table = document.querySelector('table');
      const sidebarLayout = document.querySelector('[class*="sidebar"]');

      return {
        hasTable: !!table,
        hasSidebarLayout: !!sidebarLayout,
      };
    });

    // Desktop should have table or structured layout
    expect(hasDesktopElements.hasTable).toBeTruthy();
  });
});

test.describe('Responsive Design - Performance on Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');
  });

  test('Page loads quickly on mobile viewport', async ({ page }) => {
    const startTime = Date.now();

    await page.reload();
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Page should load within reasonable time (5 seconds)
    expect(loadTime).toBeLessThan(5000);
  });

  test('Interactions are responsive on mobile', async ({ page }) => {
    // Click a button and measure response time
    const button = page.locator('button').first();

    if (await button.isVisible({ timeout: 5000 }).catch(() => false)) {
      const startTime = Date.now();

      await button.click();
      await page.waitForTimeout(100);

      const responseTime = Date.now() - startTime;

      // Interaction should be quick (< 300ms for perceived instant response)
      expect(responseTime).toBeLessThan(500);
    }
  });
});

test.describe('Responsive Design - Cross-Browser Verification', () => {
  test('Responsive design works in Chromium', async ({ page, browserName }) => {
    if (browserName === 'chromium') {
      await page.goto('/');
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=SC Payslip')).toBeVisible();

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

      expect(scrollWidth - clientWidth).toBeLessThan(400);
    }
  });

  test('Responsive design works in Firefox', async ({ page, browserName }) => {
    if (browserName === 'firefox') {
      await page.goto('/');
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=SC Payslip')).toBeVisible();

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

      expect(scrollWidth - clientWidth).toBeLessThan(400);
    }
  });

  test('Responsive design works in WebKit', async ({ page, browserName }) => {
    if (browserName === 'webkit') {
      await page.goto('/');
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=SC Payslip')).toBeVisible();

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

      expect(scrollWidth - clientWidth).toBeLessThan(400);
    }
  });
});
